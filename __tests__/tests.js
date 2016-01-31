jest.dontMock('../lightservice');
var light = require('../lightservice') || light;
/*
light.event(function (e, context,notificationInfo) {
 console.log("logging full ---- " );
   console.log(JSON.stringify(context));
   console.log(notificationInfo);
   console.log(e);
});*/
light.event(function (e, context, notificationInfo) { });

light.service("test", function (arg) { });
light.service("test-2", function (arg) { });
light.service("test-2b2", function (arg) { });
light.service("test_error", function (arg) { throw "error occured"; });
light.service("sample1", function (arg) { return arg.x * arg.y; });
light.service("sample2", function (arg) {
    return this.sample1({ x: 2, y: 3 });
});

describe('light', function () {
    it('exists', function () {
        expect(light.version).toBe(1);
    });

    it('should allow event subscription - forEachSubscriber', function () {
        light.startService("test-2", function (test) {
            var path = [];

            var subs = "";
            var subsExpected = "";
            subs += test.after(function () {
                path.push("2");
            });

            subs += test.after(function () {
                path.push("1");
            });

            test.after.forEachSubscriber(function (it) {
                subsExpected += it.ref;
            });

            expect(subs).toBe(subsExpected);
            test();
            expect(subs).toBe(subsExpected);
            test();
        });
    });

    it('should allow light definition', function () {
        light.startService("test", function (test) {
            expect(test.me).toBe("test");
            expect(test.position).toBe(1);
        });
    });

    it('should allow event subscription 1', function () {
        light.startService("test", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test();
            expect(path[0]).toBe("before");
            expect(path.length).toBe(1);
        });
    });
    it('should allow event subscription 2', function () {
        light.startService("test", function (test) {
            var path = [];
            test.after(function () {
                path.push("after1");
            });
            test();
            expect(path[0]).toBe("after1");
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription 2', function () {
        light.startService("test", function (test) {
            var path = [];
            test.after(function () {
                path.push("after2");
            });

            test.after.forEachSubscriber(function (it) {
                console.warn(it);
            });

            test();
            expect(path[0]).toBe("after2");
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription - forEachSubscriber ', function () {
        light.startService("test-2b2", function (test) {
            var path = [];

            var subs = "";
            var subsExpected = "";
            subs += test.after(function () {
                path.push("2");
            });
            test.before(function () {
                path.push("1");
            });
            subs += test.after(function () {
                path.push("1");
            });
            test.error(function () {
                path.push("1");
            });

            test.after.forEachSubscriber(function (it) {
                subsExpected += it.ref;
            });

            expect(subs).toBe(subsExpected);
            test();
            expect(subs).toBe(subsExpected);
            test();
        });
    });

    it('should allow event subscription 3', function () {
        light.startService("test", function (test) {
            var path = [];
            test.error(function () { path.push("error"); });
            test();
            expect(path.length).toBe(0);
        });
    });

    it('should allow event subscription 5', function () {
        light.startService("test", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function () { path.push("error"); });
            test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
        });
    });

    it('should allow event subscription 4', function () {
        light.startService("test_error", function (test) {
            var path = [];
            test.error(function () { path.push("error"); });
            test();
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription 6', function () {
        light.startService("test_error", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function () { path.push("error"); });
            test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("error");
            expect(path[2]).toBe("after");
            expect(path.length).toBe(3);
        });
    });

    it('should run 1', function () {
        light.startService("sample2", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function (o) { path.push("error"); console.log(o); });
            var answer = test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
            expect(answer).toBe(6);
        });
    });

    it('should run 2', function () {
        light.startService("sample1", function (test) {
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function (o) { path.push("error"); console.log(o); });
            var answer = test({ x: 2, y: 3 });
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
            expect(answer).toBe(6);
        });
    });

    it('using new api', function () {
        light(function () {
            var test = this.test_error;
            var path = [];
            test.before(function () { path.push("before"); });
            test.after(function () { path.push("after"); });
            test.error(function () { path.push("error"); });
            test();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("error");
            expect(path[2]).toBe("after");
            expect(path.length).toBe(3);
        });
    });

    it('event listening are not available in service definition', function () {
        light.service("sample_no_event", function (arg) {
            expect(this.sample1.before).toBe(undefined);
            expect(this.sample1.error).toBe(undefined);
            expect(this.sample1.after).toBe(undefined);

            return this.sample1({ x: 2, y: 3 });
        });

        light(function () {
            this.sample_no_event();
        });
    });
});