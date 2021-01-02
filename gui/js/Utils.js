function Utils() {
}

Utils.prototype.convert_timestamp_to_datetime = function (timestamp) {
    var options = {
        'weekday': 'long',
        'day': '2-digit',
        'month': 'long',
        'year': 'numeric',
        'hour12': false,
        'hourCycle': 'h24',
        'hour': '2-digit',
        'minute': '2-digit',
        'second': '2-digit'
    };
    return new Date(timestamp).toLocaleString('it-IT', options);
}

Utils.prototype.retrieve_param_from_url = function (param_name, url) {
    var url = new URL(url);
    return url.searchParams.get(param_name);
}

Utils.prototype.get_post_element_template = function (text, timestamp, author_nickname, type) {
    return '<div>' + text + ' (' + this.convert_timestamp_to_datetime(timestamp) + ') - ' + author_nickname + ' [' + type + ']</div>';
}

Utils.prototype.display_post = function (result) {
    console.log("Displaying posts...");
    const output = JSON.parse(result);
    if (output.Ok) {
        const posts = output.Ok.sort((a, b) => b.timestamp - a.timestamp);
        if (posts.length > 0) {
            $('#posts').empty();
            let post;
            for (post of posts) {
                var post_element = this.get_post_element_template(post.text, post.timestamp, post.author_nickname, post.post_type);
                $('#posts').append(post_element);
            }
        }
    } else {
        alert(output.Err.Internal);
    }
}

Utils.prototype.console_output = function (result) {
    var output = JSON.parse(result);
    if (output.Ok) {
        console.log(output.Ok);
    } else {
        console.log(output.Err.Internal);
    }
}