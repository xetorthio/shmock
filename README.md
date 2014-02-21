# Shmock

  [![Build Status](https://travis-ci.org/xetorthio/shmock.png)](https://travis-ci.org/xetorthio/shmock)

  Express based http mocking library.

  Make sure to view the test for [examples](https://github.com/xetorthio/shmock/tree/master/test/shmock.js).

## Installation

```
$ npm install shmock
```

## Example

```js
var shmock = require('shmock');

var mock = shmock(9000);

mock.get("/hello").reply(200, "world!");
```

And then you can:

```bash
curl http://localhost:9000/hello
```

## License

  MIT

