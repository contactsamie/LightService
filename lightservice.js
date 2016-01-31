//var q = require("q");

var light = (function () {
    var GLOBAL = {};
    GLOBAL.players = {};
    GLOBAL.playersDef = [];
    GLOBAL.eventSubscribers = {};
    GLOBAL.system = {};
    GLOBAL.utility = {};
    GLOBAL.utility.execSurpressError = function (o, e, context, notificationInfo) {
        self["event"].notify(e, context, notificationInfo);
        if (typeof o === "function") {
            try { o(e, context, notificationInfo); } catch (ex) {
            }
        }
    };
    GLOBAL.utility.tryCatch = function (context, f, success, error) {
        try {
            var result = f();
            GLOBAL.utility.execSurpressError(function () {
                success(result, context);
            }, null, context, "trying-service");
        } catch (e) {
            GLOBAL.utility.execSurpressError(function () {
                error(e, context);
            }, e, context, "service-throws");
        }
    };

    GLOBAL.servicePipes = [];

    var setUpEventSubscriberBase = function (name, id, o) {
        setUpEventSubscriberBase.ref = setUpEventSubscriberBase.ref || 0;
        setUpEventSubscriberBase.ref++;
        GLOBAL.eventSubscribers[id] = GLOBAL.eventSubscribers[id] || {};
        GLOBAL.eventSubscribers[id].sub = GLOBAL.eventSubscribers[id].sub || [];
        GLOBAL.eventSubscribers[id].sub.push({
            service: o,
            ref: setUpEventSubscriberBase.ref
        });
        return setUpEventSubscriberBase.ref;
    };
    var createEventEmitter = function (name, id, f) {
        GLOBAL.eventSubscribers[id] = GLOBAL.eventSubscribers[id] || {};
        GLOBAL.eventSubscribers[id].sub = GLOBAL.eventSubscribers[id].sub || [];
        GLOBAL.eventSubscribers[id].notify = GLOBAL.eventSubscribers[id].notify || function (o, context, notificationType) {
            var _id = id;
            var l = GLOBAL.eventSubscribers[_id].sub.length;
            for (var i = 0; i < l; i++) {
                var item = GLOBAL.eventSubscribers[_id].sub[i];
                var notificationInfo = {
                    index: i,
                    notificationType: notificationType
                };
                f(item, o, context, notificationInfo);
            }
        };
    };
    var setUpNotification = function (name, id) {
        return createEventEmitter(name, id, function (item, o, context, notificationInfo) {
            GLOBAL.utility.tryCatch(context, function () { return item.service(); }, function () { }, function () { GLOBAL.utility.execSurpressError(item.service.error, o, context, notificationInfo); });
        });
    };
    var setUpSystemEventSubscriptionFx = function (name, that, id) {
        that[name] = function (e) {
            setUpEventSubscriberBase(name, id, e);
        };
        createEventEmitter(name, id, function (item, o, context, notificationInfo) {
            if (typeof item === "function") {
                try { item(o, context, notificationInfo) } catch (e) { }
            }
        });
    };
    var setUpSystemEvent = function (that, event, name) {
        setUpSystemEventSubscriptionFx(event, that, name + "." + event);
        that[event].notify = GLOBAL.eventSubscribers[name + "." + event].notify;
    };
    var setUpServiceEvent = function (that, event, name) {
        var id = name + "." + event;
        that[event] = function (o) {
            return setUpEventSubscriberBase(name, id, o);
        };
        that[event].forEachSubscriber = that[event].forEachSubscriber || function (f) {
            var l = GLOBAL.eventSubscribers[id].sub.length;
            for (var i = 0; i < l; i++) {
                var item = GLOBAL.eventSubscribers[id].sub[i];
                f && f(item);
            }
        };
        setUpNotification(name, id);
        that[event].notify = GLOBAL.eventSubscribers[id].notify;
    };

    var whois = function (name) {
        var item = GLOBAL.players[name];
        return item;
    };

    /*
     !!!!!!!!!!!!!!!!
    */

    var createServiceDefinitionFromSuppliedFn = function (context, whois, definitionOrDefinitionType, definition, name) {
        setUpServiceEvent(whois, "before", name);
        setUpServiceEvent(whois, "after", name);
        setUpServiceEvent(whois, "error", name);
        setUpServiceEvent(whois, "success", name);

        return function (arg, callerContext) {
            var result;
            context.callerContext = callerContext;
            GLOBAL.utility.tryCatch(context, function () { return whois["before"].notify(); }, function () { }, function () { });

            GLOBAL.utility.tryCatch(context, function () {
                var tmpDefinition;
                var selectedPipe = "none";

                var length = GLOBAL.servicePipes.length;
                for (var j = 0; j < length; j++) {
                    var pipe = GLOBAL.servicePipes[j];

                    if (definition && definitionOrDefinitionType) {
                        if (pipe.name === definitionOrDefinitionType) {
                            tmpDefinition = pipe.definition.call(GLOBAL.system, definition);
                            selectedPipe = pipe.name;
                            break;
                        }
                    } else {
                        if (pipe.condition.call(GLOBAL.system, definitionOrDefinitionType)) {
                            tmpDefinition = pipe.definition.call(GLOBAL.system, definitionOrDefinitionType);
                            selectedPipe = pipe.name;
                            break;
                        }
                    }
                }

                tmpDefinition = typeof tmpDefinition === "function" ? tmpDefinition : function () { };

                GLOBAL.system["$$currentContext"] = {
                    servicePipes: GLOBAL.servicePipes,
                    definition: definition,
                    serviceName: name,
                    pipeName: selectedPipe,
                    arg: arg
                };

                result = tmpDefinition.call(GLOBAL.system, arg);
                return result;
            }, function (o) {
                return whois["success"].notify(o, context, "service-success");
            }, function (o) {
                return whois["error"].notify(o, context, "service-error");
            });

            GLOBAL.utility.tryCatch(context, function () { return whois["after"].notify(); }, function () { }, function () { });
            return result;
        }
    };

    var service = function (name, definitionOrDefinitionType, definition) {
        var context = {
            name: name, step: function (o) {
                self["event"].notify(name, context, "service-call");
                this.steps.push(o);
            },
            steps: []
        };
        var whois = function (arg) {
            arg = arg || {};
            return whois.redefinition(arg);
        };
        whois.position = GLOBAL.playersDef.length + 1;

        whois.redefinition = createServiceDefinitionFromSuppliedFn(context, whois, definitionOrDefinitionType, definition, name);

        whois.me = name;
        GLOBAL.players[name] = whois;
        GLOBAL.playersDef.push(GLOBAL.players[name]);
        GLOBAL.system[name] = function (arg) {
            context.step(name);
            return whois.redefinition(arg, context);
        }
    };
    var self = {};

    setUpSystemEvent(self, "event", "$system");
    self.version = 1;
    self.startService = function (name, f) {
        typeof f === "function" && f.call(GLOBAL.system, whois(name));
    };

    self.servicePipe = function (name, condition, definition) {
        GLOBAL.servicePipes.push({
            name: name,// todo check for unique name
            condition: condition,
            definition: definition
        });
    }

    self.service = service;

    return self;
})();

// default function servicePipe plugin
light.servicePipe("$$default", function (definition) { return typeof definition === "function"; }, function (definition) { return definition; });

if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = light;
}

if (typeof define === 'function' && define.amd) {
    define('light', [], function () { return light; });
}