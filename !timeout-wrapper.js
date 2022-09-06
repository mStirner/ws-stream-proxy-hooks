const { Transform, Duplex, Stream } = require("stream");

const colors = require("colors");

module.exports = (middleware) => {

    middleware.unpipe();

    let input = null;
    let output = null;
    //let middleware = null;

    let timeout = null;
    let timedout = false;
    let ntimeouts = 0;

    input = new Transform({
        transform(chunk, encoding, cb) {

            console.log(colors.gray(`[${middleware.name}]\t[timeout-wrapper][input] received, ${String(chunk)}`));

            timeout = setTimeout(() => {

                // count up timeouts
                ntimeouts += 1;

                console.log(colors.red(`[${middleware.name}]\t[timeout-wrapper] Timedout! (${ntimeouts})`));

                if (ntimeouts >= 10) {

                    console.log(colors.red(`[${middleware.name}]\t[timeout-wrapper] Remove stream`));


                    timedout = true;
                    output.push(chunk);

                    middleware.destroy();

                } else {

                    timedout = true;
                    output.push(chunk);

                }

            }, 3000);

            cb(null, chunk);

        }
    });

    output = new Transform({
        transform(chunk, encoding, cb) {

            console.log(colors.gray(`[${middleware.name}]\t[timeout-wrapper][output] received, ${String(chunk)}`));

            if (!timedout) {
                clearInterval(timeout);
                cb(null, chunk);
            }

        }
    });

    /*
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
    */

    input.pipe(middleware).pipe(output);

    return Duplex.from({
        writable: input,
        readable: output
    });

};