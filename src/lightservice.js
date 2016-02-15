var light = (typeof light === "undefined") ? (function () {
    var INTERNAL = {};
    INTERNAL.getCurrentContext = function (storeName, arg, storeOverride) {
        var store = storeOverride ? JSON.parse(JSON.stringify({ data: storeOverride })).data : storeOverride

        var incontext = {
            event: INTERNAL.sysServ,
            serviceChain: chainService,
            service: function () {
                return chainService(undefined, true);
            },
            arg: arg,
            system: INTERNAL.system,
            store: INTERNAL.STR[storeName].api(store)
        };
        return incontext;
    };
    INTERNAL.forbiddenNames = {
        result: true,
        service: true,
        handle: true,
        on: true,
        before: true,
        after: true,
        error: true,
        success: true
    };

    INTERNAL.noForbName = function (name) {
        if (INTERNAL.forbiddenNames[name]) {
            throw "You cannot use the name '" + name + "'";
        }
    };

    INTERNAL.rgi = {
        service: {},
        handle: {},
        scripts: {}
    };

    INTERNAL.isRegistered = function (str) {
        if (INTERNAL.rgi.service[str] || INTERNAL.rgi.handle[str]) {
            return true;
        }
        return false;
    };

    INTERNAL.genName = function (prefix) {
        INTERNAL.genName.num = INTERNAL.genName.num || 0;
        INTERNAL.genName.num++;
        prefix = prefix || "ls";
       // var str = (prefix + '_xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx')["replace"](/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8; return v.toString(16); });
        var str = prefix + INTERNAL.genName.num;
        if (INTERNAL.isRegistered(str)) {
            return INTERNAL.genName(prefix);
        }
        return str;
    }

    INTERNAL.$setState = function (systemName, name, obj) {
        INTERNAL.STR[systemName]["ref"][name] = { data: obj };
        INTERNAL.STR[systemName]["store"][name] = JSON.stringify(INTERNAL.STR[systemName]["ref"][name]);
    };
    INTERNAL.$getState = function (systemName) {
        var storeRoot = INTERNAL.STR[systemName];
        return storeRoot && (INTERNAL.STR[systemName]["store"] || {});
    };

    //$storeOverride

    INTERNAL.storeFactory = function (systemName) {
        INTERNAL.STR[systemName] = {
            store: {},
            ref: {},
            api: function (storeOverride) {
                if (storeOverride) {
                    INTERNAL.STR[systemName]["store"] = storeOverride;
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
                        INTERNAL.STR[systemName]["ref"][name] = INTERNAL.STR[systemName]["ref"][name] || {};
                        return INTERNAL.STR[systemName]["ref"][name].data;
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
            if (arg.methodName === INTERNAL.DEF_HDLNM) {
                return;
            }

            var recordObject = {
                dataType: arg.dataType,
                methodType: arg.methodType,
                methodName: arg.methodName,
                time: Date.now ? Date.now() : new Date().getTime(),
                isFirst: arg.isFirst,
                isLast: arg.isLast,
                data: arg.data,
                isTest: arg.isTest || false,
                info: arg.info,
                infoType: arg.infoType,
                link: typeof arg.link === "function" ? arg.link.toString() : arg.link,
                store: INTERNAL.$getState(arg.methodName),
                event: arg.event,
                eventType: arg.eventType
            };

            var recordStr = JSON.stringify(recordObject);

            if (INTERNAL.recordServices) {
                INTERNAL.recordServices = false;
                _light[INTERNAL.sysEvName.onSystemRecordEvent].send(recordStr);
                INTERNAL.recordServices = true;
            }

            if (arg.methodType === INTERNAL.serviceTag) {
                INTERNAL.sysServ[arg.methodName][INTERNAL.serviceEventName[arg.eventType]].send(recordStr);
                if ((arg.eventType === INTERNAL.serviceEventName.error) || (arg.eventType === INTERNAL.serviceEventName.success)) {
                    INTERNAL.sysServ[arg.methodName][INTERNAL.serviceEventName[INTERNAL.serviceEventName.after]].send(recordStr);
                }
            }

            // notify event subscribers
            _light[arg.event].send(recordStr);
            _light[INTERNAL.sysEvName.onSystemEvent].send(recordStr);
        }
    }

    INTERNAL.utility = {
        xSupErr: function (o, e, context, notificationInfo) {
            if (typeof o === "function") {
                try { o(e, context, notificationInfo); } catch (ex) {
                    console.error("ERROR : " + ex);
                }
            }
        },
        tc: function (context, f, success, error) {
            try {
                var result = f();
                INTERNAL.utility.xSupErr(function () {
                    success(result, context);
                }, null, context, "trying-service");
            } catch (e) {
                INTERNAL.utility.xSupErr(function () {
                    console.error("ERROR : " + e);
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
                this.serviceChain()[receiver.link](messageArg).result();
            });
        }
    };
    INTERNAL.receive = function (messageName, fn) {
        INTERNAL.messageReceivers[messageName] = INTERNAL.messageReceivers[messageName] || [];
        var messageItem = { message: messageName };
        messageItem.link = _light.service(INTERNAL.genName(), INTERNAL.DEF_HDLNM, fn);
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
            INTERNAL.utility.tc(context, function () { return item.service(); }, function () { }, function () { INTERNAL.utility.xSupErr(item.service().error, o, context, notificationInfo); });
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
        var item = INTERNAL.sysServ[serviceName];
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
            dataType: INTERNAL.entranceTag,
            methodType: INTERNAL.handleTag,
            methodName: testhandleName,
            data: serviceName,
            info: arg,
            infoType: INTERNAL.serviceArgTag,
            isTest: true,
            isFirst: INTERNAL.unknownTag,
            isLast: INTERNAL.unknownTag,
            link: testhandle,
            event: INTERNAL.sysEvName.beforeHandleRun,
            eventType: INTERNAL.serviceEventName.before
        });

        tmpDefinition = testhandle.call(INTERNAL.getCurrentContext(serviceName, definition), definition);

        INTERNAL.track.record({
            dataType: INTERNAL.exitTag,
            methodType: INTERNAL.handleTag,
            methodName: testhandleName,
            data: serviceName,
            info: INTERNAL.unknownTag,
            infoType: INTERNAL.unknownTag,
            isTest: true,
            isFirst: INTERNAL.unknownTag,
            isLast: INTERNAL.unknownTag,
            link: testhandle,
            event: INTERNAL.sysEvName.afterHandleRun,
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
                    dataType: INTERNAL.entranceTag,
                    methodType: INTERNAL.handleTag,
                    methodName: handleName,
                    data: serviceName,
                    info: arg,
                    infoType: INTERNAL.serviceArgTag,
                    isTest: false,
                    isFirst: INTERNAL.unknownTag,
                    isLast: INTERNAL.unknownTag,
                    link: (testhandle || handle.definition),
                    event: INTERNAL.sysEvName.beforeHandleRun,
                    eventType: INTERNAL.serviceEventName.before
                });

                tmpDefinition = (testhandle || handle.definition).call(INTERNAL.getCurrentContext(handleName, definition), definition);

                INTERNAL.track.record({
                    dataType: INTERNAL.exitTag,
                    methodType: INTERNAL.handleTag,
                    methodName: handleName,
                    data: serviceName,
                    info: INTERNAL.unknownTag,
                    infoType: INTERNAL.unknownTag,
                    isTest: false,
                    isFirst: INTERNAL.unknownTag,
                    isLast: INTERNAL.unknownTag,
                    link: (testhandle || handle.definition),
                    event: INTERNAL.sysEvName.afterHandleRun,
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

    var runSupServFn = function (context, serviceItem, handleNames, definition, serviceName, arg) {
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
            INTERNAL.utility.tc(context, function () {
                INTERNAL.track.record({
                    dataType: INTERNAL.entranceTag,
                    methodType: INTERNAL.serviceTag,
                    methodName: serviceName,
                    data: tArg.arg,
                    info: handleName,
                    infoType: INTERNAL.handleTag,
                    isTest: false,
                    isFirst: INTERNAL.unknownTag,
                    isLast: INTERNAL.unknownTag,
                    link: definition,
                    event: INTERNAL.sysEvName.beforeServiceRun,
                    eventType: INTERNAL.serviceEventName.before
                });
            }, function (o) {
            }, function (o) {
            });

            INTERNAL.utility.tc(context, function () {
                result = runSupServFn(context, serviceItem, handleName, definition, serviceName, tArg.arg);

                return result;
            }, function (o) {
                INTERNAL.track.record({
                    dataType: INTERNAL.exitTag,
                    methodType: INTERNAL.serviceTag,
                    methodName: serviceName,
                    data: o,
                    info: "event:success",
                    infoType: INTERNAL.eventTag,
                    isTest: false,
                    isFirst: INTERNAL.unknownTag,
                    isLast: INTERNAL.unknownTag,
                    link: definition,
                    event: INTERNAL.sysEvName.onServiceSuccess,
                    eventType: INTERNAL.serviceEventName.success
                });
            }, function (o) {
                INTERNAL.track.record({
                    dataType: INTERNAL.exitTag,
                    methodType: INTERNAL.serviceTag,
                    methodName: serviceName,
                    data: o,
                    info: "event:error",
                    infoType: INTERNAL.eventTag,
                    isTest: false,
                    isFirst: INTERNAL.unknownTag,
                    isLast: INTERNAL.unknownTag,
                    link: definition,
                    event: INTERNAL.sysEvName.onServiceError,
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
                serviceName = INTERNAL.genName(servicePrefix);
                handleNamesOrDefinition = INTERNAL.DEF_HDLNM;
            } else {
                if (!INTERNAL.rgi.scripts[serviceName]) {
                    INTERNAL.rgi.scripts[serviceName] = true;
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
                serviceName = INTERNAL.genName(servicePrefix);
            } else {
                //service name is provided
                handleNamesOrDefinition = INTERNAL.DEF_HDLNM;
            }
        }

        // todo check for unique name
        if (INTERNAL.isRegistered(serviceName)) {
            throw "'" + serviceName + "' already exists";
            return;
        }

        INTERNAL.noForbName(serviceName);

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
        var serviceItem = function (nextArg) {
            return serviceItem.redefinition(nextArg);
        };

        serviceItem.redefinition = createServiceDefinitionFromSuppliedFn(context, serviceItem, handleNamesOrDefinition, definition, serviceName);

        serviceItem.me = serviceName;
        INTERNAL.sysServ[serviceName] = serviceItem;
        //!! reg
        INTERNAL.rgi.service[serviceName] = {};

        INTERNAL.storeFactory(serviceName);

        return serviceName;
    };

    var eachAsync = function (actors, func, cb) {
        for (var actor in actors) {
            func(actor);
        }
        cb();
    }

    var chainService = function (cb, noChain) {
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

                    res.nextArg = arguments.length ? arg : result;
                    var nextArg = JSON.parse(JSON.stringify(res)).nextArg;

                    result = INTERNAL.sysServ[serviceName](nextArg);
                    return noChain ? result : chain;
                };
            })(actor);
        };

        if (cb) {
            //todo use async to speed up things
            eachAsync(INTERNAL.sysServ, buildFn, function () {
                cb(chain);
            });
        } else {
            for (var actor in INTERNAL.sysServ) {
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
       
        chainService(function (cs) {
            typeof f === "function" && f.call(INTERNAL.getCurrentContext(INTERNAL._INTERNAL_SCOPE_NAME, cs), cs);
        });
        
    };

    _light.startService = function (f) {
        _light(f);
    };

    _light.handle = function (handleName, definition) {
        var handleePrefix = "handle_";
        if ((arguments.length == 0) || (arguments.length > 2)) {
            throw "handle definition error"
            return;
        }

        if (arguments.length == 1) {
            if (typeof handleName !== "function") {
                throw "expects handle to be a function";
                return;
            }
            definition = handleName;
            handleName = INTERNAL.genName(handleePrefix);
        }

        if (INTERNAL.isRegistered(handleName)) {
            throw " handle '" + handleName + "' already exists ";
            return;
        }

        INTERNAL.noForbName(handleName);

        INTERNAL.rgi.handle[handleName] = {};

        INTERNAL.handles.push({
            name: handleName,
            definition: definition
        });
        INTERNAL.storeFactory(handleName);
        return handleName;
    }

    _light.advanced = {
        test: function (setup, f) {
            INTERNAL._TEST_OBJECTS_ = setup;
            f.call(INTERNAL.getCurrentContext(INTERNAL._INTERNAL_SCOPE_NAME, chainService), chainService);
            INTERNAL._TEST_OBJECTS_ = undefined
        },
        canPlay: function (methodType, dataType) {
            return (methodType === INTERNAL.serviceTag) && (dataType === INTERNAL.entranceTag);
        },
        playService: function ( methodName,  data,  store) {
            _light(function (serviceChain) {
                return _light.advanced.playServiceChain(serviceChain, methodName, INTERNAL.serviceTag, data, INTERNAL.entranceTag, store || {}, false).result();
            });
        },
        playServiceChain: function (serviceChain, methodName, methodType, data, dataType, store, notFirstInChain) {
            if (_light.advanced.canPlay(methodType, dataType)) {
                if (!notFirstInChain) {
                    serviceChain = serviceChain[methodName].call(INTERNAL.getCurrentContext(methodName, data, store), data);
                } else {
                    serviceChain = serviceChain[methodName]();
                }
            }
            return serviceChain;
        },
        play: function (records, i, j) {
            i = i || 0;
            j = j || (records.length - 1);
            _light(function (serviceChain) {
               
                for (var m = i; m <= j; m++) {
                    var playGround = records && (records || [])[m] || [];
                    if (!playGround) {
                        throw "no service to play";
                    }
                    serviceChain = _light.advanced.playServiceChain(serviceChain, playGround.methodName, playGround.methodType, playGround.data, playGround.dataType, playGround.store, m !== i);
                }
                var result = serviceChain.result();
            });
        }
    };

    if (typeof Immutable === "undefined") {
        INTERNAL.Immutable = {
            List: function (obj) {
                return this.Map(obj);
            },
            Map: function (obj) {
                var name = INTERNAL.genName("immu");
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
        INTERNAL.sysEvName = {
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
        INTERNAL.sysServ = {};
        INTERNAL.ImmutableStore = {};
        INTERNAL.STR = {};
        INTERNAL.eventSubscribers = {};
        INTERNAL.handles = [];
        INTERNAL._INTERNAL_SCOPE_NAME = INTERNAL.genName();
        INTERNAL.storeFactory(INTERNAL._INTERNAL_SCOPE_NAME);
        INTERNAL.DEF_HDLNM = INTERNAL.genName();
        /*
           setup like publishSystemEvent(_light, "event", INTERNAL.genName("some id"));
           notify like  _light.event.send(e, context, notificationInfo);
           subscribe like light.event(function (e, context,notificationInfo) {}));
        */

        _light.version = "6.0.0";
        _light.service = defineService;
        _light.Immutable = INTERNAL.Immutable;
        _light.send = INTERNAL.send;
        _light.receive = INTERNAL.receive;

        publishSystemEvent(_light, INTERNAL.sysEvName.onSystemEvent, INTERNAL.genName());
        publishSystemEvent(_light, INTERNAL.sysEvName.onSystemRecordEvent, INTERNAL.genName());

        publishSystemEvent(_light, INTERNAL.sysEvName.beforeServiceRun, INTERNAL.genName());
        publishSystemEvent(_light, INTERNAL.sysEvName.afterServiceRun, INTERNAL.genName());
        publishSystemEvent(_light, INTERNAL.sysEvName.beforeHandleRun, INTERNAL.genName());
        publishSystemEvent(_light, INTERNAL.sysEvName.afterHandleRun, INTERNAL.genName());
        publishSystemEvent(_light, INTERNAL.sysEvName.onServiceError, INTERNAL.genName());
        publishSystemEvent(_light, INTERNAL.sysEvName.onServiceSuccess, INTERNAL.genName());

        _light.handle(INTERNAL.DEF_HDLNM, function (definition) { return definition; });
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
            var records = this.store.get("records") || initialData || [];
            if (data) {
                records.push(data);
                this.store.set("records", records);
            }
            return records;
        });
    };
    _light.ServiceDataObject = function (dataServiceName, initialData) {
        return _light.service(dataServiceName, function (data) {
            var record = this.store.get("record");
            if (data) {
                this.store.set("record", data);
                return data;
            } else {
                if (typeof record === "undefined") {
                    record = initialData;
                    this.store.set("record", record);
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