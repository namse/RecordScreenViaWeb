var fs = require('fs');
// app.routes.js
module.exports = function(app) {
	app.get('/', function(req, res) {
		fs.readdir('uploads', function(err, dir) {
			if (err)
				console.log(err);
			res.render('pages/index', {
				IDs: dir
			});
		});
	});

};