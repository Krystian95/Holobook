function Utils() {
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
    return url.searchParams.get(param_name);
}