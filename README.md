```js

wss.on('connection', (ws) => {

    console.log("Stream added to chain")
    let stream = WebSocket.createWebSocketStream(ws);

    streams.add(stream);


    input.unpipe();
    output.unpipe();


    ws.on("close", () => {

        // works if only single stream is connected
        // if > 1, after disconnect to message transmitted

        stream.unpipe();
        streams.delete(stream);

        stream.end();
        stream.destroy();

        if (wss.clients.size === 0) {
            input.pipe(output);
        }

        console.log("Stream disconneected")

    });


    // cleanup websocket stream chains
    // this prevents double piping
    // NOTE: This is not the issue with above problem
    chain.forEach((value, key) => {
        key.unpipe();
        value.unpipe();
    });


    let stack = Array.from(streams).reduce((prev, cur) => {
        let next = prev.pipe(cur);
        chain.set(prev, next);
        return next;
    }, input);


    stack.pipe(output);

});
```