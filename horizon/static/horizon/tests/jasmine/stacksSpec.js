/*global describe, it, expect, jasmine, beforeEach, afterEach, spyOn, angular*/
describe('controllers', function () {
  'use strict';

  beforeEach(module('hz'));

  describe('ModalLaunchStackController', function () {
    var $scope, HeatFileService, hzMessages, $controller;

    beforeEach(inject(function($injector) {
        $scope = $injector.get('$rootScope').$new();
        $controller = $injector.get('$controller');
        HeatFileService = $injector.get('HeatFileService');
        hzMessages = $injector.get('hzMessages');
        //hzMessages = {};

        $controller('ModalLaunchStackCtrl', {
            $scope: $scope,
            HeatFileService: HeatFileService,
            hzMessages: hzMessages,
            $modalInstance: {},
            $timeout: {},
            response: {},
            ParameterService: {},
            ReferenceService: {},
            StackLaunch: {}
        });
    }));

    it("Should instantiate controller", function () {
        expect($scope.tabs[1].active).toBe(false);
    });

    it("Should include template & environment base files", function () {
        expect($scope.launchStack.baseFiles.length).toBe(2);
        expect($scope.launchStack.baseFiles[0].label).toBe('Template');
        expect($scope.launchStack.baseFiles[1].label).toBe('Environment');
    });

    it("Gets file contents when source is raw", function () {
        var file = { source: 'raw', raw: 'rawtest'};
        expect(HeatFileService.getFileData(file)).toBe('rawtest');
    });

    it("Gets file contents when source is upload", function () {
        var file = { source: 'file', upload: [ { data: 'datatest' }]};
        expect(HeatFileService.getFileData(file)).toBe('datatest');
    });

    it("Makefiles loads the files correctly", function () {
        var fileOne, fileTwo, files;
        fileOne = { source: 'raw', raw: 'rawtest', value: 'fone.yaml'};
        fileTwo = { source: 'file', upload: [ { data: 'datatest' }], value: 'ftwo.yaml'};

        files = HeatFileService.makeFiles([fileOne, fileTwo]);

        expect(files['fone.yaml']).toBe('rawtest');
        expect(files['ftwo.yaml']).toBe('datatest');
    });

  });
});
