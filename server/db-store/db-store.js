process.title = "db-store";

const mqtt = require('mqtt');
const fs = require('fs');

const common = JSON.parse(fs.readFileSync(`${__dirname  }/../common.json`));

const streaming_broker_options = {
    clientId: "db-store",
    username: common["MQTT_USERNAME"],
    password: common["MQTT_PASSWORD"],
    keepalive: 120,
    protocolVersion: 5,
    clean: false,
    properties: {  // MQTT 5.0
        sessionExpiryInterval: 300,
        //receiveMaximum: 100
    },
    resubscribe: false
}

const streaming_broker_protocol = "mqtt";
const streaming_broker_addr = common['MQTT_HOST'];
const streaming_broker_port = common['MQTT_PORT'];

//get topics of all devices
const sub_topics = [
    {
        'topic': `dalat_survail/esp32cam/up/preprocessed`,
        'options': {
            'qos': 0
        }
    }
];

/* ==============CONNECT TO STREAMING BROKER============== */
const streaming_broker_mqttclient = mqtt.connect(
    `${streaming_broker_protocol}://${streaming_broker_addr}:${streaming_broker_port}`, 
    streaming_broker_options
);

streaming_broker_mqttclient.on('connect', streaming_broker_connect_handler);
streaming_broker_mqttclient.on('error', streaming_broker_error_handler);
streaming_broker_mqttclient.on('message', streaming_broker_message_handler);

//handle incoming connect
function streaming_broker_connect_handler(connack)
{
    console.log(`streaming broker connected? ${streaming_broker_mqttclient.connected}`);
    if (connack.sessionPresent == false) {
        sub_topics.forEach((topic) => {
            streaming_broker_mqttclient.subscribe(topic['topic'], topic['options']);
        });
    }
}

//STORE TO DB
async function streaming_broker_message_handler(topic, message, packet)
{
    const data = JSON.parse(message);

    try {
        await db_pool.query(
            `INSERT INTO public.frame("timestamp", frame)
                VALUES ($1, $2)`,
            [data['timestamp'], data['frame']]
        );
    } catch (err) {
        console.log(err.stack);
    }
}

// handle error
function streaming_broker_error_handler(error)
{
    console.log("Can't connect to streaming broker" + error);
    process.exit(1);
}

/* ==============CONNECT TO PG============== */
const {Pool} = require("pg");


const db_pool = new Pool({
    user: common["PG_USERNAME"],
    password: common["PG_PASSWORD"],
    host: common["PG_HOST"],
    port: common["PG_PORT"],
    database: common["PG_DB"]
})

