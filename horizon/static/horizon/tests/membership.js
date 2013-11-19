var ctrl, ctrlScope, injector, horizonMock;

module("angular membership", {
    setup: function () {
        var appModule = angular.module('horizonApp');
        injector = angular.injector(['ng', 'horizonApp']);

        ctrlScope = injector.get('$rootScope').$new();
        factory = injector.get('MembershipFactory');
        ctrl = injector.get('$controller')('MembershipController', { $scope: ctrlScope, horizon: horizon, MembershipFactory: factory });
    },
    teardown: function () {

    }
});

test("Should instantiate controller", function () {
    ctrlScope.loadDataFromDOM('test_slug');
    ok(ctrlScope.available.length === ctrlScope.members.length, "Controller loaded");
});

test("Ingroup is in group", function() {
    var membership, group;
    membership = { role_1: ['1','2'] };
    group = { id: '1', name: 'group', roles: [] };
    ok(factory.inGroup(group, membership), "Group is in Membership");
    ok(group.roles.length === 1, 'Group roles OK');
});

test("Ingroup is not in group", function() {
    var membership, group;
    membership = { role_1: ['1','2'] };
    group = { id: '3', name: 'group', roles: [] };
    ok(!factory.inGroup(group, membership), "Group is not in membership");
    ok(group.roles.length === 0, 'Group roles OK');
});

test("Convert roles loads roles", function() {
    var roles = { 1234: 'role_test' };
    var converted = factory.convertRoles(roles);
    ok(converted.length === 1, "Roles list correct size");
    ok(converted[0].id === '1234', "Roles munged OK");
});

test("HasRole correctly identifies role", function() {
    member = { id: 1234, name: 'member', roles: ['1'] };
    ok(factory.hasRole(member, '1'), "Roles identified");
});

test("HasRole correctly identifies role, negative", function() {
    member = { id: 1234, name: 'member', roles: ['2'] };
    ok(!factory.hasRole(member, '1'), "Roles identified");
});

test("make group has correct id", function() {
    ok(ctrlScope.makeGroup('5', 'member').name === 'member', "Make group sets name correctly");
    ok(ctrlScope.makeGroup('5', 'member').id === '5', "Make group sets id correctly");
});

test("Role show prints roles correctly", function() {
    var roles = { 1: "role1", 2: "role2" }
    var croles = factory.convertRoles(roles);
    ctrlScope.all_roles = croles;
    var member = { id: 1, name: 'member', roles: [ '1', '2'] }
    var str = ctrlScope.roleShow(member);
    ok(str.indexOf('role1') >= 0, 'Show Role contains role names');
    ok(str.indexOf('role2') >= 0, 'Show Role contains role names');
});

test("Add member adds member", function() {
    var roles = { 1: "role1", 2: "role2" }
    var croles = factory.convertRoles(roles);
    ctrlScope.all_roles = croles;
    var member = { id: 1, name: 'member', roles: [] }
    ctrlScope.available.push(member);
    ctrlScope.stepSlug = 'testslug';
    ctrlScope.loadDataFromDOM('testslug');
    ctrlScope.default_role_id = '1'

    ctrlScope.addMember(member);
    ok(ctrlScope.available.length === 0, 'Available pool reduced');
    ok(ctrlScope.members.length === 1, 'Members pool increased');
    ok(ctrlScope.members[0].roles[0] === '1', 'Default role assigned');
});

test("Remove member adds member", function() {
    var roles = { 1: "role1", 2: "role2" }
    var croles = factory.convertRoles(roles);
    ctrlScope.all_roles = croles;
    var member = { id: 1, name: 'member', roles: [] }
    ctrlScope.members.push(member);
    ctrlScope.default_role_id = '1'

    ctrlScope.removeMember(member);
    ok(ctrlScope.members.length === 0, 'Available pool reduced');
    ok(ctrlScope.available.length === 1, 'Members pool increased');
});

