var light = (typeof light === "undefined") ? (function () {
    var GLOBAL = {};
    GLOBAL.getCurrentContext = function (stateName, arg, stateOverride) {
        var state = stateOverride ? JSON.parse(JSON.stringify({ data: stateOverride })).data : stateOverride

        var incontext = {
            event: GLOBAL.systemServices,
            service: chainService(),
            arg: arg,
            system: GLOBAL.system,
            state: GLOBAL._STATE_[stateName].api(state)
        };
        return incontext;
    };
    GLOBAL.forbiddenNames = {
        result: true,
        service: true,
        handle: true
    };

    GLOBAL.expectNoForbiddenName = function (name) {
        if (GLOBAL.forbiddenNames[name]) {
            throw "You cannot use the name '" + name + "'";
        }
    };

    GLOBAL.registry = {
        service: {},
        handle: {},
        scripts: {}
    };

    GLOBAL.isRegistered = function (str) {
        if (GLOBAL.registry.service[str] || GLOBAL.registry.handle[str]) {
            return true;
        }
        return false;
    };

    GLOBAL.generateUniqueSystemName = function (prefix) {
        prefix = prefix || "";
        var str = (prefix + '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx')["replace"](/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8; return v.toString(16); });

        if (GLOBAL.isRegistered(str)) {
            return GLOBAL.generateUniqueSystemName(prefix);
        }
        return str;
    }

    GLOBAL.$setState = function (systemName, name, obj) {
        GLOBAL._STATE_[systemName]["ref"][name] = { data: obj };
        GLOBAL._STATE_[systemName]["state"][name] = JSON.stringify(GLOBAL._STATE_[systemName]["ref"][name]);
    };
    GLOBAL.$getState = function (systemName) {
        var stateRoot = GLOBAL._STATE_[systemName];
        return stateRoot && (GLOBAL._STATE_[systemName]["state"] || {});
    };

    //$stateOverride

    GLOBAL.stateFactory = function (systemName) {
        GLOBAL._STATE_[systemName] = {
            state: {},
            ref: {},
            api: function (stateOverride) {
                if (stateOverride) {
                    GLOBAL._STATE_[systemName]["state"] = stateOverride;
                }

                return {
                    get: function (name) {
                        var data = GLOBAL.$getState(systemName)[name];
                        if (!data) {
                            return data;
                        };
                        return JSON.parse(data).data;
                    },
                    set: function (name, obj) {
                        GLOBAL.$setState(systemName, name, obj);
                    },
                    getRef: function (name) {
                        GLOBAL._STATE_[systemName]["ref"][name] = GLOBAL._STATE_[systemName]["ref"][name] || {};
                        return GLOBAL._STATE_[systemName]["ref"][name].data;
                    }
                };
            }
        }
    };

    GLOBAL.burnThread = function (seconds) {
        var e = new Date().getTime() + (seconds * 1000);
        while (new Date().getTime() <= e) { }
    };

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
        document.getElementsByTagName('head')[0].appendChild(script);
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
        document.getElementsByTagName('head')[0].appendChild(se);
    };

    GLOBAL.track = {
      
        record: function (arg) {
          
            
            if (arg.methodName === GLOBAL.DEFAULT_HANDLE_NAME) {
                return;
            }

            var recordObject = {
                dataType: arg.entranceOrExit,
                methodType: arg.serviceOrHandleMethodName,
                methodName: arg.methodName,
                time: Date.now ? Date.now() : new Date().getTime(),
                isFirst: arg.isFirstCallInServiceRun,
                isLast: arg.isLastCallInServiceRun,
                data: arg.argumentOrReturnData,
                isTest: arg.isTest || false,
                info: arg.info,
                infoType: arg.infoType,
                link: typeof arg.link === "function" ? arg.link.toString() : arg.link,
                state: GLOBAL.$getState(arg.methodName),
                event: arg.event,
                eventType: arg.eventType
            };
            //todo use an immutable library

            var recordStr = JSON.stringify(recordObject);
           
            if (GLOBAL.recordServices) {
                 _light[GLOBAL.systemEventName.onSystemRecordEvent].dispatch(recordStr);
            }
          

            if (arg.serviceOrHandleMethodName === GLOBAL.serviceTag) {
                GLOBAL.systemServices[arg.methodName][GLOBAL.serviceEventName[arg.eventType]].dispatch(recordStr);
                if ((arg.eventType === GLOBAL.serviceEventName.error) || (arg.eventType === GLOBAL.serviceEventName.success)) {
                    GLOBAL.systemServices[arg.methodName][GLOBAL.serviceEventName[GLOBAL.serviceEventName.after]].dispatch(recordStr);
                }
            }

            // notify event subscribers
            _light[arg.event].dispatch(recordStr);
            _light[GLOBAL.systemEventName.onSystemEvent].dispatch(recordStr);
        }
    }

  

    GLOBAL.utility = {
        execSurpressError: function (o, e, context, notificationInfo) {
            if (typeof o === "function") {
                try { o(e, context, notificationInfo); } catch (ex) {
                    console.error("SUPRESSED ERROR : " + ex);
                }
            }
        },
        tryCatch: function (context, f, success, error) {
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
        }
    };

    var XMLHttpFactories = [
  function () { return new XMLHttpRequest() },
  function () { return new ActiveXObject("Msxml2.XMLHTTP") },
  function () { return new ActiveXObject("Msxml3.XMLHTTP") },
  function () { return new ActiveXObject("Microsoft.XMLHTTP") }
    ];

    var createXMLHTTPObject = function () {
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

    var setUpEventSubscriberBase = function (id, o) {
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

    var createEventEmitter = function (id, f) {
        GLOBAL.eventSubscribers[id] = GLOBAL.eventSubscribers[id] || {};
        GLOBAL.eventSubscribers[id].sub = GLOBAL.eventSubscribers[id].sub || [];
        GLOBAL.eventSubscribers[id].dispatch = GLOBAL.eventSubscribers[id].dispatch || function (o, context, notificationType) {
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

    var setUpNotification = function (id) {
        return createEventEmitter(id, function (item, o, context, notificationInfo) {
            GLOBAL.utility.tryCatch(context, function () { return item.service(); }, function () { }, function () { GLOBAL.utility.execSurpressError(item.service.error, o, context, notificationInfo); });
        });
    };


    var setUpEventSubscriber = function (that, event, id) {
        that[event] = function (e) {
            setUpEventSubscriberBase(id, e);
        };
        that["on"] = that["on"] || function (name, o) {
            that[name](o);
        };
    };


    var publishSystemEventSubscriptionFx = function (that, event, id) {
        setUpEventSubscriber(that, event, id);
        createEventEmitter(id, function (item, o, context, notificationInfo) {
            if (item && (typeof item.service === "function")) {
                try {
                    item.service(o, context, notificationInfo)
                } catch (e) { }
            }
        });
    };


    var publishServiceEvent = function (that, event, id) {
        setUpEventSubscriber(that, event, id);
        that[event].forEachSubscriber = that[event].forEachSubscriber || function (f) {
            var l = GLOBAL.eventSubscribers[id].sub.length;
            for (var i = 0; i < l; i++) {
                var item = GLOBAL.eventSubscribers[id].sub[i];
                f && f(item);
            }
        };
        setUpNotification(id);
        that[event].dispatch = GLOBAL.eventSubscribers[id].dispatch;
    };

    var publishSystemEvent = function (that, event, name) {
        publishSystemEventSubscriptionFx(that, event, name + "." + event);
        that[event].dispatch = GLOBAL.eventSubscribers[name + "." + event].dispatch;
    };


    var getServiceByName = function (serviceName) {
        var item = GLOBAL.systemServices[serviceName];
        return item;
    };

    /*
     !!!!!!!!!!!!!!!!
    */
    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    var getApplicablehandle_Test = function (context, serviceItem, definition, serviceName, arg) {
        var testhandleName = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[serviceName] && GLOBAL._TEST_OBJECTS_[serviceName].handleName;

        var testhandle = GLOBAL._TEST_OBJECTS_ && GLOBAL._TEST_OBJECTS_[serviceName] && GLOBAL._TEST_OBJECTS_[serviceName].handle;

        GLOBAL.track.record({
            entranceOrExit: GLOBAL.entranceTag,
            serviceOrHandleMethodName: GLOBAL.handleTag,
            methodName: testhandleName,
            argumentOrReturnData: serviceName,
            info: arg,
            infoType: GLOBAL.serviceArgTag,
            isTest: true,
            isFirstCallInServiceRun: GLOBAL.unknownTag,
            isLastCallInServiceRun: GLOBAL.unknownTag,
            link: testhandle,
            event: GLOBAL.systemEventName.beforeHandleRun,
            eventType: GLOBAL.serviceEventName.before
        });

        tmpDefinition = testhandle.call(GLOBAL.getCurrentContext(serviceName, definition), definition);

        GLOBAL.track.record({
            entranceOrExit: GLOBAL.exitTag,
            serviceOrHandleMethodName: GLOBAL.handleTag,
            methodName: testhandleName,
            argumentOrReturnData: serviceName,
            info: GLOBAL.unknownTag,
            infoType: GLOBAL.unknownTag,
            isTest: true,
            isFirstCallInServiceRun: GLOBAL.unknownTag,
            isLastCallInServiceRun: GLOBAL.unknownTag,
            link: testhandle,
            event: GLOBAL.systemEventName.afterHandleRun,
            eventType: GLOBAL.serviceEventName.after
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
                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.entranceTag,
                    serviceOrHandleMethodName: GLOBAL.handleTag,
                    methodName: handleName,
                    argumentOrReturnData: serviceName,
                    info: arg,
                    infoType: GLOBAL.serviceArgTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: (testhandle || handle.definition),
                    event: GLOBAL.systemEventName.beforeHandleRun,
                    eventType: GLOBAL.serviceEventName.before
                });

                tmpDefinition = (testhandle || handle.definition).call(GLOBAL.getCurrentContext(handleName, definition), definition);

                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.exitTag,
                    serviceOrHandleMethodName: GLOBAL.handleTag,
                    methodName: handleName,
                    argumentOrReturnData: serviceName,
                    info: GLOBAL.unknownTag,
                    infoType: GLOBAL.unknownTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: (testhandle || handle.definition),
                    event: GLOBAL.systemEventName.afterHandleRun,
                    eventType: GLOBAL.serviceEventName.after
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

            lastResult = returnDefinitionFromHandle.call(GLOBAL.getCurrentContext(serviceName, lastResult), lastResult);
        }

        return lastResult;
    };

    var createServiceDefinitionFromSuppliedFn = function (context, serviceItem, handleName, definition, serviceName) {
        publishServiceEvent(serviceItem, GLOBAL.serviceEventName.before, serviceName + "." + GLOBAL.serviceEventName.before);
        publishServiceEvent(serviceItem, GLOBAL.serviceEventName.after, serviceName + "." + GLOBAL.serviceEventName.after);
        publishServiceEvent(serviceItem, GLOBAL.serviceEventName.error, serviceName + "." + GLOBAL.serviceEventName.error);
        publishServiceEvent(serviceItem, GLOBAL.serviceEventName.success, serviceName + "." + GLOBAL.serviceEventName.success);

        return function (arg, callerContext) {
            var tArg = {};
            tArg.arg = arg;

            var result;
            context.callerContext = callerContext;
            GLOBAL.utility.tryCatch(context, function () {
                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.entranceTag,
                    serviceOrHandleMethodName: GLOBAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: tArg.arg,
                    info: handleName,
                    infoType: GLOBAL.handleTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: definition,
                    event: GLOBAL.systemEventName.beforeServiceRun,
                    eventType: GLOBAL.serviceEventName.before
                });
            }, function (o) {
            }, function (o) {
            });

            GLOBAL.utility.tryCatch(context, function () {
                result = runSuppliedServiceFunction(context, serviceItem, handleName, definition, serviceName, tArg.arg);

                return result;
            }, function (o) {
                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.exitTag,
                    serviceOrHandleMethodName: GLOBAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: o,
                    info: "event:success",
                    infoType: GLOBAL.eventTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: definition,
                    event: GLOBAL.systemEventName.onServiceSuccess,
                    eventType: GLOBAL.serviceEventName.success
                });
            }, function (o) {
                GLOBAL.track.record({
                    entranceOrExit: GLOBAL.exitTag,
                    serviceOrHandleMethodName: GLOBAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: o,
                    info: "event:error",
                    infoType: GLOBAL.eventTag,
                    isTest: false,
                    isFirstCallInServiceRun: GLOBAL.unknownTag,
                    isLastCallInServiceRun: GLOBAL.unknownTag,
                    link: definition,
                    event: GLOBAL.systemEventName.onServiceError,
                    eventType: GLOBAL.serviceEventName.error
                });
            });

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

        GLOBAL.expectNoForbiddenName(serviceName);

        //!!!!
        //experiment ----start
        /*
         var definition = function () {
            var result;
            result = fn.apply(this, arguments);
            return result;
        };
        */
        //experiment ----end

        var definition = fn;
        var context = {};
        var serviceItem = function (previousOrMostCurrentResultToBePassedToTheNextActor) {
            return serviceItem.redefinition(previousOrMostCurrentResultToBePassedToTheNextActor);
        };

        serviceItem.redefinition = createServiceDefinitionFromSuppliedFn(context, serviceItem, handleNamesOrDefinition, definition, serviceName);

        serviceItem.me = serviceName;
        GLOBAL.systemServices[serviceName] = serviceItem;
        //!! reg
        GLOBAL.registry.service[serviceName] = {};

        GLOBAL.stateFactory(serviceName);

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
                    var res = {};
                    //TODO use immutable lib
                    res.previousOrMostCurrentResultToBePassedToTheNextActor = arguments.length ? arg : result;
                    var previousOrMostCurrentResultToBePassedToTheNextActor = JSON.parse(JSON.stringify(res)).previousOrMostCurrentResultToBePassedToTheNextActor;

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
            typeof f === "function" && f.call(GLOBAL.getCurrentContext(GLOBAL._GLOBAL_SCOPE_NAME, cs), cs);
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

        GLOBAL.expectNoForbiddenName(handleName);

        GLOBAL.registry.handle[handleName] = {};

        GLOBAL.handles.push({
            name: handleName,
            definition: definition
        });
        GLOBAL.stateFactory(handleName);
        return handleName;
    }

    _light.advanced = {
        test: function (setup, f) {
            GLOBAL._TEST_OBJECTS_ = setup;

            f.call(GLOBAL.getCurrentContext(GLOBAL._GLOBAL_SCOPE_NAME, chainService()), chainService());
            GLOBAL._TEST_OBJECTS_ = undefined
        },
        play: function (records,i, j) {
           
            i = i || 0;
            j = j || (GLOBAL.track.records.length - 1);

            _light(function (service) {
                var inter = service;
                for (var m = i; m <= j; m++) {
                    var playGround = records && (records || [])[m] || [];
                    if (!playGround) {
                        throw "unable to find service to play service";
                    }

                    if ((playGround.methodType === GLOBAL.serviceTag) && (playGround.dataType === GLOBAL.entranceTag)) {
                        if ((m === i)) {
                            inter = inter[playGround.methodName].call(GLOBAL.getCurrentContext(playGround.methodName, playGround.data, playGround.state), playGround.data);
                        } else {
                            inter = inter[playGround.methodName]();
                        }
                    }
                }
                var result = inter.result();
            });
        }
    };

    if (typeof Immutable === "undefined") {
        _light.Immutable = {
            Map: function (obj) {
                var name = GLOBAL.generateUniqueSystemName("immu");
                var data = { data: obj }
                GLOBAL.ImmutableStore[name] = JSON.stringify(data);
                return {
                    get: function (n) {
                        var out = JSON.parse(GLOBAL.ImmutableStore[name]);
                        return out.data[n];
                    },
                    set: function (n, o) {
                        var out = JSON.parse(GLOBAL.ImmutableStore[name]);
                        out.data[n] = o;
                        var newData = JSON.parse(JSON.stringify(out)).data;

                        return _light.Immutable.Map(newData);
                    }
                };
            }
        };
    } else {
        _light.Immutable = Immutable;
    }

    _light.copy = function (obj) {
        _light.Immutable.Map({ data: obj }).get('data');
    };

    var init = function () {
        GLOBAL.entranceTag = "argument";
        GLOBAL.exitTag = "result";
        GLOBAL.serviceTag = "service";
        GLOBAL.handleTag = "handle";
        GLOBAL.eventTag = "event";
        GLOBAL.unknownTag = "unknown";

        //SYSTEM EVENTS API
        GLOBAL.systemEventName = {
            beforeServiceRun: "beforeServiceRun",
            afterServiceRun: "afterServiceRun",
            beforeHandleRun: "beforeHandleRun",
            afterHandleRun: "afterHandleRun",
            onServiceError: "onServiceError",
            onServiceSuccess: "onServiceSuccess",
            onSystemEvent: "onSystemEvent",
            onSystemRecordEvent: "onSystemRecordEvent"
        };
        // ==SERVICE EVENTS API ==
        GLOBAL.serviceEventName = {
            before: "before",
            after: "after",
            error: "error",
            success: "success"
        };

        GLOBAL._TEST_OBJECTS_ = {};
        GLOBAL.systemServices = {};
        GLOBAL.ImmutableStore = {};
        GLOBAL._STATE_ = {};
        GLOBAL.eventSubscribers = {};
        GLOBAL.handles = [];
        GLOBAL._GLOBAL_SCOPE_NAME = GLOBAL.generateUniqueSystemName();
        GLOBAL.stateFactory(GLOBAL._GLOBAL_SCOPE_NAME);
        GLOBAL.DEFAULT_HANDLE_NAME = GLOBAL.generateUniqueSystemName();
        /*
           setup like publishSystemEvent(_light, "event", GLOBAL.generateUniqueSystemName("some id"));
           notify like  _light.event.dispatch(e, context, notificationInfo);
           subscribe like light.event(function (e, context,notificationInfo) {}));
        */

        _light.version = "6.0.0";
        _light.service = defineService;

        publishSystemEvent(_light, GLOBAL.systemEventName.onSystemEvent, GLOBAL.generateUniqueSystemName());
        publishSystemEvent(_light, GLOBAL.systemEventName.onSystemRecordEvent, GLOBAL.generateUniqueSystemName());

        publishSystemEvent(_light, GLOBAL.systemEventName.beforeServiceRun, GLOBAL.generateUniqueSystemName());
        publishSystemEvent(_light, GLOBAL.systemEventName.afterServiceRun, GLOBAL.generateUniqueSystemName());
        publishSystemEvent(_light, GLOBAL.systemEventName.beforeHandleRun, GLOBAL.generateUniqueSystemName());
        publishSystemEvent(_light, GLOBAL.systemEventName.afterHandleRun, GLOBAL.generateUniqueSystemName());
        publishSystemEvent(_light, GLOBAL.systemEventName.onServiceError, GLOBAL.generateUniqueSystemName());
        publishSystemEvent(_light, GLOBAL.systemEventName.onServiceSuccess, GLOBAL.generateUniqueSystemName());

        _light.handle(GLOBAL.DEFAULT_HANDLE_NAME, function (definition) { return definition; });
    };

    init();

    GLOBAL.system = {
        startRecording: function () {
            GLOBAL.recordServices = true;
        },
        stopRecording: function () {
            GLOBAL.recordServices = false;
        },
    };
 

    return _light;
})() : console.log("light script already exists");

/*
(e)=>eventArg
                dataType:
                methodType:
                methodName:
                time:
                position:
                isFirst:
                isLast:
                data:
                isTest:
                info:
                infoType:
                link:
                state:
                event:

light.onSystemEvent(function (e) { });

light.beforeServiceRun(function (e) { });
light.afterServiceRun(function (e) { });
light.beforeHandleRun(function (e) { });
light.afterHandleRun(function (e) { });
light.onServiceError(function (e) { });
light.onServiceSuccess(function (e) { });

*/

if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = light;
}

if (typeof define === 'function' && define.amd) {
    define('light', [], function () { return light; });
}



