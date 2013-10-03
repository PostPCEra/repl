/*
 * Repl: state_s.js
 *
 * Copyright (c) Nitrogram 2013. All rights reserved.
 *
 * @author:  spolu
 *
 * @log:
 * 20131002 spolu    Creation
 */
'use strict'

/* Repl State Service */

//
// ### _state
// Service storing code and data state
//
angular.module('repl.services').
  factory('_state', function($rootScope, $http, $timeout) {

    var def_code = '';
    def_code += '(function($, cb_) {\n';
    def_code += '  /* your code */\n';
    def_code += '  \n';
    def_code += '  return cb_($);\n';
    def_code += '});';

    var state = [{
      code: def_code,
      json: []
    }];
    var current = 0;

    return {
      initial: function() {
        return state[0];
      },
      current: function() {
        return current;
      },
      get: function(i) {
        if(typeof i === 'undefined') {
          return state;
        }
        if(i>= 0 && i < state.length) {
          return state[i];
        }
        return null;
      },
      next: function() {
        if(current < state.length - 1)
          current++;
        $rootScope.$broadcast('update');
      },
      prev: function() {
        if(current > 0)
          current--;
        $rootScope.$broadcast('update');
      },
      code: function(code) {
        state[current].code = code;
      },
      import: function(json) {
        state = [{
          code: def_code,
          json: json
        }];
        current = 0;
        $rootScope.$broadcast('update');
      },
      run: function() {

        /* HTTP Helper. */
        var _http = {
          get: function(url, cb_) {
            console.log('HTTP: ' + url);
            $timeout(function() {
              $rootScope.$apply(function() {
                $http.get('/proxy/http_get?url=' + escape(url), {
                  cache: false,
                }).success(function(data, status, headers, config) {
                  return cb_(data);
                }).error(function(data, status, headers, config) {
                  return cb_(null);
                });
              });
            });
          }
        };

        /* HTTPS Helper. */
        var _https = {
          get: function(url, cb_) {
            console.log('HTTPS: ' + url);
            $timeout(function() {
              $rootScope.$apply(function() {
                $http.get('/proxy/https_get?url=' + escape(url), {
                  cache: false,
                }).success(function(data, status, headers, config) {
                  return cb_(data);
                }).error(function(data, status, headers, config) {
                  return cb_(null);
                });
              });
            });
          }
        };

        /* Parse the code. */
        var f = eval(state[current].code);
        if(typeof f !== 'function') {
          throw new Error('returned value not a function');
        }
        /* Copy the object entirely. */
        var json = JSON.parse(JSON.stringify(state[current].json));

        /* Execute and transition. */
        $timeout(function() {
          f(json, function(json) {
            $timeout(function() {
              $rootScope.$apply(function() {
                state = state.slice(0, ++current);
                state.push({
                  code: def_code,
                  json: json
                });
              });
              $rootScope.$broadcast('update');
            });
          });
        });

      }
    };
});
