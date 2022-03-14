const fs = require('fs');
const common = JSON.parse(fs.readFileSync(`${__dirname}/../common.json`));

exports.boardProcessing = async (req, res, next) => {
    try {
        if(req.session.login){
            res.render('board', {
                "MQTT_HOST": common['MQTT_HOST'],
                "MQTT_PORT": common['MQTT_PORT']
            })
        }
        else {
            res.redirect('login');
        }
    } catch (error) {
        console.log(error);
    }
}
