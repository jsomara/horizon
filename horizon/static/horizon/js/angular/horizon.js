var horizon_dependencies = ['hz.conf',
                            'hz.utils',
                            'hz.messages',
                            'ui.bootstrap',
                            'ngAnimate',
                            'ngSanitize',
                            'ngCookies'];
dependencies = horizon_dependencies.concat(angularModuleExtension);
var horizonApp = angular.module('hz', dependencies)
  .config(['$interpolateProvider', '$httpProvider',
    function ($interpolateProvider, $httpProvider) {
      $interpolateProvider.startSymbol('{$');
      $interpolateProvider.endSymbol('$}');
      $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
      $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    }])
  .run(['hzConfig', 'hzMessages', 'hzUtils', '$cookieStore',
    function (hzConfig, hzMessages, hzUtils, $cookieStore) {
      //expose the configuration for horizon legacy variable
      horizon.conf = hzConfig;
      horizon.utils = hzUtils;
      angular.extend(horizon.cookies = {}, $cookieStore);
      horizon.cookies.put = function (key, value) {
        //cookies are updated at the end of current $eval, so for the horizon
        //namespace we need to wrap it in a $apply function.
        angular.element('body').scope().$apply(function () {
          $cookieStore.put(key, value);
        });
      };
    }]);

