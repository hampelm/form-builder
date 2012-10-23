/*jslint nomen: true */
/*globals define: true */

/* 
 * Basic app functionality for the mobile survey. 
 */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('underscore');

  var settings = require('settings');
  var api = require('api');
  var Builder = require('builder');

  var app = {
    preview: {},

    init: function() {
      api.getSurveys(function(data) {
        console.log(data);
        $("#select-survey").html(_.template($('#select-survey-template').html(), {surveys: data}));

        $("#select-survey select").change(function() {
          settings.surveyId = $(this).val();

          app.builder = new Builder(app);
          console.log(app.builder);
          app.builder.init();
        })
      });
    }
  };

  return app;
});