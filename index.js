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
const trans = new Transform({
    transform(chunk, encoding, cb) {
        //setTimeout(() => {
        cb(null, chunk);
        //}, 6000);
    }
});
const output = new PassThrough();

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

        Array.from(streams).reduce((prev, cur, i) => {

            cur.index = i;
            let next = dispatcher(cur, i + 1 === streams.size);

            prev.pipe(next);
            link.set(prev, next);

            return next;

        }, input).pipe(output);

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


pipeline.on("data", (data) => {
    console.log("pipeline output:", JSON.parse(data.toString()));
});

let counter = 0;

setInterval(() => {

    counter += 1;

    let msg = {
        uuid: randomUUID(),
        data: `[${counter}] Hello World - ${Date.now()}`
    }

    pipeline.write(JSON.stringify(msg));

}, 1500);
