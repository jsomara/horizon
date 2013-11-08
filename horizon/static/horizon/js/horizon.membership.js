/* Namespace for core functionality related to Membership Workflow Step. */
horizon.membership = {

  current_membership: [],
  data: [],
  roles: [],
  has_roles: [],
  default_role_id: [],

  /* Parses the form field selector's ID to get either the
   * role or user id (i.e. returns "id12345" when
   * passed the selector with id: "id_group_id12345").
   **/
  get_field_id: function(id_string) {
    return id_string.slice(id_string.lastIndexOf("_") + 1);
  },

  /*
   * Gets the html select element associated with a given
   * role id.
   **/
  get_role_element: function(step_slug, role_id) {
      return $('select[id^="id_' + step_slug + '_role_' + role_id + '"]');
  },

  /*
   * Gets the html ul element associated with a given
   * data id. I.e., the member's row.
   **/
  get_member_element: function(step_slug, data_id) {
      return $('li[data-' + step_slug + '-id$=' + data_id + ']').parent();
  },

  /*
   * Initializes all of the horizon.membership lists with
   * data parsed from the hidden form fields, as well as the
   * default role id.
   **/
  init_properties: function(step_slug) {
    horizon.membership.has_roles[step_slug] = $("." + step_slug + "_membership").data('show-roles') !== "False";
    horizon.membership.default_role_id[step_slug] = $('#id_default_' + step_slug + '_role').attr('value');
    horizon.membership.init_data_list(step_slug);
    horizon.membership.init_role_list(step_slug);
    horizon.membership.init_current_membership(step_slug);
  },

  /*
   * Initializes an associative array mapping data ids to display names.
   **/
  init_data_list: function(step_slug) {
    horizon.membership.data[step_slug] = [];
    _.each($(this.get_role_element(step_slug, "")).find("option"), function (option) {
      horizon.membership.data[step_slug][option.value] = option.text;
    });
  },

  /*
   * Initializes an associative array mapping role ids to role names.
   **/
  init_role_list: function(step_slug) {
    horizon.membership.roles[step_slug] = [];
    _.each($('label[for^="id_' + step_slug + '_role_"]'), function(role) {
      var id = horizon.membership.get_field_id($(role).attr('for'));
      horizon.membership.roles[step_slug][id] = $(role).text();
    });
  },

  /*
   * Initializes an associative array of lists of the current
   * members for each available role.
   **/
  init_current_membership: function(step_slug) {
    horizon.membership.current_membership[step_slug] = [];
    var members_list = [];
    var role_name, role_id, selected_members;
    _.each(this.get_role_element(step_slug, ''), function(value, key) {
      role_id = horizon.membership.get_field_id($(value).attr('id'));
      role_name = $('label[for="id_' + step_slug + '_role_' + role_id + '"]').text();

      // get the array of members who are selected in this list
      selected_members = $(value).find("option:selected");
      // extract the member names and add them to the dictionary of lists
      members_list = [];
      if (selected_members) {
        _.each(selected_members, function(member) {
          members_list.push(member.value);
        });
      }
      horizon.membership.current_membership[step_slug][role_id] = members_list;
    });
  },

  /*
   * Returns the ids of roles the data is member of.
   **/
  get_member_roles: function(step_slug, data_id) {
    var roles = [];
    for (var role in horizon.membership.current_membership[step_slug]) {
      if ($.inArray(data_id, horizon.membership.current_membership[step_slug][role]) >= 0) {
        roles.push(role);
      }
    }
    return roles;
  },

  /*
   * Updates the selected values on the role_list's form field, as
   * well as the current_membership dictionary's list.
   **/
  update_role_lists: function(step_slug, role_id, new_list) {
    this.get_role_element(step_slug, role_id).val(new_list);
    horizon.membership.current_membership[step_slug][role_id] = new_list;
  },

  /*
   * Helper function for remove_member_from_role.
   **/
  remove_member: function(step_slug, data_id, role_id, role_list) {
    var index = role_list.indexOf(data_id);
    if (index >= 0) {
      // remove member from list
      role_list.splice(index, 1);
      horizon.membership.update_role_lists(step_slug, role_id, role_list);
    }
  },

  /*
   * Searches through the role lists and removes a given member
   * from the lists.
   **/
  remove_member_from_role: function(step_slug, data_id, role_id) {
    var role_list;
    if (role_id) {
      role_list = horizon.membership.current_membership[step_slug][role_id];
      horizon.membership.remove_member(step_slug, data_id, role_id, role_list);
    }
    else {
      // search for membership in role lists
      for (var role in horizon.membership.current_membership[step_slug]) {
        role_list = horizon.membership.current_membership[step_slug][role];
        horizon.membership.remove_member(step_slug, data_id, role, role_list);
      }
    }
  },

  /*
   * Adds a member to a given role list.
   **/
  add_member_to_role: function(step_slug, data_id, role_id) {
    var role_list = horizon.membership.current_membership[step_slug][role_id];
    role_list.push(data_id);
    horizon.membership.update_role_lists(step_slug, role_id, role_list);
  },

  init_angular: function (horizon) {
    var horizonApp = angular.module('horizonApp', [])
        .config(function($interpolateProvider) {
            $interpolateProvider.startSymbol('{$');
            $interpolateProvider.endSymbol('$}');
        });
    angular.module('horizonApp').constant('horizon', horizon);

    //compiled_temp = $compile('membership_angular.html')($scope);
    //angular.element("#membership_div").html(compiled_temp);

    horizonApp.directive('hrMembership',
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

    horizonApp.filter('searchFor', function () {
        return function (arr, searchString) {
            if (!searchString) {
                return arr;
            }
            var result = [];
            angular.forEach(arr, function (item) {
                if (item.toLowerCase().indexOf(searchString.toLowerCase()) !== -1) {
                    result.push(item);
                }
            });
            return result;
        };
    });

    horizonApp.controller('MembershipController',
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

  },

  /*
   * Calls set-up functions upon loading the workflow.
   **/
  workflow_init: function(modal, step_slug, step_id) {
    // fix the dropdown menu overflow issues
    $(".tab-content, .workflow").addClass("dropdown_fix");

    $(modal).find('form').each( function () {
        var $form = $(this);

        // Do nothing if this isn't a membership modal
        if ($form.find('div.' + step_slug + '_membership').length == 0) {
           return; // continue
        }

        // call the initalization functions
        horizon.membership.init_properties(step_slug);
        horizon.membership.generate_html(step_slug);
        horizon.membership.update_membership(step_slug);
        horizon.membership.select_member_role(step_slug);
        horizon.membership.add_new_member(step_slug);


        // initially hide role dropdowns for available member list
        $form.find(".available_" +  step_slug + " .role_options").hide();

        // hide the dropdown for members too if we don't need to show it
        if (!horizon.membership.has_roles[step_slug]) {
            $form.find("." + step_slug + "_members .role_options").hide();
        }

        // unfocus filter fields
        if (step_id.indexOf('update') ==0) {
            $form.find("#" + step_id + " input").blur();
        }

        // prevent filter inputs from submitting form on 'enter'
        $form.find('.' + step_slug + '_membership').keydown(function(event){
            if(event.keyCode == 13) {
              event.preventDefault();
              return false;
            }
          });

        // add filtering + styling to the inline obj creation btn
        horizon.membership.add_new_member_styling(step_slug);
        horizon.membership.list_filtering(step_slug);
        horizon.membership.detect_no_results(step_slug);

        // fix initial striping of rows
        $form.find('.fake_' + step_slug + '_table').each( function () {
          var filter = "." + $(this).attr('id');
          $(filter + ' .btn-group:even').addClass('dark_stripe');
          $(filter + ' .btn-group:last').addClass('last_stripe');
        });


    });

    horizon.membership.init_angular(horizon);

    modal = $('#modal_wrapper .workflow');
    if(!modal.hasClass("ng-scope")) {
        angular.bootstrap(modal, ['horizonApp']);
    }
  }
};
