const { PassThrough, pipeline } = require("stream");
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8080
});

const streams = new Set();
const link = new Map();

const input = new PassThrough();
const output = new PassThrough();

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

    /*
    // pipline produce multiple output pipes
    // perhaps because "link" cleanup?
        pipeline(input, ...streams, output, (err) => {
            console.log(err || "PIpeline done")
        });
        */

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


output.on("readable", () => {

    let chunk = output.read();

    if (chunk) {
        console.log("pipeline output:", chunk.toString())
    }


});

let counter = 0;

setInterval(() => {
    counter += 1;
    input.write(`[${counter}] Hello World - ${Date.now()}`);
}, 5000);
