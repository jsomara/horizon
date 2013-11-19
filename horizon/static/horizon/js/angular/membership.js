angular.module('horizonApp').directive('hrMembership',
[
    function() {
        return {
            restrict: 'A',
            replace: true,
            scope: { step: '=',
                     stepSlug: '=',
                     stepShowRoles: '=',
                     stepHelpText: '=',
                     stepAvailableListTitle: '=',
                     stepMembersListTitle: '=',
                     stepNoAvailableText: '=',
                     stepNoMembersText: '=' },
            templateUrl: 'membership_workflow.html',
            controller: 'MembershipController',
            link: function(scope, element, attrs) {
                scope.loadDataFromDOM(scope.stepSlug);
            }

        };
    }]);

angular.module('horizonApp').factory('MembershipFactory', function() {
    return {
        inGroup: function(group, membership) {
            var matched = false;
            angular.forEach(membership, function(m, roleId) {
                angular.forEach(m, function(groupId) {
                    if(groupId === group.id) {
                        matched = true;
                        group.roles.push(roleId);
                    }
                });
            });
            return matched;
        },

        convertRoles: function(membership_roles) {
            var roles = [];
            angular.forEach(membership_roles, function(role, roleId) {
                roles.push({ id: roleId, name: role });
            });
            return roles;
        },

        getRoleMembers: function(members, role_id) {
            var role_members = [];
            // angular.forEach redefines this
            var that = this;
            angular.forEach(members, function(member) {
                if(that.hasRole(member, role_id)) {
                    role_members.push(member.id);
                }
            });
            return role_members;
        },

        printLongList: function(member, roles) {
            var name = [];
            // angular.forEach redefines this
            var that = this;

            angular.forEach(roles, function(role) {
                if(that.hasRole(member, role.id)) {
                    if (this.length === 2){
                        this.push('...')
                        return
                    } else {
                        this.push(role.name)
                    }
                }
            },name);
            return name.join(',');
        },

        hasRole: function(member, roleId) {
            var index = member.roles.indexOf(roleId);
            return index >= 0;
        }
    }
});

angular.module('horizonApp').controller('MembershipController',
    ['$scope', 'horizon', 'MembershipFactory',
    function($scope, horizon, MembershipFactory) {

        $scope.available = [];
        $scope.members = [];

        $scope.loadDataFromDOM = function(stepSlug) {
            horizon.membership.init_properties(stepSlug);
            $scope.has_roles = horizon.membership.has_roles[stepSlug];
            $scope.default_role_id = horizon.membership.default_role_id[stepSlug];
            $scope.data_list = horizon.membership.data[stepSlug];
            $scope.all_roles = MembershipFactory.convertRoles(horizon.membership.roles[stepSlug]);
            $scope.current_membership = horizon.membership.current_membership[stepSlug];

            $scope.parseMembers($scope.data_list, $scope.current_membership);
        };

        $scope.hasRole = function(member, roleId) {
            return MembershipFactory.hasRole(member, roleId);
        };

        $scope.makeGroup = function(id, name) {
            return { id: id, name: name, roles: [] }
        };

        $scope.toggleRole = function(member, role) {
            if(MembershipFactory.hasRole(member, role.id)) {
                var index = member.roles.indexOf(role.id);
                member.roles.splice(index, 1);
                var role_members = MembershipFactory.getRoleMembers($scope.members, role.id);
                horizon.membership.update_role_lists($scope.stepSlug, role.id, role_members);
            } else {
                member.roles.push(role.id);
                var role_members = MembershipFactory.getRoleMembers($scope.members, role.id);
                horizon.membership.update_role_lists($scope.stepSlug, role.id, role_members);
            }
        }

        $scope.parseMembers = function(data, members) {
            for (var group in data) {
                g = $scope.makeGroup(group, data[group]);
                if(MembershipFactory.inGroup(g, members) === true) {
                    $scope.members.push(g);
                } else {
                    $scope.available.push(g);
                }
              }
        };

        $scope.roleShow = function(member) {
            return MembershipFactory.printLongList(member, $scope.all_roles);
        }

        $scope.addMember = function(member) {
            member.roles.push($scope.default_role_id);
            $scope.members.push(member);
            var index = $scope.available.indexOf(member);
            $scope.available.splice(index, 1);

            var role_members = MembershipFactory.getRoleMembers($scope.members, $scope.default_role_id);
            horizon.membership.update_role_lists($scope.stepSlug, $scope.default_role_id, role_members);
        };

        $scope.removeMember = function(member) {
            member.roles = [];
            $scope.available.push(member);
            var index = $scope.members.indexOf(member);
            $scope.members.splice(index, 1);

            horizon.membership.remove_member_from_role($scope.stepSlug, member.id);
        }

    }]);
