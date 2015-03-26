/* globals MG */
/* jshint camelcase:false */
'use strict';

/**
 * Example controller.
 */
angular
    .module('example')
    .controller('ExampleCtrl', ['$scope', '$http', '$log', function ($scope, $http, $log) {

        $scope.STATES = {
            READY: 0,
            LOADING: 1,
            ERROR: 2
        };

        $scope.alert = null;
        $scope.charts = {
            fakeUsers: {
                data: null,
                src: 'data/fake_users1.json',
                options: {
                    title: 'User Accounts',
                    x_accessor: 'date',
                    y_accessor: 'value'
                }
            },
            fakeUsers2: {
                data: null,
                src: 'data/fake_users2.json',
                options: {
                    description: 'Some other user account information, by date',
                    title: 'Some Other Account Information',
                    x_accessor: 'date',
                    y_accessor: 'value'
                }
            },
            smallRanges: {
                data: null,
                src: 'data/small-range.json',
                options: {
                    description: 'Small value range',
                    title: 'Small Value Range',
                    x_accessor: 'date',
                    y_accessor: 'value'
                }
            },
            ufoSightings: {
                data: null,
                src: 'data/ufo_sightings.json',
                options: {
                    description: 'Unidentified flying object sightings in Australia by date',
                    title: 'UFO Sightings',
                    x_accessor: 'date',
                    y_accessor: 'value'
                }
            }
        };
        $scope.state = $scope.STATES.READY;

        //-------------------------------------------------------------------------

        /**
         * Fix date representation.
         * @param data Data collection
         */
        $scope.fix = function (data) {
            if (Array.isArray(data) && Array.isArray(data[0])) {
                data.forEach(function (element) {
                    $scope.fix(element);
                });
            } else {
                MG.convert.date(data, 'date');
            }
        };

        $scope.init = function () {
            Object.keys($scope.charts).forEach(function (chart) {
                $scope.read(chart);
            });
        };

        $scope.read = function (chart) {
            $scope.alert = null;
            $scope.state = $scope.STATES.LOADING;
            if ($scope.charts[chart]) {
                $http
                    .get($scope.charts[chart].src)
                    .success(function (data) {
                        $scope.charts[chart].data = data;
                        $scope.fix($scope.charts[chart].data);
                        $scope.state = $scope.STATES.READY;
                    })
                    .error(function (err) {
                        $scope.alert = {
                            type: 'ERROR',
                            message: err
                        };
                        $scope.charts[chart].data = null;
                        $scope.state = $scope.STATES.READY;
                        $log.error(err);
                    });
            }
        };

        // initialize the controller
        $scope.init();

    }
    ]);