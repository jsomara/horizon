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

                };

                $scope.onFileSelect = function ($files) {
                    //$files: an array of files selected, each file has name, size, and type.
                    $scope.file.upload = [];
                    for (var i = 0; i < $files.length; i++) {
                        var file = $files[i];
                        var upload = {
                            name: file.name,
                            type: file.type
                        }
                        var reader = new FileReader();
                        reader.onload = function (e) {
                           upload.data = e.target.result;
                        };
                        reader.readAsText(file);
                        $scope.file.upload.push(upload);
                        //.xhr(function(xhr){xhr.upload.addEventListener(...)})// access and attach any event listener to XMLHttpRequest.
                    }
                    console.log("Got a file.");
                    console.log($scope.file);
                    /* alternative way of uploading, send the file binary with the file's content-type.
                     Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
                     It could also be used to monitor the progress of a normal http post/put request with large data*/
                    // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
                 };



            }],
            template:
               '<div class="control-group form-field clearfix required">\n' +
                    '<label for="id_{$file.value$}_source">{$file.label$} Source:</label>\n' +
                    '<span class="help-block" style="display: none;">   </span>\n' +
                    '<div class="input">\n' +
                        '<select class="switchable"\n' +
                                'data-slug="{{file.value}}_source"\n' +
                                'id="id_{{file.value}}_source"\n' +
                                'name="{{file.value}}_source"\n' +
                                'ng-options="value.value as value.label for value in sourceOptions"\n' +
                                'ng-model="file.source"\n' +
                                'ng-change="selectAction()">\n' +
                        '</select>\n' +
                    '</div>\n' +
                '</div>\n' +
                '<div class="control-group form-field clearfix" ng-show="file.source === \'file\'">\n' +
                    '<label for="id_{$ file.value $}_upload">{$ file.label $} File:</label>\n' +
                    '<span class="help-block" style="display: none;"> A local {$ file.value $} to upload.  </span>\n' +
                    '<div class="input">\n' +
                      '<input class="switched" name="{$ file.value $}_upload" type="file" ng-file-select="onFileSelect($files,file.upload)">\n' +
                    '</div>\n' +
                '</div>\n'+
                '<div class="control-group form-field clearfix" ng-show="file.source === \'url\'">\n' +
                    '<label for="id_{$ file.value $}_url">{$ file.label $} URL:</label>\n' +
                    '<span class="help-block" style="display: none;"> An external (HTTP) URL to load the {$ file.value $} from.  </span>\n' +
                    '<div class="input">\n' +
                      '<input class="switched" ng-model="file.url"  name="{$ file.value $}_url" type="text">\n' +
                    '</div>\n' +
                '</div>\n ' +
                '<div class="control-group form-field clearfix" ng-show="file.source === \'raw\'">\n ' +
                    '<label for="id_{$ file.value $}_data">{$ file.label$} Data:</label>\n' +
                    '<span class="help-block" style="display: none;"> The raw contents of the {$ file.value $}.  </span>\n ' +
                    '<div class="input">\n ' +
                      '<textarea class="switched" cols="40" ng-model="file.raw" name="{$ file.value $}_data" rows="10"></textarea>\n ' +
                    '</div>\n ' +
                '</div>\n',

            link: function (scope, element, attrs, modelCtrl, transclude)    {
                scope.modelCtrl = modelCtrl;
                scope.$transcludeFn = transclude;

            }
        };
    }]
})