if (!window.IG) {
    window.IG = {
        _client_id: null,
        _session: null,
        _userStatus: 'unknown',
        _logging: false,
        _domain: {
            // https_com: 'http://instagram.local/',
            https_com: 'https://instagram.com/',
            api: 'http://api.instagram.com/'
        },
        getDomain: function (site) {
            switch (site) {
                case 'https_com':
                    return IG._domain.https_com;
                case 'api':
                    return IG._domain.api;
            }
        },
        provide: function (name, literal) {
            return IG.copy(IG.create(name), literal);
        },
        copy: function (to_object, from_object) {
            var key;
            for (key in from_object) {
                if (from_object.hasOwnProperty(key)) {
                    if (typeof to_object[key] === 'undefined') {
                        to_object[key] = from_object[key];
                    }
                }
            }
            return to_object;
        },
        create: function (key_or_keys, object) {
            var root = window.IG,
                keys = key_or_keys ? key_or_keys.split('.') : [],
                num_keys = keys.length,
                i;
            for (i = 0; i < num_keys; i++) {
                var key = keys[i];
                var child = root[key];
                if (!child) {
                    child = (object && i + 1 === num_keys) ? object : {};
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
        },
        $: function (id) {
            return document.getElementById(id);
        }
    };
    IG.provide('Array', {
        forEach: function (array, fn) {
            var i, key;

            if (!array) {
                return;
            }

            if (Object.prototype.toString.apply(array) === '[object Array]' || (!(array instanceof Function) && typeof array.length === 'number')) {
                if (array.forEach) {
                    array.forEach(fn);
                } else {
                    for (i = 0, length = array.length; i < length; i++) {
                        fn(array[i], i, array);
                    }
                }
            } else {
                for (key in array) {
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
                if (value !== null && typeof value !== 'undefined') {
                    pairs.push(encoder(key) + '=' + encoder(value));
                }
            });
            pairs.sort();
            return pairs.join(delimiter);
        },
        decode: function(string) {
            var pairs = string.split('&'),
                object = {},
                i;

            for (i = 0; i < pairs.length; i++) {
                pair = pairs[i].split('=', 2);
                if (pair && pair[0]) {
                    object[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                }
            }

            return object;
        }
    });
    IG.provide('Content', {
        _root: null,
        _hiddenRoot: null,
        _callbacks: {},
        append: function (element_or_html, root) {
            if (!root) {
                if (!IG.Content._root) {
                    IG.Content._root = root = IG.$('ig-root');
                    if (!root) {
                        IG.log('The "ig-root" div has not been created.');
                        return;
                    }
                } else {
                    c = IG.Content._root;
                }
            }
            if (typeof element_or_html === 'string') {
                var div = document.createElement('div');
                root.appendChild(div).innerHTML = element_or_html;
                return div;
            } else {
                return root.appendChild(element_or_html);
            }
        },
        appendHidden: function (options) {
            if (!IG.Content._hiddenRoot) {
                var div = document.createElement('div');

                div.style.position = 'absolute';
                div.style.top = '-10000px';
                div.style.width = div.style.height = 0;

                IG.Content._hiddenRoot = IG.Content.append(div);
            }

            return IG.Content.append(options, IG.Content._hiddenRoot);
        },
        insertIframe: function (options) {
            options.id = options.id || IG.guid();
            options.name = options.name || IG.guid();

            var callback_guid = IG.guid(),
                callback_ready = false,
                callback_fired = false;

            IG.Content._callbacks[callback_guid] = function () {
                if (callback_ready && !callback_fired) {
                    callback_fired = true;
                    if (options.onload) {
                        options.onload(options.root.firstChild);
                    }
                }
            };

            if (document.attachEvent) {
                var html = ('<iframe' + ' id="' + options.id + '"' +
                            ' name="' + options.name + '"' +
                            (options.title ? ' title="' + options.title + '"' : '') +
                            (options.className ? ' class="' + options.className + '"' : '') +
                            ' style="border:none;' + (options.width ? 'width:' + options.width + 'px;' : '') +
                            (options.height ? 'height:' + options.height + 'px;' : '') + '"' +
                            ' src="' + options.url + '"' +
                            ' frameborder="0"' +
                            ' scrolling="no"' +
                            ' allowtransparency="true"' +
                            ' onload="IG.Content._callbacks.' + callback_guid + '()"' + '></iframe>');

                options.root.innerHTML = '<iframe src="javascript:false"' +
                                         ' frameborder="0"' +
                                         ' scrolling="no"' +
                                         ' style="height:1px"></iframe>';
                callback_ready = true;
                window.setTimeout(function () {
                    options.root.innerHTML = html;
                }, 0);
            } else {
                var iframe = document.createElement('iframe');
                iframe.id = options.id;
                iframe.name = options.name;
                iframe.onload = IG.Content._callbacks[callback_guid];
                iframe.scrolling = 'no';
                iframe.style.border = 'none';
                iframe.style.overflow = 'hidden';
                if (options.title) {
                    iframe.title = options.title;
                }
                if (options.className) {
                    iframe.className = options.className;
                }
                if (options.height) {
                    iframe.height = options.height;
                }
                if (options.width) {
                    iframe.width = options.width;
                }
                options.root.appendChild(iframe);
                callback_ready = true;
                iframe.src = options.url;
            }
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
            var flat_object = {},
                key;

            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    var value = object[key];

                    if (typeof value === 'string' && key !== null) {
                        flat_object[key] = value;
                    } else if (value !== null && value !== undefined) {
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
                if (event_callback === callback) {
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
                IG.log('Using "postmessage" as XD transport.');
                IG.XD._origin = (window.location.protocol + '//' + window.location.host + '/' + IG.guid());
                IG.XD.PostMessage.init();
                IG.XD._transport = 'postmessage';
            } else {
                IG.log('Using "fragment" as XD transport.');
                IG.XD._transport = 'fragment';
                IG.XD.Fragment._channelUrl = window.location.toString();
            }
        },
        resolveRelation: function (relation) {
            var relation_chain = relation.split('.'),
                root = window,
                frame_match,
                i;

            for (i = 0, num_relations = relation_chain.length; i < num_relations; i++) {
                child = relation_chain[i];
                if (child === 'opener' || child === 'parent' || child === 'top') {
                    root = root[child];
                } else {
                    frame_match = /^frames\[['"]?([a-zA-Z0-9-_]+)['"]?\]$/.exec(child);
                    if (frame_match) {
                       root = root.frames[frame_match[1]];
                    } else {
                        throw new SyntaxError('Malformed relation to resolve: ' + relation + ', pt: ' + child);
                    }
                }
            }

            return root;
        },
        handler: function (callback, relation) {
            if (window.location.toString().indexOf(IG.XD.Fragment._magic) > 0) {
                return 'javascript:false;//';
            }

            var proxy_url = IG.getDomain('https_com') + 'oauth/xd_proxy/#',
                callback_guid = IG.guid();

            if (IG.XD._transport === 'fragment') {
                proxy_url = IG.XD.Fragment._channelUrl;
                var hash_index = proxy_url.indexOf('#');
                if (hash_index > 0) {
                    proxy_url = proxy_url.substr(0, hash_index);
                }
                proxy_url += ((proxy_url.indexOf('?') < 0 ? '?' : '&') + IG.XD.Fragment._magic + '#?=&');
            }

            IG.XD._callbacks[callback_guid] = callback;
            return proxy_url + IG.QS.encode({
                cb: callback_guid,
                origin: IG.XD._origin,
                relation: relation || 'opener',
                transport: IG.XD._transport
            });
        },
        recv: function (data) {
            if (typeof data === 'string') {
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
        },
        Fragment: {
            _magic: 'ig_xd_fragment',
            checkAndDispatch: function () {
                var url = window.location.toString(),
                    fragment = url.substr(url.indexOf('#') + 1),
                    magic_pos = url.indexOf(IG.XD.Fragment._magic);

                if (magic_pos > 0) {
                    IG.init = function() {};
                    document.documentElement.style.display = 'none';
                    IG.XD.resolveRelation(IG.QS.decode(fragment).relation).IG.XD.recv(fragment);
                }
            }
        }
    });
    IG.XD.Fragment.checkAndDispatch();
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
                access_token: (IG._session && IG._session.access_token) || undefined
            });

            options.display = IG.UIServer.getDisplayMode(method, options);

            var prepared_options = {
                callback: callback,
                id: popup_id,
                size: method.size || {},
                url: method.url,
                params: options
            };

            if (method.transform) {
                prepared_options = method.transform(prepared_options);
                if (!prepared_options) {
                    IG.log('Call to "transform" in "prepareCall" failed to return options');
                    return;
                }
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
        getDisplayMode: function (method, options) {
            if (options.display === 'hidden') {
                return 'hidden';
            }
            return  'popup';
        },
        getXdRelation: function (display) {
            if (display === 'popup') {
                return 'opener';
            }
        },
        popup: function (options) {
            var screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft,
                screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop,
                clientWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth,
                clientHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : (document.documentElement.clientHeight - 22),
                popupWidth = options.size.width,
                popupHeight = options.size.height,
                screenWidth = (screenX < 0) ? window.screen.width + screenX : screenX,
                popupX = parseInt(screenWidth + ((clientWidth - popupWidth) / 2), 10),
                popupY = parseInt(screenY + ((clientHeight - popupHeight) / 2.5), 10),
                popupFeatures = ('width=' + popupWidth + ',height=' + popupHeight + ',left=' + popupX + ',top=' + popupY + ',scrollbars=1,location=1,toolbar=0');
            IG.log('opening popup: ' + options.id);
            IG.UIServer._active[options.id] = window.open(options.url, options.id, popupFeatures);
        },
        hidden: function (options) {
            options.className = 'IG_UI_Hidden';
            options.root = IG.Content.appendHidden('');
            IG.UIServer._insertIframe(options);
        },
        _insertIframe: function (options) {
            IG.UIServer._active[options.id] = false;

            var set_callback = function (callback) {
                if (IG.UIServer._active.hasOwnProperty(options.id)) {
                    IG.UIServer._active[options.id] = callback;
                }
            };

            IG.Content.insertIframe({
                url: options.url,
                root: options.root,
                className: options.className,
                width: options.size.width,
                height: options.size.height,
                onload: set_callback
            });
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
        getLoginStatus: function (callback, force_recheck) {
            if (!IG._client_id) {
                IG.log('IG.getLoginStatus() called before calling IG.init().');
                return;
            }

            if (callback) {
                if (!force_recheck && IG.Auth._loadState === 'loaded') {
                    callback({
                        status: IG._userStatus,
                        session: IG._session
                    });
                    return;
                } else {
                    IG.Event.subscribe('IG.loginStatus', callback);
                }
            }

            if (!force_recheck && IG.Auth._loadState === 'loading') {
                return;
            }

            IG.Auth._loadState = 'loading';

            var internal_callback = function (response) {
                IG.Auth._loadState = 'loaded';
                IG.Event.fire('IG.loginStatus', response);
                IG.Event.clear('IG.loginStatus');
            };
            IG.ui({
                method: 'auth.status',
                display: 'hidden'
            }, internal_callback);
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
        setSession: function (session, status) {
            var did_login = !IG._session && session,
                did_logout = IG._session && !session,
                session_changed = did_login || did_logout || (IG._session && session && IG._session.access_token !== session.access_token),
                status_changed = status !== IG._userStatus;

            var session_wrapper = {session: session, status: status};

            IG._session = session;
            IG._userStatus = status;

            if (session_changed && IG.Cookie.getEnabled()) {
                IG.Cookie.set(session);
            }

            if (status_changed) {
                IG.Event.fire('auth.statusChange', session_wrapper);
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
        xdHandler: function (callback, guid, relation, set_default, user_status, session_object) {
            return IG.UIServer._xdRedirectUriHandler(IG.Auth.xdResponseWrapper(callback, user_status, session_object), guid, relation, set_default);
        },
        xdResponseWrapper: function (callback, user_status, session_object) {
            return function (response) {
                try {
                    session_object = IG.JSON.parse(response.session || null);
                    session_object.scope = IG.JSON.parse(response.scope || null);
                } catch (e) {}

                if (session_object) {
                    user_status = 'connected';
                }

                var session = IG.Auth.setSession(session_object || null, user_status),
                    additional_vars = ['code', 'error', 'error_reason', 'error_description'];

                if (response) {
                    IG.Array.forEach(additional_vars, function (var_name) {
                        session[var_name] = response[var_name] || null;
                    });
                }

                if (callback) {
                    callback(session);
                }
            };
        }
    });
    IG.provide('UIServer.Methods', {
        'authorize': {
            size: {
                width: 627,
                height: 326
            },
            url: IG.getDomain('https_com') + 'oauth/authorize/',
            transform: function (options) {
                if (!IG._client_id) {
                    IG.log('IG.login() called before claling IG.init().');
                    return;
                }

                if (IG._session) {
                    var needs_authorization = false;
                    IG.Array.forEach(options.params.scope, function (required_scope) {
                        if (IG._session.scope.indexOf(required_scope) === -1) {
                            needs_authorization = true;
                        }
                    });

                    if (!needs_authorization) {
                        IG.log('IG.login() called when user is already connected.');
                        if (options.callback) {
                            options.callback({
                                status: IG._userStatus,
                                session: IG._session
                            });
                            return;
                        }
                    }
                }

                options.callback = IG.Auth.xdResponseWrapper(options.callback);

                if (options.params.scope) {
                    options.params.scope = options.params.scope.join(' ');
                }

                IG.copy(options.params, {
                    response_type: "token"
                });

                return options;
            }
        },
        'auth.status': {
            url: IG.getDomain('https_com') + 'oauth/login_status/',
            transform: function (options) {
                var callback = options.callback,
                    id = options.id;

                delete options.callback;

                IG.copy(options.params, {
                    no_session: IG.Auth.xdHandler(callback, options.id, 'parent', false, 'notConnected'),
                    no_user: IG.Auth.xdHandler(callback, options.id, 'parent', false, 'unknown'),
                    ok_session: IG.Auth.xdHandler(callback, options.id, 'parent', false, 'connected')
                });

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
            document.cookie = 'igs_' + IG._client_id + '="' + value + '"' + (value && timestamp === 0 ? '' : '; expires=' + new Date(timestamp * 1000).toGMTString()) + '; path=/' + (domain ? '; domain=.' + domain : '');
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
            settings = IG.copy(settings || {}, {
                logging: false,
                check_status: true
            });

            IG._client_id = settings.client_id;
            IG._logging = settings.logging || (typeof settings.logging === 'undefined' && window.location.toString().indexOf('ig_debug=1') > 0);

            IG.XD.init();

            if (IG._client_id) {
                IG.Cookie.setEnabled(settings.cookie);

                settings.session = settings.session || (settings.cookie && IG.Cookie.load());
                IG.Auth.setSession(settings.session);
                if (settings.check_status) {
                    IG.getLoginStatus();
                }
            }
        }
    });
    window.setTimeout(function(){
        if (window.igAsyncInit && !window.igAsyncInit.hasRun) {
            window.igAsyncInit.hasRun = true;
            igAsyncInit();
        }
    }, 0);
}