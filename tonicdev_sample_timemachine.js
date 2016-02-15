var light = require("lightservice") || light;
require("lightservice-timemachine");

light(function () {
    this.system.startRecording();
});

light.service("first", function (arg) {
    console.log("running first " + arg);
});
light.service("second", function (arg) {
    if (!this.store.get("arg")) {
        this.store.set("arg", arg);
    } else {
        arg = this.store.get("arg");
    }
    console.log("running second " + arg);
});
light.service("third", function (arg) {
    console.log("running third " + arg);
});
light.receive("FORTH", function (arg) {
    console.log("receiving forth " + arg);
});
light.receive("END", function () {
    console.log("ENDING ");
});

light(function () {
    light.send("FORTH", 4);
    this.service.first(1).second(2).third(3);
    light.send("END", 44);
});
light(function () {
    this.system.stopRecording();
});
light(function () {
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
});