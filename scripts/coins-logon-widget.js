(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([
            'wolfy87-eventemitter/EventEmitter',
            'es6-object-assign',
            './lib/auth',
            './lib/form',
            './lib/form-group',
            './lib/logout'
        ], function(EventEmitter, ObjectAssign, Auth, Form, FormGroup, Logout) {
            return factory(
                EventEmitter,
                ObjectAssign.assign,
                Auth,
                Form,
                FormGroup,
                Logout)
            ;
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(
            require('wolfy87-eventemitter'),
            require('es6-object-assign').assign,
            require('./lib/auth'),
            require('./lib/form'),
            require('./lib/form-group'),
            require('./lib/logout')
        );
    } else {
        // Browser globals (root is window)
        root.CoinsLogonWidget = factory(
            root.EventEmitter,
            root.ObjectAssign.assign,
            root.CoinsLogonWidget.Auth,
            root.CoinsLogonWidget.Form,
            root.CoinsLogonWidget.FormGroup,
            root.CoinsLogonWidget.Logout
        );
    }
}(this, function (
    EventEmitter,
    assign,
    Auth,
    Form,
    FormGroup,
    Logout
) {
    'use strict';

    var auth;

    function CoinsLogonWidget(element, options) {
        EventEmitter.call(this);

        if (!element) {
            throw new Error('Element required');
        } else if (!(element instanceof Node)) {
            // Make sure `element` is an actual node
            // http://stackoverflow.com/a/384380
            throw new Error('Expected element to be a DOM node');
        }

        options = options || {};

        this.element = element;
        this.options = assign({}, CoinsLogonWidget.DEFAULTS, options);

        // Configure auth, SDK client
        // TODO: Enable passing of more options
        auth = Auth({ baseUrl: this.options.baseUrl });

        this._setElements();
        this._setEvents();
    }

    // Inherit from `EventEmitter`
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain#Example
    CoinsLogonWidget.prototype = Object.create(EventEmitter.prototype);
    CoinsLogonWidget.prototype.constructor = CoinsLogonWidget;

    CoinsLogonWidget.prototype._setElements = function() {
        var self = this;

        this.form = new Form();
        this.formGroups = this.options.formGroups
            .map(function (options) {
                return new FormGroup(options);
            })
            .reverse();

        // Make sure there's no children
        this.element.innerHTML = '';

        this.element.className = this.options.classNames.root;

        // Add elements to the DOM
        this.element.appendChild(this.form.element);
        this.formGroups.forEach(function(formGroup) {
            var formElement = self.form.element;
            formElement.insertBefore(formGroup.element, formElement.firstChild);
        });
    };

    CoinsLogonWidget.prototype._setEvents = function() {
        var self = this;
        var form = this.element.querySelector('form');
        var inputs = this.element.querySelectorAll('input');

        form.addEventListener('submit', function(event) {
            self.onSubmit(event);
        }, false);
        this.on('login:error', this.onError);
        this.on('logout:error', this.onError);
        this.on('login:success', this.onLogin);
        this.on('logout:success', this.onLogout);

        'blur focus keydown keypress keyup'.split(' ').forEach(function(eventType) {
            for (var i = 0, il = inputs.length; i < il; i++) {
                inputs[i].addEventListener(function(event) {
                    self.emit(eventType, event);
                }, false);
            }
        });
    };

    CoinsLogonWidget.prototype.onError = function(error) {
        var message = error.message || error.toString() || 'Unknown error.';
        //TODO: Change component's `setNotification` parameters to make more sense
        this.form.setNotification(message, 'error');

        console.error(error);
    };

    CoinsLogonWidget.prototype.onSubmit = function(event) {
        event.preventDefault();

        var errors;

        this.formGroups.forEach(function(formGroup) {
            var isValid = formGroup.validate();

            //TODO: emit validation error events
            if (!isValid) {
                errors = true;
            }
        });

        if (!errors) {
            this.emit('submitted', event);
            //TODO: Make authentication pluggable
            this.login();
        }
    };

    CoinsLogonWidget.prototype.onLogin = function() {
        console.log('Switch to logged in state');
    };

    CoinsLogonWidget.prototype.onLogout = function() {
        console.log('Switch to logged out state');
    };

    CoinsLogonWidget.prototype.login = function() {
        var self = this;
        var formData = this.formGroups.reduce(function(prev, curr) {
            var name = curr.getName();
            var value = curr.getValue();

            prev[name] = value;

            return prev;
        }, {});

        auth.login(formData.username, formData.password)
            .then(function(response) {
                self.emit('login:success', response);
            })
            .catch(function(error) {
                self.emit('login:error', error);
            });
    };

    CoinsLogonWidget.prototype.logout = function() {
        var self = this;

        auth.logout()
            .then(function(response) {
                self.emit('logout:success', response);
            })
            .catch(function(error) {
                self.emit('logout:error', error);
            });
    };

    CoinsLogonWidget.DEFAULTS = {
        classNames: {
            root: 'coins-logon-widget',
            form: 'coins-logon-widget-form',
            input: 'coins-logon-widget-input',
            label: 'coins-logon-widget-label',
            formGroup: 'coins-logon-widget-form-group',
            icon: 'coins-logon-widget-icon',
            message: 'coins-logon-widget-input-message',
            buttonGroup: 'coins-logon-widget-button-group',
            button: 'coins-logon-widget-button',
            buttonPrimary: 'coins-logon-widget-button-primary',
            buttonSecondary: 'coins-logon-widget-button-secondary',
            error: 'coins-logon-widget-form-group-error',
            success: 'coins-logon-widget-form-group-success'
        },
        formGroups: [{
            inputName: 'username',
            labelText: 'Username:',
            placeholder: ''
        }, {
            inputName: 'password',
            labelText: 'Password:',
            placeholder: '',
            type: 'password'
        }],
        messages: {
            error: 'Field empty'
        }
    };

    return CoinsLogonWidget;
}));
