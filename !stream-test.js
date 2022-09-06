const { randomUUID } = require("crypto");
const { Duplex, Transform, PassThrough, pipeline, compose } = require("stream");


const input = new PassThrough();
const output = new PassThrough();

const duplex = Duplex.from({
    readable: output,
    writable: input
});

/*
duplex.on("data", (data) => {
    console.log("duplex data", data.toString())
});

setTimeout(() => {
    output.push("data")
}, 1000);
*/


const t1 = new Transform({
    transform(chunk, enc, cb) {

        console.log("t1 input", chunk);

        setTimeout(() => {
            cb(null, chunk);
        }, 1000);

    }
});



const t2 = new Transform({
    transform(chunk, enc, cb) {

        console.log("t2 input", chunk);

        setTimeout(() => {
            cb(null, chunk);
        }, 1000);

    }
});


['close', 'drain', 'error', 'finish', //'pipe',
    'unpipe', 'close', 'data', 'end', 'error',
    'pause', 'readable', 'resume'].forEach((name) => {
        t2.on(name, (...args) => {
            console.log(`[pipeline]: ${name}`, args)
        })
    });

const t3 = new Transform({
    transform(chunk, enc, cb) {

        console.log("t3 input", chunk);

        setTimeout(() => {
            cb(null, chunk);
        }, 1000);

    }
});

const t4 = new Transform({
    transform(chunk, enc, cb) {

        console.log("t4 input", chunk);

        setTimeout(() => {
            cb(null, chunk);
        }, 1000);

    }
});

const t5 = new Transform({
    transform(chunk, enc, cb) {

        console.log("t5 input", chunk);

        setTimeout(() => {
            cb(null, chunk);
        }, 1000);

    }
});


//input.pipe(t1).pipe(t2).pipe(t3).pipe(t4).pipe(t5).pipe(output);

//compose(input, [t1, t2, t3, t4, t5], output);


// Combines two or more streams into a Duplex stream that writes to the first stream and reads from the last. 
// Each provided stream is piped into the next, using stream.pipeline. 
// If any of the streams error then all are destroyed, including the outer Duplex stream.
//input.pipe(compose([t1, t2, t3, t4, t5])).pipe(output);
/*
console.log()

let comp = pipeline([t1, t2, t3, t4], (err) => {
    console.log(err || "pipeline done")
});

comp.on("data", (chunk) => {
    console.log("comp", String(chunk), chunk);
});

t1.write("Hello World");


return;*/


const trans = new Transform({
    transform(chunk, enc, cb) {

        console.log("input");

        setTimeout(() => {
            console.log("output", chunk);
            cb(null, chunk);
        }, 10000)

    }
})

const dispatcher = require("./dispatcher")
const disp = dispatcher(trans);

disp.on("data", (data) => {
    console.log("output", data.toString(), data)
});


disp.write(JSON.stringify({
    data: "hello",
    uuid: randomUUID()
}));


return;




duplex.on("data", (data) => {
    console.log("output", data.toString());
});

let counter = 0;

let interval = setInterval(() => {

    counter += 1;

    if (counter >= 5) {
        clearInterval(interval);
    }

    console.log("write result:", duplex.write(`#${counter} - ${Date.now()}`));

}, 1000);