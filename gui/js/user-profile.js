const holochain_connection = holochainclient.connect();

const public_posts_retrieved = $.Deferred();
const private_posts_retrieved = $.Deferred();
const address_logged_user_retrieved = $.Deferred();
let user_data_retrieved = $.Deferred();
let close_friend_retrieved = $.Deferred();

let logged_user_address;

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

function retrieve_close_friend(relationship) {
    console.log("Retriving Close friend...");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_amico_piu_stretto')({
            relationship: relationship
        }).then(result => {
            close_friend_retrieved.resolve(result);
        });
    });
}

function add_as_close_friend(encrypted_password_private_post, relationship) {
    console.log("Adding user profile as close friend...");
    /*console.log(encrypted_password_private_post);
    console.log(relationship);*/
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_amico_piu_stretto')({
            encrypted_password_private_post: encrypted_password_private_post,
            relationship: relationship
        }).then(result => {
            setTimeout(() => {
                location.reload();
            }, 2000);
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

$(document).ready(function () {

    const utils = new Utils();
    const holobook = new Holobook();

    const user_nickname = utils.retrieve_param_from_url("user_nickname", window.location.href);
    const profile_user_address = utils.retrieve_param_from_url("user_address", window.location.href);
    const user_public_key = utils.retrieve_param_from_url("user_public_key", window.location.href);
    console.log("Profile page of: " + user_nickname + " (" + profile_user_address + ")");
    console.log("user_public_key");
    console.log(user_public_key);

    const encrypted_password_private_post = sessionStorage.getItem('encrypted_password_private_post');

    const pass_phrase_utente = sessionStorage.getItem('pass_phrase_utente');
    const user_keys = utils.generate_keys(pass_phrase_utente);
    console.log("user_keys");
    console.log(user_keys);

    let user_profile_encrypted_password_private_post;

    $('.user_nickname').text(user_nickname);

    holobook.get_agent_address(holochain_connection, address_logged_user_retrieved);
    $.when(address_logged_user_retrieved).done(function (logged_user_address_temp) {
        logged_user_address = logged_user_address_temp
        console.log("logged_user_address = " + logged_user_address);

        var relationship_logged_user_has_added_user_profile = logged_user_address + "->" + profile_user_address;
        retrieve_close_friend(relationship_logged_user_has_added_user_profile);
        $.when(close_friend_retrieved).done(function (entry_logged_user_has_added_user_profile) {
            console.log("entry_logged_user_has_added_user_profile");
            console.log(entry_logged_user_has_added_user_profile);
            const output = JSON.parse(entry_logged_user_has_added_user_profile);
            if (logged_user_address == profile_user_address) {
                $('#add-as-close-friend').hide();
                $('#remove-as-close-friend').hide();
            } else if (output.Ok.length > 0) {
                $('#remove-as-close-friend').show();
            } else {
                $('#add-as-close-friend').show();
            }

            close_friend_retrieved = $.Deferred();
            const relationship_logged_user_has_been_added_by_user_profile = profile_user_address + "->" + logged_user_address;
            retrieve_close_friend(relationship_logged_user_has_been_added_by_user_profile);
            $.when(close_friend_retrieved).done(function (entry_logged_user_has_been_added_by_user_profile) {
                const output = JSON.parse(entry_logged_user_has_been_added_by_user_profile);
                let logged_user_has_been_added_by_user_profile = false;
                if (output.Ok.length > 0) {
                    user_profile_encrypted_password_private_post = output.Ok[0].encrypted_password_private_post;
                    logged_user_has_been_added_by_user_profile = true;
                }

                retrieve_user_data(profile_user_address);
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
                            if (logged_user_address == profile_user_address) {
                                $('#user_data_input').show();
                            }
                            $('#no_user_data').show();
                        }
                    } else {
                        console.log(output.Err.Internal);
                    }
                });

                retrieve_user_public_posts(profile_user_address);
                $.when(public_posts_retrieved).done(function (public_posts) {
                    const all_posts = {Ok: []};
                    const output_public_posts = JSON.parse(public_posts);
                    $(output_public_posts.Ok).each(function (index, post) {
                        all_posts.Ok.push(post);
                    });

                    if (logged_user_has_been_added_by_user_profile || logged_user_address == profile_user_address) {
                        retrieve_user_private_posts(profile_user_address);
                        $.when(private_posts_retrieved).done(function (private_posts) {
                            const output_private_posts = JSON.parse(private_posts);

                            if (output_private_posts.Ok.length > 0) {
                                let password_private_post
                                if (logged_user_address == profile_user_address) {
                                    const logged_user_encrypted_password_private_post = sessionStorage.getItem("encrypted_password_private_post");
                                    password_private_post = utils.decrypt(logged_user_encrypted_password_private_post, user_keys);
                                } else {
                                    password_private_post = utils.decrypt(user_profile_encrypted_password_private_post, user_keys);
                                }

                                console.log("password_private_post");
                                console.log(password_private_post);

                                $(output_private_posts.Ok).each(function (index, encrypted_post) {
                                    let decrypted_post = encrypted_post;

                                    console.log("encrypted private post text");
                                    console.log(decrypted_post.text);

                                    decrypted_post.text = utils.decrypt_private_post(decrypted_post.text, password_private_post);
                                    console.log(decrypted_post);
                                    all_posts.Ok.push(decrypted_post);
                                });
                            }

                            utils.display_post(JSON.stringify(all_posts));
                        });
                    } else {
                        utils.display_post(JSON.stringify(all_posts));
                    }
                });
            });
        });
    });

    $('#add-as-close-friend').click(function (e) {
        const relationship_logged_user_has_added_user_profile = logged_user_address + "->" + profile_user_address;
        add_as_close_friend(encrypted_password_private_post, relationship_logged_user_has_added_user_profile);
    });
});
