 var getFileData = function(file) {
      var contents;
      if (file.source === 'file' && file.upload !== undefined) {
          contents = file.upload[0];
      } else if (file.source === 'raw') {
          contents = file.raw;
      } else if (file.source === 'url' && file.url !== undefined && file.url !== '') {
          contents = $http.get(file.url);
      } else {
          contents = undefined
      }
      return contents;
 };

 var validateInput = function(files) {
     var valid = true;
     angular.forEach(files, function(file) {
         valid = valid && (file.url !== undefined || file.file !== undefined || file.raw !== undefined);
     })
     return valid;
};

angular.module('hz').factory
    ('StackReferences', ['$resource',
        function ($resource) {
             var StackReferences = $resource('/project/stacks/references', {}, {
                 references: { method: 'POST', isArray: true }
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
              windowClass: 'fullscreen launch-instance',
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

angular.module('hz').service
    ('ParameterService', ['$http', 'StackParameters',
    function($http, StackParameters) {
        var getParameterData = function(file) {
            return {
                template: getFileData(file)
            };
        }

        var createParameters = function(launchStack, parameters) {

        }

        return {
            getParameters: function(launchStack) {
                console.log("Calling load parameters into horizon");
                var stackPayload = getParameterData(launchStack.baseFiles[0]);
                var parameters = StackParameters.parameters(stackPayload);
                parameters.$promise.then(
                  function(parameters){
                    createParameters(launchStack, parameters);
                  }
              )
            }
        }


}])
angular.module('hz').service
    ('ReferenceService', ['$http', 'StackReferences',
      function ($http, StackReferences) {

         var getReferenceData = function(file) {
              return {
                  environment: getFileData(file)
              };
          }

          // turn a required reference file into a file object for directive
          var makeFile = function(file) {
              return {
                  label: file,
                  value: file,
                  source: 'file',
                  required: true };
          }

           // create files for form from horizon api
          var createReferences = function(references, launchStack) {
              launchStack.references = [];
              angular.forEach(references, function(r) {
                 launchStack.references.push(makeFile(r))
              });
          }

          return {
              getReferences: function(launchStack, scope) {
                  var referenceData = getReferenceData(launchStack.baseFiles[1]);
                  if (referenceData !== undefined) {
                        var references = StackReferences.references(referenceData);
                        references.$promise.then(
                            function(references){
                                console.log("Got references:")
                                console.log(references)
                                createReferences(references, launchStack);
                                 if (launchStack.references === undefined || launchStack.references.size === 0) {
                                      // no references, move on
                                      scope.select(2);
                                 }
                        });
                  }
              }
          }

      }]);


angular.module('hz').controller({
    ModalLaunchStackCtrl: ['$scope', '$modalInstance', '$timeout', '$http', 'response', 'ParameterService', 'ReferenceService',
        function ($scope, $modalInstance, $timeout, $http, response, ParameterService, ReferenceService) {

          // query required parameters list from horizon
          var loadParameters = function() {
              ParameterService.getParameters($scope.launchStack);
          };

          var resolveReferences = function() {
              ReferenceService.getReferences($scope.launchStack);
          }

          $scope.response = response.data;
          $scope.data = [];
          $scope.tabs = [
            {active: false, valid: false},
            {active: false, valid: false},
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
                  if (index === 1) {
                      resolveReferences();
                  } else if (index === 2) {
                      loadParameters();
                  }
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

            var validate = function() {
                valid = validateInput([$scope.launchStack.baseFiles[0]])
                $scope.$parent.tabs[0].valid = valid;
            }

            $scope.$watchCollection('launchStack.baseFiles[0]', validate);

        }],

    ResolveReferencesCtrl: ['$scope',
        function ($scope) {

             var validate = function() {
                valid = validateInput($scope.launchStack.references);
                $scope.$parent.tabs[1].valid = valid;
             }

            $scope.$watch('launchStack.references', validate, true);

        }],

    ParametersCtrl: ['$scope',
        function ($scope) {

        }],

    StacksCtrl: ['$scope', 'launchStackWorkflow',
        function ($scope, launchStackWorkflow) {
          $scope.open = launchStackWorkflow.start;
        }]




})