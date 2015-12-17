/**
 * Unit tests for the logon widget's 'auth' service.
 *
 * @todo  Move login tests to this file.
 */
'use strict';

var auth = require('../scripts/lib/auth');
var cookies = require('js-cookie');
var test = require('tape');

if (typeof jQuery === 'undefined') {
    window.jQuery = require('jquery');
}

var options = {
    authCookieName: 'Test_Auth_Cookie_Name',
    baseUrl: 'http://localhost:1337',
};

test('set options', function(t) {
    try {
        t.ok(auth.setOptions(options), 'set auth options');
        t.end();
    } catch (error) {
        t.end(error);
    }
});

test('get options', function(t) {
    t.deepEqual(auth.getOptions(), options, 'get the set auth options');
    t.end();
});

test('log out', function(t) {
    t.plan(4);

    var AUTH_CREDENTIALS_KEY = 'COINS_AUTH_CREDENTIALS';

    // Set an 'authorized' cookie
    cookies.set(options.authCookieName, 'some_test_value', {
        expires: 7 * 24 * 60 * 60,
    });

    // Fake stored `localStorage` credentials
    localStorage[AUTH_CREDENTIALS_KEY] = JSON.stringify({
        id: '772d580c-377c-43e1-9f05-cac909347fb5',
        key: 'f14c5870-0b77-4abf-9adb-9d718a30f04d',
        algorithm: 'sha256',
        issueTime: 1450310605062,
        expireTime: 1450312405062,
    });

    // `auth.logout()` returns a jQuery deferred. Cookie removal happens the
    // function's `jQuery.ajax`'s chained `.always` method, which is fired
    // _after_ the deferred resolves. Use a callback to run the test at the
    // appropriate time.
    auth.logout(function() {
        var authCredentials = JSON.parse(localStorage[AUTH_CREDENTIALS_KEY]);

        t.notOk(cookies.get(options.authCookieName), 'auth cookie unset');
        t.ok(
            !('id' in authCredentials) &&
            !('key' in authCredentials),
            'stored credentials unset'
        );

        // Test for a bug where the auth cookie on the `.mrn.org` domain is set
        // with the value 'REMOVED' and the name is cleared. js-cookie has
        // trouble detecting this, so check manually.
        t.equal(
            document.cookie.split('; ').indexOf('REMOVED'),
            -1,
            'auth cookie not malformed'
        );
    })
        .always(function(result) {
            // `jQuery.ajax` will fail without the server
            t.ok(result, 'log out runs');
        });
});

