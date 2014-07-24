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

var makeFiles = function(references) {
    var files = {};
    angular.forEach(references, function(f) {
        files[f.value] = getFileData(f);
    });
    return files;
};

var makeParameters = function(parameters) {
    // TODO implement
    return parameters;
}

var makeFinalParams = function(launchStack) {
  return {
          environment: getFileData(launchStack.baseFiles[1]),
          template: getFileData(launchStack.baseFiles[0]),
          files: makeFiles(launchStack.references),
          parameters: makeParameters(launchStack.parameters)
    };
}

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
        var getParameterData = function(files) {
            return {
                  environment: getFileData(files.baseFiles[1]),
                  template: getFileData(files.baseFiles[0]),
                  files: makeFiles(files.references)
            };
        };

        var fixParam = function(param) {
            p = {};
            p.label = param.Label;
            p.description = param.Description;
            p.type = param.Type;
            return p;
        }

        var createParameters = function(launchStack, parameters) {
            launchStack.parameters = [];
            angular.forEach(parameters.Parameters, function(p) {
                launchStack.parameters.push(fixParam(p));
            });

        }

        return {
            getParameters: function(launchStack) {
                var stackPayload = getParameterData(launchStack);
                var parameters = StackParameters.parameters(stackPayload);
                parameters.$promise.then(
                  function(parameters){
                    createParameters(launchStack, parameters);
                  }
                );
            }
        }


}])
angular.module('hz').service
    ('ReferenceService', ['$http', 'StackReferences',
      function ($http, StackReferences) {

         var getReferenceData = function(files) {
              return {
                  environment: getFileData(files[1]),
                  template: getFileData(files[0])
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
                  var referenceData = getReferenceData(launchStack.baseFiles);
                  var references = StackReferences.references(referenceData);
                  references.$promise.then(
                      function(references){
                          createReferences(references, launchStack);
                          if (launchStack.references === undefined || launchStack.references.size === 0) {
                              // no references, move on
                              scope.select(2);
                          }
                  });
              }
          }

      }]);


angular.module('hz').controller({
    ModalLaunchStackCtrl: ['$scope', '$modalInstance', '$timeout', '$http', 'response', 'ParameterService', 'ReferenceService', 'StackLaunch',
        function ($scope, $modalInstance, $timeout, $http, response, ParameterService, ReferenceService, StackLaunch) {

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
            {active: false, valid: false, recheck:true},
            {active: false, valid: false, recheck:true},
            {active: false, valid: false, recheck:true}];
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
                  if (index === 1 && $scope.tabs[0].recheck) {
                      console.log("Horizon refs call");
                      resolveReferences();
                      $scope.tabs[0].recheck = false;
                  } else if (index === 2 && $scope.tabs[1].recheck) {
                      console.log("Horizon params call");
                      loadParameters();
                      $scope.tabs[1].recheck = false;
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
                  StackLaunch.launch(makeFinalParams($scope.launchStack))
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
                $scope.$parent.tabs[0].recheck = true
            }

            $scope.$watchCollection('launchStack.baseFiles[0]', validate);

        }],

    ResolveReferencesCtrl: ['$scope',
        function ($scope) {

             var validate = function() {
                valid = validateInput($scope.launchStack.references);
                $scope.$parent.tabs[1].valid = valid;
                $scope.$parent.tabs[1].recheck = true

             }

            $scope.$watch('launchStack.references', validate, true);

        }],

    ParametersCtrl: ['$scope',
        function ($scope) {

             console.log('Here are your parameters');
             console.log($scope.launchStack.parameters);

             var validate = function() {

                 console.log('Here are your parameters');
                 console.log($scope.launchStack.parameters);
                // TODO implement
                valid = true;
                $scope.$parent.tabs[2].valid = valid;
                $scope.$parent.tabs[2].recheck = true

             }

            $scope.$watch('launchStack.parameters', validate, true);
        }],

    StacksCtrl: ['$scope', 'launchStackWorkflow',
        function ($scope, launchStackWorkflow) {
          $scope.open = launchStackWorkflow.start;
        }]


})