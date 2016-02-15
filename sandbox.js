var log = "";
light(function () {
    this.system.startRecording();
});
light.handle("addOne", function (definition) {
});
//0
light.service("doubler", function (arg) {
    log += ",0";
    return arg * 2;
});

//1
light.receive("message", function (message) {
    log += ",1";
    var data1 = this.store.get("arg");
    console.log(data1);
    this.store.set("arg", 100)
    var data2 = this.store.get("arg");
    console.log(data2);

    console.log(this.arg);

    // return this.service().doubler(message);
});
//2
light.receive("message", function (message) {
    log += ",2";
    var data1 = this.store.get("arg");
    console.log(data1);
    this.store.set("arg", 200)
    var data2 = this.store.get("arg");
    console.log(data2);

    console.log(this.arg);

    return this.service().doubler(message);
});

//3
light(function () {
    var data1 = this.store.get("arg");
    console.log(data1);
    this.store.set("arg", 100)
    var data2 = this.store.get("arg");
    console.log(data2);

    console.log(this.arg);

    var data3 = light.send("message", 123);

    console.log(data3);
});
//4
light(function () {
    var data1 = this.store.get("arg");
    console.log(data1);
    this.store.set("arg", 200)
    var data2 = this.store.get("arg");
    console.log(data2);

    console.log(this.arg);

    var data3 = light.send("message", 456);

    console.log(data3);
});

light(function () {
    this.system.stopRecording();
});

light(function () {
    log += "|";

    this.service().timemachine_last();
    this.service().timemachine_previous();
    this.service().timemachine_previous();
    this.service().timemachine_previous();
    this.service().timemachine_previous();
    this.service().timemachine_previous();

    console.log(log);
});