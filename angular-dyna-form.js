angular.module('dynaForm', [])

  .directive('formGroup', function(appSetting, errorMessages) {
    return {
      restrict: 'E',
      transclude: true,
      template: function(element, attrs) {
        if (attrs.inline === undefined && attrs.label === undefined && attrs.offset === undefined) {
          return '\
            <div class="form-group">\
              <div ng-transclude></div>\
            </div>\
          ';
        } else if (attrs.inline === undefined) {
          return '\
            <div class="form-group">\
              <label ng-bind-html="label | html"></label>\
              <div class="row">\
                <div class="{{inputClass || \'col-12\'}}">\
                  <div ng-transclude="ng-transclude"></div>\
                </div>\
              </div>\
            </div>\
          ';
        } else {
          return '\
            <div class="form-group row" ng-class="{\'has-danger\': $field.$invalid && ($field.$dirty || $field.$$parentForm.$submitted)}">\
              <label ng-if="label != undefined" class="{{labelClass || labelClassDefault}} col-form-label"><span ng-bind-html="label | html"></span></label>\
              <div class="{{inputClass || inputClassDefault}}">\
                <div ng-transclude="ng-transclude"></div>\
              </div>\
            </div>\
          ';
        }
      },
      replace: true,
      scope: {
        label: '@',
        offset: '@',
        labelClass: '@',
        inputClass: '@',
        errorMessages: '='
      },
      controller: function($scope, $element, $attrs) {
        $scope.$appSetting = angular.extend(appSetting);
        $scope.$errorMessages = angular.copy($scope.errorMessages) || {};
        $scope.$errorMessages = angular.extend(angular.copy(errorMessages), $scope.$errorMessages);

        $scope.labelClassDefault = $element.parent('form').attr('label-class') || $scope.$appSetting.labelClass;
        $scope.inputClassDefault = $element.parent('form').attr('input-class') || $scope.$appSetting.inputClass;

        this.setField = function(field) {
          $scope.$field = field;
        }
      }
    }
  })

  .directive('formControl', function() {
    return {
      require: ['ngModel', '^formGroup'],
      link: function($scope, $element, $attrs, $ctrls) {
        $ctrls[1].setField($ctrls[0]);
        $element.addClass('form-control');
      }
    }
  })

  .directive('buttonDirective', function($rootScope, $timeout, $window, errorMessages, services) {
    return {
      require: ['^form'],
      restrict: 'E',
      transclude: true,
      template: '\
        <span ng-repeat="btn in scope.$btn">\
          <button type="{{btn.type}}" class="btn {{btn.class || (btn.type == \'delete\' ? \'btn-danger\' : \'btn-primary\')}}" ng-disabled="scope.$submit" ng-click="onClick({data: syncdata($index)})">\
            <i class="fa" ng-class="btn.icon"></i> {{btn.text}}\
          </button>\
        </span>\
        <span ng-transclude="ng-transclude"></span>\
        <p class="text-danger" ng-if="$error">{{error}}</p>\
        <p class="mt-4"><span class="alert alert-danger" role="alert" ng-if="$form.$submitted && $form.$invalid">{{$errorMessages[\'formError\']}}</span></p>\
      ',
      scope: {
        scope: '=',
        onClick: '&',
        errorMessages: '='
      },
      link: function($scope, $element, $attrs, $ctrls) {
        $scope.$form = $ctrls[0];
        $scope.$errorMessages = angular.extend(angular.copy(errorMessages), $scope.$errorMessages);

        $scope.syncdata = function(index) {
          $scope.data = $scope.scope.$btn[index];
          $scope.data.$form = $ctrls[0];
          $scope.data.source = $attrs.scope;
          return $scope.data;
        }
      }
    }
  })

  .directive('uploadFile', function($routeParams, $http, $httpParamSerializerJQLike, $timeout, services) {
    return {
      restrict: 'E',
      require: 'ngModel',
      replace: true,
      transclude: true,
      template: '<div ng-transclude="ng-transclude"></div>',
      link: function($scope, $element, $attrs, $models) {
        $element.bind('change', function() {
          var formData = new FormData();
          var id = $routeParams.id ? '=' + $routeParams.id : '';
          formData.append('id', $attrs.id);
          formData.append('file', $element[0].querySelector('[type="file"]').files[0]);

          services.upload('?' + $routeParams.module + id, formData).then(function(response) {
            $element[0].querySelector('[type="file"]').value = '';
            if (response.error) {
              $scope.error = response.error;
            } else {
              $models.$setViewValue(response);
              $models.$render();
            }
          });
        });
      }
    }
  })