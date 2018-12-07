export function check_string_field(field) {
    return (field == null || field.length == 0);
}

function format_time_part(part) {
    if (part < 10) {
        return "0" + part;
    }

    return "" + part;
}

export function format_time(seconds) {
    var hours = parseInt(seconds / (60 * 60));
    seconds = parseInt(seconds % (60 * 60));

    var minutes = parseInt(seconds / 60);
    seconds = parseInt(seconds % 60);

    if (hours > 0) {
        return format_time_part(hours) + ":" + format_time_part(minutes) + ":" + format_time_part(seconds);
    }

    return format_time_part(minutes) + ":" + format_time_part(seconds);
}