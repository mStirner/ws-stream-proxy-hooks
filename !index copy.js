const { PassThrough, Duplex, Transform } = require("stream");
const WebSocket = require('ws');
const { randomUUID } = require("crypto");

const dispatcher = require("./dispatcher");

const wss = new WebSocket.Server({
    port: 8080
});

const streams = new Set();
const link = new Map();

const input = new PassThrough();
const output = new PassThrough();

const trans = new Transform({
    transform(chunk, encoding, cb) {
        //setTimeout(() => {
        cb(null, chunk);
        //}, 6000);
    }
});

const pipeline = Duplex.from({
    writable: input,
    readable: output
});

function createPipeline() {

    // cleanup before creating new pipeline
    link.forEach((value, key) => {
        key.unpipe();
        value.unpipe();
    });

    input.unpipe();
    output.unpipe();

    if (streams.size > 0) {

        console.log("Create pipline with participant", streams.size);

        let middle = dispatcher(trans, true);

        Array.from(streams).reduce((prev, cur, i) => {

            cur.index = i;
            let next = dispatcher(cur, i + 1 === streams.size);

            prev.pipe(next);
            link.set(prev, next);

            return next;

        }, input).pipe(output);
        //.pipe(trans).pipe(output)?

    } else {

        console.log("No clients connected");

        input.pipe(dispatcher(trans, true)).pipe(output);

    }

}

wss.on('connection', (ws) => {

    input.unpipe();
    output.unpipe();

    console.log("Stream added to link")
    let stream = WebSocket.createWebSocketStream(ws);

    stream.on("error", (err) => {

        if (err.code === 1000) {

            ws.close(1000, err.message);

        } else {

            ws.close();

        }

        console.error("Error on websocket stream", err);

    });

    streams.add(stream);

    ws.on("close", () => {

        console.log("Stream disconnected");

        stream.unpipe();
        stream.end();
        stream.destroy();

        streams.delete(stream);

        createPipeline();

    });


    createPipeline();

});

createPipeline();


function triggerWsHooks(data, cb) {

    /*
    ['close', 'drain', 'error', 'finish', 'pipe',
        'unpipe', 'close', 'data', 'end', 'error',
        'pause', 'readable', 'resume'].forEach((name) => {
            pipeline.once(name, (...args) => {
                console.log(`[pipeline]: ${name}`, args)
            })
        });
        */

    pipeline.once("data", (data) => {

        data = data.toString();
        data = JSON.parse(data);

        console.log("piple.once.data", data)

        //if (data.type === "pong") {
        cb(null, data.data);
        //}

    });

    let msg = {
        uuid: randomUUID(),
        data
    }

    let more = pipeline.write(JSON.stringify(msg));

    console.log("more:", more)

}




let counter = 0;

function loop() {

    counter += 1;

    triggerWsHooks({
        message: `[${counter}] Hello World - ${Date.now()}`,
        type: "pong"    // fake 
    }, (err, data) => {

        console.log(err || "pipeline output:", data);

        setTimeout(() => {
            loop();
        }, 1000);

    });

}

loop();