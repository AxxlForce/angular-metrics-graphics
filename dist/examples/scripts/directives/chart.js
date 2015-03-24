/* global MG */
/* jshint camelcase:false, unused:false */
'use strict';

/**
 * MetricsGraphics
 * This directive is based on tassekatt's Stackoverflow post
 * @see http://stackoverflow.com/questions/27252464/how-to-bind-graphicsmetrics-jquery-plugin-in-angular-app
 *
 * @param {Array} data Chart data
 * @param {Object} options Chart configuration
 */
angular.module('metricsgraphics', []).directive('chart', function () {
    return {
        link: function (scope, element) {

            /**
             * override or extend options with newly provided data
             * @param newOptions
             * @param oldOptions
             */
            function extendOptions(newOptions, oldOptions) {

                // override previous options with new ones, if provided in new options
                if (newOptions) {

                    Object.keys(newOptions).forEach(function (key) {
                        oldOptions[key] = newOptions[key];
                    });
                }
            }

            /**
             * force chart to redraw with given options
             *
             * @param options
             */
            function redraw(options) {

                // only draw if there is actually something to draw
                if (options.data.length > 0) {

                    // !!! hack to force metricsgraphics to reevaluate time x values TODO: better solution?
                    options.xax_format = null;

                    // redraw chart
                    MG.data_graphic(options);
                }
            }

            // default options
            var options = {
                baselines: [], // [{value: 160000000, label: 'a baseline'}];
                description: null,
                height: 200,
                right: 0,
                title: null,
                width: element[0].parentElement.clientWidth || 300,
                x_accessor: null,
                y_accessor: null
            };

            extendOptions(scope.options, options);

            // create a random identifier for the chart element
            // TODO replace this with a template that has a unique id
            function randomString(len) {
                var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                var s = '';
                for (var i = 0; i < len; i++) {
                    var randomPoz = Math.floor(Math.random() * charSet.length);
                    s += charSet.substring(randomPoz, randomPoz + 1);
                }
                return 'mg-chart-' + s;
            }

            element[0].id = element[0].id ? element[0].id : randomString(5);
            // set the data and target configuration options
            options.data = scope.data || [];
            options.target = '#' + element[0].id;

            /**
             *  react to data changes
             */
            scope.$watch('data', function (newValue, oldValue) {

                options.data = newValue;
                redraw(options);

            }, false);

            /**
             * react to option changes
             */
            scope.$watch('options', function (newValue, oldValue) {

                extendOptions(newValue, options);
                redraw(options);

            }, true);
        },
        restrict: 'E',
        scope: {
            data: '=',
            options: '='
        }
    };
});