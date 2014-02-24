/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

define([
    'angular',
    'angularMocks',
    'status-chart.directive',

    'templates/status-chart.html'
], function (angular, mocks, statusChartDirective) {
    'use strict';

    describe('Status Chart Directive', function () {

        var formatInputFilter = jasmine.createSpy('formatInput');

        beforeEach(function () {
            mocks.module('/assets/templates/status-chart.html');
            mocks.module(function ($compileProvider, $filterProvider) {
                $compileProvider.directive('radStatusChart', statusChartDirective);
                $filterProvider.register('formatInput', function () {
                    return formatInputFilter;
                });
            });
        });

        it('should create the internal elements', mocks.inject(function ($compile, $rootScope) {
            var indices = ['a', 'b', 'c', 'd'];
            var status = {
                a: 105,
                b: 430,
                c: 105,
                d: 70
            };
            var total = 105 + 430 + 105 + 70;
            var formattedClasses = {
                a: 'status-a',
                b: 'status-b',
                c: 'status-c',
                d: 'status-d'
            };

            formatInputFilter.andCallFake(function (input) { return formattedClasses[input]; });

            // Compile element and run $digest.
            $rootScope.status = status;
            var element = $compile('<div rad-status-chart="status"></div>')($rootScope);
            $rootScope.$digest();

            var spanChildren = element.find('span');
            expect(spanChildren.length).toBe(4);

            // Check each child (e.g. height and texts).
            angular.forEach(spanChildren, function (value, index) {
                var key = indices[index];
                var node = angular.element(value);
                expect(node.text()).toBe(status[key].toString());
                expect(node.attr('class')).toContain(formattedClasses[key]);
            });


        }));
    });
});
