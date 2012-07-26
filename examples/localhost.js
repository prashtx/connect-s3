/*jslint node: true */
'use strict';

var connect = require('connect');
var s3 = require('../lib/connect-s3.js');

var port = process.env.PORT || 3000;

var app = connect()
.use(connect.compress())
.use(s3({
  pathPrefix: '/web',
  remotePrefix: 'http://localhost/~' + process.env.USER
}))
.use(function (req, res) {
  if (req.url === '/') {
    res.statusCode = 302;
    res.setHeader('Location', '/web/');
    res.end();
  } else {
    res.statusCode = 404;
    res.end();
  }
})
.listen(port, function () {
  console.log('Listening on ' + port);
});
