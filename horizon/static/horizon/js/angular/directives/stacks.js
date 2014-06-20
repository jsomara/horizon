/**
 * Created by jomara on 6/19/14.
 */
angular.module('hz').directive({
    heatDataUpload: [function () {

        return {
            restrict: 'A',
            transclude: true,
            scope: {
                file: '=file'
            },
            controller: ['$scope', function ($scope) {

                $scope.templateSource = 'url';

                $scope.sourceOptions = [
                    { 'label': 'URL', 'value': 'url' },
                    { 'label': 'File', 'value': 'file' },
                    { 'label': 'Raw Input', 'value': 'raw' }
                ];

                $scope.selectAction = function () {
                    console.log($scope.templateSource);
                    console.log('is file?');
                    console.log($scope.templateSource === 'file')
                };

            }],
            template:
               '<div class="control-group form-field clearfix required">\n' +
                    '<label for="id_{$file.value$}_source">{$file.label$} Source:</label>\n' +
                    '<span class="help-block" style="display: none;">   </span>\n' +
                    '<div class="input">\n' +
                        '<select class="switchable"\n' +
                                'data-slug="{{file.value}source"\n' +
                                'id="id_{{file.value}_source"\n' +
                                'name="{{file.value}}_source"\n' +
                                'ng-options="value.value as value.label for value in sourceOptions"\n' +
                                'ng-model="file.source"\n' +
                                'ng-change="selectAction()"\n' +
                                'data-original-title="">\n' +
                        '</select>\n' +
                    '</div>\n' +
                '</div>\n' +
                '<div class="control-group form-field clearfix" ng-show="file.source === \'file\'">\n' +
                    '<label for="id_{$ file.value $}_upload">{$ file.label$}} File</label>\n' +
                    '<span class="help-block" style="display: none;"> A local {$ file.value $} to upload.  </span>\n' +
                    '<div class="input">\n' +
                      '<input class="switched" data-switch-on="{$ file.value $}source" data-{$ file.value $}source-file="Template File" id="id_{$ file.value $}_upload" name="{$ file.value $}_upload" type="file">\n' +
                    '</div>\n' +
                '</div>\n'+
                '<div class="control-group form-field clearfix " ng-show="file.source === \'url\'">\n' +
                    '<label for="id_{$ file.value $}_url">{$ file.label$}}:</label>\n' +
                    '<span class="help-block" style="display: none;"> An external (HTTP) URL to load the {$ file.value $} from.  </span>\n' +
                    '<div class="input">\n' +
                      '<input class="switched" data-switch-on="{$ file.value $}source" data-{$ file.value $}source-url="{$ file.value $} URL" id="id_{$ file.value $}_url" name="{$ file.value $}_url" type="text">\n' +
                    '</div>\n' +
                '</div>\n ' +
                '<div class="control-group form-field clearfix " ng-show="file.source === \'raw\'">\n ' +
                    '<label for="id_{$ file.value $}_data">{$ file.label$}} Data:</label>\n' +
                    '<span class="help-block" style="display: none;"> The raw contents of the {$ file.value $}.  </span>\n ' +
                    '<div class="input">\n ' +
                      '<textarea class="switched" cols="40" data-switch-on="{$ file.value $}source" data-{$ file.value $}source-raw="{$ file.value $} Data" id="id_{$ file.value $}_data" name="{$ file.value $}_data" rows="10"></textarea>\n ' +
                    '</div>\n ' +
                '</div>\n',

            link: function (scope, element, attrs, modelCtrl, transclude) {
                scope.modelCtrl = modelCtrl;
                scope.$transcludeFn = transclude;

            }
        };
    }]
})