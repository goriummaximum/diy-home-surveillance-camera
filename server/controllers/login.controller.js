const fs = require('fs');
const common = JSON.parse(fs.readFileSync(`${__dirname}/../common.json`));

exports.loginProcessing = async (req, res, next) => {
    try {
        let is_user_valid = (req.body.uname == common['USER']['USERNAME']) && (req.body.psw == common['USER']['PASSWORD']);
        
        if(is_user_valid){
            //retrive user data
            req.session.login = 1;
            
            res.redirect('/board');
        }
        else {
            res.render('login')
        }
    } catch (error) {
        console.log(error);
    }
}