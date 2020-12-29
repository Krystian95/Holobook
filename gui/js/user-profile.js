const holochain_connection = holochainclient.connect();

const public_posts_retrieved = $.Deferred();
const private_posts_retrieved = $.Deferred();

function retrieve_user_public_posts(user_address) {
    console.log("Retriving user public post");
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'retrieve_user_public_posts')({
            user_address: user_address
        }).then(result => public_posts_retrieved.resolve(result));
    });
}

function retrieve_user_private_posts(user_address) {
    console.log("Retriving user private post");
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'retrieve_user_private_posts')({
            user_address: user_address
        }).then(result => private_posts_retrieved.resolve(result));
    });
}

$(document).ready(function () {
    const utils = new Utils();
    const user_nickname = utils.retrieve_param_from_url("user_nickname", window.location.href);
    const user_address = utils.retrieve_param_from_url("user_address", window.location.href);
    console.log(user_nickname + ": " + user_address);

    $('#user_nickname').text(user_nickname);

    retrieve_user_public_posts(user_address);

    $.when(public_posts_retrieved).done(function (public_posts) {
        retrieve_user_private_posts(user_address);
        $.when(private_posts_retrieved).done(function (private_posts) {
            const output_public_posts = JSON.parse(public_posts);
            const output_private_posts = JSON.parse(private_posts);

            const all_posts = {Ok: []};

            $(output_public_posts.Ok).each(function( index, post ) {
                all_posts.Ok.push(post);
            });
            $(output_private_posts.Ok).each(function( index, post ) {
                all_posts.Ok.push(post);
            });

            utils.display_post(JSON.stringify(all_posts));
        });
    });
});
