const { Duplex, Transform } = require("stream");
const timeout = require("./timeout.js");

const _timeout = require("./timeout.js");

module.exports = (stream, last = false) => {

    let input = null;
    let output = null;
    let caller = null;

    let timeouts = new Set();

    stream.unpipe();

    input = new Transform({
        transform(chunk, encoding, cb) {

            chunk = chunk.toString();
            chunk = JSON.parse(chunk);

            // store bypass chunk for each received message
            let bypass = chunk;

            // problem with the timeout:
            // when the websocket stream does not answer in time
            // the whole pipeline fills
            // incoming messages here are not passed to the middleware websocket stream
            // how to signal: "wait, here is something wrong"
            // if we ran in the timeout or the middleware answeres fast engough:
            // "go ahead" give us more data
            // https://nodejs.org/dist/latest-v16.x/docs/api/stream.html#writablewritable -> set to false?
            // but feels more like a hack, is ther no buil-in way?

            console.log("<dispatcher> [%d] input:", stream.index, chunk);

            caller = _timeout(5000, (timedout, duration, [data, cb]) => {

                console.log("Timeout callback", timedout, duration)

                if (timedout) {

                    console.log("Stream timedout", stream.index);

                    bypass.type = "pong-input";

                    console.log("in timeout, timedout")
                    output.push(JSON.stringify(bypass));



                    //stream.end();

                } else {

                    console.log("in timeout, non timedout")
                    cb(null, JSON.stringify(data));

                }

                timeouts.delete(bypass.uuid);
                bypass = null;

            });

            timeouts.add(chunk.uuid);
            cb(null, JSON.stringify(chunk));

        }
    });

    output = new Transform({
        transform(chunk, encoding, cb) {

            chunk = chunk.toString();
            chunk = JSON.parse(chunk);

            chunk.type = "pong-output";

            //console.log("<dispatcher> [%d] output:", stream.index, chunk);

            if (timeouts.has(chunk.uuid)) {
                caller(chunk, cb);
            } else {
                console.log("To slow for ");
                stream.destroy();
            }

        }
    });

    input.pipe(stream).pipe(output);

    return Duplex.from({
        readable: output,
        writable: input
    });

};