var horizonApp = angular.module('horizonApp', [])
  .config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('{$');
    $interpolateProvider.endSymbol('$}');
  });

angular.module('horizonApp').constant('horizon', horizon);
