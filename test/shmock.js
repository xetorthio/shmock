var supertest = require("supertest");
var shmock = require("..");

describe("shmock", function() {
  it("Should be able to bind to a specific port", function(done) {
    var mock = shmock(9000);

    supertest(mock).get("/").expect(404, done);
  });

  it("Should be able to bind to an arbitrary", function(done) {
    var mock = shmock();

    supertest(mock).get("/").expect(404, done);
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


    it("Should remove by defailt expectations after meeting them", function(done) {
      var handler = mock.get("/foo").reply(200);

      test.get("/foo").expect(200, function() {
        test.get("/foo").expect(404, done);
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
  });

});
