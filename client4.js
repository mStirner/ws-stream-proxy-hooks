const { Transform } = require("stream");
const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:8080');

const duplex = WebSocket.createWebSocketStream(ws);


const transform = new Transform({
    transform(chunk, encoding, cb) {

        chunk = chunk.toString();
        chunk = JSON.parse(chunk);

        console.log("Possible modifiecation of", chunk);

        chunk.data = chunk.data.replace(/-/gi, "#");

        cb(null, JSON.stringify(chunk));

    }
});


duplex.pipe(transform).pipe(duplex);