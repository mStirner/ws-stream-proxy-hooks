const { Duplex, PassThrough } = require("stream");


const input = new PassThrough();
const output = new PassThrough();

const pipeline = Duplex.from({
    writable: input,
    readable: output
});

input.pipe(output);


pipeline.on("data", (data) => {
    console.log("output", data);
});


pipeline.write("Hello World");