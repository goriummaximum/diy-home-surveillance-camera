const fs = require('fs');
const common = JSON.parse(fs.readFileSync(`${__dirname  }/../common.json`));
const {Pool} = require("pg");

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

const db_pool = new Pool({
    user: common["PG_USERNAME"],
    password: common["PG_PASSWORD"],
    host: common["PG_HOST"],
    port: common["PG_PORT"],
    database: common["PG_DB"]
});

function extract(from_yyyy, from_mm, from_dd, from_hh, from_min, from_ss, to_yyyy, to_mm, to_dd, to_hh, to_min, to_ss) {
    let from = new Date(`${from_yyyy}-${from_mm}-${from_dd} ${from_hh}:${from_min}:${from_ss}.000`).getTime();
    let to = new Date(`${to_yyyy}-${to_mm}-${to_dd} ${to_hh}:${to_min}:${to_ss}.000`).getTime();

    return db_pool.query(
        `SELECT * FROM public.frame
        WHERE "timestamp" >= $1 AND "timestamp" <= $2`,
        [from, to]
    )
    .then((res) => {
        return res.rows;
    })
    .catch((err) => {
        return err;
    });
}

console.log(`querying...`);
extract(from['yyyy'], from['mm'], from['dd'], from['hh'], from['min'], from['ss'], to['yyyy'], to['mm'], to['dd'], to['hh'], to['min'], to['ss'])
.then((frames) => {
    let dir_name = `${__dirname}/extract/${Date.now()}`;
    if (!fs.existsSync(dir_name)) {
        fs.mkdirSync(dir_name, { recursive: true });
        console.log(`folder created: '${dir_name}'`);
    }

    frames.forEach(frame => {
        fs.writeFileSync(`${dir_name}/${frame['timestamp']}.jpg`, frame['frame'], {encoding: "base64", flag: "w"});
        console.log(`'${frame['timestamp']}.jpg' saved`);
    })
})
.catch((err) => {
    console.log(err);
})
.finally(() => {
    console.log("finish!");
});





