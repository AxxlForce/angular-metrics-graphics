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
                    transition_on_update: false,
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
                    y_extended_ticks: true,
                    x_axis: false
                }
            },
            linkedOne: {
                data: [],
                options: {
                    description: 'Linking',
                    title: 'Linking',
                    x_accessor: 'date',
                    y_accessor: 'value',
                    transition_on_update: false,
                    y_extended_ticks: true,
                    interpolate: 'linear',
                    linked: true
                }
            },
            linkedTwo: {
                data: [],
                options: {
                    description: 'Linking 2',
                    title: 'Linking 2',
                    x_accessor: 'date',
                    y_accessor: 'value',
                    transition_on_update: false,
                    y_extended_ticks: true,
                    interpolate: 'linear',
                    linked: true
                }
            },
            linkedThree: {
                data: [],
                options: {
                    description: 'Linking 3',
                    title: 'Linking 3',
                    x_accessor: 'date',
                    y_accessor: 'value',
                    transition_on_update: false,
                    y_extended_ticks: true,
                    interpolate: 'linear',
                    linked: true
                }
            },
            linkedFour: {
                data: [],
                options: {
                    description: 'Linking 3',
                    title: 'Linking 3',
                    x_accessor: 'date',
                    y_accessor: 'value',
                    transition_on_update: false,
                    y_extended_ticks: true,
                    interpolate: 'linear',
                    linked: true
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

        //var updateRealtimeData = function (data, options) {
        //
        //    var date = new Date();
        //    var diff_x;
        //
        //    // set min at the beginning
        //    if (data.length === 0) {
        //
        //        options.min_x = date.getTime();
        //        options.max_x = options.min_x + 20000;
        //    }
        //
        //    // add new value
        //    data.push({
        //        date: date,
        //        value: Math.random() * (100 - 0) + 0
        //    });
        //
        //    // move the min_x when there are more than 10 values
        //    if (data.length >= 10) {
        //
        //        //remove first element
        //        data.shift();
        //
        //        options.min_x = data[0].date.getTime();
        //        diff_x = ((date.getTime() - options.min_x) * 2);
        //        options.max_x = options.min_x + diff_x;
        //    }
        //};
        //
        //$interval(function () {
        //    updateRealtimeData($scope.charts.realtime.data, $scope.charts.realtime.options);
        //}, 1000);

        var numOfValues = 1000;
        var numOfSpikes = 3;

        for (var i = 0; i < numOfValues; i++) {

            var value = {
                date: Date.now() + i,
                value: 0
            };

            if (i % (Math.floor(numOfValues / numOfSpikes)) === 0) {
                value.value = 1;
            }

            $scope.charts.spikes.data.push(value);
        }

        var referenceDate = Date.now();

        for (var j = 0; j < 200; j++) {

            var value1 = {
                date: referenceDate + j,
                value: Math.random() * (100 - 0) + 0
            };

            var value2 = {
                date: referenceDate + j,
                value: Math.random() * (100 - 0) + 0
            };

            $scope.charts.linkedOne.data.push(value1);
            $scope.charts.linkedTwo.data.push(value2);
            $scope.charts.linkedThree.data.push(value1);
            $scope.charts.linkedFour.data.push(value2);
        }

        var minX = referenceDate;
        var maxX = referenceDate + j;

        $scope.charts.linkedOne.options.min_x = minX;
        $scope.charts.linkedOne.options.max_x = maxX;
        $scope.charts.linkedTwo.options.min_x = minX;
        $scope.charts.linkedTwo.options.max_x = maxX;
        $scope.charts.linkedThree.options.min_x = minX;
        $scope.charts.linkedThree.options.max_x = maxX;
        $scope.charts.linkedFour.options.min_x = minX;
        $scope.charts.linkedFour.options.max_x = maxX;

        // initialize the controller
        $scope.init();
    }
    ]);