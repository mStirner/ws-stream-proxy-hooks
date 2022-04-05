const { Transform } = require("stream");
const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:8080');

const duplex = WebSocket.createWebSocketStream(ws);

let timeout = true;

process.stdin.on("data", (chunk) => {

    chunk = chunk.toString();
    timeout = (chunk == 1);

    if (timeout) {
        console.log("Timeout activated");
    } else {
        console.log("Timeout deactived");
    }

});


const transform = new Transform({
    transform(chunk, encoding, cb) {

        chunk = chunk.toString();
        chunk = JSON.parse(chunk);

        console.log("Possible modifiecation of", chunk);

        chunk.data = chunk.data.replace(/e/gi, "3")

        console.log("timeout", timeout);

        if (timeout) {
            setTimeout(() => {
                timeout = false;
                cb(null, JSON.stringify(chunk));
            }, 6000);
        } else {
            cb(null, JSON.stringify(chunk));
        }

    }
});


duplex.pipe(transform).pipe(duplex);