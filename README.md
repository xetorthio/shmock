# Shmock

  [![Build Status](https://travis-ci.org/xetorthio/shmock.png)](https://travis-ci.org/xetorthio/shmock)

  [Express](https://github.com/visionmedia/express) based http mocking library.

  The reason for this to exist is because I believe that mocking functions to change their behavior is extremely horrible and prone to errors. Libraries like [nock](https://github.com/pgte/nock) take this approach, and then there are a few cases where thing doesn't work. Maybe because of how http clients work, etc.
  So this library provides a super nice API, like the one of [superagent](https://github.com/visionmedia/superagent) but it creates a real http server (using [express](https://github.com/visionmedia/express)). The nice thing about this is that you don't really care about the implementation, which http client is being used, or even if nodes native http api changes.

  Make sure to view the test for [examples](https://github.com/xetorthio/shmock/tree/master/test/shmock.js).

## Installation

```
$ npm install shmock
```

## Example

```js
var shmock = require('shmock');
var should = require('should');

var mock = shmock(9000);

var getFoo = mock.get('/hello').reply(200, 'world!');

// you can verify that the request has been done:

getfoo.isDone.should.be.ok;
```

And then you can:

```bash
curl http://localhost:9000/hello
```

## License

  MIT

