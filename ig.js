if (!window.IG) window.IG = {
    _client_id: null,
    _session: null,
    _logging: false,
    _domain: {
        // api: 'https://api.instagram.com/'
        api: 'http://instagram.local/',
    },
    getDomain: function (site) {
        switch (site) {
            case 'api':
            return IG._domain.api;
        }
    },
    provide: function (name, literal) {
        return IG.copy(IG.create(name), literal);
    },
    copy: function (to_object, from_object) {
        for (key in from_object) {
            if (typeof to_object[key] === 'undefined') {
                to_object[key] = from_object[key];
            }
        }
        return to_object;
    },
    create: function (key_or_keys, object) {
        var root = window.IG,
            keys = key_or_keys ? key_or_keys.split('.') : [],
            num_keys = keys.length;
        for (var i = 0; i < num_keys; i++) {
            var key = keys[i];
            var child = root[key];
            if (!child) {
                child = (object && i + 1 == num_keys) ? object : {};
                root[key] = child;
            }
            root = child;
        }
        return root;
    },
    guid: function () {
        return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
    },
    log: function (message) {
        if (IG._logging) {
            if (window.Debug && window.Debug.writeln) {
                window.Debug.writeln(message);
            } else if (window.console) {
                window.console.log(message);
            }
        }
    }
};
IG.provide('Array', {
    forEach: function (array, fn) {
        if (!array) {
            return;
        }

        if (Object.prototype.toString.apply(array) === '[object Array]' || (!(array instanceof Function) && typeof array.length == 'number')) {
            if (array.forEach) {
                array.forEach(fn);
            } else {
                for (var i = 0, length = array.length; i < length; i++) {
                    fn(array[i], i, array);
                }
            }
        } else {
            for (var key in array) {
                if (array.hasOwnProperty(key)) {
                    fn(array[key], key, array);
                }
            }
        }
    },
    join: function (array, delimiter) {
        var join_string = '';

        IG.Array.forEach(array, function (value, key) {
            join_string += value + delimiter;
        });

        join_string = join_string.substr(0, join_string.lastIndexOf(delimiter));

        return join_string;
    }
});
IG.provide('QS', {
    encode: function (object, delimiter, encode) {
        delimiter = (delimiter === undefined) ? '&' : delimiter;
        encoder = (encode === false) ?
            function (component) {
                return component;
            } : encodeURIComponent;
        var pairs = [];
        IG.Array.forEach(object, function (value, key) {
            if (value !== null && typeof value != 'undefined') {
                pairs.push(encoder(key) + '=' + encoder(value));
            }
        });
        pairs.sort();
        return pairs.join(delimiter);
    },
    decode: function(string) {
        var pairs = string.split('&'),
            object = {};

        for (var i = 0; i < pairs.length; i++) {
            pair = pairs[i].split('=', 2);
            if (pair && pair[0]) {
                object[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
            }
        }

        return object;
    }
});
IG.provide('JSON', {
    stringify: function (object) {
        if (window.Prototype && Object.toJSON) {
            return Object.toJSON(object);
        } else {
            return JSON.stringify(object);
        }
    },
    parse: function (string) {
        return JSON.parse(string);
    },
    flatten: function (object) {
        var flat_object = {};

        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                var value = object[key];

                if (value === null || value === undefined) {
                    continue;
                } else if (typeof value == 'string') {
                    flat_object[key] = value;
                } else {
                    flat_object[key] = IG.JSON.stringify(value);
                }
            }
        }
        return flat_object;
    }
});
IG.provide('EventProvider', {
    subscribers: function () {
        if (!this._subscribersMap) {
            this._subscribersMap = {};
        }
        return this._subscribersMap;
    },
    subscribe: function (event_name, callback) {
        IG.log('Subscription to: ' + event_name);
        var subscribers = this.subscribers();
        if (!subscribers[event_name]) {
            subscribers[event_name] = [callback];
        } else {
            subscribers[event_name].push(callback);
        }
    },
    unsubscribe: function (event_name, callback) {
        var subscribers = this.subscribers()[event_name];
        IG.Array.forEach(subscribers, function (event_callback, i) {
            if (event_callback == callback) {
                subscribers[i] = null;
            }
        });
    },
    monitor: function (event_name, callback) {
        if (!callback()) {
            var event_provider = this,
                bound_callback = function () {
                    if (callback.apply(callback, arguments)) {
                        event_provider.unsubscribe(event_name, bound_callback);
                    }
                };
            this.subscribe(event_name, bound_callback);
        }
    },
    clear: function(event_name) {
        delete this.subscribers()[event_name];
    },
    fire: function () {
        var event_args = Array.prototype.slice.call(arguments),
            event_name = event_args.shift();

        IG.log('Fire for: ' + event_name);
        IG.Array.forEach(this.subscribers()[event_name], function (subscriber) {
            if (subscriber) {
                subscriber.apply(this, event_args);
            }
        });
    }
});
IG.provide('Event', IG.EventProvider);
IG.provide('XD', {
    _origin: null,
    _transport: null,
    _callbacks: {},
    init: function () {
        if (IG.XD._origin) {
            IG.log('XD.init called with "XD._origin" already set. Returning.');
            return;
        }

        if (window.addEventListener && !window.attachEvent && window.postMessage) {
            IG.XD._origin = (window.location.protocol + '//' + window.location.host + '/' + IG.guid());
            IG.XD.PostMessage.init();
            IG.XD._transport = 'postmessage';
        }
    },
    handler: function (callback, relation) {
        var proxy_url = IG.getDomain('api') + 'oauth/xd_proxy/#',
            callback_guid = IG.guid();
        // TODO: transport fragment
        IG.XD._callbacks[callback_guid] = callback;
        return proxy_url + IG.QS.encode({
            cb: callback_guid,
            origin: IG.XD._origin,
            relation: relation || 'opener'
        });
    },
    recv: function (data) {
        if (typeof data == 'string') {
            data = IG.QS.decode(data);
        }
        var callback = IG.XD._callbacks[data.cb];
        delete IG.XD._callbacks[data.cb];
        if (callback) {
            callback(data);
        }
    },
    PostMessage: {
        init: function () {
            var handler = IG.XD.PostMessage.onMessage;
            if (window.addEventListener) {
                window.addEventListener('message', handler, false);
            } else {
                window.attachEvent('onmessage', handler);
            }
        },
        onMessage: function (event) {
            IG.XD.recv(event.data);
        }
    }
});
IG.provide('', {
    ui: function (options, callback) {
        var prepared_options = IG.UIServer.prepareCall(options, callback);
        if (!prepared_options) {
            IG.log('"prepareCall" failed to return options');
            return;
        }

        var display = prepared_options.params.display;
        var display_method = IG.UIServer[display];
        if (!display_method) {
            IG.log('"display" must be "popup"');
            return;
        }

        display_method(prepared_options);
    }
});
IG.provide('UIServer', {
    Methods: {},
    _active: {},
    _defaultCb: {},
    prepareCall: function (options, callback) {
        var method_name = options.method.toLowerCase(),
            method = IG.UIServer.Methods[method_name],
            popup_id = IG.guid();

        IG.copy(options, {
            client_id: IG._client_id,
            redirect_uri: IG._redirect_uri
        });

        if (!method.url) {
            method.url = 'oauth/' + method_name;
            delete options.method;
        }

        var prepared_options = {
            callback: callback,
            id: popup_id,
            size: method.size,
            url: IG.getDomain('api') + method.url,
            params: options
        };

        if (method.transform) {
            prepared_options = method.transform(prepared_options);
        }

        var relation = IG.UIServer.getXdRelation(prepared_options.params.display);
        prepared_options.params.redirect_uri = IG.UIServer._xdResult(prepared_options.callback, prepared_options.id, relation, true);

        prepared_options.params = IG.JSON.flatten(prepared_options.params);
        var query_string = IG.QS.encode(prepared_options.params);
        if (query_string) {
            prepared_options.url += '?' + query_string;
        }

        return prepared_options;
    },
    getXdRelation: function (display) {
        if (display === 'popup') return 'opener';
    },
    popup: function (options) {
        var screenX = typeof window.screenX != 'undefined' ? window.screenX : window.screenLeft,
            screenY = typeof window.screenY != 'undefined' ? window.screenY : window.screenTop,
            clientWidth = typeof window.outerWidth != 'undefined' ? window.outerWidth : document.documentElement.clientWidth,
            clientHeight = typeof window.outerHeight != 'undefined' ? window.outerHeight : (document.documentElement.clientHeight - 22),
            popupWidth = options.size.width,
            popupHeight = options.size.height,
            screenWidth = (screenX < 0) ? window.screen.width + screenX : screenX,
            popupX = parseInt(screenWidth + ((clientWidth - popupWidth) / 2), 10),
            popupY = parseInt(screenY + ((clientHeight - popupHeight) / 2.5), 10),
            popupFeatures = ('width=' + popupWidth + ',height=' + popupHeight + ',left=' + popupX + ',top=' + popupY + ',scrollbars=1,location=1,toolbar=0');
        IG.log('opening popup: ' + options.id);
        IG.UIServer._active[options.id] = window.open(options.url, options.id, popupFeatures);
    },
    _xdRedirectUriHandler: function (callback, guid, relation, set_default) {
        if (set_default) {
            IG.UIServer._defaultCb[guid] = callback;
        }
        return IG.XD.handler(function (response) {
            IG.UIServer._xdRecv(response, callback);
        }, relation) + '&frame=' + guid;
    },
    _xdRecv: function (response, callback) {
        var win = IG.UIServer._active[response.frame];
        try {
            if (win.close) {
                win.close();
            }
        } catch (e) {}
        delete IG.UIServer._active[response.frame];
        delete IG.UIServer._defaultCb[response.frame];
        callback(response);
    },
    _xdResult: function (callback, guid, relation, set_default) {
        return (IG.UIServer._xdRedirectUriHandler(function (response) {
            if (callback) {
                if (response.result) {
                    callback(IG.JSON.parse(response.result));
                }
            }
        }, guid, relation, set_default));
    }
});
IG.provide('', {
    getLoginStatus: function () {
        if (!IG.client_id) {
            IG.log('IG.getLoginStatus() called before calling IG.init().');
            return;
        }
    },
    login: function (callback, options) {
        IG.ui(IG.copy({
            display: 'popup',
            method: 'authorize'
        }, options || {}), callback);
    },
    logout: function (callback) {
        IG.Auth.setSession();
    }
});
IG.provide('Auth', {
    setSession: function (session) {
        var did_login = !IG._session && session,
            did_logout = IG._session && !session,
            session_changed = did_login || did_logout || (IG._session && session && IG._session.access_token != session.access_token);

        IG._session = session;

        var session_wrapper = {session: session};

        if (session_changed && IG.Cookie.getEnabled()) {
            IG.Cookie.set(session);
        }

        if (did_login) {
            IG.Event.fire('auth.login', session_wrapper);
        }

        if (did_logout) {
            IG.Event.fire('auth.logout', session_wrapper);
        }

        if (session_changed) {
            IG.Event.fire('auth.sessionChange', session_wrapper);
        }

        return session_wrapper;
    },
    xdResponseWrapper: function (callback) {
        return function (response) {
            try {
                session_object = IG.JSON.parse(response.session || null);
            } catch (e) {}

            var session = IG.Auth.setSession(session_object || null),
                additional_vars = ['scope', 'code', 'error', 'error_reason', 'error_description'];

            if (response) {
                IG.Array.forEach(additional_vars, function (var_name) {
                    session[var_name] = response[var_name] || null;
                });
            }

            if (callback) {
                callback(session);
            }
        }
    }
});
IG.provide('UIServer.Methods', {
    'authorize': {
        size: {
            width: 627,
            height: 326
        },
        transform: function (options) {
            if (!IG._client_id) {
                IG.log('IG.login() called before claling IG.init().');
                return;
            }

            if (options.params.scope) {
                options.params.scope = IG.Array.join(options.params.scope, ' ');
            }

            options.callback = IG.Auth.xdResponseWrapper(options.callback);

            return options;
        }
    }
});
IG.provide('Cookie', {
    _domain: null,
    _enabled: false,
    setEnabled: function (enabled) {
        IG.Cookie._enabled = enabled;
    },
    getEnabled: function () {
        return IG.Cookie._enabled;
    },
    load: function () {
        var cookie_match = document.cookie.match('\\bigs_' + IG._client_id + '="([^;]*)\\b'),
            value;

        if (cookie_match) {
            value= IG.QS.decode(cookie_match[1]);
            if (value.expires) {
                value.expires = parseInt(value.expires, 10);
            }
            IG.Cookie._domain = value.base_domain;
        }

        return value;
    },
    setRaw: function (value, timestamp, domain) {
        document.cookie = 'igs_' + IG._client_id + '="' + value + '"' + (value && timestamp == 0 ? '' : '; expires=' + new Date(timestamp * 1000).toGMTString()) + '; path=/' + (domain ? '; domain=.' + domain : '');
        IG.Cookie._domain = domain;
    },
    set: function (value) {
        if (value) {
            IG.Cookie.setRaw(IG.QS.encode(value), value.expires, value.base_domain);
        } else {
            IG.Cookie.clear();
        }
    },
    clear: function () {
        IG.Cookie.setRaw('', 0, IG.Cookie._domain);
    }
});
IG.provide('', {
    init: function (settings) {
        IG._client_id = settings.client_id;
        IG._logging = settings.logging || typeof settings.logging == 'undefined' && window.location.toString().indexOf('ig_debug=1') > 0;

        IG.XD.init();

        if (IG._client_id) {
            IG.Cookie.setEnabled(settings.cookie);

            settings.session = settings.session || settings.cookie && IG.Cookie.load();
            IG.Auth.setSession(settings.session);
        }
    }
});
window.setTimeout(function(){
    if (window.igAsyncInit && !window.igAsyncInit.hasRun) {
        window.igAsyncInit.hasRun = true;
        igAsyncInit();
    }
}, 0);
