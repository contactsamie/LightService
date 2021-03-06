﻿jest.dontMock('../src/lightservice');

var light = require('../src/lightservice') || light;
describe('light', function () {
    it('using new api', function () {
        var result1;
        var result2;
        light.service("double", function (arg) {
            arg = arg || 0;
            return arg * 2;
        });
        light.service("lastResult", function (arg) {
            if (arg) { this.store.set("result", arg); }
            return this.store.get("result");
        });
        light.service("square", function (arg) {
            arg = arg || 0;
            var result = arg * arg;
            this.serviceChain().lastResult(result);
            return result;
        });

        light.receive("CALCULATION_STARTED", function () {
            console.log("calculation started");
        });
        light.receive("CALCULATION_ENDED", function (arg) {
            result1 = arg;
            result2 = this.serviceChain().lastResult().result()
            console.log("calculation ended as " + result2); console.log("and I received a last result of " + arg);
        });

        light(function () {
            light.send("CALCULATION_STARTED");
            var result = this.serviceChain().double(10).lastResult().square().result()
            light.send("CALCULATION_ENDED", result);
        });

        expect(result1).toBe(result2);
    });
});