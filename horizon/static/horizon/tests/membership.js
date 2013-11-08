var ctrl, ctrlScope, injector, horizonMock;

module("angular membership", {
    setup: function () {
        horizon.membership.init_angular('test_slug');
        var appModule = angular.module('horizonApp');
        injector = angular.injector(['ng', 'horizonApp']);

        //horizonMock = injector.get('horizon')

        ctrlScope = injector.get('$rootScope').$new();
        ctrl = injector.get('$controller')('MembershipController', { $scope: ctrlScope, horizon: horizon });
    },
    teardown: function () {

    }
});

test("Should instantiate controller", function () {
    ctrlScope.loadDataFromDOM('test_slug');
    ok( ctrlScope.available.length === ctrlScope.members.length, "PASS");
});

/*
horizon.addInitFunction(function () {

    module(
    this.$scope = injector.get('$rootScope').$new();

    module("Membership (horizon.membership.js)", init);

    bs = $('#bootstrap_me');
    angular.bootstrap(bs, ['horizonApp']);

    test( "hello test", function() {
      ok( 1 === 1, "Passed!" );
    });
    // tests


    // module('tests', init);

    // test('MembershipController', function() {
    //     var $controller = injector.get('$controller');
    //     $controller('MembershipController', {
    //         $scope: this.$scope
    //     });
    //     // equal(10, this.$scope.available.length);
    //     ok( 1 === 1, "Passed!" );
    // });

    // test('MyService', function() {
    //     var MyService = injector.get('MyService');
    //     equal(4, MyService.addThree(1));
    // });

    // test('MyDirective', function() {
    //     var $compile = injector.get('$compile');
    //     var element = $compile('<div my-directive="foo"></div>')(this.$scope);
    //     this.$scope.foo = 1;
    //     this.$scope.$apply();
    //     equal(5, element.text());
    //     delete this.$scope.foo;
    // });

    // test('MyFilter', function() {
    //     var $filter = injector.get('$filter');
    //     equal(6, $filter('myfilter')(1));
    // });
});

*/
