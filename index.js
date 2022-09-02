const { PassThrough, Duplex, Transform } = require("stream");
const { randomUUID } = require("crypto");
const { fork } = require("child_process");
const { URL } = require("url");

const WebSocket = require('ws');
const colors = require("colors");


console.clear();

process.nextTick(() => {
    [
        "client1.js",
        "client2.js",
        "client3.js",
        "client4.js"
    ].forEach((file) => {

        console.log("Spawn client", file)

        fork(file, [], {
            stdio: "ignore"
        });

    });
});


const dispatcher = require("./dispatcher");
const wrapper = require("./timeout-wrapper.js");

const wss = new WebSocket.Server({
    port: 8080
});


const streams = new Set();
const input = new PassThrough();
const output = new PassThrough();


function createPipeline() {

    // necessary clenaup
    streams.forEach((key, value) => {
        key.unpipe();
        value.unpipe();
    });

    // necessary clenaup
    input.unpipe();
    output.unpipe();

    if (streams.size > 0) {

        console.log("Create pipline with participant", streams.size);

        Array.from(streams).reduce((prev, cur) => {

            let next = wrapper(cur);

            prev.pipe(next);

            return next;

        }, input).pipe(output);

    } else {

        console.log("No participants, pipe input/output");

        input.pipe(output);

    }

}

wss.on('connection', (ws, req) => {

    ws.isAlive = true;
    ws.on("pong", () => {
        ws.isAlive = true;
    });

    console.log("Stream added to link")
    let stream = WebSocket.createWebSocketStream(ws);

    // identifiy stream by url query string name property
    let uri = new URL(req.url, `http://${req.headers.host}`);
    stream.name = uri.searchParams.get("name");

    stream.on("error", (err) => {

        console.log(err)

        if (err.code === 1000) {

            console.log("code 1000, destroy/kick stream");
            //ws.terminate(1000, err);
            ws.emit("close");

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


const interval = setInterval(() => {
    wss.clients.forEach((ws) => {

        if (ws.isAlive === false) {
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();

    });
}, 4000);

wss.on('close', () => {
    clearInterval(interval);
});


function triggerWsHooks(data, cb) {

    output.once("data", (data) => {
        cb(data);
    });

    console.log();
    console.log(`pipeline input: "${String(data)}"`);

    input.write(data, () => {
        //console.log("Writen");
    });

}




let counter = 0;

function loop() {

    let start = Date.now();
    counter += 1;

    triggerWsHooks(`[${counter}] Hello World - ${Date.now()}`, (data) => {


        console.log(`pipeline output (${Date.now() - start}ms): "${String(data)}"`);
        console.log();

        setTimeout(() => {
            loop();
        }, 100);

    });

}


// creata initial pipeline
createPipeline();

// start loop 
loop();