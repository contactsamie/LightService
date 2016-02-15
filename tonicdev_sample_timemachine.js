var light = require('lightservice');
require("lightservice-timemachine");

var log = [];
light(function () {
    this.system.startRecording();
    log.push("recording started");
});

light.service("first", function (arg) {
    log.push("running first " + arg);
});
light.service("second", function (arg) {
    if (!this.store.get("arg")) {
        this.store.set("arg", arg);
    } else {
        arg = this.store.get("arg");
    }
    log.push("running second " + arg);
});
light.service("third", function (arg) {
    log.push("running third " + arg);
});
light.receive("FORTH", function (arg) {
    log.push("receiving forth " + arg);
});
light.receive("END", function () {
    log.push("ENDING ");
});

light(function () {
    light.send("FORTH", 4);
    this.service.first(1).second(2).third(3);
    light.send("END", 44);
});
light(function () {
    this.system.stopRecording();
    log.push("recording ended");
});
light(function () {
    log.push("playback starting");
    this.service.timemachine_last();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_previous();
    this.service.timemachine_next();
    this.service.timemachine_next();
    this.service.timemachine_next();
    this.service.timemachine_next();
    this.service.timemachine_first();
    this.service.timemachine_next();
    this.service.timemachine_next();
    this.service.timemachine_next();
    this.service.timemachine_next();
    log.push("playback ended");
    console.log(log);
});