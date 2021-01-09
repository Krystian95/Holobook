function Utils() {
}

Utils.prototype.generate_random_password = function (length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789^?=)(/&%$£!*é§°ç_:;><[]@#';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

Utils.prototype.convert_timestamp_to_datetime = function (timestamp) {
    var options = {
        'weekday': 'long',
        'day': '2-digit',
        'month': 'long',
        'year': 'numeric',
        'hour12': false,
        'hourCycle': 'h24',
        'hour': '2-digit',
        'minute': '2-digit',
        'second': '2-digit'
    };
    return new Date(timestamp).toLocaleString('it-IT', options);
}

Utils.prototype.retrieve_param_from_url = function (param_name, url) {
    var url = new URL(url);
    return decodeURI(url.searchParams.get(param_name));
}

Utils.prototype.get_post_element_template = function (text, timestamp, author_nickname, type) {
    return '<div>' + text + ' (' + this.convert_timestamp_to_datetime(timestamp) + ') - ' + author_nickname + ' [' + type + ']</div>';
}

Utils.prototype.display_post = function (result) {
    console.log("Displaying posts...");
    const output = JSON.parse(result);
    if (output.Ok) {
        const posts = output.Ok.sort((a, b) => b.timestamp - a.timestamp);
        if (posts.length > 0) {
            $('#posts').empty();
            let post;
            for (post of posts) {
                var post_element = this.get_post_element_template(post.text, post.timestamp, post.author_nickname, post.post_type);
                $('#posts').append(post_element);
            }
        }
    } else {
        console.log(output.Err.Internal);
    }
}

Utils.prototype.console_output = function (result) {
    var output = JSON.parse(result);
    if (output.Ok) {
        console.log(output.Ok);
    } else {
        console.log(output.Err.Internal);
    }
}

Utils.prototype.generate_keys = function (pass_phrase) {
    const bits = 512;
    const user_keys = cryptico.generateRSAKey(pass_phrase, bits);
    return user_keys;
}

Utils.prototype.encrypt = function (message, receiver_public_key, user_keys) {
    const encryption_result = cryptico.encrypt(String(message), String(receiver_public_key), user_keys);
    console.log(encryption_result);
    return String(encryption_result.cipher);
}

Utils.prototype.decrypt = function (cipher, user_keys) {
    const decryption_result = cryptico.decrypt(String(cipher), user_keys);
    console.log(decryption_result);
    return String(decryption_result.plaintext);
}

Utils.prototype.encrypt_private_post = function (private_post, private_post_password) {
    const cipher_private_post = CryptoJS.AES.encrypt(private_post, private_post_password);
    return cipher_private_post.toString();
}

Utils.prototype.decrypt_private_post = function (cipher_private_post, private_post_password) {
    const plain_text_private_post = CryptoJS.AES.decrypt(cipher_private_post, private_post_password);
    return plain_text_private_post.toString(CryptoJS.enc.Utf8);
}

Utils.prototype.test_cryptico_cryptojs_2 = function () {

    var utils = new Utils();

    const password_alice = "a";
    const alice_user_keys = utils.generate_keys(password_alice);
    const alice_public_key = cryptico.publicKeyString(alice_user_keys);
    console.log("password_alice");
    console.log(password_alice);
    console.log("alice_user_keys");
    console.log(alice_user_keys);
    console.log("alice_public_key");
    console.log(alice_public_key);

    const password_bob = "b";
    const bob_user_keys = utils.generate_keys(password_bob);
    const bob_public_key = cryptico.publicKeyString(bob_user_keys);
    console.log("password_bob");
    console.log(password_bob);
    console.log("bob_user_keys");
    console.log(bob_user_keys);
    console.log("bob_public_key");
    console.log(bob_public_key);

    var message_from_alice_to_bob = "#NhaM§Iv7/?dO=%3GXenyV$#ABR1G=#G^yB4s5y)3?Ako@poR1Pux:DF96£B";
    console.log("message_from_alice_to_bob");
    console.log(message_from_alice_to_bob);

    var encrypted_message = utils.encrypt(message_from_alice_to_bob, bob_public_key, alice_user_keys);
    console.log("encrypted_message");
    console.log(encrypted_message);

    var decrypted_message = utils.decrypt(encrypted_message, bob_user_keys);
    console.log("decrypted_message");
    console.log(decrypted_message);
}

Utils.prototype.test_cryptico_cryptojs = function () {

    console.log(" --------------- Cryptico ---------------")

    var PassPhrase = "password_123_Matt";
    var Bits = 512;

    var MattsRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);
    var MattsPublicKeyString = cryptico.publicKeyString(MattsRSAkey);


    var PassPhrase = "password_123_Sam";
    var Bits = 512;
    var SamsRSAkey = cryptico.generateRSAKey(PassPhrase, Bits);

    var PlainText = "Io sono il testo del messaggio! Ciao :)";

    var EncryptionResult = cryptico.encrypt(PlainText, MattsPublicKeyString, SamsRSAkey);

    console.log("Sam's public key: " + cryptico.publicKeyString(SamsRSAkey));

    console.log("The encrypted message:");
    console.log(EncryptionResult.cipher);

    var DecryptionResult = cryptico.decrypt(EncryptionResult.cipher, MattsRSAkey);

    console.log("The decrypted message:");
    console.log(DecryptionResult.plaintext);

    console.log("DecryptionResult.signature: " + DecryptionResult.signature);

    console.log("The signature public key string:");
    console.log(DecryptionResult.publicKeyString);

    console.log(" --------------- Cryptico ---------------")

    console.log(" --------------- CryptoJS ---------------")

    var post_privato = "Il mio post privato! :)";
    var private_post_password = "123";

    var cipher_private_post = CryptoJS.AES.encrypt(post_privato, private_post_password);
    console.log("cipher_private_post");
    console.log(cipher_private_post.toString());

    var plain_test_private_post = CryptoJS.AES.decrypt(cipher_private_post, private_post_password);
    console.log("plain_test_private_post");
    console.log(plain_test_private_post.toString(CryptoJS.enc.Utf8));

    console.log(" --------------- CryptoJS ---------------")
}