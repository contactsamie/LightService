//var q = require("q");

var light = (function () {
    var GLOBAL = {};
    GLOBAL.players = {};
    GLOBAL.playersDef = [];
    GLOBAL.eventSubscribers = {};
    GLOBAL.system = {};
    GLOBAL.utility = {};
    GLOBAL.utility.execSurpressError = function (o, e, context, notificationInfo) {
        _light["event"].notify(e, context, notificationInfo);
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

    var getServiceByName = function (name) {
        var item = GLOBAL.players[name];
        return item;
    };
    function parseJSON(data) {
        return JSON && JSON.parse ? JSON.parse( data ) : (new Function("return " + data))(); 
    }
    /*
     !!!!!!!!!!!!!!!!
    */

    var runSuppliedServiceFunction = function (context, serviceItem, definitionOrDefinitionType, definition, name, arg) {
        var tmpDefinition;
        var selectedPipe;

        var length = GLOBAL.servicePipes.length;
        for (var j = 0; j < length; j++) {
            var pipe = GLOBAL.servicePipes[j];
            var pipeType = (definition && definitionOrDefinitionType) ? definitionOrDefinitionType : false;
            var actualDefinition = pipeType ? definition : definitionOrDefinitionType;
            var isAMatch = pipeType ? (pipe.name === pipeType) : pipe.condition.call(GLOBAL.system, actualDefinition);
            
            if (isAMatch) {
                    tmpDefinition = pipe.definition.call(GLOBAL.system, actualDefinition);
                    selectedPipe = pipe.name;
                    break;
                }            
        }
        //expecting function from pipe plugin
        tmpDefinition = typeof tmpDefinition === "function" ? tmpDefinition : function () { };

        GLOBAL.system["$$currentContext"] = {
            servicePipes: GLOBAL.servicePipes,
            definition: actualDefinition,
            serviceName: name,
            pipeName: selectedPipe,
            arg: arg
        };

        return tmpDefinition.call(GLOBAL.system, arg);       
    };

    var createServiceDefinitionFromSuppliedFn = function (context, serviceItem, definitionOrDefinitionType, definition, name) {
        setUpServiceEvent(serviceItem, "before", name);
        setUpServiceEvent(serviceItem, "after", name);
        setUpServiceEvent(serviceItem, "error", name);
        setUpServiceEvent(serviceItem, "success", name);

        return function (arg, callerContext) {
            var result;
            context.callerContext = callerContext;
            GLOBAL.utility.tryCatch(context, function () { return serviceItem["before"].notify(); }, function () { }, function () { });

            GLOBAL.utility.tryCatch(context, function () {

                result = runSuppliedServiceFunction(context, serviceItem, definitionOrDefinitionType, definition, name, arg);
                return result;
                
            }, function (o) {
                return serviceItem["success"].notify(o, context, "service-success");
            }, function (o) {
                return serviceItem["error"].notify(o, context, "service-error");
            });

            GLOBAL.utility.tryCatch(context, function () { return serviceItem["after"].notify(); }, function () { }, function () { });
            return result;
        }
    };

    var defineService = function (name, definitionOrDefinitionType, definition) {
        var context = {
            name: name, step: function (o) {
                _light["event"].notify(name, context, "service-call");
                this.steps.push(o);
            },
            steps: []
        };
        var serviceItem = function (arg) {
            arg = arg || {};
            return serviceItem.redefinition(arg);
        };
        serviceItem.position = GLOBAL.playersDef.length + 1;

        serviceItem.redefinition = createServiceDefinitionFromSuppliedFn(context, serviceItem, definitionOrDefinitionType, definition, name);

        serviceItem.me = name;
        GLOBAL.players[name] = serviceItem;
        GLOBAL.playersDef.push(GLOBAL.players[name]);
        GLOBAL.system[name] = function (arg) {
            context.step(name);
            return serviceItem.redefinition(arg, context);
        }
    };
    var _light = {};

    setUpSystemEvent(_light, "event", "$system");
    _light.version = 1;
    _light.startService = function (name, f) {
        typeof f === "function" && f.call(GLOBAL.system, getServiceByName(name));
    };

    _light.servicePipe = function (name, condition, definition) {
        GLOBAL.servicePipes.push({
            name: name,// todo check for unique name
            condition: condition,
            definition: definition
        });
    }

    _light.service = defineService;

    return _light;
})();

// default function servicePipe plugin
light.servicePipe("$$default", function (definition) { return typeof definition === "function"; }, function (definition) { return definition; });

if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = light;
}

if (typeof define === 'function' && define.amd) {
    define('light', [], function () { return light; });
}