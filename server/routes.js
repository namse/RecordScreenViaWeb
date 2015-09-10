var fs = require('fs');
// app.routes.js
module.exports = function(app) {
    app.get('/', function(req, res) {
        fs.readdir('uploads/finished', function(err, dir) {
            if (err)
                console.log(err);
            res.render('pages/index', {
                ids: dir
            });
        });
    });

    app.get('/videolist', function(req, res) {
        var id = req.query.id;

        fs.readdir('uploads/finished/' + id, function(err, dir) {
            if (err)
                console.log(err);


            res.render('pages/videolist', {
                dates: dir,
                id: id
            });
        });
    });

    app.get('/view', function(req, res) {

        var id = req.query.id;
        var date = req.query.date;
        var source = 'finished/' + id + '/' + date + '/' + id + '_' + date;
        res.render('pages/view', {
            sourceA: source + '_admin_FIN.webm',
            sourceB: source + '_user_FIN.webm',
        })
    });
};