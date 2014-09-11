/*global angular, gettext*/
'use strict';

var dependencies = ['hz.conf',
                    'hz.utils',
                    'ui.bootstrap',
                    'ngAnimate',
                    'ngSanitize',
                    'ngCookies',
                    'ngResource',
                    'angularFileUpload'];

var heat = angular.module('hz.heat', dependencies);

var validateInput = function(files) {
     var valid = true;
     angular.forEach(files, function(file) {
         valid = valid && (

             (typeof file.upload !== 'undefined') ||
             (typeof file.raw !== 'undefined' && file.raw !== ''));
     })
     return valid;
};

heat.service
    ('StackReferences', ['$http',
        function ($http) {

            var self = this;

            self.references = function(payload) {
                var url = '/project/stacks/references';
                return $http.post(url, payload);
            };
        }])

.service
    ('StackParameters', ['$http',
        function ($http) {

            var self = this;

            self.parameters = function(payload) {
                var url = '/project/stacks/parameters';
                return $http.post(url, payload);
            };

        }])

.service
    ('StackLaunch', ['$http',
        function ($http) {

            var self = this;

            self.launch = function(payload) {
                var url = '/project/stacks/launch';
                return $http.post(url, payload);
            };

        }])

.service
    ('launchStackWorkflow', ['hzConfig', 'horizon', '$modal', '$http',
      function (hzConfig, horizon, $modal, $http) {
        return {
          start : function () {
            var modalInstance = $modal.open({
              windowClass: 'in',
              keyboard: false,
              backdrop: 'static',
              templateUrl: '/project/stacks/launchTemplate',
              resolve: {
                response: function () {
                  return $http.get('/project/stacks/launch');
                }
              },
              controller: 'ModalLaunchStackCtrl',
              size: 'lg'
            });

            modalInstance.result.then(function (success) {
              horizon.alert(gettext(
                'Stack: "' + success.data.name + '" successfully created'
              ), 'success');
            }, function (error) {
              if (error === 'cancel') {
                horizon.alert(gettext('Launch stack has been aborted'), 'info');
              } else {
              }
            });
          }
        };
      }])

.service
('HeatFileService', [
    function () {
        var self = this;

        self.getFileData = function(file) {
            var contents;
            if (file.source === 'file' && typeof file.upload !== 'undefined') {
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
    }])

angular.module('hz').service
    ('ParameterService', ['StackParameters', 'horizon', 'HeatFileService',
    function(StackParameters, horizon, HeatFileService) {

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
                parameters.success(
                  function(parameters){
                    createParameters(launchStack, parameters);
                  }).error(function(error) {
                    horizon.alert(error.data, 'error');
                    scope.select(1);
                  });
            }
        }
}])

angular.module('hz').service
    ('ReferenceService', ['StackReferences', 'horizon', 'HeatFileService',
      function (StackReferences, horizon, HeatFileService) {

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

                  references.success(
                      function(references){
                          createReferences(references, launchStack);
                          if (typeof launchStack.references === 'undefined' || launchStack.references.size === 0) {
                              // no references, move on
                              scope.select(2);
                          }
                      }).error(function(error) {
                          var msg = gettext("An error occurred parsing your template. Please try another one");

                          if (typeof error.data !== 'undefined') {
                              msg = error.data;
                          }

                          horizon.alert(msg, 'error');
                          scope.select(0);
                      });
              }
          }
      }])

.controller({
    ModalLaunchStackCtrl: ['$scope', '$modalInstance', '$timeout','response', 'ParameterService', 'ReferenceService', 'StackLaunch', 'horizon', 'HeatFileService',
        function ($scope, $modalInstance, $timeout, response, ParameterService, ReferenceService, StackLaunch, horizon, HeatFileService) {

            var loadParameters, resolveReferences, makeFinalParams, launchStackRemote;

            // query required parameters list from horizon
            loadParameters = function() {
                ParameterService.getParameters($scope.launchStack, $scope);
            };

            resolveReferences = function() {
                ReferenceService.getReferences($scope.launchStack, $scope);
            };

            makeFinalParams = function(launchStack) {
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
                    launch.success(
                        function(response) {
                           $modalInstance.close();
                        }).error(function(error) {
                           horizon.alert(error.error.message, 'error');
                        });
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