jest.dontMock('../src/lightservice');
var light = require('../src/lightservice') || light;
var __haccess_11=light.handle(function (method) {
    return function (arg) {
        arg = this.serviceChain()["__haccess_2"](arg).result();
        result = method(arg);
        result = this.serviceChain()["__haccess_2"](result).result();
        return result;
    };
});
 var __haccess_22= light.handle(function (method) {
    return function (arg) {
        arg.x = arg.x + 1000
        result = method(arg);
        arg.x = arg.x + 1000
        return result;
    };
});

 light.service("__haccess_2", [__haccess_22], function (arg) {
    arg.x = arg.x + 1;
    return arg;
});

 light.service("loadedService", [__haccess_11], function (arg) {
    arg.x = arg.x + 10;
    return arg;
});