var express = require("express");
var methods = require("methods");
var should = require("should");
var querystring = require("querystring");

module.exports = function(port) {
  var app = express(port);

  app.on("error", function(err) {
    throw err;
  });

  var bodyParser = express.bodyParser();

  app.use(bodyParser);
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

  var server = app.listen(port);

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
  this.isDone = false;

  this.parseExpectedRequestBody = function() {
    if(!self.headers["content-type"]) {
      if(typeof self.data == "string") {
        return self.requestBody = querystring.parse(self.data);
      }
    }
    self.requestBody = self.data;
  }
}

Assertion.prototype.done = function() {
  if(!this.isDone) {
    throw this.method + " " + this.path + " was not made yet.";
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

Assertion.prototype.set = function(name, value) {
  this.headers[name.toLowerCase()] = value;
  return this;
}

Assertion.prototype.reply = function(status, responseBody) {
  this.parseExpectedRequestBody();

  var self = this;

  this.app[this.method](this.path, function(req, res) {
    if(self.qs) {
      req.query.should.eql(self.qs);
    }
    if(self.requestBody) {
      if(req.text) {
        req.text.should.eql(self.requestBody);
      } else {
        req.body.should.eql(self.requestBody);
      }
    }
    for(var name in self.headers) {
      req.headers[name].should.eql(self.headers[name]);
    }

    self.isDone = true;
    res.status(status).send(responseBody);
  });

  return this;
}
