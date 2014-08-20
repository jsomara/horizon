/*global angular*/
(function () {
  'use strict';
  function utils(hzConfig, $log, $rootScope, $compile) {
    return {
      /*
       Use the log levels of http://docs.angularjs.org/api/ng.$log
       default to log level.
       */
      log: function (msg, lvl) {
        if (hzConfig.debug) {
          ($log[lvl] || $log.log)(msg);
        }
      },
      capitalize: function (string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      },
      /*
       Adds commas to any integer or numbers within a string for human display.

       EG:
       horizon.utils.humanizeNumbers(1234); -> "1,234"
       horizon.utils.humanizeNumbers("My Total: 1234"); -> "My Total: 1,234"
       */
      humanizeNumbers: function (number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      },

      /*
       Truncate a string at the desired length. Optionally append an ellipsis
       to the end of the string.

       EG:
       horizon.utils.truncate("String that is too long.", 18, true); ->
       "String that is too&hellip;"
       */
      truncate: function (string, size, includeEllipsis) {
        if (string.length > size) {
          if (includeEllipsis) {
            return string.substring(0, (size - 3)) + "&hellip;";
          }

          return string.substring(0, size);
        }

        return string;
      },
      loadAngular: function (element) {
        try {
          $compile(element)($rootScope);
          $rootScope.$apply();
        } catch (err) {}
        /*
         Compilation fails when it could not find a directive,
         fails silently on this, it is an angular behaviour.
         */

      }
    };
  }
  angular.module('hz.utils.hzUtils', ['hz.conf'])
    .service('hzUtils', ['hzConfig', '$log', '$rootScope', '$compile', utils]);

  angular.module('hz.utils.JSONCache', [])
        .provider('JSONCache', function () {
            this.$get = ['$cacheFactory', function ($cacheFactory) {
                return $cacheFactory('JSON');
            }];
        })
        .directive('script', ['JSONCache', '$rootScope',
            function ($JSONCache, $rootScope) {
                return {
                    restrict: 'E',
                    terminal: true,
                    compile: function (element, attr) {
                        if (attr.type === 'application/json') {
                            var jsonID = attr.id,
                            // IE is not consistent, in scripts we have to read .text but in
                            // other nodes we have to read .textContent
                                text = element[0].text;
                            $JSONCache.put(jsonID, $rootScope.$eval(text));
                        }
                    }
                };
            }]);

  angular.module('hz.utils', ['hz.utils.hzUtils', 'hz.utils.JSONCache']);
}());