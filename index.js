'use strict';

var errcode = require('err-code');
var retry = require('retry');
var Promise = require('bluebird');

function promiseRetry(fn, options) {
    var operation = retry.operation(options);

    return new Promise(function (resolve, reject) {
        operation.attempt(function (number) {
            var promise;

            promise = Promise.try(function () {
                return fn(function (err) {
                    if (err && err.code === 'EPROMISERETRY') {
                        err = err.original;
                    }

                    throw errcode('Retrying', 'EPROMISERETRY', {
                        original: err
                    });
                }, number);
            });

            promise.done(resolve, function (err) {
                if (err && err.code === 'EPROMISERETRY') {
                    err = err.original;

                    if (operation.retry(err || new Error())) {
                        return;
                    }
                }

                reject(err);
            });
        });
    });
}

module.exports = promiseRetry;
