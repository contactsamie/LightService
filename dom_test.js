
describe('light used in the dom', function () {
    it('load file sync', function () {
        light.service("__tests__/load.js").load();

        light(function () {
            var answer = this.service.loadedService({ x: 0 }).result();
            expect(answer.x).toBe(4012);
        });
        light(function () {
            var answer = this.service.loadedService({ x: 0 }).result();
            expect(answer.x).toBe(4012);
        });
    });
    it('load file async', function () {
        light.service("__tests__/load.js").load(function () {
            light(function (service) {
                var answer = this.service.loadedService({ x: 0 }).result();
                expect(answer.x).toBe(4012);
            });
            light(function () {
                var answer = this.service.loadedService({ x: 0 }).result();
                expect(answer.x).toBe(4012);
            });
        });
    });
    it('load file async', function () {
        light.service("__tests__/load.js").load(function (service) {
            var answer = this.service.loadedService({ x: 0 }).result();
            expect(answer.x).toBe(4012);
            var answer = this.service.loadedService({ x: 0 }).result();
            expect(answer.x).toBe(4012);
        });
    });

    it('visualize calls', function () {
        light(function () {
            this.service.visual();
        });
    });
});