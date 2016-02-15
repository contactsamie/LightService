
light.handle("validator", function (definition) {
  
});
light.service("doubler", function (arg) {
    return arg * 2;
});


light.receive("message", function (message) {
    var data1 = this.stor.get("arg");
    console.log(data1);
    this.store.set("arg", 100)
    var data2 = this.stor.get("arg");
    console.log(data2);

    console.log(this.arg);

    this.service().doubler(message);
});

light.receive("message", function (message) {
    var data1 = this.stor.get("arg");
    console.log(data1);
    this.store.set("arg", 100)
    var data2 = this.stor.get("arg");
    console.log(data2);

    console.log(this.arg);

    this.service().doubler(message);
});


light(function () {
    var data1 = this.stor.get("arg");
    console.log(data1);
    this.store.set("arg", 100)
    var data2 = this.stor.get("arg");
    console.log(data2);

    console.log(this.arg);

    light.send("message", 123);
});
light(function () {
    var data1 = this.stor.get("arg");
    console.log(data1);
    this.store.set("arg", 100)
    var data2 = this.stor.get("arg");
    console.log(data2);

    console.log(this.arg);

    light.send("message", 123);
});