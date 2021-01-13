if (sessionStorage.getItem("pass_phrase_utente") == null || sessionStorage.getItem("pass_phrase_utente") == 'undefined') {
    window.location.href = 'index.html';
}

const holochain_connection = holochainclient.connect();

const public_posts_retrieved = $.Deferred();
const private_posts_retrieved = $.Deferred();
const address_logged_user_retrieved = $.Deferred();
let public_user_data_retrieved = $.Deferred();
let private_user_data_retrieved = $.Deferred();
let close_friend_retrieved = $.Deferred();
let retrieve_user_profile_registered_entry_deferred = $.Deferred();
let user_is_registered_deferred = $.Deferred();

let logged_user_address;
let user_nickname;
let password_private_post;

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

async function retrieve_user_with_tag(user_address) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_user_with_tag')({
            user_address: user_address
        }).then(result => {
            retrieve_user_profile_registered_entry_deferred.resolve(result);
        });
    });
}

$('form[name="user-data-form"]').submit(function (e) {
    e.preventDefault();
    $(".loader").show();

    const utils = new Utils();

    const nome = $(this).find('input[name="nome"]').val();
    const cognome = $(this).find('input[name="cognome"]').val();
    const biografia = $(this).find('textarea[name="biografia"]').val();

    const data_nascita = $(this).find('input[name="data_nascita"]').val();
    const email = $(this).find('input[name="email"]').val();
    const cellulare = $(this).find('input[name="cellulare"]').val();

    const encrypted_data_nascita = utils.encrypt_private_post(data_nascita, password_private_post);
    const encrypted_email = utils.encrypt_private_post(email, password_private_post);
    const encrypted_cellulare = utils.encrypt_private_post(cellulare, password_private_post);

    console.log("Public data: " + nome + " " + cognome + " " + biografia);
    console.log("Private data: " + data_nascita + " " + email + " " + cellulare);
    console.log("Private data encrypted: " + encrypted_data_nascita + " " + encrypted_email + " " + encrypted_cellulare);

    create_public_user_data(nome, cognome, biografia);
    create_private_user_data(encrypted_data_nascita, encrypted_email, encrypted_cellulare);
});

function retrieve_public_user_data(user_address) {
    console.log("Retriving public user data...");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_public_user_data')({
            user_address: user_address
        }).then(result => {
            public_user_data_retrieved.resolve(result);
        });
    });
}

function retrieve_private_user_data(user_address) {
    console.log("Retriving private user data...");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_private_user_data')({
            user_address: user_address
        }).then(result => {
            private_user_data_retrieved.resolve(result);
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
            console.log(result);
            setTimeout(() => {
                location.reload();
            }, 2000);
        });
    });
}

function create_public_user_data(nome, cognome, biografia) {
    console.log("Creating public user data");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_public_user_data')({
            nome: nome,
            cognome: cognome,
            biografia: biografia
        }).then(result => {
            const utils = new Utils();
            console.log("create_public_user_data");
            utils.console_output(result);
        });
    });
}

function create_private_user_data(data_nascita, email, cellulare) {
    console.log("Creating private user data");
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_private_user_data')({
            data_nascita: data_nascita,
            email: email,
            cellulare: cellulare
        }).then(result => {
            const utils = new Utils();
            console.log("create_private_user_data");
            utils.console_output(result);
            setTimeout(() => {
                location.reload();
            }, 2000);
        });
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

$(document).ready(function () {

    const utils = new Utils();
    const holobook = new Holobook();

    user_nickname = utils.retrieve_param_from_url("user_nickname", window.location.href);
    const profile_user_address = utils.retrieve_param_from_url("user_address", window.location.href);

    console.log("Profile page of: " + user_nickname + " (" + profile_user_address + ")");

    let pass_phrase_utente = sessionStorage.getItem('pass_phrase_utente');
    console.log("pass_phrase_utente");
    console.log(pass_phrase_utente);

    let profile_user_public_key;

    retrieve_user_with_tag(profile_user_address);
    $.when(retrieve_user_profile_registered_entry_deferred).done(function (registered_user) {
        console.log("registered_user");
        console.log(registered_user);
        const output = JSON.parse(registered_user);
        if (output.Ok) {
            profile_user_public_key = output.Ok[0].user_public_key;
            console.log("profile_user_public_key");
            console.log(profile_user_public_key);
        } else {
            console.log(output.Err.Internal);
            window.location.href = 'home.html';
        }
    });

    const user_keys = utils.generate_keys(pass_phrase_utente);
    console.log("user_keys");
    console.log(user_keys);

    let user_profile_encrypted_password_private_post;

    $('.user_nickname').text(user_nickname);

    holobook.get_agent_address(holochain_connection, address_logged_user_retrieved);
    $.when(address_logged_user_retrieved).done(function (logged_user_address_temp) {
        logged_user_address = logged_user_address_temp
        console.log("logged_user_address = " + logged_user_address);

        holobook.retrieve_user_with_tag(logged_user_address, user_is_registered_deferred);
        $.when(user_is_registered_deferred).done(function (registered_user) {
            console.log("registered_user");
            console.log(registered_user);
            if (registered_user.length == 0) {
                console.log("User is not registered");
                window.location.href = 'index.html';
            }
        });

        if (logged_user_address == profile_user_address) {
            const logged_user_encrypted_password_private_post = sessionStorage.getItem("encrypted_password_private_post");
            password_private_post = utils.decrypt(logged_user_encrypted_password_private_post, user_keys);
            $("#post-form").show();
        }

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
                console.log("entry_logged_user_has_been_added_by_user_profile");
                console.log(entry_logged_user_has_been_added_by_user_profile);
                const output = JSON.parse(entry_logged_user_has_been_added_by_user_profile);
                let logged_user_has_been_added_by_user_profile = false;
                if (output.Ok.length > 0) {
                    user_profile_encrypted_password_private_post = output.Ok[0].encrypted_password_private_post;
                    logged_user_has_been_added_by_user_profile = true;
                    if (logged_user_address != profile_user_address) {
                        $("#logged_user_as_close_friend").html(user_nickname + " ti ha aggiunto come suo amico più stretto <i class='fa fa-check text-success'></i>");
                    }
                } else {
                    if (logged_user_address != profile_user_address) {
                        $("#logged_user_as_close_friend").html(user_nickname + " non ti ha aggiunto come suo amico più stretto <i class='fa fa-close text-danger'></i>");
                        $("#logged_user_as_close_friend_post_alert").html("Visualizzarai i post privati di " + user_nickname + " solo dopo che ti avrà aggiunto come amico più stretto")
                    }
                }

                retrieve_public_user_data(profile_user_address);
                $.when(public_user_data_retrieved).done(function (public_user_data) {
                    const output = JSON.parse(public_user_data);
                    if (output.Ok) {
                        console.log("User public data");
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
                        if (logged_user_address == profile_user_address) {
                            const logged_user_encrypted_password_private_post = sessionStorage.getItem("encrypted_password_private_post");
                            password_private_post = utils.decrypt(logged_user_encrypted_password_private_post, user_keys);
                        } else {
                            console.log("user_profile_encrypted_password_private_post");
                            console.log(user_profile_encrypted_password_private_post);
                            console.log("user_keys");
                            console.log(user_keys);
                            password_private_post = utils.decrypt(user_profile_encrypted_password_private_post, user_keys);
                        }

                        retrieve_private_user_data(profile_user_address);
                        $.when(private_user_data_retrieved).done(function (private_user_data) {
                            const output = JSON.parse(private_user_data);
                            if (output.Ok) {
                                console.log("User private data");
                                console.log(output.Ok);
                                if (output.Ok.length > 0) {
                                    const decrypted_data_nascita = utils.decrypt_private_post(output.Ok[0].data_nascita, password_private_post);
                                    const decrypted_cellulare = utils.decrypt_private_post(output.Ok[0].cellulare, password_private_post);
                                    const decrypted_email = utils.decrypt_private_post(output.Ok[0].email, password_private_post);
                                    $('#user_data .data_nascita').text(decrypted_data_nascita);
                                    $('#user_data .cellulare').text(decrypted_cellulare);
                                    $('#user_data .email').text(decrypted_email);
                                    $('#user_private_date').show();
                                }
                            } else {
                                console.log(output.Err.Internal);
                            }
                        });

                        retrieve_user_private_posts(profile_user_address);
                        $.when(private_posts_retrieved).done(function (private_posts) {
                            const output_private_posts = JSON.parse(private_posts);
                            if (output_private_posts.Ok.length > 0) {
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
                            $(".loader").hide();
                        });
                    } else {
                        utils.display_post(JSON.stringify(all_posts));
                        $(".loader").hide();
                    }
                });
            });
        });
    });

    $('#add-as-close-friend').click(function (e) {
        $(".loader").show();
        console.log("password_private_post");
        console.log(sessionStorage.getItem("password_private_post"));
        console.log("profile_user_public_key");
        console.log(profile_user_public_key);
        const encrypted_password_private_post = utils.encrypt(sessionStorage.getItem("password_private_post"), profile_user_public_key, user_keys);
        const relationship_logged_user_has_added_user_profile = logged_user_address + "->" + profile_user_address;
        console.log(encrypted_password_private_post);
        console.log(relationship_logged_user_has_added_user_profile);
        add_as_close_friend(encrypted_password_private_post, relationship_logged_user_has_added_user_profile);
    });
});
