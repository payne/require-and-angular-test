/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

define(function () {

    return ['$http', function ($http) {

        this.getSamples = function () {
            return $http.get('/api/sample').then(function (response) {
                return response.data;
            });
        };

        this.createSample = function (sample) {
            return $http.post('/api/sample', sample);
        };
    }];
});
