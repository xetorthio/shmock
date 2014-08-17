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

## Usage

### Initialize with or without port

```js
var shmock = require('shmock');

var mock = shmock(); // will give some arbitrary port

var mock2 = shmock(9000); // will use port 9000
```

### Define expectations


#### On http methods

```js
mock.get("/foo").reply(200, "bar");
```

#### On http headers

```js
mock.get("/foo").set("Authorization", "123456").reply(200, "bar");
```

#### On querystring parameters

```js
mock.get("/foo").query("a=bi&c=d").reply(200, "bar");
mock.get("/foo").query({a: "b", c: "d"}).reply(200, "bar");
```

#### On request body

```js
mock.post("/foo").send({a: "b"}).reply(200, "bar");
mock.post("/foo").send("123456").reply(200, "bar");
```

#### Register multiple handlers on the same path
```js
var handler1 = mock.get("/foo").skipUnmatchedRequests()
  .persist()
  .query({param1: "request1"})
  .reply(200, {name: "response1"});

var handler2 = mock.get("/foo").skipUnmatchedRequests()
  .persist()
  .query({param1: "request2"})
  .reply(200, {name: "response2"});
```

#### Add a delay to the reply
```js
mock.get("/foo").delay(500).reply(200);
```

### Make assertions on the handler

#### Check if expectation has been met

```js
var handler = mock.get("/foo").reply(200);
...
...
handler.isDone.should.be.ok;
handler.done(); // Throws an error if isDone is false
```

#### Wait for expectation to be met
```js
var handler = mock.get("/foo").reply(200);
...
...
handler.wait(function(err) {
  if(err) {
    // A default timeout of 2 seconds has passed and still the expectation hasn't been bet
  }
});
```

You can also specify a timeout in ms:
```js
handler.wait(200, function(err) { ... });
```
Or if using mocha:
```js
handler.wait(200, done);
```

## License

  MIT

