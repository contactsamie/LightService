//var q = require("q");

var light = (function () {
    var GLOBAL = {};

    GLOBAL.DEFAULT_HANDLE_NAME = "$$default";
    GLOBAL.entranceTag = "argument";
    GLOBAL.exitTag = "result";
    GLOBAL.serviceTag = "service";
    GLOBAL.handleTag = "handle";
    GLOBAL.eventTag = "event";
    GLOBAL.unknownTag = "unknown";

    GLOBAL._TEST_OBJECTS_;
    GLOBAL.systemServices = {};
    GLOBAL.registry = {
        service: {},
        handle: {},
        scripts: {}
    };
    GLOBAL.burnThread = function (seconds) {
        var e = new Date().getTime() + (seconds * 1000);
        while (new Date().getTime() <= e) { }
    };
    GLOBAL.isRegistered = function (str) {
        if (GLOBAL.registry.service[str] || GLOBAL.registry.handle[str]) {
            return true;
        }
        return false;
    };
    var XMLHttpFactories = [
	function () { return new XMLHttpRequest() },
	function () { return new ActiveXObject("Msxml2.XMLHTTP") },
	function () { return new ActiveXObject("Msxml3.XMLHTTP") },
	function () { return new ActiveXObject("Microsoft.XMLHTTP") }
    ];

    function createXMLHTTPObject() {
        var xmlhttp = false;
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
            }
            catch (e) {
                continue;
            }
            break;
        }
        return xmlhttp;
    }
    GLOBAL.generateUniqueSystemName = function (prefix) {
        prefix = prefix || "";
        var str = (prefix + '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx')["replace"](/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8; return v.toString(16); });

        if (GLOBAL.isRegistered(str)) {
            return GLOBAL.generateUniqueSystemName(prefix);
        }
        return str;
    }
    GLOBAL.loadScript = function (src, onload) {
        // todo wrap require js
        //if (src) {
        //    return require(src);
        //}

        onload ? GLOBAL.loadScriptAsync(src, onload) : GLOBAL.loadScriptSync(src);
    };

    GLOBAL.loadScriptAsync = function (src, onload) {
        if (!document) {
            throw "Cannot load script : no document";
            return;
        }

        var script = document.createElement('script');
        script.src = src;
        script.onload = typeof onload === "function" ? onload : function () { };
        document.body.appendChild(script);
    };

    GLOBAL.loadScriptSync = function (src) {
        if (!document) {
            throw "Cannot load script : no document";
            return;
        }

        var xhrObj = createXMLHTTPObject();
        xhrObj.open('GET', src, false);
        xhrObj.send('');
        var se = document.createElement('script');
        se.type = "text/javascript";
        se.text = xhrObj.responseText;
        document.getElementsByTagName('body')[0].appendChild(se);
    };
    GLOBAL.eventSubscribers = {};

    GLOBAL.track = {
        record: function (arg) {
            GLOBAL.track.records = GLOBAL.track.records || [];
            if (!GLOBAL.recordServices) {
                return;
            }
            if (arg.methodName === GLOBAL.DEFAULT_HANDLE_NAME) {
                return;
            }

            var recordObject = {
                dataType: arg.entranceOrExit,
                methodType: arg.serviceOrHandleMethodName,
                methodName: arg.methodName,
                time: Date.now ? Date.now() : new Date().getTime(),
                position: GLOBAL.track.records.length,
                isFirst: arg.isFirstCallInServiceRun,
                isLast: arg.isLastCallInServiceRun,
                data: arg.argumentOrReturnData,
                isTest: arg.isTest || false,
                info: arg.miscData,
                infoType: arg.miscDataType
            };
            //todo use an immutable library

            //recordObject.link = arg.link;
            GLOBAL.track.records.push(recordObject);
            GLOBAL.track.records = JSON.parse(JSON.stringify(GLOBAL.track.records));

            // console.log();
        },
        clearAllRecords: function () {
            GLOBAL.track.records = [];
        }
    }

    GLOBAL.system = {
        getRecord: function (i) {
            GLOBAL.track.records = GLOBAL.track.records || [];
            return GLOBAL.track.records[i] || [];
        },
        getLastRecord: function () {
            GLOBAL.track.records = GLOBAL.track.records || [];
            return GLOBAL.track.records.length ? GLOBAL.track.records[GLOBAL.track.records.length - 1] : [];
        },
        play: function (i, j) {
            var that = this;
            i = i || 0;
            j = j || (GLOBAL.track.records.length - 1);

            _light(function (service) {
                var inter = service;
                for (var m = i; m <= j; m++) {
                    var playGround = that.getRecord(m);
                    if (!playGround) {
                        throw "unable to find service to play service";
                    }
                    if ((playGround.methodType === GLOBAL.serviceTag) && (playGround.dataType === GLOBAL.entranceTag)) {
                        inter = (m === i) ? inter[playGround.methodName](playGround.data) : inter[playGround.methodName]();
                    }
                }
                var result = inter.result();
            });
        },
        getAllRecords: function (i) {
            //todo use an immutable library
            return JSON.parse(JSON.stringify(GLOBAL.track.records));
            // return GLOBAL.track.records.map(function (o) { return o; });
        },
        recordStart: function () {
            GLOBAL.recordServices = true;
        },
        recordStop: function () {
            GLOBAL.recordServices = false;
        },
        recordClear: function () {
            GLOBAL.track.clearAllRecords();
        }
    };

    GLOBAL.utility = {};
    GLOBAL.utility.execSurpressError = function (o, e, context, notificationInfo) {
        _light["event"].notify(e, context, notificationInfo);
        if (typeof o === "function") {
            try { o(e, context, notificationInfo); } catch (ex) {
                console.error("SUPRESSED ERROR : " + ex);
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

    GLOBAL.handles = [];

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
                try {
                    item(o, context, notificationInfo)
                } catch (e) { }
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

    var getServiceByName = function (serviceName) {
        var item = GLOBAL.systemServices[serviceName];
        return item;
    };
    function parseJSON(data) {
        return JSON && JSON.parse ? JSON.parse(data) : (new Function("return " + data))();
    }
    /*
     !!!!!!!!!!!!!!!!
    */
    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    var getApplicablehandle_Test = function (context, serviceItem, definition, serviceName, arg) {
        var testhandleName = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[serviceName] && GLOBAL._TEST_OBJECTS_[serviceName].handleName;

        var testhandle = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[serviceName] && GLOBAL._TEST_OBJECTS_[serviceName].handle;

        /*
         GLOBAL.system.$$currentContext = {
            handles: GLOBAL.handles,
            definition: definition,
            serviceName: serviceName,
            handleName: undefined,
            arg: arg
        };
        tmpDefinition = testhandle.call(GLOBAL.system, definition);

        */
        GLOBAL.track.record({
            entranceOrExit: GLOBAL.entranceTag,
            serviceOrHandleMethodName: GLOBAL.handleTag,
            methodName: testhandleName,
            argumentOrReturnData: serviceName,
            miscData: arg,
            miscDataType: GLOBAL.serviceArgTag,
            isTest: true,
            isFirstCallInServiceRun: GLOBAL.unknownTag,
            isLastCallInServiceRun: GLOBAL.unknownTag,
            link: testhandle
        });

        tmpDefinition = testhandle.call(GLOBAL.systemServices, definition, arg, GLOBAL.system);

        GLOBAL.track.record({
            entranceOrExit: GLOBAL.exitTag,
            serviceOrHandleMethodName: GLOBAL.handleTag,
            methodName: testhandleName,
            argumentOrReturnData: serviceName,
            miscData: GLOBAL.unknownTag,
            miscDataType: GLOBAL.unknownTag,
            isTest: true,
            isFirstCallInServiceRun: GLOBAL.unknownTag,
            isLastCallInServiceRun: GLOBAL.unknownTag,
            link: testhandle
        });
        return tmpDefinition;
    };

    var getApplicablehandle_RealTest = function (context, serviceItem, handleName, definition, serviceName, arg, testhandle, testhandleName) {
        if (testhandleName) {
            handleName = testhandleName;
        }
        var lastResult;

        var isAMatch = false;
        var length = GLOBAL.handles.length;
        for (var j = 0; j < length; j++) {
            var handle = GLOBAL.handles[j];
            isAMatch = handleName && (handle.name === handleName);
            if (isAMatch) {
                /*
                 GLOBAL.system.$$currentContext = {
                    handles: GLOBAL.handles,
                    definition: definition,
                    serviceName: serviceName,
                    handleName: handle.name,
                    arg: arg
                };

              tmpDefinition = (testhandle || handle.definition).call(GLOBAL.system, definition);
                */

                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.entranceTag,
                    serviceOrHandleMethodName: GLOBAL.handleTag,
                    methodName: handleName,
                    argumentOrReturnData: serviceName,
                    miscData: arg,
                    miscDataType: GLOBAL.serviceArgTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: (testhandle || handle.definition)
                });

                tmpDefinition = (testhandle || handle.definition).call(GLOBAL.systemServices, definition, arg, GLOBAL.system);

                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.exitTag,
                    serviceOrHandleMethodName: GLOBAL.handleTag,
                    methodName: handleName,
                    argumentOrReturnData: serviceName,
                    miscData: GLOBAL.unknownTag,
                    miscDataType: GLOBAL.unknownTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: (testhandle || handle.definition)
                });

                break;
            }
        }

        return tmpDefinition;
    };

    var getApplicablehandle = function (context, serviceItem, handleName, definition, serviceName, arg) {
        var tmpDefinition;
        var testhandleName = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[serviceName] && GLOBAL._TEST_OBJECTS_[serviceName].handleName;

        var testhandle = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[serviceName] && GLOBAL._TEST_OBJECTS_[serviceName].handle;
        if (testhandle && !testhandleName) {
            tmpDefinition = getApplicablehandle_Test(context, serviceItem, definition, serviceName, arg);
        }
        else {
            tmpDefinition = getApplicablehandle_RealTest(context, serviceItem, handleName, definition, serviceName, arg, testhandle, testhandleName);
        }
        return tmpDefinition;
    };

    var runSuppliedServiceFunction = function (context, serviceItem, handleNames, definition, serviceName, arg) {
        //start testing
        if (GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[serviceName] && GLOBAL._TEST_OBJECTS_[serviceName].service) {
            handleNames = GLOBAL._TEST_OBJECTS_[serviceName].handleNames || handleNames;
            definition = GLOBAL._TEST_OBJECTS_[serviceName].service || definition;
        }
        handleNames = isArray(handleNames) ? handleNames : (handleNames ? [handleNames] : []);

        var totalHandles = handleNames.length;

        var lastResult;
        lastResult = arg;
        for (var i = 0; i < totalHandles; i++) {
            var handleName = handleNames[i];

            //end testing
            var returnDefinitionFromHandle = getApplicablehandle(context, serviceItem, handleName, definition, serviceName, lastResult);

            //expecting function from handle plugin
            if (typeof returnDefinitionFromHandle !== "function") {
                var message = "Cannot process service or handle '" + serviceName + "' ";
                message = message + (returnDefinitionFromHandle ? "'" + handleName + "' service handle must return a function" : "no matching service handle  exists ");
                console.error(message);
                throw message;
            }

            /*
              lastResult = returnDefinitionFromHandle.call(GLOBAL.system, lastResult, chainService());
            */

            lastResult = returnDefinitionFromHandle.call(GLOBAL.systemServices, lastResult, chainService(), GLOBAL.system);
        }

        return lastResult;
    };

    var createServiceDefinitionFromSuppliedFn = function (context, serviceItem, handleName, definition, serviceName) {
        setUpServiceEvent(serviceItem, "before", serviceName);
        setUpServiceEvent(serviceItem, "after", serviceName);
        setUpServiceEvent(serviceItem, "error", serviceName);
        setUpServiceEvent(serviceItem, "success", serviceName);

        return function (arg, callerContext) {
            var tArg = {};
            tArg.arg = arg;

            var result;
            context.callerContext = callerContext;
            GLOBAL.utility.tryCatch(context, function () {
                return serviceItem["before"].notify();
            }, function (o) {
            }, function (o) {
            });

            GLOBAL.utility.tryCatch(context, function () {
                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.entranceTag,
                    serviceOrHandleMethodName: GLOBAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: tArg.arg,
                    miscData: handleName,
                    miscDataType: GLOBAL.handleTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: definition
                });

                result = runSuppliedServiceFunction(context, serviceItem, handleName, definition, serviceName, tArg.arg);

                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.exitTag,
                    serviceOrHandleMethodName: GLOBAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: result,
                    miscData: handleName,
                    miscDataType: GLOBAL.handleTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: definition
                });

                return result;
            }, function (o) {
                return serviceItem["success"].notify(o, context, "service-success");
            }, function (o) {
                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.exitTag,
                    serviceOrHandleMethodName: GLOBAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: o,
                    miscData: "event:error",
                    miscDataType: GLOBAL.eventTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: definition
                });

                return serviceItem["error"].notify(o, context, "service-error");
            });

            GLOBAL.utility.tryCatch(context, function () { return serviceItem["after"].notify(); }, function () { }, function () { });
            return result;
        }
    };

    var defineService = function (serviceName, handleNamesOrDefinition, fn) {
        var servicePrefix = "service_";
        if ((arguments.length == 0) || (arguments.length > 3)) {
            throw "Cannot create service : problem with service definition"
            return;
        }

        if (arguments.length == 1) {
            if (typeof serviceName === "function") {
                fn = serviceName;
                serviceName = GLOBAL.generateUniqueSystemName(servicePrefix);
                handleNamesOrDefinition = GLOBAL.DEFAULT_HANDLE_NAME;
            } else {
                if (!GLOBAL.registry.scripts[serviceName]) {
                    GLOBAL.registry.scripts[serviceName] = true;
                    return {
                        load: function (onload) {
                            GLOBAL.loadScript(serviceName, onload && function () {
                                _light(onload);
                            });
                        }
                    };
                } else {
                    return {
                        load: function (onload) {
                            onload && _light(onload);
                        }
                    }
                }
            }
        }
        if (arguments.length == 2) {
            if (typeof handleNamesOrDefinition !== "function") {
                throw "service definition has to be a function";
                return;
            }
            fn = handleNamesOrDefinition;

            if (isArray(serviceName)) {
                handleNamesOrDefinition = serviceName;
                serviceName = GLOBAL.generateUniqueSystemName(servicePrefix);
            } else {
                //service name is provided
                handleNamesOrDefinition = GLOBAL.DEFAULT_HANDLE_NAME;
            }
        }

        // todo check for unique name
        if (GLOBAL.isRegistered(serviceName)) {
            throw "Unable to create service with name '" + serviceName + "'.Name already exists in registry";
            return;
        }

        //!!!!
        //experiment ----start
        var definition = function () {
            var result;
            result = fn.apply(this, arguments);
            return result;
        };
        //experiment ----end
        var context = {
            name: serviceName, step: function (o) {
                _light["event"].notify(serviceName, context, "service-call");
                this.steps.push(o);
            },
            steps: []
        };
        var serviceItem = function (previousOrMostCurrentResultToBePassedToTheNextActor) {
            return serviceItem.redefinition(previousOrMostCurrentResultToBePassedToTheNextActor);
        };

        serviceItem.redefinition = createServiceDefinitionFromSuppliedFn(context, serviceItem, handleNamesOrDefinition, definition, serviceName);

        serviceItem.me = serviceName;
        GLOBAL.systemServices[serviceName] = serviceItem;
        //!! reg
        GLOBAL.registry.service[serviceName] = {};

        /*
         GLOBAL.system[serviceName] = function (arg) {
            context.step(serviceName);
            return serviceItem.redefinition(arg, context);
        }
        */

        return serviceName;
    };

    var eachAsync = function (actors, func, cb) {
        for (var actor in actors) {
            func(actor);
        }
        cb();
    }

    var chainService = function (cb) {
        chainService.totalChain = chainService.totalChain || 0;

        var chain = {};
        var result = undefined;
        chain.result = function () {
            var res = result;
            result = undefined;
            return res;
        };
        var buildFn = function (actor) {
            chain[actor] = (function (serviceName) {
                return function (arg) {
                    var currentResult;
                    var previousOrMostCurrentResultToBePassedToTheNextActor = arguments.length ? arg : result;
                    result = GLOBAL.systemServices[serviceName](previousOrMostCurrentResultToBePassedToTheNextActor);
                    return chain;
                };
            })(actor);
        };

        if (cb) {
            //todo use async to speed up things
            eachAsync(GLOBAL.systemServices, buildFn, function () {
                cb(chain);
            });
        } else {
            for (var actor in GLOBAL.systemServices) {
                buildFn(actor);
            }
        }

        chain.merge = function (arg) {
            var _arg;

            if (result) {
                for (var attr in result) {
                    _arg = _arg || {};
                    _arg[attr] = result[attr];
                }
            }
            if (arg) {
                for (var attr in arg) {
                    _arg = _arg || {};
                    _arg[attr] = arg[attr];
                }
            }
            result = _arg;

            return chain;
        };

        return chain;
    };

    var _light = function (f) {
        // (function (f) {
        //   setTimeout(function () {
        chainService(function (cs) {
            typeof f === "function" && f.call(GLOBAL.systemServices, cs, GLOBAL.system);
        });
        //    },0);
        // })(f);
    };

    _light.startService = function (f) {
        _light(f);
    };

    _light.handle = function (handleName, definition) {
        var handleePrefix = "handle_";
        if ((arguments.length == 0) || (arguments.length > 2)) {
            throw "Cannot create handle : problem with handle definition"
            return;
        }

        if (arguments.length == 1) {
            if (typeof handleName !== "function") {
                throw "handle definition has to be a function";
                return;
            }
            definition = handleName;
            handleName = GLOBAL.generateUniqueSystemName(handleePrefix);
        }

        if (GLOBAL.isRegistered(handleName)) {
            throw "Unable to create handle with name '" + handleName + "'.Name already exists in registry";
            return;
        }

        GLOBAL.registry.handle[handleName] = {};

        GLOBAL.handles.push({
            name: handleName,
            definition: definition
        });

        return handleName;
    }

    _light.service = defineService;

    _light.advance = {
        serviceTest: function (setup, f) {
            GLOBAL._TEST_OBJECTS_ = setup;
            f.call(GLOBAL.systemServices, chainService(), GLOBAL.system);
            GLOBAL._TEST_OBJECTS_ = undefined
        }
    };

    _light.version = 1;

    setUpSystemEvent(_light, "event", "$system");

    _light.handle(GLOBAL.DEFAULT_HANDLE_NAME, function (definition) { return definition; });

    return _light;
})();

if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = light;
}

if (typeof define === 'function' && define.amd) {
    define('light', [], function () { return light; });
}