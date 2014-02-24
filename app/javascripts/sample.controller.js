/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

define(function () {

    return ['$scope', 'Sample', function ($scope, Sample) {

        Sample.getSamples().then(function (samples) {
            $scope.samples = samples;
        });

        $scope.create = function (sample) {
            $scope.creating = true;
            Sample.createSample(sample).then(function () {
                $scope.creating = false;
            });
        };
    }];
});
