var holochain_connection = holochainclient.connect();
var agent_nickname = $.Deferred();
var registered_users = $.Deferred();
var user_is_registered = $.Deferred();
var show_users = $.Deferred();

// Render functions
function show_output(result, id) {
    var el = document.getElementById(id);
    var output = JSON.parse(result);
    if (output.Ok) {
        el.textContent = output.Ok;
    } else {
        alert(output.Err.Internal);
    }
}

// Zome calls

function hello() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'hello_holo')({args: {}}).then(result =>
            show_output(result, 'output'),
        );
    });
}

function create_post() {
    const message = document.getElementById('post').value;
    const timestamp = Date.now();
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'create_post')({
            message: message,
            timestamp: timestamp,
        }).then(result => show_output(result, 'address_output'));
    });
}

function retrieve_posts() {
    var address = document.getElementById('address_in').value.trim();
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'retrieve_posts')({
            agent_address: address,
        }).then(result => display_posts(result));
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

async function retrieve_users() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'retrieve_users')({}).then(result => {
            registered_users.resolve(result);
        });
    });
}

function get_agent_id() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'get_agent_id')({}).then(result =>
            show_output(result, 'agent_id'),
        );
    });
}

async function get_agent_nickname() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'get_agent_nickname')({}).then(result => {
                var json = JSON.parse(result);
                var json_inner = JSON.parse(json.Ok);
                agent_nickname.resolve(json_inner.nick);
            }
        );
    });
}

function get_dna_hash() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'get_dna_hash')({}).then(result =>
            show_output(result, 'dna_hash'),
        );
    });
}

function display_posts(result) {
    var list = document.getElementById('posts_output');
    list.innerHTML = "";
    var output = JSON.parse(result);
    if (output.Ok) {
        var posts = output.Ok.sort((a, b) => a.timestamp - b.timestamp);
        for (post of posts) {
            var node = document.createElement("LI");
            var textnode = document.createTextNode(post.message);
            node.appendChild(textnode);
            list.appendChild(node);
        }
    } else {
        alert(output.Err.Internal);
    }
}

async function display_users(result) {
    var list = document.getElementById('users_output');
    list.innerHTML = "";
    var output = JSON.parse(result);
    if (output.Ok) {
        console.log("Displaying users...");
        var users = output.Ok.sort((a, b) => a.timestamp - b.timestamp);
        for (user of users) {
            /*console.log(user.nickname + ": " + user.user_address);*/
            var node = document.createElement("li");
            var div = document.createElement('div');
            div.innerHTML = '<a href="#!" data-user_address="' + user.user_address + '">' + user.nickname + '</a>'
            node.appendChild(div);
            list.appendChild(node);
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
    get_agent_nickname();
    $.when(agent_nickname).done(function (result_agent_nickname) {
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
