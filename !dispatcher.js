const { Duplex, Transform } = require("stream");

const _timeout = require("./timeout.js");

module.exports = (stream, last = false) => {

    // cleanup
    stream.unpipe();

    let start = null;
    let timeout = null;
    let input = null;
    let output = null;
    let timedout = false;

    input = new Transform({
        transform(chunk, encoding, cb) {

            timedout = false;
            start = Date.now();

            clearTimeout(timeout);

            timeout = setTimeout(() => {
                timedout = true;
                output.push(chunk);
            }, 5000);

            cb(null, chunk);

        }
    });

    output = new Transform({
        transform(chunk, encoding, cb) {

            clearTimeout(timeout);

            console.log("Duration", Date.now() - start, timedout);

            if (!timedout) {
                cb(null, chunk);
            }

        }
    });

    input.pipe(stream).pipe(output);

    return Duplex.from({
        readable: output,
        writable: input
    });

};