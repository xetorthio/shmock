var supertest = require("supertest");
var shmock = require("..");
var assert = require("assert");

describe("shmock", function() {
  it("Should be able to bind to a specific port", function(done) {
    var mock = shmock(9000);

    supertest(mock).get("/").expect(404, done);
  });

  it("Should be able to bind to an arbitrary", function(done) {
    var mock = shmock();

    supertest(mock).get("/").expect(404, done);
  });

  describe("Custom middlwares", function() {

    it("Should accept an array of a single middleware", function (done) {
      var mock = shmock(9089, [function (req, res, next) {
        assert(typeof req === "object", "that the middleware is passed the req object");
        assert(typeof res === "object", "that the middleware is passed the res object");
        assert(typeof next === "function", "that the middleware is next callback");
        next();
      }]);
      supertest(mock).get("/").expect(404, done);
    });

    it("Should accept an array of multiple middlewares", function (done) {
      var mock = shmock(9091, [function (req, res, next) {
        assert(typeof req === "object", "that the middleware is passed the req object");
        assert(typeof res === "object", "that the middleware is passed the res object");
        assert(typeof next === "function", "that the middleware is next callback");
        next();
      }, function (req, res, next) {
        assert(typeof req === "object", "that the middleware is passed the req object");
        assert(typeof res === "object", "that the middleware is passed the res object");
        assert(typeof next === "function", "that the middleware is next callback");
        next();
      }]);
      supertest(mock).get("/").expect(404, done);
    });

  });

  describe("Request", function() {
    var mock;
    var test;

    before(function() {
      mock = shmock(9001);
      test = supertest(mock);
    });

    beforeEach(function() {
      mock.clean();
    });


    it("Should remove by default expectations after meeting them", function(done) {
      var handler = mock.get("/foo").reply(200);

      test.get("/foo").expect(200, function() {
        test.get("/foo").expect(404, done);
      });
    });

    it("Should not remove expectations after meeting them if they were persisted", function(done) {
      var handler = mock.get("/persisted").persist().reply(200);

      test.get("/persisted").expect(200, function() {
        test.get("/persisted").expect(200).end(function(error, response) {
          test.get("/persisted").expect(200).end(function(error, response) {
            if (error) return done(error);
            handler.isDone.should.be.ok;
            done();

          });
        });
      });
    });

    it("Should return a handler to verify if a request has been made", function(done) {
      var handler = mock.get("/foo").reply(200);

      handler.isDone.should.not.be.ok;
      handler.done.should.throw();

      test.get("/foo").expect(200, function() {
        handler.isDone.should.be.ok;
        done();
      });
    });

    it("Should be able to mock a any http method", function(done) {
      mock.get("/foo").reply(200);

      test.get("/foo").expect(200, done);
    });

    it("Should fail if expected request body doesn't match", function(done) {
      mock.get("/foo").send("foobar").reply(200);

      test.get("/foo").end.should.throw();
      done();
    });

    it("Should succeed if expected request body match the one sent", function(done) {
      mock.post("/get").send("lalalala").set("Content-Type", "text/plain").reply(200);

      test.post("/get").set("Content-Type", "text/plain").send("lalalala").expect(200, done);
    });

    it("Should succeed if expected request json match the one sent", function(done) {
      mock.post("/get").send({foo: "bar", bar: "foo"}).reply(200);

      test.post("/get").send({bar: "foo", foo: "bar"}).expect(200, done);
    });

    it("Should match query parameters", function(done) {
      mock.post("/get")
        .query({total: 10, limit: 1})
        .query({foo: "bar"})
        .query("a=b&c=d")
        .query("x=y")
        .reply(200);

      test.post("/get").query({total: 10, limit: 1, foo: "bar", a: "b", c: "d", x: "y"}).expect(200, done);
    });

    it("Should fail if headers are not matched", function(done) {
      mock.post("/get").set("Content-Type", "application/json").reply(200);

      test.post("/get").end.should.throw();
      done();
    });

    it("Should succeed if headers are matched", function(done) {
      mock.post("/get").set("Content-Type", "application/json").reply(200);

      test.post("/get").set("Content-Type", "application/json").send({}).expect(200, done);
    });

    it("Should allow to specify response headers", function(done) {
      mock.post("/get").reply(200,'Hello world',{'X-my-header':'My header value'});

      test.post("/get").expect('X-my-header', 'My header value').expect(200, done);
    });

    it("Should be able to wait a specificed number of ms for expectation to be met", function(done) {
      var h = mock.get("/foo").reply(200);

      setTimeout(function() {
        test.get("/foo").expect(200, function() {});
      }, 20);

      h.wait(10, function(err) {
        err.should.not.be.null;

        h.wait(30, done);
      });
    });

    it("Should be able to wait a default number of ms for expectation to be met", function(done) {
      var h = mock.get("/foo").reply(200);

      h.defaults.waitTimeout = 10;

      setTimeout(function() {
        test.get("/foo").expect(200, function() {});
      }, 20);

      h.wait(function(err) {
        err.should.not.be.null;
        done();
      });
    });

    it("Should be able to delay a reply for a specified amount of ms", function(done) {
      mock.get("/foo").delay(30).reply(200);

      test.get("/foo").timeout(10).end(function(err) {
        err.should.not.be.null;

        test.get("/foo").timeout(50).expect(200, function(err) {
          (err == null).should.be.ok;

          mock.get("/foobar").reply(200);
          test.get("/foobar").timeout(10).expect(200, done);
        });
      });
    });

    it("Should lazily evaluate a response body function", function(done) {

      var responseBodyFunction = function() {
        return {
          time: new Date().getTime()
        }
      };

      mock.get("/time").reply(200, responseBodyFunction);

      test.get("/time").expect(200).end(function(error, response) {
        var firstTime = response.body.time;
        test.get("/time").expect(200).end(function(error, response) {
            var secondTime = response.body.time;
            assert.notEqual(firstTime, secondTime, "Response body function was supposed to be lazily evaluated and to produce separate responses on separate invocations");
            done();
        });
      });
    });
  });
});
