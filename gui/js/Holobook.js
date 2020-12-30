function Holobook() {
}

Holobook.prototype.get_agent_address = function (holochain_connection, deferred_variable) {
    holochain_connection.then(({callZome, close}) => {
        callZome('test-instance', 'hello', 'get_agent_id')({}).then(result => {
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
        callZome('test-instance', 'hello', 'get_dna_hash')({}).then(result => {
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