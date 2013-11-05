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
      console.log('Found ourselves an option:' + option.text);
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

  update_member_role_dropdown: function(step_slug, data_id, role_ids, member_el) {
    if (typeof(role_ids) === 'undefined') {
        role_ids = horizon.membership.get_member_roles(step_slug, data_id);
    }
    if (typeof(member_el) === 'undefined') {
        member_el = horizon.membership.get_member_element(step_slug, data_id);
    }

    var $dropdown = member_el.find("li.member").siblings('.dropdown');
    var $role_items = $dropdown.children('.role_dropdown').children('li');

    $role_items.each(function (idx, el) {
      if (_.contains(role_ids, $(el).data('role-id'))) {
        $(el).addClass('selected');
      } else {
        $(el).removeClass('selected');
      }
    });

    // set the selection back to default role
    var $roles_display = $dropdown.children('.dropdown-toggle').children('.roles_display');
    var roles_to_display = [];
    for (var i = 0; i < role_ids.length; i++) {
        if (i == 2) {
            roles_to_display.push('...');
            break;
        }
        roles_to_display.push(horizon.membership.roles[step_slug][role_ids[i]]);
    }
    text = roles_to_display.join(', ');
    if (text.length == 0) text = gettext('No roles');
    $roles_display.text(text);
  },

  /*
   * Generates the HTML structure for a member that will be displayed
   * as a list item in the member list.
   **/
  generate_member_element: function(step_slug, display_name, data_id, role_ids, text) {
    var str_id = "id_" + step_slug + "_" + data_id;

    var roles = [];
    for (var r in horizon.membership.roles[step_slug]) {
      var role = {};
      role['role_id'] = r;
      role['role_name'] = horizon.membership.roles[step_slug][r];
      roles.push(role);
    }

    var template = horizon.templates.compiled_templates["#membership_template"],
    params = {data_id: str_id,
              step_slug: step_slug,
              default_role: horizon.membership.roles[horizon.membership.default_role_id[step_slug]],
              display_name: display_name,
              text: text,
              roles: roles},
    member_el = $(template.render(params));
    this.update_member_role_dropdown(step_slug, str_id, role_ids, member_el);
    return $(member_el);
  },

  /*
  * Generates the HTML structure for the membership UI.
  **/
  generate_html: function(step_slug) {
    var data;

    for (data in horizon.membership.data[step_slug]) {
      console.log("Data");
      console.log(data);
      var data_id = data;
      var display_name = horizon.membership.data[step_slug][data_id];
      var role_ids = this.get_member_roles(step_slug, data_id);
      if (role_ids.length > 0) {
        $("." + step_slug + "_members").append(this.generate_member_element(step_slug, display_name, data_id, role_ids, "-"));
      }
      else {
        $(".available_" + step_slug).append(this.generate_member_element(step_slug, display_name, data_id, role_ids, "+"));
      }
    }
    horizon.membership.detect_no_results(step_slug);
  },

  /*
   * Triggers on click of link to add/remove membership association.
   **/
   update_membership: function(step_slug) {
     $(".available_" + step_slug + ", ." + step_slug + "_members").on('click', ".btn-group a[href='#add_remove']", function (evt) {
       evt.preventDefault();
       var available = $(".available_" + step_slug).has($(this)).length;
       var data_id = horizon.membership.get_field_id($(this).parent().siblings().attr('data-' + step_slug +  '-id'));
       var member_el = $(this).parent().parent();

       if (available) {
         var default_role = horizon.membership.default_role_id[step_slug];
         $(this).text("-");
         $("." + step_slug + "_members").append(member_el);
         horizon.membership.add_member_to_role(step_slug, data_id, default_role);

         if (horizon.membership.has_roles[step_slug]) {
           $(this).parent().siblings(".role_options").show();
           horizon.membership.update_member_role_dropdown(step_slug, data_id, [default_role], member_el);
         }
       }
       else {
         $(this).text("+");
         $(this).parent().siblings(".role_options").hide();
         $(".available_" + step_slug).append(member_el);
         horizon.membership.remove_member_from_role(step_slug, data_id);
       }

       // update lists
       horizon.membership.list_filtering(step_slug);
       horizon.membership.detect_no_results(step_slug);

       // remove input filters
       $("input." + step_slug + "_filter").val("");
     });
   },

  /*
   * Detects whether each list has members and if it does not
   * displays a message to the user.
   **/
  detect_no_results: function (step_slug) {
    $('.' + step_slug +  '_filterable').each( function () {
      var css_class = $(this).find('ul').attr('class');
      // Example value: members step_slug_members
      // Pick the class name that contains the step_slug
      var filter = _.find(css_class.split(' '), function(val){ return val.indexOf(step_slug) != -1; });

      if (!$('.' + filter).children('ul').length) {
        $('#no_' + filter).show();
        $("input[id='" + filter + "']").attr('disabled', 'disabled');
      }
      else {
        $('#no_' + filter).hide();
        $("input[id='" + filter + "']").removeAttr('disabled');
      }
    });
  },

  /*
   * Triggers on selection of new role for a member.
   **/
  select_member_role: function(step_slug) {
    $(".available_" + step_slug + ", ." + step_slug + "_members").on('click', '.role_dropdown li', function (evt) {
      evt.preventDefault();
      evt.stopPropagation();

      // get the newly selected role and the member's name
      var new_role_id = $(this).attr("data-role-id");
      var id_str = $(this).parent().parent().siblings(".member").attr("data-" + step_slug + "-id");
      var data_id = horizon.membership.get_field_id(id_str);
      // update role lists
      if ($(this).hasClass('selected')) {
        $(this).removeClass('selected');
        horizon.membership.remove_member_from_role(step_slug, data_id, new_role_id);
      } else {
        $(this).addClass('selected');
        horizon.membership.add_member_to_role(step_slug, data_id, new_role_id);
      }
      horizon.membership.update_member_role_dropdown(step_slug, data_id);
    });
  },

  /*
   * Triggers on the addition of a new member via the inline object creation field.
   **/
  add_new_member: function(step_slug) {
    $("select[id='id_new_" + step_slug + "']").on('change', function (evt) {
      // add the member to the visible list
      var display_name = $(this).find("option").text();
      var data_id = $(this).find("option").attr("value");
      var default_role_id = horizon.membership.default_role_id[step_slug];
      $("." + step_slug + "_members").append(horizon.membership.generate_member_element(step_slug, display_name, data_id, [default_role_id], "-"));

      // add the member to the hidden role lists and the data list
      horizon.membership.data[step_slug][data_id] = display_name;
      $("select[multiple='multiple']").append("<option value='" + data_id + "'>" + horizon.membership.data[step_slug][data_id] + "</option>");
      horizon.membership.add_member_to_role(step_slug, data_id, default_role_id);

      // remove option from hidden select
      $(this).text("");

      // reset lists and input filters
      horizon.membership.list_filtering(step_slug);
      horizon.membership.detect_no_results(step_slug);
      $("input.filter").val("");

      // fix styling
      $("." +  step_slug + "_members .btn-group").removeClass('last_stripe');
      $("." +  step_slug + "_members .btn-group:last").addClass('last_stripe');
    });
  },

  /*
   * Style the inline object creation button, hide the associated field.
   **/
  add_new_member_styling: function(step_slug) {
    var add_member_el = $("label[for='id_new_" + step_slug + "']").parent();
    $(add_member_el).find("select").hide();
    $("#add_" + step_slug).append($(add_member_el));
    $(add_member_el).addClass("add_" + step_slug);
    $(add_member_el).find("label, .input").addClass("add_" + step_slug + "_btn");
  },

  /*
  * Fixes the striping of the fake table upon modification of the lists.
  **/
  fix_stripes: function(step_slug) {
    $('.fake_' + step_slug + '_table').each( function () {
      var filter = "." + $(this).attr('id');
      var visible = " .btn-group:visible";
      var even = " .btn-group:visible:even";
      var last = " .btn-group:visible:last";

      // fix striping of rows
      $(filter + visible).removeClass('dark_stripe');
      $(filter + visible).addClass('light_stripe');
      $(filter + even).removeClass('light_stripe');
      $(filter + even).addClass('dark_stripe');

      // fix bottom border of new last element
      $(filter + visible).removeClass('last_stripe');
      $(filter + last).addClass('last_stripe');
    });
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
                console.log('init properties');
                horizon.membership.init_properties(stepSlug);
                $scope.has_roles = horizon.membership.has_roles[stepSlug];
                $scope.default_role_id = horizon.membership.default_role_id[stepSlug];
                $scope.data_list = horizon.membership.data[stepSlug];
                $scope.all_roles = $scope.convertRoles(horizon.membership.roles[stepSlug]);
                $scope.current_membership = horizon.membership.current_membership[stepSlug];

                console.log("Current membership:");
                console.log($scope.current_membership);
                console.log("default role id");
                console.log($scope.default_role_id);
                console.log("data");
                console.log($scope.data_list);
                console.log("all_roles");
                console.log($scope.all_roles);
                console.log("has roles");
                console.log($scope.has_roles);

                console.log("Loading current membership");
                $scope.parseMembers($scope.data_list, $scope.current_membership);
                console.log("Members:");
                console.log($scope.members);
                console.log("Available:");
                console.log($scope.available);

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
                } else {
                    member.roles.push(role.id);
                }
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

            $scope.roleShow = function(member) {
                var name = "";
                var count = 0;
                angular.forEach($scope.all_roles, function(role) {
                    if(member.roles.indexOf(role.id) >= 0) {
                        if(count > 0) {
                            name += ", "
                        }
                        name += role.name;
                        count++;
                    }
                });
                return name;
            }

            $scope.loadDataFromDOM($scope.stepSlug);

            $scope.addMember = function(member) {
                console.log("Adding member:");
                console.log(member);

                member.roles.push($scope.default_role_id);
                $scope.members.push(member);
                var index = $scope.available.indexOf(member);
                $scope.available.splice(index, 1);
            };

            $scope.removeMember = function(member) {
                console.log("Removing member:");
                console.log(member);

                member.roles = [];
                $scope.available.push(member);
                var index = $scope.members.indexOf(member);
                $scope.members.splice(index, 1);
            }

        }]);

  },

  /*
   * Calls set-up functions upon loading the workflow.
   **/
  workflow_init: function(modal, step_slug, step_id) {
    console.log("Loaded jquery workflow init");
    console.log("Modal");
    console.log(modal);
    console.log("Step slug");
    console.log(step_slug);
    console.log("step_id");
    console.log(step_id);
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
    angular.bootstrap(document, ['horizonApp']);

  }
};
