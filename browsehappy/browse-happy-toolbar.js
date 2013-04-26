var BrowseHappy = (function () {

    var extend = function (destination, source) {
        for (var i = 1; i < arguments.length; ++i) {
            var nextSource = arguments[i];
            if (!nextSource)
                continue;
            var property;
            for (property in nextSource)
                if (nextSource.hasOwnProperty(property))
                    destination[property] = nextSource[property];
        }
        return destination;
    };

    var Controller = function (options) {
        extend(this, options);
        this.run();
    };
    extend(Controller.prototype, {
        storeKey: "browser",
        run: function () {
            if (this.stored())
                this.done();
            else if (this.error())
                this.renderWhenPossible();
            else
                this.storeAndDone();
        },
        skip: function () {
            this.storeAndDone();
        },
        stored: function () {
            this.store = new PermanentStore();
            return this.store.load(this.storeKey);
        },
        error: function () {
            this.validator = new Validator({
                schema: this.schema
            });
            return this.validator.error;
        },
        storeAndDone: function () {
            this.store.save(this.storeKey, true);
            this.done();
        },
        renderWhenPossible: function () {
            if (!document.getElementById)
                this.ancient();
            else if (document.body)
                this.render();
            else {
                var controller = this;
                window.onload = function () {
                    delete(window.onload);
                    controller.render();
                };
            }
        },
        ancient: function () {
            new WayTooOldMessage();
        },
        render: function () {
            var controller = this;
            var options = {
                appendTo: this.appendTo || document.body,
                schema: this.schema,
                model: this.validator.error,
                done: function () {
                    controller.skip();
                }
            };
            if (this.icons)
                options.icons = this.icons;
            this.view(options);
        },
        view: function (options) {
            if (this.mode == "redirect")
                return new RedirectView(options);
            else if (this.mode == "link")
                return new LinkView(options);
            else
                return new ToolbarView(options);
        }
    });

    var PermanentStore = function (options) {
        extend(this, options);
    };
    extend(PermanentStore.prototype, {
        expirationYears: 2,
        save: function (key, value) {
            var expires = new Date();
            expires.setFullYear(expires.getFullYear() + this.expirationYears);
            document.cookie = encodeURI(key) + "=" + encodeURIComponent(value) + "; path=/; expires=" + expires.toGMTString();
        },
        load: function (key) {
            var cookie = document.cookie;
            if (typeof(cookie) != "string")
                return;
            var vars = cookie.split('; ');
            for (var i = 0; i < vars.length; i++) {
                var pair = vars[i].split('=');
                if (decodeURI(pair[0]) == key)
                    return decodeURIComponent(pair[1]);
            }
        }
    });


    var Validator = function (options) {
        extend(this, options);
        this.detect();
    };
    extend(Validator.prototype, {
        detect: function () {
            var cookie = new CookieValidator({
                    schema: this.schema.cookie
                }),
                browser = new BrowserValidator({
                    schema: this.schema.browser
                });
            this.error = false;
            if (cookie.error || browser.error)
                this.error = {
                    cookie: cookie.error,
                    browser: browser.error
                };
        }
    });

    var BrowserValidator = function (options) {
        extend(this, options);
        this.detect();
    };
    extend(BrowserValidator.prototype, {
        detect: function () {
            this.error = false;
            if (typeof(this.schema) != "object")
                return;
            var actual = BrowserDetect;
            if (!(actual.browser in this.schema)) {
                this.error = {
                    recognized: false
                };
            }
            else if (this.schema[actual.browser] > actual.version) {
                this.error = {
                    recognized: true,
                    version: false
                };
            }
        }
    });

    var CookieValidator = function (options) {
        extend(this, options);
        this.detect();
    };
    extend(CookieValidator.prototype, {
        detect: function () {
            this.error = false;
            if (this.schema && !navigator.cookieEnabled)
                this.error = true;
        }
    });

    var WayTooOldMessage = function () {
        if (document.write)
            document.write('<h2 style="text-align: center; color: #ff5555;">' +
                'This site uses a technology called document object model, but your browser does not support it.' +
                '<br />' +
                'Please choose another browser from the list you can find on <a href="http://browsehappy.com/">browsehappy.com</a>. Those browsers can certainly display this website!' +
                '</h2>');
        else
            window.alert(
                'This site uses a technology called document object model, but your browser does not support it.' + "\n" +
                    'Please choose another browser from the list you can find on http://browsehappy.com . Those browsers can certainly display this website!'
            );
    };

    var AbstractView = {
        list: {
            Firefox: {
                name: "Mozilla Firefox",
                icon: "ff.png",
                location: "http://www.firefox.com/",
                about: "“Your online security is Firefox's top priority. Firefox is free, and made to help you get the most out of the&nbsp;web.”"
            },
            Chrome: {
                name: "Google Chrome",
                icon: "ch.png",
                location: "http://www.google.com/chrome",
                about: "“A fast new browser from Google. Try&nbsp;it&nbsp;now!”"
            },
            Safari: {
                name: "Apple Safari",
                icon: "sf.png",
                location: "http://www.apple.com/safari/",
                about: "“Safari for Mac and Windows from Apple, the world’s most innovative&nbsp;browser.”"
            },
            Opera: {
                name: "Opera",
                icon: "op.png",
                location: "http://www.opera.com/",
                about: "“The fastest browser on Earth&mdash;secure, powerful and easy to use, with excellent privacy protection. And&nbsp;it&nbsp;is&nbsp;free.”"
            },
            Explorer: {
                name: "Internet Explorer",
                icon: "ie.png",
                location: "http://windows.microsoft.com/ie",
                about: "“Designed to help you take control of your privacy and browse with confidence. Free from&nbsp;Microsoft.”"
            }
        },
        icons: {
            baseLocation: "/browsehappy/images"
        },
        messages: {
            cookie: '<h2 style="text-align: center; color: #ff5555;">' +
                'This website uses a technology called cookies. ' +
                'Please turn them on in your browsers settings, and refresh the current page!' +
                '</h2>',
            skip: '<h2 style="text-align: center; ">' +
                'If you are entirely sure that your browser is capable to display this website, and you don\'t want to see this page again, then please click here.' +
                '</h2>'
        },
        pattern: /\{(\w+)\}/g,
        initialize: function (options) {
            extend(this, options);
            this.render();
        },
        skip: function () {
            this.unrender();
            this.done();
        },
        unrender: function () {
            this.appendTo.removeChild(this.el);
            delete(this.el);
        },
        render: function () {
            this.el = document.createElement("div");
            if (this.model.cookie)
                this.renderCookieMessage();
            if (this.model.browser)
                this.renderBrowserMessage();
            this.renderSkipMessage();
            this.appendTo.appendChild(this.el);
        },
        renderCookieMessage: function () {
            this.el.innerHTML += this.messages.cookie;
        },
        renderBrowserMessage: function () {
        },
        renderSkipMessage: function () {
            var container = document.createElement("a");
            container.href = "#";
            var view = this;
            container.onclick = function () {
                view.skip();
                return false;
            };
            container.innerHTML = this.messages.skip;
            this.el.appendChild(container);
        },
        evaluate: function (template, data) {
            return template.replace(this.pattern, function (fullMatch, property) {
                return data[property] || "";
            });
        }
    };

    var ToolbarView = function (options) {
        this.initialize(options);
    };
    extend(ToolbarView.prototype, AbstractView, {
        templates: {
            suggestedList: '<div style="text-align: center;">' +
                '<h1>List of suggested browsers</h1>' +
                '<ul style="list-style: none; padding: 0; margin: 0;">' +
                '{list}' +
                '<li style="clear: both"></li>' +
                '</ul>' +
                '{message}' +
                '</div>',
            suggestedItem: '<li style="float:left; width: 195px; margin: 2px; padding: 5px; border: 1px solid #000000; " class="browser-suggested">' +
                '<a style="text-decoration: none; color: #324b4b; " title="{name}" href="{location}">' +
                '<div><img src="{baseLocation}/{icon}" alt="{name}" /></div>' +
                '<h2>{name}</h2>' +
                '<p style="min-height: 110px;">{about}</p>' +
                '<p>Required Version: <strong>{version}</strong></p>' +
                '</a>' +
                '</li>'
        },
        messages: {
            recognized: '<h2 style="text-align: center; color: #ff5555;">' +
                'Your current browser is not capable to display this website properly.' +
                '<br />' +
                'Please choose another browser from the list above!' +
                '</h2>',

            unknown: '<h2 style="text-align: center; color: #ff5555;">' +
                'We are not familiar with your current browser. It\'s maybe not capable to display this website properly.' +
                '<br />' +
                'Please choose another browser from the list above, which can certainly display this website!' +
                '</h2>',
            cookie: AbstractView.messages.cookie,
            skip: AbstractView.messages.skip
        },
        renderBrowserMessage: function () {
            var message = this.messages.unknown;
            if (this.model.browser.recognized)
                message = this.messages.recognized;
            this.el.innerHTML += this.evaluate(this.templates.suggestedList, {
                list: this.renderList(),
                message: message
            });
        },
        renderList: function (expected) {
            var list = "";
            var browser;
            for (browser in this.schema.browser)
                if (this.schema.browser.hasOwnProperty(browser)) {
                    if (!(browser in this.list))
                        return;

                    var version = this.schema.browser[browser];
                    if (isNaN(version))
                        version = "any";
                    list += this.evaluate(
                        this.templates.suggestedItem, extend(
                            {
                                version: version
                            },
                            this.icons,
                            this.list[browser]
                        )
                    );
                }
            return list;
        }
    });
    var LinkView = function (options) {
        this.initialize(options);
    };
    extend(LinkView.prototype, AbstractView, {
        messages: {
            recognized: '<h2 style="text-align: center; color: #ff5555;">' +
                'Your current browser is not capable to display this website properly.' +
                '<br />' +
                'Please choose another browser from the list you can find on <a href="http://browsehappy.com/">browsehappy.com</a>!' +
                '</h2>',
            unknown: '<h2 style="text-align: center; color: #ff5555;">' +
                'We are not familiar with your current browser. It\'s maybe not capable to display this website properly.' +
                '<br />' +
                'Please choose another browser from the list you can find on <a href="http://browsehappy.com/">browsehappy.com</a>. Those browsers can certainly display this website!' +
                '</h2>',
            cookie: AbstractView.messages.cookie,
            skip: AbstractView.messages.skip
        },
        renderBrowserMessage: function () {
            var message = this.messages.unknown;
            if (this.model.browser.recognized)
                message = this.messages.recognized;
            this.el.innerHTML += message;
        }
    });

    var RedirectView = function (options) {
        this.initialize(options);
    };
    extend(RedirectView.prototype, AbstractView, {
        render: function () {
            if (this.model.browser)
                this.renderBrowserMessage();
            else
                AbstractView.render.apply(this, arguments);
        },
        renderBrowserMessage: function () {
            document.location.href = "http://browsehappy.com/";
        }
    });

    return Controller;
})();