/*jslint node: true */
'use strict';

var request = require('request');

module.exports = function s3(options) {
  var prefix;
  var remotePrefix;

  if (options === undefined || options.pathPrefix === undefined) {
    prefix = '/';
  } else {
    prefix = options.pathPrefix;
  }

  if (options === undefined || options.remotePrefix === undefined) {
    throw new Error('Must define a remote prefix');
  } else {
    remotePrefix = options.remotePrefix;
  }

  var makeRemoteUrl = (function (remotePrefix, prefix, len) {
    if (prefix === '/') {
      return function (url) { return remotePrefix + url; };
    }
    return function (url) {
      return remotePrefix + url.substr(len);
    };
  }(remotePrefix, prefix, prefix.length));

  return function (req, res, next) {
    var url = req.url;
    var newUrl;

    if (url.length < prefix.length ||
       url.substr(0, prefix.length) !== prefix) {
      return next();
    }

    newUrl = makeRemoteUrl(url);
    
    request.get({
      url: newUrl,
      followRedirect: false,
      encoding: null
    }, function (err, response, body) {
      if (err) {
        res.statusCode = 500;
        res.end();
      } else if (response.statusCode === 302 ||
                 response.statusCode === 301) {
        res.statusCode = response.statusCode;
        // S3 will return 302 Found if it found an index.html and wants to
        // redirect us to a directory-like URL (i.e. terminal forward slash)
        res.setHeader('Location', req.url + '/');
        res.end();
      } else {
        res.setHeader('content-type', response.headers['content-type']);
        res.setHeader('etag', response.headers['etag']);
        if (body) {
          res.write(body);
        } else {
          res.write('');
        }
        res.end();
      }
    });
  };
}
