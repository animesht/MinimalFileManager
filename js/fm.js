var BASE_PATH = 'content';

/**
 * Add a new message to the messagebox.
 */
function show_msg(msg, type) {
    // add new alert box to msgbox
    $('div#msgbox').append(
        '<div class="alert ' + type + '">' +
        '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
        msg + '</div>'
    );
}

/**
 * Do an ajax request with provided data and register a success callback.
 */
function request(data, success) {
    $.ajax({
        url: 'index.php',
        type: 'post',
        data: data,
        cache: false,
        dataType: 'json',
        success: success,
        error: function (jqXHR, status) {
            show_msg('<strong>AJAX error:</strong> ' + status, 'alert-error');
        }
    });
}

/**
 * Do an ajax request with formdata and register a success callback.
 */
function request_formdata(formdata, success) {
    $.ajax({
        url: 'index.php',
        type: 'POST',
        data: formdata,
        cache: false,
        contentType: false,
        processData: false,
        dataType: 'json',
        success: success,
        error: function (jqXHR, status) {
            show_msg('<strong>AJAX error:</strong> ' + status, 'alert-error');
        }
    });
}

/**
 * Request folder content from server.
 */
function browse(path) {
    // set path in div
    $('div#filemanager').data('path', path);

    // set breadcrumb
    setup_breadcrumb();

    // do ajax request
    request({'fun':'browse', 'path':path}, show_content);
}

/**
 * Request folder content from server (using current path).
 */
function refresh() {
    browse($('div#filemanager').data('path'));
}

/**
 * Take browse-request response from server and create table with file listing.
 * Also register event handler for icons.
 */
function show_content(result) {
    // check result
    if (result.status != 'ok') {
        show_msg(this.msg, 'alert-error');
        return;
    }

    // clear
    $('div#filemanager').empty();

    // fill
    $.each(result.folders, function() {
        // browse folder
        var name = $('<a>').attr('href', this.name).text(this.name).click(function(event) {
            event.preventDefault();
            browse($('div#filemanager').data('path') + $(event.target).attr('href') + '/');
        });

        // actions
        var move = $('<a>').attr('href', this.name).html('<i class="icon-arrow-right"></i>').click(action_show_move_modal);
        var remove = $('<a>').attr('href', this.name).html('<i class="icon-remove"></i>').click(action_show_remove_modal);

        // row
        var row = $('<tr>');
        row.append($('<td>').append('<i class="icon-folder-close"></i> ').append(name));
        row.append($('<td>').text(this.size));
        row.append($('<td>').text(this.date));
        row.append($('<td>').text(this.perm));
        row.append($('<td style="text-align:right">').append(move, ' ', remove));
        $('div#filemanager').append(row);
    });
    $.each(result.files, function() {
        // open file
        var name = $('<a>').attr('href', BASE_PATH + $('div#filemanager').data('path') + this.name).text(this.name);

        // actions
        var edit = $('<a>').attr('href', this.name).html('<i class="icon-pencil"></i>').click(action_edit);
        var move = $('<a>').attr('href', this.name).html('<i class="icon-arrow-right"></i>').click(action_show_move_modal);
        var remove = $('<a>').attr('href', this.name).html('<i class="icon-remove"></i>').click(action_show_remove_modal);

        // row
        var row = $('<tr>');
        row.append($('<td>').append('<i class="icon-file"></i> ').append(name));
        row.append($('<td>').text(this.size));
        row.append($('<td>').text(this.date));
        row.append($('<td>').text(this.perm));
        row.append($('<td style="text-align:right">').append(edit, ' ', move, ' ', remove));
        $('div#filemanager').append(row);
    });

    // wrap table
    $('div#filemanager >').wrapAll('<table class="table table-hover table-condensed">');
}

/**
 * Fill input elements with data from DOM nodes and show the 'new-modal'.
 */
function action_show_new_modal(event) {
    // get type from event source
    var type = $(event.target).data('type');

    // set type in modal
    $('div#new-modal input#new-modal-type').val(type);

    // set path in modal
    $('div#new-modal input#new-modal-target').val($('div#filemanager').data('path'));

    // show modal
    $('div#new-modal').modal('show');
}

/**
 * Fill input elements and show 'move-modal'.
 */
function action_show_move_modal(event) {
    event.preventDefault();

    // get path
    var path = $('div#filemanager').data('path');

    // get file
    var file = $(event.target).parent().attr('href');

    // set source & destination
    $('div#move-modal input#move-modal-source').val(path + file);
    $('div#move-modal input#move-modal-destination').val(path);

    // show modal
    $('div#move-modal').modal('show');
}

/**
 * Submit a request to edit a file. (This is not done via ajax, since we want
 * to leave the file manager and receive an editor.
 */
function action_edit(event) {
    event.preventDefault();

    // get target
    var target = $('div#filemanager').data('path') + $(event.target).parent().attr('href');

    // do post request
    $('<form method="post" action="index.php" id="tmp-post-request">').append(
        $('<input name="fun" value="edit" />'),
        $('<input name="target" />').val(target)
    ).appendTo("body").submit();

    // remove form
    $('form#tmp-post-request').remove();
}

/**
 * Fill input elements with data from DOM nodes and show the 'remove-modal'.
 */
function action_show_remove_modal(event) {
    event.preventDefault();

    // get target
    var target = $('div#filemanager').data('path') + $(event.target).parent().attr('href');

    // set type
    $('div#remove-modal input#remove-modal-target').val(target);
    // show modal
    $('div#remove-modal').modal('show');
}

/**
 * Show 'upload-modal'.
 */
function action_show_upload_modal(event) {
    // show modal
    $('div#upload-modal').modal('show');
}

/**
 * Sets breadcrumb up.
 */
function setup_breadcrumb() {
    // get path
    var path = $('div#filemanager').data('path').split('/');

    // remove first and last
    path.shift();
    path.pop();

    // set root only
    $('ul#breadcrumb').html('<li><a href="/">Content</a> <span class="divider">/</span></li>');

    // add subdirs
    for (var i = 0; i < path.length; i++)
        $('ul#breadcrumb').append('<li><a href="/' + path.slice(0, i + 1).join('/') + '/">' + path[i] + '</a> <span class="divider">/</span></li>');

    // register click events
    $('ul#breadcrumb a').click(function(event) {
        event.preventDefault();
        browse($(event.target).attr('href'));
    });
}

// register modal button events
$('div#new-modal button#new-modal-submit').click(function(event) {
    // get type
    var type = $('div#new-modal input#new-modal-type').val();

    // get target
    var target = $('div#new-modal input#new-modal-target').val();

    // do request
    request({'fun':'create', 'type':type, 'target':target}, function(result) {
        show_msg(result.msg, (result.status == 'ok') ? 'alert-success' : 'alert-error');
        refresh();
    });
});
$('div#move-modal button#move-modal-submit').click(function(event) {
    // get source & destination
    var source = $('div#move-modal input#move-modal-source').val();
    var destination = $('div#move-modal input#move-modal-destination').val();

    // do request
    request({'fun':'move', 'source':source, 'destination':destination}, function(result) {
        show_msg(result.msg, (result.status == 'ok') ? 'alert-success' : 'alert-error');
        refresh();
    });
});
$('div#remove-modal button#remove-modal-submit').click(function(event) {
    // get target
    var target = $('div#remove-modal input#remove-modal-target').val();

    // do request
    request({'fun':'remove', 'target':target}, function(result) {
        show_msg(result.msg, (result.status == 'ok') ? 'alert-success' : 'alert-error');
        refresh();
    });
});
$('div#upload-modal button#upload-modal-submit').click(function(event) {
    // set path
    $('div#upload-modal form#upload input#upload-path').val($('div#filemanager').data('path'));

    // submit form in background
    request_formdata(new FormData($('div#upload-modal form#upload')[0]), function(result) {
        show_msg(result.msg, (result.status == 'ok') ? 'alert-success' : 'alert-error');
        refresh();
    });
});
$('div#upload-modal button#upload-modal-clear').click(function(event) {
    // clear selection
    $('div#upload-modal form#upload input').replaceWith($('div#upload-modal form#upload input').val('').clone(true));
});

// register tool button events
$('div#tools a#upload-file').click(action_show_upload_modal);
$('div#tools a#new-file').click(action_show_new_modal);
$('div#tools a#new-folder').click(action_show_new_modal);
$('div#tools a#clear-msgbox').click(function(event) {$('div#msgbox').empty();});

// invoke browse once
browse('/');
