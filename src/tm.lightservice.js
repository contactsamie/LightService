var light = ((typeof require !== "undefined") && require('../src/lightservice')) || light;
light.service("timemachine_next", function (arg) {
    var records = this.service.timemachine_record().result();
    var recordLength = records.length;
    var pointer = this.service.timemachine_pointer().result();
    pointer = pointer - 2;
    this.service.timemachine_pointer(pointer);

    pointer === -1 ? this.current() : light.advanced.play(records, recordLength - (1 + pointer), recordLength - pointer);
});
light.service("timemachine_previous", function (arg) {
    var records = this.service.timemachine_record().result();
    var recordLength = records.length;
    var pointer = this.service.timemachine_pointer().result();
    pointer = pointer + 2;
    this.service.timemachine_pointer(pointer);

    pointer >= recordLength ? this.current() : light.advanced.play(records, recordLength - (1 + pointer), recordLength - pointer);
});
light.service("timemachine_current", function (arg) {
    var records = this.service.timemachine_record().result();
    var recordLength = records.length;
    this.service.timemachine_pointer(-1);

    light.advanced.play(records, recordLength - 2, recordLength - 1);
});

light.service("timemachine_play", function (arg) {
    var records = this.service.timemachine_record().result();
    light.advanced.play(records, arg.i, arg.j)
});

light.service("timemachine_getLastRecord", function (p) {
    var records = this.service.timemachine_record().result();
    return records.length ? records[records.length - 1] : [];
});

light.service("timemachine_getRecord", function (i) {
    return this.service.timemachine_record().result()[i];
});

light.service("timemachine_pointer", function (p) {
    var pointer = this.state.get("pointer") || -1;
    if (p) {
        this.state.set("pointer", p);
        return p;
    } else {
        return pointer;
    }
});

light.service("timemachine_record", function (record) {
    var records = this.state.get("records") || [];
    if (record) {
        records.push(record);
        this.state.set("records", records);
        return records;
    } else {
        return records;
    }
});

light.onSystemRecordEvent(function (e) {
    light(function () {
        this.system.stopRecording();
        this.service.timemachine_record(JSON.parse(e));
        this.system.startRecording();
    });
});
var timemachine = {};

if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = timemachine;
}

if (typeof define === 'function' && define.amd) {
    define('light', [], function () { return timemachine; });
}