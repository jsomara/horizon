/**
 * Created by jomara on 6/19/14.
 */
angular.module('hz').directive({
    heatDataUpload: [function () {

        return {
            restrict: 'A',
            scope: {
                file: '='
            },
            controller: ['$scope', function ($scope) {

                $scope.templateSource = 'raw';

                $scope.sourceOptions = [
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
                    /* alternative way of uploading, send the file binary with the file's content-type.
                     Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
                     It could also be used to monitor the progress of a normal http post/put request with large data*/
                    // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
                 };
            }],
            templateUrl:  'heatFileSwitch.html',
            link: function (scope, element, attrs)    {

            }
        };
    }]
});
