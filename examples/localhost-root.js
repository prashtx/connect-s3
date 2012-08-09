/*jslint node: true */
'use strict';

var connect = require('connect');
var s3 = require('../lib/connect-s3.js');

var port = process.env.PORT || 3000;

var app = connect()
.use(connect.compress())
.use(s3({
  pathPrefix: '/',
  remotePrefix: 'http://localhost/~' + process.env.USER
}))
.listen(port, function () {
  console.log('Listening on ' + port);
});

