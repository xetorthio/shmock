var express = require("express");
var methods = require("methods");
var assert = require('assert');
var querystring = require("querystring");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var deepEqual = require('deep-equal');

module.exports = function(port) {
  var app = express();

  app.on("error", function(err) {
    throw err;
  });

  app.use(express.json());
  app.use(express.urlencoded());

  app.use(function(req, res, next){
    if (req.is('text/*')) {
      req.text = '';
      req.setEncoding('utf8');
      req.on('data', function(chunk){ req.text += chunk });
      req.on('end', next);
    } else {
      next();
    }
  });

  var server;
  if(port) {
    server = app.listen(port);
  } else {
    server = app.listen();
  }

  methods.forEach(function(method) {
    server[method] = function(path) {
      return new Assertion(app, method, path);
    }
  });

  server.clean = function() {
    app._router.map = {};
  }

  return server;
}

function Assertion(app, method, path) {
  var self = this;
  this.app = app;
  this.method = method;
  this.path = path;
  this.headers = {};
  this.removeWhenMet = true;

  this.parseExpectedRequestBody = function() {
    if(!self.headers["content-type"]) {
      if(typeof self.data == "string") {
        return self.requestBody = querystring.parse(self.data);
      }
    }
    self.requestBody = self.data;
  }
}

Assertion.prototype.send = function(data) {
  this.data = data;
  return this;
}

Assertion.prototype.query = function(qs) {
  var q;
  if(typeof qs == "string") {
    q = querystring.parse(qs);
  } else {
    q = qs;
  }
  if(!this.qs) {
    this.qs = {};
  }
  for(var n in q) {
    this.qs[n] = "" + q[n];
  }
  return this;
}

Assertion.prototype.ifQuery = function(queryObject) {
  this.queryObject = queryObject;
  return this;
}

Assertion.prototype.set = function(name, value) {
  this.headers[name.toLowerCase()] = value;
  return this;
}

Assertion.prototype.delay = function(ms) {
  this.delay = ms;
  return this;
}

Assertion.prototype.persist = function() {
  this.removeWhenMet = false;
  return this;
}

Assertion.prototype.reply = Assertion.prototype.thenReply = function(status, responseBody) {
  this.parseExpectedRequestBody();

  var self = this;
  this.app[this.method](this.path, function(req, res, next) {
    self.testAssertions(req);

    if (self.queryObject && !deepEqual(req.query,self.queryObject)) {
      next();
    }
    else {
      var reply = function() {
          self.handler.emit("done");
  
          // Remove route from express since the expectation was met
          // Unless this mock is suposed to persist
          if (self.removeWhenMet) self.app._router.map[self.method].splice(req._route_index, 1);
          res.status(status).send(responseBody);
        };
      if(self.delay) {
        setTimeout(reply, self.delay);
      } else {
        reply();
      }
    }
  });

  this.handler = new Handler(this);
  return this.handler;
}

Assertion.prototype.testAssertions = function(req) {
  if(this.qs) {
    assert.deepEqual(req.query, this.qs);
  }
  if(this.requestBody) {
    if(req.text) {
      assert.deepEqual(req.text, this.requestBody);
    } else {
      assert.deepEqual(req.body, this.requestBody);
    }
  }
  for(var name in this.headers) {
    assert.deepEqual(req.headers[name], this.headers[name]);
  }
}


function Handler(assertion) {
  this.defaults = {
    waitTimeout: 2000
  };
  var self = this;
  this.assertion = assertion;
  this.isDone = false;
  this.responseCount = 0;
  this.on("done", function() {
    self.isDone = true;
    self.responseCount++;
  });
}

util.inherits(Handler, EventEmitter);

Handler.prototype.done = function() {
  if(!this.isDone) {
    throw new Error(this.assertion.method + " " + this.assertion.path + " was not made yet.");
  }
}

Handler.prototype.count = function() {
  return this.responseCount;
}

Handler.prototype.wait = function(ms, fn) {
  if(!fn && typeof ms == "function") {
    fn = ms;
    ms = this.defaults.waitTimeout;
  }

  var self = this;
  var timeout = null;
  var cb = function() {
    clearTimeout(timeout);
    fn();
  }
  this.once("done", cb);
  timeout = setTimeout(function() {
    self.removeListener("done", cb);
    fn(new Error(self.assertion.method + " " + self.assertion.path + " was not called within " + ms + "ms."));
  }, ms);
}
