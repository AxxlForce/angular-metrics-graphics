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
angular.module('metricsgraphics', ['rt.debounce'])

    .factory('linkService', function () {

        var previous = {};

        var current = {};

        var changeHandlers = {};

        return {
            set: function (key, value) {

                var previousVal = previous[key] = current[key];
                var currentVal = current[key] = value;

                var handlersForKey = changeHandlers[key];

                if (!handlersForKey) {
                    return;
                }

                angular.forEach(handlersForKey, function (handler) {
                    handler(currentVal, previousVal);
                });
            },
            get: function (key) {

                return current[key];
            },
            on: function (key, cb) {

                if (!angular.isFunction(cb)) {
                    throw new Error('Only functions allowed as callback argument');
                }

                var handlersForKey = changeHandlers[key];

                if (!handlersForKey) {
                    handlersForKey = [];
                    changeHandlers[key] = handlersForKey;
                }

                handlersForKey.push(cb);
            },
            off: function (key, cb) {

                var handlersForKey = changeHandlers[key];

                if (!handlersForKey) {
                    return;
                }

                for (var i = 0; i < handlersForKey.length; i++) {
                    if (handlersForKey[i] === cb) {
                        handlersForKey.splice(i, 1);
                        i--;
                    }
                }
            }
        };
    })

    .directive('chart', ['$window', '$timeout', 'debounce', 'linkService', function ($window, $timeout, debounce, linkService) {
        return {
            link: function ($scope, $element, attrs) {

                // create a random identifier for the chart element
                function randomString(len) {
                    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    var s = '';
                    for (var i = 0; i < len; i++) {
                        var randomPoz = Math.floor(Math.random() * charSet.length);
                        s += charSet.substring(randomPoz, randomPoz + 1);
                    }
                    return s;
                }

                function getElWidth(el) {

                    if (!angular.isElement(el)) {
                        throw new Error('Only DOM/JQuery allowed.');
                    }

                    // width with padding
                    var width = el.clientWidth;

                    var compStyle = getComputedStyle(el, null);
                    var paddingLeft = compStyle.getPropertyValue('padding-right');
                    width = width - parseInt(paddingLeft);
                    var paddingRight = compStyle.getPropertyValue('padding-right');
                    width = width - parseInt(paddingRight);

                    return width;
                }

                function appendHoverline(parentSvgEl, hoverAreaBoundingBox) {

                    // default to middle of graph
                    var hoverLineX = hoverAreaBoundingBox.x + (hoverAreaBoundingBox.width / 2);
                    var hoverLineYStart = hoverAreaBoundingBox.y;
                    var hoverLineHeight = hoverLineYStart + hoverAreaBoundingBox.height;

                    var hoverLineGroup = parentSvgEl.append('g')
                        .attr('class', 'focus-line');

                    var tmpHoverLine = hoverLineGroup
                        .append('line')
                        .attr('x1', hoverLineX).attr('x2', hoverLineX)
                        .attr('y1', hoverLineYStart).attr('y2', hoverLineHeight)
                        .style('opacity', 0);

                    return tmpHoverLine;
                }

                function appendMouseMarker(parentSvgEl) {
                    // Append marker
                    var marker = parentSvgEl.append('circle')
                        .attr('class', 'focus-circle')
                        .attr('r', 3)
                        .style('pointer-events', 'none')
                        .style('stroke-width', '1px')
                        .style('opacity', 0);

                    return marker;
                }

                function appendFocusText(tooltip) {

                    var txt = tooltip
                        .append('span')
                        .attr('class', 'focus-txt');

                    return txt;
                }

                function appendTooltip(el) {

                    var tooltip = el
                        .append('div')
                        .attr('class', 'focus-tooltip')
                        .style('position', 'absolute')
                        .style('opacity', 0);

                    return tooltip;
                }

                function appendClickRect(focusLayer) {

                    return focusLayer
                        .append('rect')
                        .attr('x', $scope.graphBoundingBox.x)
                        .attr('y', $scope.graphBoundingBox.y)
                        .attr('width', $scope.graphBoundingBox.width)
                        .attr('height', $scope.graphBoundingBox.height)
                        .style('fill', 'none')
                        .style('stroke', 'none')
                        .style('pointer-events', 'all');
                }

                function onMouseMove(oldMouseX, mouseX, data, tmpOptions) {

                    // no mouse data
                    if (oldMouseX === null && mouseX === null) {

                        return;
                    }

                    // mouse in
                    if (oldMouseX === null && mouseX !== null) {

                        hoverLine.style('opacity', 1);
                        mouseMarker.style('opacity', 1);
                        focusTooltip.style('opacity', 1);
                        return;
                    }

                    // mouse out
                    if (oldMouseX !== null && mouseX === null) {

                        hoverLine.style('opacity', 0);
                        mouseMarker.style('opacity', 0);
                        focusTooltip.style('opacity', 0);
                        return;
                    }

                    // mouse move
                    hoverLine.attr('x1', mouseX);
                    hoverLine.attr('x2', mouseX);

                    var x0 = tmpOptions.scales.X.invert(mouseX);
                    var bisect = d3.bisector(function (dataEntry) {
                        return dataEntry[tmpOptions.x_accessor];
                    }).right;
                    var i = bisect(data, x0, 1);
                    var d0 = data[i - 1];
                    var d1 = data[i];
                    /*d0 is the combination of date and rating that is in the data array at the index to the left of the cursor and d1 is the combination of date and close
                     that is in the data array at the index to the right of the cursor. In other words we now have two variables that know the value and date above and below the date that
                     corresponds to the position of the cursor.*/
                    var d = x0 - d0[tmpOptions.x_accessor] > d1[tmpOptions.x_accessor] - x0 ? d1 : d0;
                    /*The final line in this segment declares a new array d that is represents the date and close combination that is closest to the cursor.
                     It is using the magic JavaScript short hand for an if statement that is essentially saying if the distance between the mouse cursor and the date and close combination
                     on the left is greater than the distance between the mouse cursor and the date and close combination on the right then d is an array of the date and close on
                     the right of the cursor (d1). Otherwise d is an array of the date and close on the left of the cursor (d0).*/

                    //d is now the data row for the date closest to the mouse position

                    var value = d[tmpOptions.y_accessor];
                    var y = tmpOptions.scales.Y(value);

                    mouseMarker.attr('cx', mouseX);
                    mouseMarker.attr('cy', y);

                    focusText.html(value);

                    focusTooltip
                        .style('left', (svgSelect[0][0].offsetLeft + mouseX + 10) + 'px')
                        .style('top', (svgSelect[0][0].offsetTop + 10) + 'px');
                }

                var watchFn;

                function watchX(data, tmpOptions) {

                    var watch = function (newValue, oldValue) {

                        if (linkService.get('target') === options.target) {
                            return;
                        }

                        onMouseMove(oldValue, newValue, data, tmpOptions);
                    };

                    linkService.on('x', watch);

                    $scope.$on('$destroy', function () {
                        linkService.off('x', watch);
                    });

                    return watch;
                }

                /**
                 * force chart to redraw with given options
                 *
                 * @param data
                 * @param newOptions
                 */
                function redraw(data, newOptions) {

                    //TODO do we have to provide some way of showing that there is no data? use what the library can show as "missing graph"?
                    // only draw if there is actually something to draw
                    if (data && data.length > 0) {

                        if (!angular.isDefined(newOptions.width)) {
                            options.width = getElWidth($parent[0]);
                        }

                        angular.merge(options, newOptions);

                        // set data to nothing since we split data and options handling in this directive
                        if (options.data) {
                            options.data = null;
                        }

                        // create a copy of the original options to avoid reflecting
                        // changes that are made to the options from the library
                        var tmpOptions = angular.copy(options);

                        // set the data
                        tmpOptions.data = data;

                        if (!options.linked && watchFn) {
                            linkService.off(watchFn);
                            watchFn = null;
                        }

                        if (options.linked && !watchFn) {
                            watchFn = watchX(data, tmpOptions);
                        }

                        // redraw chart
                        MG.data_graphic(tmpOptions);

                        if (svgSelect) {
                            return;
                        }

                        //$element.css('position', 'relative');

                        svgSelect = d3.select($element[0]).select('svg');
                        $scope.graphBoundingBox = d3.select($element[0]).select('svg .mg-clip-path rect')[0][0].getBBox();

                        if (hoverlineAttr) {

                            focusLayer = svgSelect.append('g');
                            hoverLine = appendHoverline(focusLayer, $scope.graphBoundingBox);
                            mouseMarker = appendMouseMarker(focusLayer);
                            focusTooltip = appendTooltip(d3.select($element[0]));
                            focusText = appendFocusText(focusTooltip);
                            var clickRect = appendClickRect(focusLayer);

                            clickRect.on('mouseover', function () {

                                var mouseX = d3.mouse(this)[0];

                                onMouseMove(null, mouseX, data, tmpOptions);

                                if (options.linked) {

                                    linkService.set('target', options.target);
                                    linkService.set('x', mouseX);
                                }
                            })
                                .on('mouseout', function (event) {

                                    var mouseX = d3.mouse(this)[0];

                                    onMouseMove(mouseX, null, data, tmpOptions);

                                    if (options.linked) {

                                        linkService.set('target', null);
                                        linkService.set('x', null);
                                    }
                                })
                                .on('mousemove', function (event) {

                                    var mouseX = d3.mouse(this)[0];

                                    //var debouncedMouseMove = debounce(100, function () {
                                    onMouseMove(mouseX, mouseX, data, tmpOptions);
                                    //});
                                    //debouncedMouseMove();

                                    if (options.linked) {

                                        linkService.set('x', mouseX);
                                    }
                                });

                            svgSelect.on('mouseover', function () {

                                this.appendChild(focusLayer.node());
                            });
                        }
                    }
                }

                var $parent = $element.parent(),
                    options = {},
                    hoverlineAttr = attrs.hasOwnProperty('hoverline'),
                    svgSelect,
                    focusLayer,
                    hoverLine,
                    mouseMarker,
                    focusTooltip,
                    focusText;

                // set the elements id if not already set
                $element[0].id = $element[0].id ? $element[0].id : 'mg-chart-' + randomString(5);
                // set the target id in the options
                options.target = '#' + $element[0].id;
                // initial options merge
                angular.merge(options, $scope.options);

                /**
                 *  react to data changes
                 */
                $scope.$watchCollection('data', function (newValue) {

                    redraw(newValue, options);
                });

                /**
                 * react to option changes
                 */
                $scope.$watch('options', function (newValue) {

                    // resetting the target is not allowed
                    if (newValue.target) {
                        delete newValue.target;
                    }

                    redraw($scope.data, newValue);
                }, true);

                /**
                 * react on size changes
                 */
                angular.element($window).on('resize', function () {

                    // force width to be re-evaluated
                    delete options.width;

                    // redraw
                    redraw($scope.data, options);
                });

                $timeout(function () {
                    //DOM has finished initial rendering
                    redraw($scope.data, options);
                });
            },
            restrict: 'E',
            scope: {
                data: '=',
                options: '=',
                graphBoundingBox: '=?',
            }
        };
    }]);