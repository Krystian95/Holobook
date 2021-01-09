const holochain_connection = holochainclient.connect();

const user_registered_deferred = $.Deferred();
const user_address_retrieved = $.Deferred();
const user_is_registered_deferred = $.Deferred();
let agent_nickname;

// Zome calls

async function get_agent_nickname() {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'get_agent_nickname')({}).then(result => {
                var json = JSON.parse(result);
                var json_inner = JSON.parse(json.Ok);
                agent_nickname = json_inner.nick;
                console.log(agent_nickname);
            }
        );
    });
}

async function register_me(nickname, user_public_key, encrypted_password_private_post, agent_address) {
    console.log("Registering " + nickname + "...");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'register_me')({
            nickname: nickname,
            user_public_key: user_public_key,
            encrypted_password_private_post: encrypted_password_private_post,
            timestamp: Date.now(),
            agent_address: agent_address
        }).then(result => {
            user_registered_deferred.resolve(result);
        });
    });
}

async function retrieve_user_with_tag(user_address) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_user_with_tag')({
            user_address: user_address
        }).then(result => {
            user_is_registered_deferred.resolve(result);
        });
    });
}

$(document).ready(function () {
    const utils = new Utils();
    const password_private_post = utils.generate_random_password(60);

    const holobook = new Holobook();
    let agent_address;
    let user_is_registered = false;

    holobook.get_agent_address(holochain_connection, user_address_retrieved);
    $.when(user_address_retrieved).done(function (agent_id) {
        console.log("agent_id = " + agent_id);
        agent_address = agent_id;

        retrieve_user_with_tag(agent_address);
        $.when(user_is_registered_deferred).done(function (registered_user) {
            console.log(registered_user);
            const output = JSON.parse(registered_user);
            if (output.Ok) {
                if (output.Ok.length > 0) {
                    user_is_registered = true;
                    console.log("User already registered");
                } else {
                    console.log("User is not registered");
                }
            } else {
                console.log(registered_user);
            }
        });

        $(".loader").hide();
    });

    $('form[name="login-form"]').submit(function (e) {
        e.preventDefault();

        $(".loader").show();

        const pass_phrase_utente = $(this).find('input[name="password"]').val();
        sessionStorage.setItem("pass_phrase_utente", pass_phrase_utente);
        console.log(pass_phrase_utente);


        const user_keys = utils.generate_keys(pass_phrase_utente);
        const user_public_key = cryptico.publicKeyString(user_keys);
        console.log("user_public_key");
        console.log(user_public_key);

        const encrypted_password_private_post = utils.encrypt(password_private_post, user_public_key, user_keys);
        sessionStorage.setItem("password_private_post", password_private_post);
        sessionStorage.setItem("encrypted_password_private_post", encrypted_password_private_post);
        console.log("password_private_post");
        console.log(password_private_post);
        console.log("encrypted_password_private_post");
        console.log(encrypted_password_private_post);

        if (user_is_registered) {
            console.log("Registration skipped");
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 2000);
        } else {
            register_me(agent_nickname, user_public_key, encrypted_password_private_post, agent_address);
            $.when(user_registered_deferred).done(function (registered_user) {
                const output = JSON.parse(registered_user);
                if (output.Ok) {
                    console.log("Registration succesfully!");
                    console.log("Entry registered_user address: " + output.Ok);
                    setTimeout(() => {
                        window.location.href = 'home.html';
                    }, 2000);
                } else {
                    console.log(registered_user)
                    location.reload();
                }
            });
        }
    });
});
