const { Transform } = require("stream");

let input = null;
let output = null;
let middleware = null;

let timeout = null;
let timedout = false;

input = new Transform({
    transform(chunk, encoding, cb) {

        console.log("[dispatcher][input] received", chunk);

        timeout = setTimeout(() => {

            console.log("Timedout!");

            timedout = true;
            output.push(chunk);

        }, 5000);

        cb(null, chunk);

    }
});

output = new Transform({
    transform(chunk, encoding, cb) {

        console.log("[dispatcher][output] received", chunk);

        if (!timedout) {
            clearInterval(timeout);
            cb(null, chunk);
        }

    }
});

middleware = new Transform({
    transform(chunk, encoding, cb) {

        console.log("[middleware] Do something with data", chunk);

        // fake some time consuption
        setTimeout(() => {

            console.log("[middleware] Timeout after 5.5s, continue");
            cb(null, chunk);

        }, 5500);

    }
});

input.pipe(middleware).pipe(output);





// -------

const loop = () => {

    let start = Date.now();

    output.once("data", (chunk) => {

        console.log(`[output] ${Date.now() - start}`, chunk);
        console.log();

        setTimeout(loop, 1000);

    });

    let msg = `Hello - ${Date.now()}`

    console.log(`[input] ${msg}`)
    input.write(msg);

};

loop();