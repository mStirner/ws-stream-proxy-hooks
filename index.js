const { PassThrough, Duplex } = require("stream");
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8080
});

const streams = new Set();
const link = new Map();

const input = new PassThrough();
const output = new PassThrough();

const pipeline = Duplex.from({
    writable: input,
    readable: output
});

if (wss.clients.size === 0) {
    input.pipe(output);
}


function createPipeline() {

    // cleanup before creating new pipeline
    link.forEach((value, key) => {
        key.unpipe();
        value.unpipe();
    });


    console.log("Create pipline with participant", streams.size);
    let stack = Array.from(streams).reduce((prev, cur) => {
        let next = prev.pipe(cur);
        link.set(prev, next);
        return next;
    }, input);
    stack.pipe(output);


}

wss.on('connection', (ws) => {

    input.unpipe();
    output.unpipe();

    console.log("Stream added to link")
    let stream = WebSocket.createWebSocketStream(ws);

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


pipeline.on("data", (data) => {
    console.log("pipeline output:", data.toString());
});

let counter = 0;

setInterval(() => {
    counter += 1;
    pipeline.write(`[${counter}] Hello World - ${Date.now()}`);
}, 1000);
