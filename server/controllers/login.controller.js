const fs = require('fs');
const crypto = require('crypto');
const common = JSON.parse(fs.readFileSync(`${__dirname}/../common.json`));

function randomize_uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

exports.loginProcessing = async (req, res, next) => {
    try {
        let is_user_valid = (req.body.uname == common['USER']['USERNAME']) && (req.body.psw == common['USER']['PASSWORD']);
        
        if(is_user_valid){
            //retrive user data
            req.session.login = 1;
            req.session.uuid = randomize_uuid();
            
            res.redirect('/board');
        }
        else {
            res.render('login')
        }
    } catch (error) {
        console.log(error);
    }
}