jest.dontMock('../lib/js/immutable.min');
jest.dontMock('../__tests__/sandbox_tests');
var Immutable = require('../lib/js/immutable.min');
if (!Immutable) {
    throw "Immutable JS not found"
} else {
    console.info("Testing With Immutable JS");
}

console.info("using immutable JS");
require('../__tests__/sandbox_tests');

