var light = (typeof light === "undefined") ? (function () {
    var INTERNAL = {};
    INTERNAL.getCurrentContext = function (stateName, arg, stateOverride) {
        var state = stateOverride ? JSON.parse(JSON.stringify({ data: stateOverride })).data : stateOverride

        var incontext = {
            event: INTERNAL.systemServices,
            service: chainService(),
            arg: arg,
            system: INTERNAL.system,
            state: INTERNAL._STATE_[stateName].api(state)
        };
        return incontext;
    };
    INTERNAL.forbiddenNames = {
        result: true,
        service: true,
        handle: true
    };

    INTERNAL.expectNoForbiddenName = function (name) {
        if (INTERNAL.forbiddenNames[name]) {
            throw "You cannot use the name '" + name + "'";
        }
    };

    INTERNAL.registry = {
        service: {},
        handle: {},
        scripts: {}
    };

    INTERNAL.isRegistered = function (str) {
        if (INTERNAL.registry.service[str] || INTERNAL.registry.handle[str]) {
            return true;
        }
        return false;
    };

    INTERNAL.generateUniqueSystemName = function (prefix) {
        prefix = prefix || "";
        var str = (prefix + '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx')["replace"](/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8; return v.toString(16); });

        if (INTERNAL.isRegistered(str)) {
            return INTERNAL.generateUniqueSystemName(prefix);
        }
        return str;
    }

    INTERNAL.$setState = function (systemName, name, obj) {
        INTERNAL._STATE_[systemName]["ref"][name] = { data: obj };
        INTERNAL._STATE_[systemName]["state"][name] = JSON.stringify(INTERNAL._STATE_[systemName]["ref"][name]);
    };
    INTERNAL.$getState = function (systemName) {
        var stateRoot = INTERNAL._STATE_[systemName];
        return stateRoot && (INTERNAL._STATE_[systemName]["state"] || {});
    };

    //$stateOverride

    INTERNAL.stateFactory = function (systemName) {
        INTERNAL._STATE_[systemName] = {
            state: {},
            ref: {},
            api: function (stateOverride) {
                if (stateOverride) {
                    INTERNAL._STATE_[systemName]["state"] = stateOverride;
                }

                return {
                    get: function (name) {
                        var data = INTERNAL.$getState(systemName)[name];
                        if (!data) {
                            return data;
                        };
                        return JSON.parse(data).data;
                    },
                    set: function (name, obj) {
                        INTERNAL.$setState(systemName, name, obj);
                    },
                    getRef: function (name) {
                        INTERNAL._STATE_[systemName]["ref"][name] = INTERNAL._STATE_[systemName]["ref"][name] || {};
                        return INTERNAL._STATE_[systemName]["ref"][name].data;
                    }
                };
            }
        }
    };

    INTERNAL.burnThread = function (seconds) {
        var e = new Date().getTime() + (seconds * 1000);
        while (new Date().getTime() <= e) { }
    };

    INTERNAL.loadScript = function (src, onload) {
        // todo wrap require js
        //if (src) {
        //    return require(src);
        //}

        onload ? INTERNAL.loadScriptAsync(src, onload) : INTERNAL.loadScriptSync(src);
    };

    INTERNAL.loadScriptAsync = function (src, onload) {
        if (!document) {
            throw "Cannot load script : no document";
            return;
        }

        var script = document.createElement('script');
        script.src = src;
        script.onload = typeof onload === "function" ? onload : function () { };
        document.getElementsByTagName('head')[0].appendChild(script);
    };

    INTERNAL.loadScriptSync = function (src) {
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

    INTERNAL.track = {
        record: function (arg) {
            if (arg.methodName === INTERNAL.DEFAULT_HANDLE_NAME) {
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
                state: INTERNAL.$getState(arg.methodName),
                event: arg.event,
                eventType: arg.eventType
            };

            var recordStr = JSON.stringify(recordObject);

            if (INTERNAL.recordServices) {
                INTERNAL.recordServices = false;
                _light[INTERNAL.systemEventName.onSystemRecordEvent].send(recordStr);
                INTERNAL.recordServices = true;
            }

            if (arg.serviceOrHandleMethodName === INTERNAL.serviceTag) {
                INTERNAL.systemServices[arg.methodName][INTERNAL.serviceEventName[arg.eventType]].send(recordStr);
                if ((arg.eventType === INTERNAL.serviceEventName.error) || (arg.eventType === INTERNAL.serviceEventName.success)) {
                    INTERNAL.systemServices[arg.methodName][INTERNAL.serviceEventName[INTERNAL.serviceEventName.after]].send(recordStr);
                }
            }

            // notify event subscribers
            _light[arg.event].send(recordStr);
            _light[INTERNAL.systemEventName.onSystemEvent].send(recordStr);
        }
    }

    INTERNAL.utility = {
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
                INTERNAL.utility.execSurpressError(function () {
                    success(result, context);
                }, null, context, "trying-service");
            } catch (e) {
                INTERNAL.utility.execSurpressError(function () {
                    error(e, context);
                }, e, context, "service-throws");
            }
        }
    };

    INTERNAL.messageReceivers = {};

    INTERNAL.send = function (messageName, messageArg) {
        INTERNAL.messageReceivers[messageName] = INTERNAL.messageReceivers[messageName] || [];
        var total = INTERNAL.messageReceivers[messageName].length;
        for (var i = 0; i < total; i++) {
            var receiver = INTERNAL.messageReceivers[messageName][i];
            _light(function () {
                this.service[receiver.link](messageArg);
            });
        }
    };
    INTERNAL.receive = function (messageName, fn) {
        INTERNAL.messageReceivers[messageName] = INTERNAL.messageReceivers[messageName] || [];
        var messageItem = { message: messageName };
        messageItem.link = _light.service(INTERNAL.generateUniqueSystemName(), fn);
        INTERNAL.messageReceivers[messageName].push(messageItem);
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
        INTERNAL.eventSubscribers[id] = INTERNAL.eventSubscribers[id] || {};
        INTERNAL.eventSubscribers[id].sub = INTERNAL.eventSubscribers[id].sub || [];
        INTERNAL.eventSubscribers[id].sub.push({
            service: o,
            ref: setUpEventSubscriberBase.ref
        });
        return setUpEventSubscriberBase.ref;
    };

    var createEventEmitter = function (id, f) {
        INTERNAL.eventSubscribers[id] = INTERNAL.eventSubscribers[id] || {};
        INTERNAL.eventSubscribers[id].sub = INTERNAL.eventSubscribers[id].sub || [];
        INTERNAL.eventSubscribers[id].send = INTERNAL.eventSubscribers[id].send || function (o, context, notificationType) {
            var _id = id;
            var l = INTERNAL.eventSubscribers[_id].sub.length;
            for (var i = 0; i < l; i++) {
                var item = INTERNAL.eventSubscribers[_id].sub[i];
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
            INTERNAL.utility.tryCatch(context, function () { return item.service(); }, function () { }, function () { INTERNAL.utility.execSurpressError(item.service.error, o, context, notificationInfo); });
        });
    };

    var setUpEventSubscriber = function (that, event, id) {
        that[event] = function (e) {
            setUpEventSubscriberBase(id, e);
        };
        that["receive"] = that["receive"] || function (name, o) {
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
            var l = INTERNAL.eventSubscribers[id].sub.length;
            for (var i = 0; i < l; i++) {
                var item = INTERNAL.eventSubscribers[id].sub[i];
                f && f(item);
            }
        };
        setUpNotification(id);
        that[event].send = INTERNAL.eventSubscribers[id].send;
    };

    var publishSystemEvent = function (that, event, name) {
        publishSystemEventSubscriptionFx(that, event, name + "." + event);
        that[event].send = INTERNAL.eventSubscribers[name + "." + event].send;
    };

    var getServiceByName = function (serviceName) {
        var item = INTERNAL.systemServices[serviceName];
        return item;
    };

    /*
     !!!!!!!!!!!!!!!!
    */
    function isArray(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    var getApplicablehandle_Test = function (context, serviceItem, definition, serviceName, arg) {
        var testhandleName = INTERNAL._TEST_OBJECTS_ && INTERNAL._TEST_OBJECTS_[serviceName] && INTERNAL._TEST_OBJECTS_[serviceName].handleName;

        var testhandle = INTERNAL._TEST_OBJECTS_ && INTERNAL._TEST_OBJECTS_[serviceName] && INTERNAL._TEST_OBJECTS_[serviceName].handle;

        INTERNAL.track.record({
            entranceOrExit: INTERNAL.entranceTag,
            serviceOrHandleMethodName: INTERNAL.handleTag,
            methodName: testhandleName,
            argumentOrReturnData: serviceName,
            info: arg,
            infoType: INTERNAL.serviceArgTag,
            isTest: true,
            isFirstCallInServiceRun: INTERNAL.unknownTag,
            isLastCallInServiceRun: INTERNAL.unknownTag,
            link: testhandle,
            event: INTERNAL.systemEventName.beforeHandleRun,
            eventType: INTERNAL.serviceEventName.before
        });

        tmpDefinition = testhandle.call(INTERNAL.getCurrentContext(serviceName, definition), definition);

        INTERNAL.track.record({
            entranceOrExit: INTERNAL.exitTag,
            serviceOrHandleMethodName: INTERNAL.handleTag,
            methodName: testhandleName,
            argumentOrReturnData: serviceName,
            info: INTERNAL.unknownTag,
            infoType: INTERNAL.unknownTag,
            isTest: true,
            isFirstCallInServiceRun: INTERNAL.unknownTag,
            isLastCallInServiceRun: INTERNAL.unknownTag,
            link: testhandle,
            event: INTERNAL.systemEventName.afterHandleRun,
            eventType: INTERNAL.serviceEventName.after
        });
        return tmpDefinition;
    };

    var getApplicablehandle_RealTest = function (context, serviceItem, handleName, definition, serviceName, arg, testhandle, testhandleName) {
        if (testhandleName) {
            handleName = testhandleName;
        }
        var lastResult;

        var isAMatch = false;
        var length = INTERNAL.handles.length;
        for (var j = 0; j < length; j++) {
            var handle = INTERNAL.handles[j];
            isAMatch = handleName && (handle.name === handleName);
            if (isAMatch) {
                INTERNAL.track.record({
                    entranceOrExit: INTERNAL.entranceTag,
                    serviceOrHandleMethodName: INTERNAL.handleTag,
                    methodName: handleName,
                    argumentOrReturnData: serviceName,
                    info: arg,
                    infoType: INTERNAL.serviceArgTag,
                    isTest: false,
                    isFirstCallInServiceRun: INTERNAL.unknownTag,
                    isLastCallInServiceRun: INTERNAL.unknownTag,
                    link: (testhandle || handle.definition),
                    event: INTERNAL.systemEventName.beforeHandleRun,
                    eventType: INTERNAL.serviceEventName.before
                });

                tmpDefinition = (testhandle || handle.definition).call(INTERNAL.getCurrentContext(handleName, definition), definition);

                INTERNAL.track.record({
                    entranceOrExit: INTERNAL.exitTag,
                    serviceOrHandleMethodName: INTERNAL.handleTag,
                    methodName: handleName,
                    argumentOrReturnData: serviceName,
                    info: INTERNAL.unknownTag,
                    infoType: INTERNAL.unknownTag,
                    isTest: false,
                    isFirstCallInServiceRun: INTERNAL.unknownTag,
                    isLastCallInServiceRun: INTERNAL.unknownTag,
                    link: (testhandle || handle.definition),
                    event: INTERNAL.systemEventName.afterHandleRun,
                    eventType: INTERNAL.serviceEventName.after
                });

                break;
            }
        }

        return tmpDefinition;
    };

    var getApplicablehandle = function (context, serviceItem, handleName, definition, serviceName, arg) {
        var tmpDefinition;
        var testhandleName = INTERNAL._TEST_OBJECTS_ && INTERNAL._TEST_OBJECTS_[serviceName] && INTERNAL._TEST_OBJECTS_[serviceName].handleName;

        var testhandle = INTERNAL._TEST_OBJECTS_ && INTERNAL._TEST_OBJECTS_[serviceName] && INTERNAL._TEST_OBJECTS_[serviceName].handle;
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
        if (INTERNAL._TEST_OBJECTS_ && INTERNAL._TEST_OBJECTS_[serviceName] && INTERNAL._TEST_OBJECTS_[serviceName].service) {
            handleNames = INTERNAL._TEST_OBJECTS_[serviceName].handleNames || handleNames;
            definition = INTERNAL._TEST_OBJECTS_[serviceName].service || definition;
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

            lastResult = returnDefinitionFromHandle.call(INTERNAL.getCurrentContext(serviceName, lastResult), lastResult);
        }

        return lastResult;
    };

    var createServiceDefinitionFromSuppliedFn = function (context, serviceItem, handleName, definition, serviceName) {
        publishServiceEvent(serviceItem, INTERNAL.serviceEventName.before, serviceName + "." + INTERNAL.serviceEventName.before);
        publishServiceEvent(serviceItem, INTERNAL.serviceEventName.after, serviceName + "." + INTERNAL.serviceEventName.after);
        publishServiceEvent(serviceItem, INTERNAL.serviceEventName.error, serviceName + "." + INTERNAL.serviceEventName.error);
        publishServiceEvent(serviceItem, INTERNAL.serviceEventName.success, serviceName + "." + INTERNAL.serviceEventName.success);

        return function (arg, callerContext) {
            var tArg = {};
            tArg.arg = arg;

            var result;
            context.callerContext = callerContext;
            INTERNAL.utility.tryCatch(context, function () {
                INTERNAL.track.record({
                    entranceOrExit: INTERNAL.entranceTag,
                    serviceOrHandleMethodName: INTERNAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: tArg.arg,
                    info: handleName,
                    infoType: INTERNAL.handleTag,
                    isTest: false,
                    isFirstCallInServiceRun: INTERNAL.unknownTag,
                    isLastCallInServiceRun: INTERNAL.unknownTag,
                    link: definition,
                    event: INTERNAL.systemEventName.beforeServiceRun,
                    eventType: INTERNAL.serviceEventName.before
                });
            }, function (o) {
            }, function (o) {
            });

            INTERNAL.utility.tryCatch(context, function () {
                result = runSuppliedServiceFunction(context, serviceItem, handleName, definition, serviceName, tArg.arg);

                return result;
            }, function (o) {
                INTERNAL.track.record({
                    entranceOrExit: INTERNAL.exitTag,
                    serviceOrHandleMethodName: INTERNAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: o,
                    info: "event:success",
                    infoType: INTERNAL.eventTag,
                    isTest: false,
                    isFirstCallInServiceRun: INTERNAL.unknownTag,
                    isLastCallInServiceRun: INTERNAL.unknownTag,
                    link: definition,
                    event: INTERNAL.systemEventName.onServiceSuccess,
                    eventType: INTERNAL.serviceEventName.success
                });
            }, function (o) {
                INTERNAL.track.record({
                    entranceOrExit: INTERNAL.exitTag,
                    serviceOrHandleMethodName: INTERNAL.serviceTag,
                    methodName: serviceName,
                    argumentOrReturnData: o,
                    info: "event:error",
                    infoType: INTERNAL.eventTag,
                    isTest: false,
                    isFirstCallInServiceRun: INTERNAL.unknownTag,
                    isLastCallInServiceRun: INTERNAL.unknownTag,
                    link: definition,
                    event: INTERNAL.systemEventName.onServiceError,
                    eventType: INTERNAL.serviceEventName.error
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
                serviceName = INTERNAL.generateUniqueSystemName(servicePrefix);
                handleNamesOrDefinition = INTERNAL.DEFAULT_HANDLE_NAME;
            } else {
                if (!INTERNAL.registry.scripts[serviceName]) {
                    INTERNAL.registry.scripts[serviceName] = true;
                    return {
                        load: function (onload) {
                            INTERNAL.loadScript(serviceName, onload && function () {
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
                serviceName = INTERNAL.generateUniqueSystemName(servicePrefix);
            } else {
                //service name is provided
                handleNamesOrDefinition = INTERNAL.DEFAULT_HANDLE_NAME;
            }
        }

        // todo check for unique name
        if (INTERNAL.isRegistered(serviceName)) {
            throw "Unable to create service with name '" + serviceName + "'.Name already exists in registry";
            return;
        }

        INTERNAL.expectNoForbiddenName(serviceName);

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
        INTERNAL.systemServices[serviceName] = serviceItem;
        //!! reg
        INTERNAL.registry.service[serviceName] = {};

        INTERNAL.stateFactory(serviceName);

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

                    res.previousOrMostCurrentResultToBePassedToTheNextActor = arguments.length ? arg : result;
                    var previousOrMostCurrentResultToBePassedToTheNextActor = JSON.parse(JSON.stringify(res)).previousOrMostCurrentResultToBePassedToTheNextActor;

                    result = INTERNAL.systemServices[serviceName](previousOrMostCurrentResultToBePassedToTheNextActor);
                    return chain;
                };
            })(actor);
        };

        if (cb) {
            //todo use async to speed up things
            eachAsync(INTERNAL.systemServices, buildFn, function () {
                cb(chain);
            });
        } else {
            for (var actor in INTERNAL.systemServices) {
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
            typeof f === "function" && f.call(INTERNAL.getCurrentContext(INTERNAL._INTERNAL_SCOPE_NAME, cs), cs);
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
            handleName = INTERNAL.generateUniqueSystemName(handleePrefix);
        }

        if (INTERNAL.isRegistered(handleName)) {
            throw "Unable to create handle with name '" + handleName + "'.Name already exists in registry";
            return;
        }

        INTERNAL.expectNoForbiddenName(handleName);

        INTERNAL.registry.handle[handleName] = {};

        INTERNAL.handles.push({
            name: handleName,
            definition: definition
        });
        INTERNAL.stateFactory(handleName);
        return handleName;
    }

    _light.advanced = {
        test: function (setup, f) {
            INTERNAL._TEST_OBJECTS_ = setup;

            f.call(INTERNAL.getCurrentContext(INTERNAL._INTERNAL_SCOPE_NAME, chainService()), chainService());
            INTERNAL._TEST_OBJECTS_ = undefined
        },
        play: function (records, i, j) {
            i = i || 0;
            j = j || (INTERNAL.track.records.length - 1);

            _light(function (service) {
                var inter = service;
                for (var m = i; m <= j; m++) {
                    var playGround = records && (records || [])[m] || [];
                    if (!playGround) {
                        throw "unable to find service to play service";
                    }

                    if ((playGround.methodType === INTERNAL.serviceTag) && (playGround.dataType === INTERNAL.entranceTag)) {
                        if ((m === i)) {
                            inter = inter[playGround.methodName].call(INTERNAL.getCurrentContext(playGround.methodName, playGround.data, playGround.state), playGround.data);
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
        INTERNAL.Immutable = {
            List: function (obj) {
                return this.Map(obj);
            },
            Map: function (obj) {
                var name = INTERNAL.generateUniqueSystemName("immu");
                var data = { data: obj }
                INTERNAL.ImmutableStore[name] = JSON.stringify(data);
                return {
                    get: function (n) {
                        var out = JSON.parse(INTERNAL.ImmutableStore[name]);
                        return out.data[n];
                    },
                    set: function (n, o) {
                        var out = JSON.parse(INTERNAL.ImmutableStore[name]);
                        out.data[n] = o;
                        var newData = JSON.parse(JSON.stringify(out)).data;

                        return INTERNAL.Immutable.Map(newData);
                    }
                };
            }
        };
    } else {
        INTERNAL.Immutable = Immutable;
    }

    INTERNAL.copy = function (obj) {
        INTERNAL.Immutable.Map({ data: obj }).get('data');
    };

    var init = function () {
        INTERNAL.entranceTag = "argument";
        INTERNAL.exitTag = "result";
        INTERNAL.serviceTag = "service";
        INTERNAL.handleTag = "handle";
        INTERNAL.eventTag = "event";
        INTERNAL.unknownTag = "unknown";

        //SYSTEM EVENTS API
        INTERNAL.systemEventName = {
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
        INTERNAL.serviceEventName = {
            before: "before",
            after: "after",
            error: "error",
            success: "success"
        };

        INTERNAL._TEST_OBJECTS_ = {};
        INTERNAL.systemServices = {};
        INTERNAL.ImmutableStore = {};
        INTERNAL._STATE_ = {};
        INTERNAL.eventSubscribers = {};
        INTERNAL.handles = [];
        INTERNAL._INTERNAL_SCOPE_NAME = INTERNAL.generateUniqueSystemName();
        INTERNAL.stateFactory(INTERNAL._INTERNAL_SCOPE_NAME);
        INTERNAL.DEFAULT_HANDLE_NAME = INTERNAL.generateUniqueSystemName();
        /*
           setup like publishSystemEvent(_light, "event", INTERNAL.generateUniqueSystemName("some id"));
           notify like  _light.event.send(e, context, notificationInfo);
           subscribe like light.event(function (e, context,notificationInfo) {}));
        */

        _light.version = "6.0.0";
        _light.service = defineService;
        _light.Immutable = INTERNAL.Immutable;
        _light.send = INTERNAL.send;
        _light.receive = INTERNAL.receive;

        publishSystemEvent(_light, INTERNAL.systemEventName.onSystemEvent, INTERNAL.generateUniqueSystemName());
        publishSystemEvent(_light, INTERNAL.systemEventName.onSystemRecordEvent, INTERNAL.generateUniqueSystemName());

        publishSystemEvent(_light, INTERNAL.systemEventName.beforeServiceRun, INTERNAL.generateUniqueSystemName());
        publishSystemEvent(_light, INTERNAL.systemEventName.afterServiceRun, INTERNAL.generateUniqueSystemName());
        publishSystemEvent(_light, INTERNAL.systemEventName.beforeHandleRun, INTERNAL.generateUniqueSystemName());
        publishSystemEvent(_light, INTERNAL.systemEventName.afterHandleRun, INTERNAL.generateUniqueSystemName());
        publishSystemEvent(_light, INTERNAL.systemEventName.onServiceError, INTERNAL.generateUniqueSystemName());
        publishSystemEvent(_light, INTERNAL.systemEventName.onServiceSuccess, INTERNAL.generateUniqueSystemName());

        _light.handle(INTERNAL.DEFAULT_HANDLE_NAME, function (definition) { return definition; });
    };

    init();

    INTERNAL.system = {
        startRecording: function () {
            INTERNAL.recordServices = true;
        },
        stopRecording: function () {
            INTERNAL.recordServices = false;
        },
    };

    /***********************EXTENSIONS*********************************************/
    _light.ServiceDataList = function (dataServiceName, initialData) {
        return _light.service(dataServiceName, function (data) {
            var records = this.state.get("records") || initialData || [];
            if (data) {
                records.push(data);
                this.state.set("records", records);
            }
            return records;
        });
    };
    _light.ServiceDataObject = function (dataServiceName, initialData) {
        return _light.service(dataServiceName, function (data) {
            var record = this.state.get("record");
            if (data) {
                this.state.set("record", data);
                return data;
            } else {
                if (typeof record === "undefined") {
                    record = initialData;
                    this.state.set("record", record);
                }
                return record;
            }
        });
    };
    /********************************************************************/

    return _light;
})() : console.log("light script already exists");

if (typeof module !== "undefined" && ('exports' in module)) {
    module.exports = light;
}

if (typeof define === 'function' && define.amd) {
    define('light', [], function () { return light; });
}