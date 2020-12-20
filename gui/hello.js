var holochain_connection = holochainclient.connect();

function hello() {
    holochain_connection.then(({callZome, close}) => {
        callZome(
            'test-instance',
            'hello',
            'hello_holo',
        )({args: {}}).then(result => show_output(result, 'output'));
    });
}

function show_output(result, id) {
    var el = document.getElementById(id);
    var output = JSON.parse(result);
    if (output.Ok) {
        el.textContent = output.Ok;
    } else {
        alert(output.Err.Internal);
    }
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

function register_me() {
    const timestamp = Date.now();
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'register_me')({
            timestamp: timestamp
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

function retrieve_users() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'retrieve_users')({}).then(result => display_users(result));
    });
}

function get_agent_id() {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'get_agent_id')({}).then(result =>
            show_output(result, 'agent_id'),
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

function display_users(result) {
    var list = document.getElementById('users_output');
    list.innerHTML = "";
    var output = JSON.parse(result);
    console.log(output);
    if (output.Ok) {
        var users = output.Ok.sort((a, b) => a.timestamp - b.timestamp);
        for (user of users) {
            var node = document.createElement("LI");
            var textnode = document.createTextNode(user.nickname);
            node.appendChild(textnode);
            list.appendChild(node);
        }
    } else {
        alert(output.Err.Internal);
    }
}