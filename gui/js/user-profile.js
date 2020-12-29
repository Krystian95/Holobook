const holochain_connection = holochainclient.connect();

function retrieve_user_public_posts(user_address) {
    console.log("Retriving user public post");
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'retrieve_user_public_posts')({
            user_address: user_address
        }).then(result => display_posts(result));
    });
}

function display_posts(result) {
    console.log("Displaying posts...");
    $('#posts').empty();
    const output = JSON.parse(result);
    if (output.Ok) {
        const posts = output.Ok.sort((a, b) => b.timestamp - a.timestamp);
        let post;
        let utils = new Utils();
        for (post of posts) {
            var post_element = '<div>' + post.text + ' (' + utils.convert_timestamp_to_datetime(post.timestamp) + ') - ' + post.author_nickname + '</div>';
            $('#posts').append(post_element);
        }
    } else {
        alert(output.Err.Internal);
    }
}

$(document).ready(function () {
    const utils = new Utils();
    const user_address = utils.retrieve_param_from_url("user_address", window.location.href);
    console.log("user_address = " + user_address);

    retrieve_user_public_posts(user_address);
});
