var BASE_PATH = 'content';

/**
 * Add a new message to the messagebox.
 */
function add_msg(msg, type) {
    $('div#msgbox').append(
        $('<div />').addClass('alert').addClass(type).append(
            '<a class="close" data-dismiss="alert">&times;</a>',
            msg
        )
    );
}

/**
 * Add message with error context.
 */
function err_msg(msg, context) {
    add_msg('<strong>' + context + ' error:</strong> ' + msg, 'alert-error');
}

/**
 * Add json result.
 */
function add_result(result) {
    // add msg
    add_msg(result.msg, (result.status == 'ok') ? 'alert-success' : 'alert-error');

    // reload fm
    refresh();
}

/**
 * Do an ajax request with data (default: json) + register success callback.
 * Allows to use formdata.
 */
function request(data, success, isFormData) {
    // set default options
    var options = {
        url: 'index.php',
        type: 'POST',
        data: data,
        cache: false,
        dataType: 'json',
        success: success,
        error: function (jqXHR, status) {err_msg(status, 'AJAX');}
    }

    // set options for formdata
    if (isFormData === true) {
        options.contentType = false;
        options.processData = false;
    }

    // do request
    $.ajax(options);
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
        err_msg(result.msg, 'PHP');
        return;
    }

    // clear
    $('div#filemanager').empty();

    // fill
    $.each(result.folders, function() {
        // browse folder
        var name = $('<a />').attr('href', this.name).text(this.name).click(function(event) {
            event.preventDefault();
            browse($('div#filemanager').data('path') + $(event.target).attr('href') + '/');
        });

        // actions
        var move = $('<a />').attr('href', this.name).html('<i class="icon-arrow-right"></i>').click(action_show_move_modal);
        var remove = $('<a />').attr('href', this.name).html('<i class="icon-remove"></i>').click(action_show_remove_modal);

        // row
        $('div#filemanager').append(
            $('<tr />').append(
                $('<td />').append('<i class="icon-folder-close"></i> ').append(name),
                $('<td />').text(this.size),
                $('<td />').text(this.date),
                $('<td />').text(this.perm),
                $('<td style="text-align:right" />').append(move, ' ', remove)
            )
        );
    });
    $.each(result.files, function() {
        // open file
        var name = $('<a />').attr('href', BASE_PATH + $('div#filemanager').data('path') + this.name).text(this.name);

        // actions
        var edit = $('<a />').attr('href', this.name).html('<i class="icon-pencil"></i>').click(action_edit);
        var move = $('<a />').attr('href', this.name).html('<i class="icon-arrow-right"></i>').click(action_show_move_modal);
        var remove = $('<a />').attr('href', this.name).html('<i class="icon-remove"></i>').click(action_show_remove_modal);

        // row
        $('div#filemanager').append(
            $('<tr />').append(
                $('<td />').append('<i class="icon-file"></i> ').append(name),
                $('<td />').text(this.size),
                $('<td />').text(this.date),
                $('<td />').text(this.perm),
                $('<td style="text-align:right">').append(edit, ' ', move, ' ', remove)
            )
        );
    });

    // wrap table
    $('div#filemanager >').wrapAll('<table class="table table-hover table-condensed" />');
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
    for (var i = 0; i < path.length; i++) {
        $('ul#breadcrumb').append(
            $('<li />').append(
                $('<a />').attr('href', '/' + path.slice(0, i + 1).join('/') + '/').text(path[i]),
                $('<span />').addClass('divider').text('/')
            )
        );
    }

    // register click events
    $('ul#breadcrumb a').click(function(event) {
        event.preventDefault();
        browse($(event.target).attr('href'));
    });
}

/**
 * Fill input elements with data from DOM nodes and show the 'new-modal'.
 */
function action_show_new_modal(event) {
    event.preventDefault();

    // set type
    $('div#new input#new-type').val($(event.target).data('type'));

    // set path
    $('div#new input#new-target').val($('div#filemanager').data('path'));

    // show modal
    $('div#new').modal('show');
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
    $('div#move input#move-source').val(path + file);
    $('div#move input#move-destination').val(path);

    // show modal
    $('div#move').modal('show');
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
    var form = $('<form method="post" action="index.php" />').append(
        $('<input name="fun" />').val('edit'),
        $('<input name="target" />').val(target)
    ).appendTo("body");

    // submit
    form.submit();

    // remove form
    form.remove();
}

/**
 * Fill input elements with data from DOM nodes and show the 'remove-modal'.
 */
function action_show_remove_modal(event) {
    event.preventDefault();

    // get target
    var target = $('div#filemanager').data('path') + $(event.target).parent().attr('href');

    // set type
    $('div#remove input#remove-target').val(target);

    // show modal
    $('div#remove').modal('show');
}

/**
 * Show 'upload-modal'.
 */
function action_show_upload_modal(event) {
    // set path
    $('div#upload input#upload-path').val($('div#filemanager').data('path'));

    // show modal
    $('div#upload').modal('show');
}

// register modal buttons
$('div#new a.submit').click(function(event) {
    request(
        {
            'fun'   : 'create',
            'type'  : $('div#new input#new-type').val(),
            'target': $('div#new input#new-target').val()
        },
        add_result
    );
});
$('div#move a.submit').click(function(event) {
    request(
        {
            'fun'        : 'move',
            'source'     : $('div#move input#move-source').val(),
            'destination': $('div#move input#move-destination').val()
        },
        add_result
    );
});
$('div#remove a.submit').click(function(event) {
    request(
        {
            'fun'   : 'remove',
            'target': $('div#remove input#remove-target').val()
        },
        add_result
    );
});
$('div#upload a.submit').click(function(event) {
    // submit form in background
    request(
        new FormData($('div#upload form')[0]),
        msgbox.add_result,
        true
    );
});

// clear upload modal on hide
$('div#upload').on('hide', function(event) {
    // clear input
    $('div#upload input').replaceWith($('div#upload input').val('').clone(true));
});

// register tool button events
$('div#tools a#upload-button').click(action_show_upload_modal);
$('div#tools a#new-file-button').click(action_show_new_modal);
$('div#tools a#new-folder-button').click(action_show_new_modal);
$('div#tools a#clear-msgbox-button').click(function(event) {$('div#msgbox').empty();});

// invoke browse once
browse('/');
