/*globals horizonApp, angular, gettext*/
(function () {
  'use strict';
  function image_categories(images, volumes, tenant_id) {
    var persistent = {},
      ephemeral_sources = {
        source_types: {
          images: {
            title: gettext('Images'),
            values: [],
            total: 0
          },
          instances_snapshots: {
            title: gettext('Instances Snapshots'),
            values: [],
            total: 0
          }
        },
        total: 0
      },
      ephemeral = {
        'project': angular.copy(ephemeral_sources),
        'public': angular.copy(ephemeral_sources),
        'shared': angular.copy(ephemeral_sources)
      };

    ephemeral['public'].title = gettext('Public');
    ephemeral['public'].empty = gettext('No public image available');
    ephemeral.project.title = gettext('Project');
    ephemeral.project.empty = gettext('No project image available');
    ephemeral.shared.title = gettext('Shared with me');
    ephemeral.shared.empty = gettext('No shared image available');

    angular.forEach(images, function (image) {

      function push(image, type) {
        var source_type =
          image.properties.image_type === "snapshot" ? 'instances_snapshots' : 'images';
        ephemeral[type].total += 1;
        ephemeral[type].source_types[source_type].values.push(image);
        ephemeral[type].source_types[source_type].total += 1;
      }

      if (image.is_public) { push(image, 'public'); }
      if (image.owner === tenant_id) {
        push(image, 'project');
      } else if (!image.is_public) {
        push(image, 'shared');
      }
    });

    angular.copy(ephemeral, persistent);
    angular.forEach(['public', 'project', 'shared'], function (type) {
      persistent[type].source_types.images.legend = gettext('creates a new volume');
      persistent[type].source_types.instances_snapshots.legend = gettext('creates a new volume');
    });

    persistent.project.source_types.volumes = {
      title: gettext('Volumes'),
      values: volumes.volumes,
      legend: gettext('use this volume'),
      total: volumes.volumes.length
    };

    persistent.project.source_types.volumes_snapshots = {
      title: gettext('Volumes Snapshots'),
      values: volumes.volumes_snapshots,
      legend: gettext('creates a new volume'),
      total: volumes.volumes_snapshots.length
    };

    persistent.project.total += persistent.project.source_types.volumes_snapshots.total +
      persistent.project.source_types.volumes.total;

    //remove empty entries
    angular.forEach(['project', 'public', 'shared'], function (type) {
      angular.forEach(ephemeral[type].source_types, function (source_type, key) {
        if (source_type.total === 0) {
          delete ephemeral[type].source_types[key];
        }
      });
      angular.forEach(persistent[type].source_types, function (source_type, key) {
        if (source_type.total === 0) {
          delete persistent[type].source_types[key];
        }
      });
    });

    return {
      ephemeral: ephemeral,
      persistent: persistent
    };
  }

  function sort_flavors(f1, f2) {
    //take this opportunity to replace ephemeral crappy key
    f1.ephemeral = f1['OS-FLV-EXT-DATA:ephemeral'];
    f2.ephemeral = f2['OS-FLV-EXT-DATA:ephemeral'];
    return f1.ram > f2.ram;
  }

  horizonApp
    .service('launchWorkflow', ['hzConfig', 'hzMessages', '$modal', '$http',
      function (hzConfig, hzMessages, $modal, $http) {
        return {
          start : function () {
            var modalInstance = $modal.open({
              windowClass: 'fullscreen launch-instance',
              keyboard: false,
              backdrop: 'static',
              templateUrl: '/workflow/launchTemplate',
              resolve: {
                response: function () {
                  return $http.get('/workflow/launch');
                }
              },
              controller: 'ModalLaunchInstanceCtrl'
            });

            modalInstance.result.then(function (success) {
              hzMessages.alert(gettext(
                'Instance: "' + success.data.name + '" successfully created'
              ), 'success');
            }, function (error) {
              if (error === 'cancel') {
                hzMessages.alert(gettext('Launch instance has been aborted'), 'info');
              } else {
                hzMessages.alert(error.data, 'error');
              }
            });
          }
        };
      }])
    .controller({
      ModalLaunchInstanceCtrl: ['$scope', '$modalInstance', '$timeout', '$http', 'response',
        function ($scope, $modalInstance, $timeout, $http, response) {
          $scope.response = response.data;
          $scope.datas = image_categories(
            response.data.images,
            {
              volumes: response.data.volumes,
              volumes_snapshots: response.data.volumes_snapshots
            },
            response.data.tenant
          );
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
                $http.post('/workflow/launch', angular.toJson($scope.launchInstance))
              );
            }
          };

          $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
          };
        }],

      InstancesCtrl: ['$scope', 'launchWorkflow',
        function ($scope, launchWorkflow) {
          $scope.open = launchWorkflow.start;
        }],


      SelectSourceCtrl: ['$scope', function ($scope) {
        $scope.zones = $scope.response.zones;
        $scope.max_count = $scope.response.count;
        $scope.display_errors = false;

        $scope.launchInstance.type = 'ephemeral';
        $scope.elts = $scope.datas[$scope.type];
        $scope.launchInstance.count = 1;
        $scope.launchInstance.availability_zone = $scope.zones[0];

        $scope.$watch('SelectSourceForm.$valid', function (value) {
          $scope.$parent.tabs[0].valid = value;
        });

        $scope.select = function (source_type, source) {
          if (!$scope.SubSelectSourceForm.$valid || $scope.SubSelectSourceForm.$pristine) {
            $scope.SubSelectSourceForm.$pristine = false;
            $scope.SubSelectSourceForm.name.$pristine = false;
          } else {
            if ($scope.source) {
              delete $scope.source.active;
            }
            source.active = true;
            $scope.source = source;

            $scope.launchInstance.source_type = source_type;
            $scope.launchInstance.source_id = source.id;
            if (source_type === 'volumes' || source_type === 'volumes_snapshot') {
              $scope.launchInstance.volume_size = source.size;
            } else {
              $scope.launchInstance.volume_size = 1;
            }

            $scope.$parent.tabs[1].disabled =
              !($scope.launchInstance.type === 'persistent');
            $scope.next();

          }
        };

        $scope.$watch('launchInstance.type', function () {
          $scope.elts = $scope.datas[$scope.launchInstance.type];
        });
      }],
      BootVolumeCtrl: ['$scope', function ($scope) {
        $scope.launchInstance.device_name = 'vda';

        $scope.$watch('BootVolumeForm.$valid', function (value) {
          $scope.$parent.tabs[1].valid = value;
        });
      }],

      FlavorCtrl: ['$scope', function ($scope) {
        $scope.flavors = $scope.response.flavors.sort(sort_flavors);

        $scope.$watch('FlavorForm.$valid', function (value) {
          $scope.$parent.tabs[2].valid = value;
        });

        $scope.select = function (flavor) {
          if ($scope.launchInstance.flavor) {
            delete $scope.launchInstance.flavor.active;
          }
          flavor.active = true;
          $scope.launchInstance.flavor = flavor;
          $scope.next();
        };
      }],


      AccessAndSecurityCtrl: ['$scope', function ($scope) {
        $scope.key_pairs = $scope.response.access_security.key_pairs;
        $scope.key_pairs_name = [];
        angular.forEach($scope.key_pairs, function (key_pair) {
          $scope.key_pairs_name.push(key_pair.name);
        });

        $scope.sec_groups_list = $scope.response.access_security.security_groups;
        $scope.networks_list = $scope.response.access_security.available_networks;
        $scope.launchInstance.create_key_pair = false;
        $scope.launchInstance.import_key_pair = false;
        $scope.launchInstance.disk_partition = 'AUTO';
        $scope.$watch('AccessAndSecurityForm.$valid', function (value) {
          $scope.$parent.tabs[3].valid = value;
        });
      }]
    })


    .config(['$filterProvider', function ($filterProvider) {
      $filterProvider.register('name', function () {
        return function (obj) {
          return obj.name || obj.display_name || 'Name could not be retrieved';
        };
      });
    }])
    .constant('buttonConfig', {
      activeClass: 'btn-primary'
    });
}());
