const { Duplex, Transform } = require("stream");

const _timeout = require("./timeout.js");

module.exports = (stream, last = false) => {

    let input = null;
    let output = null;
    let caller = null;
    let bypass = null; // wird immer wieder bei neuen input überschrieben und taug nicht
    // müsste an eine message id geknüpft werden

    let timeouts = new Map();

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

            console.log("[%d] input:", stream.index, chunk);

            caller = _timeout(5000, (timedout, duration, [data, cb]) => {
                if (timedout) {

                    console.log("Stream timedout", stream.index);

                    //bypass.type = "pong";
                    output.push(JSON.stringify(bypass));
                    bypass = null;
                    //timeouts.delete(chunk.uuid)

                    //stream.destroy();
                    //let err = new Error("TIMEDOUT");
                    //err.code = 1000;

                    //stream.emit("error", err);                    
                    //stream.destroy();

                    //stream.end();

                } else {

                    cb(null, JSON.stringify(data));

                }
            });

            //timeouts.set(chunk.uuid, chunk);
            cb(null, JSON.stringify(chunk));

        }
    });

    output = new Transform({
        transform(chunk, encoding, cb) {

            chunk = chunk.toString();
            chunk = JSON.parse(chunk);

            console.log("[%d] output:", stream.index, chunk);

            caller(chunk, cb);

        }
    });

    input.pipe(stream).pipe(output);

    return Duplex.from({
        readable: output,
        writable: input
    });

};