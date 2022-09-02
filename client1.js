const process = require("process");
const path = require("path");
const { Transform } = require("stream");
const WebSocket = require('ws');

const ws = new WebSocket(`ws://127.0.0.1:8080?name=${path.basename(__filename)}`);
const duplex = WebSocket.createWebSocketStream(ws);

console.clear();

const OBJECT_MODE = (process.argv[2] === "--object") ? true : false;


const transform = new Transform({
    transform(chunk, encoding, cb) {

        console.log("Possible modifiecation of", chunk);

        if (OBJECT_MODE) {

            chunk = chunk.toString();
            chunk = JSON.parse(chunk);

            chunk.data = chunk.data.toUpperCase();

            cb(null, JSON.stringify(chunk));

        } else {

            chunk = String(chunk).toLocaleUpperCase();
            cb(null, chunk);

        }

    }
});


duplex.pipe(transform).pipe(duplex);