/* global MG */
/* global d3 */
/* jshint camelcase:false, unused:false */
'use strict';

if (!angular.merge) {

    // shimming merge support since it available with ng1.4 but not below
    // straight copy from angular 1.4.0-beta.6 sources

    var slice = [].slice;

    /**
     * Set or clear the hashkey for an object.
     * @param obj object
     * @param h the hashkey (!truthy to delete the hashkey)
     */
    var setHashKey = function (obj, h) {
        if (h) {
            obj.$$hashKey = h;
        } else {
            delete obj.$$hashKey;
        }
    };


    var baseExtend = function (dst, objs, deep) {
        var h = dst.$$hashKey;

        for (var i = 0, ii = objs.length; i < ii; ++i) {
            var obj = objs[i];
            if (!angular.isObject(obj) && !angular.isFunction(obj)) {
                continue;
            }
            var keys = Object.keys(obj);
            for (var j = 0, jj = keys.length; j < jj; j++) {
                var key = keys[j];
                var src = obj[key];

                if (deep && angular.isObject(src)) {
                    if (!angular.isObject(dst[key])) {
                        dst[key] = angular.isArray(src) ? [] : {};
                    }
                    baseExtend(dst[key], [src], true);
                } else {
                    dst[key] = src;
                }
            }
        }

        setHashKey(dst, h);
        return dst;
    };

    /**
     * @ngdoc function
     * @name angular.merge
     * @module ng
     * @kind function
     *
     * @description
     * Deeply extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
     * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
     * by passing an empty object as the target: `var object = angular.merge({}, object1, object2)`.
     *
     * Unlike {@link angular.extend extend()}, `merge()` recursively descends into object properties of source
     * objects, performing a deep copy.
     *
     * @param {Object} dst Destination object.
     * @param {...Object} src Source object(s).
     * @returns {Object} Reference to `dst`.
     */
    angular.merge = function merge(dst) {
        return baseExtend(dst, slice.call(arguments, 1), true);
    };
}

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

            var containerEl, options, svg, hoverLine;

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

            function createHoverLine(parentSvg) {

                var hoverAreaBoundingBox = parentSvg.getBBox();

                // default to middle of graph
                var hoverLineX = hoverAreaBoundingBox.x + (hoverAreaBoundingBox.width / 2);
                var hoverLineYStart = hoverAreaBoundingBox.y;
                var hoverLineHeight = hoverAreaBoundingBox.height;

                var hoverLineGroup = parentSvg.append('g')
                    .attr('class', 'hover-line');

                var tmpHoverLine = hoverLineGroup
                    .append('line')
                    .attr('x1', hoverLineX).attr('x2', hoverLineX)
                    .attr('y1', hoverLineYStart).attr('y2', hoverLineHeight);
                //.style('opacity', 0);

                return tmpHoverLine;
            }

            /**
             * force chart to redraw with given options
             *
             * @param data
             * @param options
             */
            function redraw(data, options) {

                //TODO do we have to provide some way of showing that there is no data? use what the library can show as "missing graph"?
                // only draw if there is actually something to draw
                if (data && data.length > 0) {

                    // set data to nothing since we split data and options handling in this directive
                    if (options.data) {
                        options.data = null;
                    }

                    // create a copy of the original options to avoid reflecting
                    // changes that are made to the options from the library
                    var copy = angular.copy(options);

                    // set the data
                    copy.data = data;

                    // redraw chart
                    MG.data_graphic(copy);

                    //if(!svg) {
                    //    svg = d3.select(element[0]).select('svg');
                    //
                    //    if(!hoverLine) {
                    //        hoverLine = createHoverLine(svg.select('.mg-main-area')[0][0]);
                    //    }
                    //
                    //    svg.on('mouseover', function () {
                    //        console.log('mouseover');
                    //    }).on('mousemove', function () {
                    //        console.log('mousemove', d3.mouse(this));
                    //        var x = d3.mouse(this)[0];
                    //        hoverLine.attr('x1', x).attr('x2', x).style('opacity', 1);
                    //    }).on('mouseout', function () {
                    //        console.log('mouseout');
                    //        hoverLine.style('opacity', 0);
                    //    });
                    //}
                }
            }

            containerEl = element[0].parentElement;
            var computedStyle = window.getComputedStyle(containerEl);
            var actualWidth = parseFloat(computedStyle.width, 10);

            // default options
            options = {
                baselines: [], // [{value: 160000000, label: 'a baseline'}];
                description: null,
                height: 200,
                right: 0,
                title: null,
                xax_format: null,
                width: actualWidth || 300,
                x_accessor: null,
                y_accessor: null
            };

            // apply options from scope
            angular.merge(options, scope.options);

            // set the elements id if not already set
            element[0].id = element[0].id ? element[0].id : randomString(5);
            // set the target id in the options
            options.target = '#' + element[0].id;

            // initial draw
            redraw(scope.data, options);

            /**
             *  react to data changes
             */
            scope.$watchCollection('data', function (newValue) {

                redraw(newValue, options);
            });

            /**
             * react to option changes
             */
            scope.$watch('options', function (newValue) {

                // data has its own attribute binding
                if (newValue.data) {
                    newValue.data = null;
                }

                // resetting the target is not allowed
                if (newValue.target) {
                    delete newValue.target;
                }

                angular.merge(options, newValue);
                redraw(scope.data, options);
            }, true);


        },
        restrict: 'E',
        scope: {
            data: '=',
            options: '='
        }
    };
});