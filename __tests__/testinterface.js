

var jest = jest || { dontMock: function () { } };
var require = require || function () {   };
var describe = describe || function (o, f) {
    describe.o = o;
    f();

};
var it = it || function (o, f) {
    it.o = o;
    it.f = f;
    f();
};

var expect = expect || function (a) {

    return {
        toBe: function (b) {
            console.warn("expecting " + a + " to be " + b);
            if (a !== b) {
                console.error(describe.o);
                console.error(it.o);
                console.error(it.f);
                console.error("expected " + a + " to be " + b);
            } else {
                console.warn("SUCCESS");
            }

        }
    };
};
    