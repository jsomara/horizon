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
            controller: 'MembershipController'
        };
    }]);

angular.module('horizonApp').controller('MembershipController',
    ['$scope', 'horizon',
    function($scope, horizon) {

        $scope.available = [];
        $scope.members = [];

        $scope.loadDataFromDOM = function(stepSlug) {
            horizon.membership.init_properties(stepSlug);
            $scope.has_roles = horizon.membership.has_roles[stepSlug];
            $scope.default_role_id = horizon.membership.default_role_id[stepSlug];
            $scope.data_list = horizon.membership.data[stepSlug];
            $scope.all_roles = $scope.convertRoles(horizon.membership.roles[stepSlug]);
            $scope.current_membership = horizon.membership.current_membership[stepSlug];

            $scope.parseMembers($scope.data_list, $scope.current_membership);

        };

        $scope.inGroup = function(group, membership) {
            var matched = false;
            for (var roleId in membership) {
                if(membership.hasOwnProperty(roleId)) {
                    angular.forEach(membership[roleId], function(groupId) {
                        if(groupId === group.id) {
                          matched = true;
                          group.roles.push(roleId);
                        }
                    });
                }
            }
            return matched;
        };

        $scope.convertRoles = function(membership_roles) {
            var roles = [];
            for (var key in membership_roles) {
                if(membership_roles.hasOwnProperty(key)) {
                    roles.push({ id: key, name: membership_roles[key] });
                }
            };
            return roles;
        }

        $scope.hasRole = function(member, roleId) {
            var index = member.roles.indexOf(roleId);
            return index >= 0;
        };

        $scope.makeGroup = function(id, name) {
            return { id: id, name: name, roles: [] }
        };

        $scope.toggleRole = function(member, role) {
            if($scope.hasRole(member, role.id)) {
                var index = member.roles.indexOf(role.id);
                member.roles.splice(index, 1);
                var role_members = getRoleMembers($scope.members, role.id);
                horizon.membership.update_role_lists($scope.stepSlug, role.id, role_members);
            } else {
                member.roles.push(role.id);
                var role_members = getRoleMembers($scope.members, role.id);
                horizon.membership.update_role_lists($scope.stepSlug, role.id, role_members);
            }
        }

        function getRoleMembers(members, role_id) {
            var role_members = [];
            angular.forEach(members, function(member) {
                if($scope.hasRole(member, role_id)) {
                    role_members.push(member.id);
                }
            });
            return role_members;
        }

        $scope.parseMembers = function(data, members) {
            for (var group in data) {
                g = $scope.makeGroup(group, data[group]);
                if($scope.inGroup(g, members) === true) {
                    $scope.members.push(g);
                } else {
                    $scope.available.push(g);
                }
              }
        };

        // extract to factory
        $scope.roleShow = function(member) {
            var name = "";
            var count = 0;
            angular.forEach($scope.all_roles, function(role) {
                if($scope.hasRole(member, role.id)) {
                    if(count < 2) {
                        if(count > 0) {
                            name += ", "
                        }
                        name += role.name;
                    } else if(count === 2) {
                      name += ", ..."
                    }
                    count++;
                }
            });
            return name;
        }

        $scope.loadDataFromDOM($scope.stepSlug);

        $scope.addMember = function(member) {
            member.roles.push($scope.default_role_id);
            $scope.members.push(member);
            var index = $scope.available.indexOf(member);
            $scope.available.splice(index, 1);

            var role_members = getRoleMembers($scope.members, $scope.default_role_id);
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
