/* globals MG */
/* jshint camelcase:false */
'use strict';

/**
 * Example controller.
 */
angular
    .module('example')
    .controller('ExampleCtrl', ['$scope', '$http', '$interval', '$log', function ($scope, $http, $interval, $log) {

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
            },
            realtime: {
                data: [],
                options: {
                    description: 'New data is shown as it comes in',
                    title: 'Realtime updates',
                    x_accessor: 'date',
                    y_accessor: 'value',
                    max_y: 120,
                    xax_start_at_min: false,
                    transition_on_update: true,
                    y_extended_ticks: true,
                    interpolate: 'linear'
                }
            },
            spikes: {
                data: [],
                options: {
                    description: 'You see mee?',
                    title: 'Visible spikes',
                    x_accessor: 'date',
                    y_accessor: 'value',
                    transition_on_update: false,
                    y_extended_ticks: true
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
            if ($scope.charts[chart] && $scope.charts[chart].src) {
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

        var updateRealtimeData = function (data, options) {

            var date = new Date();
            var diff_x;

            // set min at the beginning
            if (data.length === 0) {

                options.min_x = date.getTime();
                options.max_x = options.min_x + 20000;
            }

            // move the min_x when there are more than 10 values
            if (data.length >= 10) {

                options.min_x = data[data.length - 10].date.getTime();
                diff_x = ((date.getTime() - options.min_x) * 2);
                options.max_x = options.min_x + diff_x;

                //remove first element
                //data.shift();
            }

            // add new value
            data.push({
                date: date,
                value: Math.random() * (100 - 0) + 0
            });
        };

        $interval(function () {
            updateRealtimeData($scope.charts.realtime.data, $scope.charts.realtime.options);
        }, 1000);

        //for (var i = 0; i < 10000; i++) {
        //
        //    var value = {
        //        date: Date.now() + i,
        //        value: 0
        //    };
        //
        //    $scope.charts.spikes.data.push(value);
        //}
        //
        //$scope.charts.spikes.data[3333].value = 1;
        //$scope.charts.spikes.data[6666].value = 1;
        //$scope.charts.spikes.data[9999].value = 1;

        // initialize the controller
        $scope.init();
    }
    ]);