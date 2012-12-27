<?php

// enable debug
ini_set('display_errors', 'On');
error_reporting(E_ALL | E_STRICT);

class Fm {

    private $base_path = 'content';

    /**
     * Prints the page.
     */
    public function index() {
        echo file_get_contents('tpl.html');
    }

    /**
     * Sends a success message back in json.
     */
    private function success($msg) {
        echo json_encode(array('status' => 'ok', 'msg' => $msg));
    }

    /**
     * Sends a fail message back in json and aborts the execution.
     */
    private function error($msg, $exit=true) {
        echo json_encode(array('status' => 'fail', 'msg' => $msg));

        if ($exit)
            exit();
    }

    /**
     * Checks path for '..' and replace spaces
     */
    private function check_path(&$path) {
        if (strpos($path, '..') === true)
            $this->error('no .. allowed in path');
        else
            $path = str_replace(' ', '-', $path);
    }

    /**
     * Takes a given path and prints the content in json format.
     */
    public function browse() {
        // check path
        $this->check_path($_POST['path']);

        // concat
        $path = $this->base_path.$_POST['path'];

        $files = array();
        $folders = array();
        foreach (scandir($path) as $f) {
            if ($f == '.' || $f == '..')
                continue;

            $e = $this->get_file_info("$path/$f", array('name', 'size', 'date', 'fileperms'));

            if (is_dir("$path/$f"))
                $folders[] = array(
                    'name' => $e['name'],
                    'size' => '---',
                    'date' => date('Y-m-d H:i:s', $e['date']),
                    'perm' => $this->unix_perm_string($e['fileperms'])
                );
            else
                $files[] = array(
                    'name' => $e['name'],
                    'size' => $this->human_filesize($e['size']),
                    'date' => date('Y-m-d H:i:s', $e['date']),
                    'perm' => $this->unix_perm_string($e['fileperms'])
                );
        }

        echo json_encode(array('status' => 'ok', 'folders' => $folders, 'files' => $files));
    }

    /**
     * Creates a file / folder according to type.
     */
    public function create() {
        // check path
        $this->check_path($_POST['target']);

        // concat
        $target = $this->base_path.$_POST['target'];

        // check if target already exists
        if (file_exists($target))
            $this->error('target already exists');

        // check if dir is writeable
        if (!is_writable(pathinfo($target, PATHINFO_DIRNAME)))
            $this->error('target directory not writeable');

        if ($_POST['type'] == 'folder') {
            // create folder
            if (mkdir($target))
                $this->success('directory created');
            else
                $this->error('mkdir failed');
        } elseif ($_POST['type'] == 'file') {
            // create empty file
            if (file_put_contents($target, '') !== false)
                $this->success('file created');
            else
                $this->error('file has not been created');
        } else {
            $this->error('unknown type given');
        }
    }

    /**
     * Move file / folder from source to destination.
     */
    public function move() {
        // check paths
        $this->check_path($_POST['source']);
        $this->check_path($_POST['destination']);

        // concat
        $src = $this->base_path.$_POST['source'];
        $dst = $this->base_path.$_POST['destination'];

        // check if source exists
        if (!file_exists($src))
            $this->error('source file / folder does not exist');

        // check if destination exists
        if (file_exists($dst))
            $this->error('destination file / folder already exists');

        // check if destination path exists
        if (!file_exists(pathinfo($dst, PATHINFO_DIRNAME)))
            $this->error('destination path does not exist');

        // check if source is writable
        if (!is_writable($src))
            $this->error('source file / folder is not writable');

        // check if destination path is writable
        if (!is_writable(pathinfo($dst, PATHINFO_DIRNAME)))
            $this->error('destination path is not writable');

        // move source to destination
        if (@rename($src, $dst))
            $this->success('moved file / folder');
        else
            $this->error('file / folder was not moved');
    }

    /**
     * Removes target.
     */
    public function remove() {
        // check path
        $this->check_path($_POST['target']);

        // concat
        $target = $this->base_path.$_POST['target'];

        // check if target exists
        if (!file_exists($target))
            $this->error('target does not exist');

        // check if target is writable
        if (!is_writable($target))
            $this->error('target is not writable');

        // remove target
        if (is_dir($target))
            $result = @rmdir($target);
        else
            $result = @unlink($target);

        // check result
        if ($result)
            $this->success('target has been removed');
        else
            $this->error('target has not been removed');
    }

    /**
     * Receive uploaded files and save them at target.
     */
    public function upload() {
        // check path
        $this->check_path($_POST['path']);

        // concat
        $path = $this->base_path.$_POST['path'];

        // check if files are set
        if (!isset($_FILES['files']['name'][0]))
            $this->error('no files uploaded');

        // restructure
        $files = array();
        foreach ($_FILES['files']['name'] as $n => $v) {
            $files[$n] = array(
                'name'     => $_FILES['files']['name'][$n],
                'type'     => $_FILES['files']['type'][$n],
                'tmp_name' => $_FILES['files']['tmp_name'][$n],
                'error'    => $_FILES['files']['error'][$n],
                'size'     => $_FILES['files']['size'][$n]
            );
        }

        // check upload state
        foreach ($files as $f)
            if ($f['error'] > 0)
                $this->error($f['name'].' was not uploaded successfully');

        // replace spaces in filename
        foreach ($files as $n => $f)
            $files[$n]['name'] = str_replace(' ', '-', $f['name']);

        // check if files already exists
        foreach ($files as $f)
            if (file_exists($path.$f['name']))
                $this->error('a file named '.$f['name'].' already exists');

        // check if path is writable
        if (!is_writable($path))
            $this->error('target path is not writable');

        // move files from tmp
        foreach ($files as $f)
            if (!move_uploaded_file($f['tmp_name'], $path.$f['name']))
                $this->error('file '.$f['name'].' was not moved from tmp to destination');

        // success
        $this->success(count($files).' files have been uploaded');
    }

    /**
     * Show edit page of target.
     */
    public function edit() {
        // check path
        $this->check_path($_POST['target']);

        // concat
        $target = $this->base_path.$_POST['target'];

        // print editor ^^
        echo '<textarea>'.htmlentities(file_get_contents($target)).'</textarea>';
    }

    /**
     * Takes a file size in bytes and process a human readable filesize.
     */
    private function human_filesize($bytes, $decimals = 2) {
        $sz = 'BKMGTP';
        $factor = floor((strlen($bytes) - 1) / 3);
        return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
    }

    /**
     * Taken from php.net, this function takes an permission value and builds a 
     * human_readable unix style permission string.
     */
    private function unix_perm_string($perms) {
        if (($perms & 0xC000) == 0xC000) {
            // Socket
            $info = 's';
        } elseif (($perms & 0xA000) == 0xA000) {
            // Symbolic Link
            $info = 'l';
        } elseif (($perms & 0x8000) == 0x8000) {
            // Regular
            $info = '-';
        } elseif (($perms & 0x6000) == 0x6000) {
            // Block special
            $info = 'b';
        } elseif (($perms & 0x4000) == 0x4000) {
            // Directory
            $info = 'd';
        } elseif (($perms & 0x2000) == 0x2000) {
            // Character special
            $info = 'c';
        } elseif (($perms & 0x1000) == 0x1000) {
            // FIFO pipe
            $info = 'p';
        } else {
            // Unknown
            $info = 'u';
        }

        // Owner
        $info .= (($perms & 0x0100) ? 'r' : '-');
        $info .= (($perms & 0x0080) ? 'w' : '-');
        $info .= (($perms & 0x0040) ?
            (($perms & 0x0800) ? 's' : 'x' ) :
            (($perms & 0x0800) ? 'S' : '-'));

        // Group
        $info .= (($perms & 0x0020) ? 'r' : '-');
        $info .= (($perms & 0x0010) ? 'w' : '-');
        $info .= (($perms & 0x0008) ?
            (($perms & 0x0400) ? 's' : 'x' ) :
            (($perms & 0x0400) ? 'S' : '-'));

        // World
        $info .= (($perms & 0x0004) ? 'r' : '-');
        $info .= (($perms & 0x0002) ? 'w' : '-');
        $info .= (($perms & 0x0001) ?
            (($perms & 0x0200) ? 't' : 'x' ) :
            (($perms & 0x0200) ? 'T' : '-'));

        return $info;
    }

    /**
     * Taken from code igniter. This function returns information about a given 
     * file.
     */
    private function get_file_info($file, $returned_values = array('name', 'server_path', 'size', 'date')) {
        if ( ! file_exists($file))
        {
            return FALSE;
        }

        if (is_string($returned_values))
        {
            $returned_values = explode(',', $returned_values);
        }

        foreach ($returned_values as $key)
        {
            switch ($key)
            {
                case 'name':
                    $fileinfo['name'] = substr(strrchr($file, DIRECTORY_SEPARATOR), 1);
                    break;
                case 'server_path':
                    $fileinfo['server_path'] = $file;
                    break;
                case 'size':
                    $fileinfo['size'] = filesize($file);
                    break;
                case 'date':
                    $fileinfo['date'] = filemtime($file);
                    break;
                case 'readable':
                    $fileinfo['readable'] = is_readable($file);
                    break;
                case 'writable':
                    // There are known problems using is_weritable on IIS.  It may not be reliable - consider fileperms()
                    $fileinfo['writable'] = is_writable($file);
                    break;
                case 'executable':
                    $fileinfo['executable'] = is_executable($file);
                    break;
                case 'fileperms':
                    $fileinfo['fileperms'] = fileperms($file);
                    break;
            }
        }

        return $fileinfo;
    }
}
$fm = new Fm();

// routing
if (isset($_POST['fun']))
    $fm->$_POST['fun']();
else
    $fm->index();
?>
