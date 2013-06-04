# connect-s3

Connect middleware for serving static content from Amazon S3.

## Installation

Run `npm install connect-s3 --save` to install the module locally and add an
entry to your project's `package.json` file.

## Use

To use with Amazon S3, set your bucket up as a website in the AWS Console. You
should see the URL to use for website functionality, which will include your
bucket name and region.

```javascript
var connect = require('connect');
var s3 = require('connect-s3');

var app = connect()
.use(s3({
  pathPrefix: '/web',
  remotePrefix: 'http://some-bucket.s3-website-us-east-1.amazonaws.com/somepath'
}))
.listen(process.env.PORT || 3000);
```

## Test

Install dependencies and dev dependencies with `npm install`. The Makefile also
uses Foreman to run Mocha with environment variables set. To run the tests,
create a file called `test.env` specifying the ports to use for the test
servers. For example, you might have the following.

```
PROXY_PORT=3100
SERVER_PORT=3101
```

Then run `make`.

## Why?

I've run across Connect middleware for serving local static content, which
sounds pretty handy. But if you deploy your app to Heroku, then local static
content is not a great idea. Now you can host your static content on S3 and
either use Heroku as a simple web server (handy but hacky) or integate the
static content with other server-side functionality (avoiding potential
cross-origin issues of a separately-hosted site).

