angular.module('hz').directive('hrMembership',
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
    })
.factory('MembershipFactory', function() {
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
            angular.forEach(members, function(member) {
                if(this.hasRole(member, role_id)) {
                    role_members.push(member.id);
                }
            }, this);
            return role_members;
        },

        printLongList: function(member, roles) {
            var name = [];
            angular.forEach(roles, function(role) {
                if(this.hasRole(member, role.id)) {
                    if (name.length === 2){
                        name.push('...');
                        return
                    } else {
                        name.push(role.name);
                    }
                }
            },this);
            return name.join(',');
        },

        hasRole: function(member, roleId) {
            return (member.roles.indexOf(roleId) >= 0);
        }
    }
})
.controller('MembershipController',
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

        $scope.toggleRole = function(member, role_id) {
            var role_members;
            if(MembershipFactory.hasRole(member, role_id)) {
                member.roles.splice(member.roles.indexOf(role_id), 1);
            } else {
                member.roles.push(role_id);
            }
            role_members = MembershipFactory.getRoleMembers($scope.members, role_id);
            horizon.membership.update_role_lists($scope.stepSlug, role_id, role_members);
        };

        $scope.parseMembers = function(data, members) {
            angular.forEach(data, function(group_data, group) {
                var g = $scope.makeGroup(group, group_data);
                MembershipFactory.inGroup(g, members)? $scope.members.push(g): $scope.available.push(g);
            });
        };

        $scope.roleShow = function(member) {
            return MembershipFactory.printLongList(member, $scope.all_roles);
        }

        $scope.addMember = function(member, default_role_id) {
            var index, role_members;
            member.roles.push(default_role_id);
            $scope.members.push(member);
            index = $scope.available.indexOf(member);
            $scope.available.splice(index, 1);

            role_members = MembershipFactory.getRoleMembers($scope.members, default_role_id);
            horizon.membership.update_role_lists($scope.stepSlug, default_role_id, role_members);
        };

        $scope.removeMember = function(member) {
            var index;
            member.roles = [];
            $scope.available.push(member);
            index = $scope.members.indexOf(member);
            $scope.members.splice(index, 1);

            horizon.membership.remove_member_from_role($scope.stepSlug, member.id);
        }

    }]);
