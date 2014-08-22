var ctrl, ctrlScope, injector, factory, timeout, modalInstance, response, ParameterService, ReferenceService,
    StackLaunch, hzMessages, HeatFileService;

module("angular stacks", {
    setup: function () {
        var appModule = angular.module('hz');
        injector = angular.injector(
            [   'ng',
                'hz.conf',
                'hz.utils.hzUtils',
                'hz.messages',
                'hz'
              ]);

        hzUtils = injector.get('hzUtils');
        ctrlScope = injector.get('$rootScope').$new();
        timeout = injector.get('$modalInstance');
        modalInstance = injector.get('$modalInstance');
        response = injector.get('response');
        ParameterService = injector.get('ParameterService');
        ReferenceService = injector.get('ReferenceService');
        StackLaunch = injector.got('StackLaunch');
        hzMessages = injector.get('hzMessages');
        HeatFileService = injector.get('HeatFileService');

        ctrl = injector.get('$controller')('ModalLaunchStackController', {
            $scope: ctrlScope,
            $modalInstance: modalInstance,
            $timeout: timeout,
            response: response,
            ParameterService: ParameterService,
            ReferenceService: ReferenceService,
            StackLaunch: StackLaunch,
            hzMessages: hzMessages,
            HeatFileService: HeatFileService
        });
    },
    teardown: function () {

    }
});

test("Should instantiate controller", function () {
    ok(ctrlScope.tabs[1].active === false);
});

test("Should include template & environment base files", function () {
    ok(ctrlScope.launchStack.baseFiles.length === 2);
    ok(ctrlScope.launchStack.baseFiles[0].label === 'Template');
    ok(ctrlScope.launchStack.baseFiles[1].label === 'Environment');
});

test("Gets file contents when source is raw", function () {
    var file = { source: 'raw', raw: 'rawtest'};
    ok(HeatFileService.getFileData(file) === 'rawtest');
});

test("Gets file contents when source is upload", function () {
    var file = { source: 'file', upload: [ { data: 'datatest' }]};
    ok(HeatFileService.getFileData(file) === 'datatest');
});

test("Makefiles loads the files correctly", function () {
    var fileOne, fileTwo, files;
    fileOne = { source: 'raw', raw: 'rawtest', value: 'fone.yaml'};
    fileTwo = { source: 'file', upload: [ { data: 'datatest' }], value: 'ftwo.yaml'};

    var files = HeatFileService.makeFiles([fileOne, fileTwo]);

    ok(files['fone.yaml'] === 'rawtest');
    ok(files['ftwo.yaml'] === 'datatest');
});

