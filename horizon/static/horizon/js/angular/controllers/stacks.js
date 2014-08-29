/*global angular, gettext*/
'use strict';

var validateInput = function(files) {
     var valid = true;
     angular.forEach(files, function(file) {
         valid = valid && (
             (file.upload !== undefined) ||
             (file.raw !== undefined && file.raw !== ''));
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

             var StackLaunchFactory = $resource('/project/stacks/launch_two', {}, {
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
              windowClass: 'in',
              keyboard: false,
              backdrop: 'static',
              templateUrl: '/project/stacks/launchTemplate',
              resolve: {
                response: function () {
                  return $http.get('/project/stacks/launch_two');
                }
              },
              controller: 'ModalLaunchStackCtrl',
              size: 'lg'
            });

            modalInstance.result.then(function (success) {
              hzMessages.alert(gettext(
                'Stack: "' + success.data.name + '" successfully created'
              ), 'success');
            }, function (error) {
              if (error === 'cancel') {
                hzMessages.alert(gettext('Launch stack has been aborted'), 'info');
              } else {
              }
            });
          }
        };
      }]);

angular.module('hz').service
('HeatFileService', [
    function () {
        var self = this;

        self.getFileData = function(file) {
            var contents;
            if (file.source === 'file' && file.upload !== undefined) {
                contents = file.upload[0].data;
            } else if (file.source === 'raw') {
                contents = file.raw;
            } else {
                contents = undefined
            }
            return contents;
        };

        self.makeFiles = function(references) {
            var files = {};
            angular.forEach(references, function(f) {
                files[f.value] = self.getFileData(f);
            });
            return files;
        };

        self.makeParameters = function(parameters) {
            return parameters;
        };
    }]);

angular.module('hz').service
    ('ParameterService', ['StackParameters', 'hzMessages', 'HeatFileService',
    function(StackParameters, hzMessages, HeatFileService) {

        var getParameterData, fixParam, createParameters;

        getParameterData = function(files) {
            return {
                  environment: HeatFileService.getFileData(files.baseFiles[1]),
                  template: HeatFileService.getFileData(files.baseFiles[0]),
                  files: HeatFileService.makeFiles(files.references)
            };
        };

        fixParam = function(param) {
            var p = {};
            p.label = param.Label;
            p.description = param.Description;
            p.type = param.Type;
            return p;
        };

        createParameters = function(launchStack, parameters) {
            launchStack.parameters = [];
            angular.forEach(parameters.Parameters, function(p) {
                launchStack.parameters.push(fixParam(p));
            });

        };

        return {
            getParameters: function(launchStack, scope) {
                var stackPayload = getParameterData(launchStack);
                var parameters = StackParameters.parameters(stackPayload);
                parameters.$promise.then(
                  function(parameters){
                    createParameters(launchStack, parameters);
                  }, function(error) {
                    hzMessages.alert(error.data, 'error');
                    scope.select(1);
                  }
                );
            }
        }
}]);

angular.module('hz').service
    ('ReferenceService', ['StackReferences', 'hzMessages', 'HeatFileService',
      function (StackReferences, hzMessages, HeatFileService) {

          var getReferenceData, makeFile, createReferences;

          getReferenceData = function(files) {
              return {
                  environment: HeatFileService.getFileData(files[1]),
                  template: HeatFileService.getFileData(files[0])
              };
          };

          // turn a required reference file into a file object for directive
          makeFile = function(file) {
              return {
                  label: file,
                  value: file,
                  source: 'file',
                  required: true };
          };

           // create files for form from horizon api
          createReferences = function(references, launchStack) {
              launchStack.references = [];
              angular.forEach(references, function(r) {
                 launchStack.references.push(makeFile(r))
              });
          };

          return {
              getReferences: function(launchStack, scope) {
                  var referenceData, references;
                  referenceData = getReferenceData(launchStack.baseFiles);
                  references = StackReferences.references(referenceData);

                  references.$promise.then(
                      function(references){
                          createReferences(references, launchStack);
                          if (launchStack.references === undefined || launchStack.references.size === 0) {
                              // no references, move on
                              scope.select(2);
                          }
                      }, function(error) {
                          var msg = gettext("An error occurred parsing your template. Please try another one");

                          if (error.data !== undefined) {
                              msg = error.data;
                          }

                          hzMessages.alert(msg, 'error');
                          scope.select(0);
                      }
                  );
              }
          }
      }]);

angular.module('hz').controller({
    ModalLaunchStackCtrl: ['$scope', '$modalInstance', '$timeout','response', 'ParameterService', 'ReferenceService', 'StackLaunch', 'hzMessages', 'HeatFileService',
        function ($scope, $modalInstance, $timeout, response, ParameterService, ReferenceService, StackLaunch, hzMessages, HeatFileService) {

          // query required parameters list from horizon
          var loadParameters = function() {
              ParameterService.getParameters($scope.launchStack, $scope);
          };

          var resolveReferences = function() {
              ReferenceService.getReferences($scope.launchStack, $scope);
          };

          var makeFinalParams = function(launchStack) {
              return {
                  environment:  HeatFileService.getFileData(launchStack.baseFiles[1]),
                  template:  HeatFileService.getFileData(launchStack.baseFiles[0]),
                  files: HeatFileService.makeFiles(launchStack.references),
                  parameters: HeatFileService.makeParameters(launchStack.parameters)
              };
          };

          $scope.response = response.data;
          $scope.data = [];
          $scope.tabs = [
            {active: false, valid: false, recheck:true},
            {active: false, valid: false, recheck:true, disabled:true},
            {active: false, valid: false, recheck:true, disabled:true}];
          $scope.index = 0;

          $scope.next = function () {
            $scope.select($scope.index + 1);
          };

          $scope.launchStack = { baseFiles: [
                { label: 'Template', value: 'template', source: 'file', required: true },
                { label: 'Environment', value: 'environment', source: 'file', required: false }
            ]};

          $scope.select = function (index) {
              if (!$scope.tabs[index].disabled && $scope.index !== index) {
                 if (index === 1 && $scope.tabs[0].recheck) {
                     resolveReferences();
                     $scope.tabs[0].recheck = false;
                 } else if (index === 2 && $scope.tabs[1].recheck) {
                     loadParameters();
                     $scope.tabs[1].recheck = false;
                 }
                 $timeout(function () {
                     $scope.index = index;
                     angular.forEach($scope.tabs, function (tab, i) {
                         $scope.tabs[i].active = (i === index);
                     });
                 });
              }

          };

          $scope.launch = function (launchStackForm) {
            if (launchStackForm.$invalid) {
                //
            } else {
                var launch = StackLaunch.launch(makeFinalParams($scope.launchStack));
                launch.$promise.then(
                    function(response) {
                       $modalInstance.close();
                    }, function(error) {
                       hzMessages.alert(error.data, 'error');
                    }
                )
            }
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        }],

    SelectTemplateCtrl: ['$scope',
        function ($scope) {

            var validate = function() {
                var valid = validateInput([$scope.launchStack.baseFiles[0]]);
                $scope.$parent.tabs[0].valid = valid;
                $scope.$parent.tabs[1].disabled = !valid;
                $scope.$parent.tabs[2].disabled = !valid;
                $scope.$parent.tabs[0].recheck = true
            };

            $scope.$watchCollection('launchStack.baseFiles[0]', validate);

        }],

    ResolveReferencesCtrl: ['$scope',
        function ($scope) {

             var validate = function() {
                var valid = validateInput($scope.launchStack.references);
                $scope.$parent.tabs[1].valid = valid;
                $scope.$parent.tabs[1].recheck = true
             };

            $scope.$watch('launchStack.references', validate, true);
        }],

    ParametersCtrl: ['$scope',
        function ($scope) {

             var validate = function() {
                 var valid = true;
                 $scope.$parent.tabs[2].valid = valid;
                 $scope.$parent.tabs[2].recheck = true
             };

            $scope.$watch('launchStack.parameters', validate, true);
        }],

    StacksCtrl: ['$scope', 'launchStackWorkflow',
        function ($scope, launchStackWorkflow) {
          $scope.open = launchStackWorkflow.start;
        }]
});