const fs = require('fs');
const common = JSON.parse(fs.readFileSync(`${__dirname}/../common.json`));

exports.boardProcessing = async (req, res, next) => {
    try {
        if(req.session.login){
            res.render('board', {
                "MQTT_HOST": common['MQTT_HOST'],
                "MQTT_PORT": common['MQTT_WS_PORT'],
                "MQTT_CLIENTID": req.session.uuid,
                "MQTT_USERNAME": common['MQTT_USERNAME'],
                "MQTT_PASSWORD": common['MQTT_PASSWORD']
            })
        }
        else {
            res.redirect('login');
        }
    } catch (error) {
        console.log(error);
    }
}
