/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

define([
    'angular',
    'angularMocks',
    'sample.controller'
], function (angular, mocks, sampleController) {
    'use strict';

    describe('SampleController', function () {

        var SampleSpy = jasmine.createSpyObj('Sample', ['getSamples', 'createSample']);
        var createSampleController;
        var $q;
        var $rootScope;
        var samples = [
            {
                id: 1,
                name: 'Sample 1'
            },
            {
                id: 4,
                name: 'Another sample'
            }
        ];
        var sample = {
            id: 5,
            name: 'Created sample'
        };

        beforeEach(mocks.inject(function ($injector) {
            $q = $injector.get('$q');
            $rootScope = $injector.get('$rootScope');

            var $controller = $injector.get('$controller');
            createSampleController = function () {
                return $controller(sampleController, {'$scope': $rootScope, 'Sample': SampleSpy});
            };
        }));

        it('should load samples on creation', function () {
            SampleSpy.getSamples.andReturn($q.when(samples));
            var controller = createSampleController();
            $rootScope.$digest();
            expect($rootScope.samples).toEqual(samples);
        });

        it('should provide a create function which updates creating variable', function () {
            SampleSpy.getSamples.andReturn($q.when(samples));
            SampleSpy.createSample.andReturn($q.when());
            var controller = createSampleController();
            $rootScope.$digest();

            expect($rootScope.creating).toBeFalsy();
            $rootScope.create(sample);
            expect($rootScope.creating).toBeTruthy();

            $rootScope.$digest();
            expect($rootScope.creating).toBeFalsy();
        });
    });
});
