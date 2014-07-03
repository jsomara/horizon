angular.module('hz').factory
    ('StackReferences', ['$resource',
        function ($resource) {
             var StackReferences = $resource('/project/stacks/references', {}, {
                 references: { method: 'POST' }
             });

             return StackReferences;

        }]);

angular.module('hz').factory
    ('StackParameters', ['$resource',
        function ($resource) {
            var StackParameters= $resource('/project/stacks/parameters', {}, {
                parameters: { method: 'POST' }
            });

            return StackParameters;
        }]);

angular.module('hz').factory
    ('StackLaunch', ['$resource',
        function ($resource) {

             var StackLaunchFactory = $resource('/project/stacks/launch', {}, {
                launch: { method: 'POST' }
            });

            return StackLaunchFactory;
        }]);

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
      }]);

angular.module('hz').controller({
    ModalLaunchStackCtrl: ['$scope', '$modalInstance', '$timeout', 'response', 'StackParameters', 'StackReferences',
        function ($scope, $modalInstance, $timeout, response, StackParameters, StackReferences) {
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

          $scope.launchStack = { baseFiles: [
                { label: 'Template', value: 'template', source: 'file', required: true },
                { label: 'Environment', value: 'environment', source: 'file', required: false }
            ]};

          $scope.select = function (index) {
              if ($scope.index !== index) {
                  $timeout(function () {
                      if (!($scope.tabs[index].disabled)) {
                          $scope.index = index;
                          angular.forEach($scope.tabs, function (tab, i) {
                              $scope.tabs[i].active = (i === index);
                          });
                      }
                  });
              }
          };

          // create parameters list for directive
          var createParameters = function(parameters) {

          }

          // turn a required reference file into a file object for directive
          var makeFile = function(file) {
              return {
                  label: file.value,
                  value: file.name,
                  source: 'file',
                  required: true };
          }

          // create files for form from horizon api
          var createReferences = function(references) {
              launchStack.references = {};
              launchStack.references.files = [];
              angular.forEach(references, function(r) {
                 launchStack.referenceForm.files.push(makeFile(r))
              });
          }

          // query required parameters list from horizon
          var loadParameters = function() {
              console.log("Calling load parameters into horizon");
              var parameters = StackParameters.parameters();
              parameters.$promise.then(
                  function(parameters){
                    createParameters(parameters);
                  }
              )
          };

          // query required references list from horizon
          var resolveReferences = function() {
              console.log("Calling resolve references into horizon");
              var references = StackReferences.references($scope.launchStack.baseFiles[1]);
              references.$promise.then(
                  function(references){
                      createReferences(references);
                  }
              )
          };

          $scope.selectParameters = function() {
              $scope.select(2);
              // dont re-resolve parameters unless template changes
              loadParameters();
          };

          $scope.selectResolveReferences = function() {
              $scope.select(1);
              // dont re-resolve references unless environment changes
              resolveReferences();
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

            var validate = function () {
                var valid, f;
                f = $scope.launchStack.baseFiles[0];
                valid = (f.url !== undefined || f.file !== undefined || f.raw !== undefined);
                $scope.$parent.tabs[0].valid = valid;
            };

            $scope.$watchCollection('launchStack.baseFiles[0]', validate);

        }],

    ResolveReferencesCtrl: ['$scope',
        function ($scope) {
          $scope.launchStack.references = {};

        }],

    ParametersCtrl: ['$scope',
        function ($scope) {
          $scope.launchStack.parameters = {};

        }],

    StacksCtrl: ['$scope', 'launchStackWorkflow',
        function ($scope, launchStackWorkflow) {
          $scope.open = launchStackWorkflow.start;
        }]




})