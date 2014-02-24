/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

define(['angular'], function (angular) {

    return ['$filter', function ($filter) {

        return {
            restrict: 'A',
            templateUrl: '/assets/templates/status-chart.html',
            scope: {
                data: '=radStatusChart'
            },
            link: function ($scope) {
                $scope.$watchCollection('data', function (dataValues) {
                    $scope.options = [];
                    angular.forEach(dataValues, function (value, key) {
                        $scope.options.push({'class': $filter('formatInput')(key), 'value': value});
                    });
                });
            }
        };
    }];
});
