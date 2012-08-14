/*jslint node: true */
'use strict';

var request = require('request');
var makeLRU = require('./lru.js');

module.exports = function s3(options) {
  var prefix;
  var remotePrefix;
  var lru;

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

  if (options === undefined || options.etag === undefined) {
    lru = makeLRU({
      max: 500
    });
  } else {
    if (options.etag === 0) {
      lru = null;
    } else {
      lru = LRU.makeLRU({
        max: options.etag
      });
    }
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
    var etag;

    if (url.length < prefix.length ||
       url.substr(0, prefix.length) !== prefix) {
      return next();
    }

    newUrl = makeRemoteUrl(url);

    // Check for a conditional GET
    if (req.method.toLowerCase() === 'get') {
      etag = req.headers['if-none-match'];
      if (etag !== undefined) {
        var oldEtag = lru.get(newUrl);
        if (oldEtag === etag) {
          // Match! The client has a cached copy, so we can send a 304 Not Modified.
          res.statusCode = 304;
          res.end();
          return;
        }
      }
    }
    
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
        etag = response.headers.etag;
        // Cache the URL -> ETag relationship
        lru.add(newUrl, etag);
        res.setHeader('etag', etag);
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
