function Holobook() {
}

Holobook.prototype.get_agent_address = function (holochain_connection, deferred_variable) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'get_agent_id')({}).then(result => {
                const output = JSON.parse(result);
                if (output.Ok) {
                    deferred_variable.resolve(output.Ok);
                } else {
                    deferred_variable.resolve(output.Err.Internal);
                }
            }
        );
    });
}

Holobook.prototype.get_dna_hash = function (holochain_connection, deferred_variable) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'get_dna_hash')({}).then(result => {
                var output = JSON.parse(result);
                if (output.Ok) {
                    deferred_variable.resolve(output.Ok);
                } else {
                    deferred_variable.resolve(output.Err.Internal);
                }
            }
        );
    });
}

Holobook.prototype.create_post = function (post_text, post_type, user_nickname, password_private_post) {
    const utils = new Utils();
    const timestamp = Date.now();

    console.log(timestamp + " " + post_type + " " + post_text);

    if (post_type == "public") {
        this.create_public_post(post_text, timestamp, user_nickname);
    } else if (post_type == "private") {
        console.log("password_private_post");
        console.log(password_private_post);
        post_text = utils.encrypt_private_post(post_text, password_private_post);
        console.log("post_text");
        console.log(post_text);
        this.create_private_post(post_text, timestamp, user_nickname);
    }
}

Holobook.prototype.create_public_post = function (post_text, timestamp, author_nickname) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_public_post')({
            text: post_text,
            timestamp: timestamp,
            author_nickname: author_nickname
        }).then(result => {
            console.log("Public post created");
            const utils = new Utils();
            utils.console_output(result);
            setTimeout(() => {
                location.reload();
            }, 3000);
        });
    });
}

Holobook.prototype.create_private_post = function (post_text, timestamp, author_nickname) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'create_private_post')({
            text: post_text,
            timestamp: timestamp,
            author_nickname: author_nickname
        }).then(result => {
            console.log("Private post created");
            const utils = new Utils();
            utils.console_output(result);
            setTimeout(() => {
                location.reload();
            }, 3000);
        });
    });
}


Holobook.prototype.retrieve_user_with_tag = function (user_address, deferred_variable) {
    holochain_connection.then(({callZome, close}) => {
        callZome('holobook-instance', 'holobook-main', 'retrieve_user_with_tag')({
            user_address: user_address
        }).then(result => {
            var output = JSON.parse(result);
            if (output.Ok) {
                deferred_variable.resolve(output.Ok);
            } else {
                deferred_variable.resolve(output.Err.Internal);
            }
        });
    });
}