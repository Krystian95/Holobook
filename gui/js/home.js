
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

    const utils = new Utils();

    let post_text = $(this).find('textarea[name="post-text"]').val();
    const post_type = $(this).find('input[name="post-type"]:checked').val();
    const timestamp = Date.now();

    console.log(timestamp + " " + post_type + " " + post_text + " " + user_nickname);

    if (post_type == "public") {
        create_public_post(post_text, timestamp, user_nickname);
    } else if (post_type == "private") {
        console.log("password_private_post");
        console.log(password_private_post);
        post_text = utils.encrypt_private_post(post_text, password_private_post);
        console.log("post_text");
        console.log(post_text);
        create_private_post(post_text, timestamp, user_nickname);
    }
});

function resetPostForm() {
    $('form[name="post-form"]').find('textarea[name="post-text"]').val('');
    $('form[name="post-form"]').find('input[name="post-type"][id="public"]').prop("checked", true);
}

function create_public_post(post_text, timestamp, author_nickname) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_public_post')({
            text: post_text,
            timestamp: timestamp,
            author_nickname: author_nickname
        }).then(result => {
            console.log("Public post created");
            const utils = new Utils();
            utils.console_output(result);
            resetPostForm();
            setTimeout(() => {
                retrieve_all_public_posts();
            }, 3000);
        });
    });
}

function create_private_post(post_text, timestamp, author_nickname) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_private_post')({
            text: post_text,
            timestamp: timestamp,
            author_nickname: author_nickname
        }).then(result => {
            console.log("Private post created");
            const utils = new Utils();
            utils.console_output(result);
            resetPostForm();
        });
    });
}

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
            const user_element = '<div><a href="' + url + '">' + user.nickname + '</a></div>';
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
        const result = JSON.parse(registered_users);
        if (result.Ok) {
            display_users(registered_users);
            console.log("password_private_post");
            console.log(password_private_post);
            console.log("encrypted_password_private_post");
            console.log(sessionStorage.getItem("encrypted_password_private_post"));

            /*const bob_public_key = "YRMBz5PIp6Mea38dVsgwVswKz5vH+cfZZ+m3XK73o3EUiMmcWYsZtyMGxVfrqHIPhlWESIUkmou/Ci9ADCvVvw==";
            const alice_password_private_post = "[?@yP404SzB85MEzvK>;e5qcaS>wxtJfaéx%:TlpFl4co#*7thBWsIOZefI^";
            console.log("alice_password_private_post encrypted for bob");
            console.log(utils.encrypt(alice_password_private_post, bob_public_key, user_keys));*/

            const encrypted_alice_password_private_post = "SlTJSXWazbuIz6OeIbtY8DrsHsbmjxo9u9cSqseg9cqC557FfCY5RE2Gysh4qWx7IhSQK6JTCBK3A6ptllK/?I3a82DqyJhg9L1GlVDs1TVQ3VKFruf6Y4s3Q6tHJHB2C3Aa25MuD+85+Qp8yXJzmhksXXOhenn8JEey0BNSnckOOmmFcng/khtLKnHQ5TNE=";
            console.log("alice_password_private_post plain for bob");
            console.log(utils.decrypt(encrypted_alice_password_private_post, user_keys));
        } else {
            console.log(output.Err.Internal);
        }
    });

    retrieve_all_public_posts();

    setTimeout(() => {
        utils.test_cryptico_cryptojs_2();
    }, 5000);

});
