angular.module('hz').service
    ('launchStackWorkflow', ['hzConfig', 'hzMessages', '$modal', '$http',
      function (hzConfig, hzMessages, $modal, $http) {
        return {
          start : function () {
            var modalInstance = $modal.open({
              windowClass: 'fullscreen launch-instancee',
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
          $scope.data = [];
          $scope.tabs = [
            {active: false, valid: false},
            {active: false, valid: false, disabled: true},
            {active: false, valid: false}];
          $scope.index = 0;

          $scope.next = function () {
            $scope.select($scope.index + 1);
          };
          $scope.launchStack = {};

          $scope.select = function (index) {
            if ($scope.index === index) {
              return;
            }

              $timeout(function () {

                  if (!($scope.tabs[index].disabled)) {
                      $scope.index = index
                      angular.forEach($scope.tabs, function (tab, i) {
                          $scope.tabs[i].active = (i === index);
                      });
                  }
              });
          };

          $scope.launch = function (launchStackForm) {
            if (launchStackForm.$invalid) {
                //
            } else {
              $modalInstance.close(
                $http.post('/workflow/launch_two', angular.toJson($scope.launchStack))
              );
            }
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        }],

    SelectTemplateCtrl: ['$scope',
        function ($scope) {
            $scope.baseFiles = [
                { label: 'Template', value: 'template', source: 'file' },
                { label: 'Environment', value: 'environment', source: 'file' }
            ];

            $scope.$watchCollection('baseFiles', function () {
                var valid = true;
                angular.forEach($scope.baseFiles, function(f) {
                    valid = valid && (f.url !== undefined || f.file !== undefined || f.raw !== undefined);
                });
                $scope.$parent.tabs[0].valid = valid;
            })

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