/*jslint node: true nomen: true */
/*globals suite, suiteSetup, suiteTeardown, test, setup */
'use strict';

var http = require('http');
var fs = require('fs');
var connect = require('connect');
var async = require('async');
var request = require('request');
var should = require('should');
var s3 = require('../lib/connect-s3.js');

var proxyPort = process.env.PROXY_PORT || 3000;
var serverPort = process.env.SERVER_PORT || 3001;

var base = 'http://localhost:' + proxyPort;

var data_index = fs.readFileSync(__dirname + '/data/index.html').toString();
var data_subdir_index = fs.readFileSync(__dirname + '/data/subdir/index.html').toString();

function startProxy(options, done) {
  var app = connect();
  app.use(s3(options));
  var server = http.createServer(app);
  server.listen(proxyPort, done);
  return function (done) {
    server.close(done);
  };
}

// Simulate S3 static web hosting.
function startServer(done) {
  var app = connect();
  app.use(connect.static(__dirname + '/data', {
    redirect: true
  }));
  var server = http.createServer(app);
  server.listen(serverPort, done);
  return function (done) {
    server.close(done);
  };
}

suite('Connect-S3', function () {
  var closeProxy;
  var closeServer;

  suiteSetup(function (done) {
    async.series([
      function (next) {
        closeProxy = startProxy({
          pathPrefix: '/web',
          remotePrefix: 'http://localhost:' + serverPort + '/'
        }, next);
      },
      function (next) {
        closeServer = startServer(next);
      }
    ], done);
  });

  suiteTeardown(function (done) {
    async.series([closeServer, closeProxy], done);
  });

  test('GET /web should return index.html', function (done) {
    request({
      url: base + '/web'
    }, function (error, response, body) {
      should.not.exist(error);
      response.statusCode.should.equal(200);
      response.should.be.html;
      body.should.equal(data_index);

      done();
    });
  });

  test('GET /web/ should return index.html', function (done) {
    request({
      url: base + '/web'
    }, function (error, response, body) {
      should.not.exist(error);
      response.statusCode.should.equal(200);
      response.should.be.html;
      body.should.equal(data_index);

      done();
    });
  });

  test('GET /web/index.html should return index.html', function (done) {
    request({
      url: base + '/web'
    }, function (error, response, body) {
      should.not.exist(error);
      response.statusCode.should.equal(200);
      response.should.be.html;
      body.should.equal(data_index);

      done();
    });
  });

  test('GET /web/subdir should get redirect with trailing slash', function (done) {
    request({
      url: base + '/web/subdir',
      followRedirect: false
    }, function (error, response, body) {
      should.not.exist(error);
      response.statusCode.should.equal(301);
      response.headers.location.should.equal('/web/subdir/');
       
      done();
    });
  });

  test('GET /web/subdir/ should not get redirect', function (done) {
    request({
      url: base + '/web/subdir/',
      followRedirect: false
    }, function (error, response, body) {
      should.not.exist(error);
      response.statusCode.should.equal(200);
      body.should.equal(data_subdir_index);
       
      done();
    });
  });

});

