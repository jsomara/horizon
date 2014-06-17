angular.module('hz').service
    ('launchStackWorkflow', ['hzConfig', 'hzMessages', '$modal', '$http',
      function (hzConfig, hzMessages, $modal, $http) {
        return {
          start : function () {
            var modalInstance = $modal.open({
              windowClass: 'fullscreen launch-stack',
              keyboard: false,
              backdrop: 'static',
              templateUrl: '/project/stacks/launchTemplate',
              resolve: {
                response: function () {
                  return $http.get('/project/stacks/launch_two');
                }
              },
              controller: 'ModalLaunchStackCtrl'
            });

            modalInstance.result.then(function (success) {
              hzMessages.alert(gettext(
                'Stack: "' + success.data.name + '" successfully created'
              ), 'success');
            }, function (error) {
              if (error === 'cancel') {
                hzMessages.alert(gettext('Launch stack has been aborted'), 'info');
              } else {
                hzMessages.alert(error.data, 'error');
              }
            });
          }
        };
      }])

angular.module('hz').controller({
    ModalLaunchStackCtrl: ['$scope', '$modalInstance', '$timeout', '$http', 'response',
        function ($scope, $modalInstance, $timeout, $http, response) {
          $scope.response = response.data;
          $scope.datas = []
          $scope.tabs = [
            {active: false, valid: false},
            {active: false, valid: false, disabled: true},
            {active: false, valid: false},
            {active: false, valid: false}];
          $scope.index = 0;

          $scope.next = function () {
            $scope.select($scope.index + 1);
          };
          $scope.launchInstance = {};

          $scope.select = function (index) {
            if ($scope.index === index) {
              return;
            }

            $timeout(function () {
              var i = 0;
              while (i < $scope.tabs.length &&
                ($scope.tabs[i].valid || $scope.tabs[i].disabled) &&
                ($scope.tabs[i].disabled || i < index)) {
                i += 1;
              }
              $scope.tabs[i].active = true;
              $scope.index = i;
            });
          };

          $scope.launch = function (launchInstanceForm) {
            if (launchInstanceForm.$invalid) {
              launchInstanceForm.AccessAndSecurityForm.networks.$pristine = false;
              launchInstanceForm.AccessAndSecurityForm.sec_groups.$pristine = false;
              launchInstanceForm.AccessAndSecurityForm.$pristine = false;
            } else {
              $modalInstance.close(
                $http.post('/workflow/launch_two', angular.toJson($scope.launchInstance))
              );
            }
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        }],

    SelectTemplateCtrl: ['$scope',
        function ($scope) {
          $scope.response = response.data;

        }],

    ResolveReferencesCtrl: ['$scope',
        function ($scope) {
          $scope.response = response.data;

        }],

    ParametersCtrl: ['$scope',
        function ($scope) {
          $scope.response = response.data;

        }],

    StacksCtrl: ['$scope', 'launchStackWorkflow',
        function ($scope, launchStackWorkflow) {
          $scope.open = launchStackWorkflow.start;
        }]



})