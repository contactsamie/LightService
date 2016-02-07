describe('light used in the dom', function () {
    it('load file sync', function () {
        light.service("load.js").load();

        light(function (service) {
            var answer = service.loadedService({ x: 0 }).result();
            expect(answer.x).toBe(4012);
        });
        light(function (service) {
            var answer = this.loadedService({ x: 0 });
            expect(answer.x).toBe(4012);
        });
    });
    it('load file async', function () {
        light.service("load.js").load(function () {
            light(function (service) {
                var answer = service.loadedService({ x: 0 }).result();
                expect(answer.x).toBe(4012);
            });
            light(function (service) {
                var answer = this.loadedService({ x: 0 });
                expect(answer.x).toBe(4012);
            });
        });
    });
    it('load file async', function () {
        light.service("load.js").load(function (service) {
            var answer = service.loadedService({ x: 0 }).result();
            expect(answer.x).toBe(4012);
            var answer = this.loadedService({ x: 0 });
            expect(answer.x).toBe(4012);
        });
    });

    it('visualize calls', function () {
        light(function (service) {
            service.visual();
        });
    });
});