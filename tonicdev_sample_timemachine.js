var light = require("lightservice");
require("lightservice-timemachine");

light(function () { this.system.startRecording(); });

light.service("double", function (arg) {
    console.log("running double");
    arg = arg || 0;
    return arg * 2;
});
light.service("lastResult", function (arg) {
    console.log("running lastResult");
    if (arg) {
        this.store.set("result", arg);
    }
    console.log(arg);
    return this.store.get("result");
});
light.service("square", function (arg) {
    console.log("running square");
    arg = arg || 0;
    var result = arg * arg;
    this.service.lastResult(result);
    return result;
});

light.receive("CALCULATION_STARTED", function () {
    console.log("receiving CALCULATION_STARTED");
});
light.receive("CALCULATION_ENDED", function (arg) {
    console.log("receiving CALCULATION_ENDED");
    result1 = arg;
    result2 = this.service.lastResult().result()
    console.log("calculation ended as " + result2);
    console.log("and I received a last result of " + arg);
});




light(function () {
    light.send("CALCULATION_STARTED");
    var result = this.service.double(10).lastResult().square().result()
    light.send("CALCULATION_ENDED", result);

});
light(function () {
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    light.send("CALCULATION_ENDED");
});

