const holochain_connection = holochainclient.connect();

const public_posts_retrieved = $.Deferred();
const private_posts_retrieved = $.Deferred();
const address_logged_user_retrieved = $.Deferred();
let user_data_retrieved = $.Deferred();

var user_address;

function retrieve_user_public_posts(user_address) {
    console.log("Retriving user public post");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_user_public_posts')({
            user_address: user_address
        }).then(result => public_posts_retrieved.resolve(result));
    });
}

function retrieve_user_private_posts(user_address) {
    console.log("Retriving user private post");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_user_private_posts')({
            user_address: user_address
        }).then(result => private_posts_retrieved.resolve(result));
    });
}

$('form[name="user-data-form"]').submit(function (e) {
    e.preventDefault();

    const nome = $(this).find('input[name="nome"]').val();
    const cognome = $(this).find('input[name="cognome"]').val();
    const biografia = $(this).find('textarea[name="biografia"]').val();

    console.log(nome + " " + cognome + " " + biografia);

    create_user_data(nome, cognome, biografia)
});

function retrieve_user_data(user_address) {
    console.log("Retriving user data...");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_user_data')({
            user_address: user_address
        }).then(result => {
            user_data_retrieved.resolve(result);
        });
    });
}

function create_user_data(nome, cognome, biografia) {
    console.log("Creating user data");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_user_data')({
            nome: nome,
            cognome: cognome,
            biografia: biografia
        }).then(result => {
            const utils = new Utils();
            utils.console_output(result);
            setTimeout(() => {
                location.reload();
            }, 2000);
        });
    });
}

function display_user_data(result) {
    $('#user_data').empty();
    $('#user_data_input').hide();
    $('#no_user_data').hide();
    var output = JSON.parse(result);
    if (output.Ok) {
        var user_data = output.Ok;
        console.log(user_data);
        console.log("Displaying user data...");
        $('#user_data .nome').text();
    } else {
        alert(output.Err.Internal);
    }
}

function resetPostForm() {
    $('form[name="post-form"]').find('textarea[name="post-text"]').val('');
    $('form[name="post-form"]').find('input[name="post-type"][id="public"]').prop("checked", true);
}

$(document).ready(function () {
    const utils = new Utils();
    const holobook = new Holobook();

    const user_nickname = utils.retrieve_param_from_url("user_nickname", window.location.href);
    user_address = utils.retrieve_param_from_url("user_address", window.location.href);
    const user_public_key = utils.retrieve_param_from_url("user_public_key", window.location.href);
    console.log("Profile page of: " + user_nickname + " (" + user_address + ")");
    console.log("user_public_key");
    console.log(user_public_key);

    $('.user_nickname').text(user_nickname);

    retrieve_user_data(user_address);
    $.when(user_data_retrieved).done(function (user_data) {
        const output = JSON.parse(user_data);
        if (output.Ok) {
            console.log("User data = (see below)");
            console.log(output.Ok);
            if (output.Ok.length > 0) {
                $('#user_data .nome').text(output.Ok[0].nome);
                $('#user_data .cognome').text(output.Ok[0].cognome);
                $('#user_data .biografia').text(output.Ok[0].biografia);
                $('#user_data').show();
            } else {
                $('#no_user_data').show();

                holobook.get_agent_address(holochain_connection, address_logged_user_retrieved);
                $.when(address_logged_user_retrieved).done(function (address_logged_user) {
                    console.log("address_logged_user = " + address_logged_user);
                    if (address_logged_user == user_address) {
                        $('#user_data_input').show();
                    }
                });
            }
        } else {
            console.log(output.Err.Internal);
        }
    });

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
