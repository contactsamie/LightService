var __haccess_11=light.handle(function (definition) {
    return function (arg) {
        arg = this["__haccess_2"](arg);
        result = definition(arg);
        result = this["__haccess_2"](result);
        return result;
    };
});
 var __haccess_22= light.handle(function (definition) {
    return function (arg) {
        arg.x = arg.x + 1000
        result = definition(arg);
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