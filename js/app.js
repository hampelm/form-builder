/*jslint nomen: true */
/*globals define: true */

/* 
 * Basic app functionality for the mobile survey. 
 */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('underscore');
  var moment = require('moment');

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

          // Handle saving the survey
          $('.save').click(function() {
            console.log("Save clicked");
            var key;
            var formsEndpoint = api.getSurveyURL() + '/forms';

            // Delete data from the old object to save a new version
            delete settings.formData.created;
            delete settings.formData._id;
            delete settings.formData.id;


            // Set mobile form type
            settings.formData.type = "mobile";

            console.log("Data being posted: ", settings.formData);

            var jqxhr = $.post(formsEndpoint, { "forms": [ settings.formData ] }, function() {
              console.log("Form successfully posted");
            },"text").error(function(){ 
              var key;
              var result = "";
              for (key in jqxhr) {
                result += key + ": " + jqxhr[key] + "\n";
              }
              console.log("error: " + result);
            }).success(function(){
              console.log("Success!");
              $("#last-save").html("Last saved " + moment().format('h:mm:ss a [on] MMMM Do YYYY'));
            });

          }); // Done handling save

        })
      }); 
    }
  };

  return app;
});