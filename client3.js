const { Transform } = require("stream");
const WebSocket = require('ws');

const ws = new WebSocket('ws://127.0.0.1:8080');

const duplex = WebSocket.createWebSocketStream(ws);


const transform = new Transform({
    transform(chunk, encoding, cb) {

        chunk = chunk.toString();

        console.log("Possible modifiecation of", chunk);

        chunk = chunk.replace(/e/gi, "3");

        this.push(chunk);

        cb();

    }
});


duplex.pipe(transform).pipe(duplex);