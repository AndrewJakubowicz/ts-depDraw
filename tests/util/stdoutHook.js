/**
 * Creates a hook to divert stdout.
 * Thank you: https://gist.github.com/pguillory/729616
 * @param {function} callback - (string, encoding, fd) => void
 */
function hook_stdout(callback) {
    var old_write = process.stdout.write

    process.stdout.write = (function(write) {
        return function(string, encoding, fd) {
            write.apply(process.stdout, arguments)
            callback(string, encoding, fd)
        }
    })(process.stdout.write)

    return function() {
        process.stdout.write = old_write;
    }
}

module.exports.hook_stdout = hook_stdout;