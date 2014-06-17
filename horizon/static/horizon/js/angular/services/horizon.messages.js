/**
 * Created by jomara on 6/17/14.
 */
/*global angular, gettext*/
(function () {
  'use strict';
  function messages(hzConfig, $rootScope, $document) {
    /*
     Dynamically inject the transition speed in the DOM.
     */
    (function (document, speed) {
      var style = document.createElement('style'),
        selector =
          '.messages .alert-block.ng-enter, .messages .alert-block.ng-leave',
        rule =
          '-webkit-transition: ' + speed / 1000 + 's linear all; transition: ' +
            speed / 1000 + 's linear all;';

      document.head.appendChild(style);

      if (style.sheet.insertRule) {
        style.sheet.insertRule(selector + '{' + rule + '}', 0);
      } else {
        //workaround for IE 8
        style.sheet.addRule(selector, rule, 0);
      }

    }($document[0], hzConfig.auto_fade_alerts.fade_duration));
    return {
      alert: function (msg, type) {
        $rootScope.$broadcast('hzMessage', msg, type);
      },
      clearAllMessages: function () {
        $rootScope.$broadcast('hzClearAllMessages');
      },
      clearErrorMessages: function () {
        $rootScope.$broadcast('hzClearMessages', 'error');
      },
      clearSuccessMessages: function () {
        $rootScope.$broadcast('hzClearMessages', 'success');
      }
    };
  }

  function ctrl($scope, $timeout, hzConfig, JSONCache) {
    var types = {
      'danger': gettext('Danger: '),
      'warning': gettext('Warning: '),
      'info': gettext('Notice: '),
      'success': gettext('Success: '),
      'error': gettext('Error: ')
    }, dismissAlert = function (alert) {
      $timeout(function () {
        var i = 0, l = $scope.alerts.length;
        for (i; i < l; i += 1) {
          if (angular.equals(alert, $scope.alerts[i])) {
            $scope.alerts.splice(i, 1);
            break;
          }
        }
      }, hzConfig.auto_fade_alerts.delay);
    };

    $scope.alerts = [];
    $scope.alerts.push = function () {
      var msg, i, j,
        types = hzConfig.auto_fade_alerts.types,
        k = types.length,
        l = arguments.length;
      for (i = 0; i < l; i += 1) {
        msg = arguments[i];
        msg.type = msg.type || hzConfig.auto_fade_alerts.default_type;
        for (j = 0; j < k; j += 1) {
          if (msg.type === types[j]) {
            dismissAlert(msg);
            break;
          }
        }
      }
      return Array.prototype.push.apply(this, arguments);
    };

    $scope.alerts.push.apply(
      $scope.alerts,
      JSONCache.get('messages-json')
    );

    $scope.$on('hzMessage', function (event, msg, type) {
      $scope.alerts.push({
        msg: msg,
        type: type,
        type_display: types[type]
      });
    });

    $scope.$on('hzClearAllMessages', function () {
      $scope.alerts.length = 0;
    });

    $scope.$on('hzClearMessages', function (event, type) {
      var i = 0;
      while (i < $scope.alerts.length) {
        if ($scope.alerts[i].type === type) {
          $scope.alerts.splice(i, 1);
        } else {
          i += 1;
        }
      }
    });

    $scope.closeAlert = function (index) {
      $scope.alerts.splice(index, 1);
    };
  }

  angular.module('hz.messages', ['hz.conf', 'hz.utils'])
    .service('hzMessages', ['hzConfig', '$rootScope', '$document', messages])
    .controller('messagesCtrl',
      ['$scope', '$timeout', 'hzConfig', 'JSONCache', ctrl]);
}());
