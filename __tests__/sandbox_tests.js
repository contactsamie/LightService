jest.dontMock('../src/lightservice');
jest.dontMock('../src/lightservice-timemachine');

var light = require('../src/lightservice') || light;
require('../src/lightservice-timemachine');

light.service("test", function (arg) { });
light.service("test-2", function (arg) { });
light.service("test-2b2", function (arg) { });
light.service("test_error", function (arg) { throw "error occured"; });
light.service("sample1", function (arg) { return arg.x * arg.y; });
light.service("sample2", function (arg) {
    return this.serviceChain().sample1({ x: 2, y: 3 }).result();
});

describe('light', function () {
    /*

     it('recording history', function () {
        var haccess_1;

        haccess_1 = light.service(function (arg, system) {
            arg.x = arg.x + 10;
            return arg;
        });

        light(function () {
            this.system.startRecording();
            var answer = this.serviceChain()[haccess_1]({ x: 0 }).result();
            // console.log(this.system.getAllRecords());
            system.play(0, 1);
            //  console.log(this.system.getAllRecords());
            expect(answer.x).toBe(10);
        });
    });
    */

    //it('exists', function () {
    //    expect(light.version).toBe(1);
    //});
    it('using new api', function () {
        light(function () {
            var test = this.serviceChain().test_error;
            var path = [];
            this.event.test_error.receive("before", function () { path.push("before"); });
            this.event.test_error.receive("after", function () { path.push("after"); });
            this.event.test_error.receive("error", function () { path.push("error"); });
            test().result();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("error");
            expect(path[2]).toBe("after");
            expect(path.length).toBe(3);
        });
    });
    it('should allow event subscription - forEachSubscriber', function () {
        light.startService("test-2", function () {
            var test = this.serviceChain()["test-2"];

            var path = [];

            var subs = "";
            var subsExpected = "";
            subs += this.event["test-2"].receive("after", function () {
                path.push("2");
            });

            subs += this.event["test-2"].receive("after", function () {
                path.push("1");
            });

            this.event["test-2"].after.forEachSubscriber(function (it) {
                subsExpected += it.ref;
            });

            expect(subs).toBe(subsExpected);
            test().result();
            expect(subs).toBe(subsExpected);
            test().result();
        });
    });

    it('should allow event subscription 1', function () {
        light.startService("test", function () {
            var test = this.serviceChain().test;
            var path = [];
            this.event.test.receive("before", function () { path.push("before"); });
            test().result();
            expect(path[0]).toBe("before");
            expect(path.length).toBe(1);
        });
    });
    it('should allow event subscription 2', function () {
        light.startService("test", function (system) {
            var test = this.serviceChain().test;
            var path = [];
            this.event.test.receive("after", function () {
                path.push("after1");
            });
            test().result();
            expect(path[0]).toBe("after1");
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription 2', function () {
        light.startService("test", function () {
            var test = this.serviceChain().test;
            var path = [];
            this.event.test.receive("after", function () {
                path.push("after2");
            });

            this.event.test.after.forEachSubscriber(function (it) {
                console.warn(it);
            });

            test().result();
            expect(path[0]).toBe("after2");
            expect(path.length).toBe(1);
        });
    });
    it('should allow event subscription - forEachSubscriber ', function () {
        light.startService("test-2b2", function () {
            var test = this.serviceChain()["test-2b2"];
            var path = [];

            var subs = "";
            var subsExpected = "";
            subs += this.event["test-2b2"].receive("after", function () {
                path.push("2");
            });
            this.event["test-2b2"].receive("before", function () {
                path.push("1");
            });
            subs += this.event["test-2b2"].receive("after", function () {
                path.push("1");
            });
            this.event["test-2b2"].receive("error", function () {
                path.push("1");
            });

            this.event["test-2b2"].after.forEachSubscriber(function (it) {
                subsExpected += it.ref;
            });

            expect(subs).toBe(subsExpected);
            test().result();
            expect(subs).toBe(subsExpected);
            test().result();
        });
    });

    it('should allow event subscription 3', function () {
        light.startService("test", function () {
            var test = this.serviceChain().test;
            var path = [];
            this.event.test.receive("error", function () { path.push("error"); });
            test().result();
            expect(path.length).toBe(0);
        });
    });

    it('should allow event subscription 5', function () {
        light.startService("test", function () {
            var test = this.serviceChain().test;
            var path = [];
            this.event.test.receive("before", function () { path.push("before"); });
            this.event.test.receive("after", function () { path.push("after"); });
            this.event.test.receive("error", function () { path.push("error"); });
            test().result();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
        });
    });

    it('should allow event subscription 4', function () {
        light.startService("test_error", function () {
            var test = this.serviceChain()["test_error"];
            var path = [];
            this.event["test_error"].receive("error", function () { path.push("error"); });
            test().result();
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription 6', function () {
        light.startService("test_error", function () {
            var test = this.serviceChain()["test_error"];
            var path = [];
            this.event["test_error"].receive("before", function () { path.push("before"); });
            this.event["test_error"].receive("after", function () { path.push("after"); });
            this.event["test_error"].receive("error", function () { path.push("error"); });
            test().result();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("error");
            expect(path[2]).toBe("after");
            expect(path.length).toBe(3);
        });
    });

    it('should run 1', function () {
        light.startService("sample2", function () {
            var test = this.serviceChain().sample2;
            var path = [];
            this.event.sample2.receive("before", function () { path.push("before"); });
            this.event.sample2.receive("after", function () { path.push("after"); });
            this.event.sample2.receive("error", function (o) { path.push("error"); });
            var answer = test().result();
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
            expect(answer).toBe(6);
        });
    });

    it('should run 2', function () {
        light.startService("sample1", function () {
            var test = this.service().sample1;
            var path = [];
            this.event.sample1.receive("before", function () { path.push("before"); });
            this.event.sample1.receive("after", function () { path.push("after"); });
            this.event.sample1.receive("error", function (o) { path.push("error"); });
            var answer = test({ x: 2, y: 3 });
            expect(path[0]).toBe("before");
            expect(path[1]).toBe("after");
            expect(path.length).toBe(2);
            expect(answer).toBe(6);
        });
    });

    it('event listening are not available in service method', function () {
        light.service("sample_no_event", function (arg) {
            return this.service().sample1({ x: 2, y: 3 });
        });

        light(function () {
            this.service().sample_no_event();
        });
    });

    var testObj = {
        sample1: {
            handleName: undefined,
            service: function (arg) {
                return arg.x + arg.y;
            }
        }
    };
    it('native tests', function () {
        light(function () {
            light.advanced.test(testObj, function () {
                var test = this.service().sample2;
                var path = [];
                this.event.sample2.receive("before", function () { path.push("before"); });
                this.event.sample2.receive("after", function () { path.push("after"); });
                this.event.sample2.receive("error", function (o) { path.push("error"); });
                var answer = test();
                expect(path[0]).toBe("before");
                expect(path[1]).toBe("after");
                expect(path.length).toBe(2);
                expect(answer).toBe(5);
            });
        });
    });

    it('should allow light method', function () {
        light.startService("test", function () {
            var test = this.serviceChain().test;
            expect(test.me).toBe("test");
            expect(test.position).toBe(1);
        });
    });

    it('native tests 2', function () {
        light(function () {
            light.advanced.test(testObj, function () {
                var test = this.service().sample2;
                var answer = test();
                expect(answer).toBe(5);
            });
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('native tests 2', function () {
        light.advanced.test(testObj, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('native tests pipes 1', function () {
        var testType1 = {
            sample1: {
                handle: function (method) {
                    return method;
                },
                //handleName: "testType1",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 1', function () {
        var testType1 = {
            sample1: {
                handle: function (method) {
                    return method;
                },
                //handleName: "testType1", CAN USE DEFAULT PIPE
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 2', function () {
        var testType1 = {
            sample1: {
                handle: function (method) {
                    return method;
                },
                //handleName: "testType2",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 3', function () {
        var testType1 = {
            sample1: {
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 4', function () {
        var testType1 = {
            sample1: {
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });
    it('can use default function pipe 5', function () {
        var testType1 = {
            sample1: {
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(5);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 6', function () {
        var testType1 = {
            sample1: {
                handle: function (method) {
                    return function (arg) {
                        return method(arg) + 10;
                    };
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(15);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 7', function () {
        var testType1 = {
            sample1: {
                handle: function (method) {
                    return function (arg) {
                        return method(arg) + 10;
                    };
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(16);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 8', function () {
        var testType1 = {
            sample1: {
                handle: function (method) {
                    return function (arg) {
                        return method(arg) + 10;
                    };
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(16);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 9', function () {
        var testType1 = {
            sample1: {
                handle: function (method) {
                    return function (arg) {
                        return method(arg) + 10;
                    };
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(15);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 10', function () {
        var testType1 = {
            sample1: {
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        /* light.advanced.test(testType1, function () {
             var test = this.serviceChain().sample2;
             var answer = test().result();
             expect(answer).toBe(undefined);
         });*/
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 11', function () {
        var testType1 = {
            sample1: {
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        /* light.advanced.test(testType1, function () {
             var test = this.serviceChain().sample2;
             var answer = test().result();
             expect(answer).toBe(undefined);
         });*/
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    light.handle("pipeRegular", function (method) {
        return method
    });

    light.handle("pipeChange", function (method) {
        return function (arg) {
            return method(arg) + 10;
        };
    });

    light.handle("pipeWrong", function (method) {
        return method() + 10;
    });

    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                handleName: "pipeRegular"
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                handleName: "pipeChange"
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(16);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                handleName: "pipeWrong"
            }
        };

        light.advanced.test(testType1, function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(undefined);
        });
        light(function () {
            var test = this.serviceChain().sample2;
            var answer = test().result();
            expect(answer).toBe(6);
        });
    });

    it('should run with service', function () {
        light.startService("sample21", function () {
            var answer = this.serviceChain().sample2().result();
            expect(answer).toBe(6);
        });
    });
    it('should run with service', function () {
        light.startService("sample22", function () {
            var answer = this.serviceChain().sample1({ x: 2, y: 3 }).result();
            expect(answer).toBe(6);
        });
    });

    it('should run with service', function () {
        light.startService("sample23", function () {
            var answer = this.serviceChain().sample1({ x: 2, y: 3 }).sample2().result();
            expect(answer).toBe(6);
        });
    });
    it('should run with service', function () {
        light.startService("sample24", function () {
            var answer = this.serviceChain().sample2().sample1({ x: 2, y: 3 }).result();
            expect(answer).toBe(6);
        });
    });

    light.service("c1", function (arg) {
        return arg.x + 2;
    });
    light.service("c2", function (arg) {
        return this.serviceChain().c1({ x: 5 + arg.y }).result();
    });
    light.service("c3", function (arg) {
        return this.serviceChain().c2({ y: arg.z }).result();
    });
    light.service("c4", function (arg) {
        return { z: arg.w };
    });
    light.service("c5", function (arg) {
        return arg;
    });
    light.service("c6", function (arg) {
        arg.x = arg.x + 100;
        return arg;
    });
    light.service("c7", function (arg) {
        arg = arg || {};
        arg.x = 1;
        arg.y = 2;
        return arg;
    });

    it('default behaviour', function () {
        light(function () {
            var answer = this.serviceChain().c1({ x: 20 }).result();
            expect(answer).toBe(22);
        });
    });
    it('simple arg passing', function () {
        light(function () {
            var answer = this.serviceChain().c5({ x: 10 }).c1().result();
            expect(answer).toBe(12);
        });
    });

    it('method can accept argument as usual', function () {
        light(function () {
            var answer = this.serviceChain().c5({ x: 10 }).c6().c1().result();
            expect(answer).toBe(112);
        });
    });
    it('previous results should be passed into new method', function () {
        light(function () {
            var answer = this.serviceChain().c7().c5().c6().c1().result();
            expect(answer).toBe(103);
        });
    });
    it('passing arg overrides previous result', function () {
        light(function (system) {
            var answer = this.serviceChain().c7().c5().c6().c1().c5({ x: 10 }).c6().c1().result();
            expect(answer).toBe(112);
        });
    });

    it('test service in a service', function () {
        var testType1 = {
            c5: {
                service: function (arg) {
                    arg.x = arg.x + 11;
                    return arg;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var answer = this.serviceChain().c7().c5().c6().c1().result();
            expect(answer).toBe(114);
        });

        light(function () {
            var answer = this.serviceChain().c7().c5().c6().c1().result();
            expect(answer).toBe(103);
        });
    });

    light.service("c8", function (arg) {
        return this.serviceChain().c7().c5().c6().result();
    });

    it('test service in a service', function () {
        var testType1 = {
            c5: {
                service: function (arg) {
                    arg.x = arg.x + 11;
                    return arg;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var answer = this.serviceChain().c8().c1().result();
            expect(answer).toBe(114);
        });

        light(function () {
            var answer = this.serviceChain().c8().c1().result();
            expect(answer).toBe(103);
        });
    });

    it('test service in a service', function () {
        var testType1 = {
            c5: {
                service: function (arg) {
                    arg.x = arg.x + 11;
                    return arg;
                }
            }
        };

        light.advanced.test(testType1, function () {
            var answer = this.serviceChain().c8().result();
            answer = this.serviceChain().c1(answer).result();
            expect(answer).toBe(114);
        });

        light(function () {
            var answer = this.serviceChain().c8().result();
            answer = this.serviceChain().c1(answer).result();
            expect(answer).toBe(103);
        });
    });

    it('test service in a service', function () {
        light.service("pass1", function (arg) {
            arg = arg || {};
            arg.x = arg.x || 0;
            arg.x++;
            return arg;
        });

        light.service("fail", function (arg) {
            throw "failure";
        });

        light.handle("pass2Pipe", function (method) {
            return function (arg) {
                var result;
                var standardResult;

                if (arg) {
                    result = method(arg);
                    standardResult = {
                        success: result ? true : false,
                        result: result,
                        exceptions: []
                    };
                } else {
                    standardResult = {
                        success: false,
                        result: null,
                        exceptions: ["error"]
                    };
                }
                return standardResult;
            };
        });

        light.service("pass2", ["pass2Pipe"], function (arg) {
            arg.x++;
            return arg;
        });

        light(function () {
            var answer = this.serviceChain().pass1().fail().pass2().result();
            expect(answer.exceptions.length).toBe(1);
        });
    });
    it('test service in a service', function () {
        light.handle("handle10", function (method) {
            return function (arg) {
                arg = arg || {};
                arg.x = arg.x || 0;
                arg.x = arg.x + 1;
                result = method(arg);
                arg.x = arg.x + 1;
                return result;
            };
        });
        light.handle("handle20", function (method) {
            return function (arg) {
                arg = arg || {};
                arg.x = arg.x || 0;
                arg.x = arg.x + 2;
                result = method(arg);
                arg.x = arg.x + 2;
                return result;
            };
        });

        light.service("pass100",
            ["handle10"],
            function (arg) {
                arg.x = arg.x + 1;
                return arg;
            });
        light.service("pass200",
            ["handle10", "handle10"],
            function (arg) {
                arg.x = arg.x + 2;
                return arg;
            });
        light.service("pass300",
            ["handle10", "handle20"],
            function (arg) {
                arg.x = arg.x + 3;
                return arg;
            });

        light(function (system) {
            var answer = this.service().pass100();
            expect(answer.x).toBe(3);

            answer = this.service().pass200();
            expect(answer.x).toBe(8);

            answer = this.serviceChain().pass300().result();
            expect(answer.x).toBe(12);

            answer = this.serviceChain().pass300().pass200().pass100().result();
            expect(answer.x).toBe(23);
        });

        light(function () {
            var answer = this.service().pass100();
            expect(answer.x).toBe(3);

            answer = this.service().pass200();
            expect(answer.x).toBe(8);

            answer = this.serviceChain().pass300().result();
            expect(answer.x).toBe(12);

            answer = this.serviceChain().pass100(this.serviceChain().pass200(this.serviceChain().pass300().result()).result()).result();
            expect(answer.x).toBe(23);
        });
    });

    it('access to other services inside a handle 1', function () {
        light.handle("haccess11", function (method) {
            return function (arg) {
                arg = this.serviceChain().haccess2(arg).result();
                result = method(arg);
                result = this.serviceChain().haccess2(result).result();
                return result;
            };
        });

        light.service("haccess2",
            function (arg) {
                arg.x = arg.x + 1;
                return arg;
            });

        light.service("haccess1",
            ["haccess11"],
            function (arg) {
                arg.x = arg.x + 10;
                return arg;
            });

        light(function () {
            var answer = this.serviceChain().haccess1({ x: 0 }).result();
            expect(answer.x).toBe(12);
        });
    });

    it('access to other services inside a handle 2', function () {
        light.handle("haccess_11", function (method) {
            return function (arg) {
                arg = this.serviceChain().haccess_2(arg).result();
                result = method(arg);
                result = this.serviceChain().haccess_2(result).result();
                return result;
            };
        });
        light.handle("haccess_22", function (method) {
            return function (arg) {
                arg.x = arg.x + 100
                result = method(arg);
                arg.x = arg.x + 100
                return result;
            };
        });

        light.service("haccess_2",
               ["haccess_22"],
            function (arg) {
                arg.x = arg.x + 1;
                return arg;
            });

        light.service("haccess_1",
            ["haccess_11"],
            function (arg) {
                arg.x = arg.x + 10;
                return arg;
            });

        light(function () {
            var answer = this.serviceChain().haccess_1({ x: 0 }).result();
            expect(answer.x).toBe(412);
        });
    });

    it('auto generate handle names', function () {
        var haccess_2;
        var haccess_1;
        var haccess_11 = light.handle(function (method) {
            return function (arg) {
                arg = this.serviceChain()[haccess_2](arg).result();
                result = method(arg);
                result = this.serviceChain()[haccess_2](result).result();
                return result;
            };
        });
        var haccess_22 = light.handle(function (method) {
            return function (arg) {
                arg.x = arg.x + 100
                result = method(arg);
                arg.x = arg.x + 100
                return result;
            };
        });

        haccess_2 = light.service("haccess_2a", [haccess_22],
           function (arg) {
               arg.x = arg.x + 1;
               return arg;
           });

        haccess_1 = light.service("haccess_1a", [haccess_11],
           function (arg) {
               arg.x = arg.x + 10;
               return arg;
           });

        expect(haccess_1).toBe("haccess_1a");
        expect(haccess_2).toBe("haccess_2a");

        light(function () {
            var answer = this.serviceChain()[haccess_1]({ x: 0 }).result();
            expect(answer.x).toBe(412);
        });
    });

    it('auto generate service names', function () {
        var haccess_2;
        var haccess_1;
        var haccess_11 = light.handle(function (method) {
            return function (arg) {
                arg = this.serviceChain()[haccess_2](arg).result();
                result = method(arg);
                result = this.serviceChain()[haccess_2](result).result();
                return result;
            };
        });
        var haccess_22 = light.handle(function (method) {
            return function (arg) {
                arg.x = arg.x + 100
                result = method(arg);
                arg.x = arg.x + 100
                return result;
            };
        });

        haccess_2 = light.service([haccess_22], function (arg) {
            arg.x = arg.x + 1;
            return arg;
        });

        haccess_1 = light.service([haccess_11], function (arg) {
            arg.x = arg.x + 10;
            return arg;
        });

        light(function () {
            var answer = this.serviceChain()[haccess_1]({ x: 0 }).result();
            expect(answer.x).toBe(412);
        });
    });

    it('auto generate service names when only method is provided', function () {
        var haccess_1;

        haccess_1 = light.service(function (arg) {
            arg.x = arg.x + 10;
            return arg;
        });

        light(function () {
            var answer = this.serviceChain()[haccess_1]({ x: 0 }).result();
            expect(answer.x).toBe(10);
        });
    });

    it('providing local temporary store', function () {
        var haccess_1;

        haccess_2 = light.service(function (arg, system, store) {
            arg = arg || {};
            arg.x = arg.x || 0;
            if (this.store.get("answer")) {
                return { x: 555 * this.store.get("answer").x };
            }

            arg.x = arg.x + 100;
            this.store.set("answer", arg);
            return this.store.get("answer");
        });
        haccess_1 = light.service(function (arg, system, store) {
            arg = arg || {};
            arg.x = arg.x || 0;
            if (this.store.get("answer")) {
                return { x: 555 * this.store.get("answer").x };
            }

            arg.x = arg.x + 10;
            this.store.set("answer", arg);
            return this.store.get("answer");
        });

        light(function () {
            expect(this.service()[haccess_1]().x).toBe(10);
            expect(this.service()[haccess_1]().x).toBe(5550);
            expect(this.service()[haccess_1]().x).toBe(5550);

            var answer = this.serviceChain()[haccess_1]().result();
            answer.x = 1;

            expect(this.serviceChain()[haccess_2]().result().x).toBe(100);
            expect(this.serviceChain()[haccess_2]().result().x).toBe(55500);
            expect(this.serviceChain()[haccess_2]().result().x).toBe(55500);

            var answer1 = this.serviceChain()[haccess_2]().result();
            answer1.x = 1;

            expect(this.serviceChain()[haccess_1]().result().x).toBe(5550);
            expect(this.serviceChain()[haccess_2]().result().x).toBe(55500);
        });

        haccess_1r = light.service(function (arg, system, store) {
            arg = arg || {};
            arg.x = arg.x || 10;
            var ref = this.store.getRef("answer");
            if (ref && ref.fn && ref.fn()) {
                return ref;
            }
            this.store.set("answer", { fn: function () { return arg; } });
            return this.store.getRef("answer");
        });
        light(function () {
            var answer = this.serviceChain()[haccess_1r]().result();
            expect(answer.fn().x).toBe(10);

            answer.fn = function () { return { x: 11 }; }

            var answer = this.serviceChain()[haccess_1r]().result();
            expect(answer.fn().x).toBe(11);
        });

        haccess_1rr = light.service(function (arg, system, store) {
            arg = arg || {};
            arg.x = arg.x || 10;
            var ref = this.store.get("answer");
            if (ref && ref.fn && ref.fn()) {
                return ref;
            }
            this.store.set("answer", { fn: function () { return arg; } });
            return this.store.get("answer");
        });
        light(function () {
            var answer = this.serviceChain()[haccess_1rr]().result();
            expect(typeof answer.fn).toBe("undefined");
        });

        haccess_1r1 = light.service(function (arg, system, store) {
            arg = arg || {};
            arg.x = arg.x || 10;
            var ref = this.store.getRef("answer");
            if (ref && ref.fn && ref.fn.arg) {
                return ref;
            }
            this.store.set("answer", { fn: { arg: arg } });
            return this.store.getRef("answer");
        });
        light(function () {
            var answer = this.serviceChain()[haccess_1r1]().result();
            expect(answer.fn.arg.x).toBe(10);

            answer.fn.arg.x = 11;

            var answer = this.serviceChain()[haccess_1r1]().result();
            expect(answer.fn.arg.x).toBe(11);
        });

        haccess_1r1r = light.service(function (arg, system, store) {
            arg = arg || {};
            arg.x = arg.x || 10;
            var ref = this.store.get("answer");
            if (ref && ref.fn && ref.fn.arg) {
                return ref;
            }
            this.store.set("answer", { fn: { arg: arg } });
            return this.store.get("answer");
        });
        light(function () {
            var answer = this.serviceChain()[haccess_1r1r]().result();
            expect(answer.fn.arg.x).toBe(10);

            answer.fn.arg.x = 11;

            var answer = this.serviceChain()[haccess_1r1r]().result();
            expect(answer.fn.arg.x).toBe(10);
        });

        var Immutable = light.Immutable;
        var map1 = Immutable.Map({ a: 1, b: 2, c: 3 });
        var map2 = map1.set('b', 50);

        expect(map1.get('b')).toBe(2);
        expect(map2.get('b')).toBe(50);
        map1 = map1.set('b', 50);
        expect(map1.get('b')).toBe(50);
    });

    it('time machine test', function () {
        var log = "";

        var service = light.service(function () {
            var i = this.store.get("i");
            i = i || 0;
            i++;
            this.store.set("i", i);
            log = log + "," + i;
            return i;
        });

        light(function () {
            this.system.startRecording();

            this.service()[service]();
            this.service()[service]();
            this.service()[service]();
            var answer = this.serviceChain()[service]().result();

            this.system.stopRecording();

            this.serviceChain().timemachine_previous()
            .timemachine_previous()
            .timemachine_previous()
            .timemachine_next()
            .timemachine_previous()
            .timemachine_next()
            .timemachine_next()
            .timemachine_previous()
            .timemachine_last();
            expect(log).toBe(",1,2,3,4,3,2,1,2,1,2,3,2,4");
            expect(answer).toBe(4);
        });
    });

    it('time machine test with message dispatcher', function () {
        var log = "";

        var service = light.receive("DELETE_USER_MESSAGE", function () {
            var i = this.store.get("i");
            i = i || 0;
            i++;
            this.store.set("i", i);
            log = log + "," + i;
        });

        light(function () {
            this.system.startRecording();

            light.send("DELETE_USER_MESSAGE");
            light.send("DELETE_USER_MESSAGE");
            light.send("DELETE_USER_MESSAGE");
            light.send("DELETE_USER_MESSAGE");

            this.system.stopRecording();

            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_next();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_next();
            this.serviceChain().timemachine_next();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_last();
            expect(log).toBe(",1,2,3,4,3,2,1,2,1,2,3,2,4");
        });
    });

    it('message dispatcher1', function () {
        var log = "";
        var data;
        light.send("ADD_USER_MESSAGE", { arg: 100 });
        var service = light.receive("ADD_USER_MESSAGE", function (arg) {
            data = arg.arg;
            var i = this.store.get("i");
            i = i || 0;
            i++;
            this.store.set("i", i);
            log = log + "," + i;
        });

        light(function () {
            this.system.startRecording();
            expect(typeof data).toBe("undefined");
            light.send("ADD_USER_MESSAGE", { arg: 200 });
            light.send("ADD_USER_MESSAGE", { arg: 300 });
            light.send("ADD_USER_MESSAGE", { arg: 400 });
            light.send("ADD_USER_MESSAGE", { arg: 500 });

            this.system.stopRecording();

            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_next();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_next();
            this.serviceChain().timemachine_next();
            this.serviceChain().timemachine_previous();
            this.serviceChain().timemachine_last();
            expect(log).toBe(",1,2,3,4,3,2,1,2,1,2,3,2,4");

            expect(data).toBe(500);
        });
    });

    it('message dispatcher - NO RECEIVERS', function () {
        light.send("NO_RECEIVERS_USER_MESSAGE", { arg: 1 });
        light.send("NO_RECEIVERS_USER_MESSAGE", { arg: 2 });
        light.send("NO_RECEIVERS_USER_MESSAGE", { arg: 3 });
        light.send("NO_RECEIVERS_USER_MESSAGE", { arg: 4 });
    });

    it('message dispatcher - NO SENDERS', function () {
        var data = 0;
        var service = light.receive("NO_SENDERS_USER_MESSAGE", function () {
            data++;
        });
        var service = light.receive("NO_SENDERS_USER_MESSAGE", function () {
            data++;
        });
        var service = light.receive("NO_SENDERS_USER_MESSAGE", function () {
            data++;
        });

        expect(data).toBe(0);
    });

    it('message dispatcher - one sender multiple receivers 1', function () {
        var data = 0;
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });
        light.send("MANY_RECEIVERS_USER_MESSAGE");
        expect(data).toBe(3);
    });

    it('message dispatcher - one sender multiple receivers 2', function () {
        var data = 0;
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });
        light.send("MANY_RECEIVERS_USER_MESSAGE");
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });

        expect(data).toBe(2);
    });

    it('message dispatcher - one sender multiple receivers 3', function () {
        var data = 0;
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });
        light.send("MANY_RECEIVERS_USER_MESSAGE");
        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });

        var service = light.receive("MANY_RECEIVERS_USER_MESSAGE", function () {
            data++;
        });

        expect(data).toBe(1);
    });

    it('can test through a broadcast', function () {
        var result;
        var testSetup = {
            fast1: {
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };
        light.service("fast1", function (arg) {
            return arg.x * arg.y;
        });
        light.receive("fast3message", function (arg) {
            result = this.service().fast1(arg);
        });
        light.receive("fast2message", function (arg) {
            light.send("fast3message", arg);
        });
        light.receive("fast2message", function (arg) {
            light.send("fast3message", arg);
        });
        light.receive("fast1message", function (arg) {
            light.send("fast2message",arg);
        });
        light.receive("fast1message", function (arg) {
            light.send("fast2message", arg);
        });

        light(function () {
            light.advanced.test(testSetup, function () {
                light.send("fast1message", { x: 3, y: 10 });
                expect(result).toBe(13);
            });
            light.send("fast1message", { x: 3, y: 10 });
            expect(result).toBe(30);
        });
    });

    /*
   it('speed', function () {
      var totalBuild = 1000;
      var answer = {};

      var a = performance.now();
      for (var i = 0; i < totalBuild; i++) {
          light.service("dynamic_" + i, function (arg) {
              arg.x = arg.x || 0;
              arg.x = arg.x + 1;
              return arg;
          });
      }
      var b = performance.now();
      console.log('It took ' + Math.floor(b - a) + ' ms to create '+totalBuild+'  services');

      var  total = 100;
       a = performance.now();
      for (var i = 0; i < total; i++) {
          light(function () {
               answer = this.serviceChain()["dynamic_" + i](answer).result();
          });
       }
       b = performance.now();
       console.log('It took ' + Math.floor(b - a) + ' ms to execute ' + total + ' in ' + totalBuild+' services');

       a = performance.now();
       light(function () {
           answer = this.serviceChain()["dynamic_0"](answer).result();
       });
       b = performance.now();
       console.log('It took ' + Math.floor(b - a) + ' ms to execute the FIRST one in ' + totalBuild + ' services');

       a = performance.now();
       light(function () {
           answer = this.serviceChain()["dynamic_" + (totalBuild - 1)](answer).result();
       });
       b = performance.now();
       console.log('It took ' + Math.floor(b - a) + ' ms to execute the LAST one in ' + totalBuild + ' services');
  });
  */
});