exports.indexProcessing = async (req, res, next) => {
    try {
        res.redirect('/board');
    } catch (error) {
        console.log(error);
    }
}


