/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

var tests = Object.keys(window.__karma__.files).filter(function (file) {
    return (/Spec\.js$/).test(file);
});

requirejs.config({
    paths: {
        // External libraries
        'angular': '/base/app/external/angular/1.2.9/angular',
        'angularMocks': '/base/app/external/angular/1.2.9/angular-mocks',

        'templates': '../templates'
    },

    baseUrl: '/base/app/javascripts',

    shim: {
        'angular': {'exports': 'angular'},

        'angularMocks': {deps: ['angular'], 'exports': 'angular.mock'},

        // Each template to be included in tests should be included below.
        'templates/status-chart.html': {deps: ['angular']}
    },

    // Ask Require.js to load these files (all our tests).
    deps: tests,

    // Set test to start run once Require.js is done.
    callback: window.__karma__.start
});
