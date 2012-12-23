# Minimal File Manager

This is a minimalistic file manager written mainly in javascript. It's front
end consists of Jquery and bootstrap, the back end is a simple PHP script.

Communication is done via JSON.

## Features
 - Browse directories
 - Open files
 - Edit files (textarea)
 - Move / rename files and folders
 - Remove files and empty folders
 - Create a new folder
 - Create an empty file
 - Upload multiple files at once (HTML5)

## Install
Just put the files up on your PHP capable webserver and browse the `index.php`.
You will be able to manage the files inside the `content` folder. If you want
to use a different folder, replace the `$base_path` in `index.php` and
`BASE_PATH` in `js/fm.js`.

## Focues
I tried to find a simple file manager which can be integrated easily in a web
application. All the things I found did not fit for me, so I wrote my own one.

If you are used to Javascript, JQuery and PHP you won't have any problems
reading the code. Since this is my first javascript application there is much
room for improvement.

## License
    "THE BEER-WARE LICENSE" (Revision 42):

    <Ax.Warhawk@gmail.com> wrote this file. As long as you retain this notice you
    can do whatever you want with this stuff. If we meet some day, and you think
    this stuff is worth it, you can buy me a beer in return Alex "W4RH4WK" Hirsch

    This project is distributed in the hope that it will be useful, but WITHOUT ANY
    WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
    PARTICULAR PURPOSE.

