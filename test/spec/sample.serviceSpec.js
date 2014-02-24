/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

define([
    'angular',
    'angularMocks',
    'sample.service'
], function (angular, mocks, sampleService) {
    'use strict';

    describe('Sample', function () {

        var Sample;
        var $httpBackend;
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

        beforeEach(function () {
            mocks.inject(function (_$httpBackend_, _$rootScope_, $injector) {
                $httpBackend = _$httpBackend_;
                $httpBackend.when('GET', '/api/sample').respond(samples);
                $httpBackend.when('POST', '/api/sample').respond();

                $rootScope = _$rootScope_;

                Sample = $injector.instantiate(sampleService, {});
            });
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it('should have a method to get a list of samples', function () {
            var promise;
            var receivedSamples;

            $httpBackend.expectGET('/api/sample');
            promise = Sample.getSamples();
            $httpBackend.flush();
            promise.then(function (s) {
                receivedSamples = s;
            });

            $rootScope.$digest();
            expect(receivedSamples).toEqual(samples);
        });

        it('should have a function to create a sample', function () {
            var fulfilled;
            var promise;

            $httpBackend.expectPOST('/api/sample', sample);
            promise = Sample.createSample(sample);
            $httpBackend.flush();

            promise.then(function () {
                fulfilled = true;
            });
            $rootScope.$digest();

            expect(fulfilled).toBeTruthy();
        });

    });

});
