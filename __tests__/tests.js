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

light.service("test", function (arg, service) { });
light.service("test-2", function (arg, service) { });
light.service("test-2b2", function (arg, service) { });
light.service("test_error", function (arg, service) { throw "error occured"; });
light.service("sample1", function (arg, service) { return arg.x * arg.y; });
light.service("sample2", function (arg, service) {
    return this.sample1({ x: 2, y: 3 });
});

describe('light', function () {
    it('recording history', function () {
        var haccess_1;

        haccess_1 = light.service(function (arg, service, system) {
            arg.x = arg.x + 10;
            return arg;
        });

        light(function (service, system) {
            system.recordStart();
            var answer = service[haccess_1]({ x: 0 }).result();
            console.log(system.getAllRecords());
            system.play(0, 1);
            console.log(system.getAllRecords());
            expect(answer.x).toBe(10);
        });
    });

    it('exists', function () {
        expect(light.version).toBe(1);
    });

    it('using new api', function () {
        light(function (service) {
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
            //expect(this.sample1.before).toBe(undefined);
            //expect(this.sample1.error).toBe(undefined);
            //expect(this.sample1.after).toBe(undefined);

            return this.sample1({ x: 2, y: 3 });
        });

        light(function (service) {
            this.sample_no_event();
        });
    });

    it('should allow event subscription - forEachSubscriber', function () {
        light.startService("test-2", function (service) {
            var test = this["test-2"];

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
        light.startService("test", function (service) {
            var test = this.test;
            expect(test.me).toBe("test");
            expect(test.position).toBe(1);
        });
    });

    it('should allow event subscription 1', function () {
        light.startService("test", function (service) {
            var test = this.test;
            var path = [];
            test.before(function () { path.push("before"); });
            test();
            expect(path[0]).toBe("before");
            expect(path.length).toBe(1);
        });
    });
    it('should allow event subscription 2', function () {
        light.startService("test", function (service, system) {
            var test = this.test;
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
        light.startService("test", function (service) {
            var test = this.test;
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
        light.startService("test-2b2", function (service) {
            var test = this["test-2b2"];
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
        light.startService("test", function (service) {
            var test = this.test;
            var path = [];
            test.error(function () { path.push("error"); });
            test();
            expect(path.length).toBe(0);
        });
    });

    it('should allow event subscription 5', function () {
        light.startService("test", function (service) {
            var test = this.test;
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
        light.startService("test_error", function (service) {
            var test = this["test_error"];
            var path = [];
            test.error(function () { path.push("error"); });
            test();
            expect(path.length).toBe(1);
        });
    });

    it('should allow event subscription 6', function () {
        light.startService("test_error", function (service) {
            var test = this["test_error"];
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
        light.startService("sample2", function (service) {
            var test = this.sample2;
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
        light.startService("sample1", function (service) {
            var test = this.sample1;
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

    var testObj = {
        sample1: {
            handleName: undefined,
            service: function (arg) {
                return arg.x + arg.y;
            }
        }
    };
    it('native tests', function () {
        light(function (service) {
            light.advance.serviceTest(testObj, function (service) {
                var test = this.sample2;
                var path = [];
                test.before(function () { path.push("before"); });
                test.after(function () { path.push("after"); });
                test.error(function (o) { path.push("error"); console.log(o); });
                var answer = test();
                expect(path[0]).toBe("before");
                expect(path[1]).toBe("after");
                expect(path.length).toBe(2);
                expect(answer).toBe(5);
            });
        });
    });

    it('native tests 2', function () {
        light(function (service) {
            light.advance.serviceTest(testObj, function (service) {
                var test = this.sample2;
                var answer = test();
                expect(answer).toBe(5);
            });
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('native tests 2', function () {
        light.advance.serviceTest(testObj, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('native tests pipes 1', function () {
        var testType1 = {
            sample1: {
                handle: function (definition) {
                    return definition;
                },
                //handleName: "testType1",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 1', function () {
        var testType1 = {
            sample1: {
                handle: function (definition) {
                    return definition;
                },
                //handleName: "testType1", CAN USE DEFAULT PIPE
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.serviceTest(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 2', function () {
        var testType1 = {
            sample1: {
                handle: function (definition) {
                    return definition;
                },
                //handleName: "testType2",
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
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

        light.advance.serviceTest(testType1, function () {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
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

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
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

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(5);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 6', function () {
        var testType1 = {
            sample1: {
                handle: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(15);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 7', function () {
        var testType1 = {
            sample1: {
                handle: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                }
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(16);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 8', function () {
        var testType1 = {
            sample1: {
                handle: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                }
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(16);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 9', function () {
        var testType1 = {
            sample1: {
                handle: function (definition) {
                    return function (arg) {
                        return definition(arg) + 10;
                    };
                },
                service: function (arg) {
                    return arg.x + arg.y;
                }
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(15);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
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

        /* light.advance.serviceTest(testType1, function (service) {
             var test = this.sample2;
             var answer = test();
             expect(answer).toBe(undefined);
         });*/
        light(function (service) {
            var test = this.sample2;
            var answer = test();
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

        /* light.advance.serviceTest(testType1, function (service) {
             var test = this.sample2;
             var answer = test();
             expect(answer).toBe(undefined);
         });*/
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    light.handle("pipeRegular", function (definition) {
        return definition
    });

    light.handle("pipeChange", function (definition) {
        return function (arg) {
            return definition(arg) + 10;
        };
    });

    light.handle("pipeWrong", function (definition) {
        return definition() + 10;
    });

    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                handleName: "pipeRegular"
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                handleName: "pipeChange"
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(16);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('can use default function pipe 12', function () {
        var testType1 = {
            sample1: {
                handleName: "pipeWrong"
            }
        };

        light.advance.serviceTest(testType1, function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(undefined);
        });
        light(function (service) {
            var test = this.sample2;
            var answer = test();
            expect(answer).toBe(6);
        });
    });

    it('should run with service', function () {
        light.startService("sample21", function (service) {
            var answer = service.sample2().result();
            expect(answer).toBe(6);
        });
    });
    it('should run with service', function () {
        light.startService("sample22", function (service) {
            var answer = service.sample1({ x: 2, y: 3 }).result();
            expect(answer).toBe(6);
        });
    });

    it('should run with service', function () {
        light.startService("sample23", function (service) {
            var answer = service.sample1({ x: 2, y: 3 }).sample2().result();
            expect(answer).toBe(6);
        });
    });
    it('should run with service', function () {
        light.startService("sample24", function (service) {
            var answer = service.sample2().sample1({ x: 2, y: 3 }).result();
            expect(answer).toBe(6);
        });
    });

    light.service("c1", function (arg, service) {
        return arg.x + 2;
    });
    light.service("c2", function (arg, service) {
        return this.c1({ x: 5 + arg.y });
    });
    light.service("c3", function (arg, service) {
        return service.c2({ y: arg.z }).result();
    });
    light.service("c4", function (arg, service) {
        return { z: arg.w };
    });
    light.service("c5", function (arg, service) {
        return arg;
    });
    light.service("c6", function (arg, service) {
        arg.x = arg.x + 100;
        return arg;
    });
    light.service("c7", function (arg, service) {
        arg = arg || {};
        arg.x = 1;
        arg.y = 2;
        return arg;
    });

    it('default behaviour', function () {
        light(function (service) {
            var answer = service.c1({ x: 20 }).result();
            expect(answer).toBe(22);
        });
    });
    it('simple arg passing', function () {
        light(function (service) {
            var answer = service.c5({ x: 10 }).c1().result();
            expect(answer).toBe(12);
        });
    });

    it('method can accept argument as usual', function () {
        light(function (service) {
            var answer = service.c5({ x: 10 }).c6().c1().result();
            expect(answer).toBe(112);
        });
    });
    it('previous results should be passed into new method', function () {
        light(function (service) {
            var answer = service.c7().c5().c6().c1().result();
            expect(answer).toBe(103);
        });
    });
    it('passing arg overrides previous result', function () {
        light(function (service, system) {
            var answer = service.c7().c5().c6().c1().c5({ x: 10 }).c6().c1().result();
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

        light.advance.serviceTest(testType1, function (service) {
            var answer = service.c7().c5().c6().c1().result();
            expect(answer).toBe(114);
        });

        light(function (service) {
            var answer = service.c7().c5().c6().c1().result();
            expect(answer).toBe(103);
        });
    });

    light.service("c8", function (arg, service) {
        return service.c7().c5().c6().result();
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

        light.advance.serviceTest(testType1, function (service) {
            var answer = service.c8().c1().result();
            expect(answer).toBe(114);
        });

        light(function (service) {
            var answer = service.c8().c1().result();
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

        light.advance.serviceTest(testType1, function (service) {
            var answer = this.c8();
            answer = this.c1(answer);
            expect(answer).toBe(114);
        });

        light(function (service) {
            var answer = this.c8();
            answer = this.c1(answer);
            expect(answer).toBe(103);
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
            light(function (service) {
                 answer = service["dynamic_" + i](answer).result();
            });
         }
         b = performance.now();
         console.log('It took ' + Math.floor(b - a) + ' ms to execute ' + total + ' in ' + totalBuild+' services');

         a = performance.now();
         light(function (service) {
             answer = service["dynamic_0"](answer).result();
         });
         b = performance.now();
         console.log('It took ' + Math.floor(b - a) + ' ms to execute the FIRST one in ' + totalBuild + ' services');

         a = performance.now();
         light(function (service) {
             answer = service["dynamic_" + (totalBuild - 1)](answer).result();
         });
         b = performance.now();
         console.log('It took ' + Math.floor(b - a) + ' ms to execute the LAST one in ' + totalBuild + ' services');
    });
    */

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

        light.handle("pass2Pipe", function (definition) {
            return function (arg) {
                var result;
                var standardResult;

                if (arg) {
                    result = definition(arg);
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

        light(function (service) {
            var answer = service.pass1().fail().pass2().result();
            expect(answer.exceptions.length).toBe(1);
        });
    });
    it('test service in a service', function () {
        light.handle("handle10", function (definition) {
            return function (arg) {
                arg = arg || {};
                arg.x = arg.x || 0;
                arg.x = arg.x + 1;
                result = definition(arg);
                arg.x = arg.x + 1;
                return result;
            };
        });
        light.handle("handle20", function (definition) {
            return function (arg) {
                arg = arg || {};
                arg.x = arg.x || 0;
                arg.x = arg.x + 2;
                result = definition(arg);
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

        light(function (service, system) {
            var answer = service.pass100().result();
            expect(answer.x).toBe(3);

            answer = service.pass200().result();
            expect(answer.x).toBe(8);

            answer = service.pass300().result();
            expect(answer.x).toBe(12);

            answer = service.pass300().pass200().pass100().result();
            expect(answer.x).toBe(23);
        });

        light(function (service) {
            var answer = this.pass100();
            expect(answer.x).toBe(3);

            answer = this.pass200();
            expect(answer.x).toBe(8);

            answer = this.pass300();
            expect(answer.x).toBe(12);

            answer = this.pass100(this.pass200(this.pass300()));
            expect(answer.x).toBe(23);
        });
    });

    it('access to other services inside a handle 1', function () {
        light.handle("haccess11", function (definition) {
            return function (arg) {
                arg = this.haccess2(arg);
                result = definition(arg);
                result = this.haccess2(result);
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

        light(function (service) {
            var answer = service.haccess1({ x: 0 }).result();
            expect(answer.x).toBe(12);
        });
    });

    it('access to other services inside a handle 2', function () {
        light.handle("haccess_11", function (definition) {
            return function (arg) {
                arg = this.haccess_2(arg);
                result = definition(arg);
                result = this.haccess_2(result);
                return result;
            };
        });
        light.handle("haccess_22", function (definition) {
            return function (arg) {
                arg.x = arg.x + 100
                result = definition(arg);
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

        light(function (service) {
            var answer = service.haccess_1({ x: 0 }).result();
            expect(answer.x).toBe(412);
        });
    });

    it('auto generate handle names', function () {
        var haccess_2;
        var haccess_1;
        var haccess_11 = light.handle(function (definition) {
            return function (arg) {
                arg = this[haccess_2](arg);
                result = definition(arg);
                result = this[haccess_2](result);
                return result;
            };
        });
        var haccess_22 = light.handle(function (definition) {
            return function (arg) {
                arg.x = arg.x + 100
                result = definition(arg);
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

        light(function (service) {
            var answer = service[haccess_1]({ x: 0 }).result();
            expect(answer.x).toBe(412);
        });
    });

    it('auto generate service names', function () {
        var haccess_2;
        var haccess_1;
        var haccess_11 = light.handle(function (definition) {
            return function (arg) {
                arg = this[haccess_2](arg);
                result = definition(arg);
                result = this[haccess_2](result);
                return result;
            };
        });
        var haccess_22 = light.handle(function (definition) {
            return function (arg) {
                arg.x = arg.x + 100
                result = definition(arg);
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

        light(function (service) {
            var answer = service[haccess_1]({ x: 0 }).result();
            expect(answer.x).toBe(412);
        });
    });

    it('auto generate service names when only definition is provided', function () {
        var haccess_1;

        haccess_1 = light.service(function (arg) {
            arg.x = arg.x + 10;
            return arg;
        });

        light(function (service) {
            var answer = service[haccess_1]({ x: 0 }).result();
            expect(answer.x).toBe(10);
        });
    });

    it('providing local temporary state', function () {
        var haccess_1;

        haccess_2 = light.service(function (arg, service, system, state) {
            arg = arg || {};
            arg.x = arg.x || 0;
            if (state.get("answer")) {
                return { x: 555 * state.get("answer").x };
            }

            arg.x = arg.x + 100;
            state.set("answer", arg);
            return state.get("answer");
        });
        haccess_1 = light.service(function (arg, service, system, state) {
            arg = arg || {};
            arg.x = arg.x || 0;
            if (state.get("answer")) {
                return { x: 555 * state.get("answer").x };
            }

            arg.x = arg.x + 10;
            state.set("answer", arg);
            return state.get("answer");
        });

        haccess_2r = light.service(function (arg, service, system, state) {
            arg = arg || {};
            arg.x = arg.x || 0;
            if (state.getRef("answer")) {
                return { x: 555 * state.getRef("answer").x };
            }

            arg.x = arg.x + 100;
            state.setRef("answer", arg);
            return state.getRef("answer");
        });
        haccess_1r = light.service(function (arg, service, system, state) {
            arg = arg || {};
            arg.x = arg.x || 0;
            if (state.getRef("answer")) {
                return { x: 555 * state.getRef("answer").x };
            }

            arg.x = arg.x + 10;
            state.setRef("answer", arg);
            return state.getRef("answer");
        });

        light(function (service) {
            expect(this[haccess_1]().x).toBe(10);
            expect(this[haccess_1]().x).toBe(5550);
            expect(this[haccess_1]().x).toBe(5550);

            var answer = this[haccess_1]();
            answer.x = 1;

            expect(this[haccess_2]().x).toBe(100);
            expect(this[haccess_2]().x).toBe(55500);
            expect(this[haccess_2]().x).toBe(55500);

            var answer1 = this[haccess_2]();
            answer1.x = 1;

            expect(this[haccess_1]().x).toBe(5550);
            expect(this[haccess_2]().x).toBe(55500);
        });


        var Immutable = light.Immutable;
        var map1 = Immutable.Map({ a: 1, b: 2, c: 3 });
        var map2 = map1.set('b', 50);
        console.log(map1.get('b')); // 2
        console.log(map2.get('b')); // 50
        map1 = map1.set('b', 50);
        console.log(map1.get('b')); // 50


    });
});