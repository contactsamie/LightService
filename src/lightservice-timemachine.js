var light = require('../src/lightservice') || light;
 
var timemachine= (function () {
    light.service("timemachine_next", function (arg) {
        var records = this.serviceChain().timemachine_record().result();
        var pointer = this.serviceChain().timemachine_pointer().result();
        pointer = pointer - 2;
        this.serviceChain().timemachine_pointer(pointer).result();

        pointer === -1 ? this.serviceChain().timemachine_last().result() : this.serviceChain().timemachine_point(pointer).result();
    });
    light.service("timemachine_previous", function (arg) {
        var records = this.serviceChain().timemachine_record().result();
        var recordLength = records.length;
        var pointer = this.serviceChain().timemachine_pointer().result();
        pointer = pointer + 2;
        this.serviceChain().timemachine_pointer(pointer).result();

        pointer >= recordLength ? this.serviceChain().timemachine_first().result() : this.serviceChain().timemachine_point(pointer).result();
    });

    light.service("timemachine_point", function (pointer) {
        this.serviceChain().timemachine_pointer(pointer).result();
        var records = this.serviceChain().timemachine_record().result();
        var recordLength = records.length;
        light.advanced.play(records, recordLength - (1 + pointer), recordLength - pointer);
    });

    light.service("timemachine_last", function (arg) {
        var records = this.serviceChain().timemachine_record().result();
        var recordLength = records.length;
        this.serviceChain().timemachine_pointer(1).result();
        var pointer = this.serviceChain().timemachine_pointer().result();
        light.advanced.play(records, recordLength - (1 + pointer), recordLength - pointer);
    });
    light.service("timemachine_first", function (arg) {
        var records = this.serviceChain().timemachine_record().result();
        var recordLength = records.length;
        this.serviceChain().timemachine_pointer(recordLength - 1).result();
        var pointer = this.serviceChain().timemachine_pointer().result();
        light.advanced.play(records, recordLength - (1 + pointer), recordLength - pointer);
    });

    light.service("timemachine_play", function (arg) {
        var records = this.serviceChain().timemachine_record().result();
        light.advanced.play(records, arg.i, arg.j)
    });

    light.service("timemachine_getLastRecord", function (p) {
        var records = this.serviceChain().timemachine_record().result();
        return records.length ? records[records.length - 1] : [];
    });

    light.service("timemachine_getRecord", function (i) {
        return this.serviceChain().timemachine_record().result()[i];
    });

    light.ServiceDataObject("timemachine_pointer", 1);

    light.ServiceDataList("timemachine_record");

    light.onSystemRecordEvent(function (e) {
        light(function () {
            this.serviceChain().timemachine_record(JSON.parse(e));
        });
    });

})();
    if (typeof module !== "undefined" && ('exports' in module)) {
        module.exports = timemachine;
    }

    if (typeof define === 'function' && define.amd) {
        define('light', [], function () { return timemachine; });
    }
