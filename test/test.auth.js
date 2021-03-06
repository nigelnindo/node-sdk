/**
 * Tests against the authentication module
 */


"use strict";


// npm-installed modules
var errors = require("common-errors");
var should = require("should");
var URI = require("urijs");


// own modules
var auth = require("../lib/auth");
var utils = require("../lib/utils");


describe("auth.addSignature", function() {
    it("returns a URIjs instance", function() {
        var uri = utils.url();
        var signedUri = auth.addSignature("key", "secret", uri);
        should(signedUri).be.an.instanceOf(URI);
    });

    it("returns the same URIjs instance passed", function() {
        var uri = utils.url();
        var signedUri = auth.addSignature("key", "secret", uri);
        should.strictEqual(signedUri, uri);
    });

    it("adds signature to query", function() {
        var signedUri = auth.addSignature("key", "secret", utils.url());
        should(signedUri.hasQuery("signature")).be.ok();
    });

    it("adds apikey to query", function() {
        var signedUri = auth.addSignature("key", "secret", utils.url());
        should(signedUri.hasQuery("apikey")).be.ok();
    });

    it("generate deterministic hashs", function() {
        var uri = utils.url();
        var sameUri = uri.clone();
        var key = "key";
        var secret = "secret";
        var signedUri1 = auth.addSignature(key, secret, uri);
        var signedUri2 = auth.addSignature(key, secret, sameUri);
        should.equal(signedUri1.toString(), signedUri2.toString());
    });

    it("ignores the original order of the query parameters", function() {
        var uri1 = utils.url();
        utils.addQueries(uri1, { name: "mugo", qs: "querystring" });
        var uri2 = utils.url();
        utils.addQueries(uri2, { qs: "querystring", name: "mugo" });
        var key = "some key";
        var secret = "secret";
        var signedUri1 = auth.addSignature(key, secret, uri1);
        var signedUri2 = auth.addSignature(key, secret, uri2);
        should.equal(signedUri1.search(true).signature,
            signedUri2.search(true).signature);
    });

    it("removes signature if exists", function() {
        var uri = utils.url();
        var fakeSig = "signed by me";
        uri.addQuery("signature", fakeSig);
        auth.addSignature("key", "secret", uri);
        var params = uri.search(true);
        should(params.signature).not.be.an.Array();
    });

    it("removes key if exists", function() {
        var uri = utils.url();
        var key = "some key";
        uri.addQuery("apikey", key);
        auth.addSignature("another key", "secret", uri);
        var params = uri.search(true);
        should(params.apikey).not.be.an.Array();
    });

    it("uses the request body in hashing", function() {
        var uri = utils.url();
        var sameUri = uri.clone();
        var body = "isBody=true";
        var key = "key";
        var secret = "secret";
        var signedWithoutBody = auth.addSignature(key, secret, uri);
        var signedWithBody = auth.addSignature(key, secret, sameUri, body);
        should.notEqual(signedWithBody.search(true).signature,
            signedWithoutBody.search(true).signature);
    });

    it("JSON-stringifies body if its an object", function() {
        var uri = utils.url();
        var key = "key";
        var secret = "secret";
        var body = { isBody: true };
        var bodyString = JSON.stringify(body);
        var sameUri = uri.clone();
        auth.addSignature(key, secret, uri, body);
        auth.addSignature(key, secret, sameUri, bodyString);
        should.equal(uri.search(true).signature,
            sameUri.search(true).signature);
    });

    it("thows an AuthenticationRequiredError if the key/secret is not a string", function() {
        var samples = [-1, 0, 1, { }, { i: "j" }, function() {}, null, undefined];
        var ex = "123";
        var uri = utils.url();
        var body = "body";
        samples.forEach(function(sample) {
            should.throws(function() {
                auth.addSignature(sample, ex, uri, body);
            }, errors.AuthenticationRequiredError);
            should.throws(function() {
                auth.addSignature(ex, sample, uri, body);
            }, errors.AuthenticationRequiredError);
        });
    });

    it("generates correct/expected hashes", function() {
        var key = "key";
        var secret = "secret";
        var uri = utils.url();
        var body = "body";
        var signature = "3058dc0ea8b186c87518f4ee747c5297d48c03688588f0929d390acba6415307";
        auth.addSignature(key, secret, uri, body);
        var params = uri.search(true);
        should.equal(params.signature, signature);
    });

    it("allows proxies to be used", function() {
        var proxy = "http://proxy.me";
        var uri = utils.url("trafficUpdates");
        var proxiedUri = utils.url("trafficUpdates", { proxy: proxy });
        var key = "key";
        var secret = "secret";
        var signature1 = auth.addSignature(key, secret, uri).search(true).signature;
        var signature2 = auth.addSignature(key, secret, proxiedUri).search(true).signature;
        should.equal(signature2, signature1);
    });
});


describe("auth.sign", function() {
    it("adds timestamp", function() {
        var uri = utils.url();
        auth.sign("key", "secret", uri);
        should(uri.hasQuery("timestamp")).be.ok();
    });
});
