
if(sessionStorage.getItem("pass_phrase_utente") == null || sessionStorage.getItem("pass_phrase_utente") == 'undefined'){
    window.location.href = 'index.html';
}

const holochain_connection = holochainclient.connect();

const agent_nickname_callback = $.Deferred();
let retrieve_users_deferred = $.Deferred();
const user_address_retrieved = $.Deferred();
const dna_address_retrieved = $.Deferred();

let password_private_post;
let user_nickname;
let user_keys;

function get_agent_id() {
    const holobook = new Holobook();
    holobook.get_agent_address(holochain_connection, user_address_retrieved);
    $.when(user_address_retrieved).done(function (agent_id) {
        console.log("agent_id = " + agent_id);
        $('.user_address').text(agent_id);
    });
}

function get_dna_hash() {
    const holobook = new Holobook();
    holobook.get_dna_hash(holochain_connection, dna_address_retrieved);
    $.when(dna_address_retrieved).done(function (dna_address) {
        console.log("dna_address = " + dna_address);
        $('.dna_address').text(dna_address);
    });
}

async function get_agent_nickname() {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'get_agent_nickname')({}).then(result => {
                var json = JSON.parse(result);
                var json_inner = JSON.parse(json.Ok);
                agent_nickname_callback.resolve(json_inner.nick);
            }
        );
    });
}

$('form[name="post-form"]').submit(function (e) {
    e.preventDefault();

    $(".loader").show();

    let post_text = $(this).find('textarea[name="post-text"]').val();
    const post_type = $(this).find('input[name="post-type"]:checked').val();

    const holobook = new Holobook();
    holobook.create_post(post_text, post_type, user_nickname, password_private_post);
});

function retrieve_all_public_posts() {
    console.log("Retriving public post");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_all_public_posts')({}).then(result => {
            let utils = new Utils();
            utils.display_post(result);
        });
    });
}

async function retrieve_users() {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_users')({}).then(result => {
            retrieve_users_deferred.resolve(result);
        });
    });
}

async function display_users(result) {
    $('#users_list').empty();
    const output = JSON.parse(result);
    const utils = new Utils();
    if (output.Ok) {
        console.log("Displaying users...");
        const users = output.Ok.sort((a, b) => b.timestamp - a.timestamp);
        let user;
        let user_is_registered = false;
        for (user of users) {
            if (user_nickname == user.nickname) {
                user_is_registered = true;
                password_private_post = utils.decrypt(user.encrypted_password_private_post, user_keys);
            }
            const url = "../user-profile.html?user_address=" + encodeURI(user.user_address) + "&user_nickname=" + encodeURI(user.nickname);
            const user_element = '<p><i class="fa fa-user-circle-o text-secondary"></i> <a href="' + url + '" class="btn btn-link">' + user.nickname + '</a></p>';
            $('#users_list').append(user_element);
        }

        if(!user_is_registered){
            window.location.href = 'index.html';
        }
    } else {
        console.log(output.Err.Internal);
    }
}

$(document).ready(function () {
    const utils = new Utils();

    const pass_phrase_utente = sessionStorage.getItem("pass_phrase_utente");
    user_keys = utils.generate_keys(pass_phrase_utente);
    const user_public_key = cryptico.publicKeyString(user_keys);

    console.log("pass_phrase_utente");
    console.log(pass_phrase_utente);
    console.log("user_public_key");
    console.log(user_public_key);

    get_agent_nickname();
    $.when(agent_nickname_callback).done(function (result_agent_nickname) {
        user_nickname = result_agent_nickname;
        $('.user_nickname').text(user_nickname);
    });

    retrieve_users();
    $.when(retrieve_users_deferred).done(function (registered_users) {
        $(".loader").hide();
        const result = JSON.parse(registered_users);
        if (result.Ok) {
            display_users(registered_users);
        } else {
            console.log(output.Err.Internal);
        }
    });

    retrieve_all_public_posts();
});
