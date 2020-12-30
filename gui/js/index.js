const holochain_connection = holochainclient.connect();

const agent_nickname_callback = $.Deferred();
let registered_users = $.Deferred();
const user_is_registered = $.Deferred();
const show_users = $.Deferred();
const user_address_retrieved = $.Deferred();
const dna_address_retrieved = $.Deferred();

let user_nickname;

// Zome calls

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
        callZome('test-instance', 'hello', 'get_agent_nickname')({}).then(result => {
                var json = JSON.parse(result);
                var json_inner = JSON.parse(json.Ok);
                agent_nickname_callback.resolve(json_inner.nick);
            }
        );
    });
}

$('form[name="post-form"]').submit(function (e) {
    e.preventDefault();

    const post_text = $(this).find('textarea[name="post-text"]').val();
    const post_type = $(this).find('input[name="post-type"]:checked').val();
    const timestamp = Date.now();

    console.log(timestamp + " " + post_type + " " + post_text + " " + user_nickname);

    if (post_type == "public") {
        create_public_post(post_text, timestamp, user_nickname);
    } else if (post_type == "private") {
        create_private_post(post_text, timestamp, user_nickname);
    }
});

function resetPostForm() {
    $('form[name="post-form"]').find('textarea[name="post-text"]').val('');
    $('form[name="post-form"]').find('input[name="post-type"][id="public"]').prop("checked", true);
}

function create_public_post(post_text, timestamp, author_nickname) {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'create_public_post')({
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
        callZome('test-instance', 'hello', 'create_private_post')({
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
        callZome('test-instance', 'hello', 'retrieve_all_public_posts')({}).then(result => {
            let utils = new Utils();
            utils.display_post(result);
        });
    });
}

async function retrieve_users() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'retrieve_users')({}).then(result => {
            registered_users.resolve(result);
        });
    });
}

async function register_me(nickname) {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'register_me')({
            nickname: nickname,
            timestamp: Date.now()
        }).then(result => {
            console.log("Registered!");
            show_users.resolve(true);
        });
    });
}

async function display_users(result) {
    $('#users_list').empty();
    var output = JSON.parse(result);
    if (output.Ok) {
        console.log("Displaying users...");
        var users = output.Ok.sort((a, b) => b.timestamp - a.timestamp);
        for (user of users) {
            /*console.log(user.nickname + ": " + user.user_address);*/
            var user_element = '<div><a href="../user-profile.html?user_address=' + user.user_address + '&user_nickname=' + user.nickname + '">' + user.nickname + '</a></div>';
            $('#users_list').append(user_element);
        }
    } else {
        alert(output.Err.Internal);
    }
}

async function set_agent_is_registered(agent_nickname, registered_users) {
    $.each(registered_users, function (index, registered_user) {
        if (registered_user.nickname == agent_nickname) {
            user_is_registered.resolve(true);
        }
    });

    user_is_registered.resolve(false);
}

$(document).ready(function () {
    retrieve_all_public_posts();

    get_agent_nickname();
    $.when(agent_nickname_callback).done(function (result_agent_nickname) {
        user_nickname = result_agent_nickname;
        $('.user_nickname').text(user_nickname);
        retrieve_users();
        $.when(registered_users).done(function (result_registered_users) {
            var result = JSON.parse(result_registered_users);
            if (result.Ok) {
                var registered_users_result = result.Ok;
                set_agent_is_registered(result_agent_nickname, registered_users_result);
                $.when(user_is_registered).done(function (result_user_is_registered) {
                    if (!result_user_is_registered) {
                        console.log(result_agent_nickname + " is not registered. Registering now...");
                        register_me(result_agent_nickname);
                    } else {
                        console.log(result_agent_nickname + " is already registered.");
                        show_users.resolve(true);
                    }

                    $.when(show_users).done(function () {
                        /*console.log("Resolved 'show_users'");*/
                        registered_users = $.Deferred();
                        retrieve_users();
                        $.when(registered_users).done(function (result_registered_users) {
                            /*console.log("Resolved 'registered_users'");*/
                            var result = JSON.parse(result_registered_users);
                            if (result.Ok) {
                                display_users(result_registered_users);
                            } else {
                                alert(output.Err.Internal);
                            }
                        });
                    });
                });
            } else {
                alert(output.Err.Internal);
            }
        });
    });
});
