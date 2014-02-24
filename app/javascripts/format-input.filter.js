/**
 * Copyright 2013, Radius Intelligence, Inc.
 * All Rights Reserved
 */

define(function () {

    return function () {
        return function (input) {
            if (!!input) {
                return 'span-' + input;
            } else {
                return '';
            }
        };
    };

});
