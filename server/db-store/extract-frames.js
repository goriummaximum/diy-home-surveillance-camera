const fs = require('fs');
const common = JSON.parse(fs.readFileSync(`${__dirname  }/../common.json`));
const { Pool } = require("pg");
const Cursor = require("pg-cursor");

//change time here
const from = {
    'yyyy': '2022',
    'mm': '03',
    'dd': '20',
    'hh': '00',
    'min': '00',
    'ss': '00'
}

const to = {
    'yyyy': '2022',
    'mm': '03',
    'dd': '24',
    'hh': '23',
    'min': '59',
    'ss': '59'
}

const batch_size = 1000;

let from_unix_timestamp = new Date(`${from['yyyy']}-${from['mm']}-${from['dd']} ${from['hh']}:${from['min']}:${from['ss']}.000`).getTime();
let to_unix_timestamp = new Date(`${to['yyyy']}-${to['mm']}-${to['dd']} ${to['hh']}:${to['min']}:${to['ss']}.000`).getTime();

const db_pool = new Pool({
    user: common["PG_USERNAME"],
    password: common["PG_PASSWORD"],
    host: common["PG_HOST"],
    port: common["PG_PORT"],
    database: common["PG_DB"]
});

function cursor_read(cursor, batch_size) {
    cursor.read(batch_size, (err, rows) => {
        if (rows.length == 0) {
            console.log("finish!!!");
            cursor.close();
        }

        else {
            rows.forEach(frame => {
                fs.writeFileSync(`${dir_name}/${frame['timestamp']}.jpg`, frame['frame'], {encoding: "base64", flag: "w"});
                console.log(`'${frame['timestamp']}.jpg' saved`);
            })

            cursor_read(cursor, batch_size);
        }
    });
}

async function extract() {
    let dir_name = `${__dirname}/extract/${Date.now()}`;
    if (!fs.existsSync(dir_name)) {
        fs.mkdirSync(dir_name, { recursive: true });
        console.log(`folder created: '${dir_name}'`);
    }

    let client = await db_pool.connect();

    let cursor = await client.query(new Cursor(
        `SELECT * FROM public.frame
        WHERE "timestamp" >= $1 AND "timestamp" <= $2`,
        [from_unix_timestamp, to_unix_timestamp]
    ));

    cursor_read(cursor, batch_size);
}

extract();



