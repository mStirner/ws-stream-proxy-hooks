const { Transform, Duplex, Stream } = require("stream");

const colors = require("colors");

module.exports = (middleware, options = {}) => {

    middleware.unpipe();

    let input = null;
    let output = null;


    let ntimeouts = 0;

    let PENDING_MESSAGES = new Map();

    options = Object.assign({
        timeout: 3000,
        maxTimeouts: 10
    }, options);


    input = new Transform({
        transform(chunk, encoding, cb) {

            chunk = String(chunk);
            chunk = JSON.parse(chunk);

            console.log(colors.gray(`[${middleware.name}]\t[timeout-wrapper][input] received, ${String(chunk)}`));

            let timer = setTimeout(() => {

                // count up timeouts
                ntimeouts += 1;

                // overraide type argument
                // fake middleware response
                //chunk.type = "pong";

                console.log(colors.red(`[${middleware.name}]\t[timeout-wrapper] Timedout! (${ntimeouts})`));

                if (ntimeouts >= options.maxTimeouts) {

                    console.log(colors.red(`[${middleware.name}]\t[timeout-wrapper] Remove stream`));

                    // overgo middleware stream
                    // push straigh into output stream
                    output.push(JSON.stringify(chunk));

                    middleware.destroy();

                } else {

                    // overgo middleware stream
                    // push straigh into output stream
                    output.push(JSON.stringify(chunk));

                }

            }, options.timeout);

            // store pending message and wait for response
            PENDING_MESSAGES.set(chunk.uuid, timer);

            cb(null, JSON.stringify(chunk));

        }
    });


    output = new Transform({
        transform(chunk, encoding, cb) {


            chunk = String(chunk);
            chunk = JSON.parse(chunk);

            console.log(colors.gray(`[${middleware.name}]\t[timeout-wrapper][output] received, ${String(chunk)}`));
            console.log(colors.green(`[${middleware.name}]\t[timeout-wrapper][output] Done`));

            if (PENDING_MESSAGES.has(chunk.uuid)) {

                // get / & clear timer
                let timer = PENDING_MESSAGES.get(chunk.uuid);
                clearTimeout(timer);

                // remove timer from store
                PENDING_MESSAGES.delete(chunk.uuid);

            }

            cb(null, JSON.stringify(chunk));

        }
    });


    input.pipe(middleware).pipe(output);

    return Duplex.from({
        writable: input,
        readable: output
    });

};