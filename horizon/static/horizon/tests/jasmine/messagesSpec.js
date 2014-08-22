/*global describe, it, expect, jasmine, beforeEach, afterEach, spyOn, angular*/
describe('hz.messages', function () {
  'use strict';

  beforeEach(function () {
    angular.mock.module('hz.conf');
    angular.mock.module('hz.utils');
    angular.mock.module('hz.messages');
  });

  describe('hzMessages', function () {
    var hzMessages, hzConfig, $scope, $document, msg, infoAlert;

    beforeEach(function () {
      msg = 'This is an alert';
      infoAlert = {msg: msg, type: 'info'};
      angular.mock.inject(function ($injector) {
        $scope = $injector.get('$rootScope').$new();
        $document = $injector.get('$document');
        hzConfig = $injector.get('hzConfig');

        //initialize hzConfig for the test
        hzConfig.auto_fade_alerts = {
          fade_duration: 300,
          types: ['success', 'info'],
          default_type: 'info',
          delay: 300
        };
        hzMessages = $injector.get('hzMessages');
        $injector.get('$controller')('messagesCtrl', {$scope: $scope});
      });
    });

    afterEach(function () {
      $scope.alerts.length = 0;
    });

    it('should have a configurable fade speed', function () {
      var head_content = $document.children().children()[0].childNodes,
        transition_style = head_content[head_content.length - 1];
      expect(transition_style.sheet.cssRules[0].cssText)
        .toContain('transition: all ' +
          (hzConfig.auto_fade_alerts.delay / 1000).toString() +
          's');
    });

    it('should alert messages at different levels', function () {
      hzMessages.alert(msg);
      expect($scope.alerts.length).toBe(1);
      expect($scope.alerts[0].type).
        toBe(hzConfig.auto_fade_alerts.default_type);
      expect($scope.alerts[0].msg).
        toBe(msg);

      hzMessages.alert(msg, 'danger');
      expect($scope.alerts.length).toBe(2);
      expect($scope.alerts[1].type).
        toBe('danger');
    });

    it('should provide a function which will clean all alerts', function () {
      $scope.alerts.push({msg: msg});
      $scope.alerts.push({msg: msg});
      $scope.alerts.push({msg: msg});
      expect($scope.alerts.length).toBe(3);

      hzMessages.clearAllMessages();
      expect($scope.alerts.length).toBe(0);
    });
    it('should provide a function to clear error alerts',
      function () {
        $scope.alerts.push({msg: msg, type: 'error'});
        $scope.alerts.push(infoAlert);
        $scope.alerts.push({msg: msg, type: 'error'});

        expect($scope.alerts.length).toBe(3);

        hzMessages.clearErrorMessages();

        expect($scope.alerts.length).toBe(1);
        expect($scope.alerts[0]).toEqual(infoAlert);
      });

    it('should provide a function to clear success alerts',
      function () {
        $scope.alerts.push({msg: msg, type: 'success'});
        $scope.alerts.push({msg: msg, type: 'success'});
        $scope.alerts.push(infoAlert);

        expect($scope.alerts.length).toBe(3);

        hzMessages.clearSuccessMessages();

        expect($scope.alerts.length).toBe(1);
        expect($scope.alerts[0]).toEqual(infoAlert);
      });

    it('should provide a function to clear a specific alert', function () {
      $scope.alerts.push({msg: msg, type: 'error'});
      $scope.alerts.push(infoAlert);

      $scope.closeAlert(1);

      expect($scope.alerts.length).toBe(1);
      expect($scope.alerts[0]).not.toEqual(infoAlert);
    });

    it('should be able to load initial alerts from DOM with JSONCache',
      angular.mock.inject(function ($controller, JSONCache) {
        JSONCache.put('messages-json', [infoAlert]);
        $controller('messagesCtrl', {$scope: $scope});
        expect($scope.alerts.length).toBe(1);
        expect($scope.alerts[0]).toEqual(infoAlert);
      }));

    it('should dismiss specific kinds of alerts after a delay',
      angular.mock.inject(function ($timeout) {
        angular.forEach(hzConfig.auto_fade_alerts.types, function (type) {
          $scope.alerts.push({msg: msg, type: type});
        });
        $scope.alerts.push(infoAlert);

        $timeout(function () {
          expect($scope.alerts.length).toBe(1);
          expect($scope.alerts[0]).toEqual(infoAlert);
        }, hzConfig.auto_fade_alerts.delay +
          hzConfig.auto_fade_alerts.fade_duration);
      }));
  });
});