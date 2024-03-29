/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('underscore');

  var api = require('api');
  var settings = require('settings');

  return function (app, formContainerId) {
    var form = $(formContainerId + ' form');
    var formQuestions = $('#questions'); 
    var repeatCounter = {};

    this.init = function(){
      console.log("Initialize form");

      // Listen for objectedSelected, triggered when items on the map are tapped
      // $.subscribe("objectSelected", setSelectedObjectInfo);  

      // Render the form 

      // CHANGE NOTE
      // Change for the editor: we don't want to get the form from the API
      // api.getForm(renderForm);
      formQuestions.html('');
      renderForm();


      // Add a function to serialize the form for submission to the API
      // usage: form.serializeObject();
      form.serializeObject = function() {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function() {
          if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
              o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
          } else {
            o[this.name] = this.value || '';
          }
        });
        return o;
      };
    };

    // Update the form with information about the selected object.
    // Then, display the form.
    var setSelectedObjectInfo = function(e) {
      console.log("Showing the form");
      var $addressDOM = $('h2 .parcel_id');

      $addressDOM.fadeOut(400, function() {
        $addressDOM.text(app.selectedObject.humanReadableName.titleCase());
        $addressDOM.fadeIn(400);
      });

      if(!$('#form').is(":visible")) {
        $('#form').slideToggle();
      }
      if($('#startpoint').is(":visible")) {
        $('#startpoint').hide();
      }
      if($('#thanks').is(":visible")) {
        $('#thanks').slideToggle();
      }
    };


    // Form submission .........................................................

    // Handle the parcel survey form being submitted
    form.submit(function(event) {
      console.log("Submitting survey results");

      // Stop form from submitting normally
      event.preventDefault(); 

      var url = api.getSurveyURL() + form.attr('action'); 

      // Serialize the form
      var serialized = form.serializeObject();

      // Get some info about the centroid as floats. 
      var selectedCentroid = app.selectedObject.centroid;
      console.log(selectedCentroid);
      var centroidLat = parseFloat(selectedCentroid.coordinates[0]);
      var centroidLng = parseFloat(selectedCentroid.coordinates[1]);

      console.log("Selected object ID");
      console.log(app.selectedObject.id);

      // Construct a response in the format we need it.  
      var responses = {responses: [{
        "source": {
          "type":"mobile", 
          "collector":app.collectorName
        }, 
        "geo_info": {
          "centroid":[centroidLng, centroidLat], 
          "geometry": app.selectedObject.geometry,
          "humanReadableName": app.selectedObject.humanReadableName, 
          parcel_id: app.selectedObject.id // Soon to be deprecated
        }, 
        "parcel_id": app.selectedObject.id, // Soon to be deprecated
        "object_id": app.selectedObject.id, // Replaces parcel_id
        "responses": serialized
      }]};

      console.log("Serialized & responses:");
      console.log(serialized);
      console.log(responses);
      console.log(url);

      // Post the form
      // TODO: This will need to use Prashant's browser-safe POSTing
      var jqxhr = $.post(url, responses, function() {
        console.log("Form successfully posted");
      },"text").error(function(){ 
        var key;
        var result = "";
        for (key in jqxhr) {
          result += key + ": " + jqxhr[key] + "\n";
        }
        console.log("error: " + result);
      }).success(function(){
        successfulSubmit();
      });
    });

    // Clear the form and thank the user after a successful submission
    // TODO: pass in selected_parcel_json
    function successfulSubmit() {
      console.log("Successful submit");

      // Publish  a "form submitted" event
      $.publish("successfulSubmit");

      // Hide the form and show the thanks
      $('#form').slideToggle();
      $('#thanks').slideToggle();

      if($('#address-search-prompt').is(":hidden")) {
        $('#address-search-prompt').slideToggle();
      }
      if($('#address-search').is(":visible")) {
        $('#address-search').slideToggle();
      }

      // Reset the form for the next submission.
      resetForm();
    }

    // Reset the form: clear checkboxes, remove added option groups, hide 
    // sub options.
    function resetForm() {
      console.log("Resetting form");

      // Clear all checkboxes and radio buttons
      $('input:checkbox').each(function(index){
        var $this = $(this);
        if ($this.attr('checked')) {
          $this.attr('checked', false).checkboxradio('refresh');
        }
      });
      $('input:radio').each(function(index){
        var $this = $(this);
        if ($this.attr('checked')) {
          $this.attr('checked', false).checkboxradio('refresh');
        }
      });
      $('fieldset').each(function(index){
        hideAndClearSubQuestionsFor($(this).attr('id'));
      });

      // Remove additional repeating groups
      $('.append-to').empty();
    }


    // Render the form ...........................................................
    var renderForm = function() {
      console.log("Form data:");
      console.log(settings.formData.questions);
      $.each(settings.formData.questions, function (index, question) {
        addQuestion(question);
      });    
      form.trigger("create");
    };

    /* 
     * Keep track of how many times we've seen a question with a given name
     * Return a suffix if we've seen it more than once times
     */ 
    function suffix(name) {
      if(_.has(repeatCounter, name)) {
        repeatCounter[name] += 1;
        return "-" + repeatCounter[name].toString();
      }

      repeatCounter[name] = 1; 
      return "";
    }

    function makeClickHandler(id, triggerID) {
      return function handleClick(e) {
        // Hide all of the conditional questions, recursively.
        hideAndClearSubQuestionsFor(id);

        // Show the conditional questions for this response.
        if($(this).prop("checked")) {
          $('.control-group[data-trigger=' + triggerID + ']').each(function (i) {
            $(this).show();
          });

          $('.repeating-button[data-trigger=' + id + ']').each(function (i) {            
            $(this).show();
          });
        }        
      };
    }


    /*
     * Render questions
     */
    app.boxAnswersByQuestionId = {};
    app.questionsByParentId = {};
    var templates;
    function addQuestion(question, visible, parentID, triggerID, appendTo) {
      // Set default values for questions
      if (visible === undefined) {
        visible = true;
      }
      if (parentID === undefined) {
        parentID = '';
      }
      if (triggerID === undefined) {
        triggerID = '';
      }

      // Load the templates
      if (templates === undefined) {
        templates = {
          question: _.template($('#question').html()),
          answerCheckbox: _.template($('#answer-checkbox').html()),
          answerRadio: _.template($('#answer-radio').html()),
          answerText: _.template($('#answer-text').html()),
          repeatButton: _.template($('#repeat-button').html())
        };
      }

      // Give the question an ID based on its name
      var id = _.uniqueId(question.name);

      // Collected the data needed to render the question 
      var questionData = {
        text: question.text,
        info: question.info, 
        id: id,
        parentID: parentID,
        triggerID: triggerID
      };

      // Render the questions's fieldset
      var $question = $(templates.question(questionData));
      if (!visible) {
        $question.hide();
      }

      // 
      var siblings = app.questionsByParentId[parentID];
      if (siblings === undefined) {
        siblings = [];
        app.questionsByParentId[parentID] = siblings;
      }
      siblings.push($question); 


      if (appendTo !== undefined) {
        $(appendTo).append($question);
      }else {
        formQuestions.append($question);
      }

      var suffixed_name = question.name + suffix(question.name);

      // Infoboxes (aka help text for questions)
      if(question.info !== undefined) {
        $question.find(".show-info").click(function(e) {
          var toShow = $(this).attr("data-trigger");
          console.log($("#" + toShow));
          $("#" + toShow).slideToggle('slow');
        });

        $question.find(".box-close").click(function(e) {
          var $toHide = $(this).parent();
          $toHide.slideUp('slow');
        });      
      }

      // TODO: Titles for question groups
      // if(answer.title != undefined) {
      //   console.log("TITLE!------");
      //   var $title = $(_.template($('#title').html(), {title: answer.title} ));
      //   $question.append($title);
      // }

      var questionID = id;
      // Add each answer to the question
      _.each(question.answers, function (answer) {
        // The triggerID is used to hide/show other question groups
        var triggerID = _.uniqueId(question.name);

        // TODO: checkbox questions should be consistent with other answer groups
        if(question.type === "checkbox") {
          suffixed_name = answer.name + suffix(answer.name);
          triggerID = suffixed_name; //_.uniqueId(answer.name);
          id = suffixed_name; //_.uniqueId(answer.name);
        }

        // Set the data used to render the answer
        var data = {
          questionName: suffixed_name,
          id: triggerID,
          theme: (answer.theme || "c"),
          value: answer.value,
          text: answer.text
        };

        // Render the answer and append it to the fieldset.
        var $answer;
        var referencesToAnswersForQuestion;

        // If there is more than one answer, this could be multiple choice
        // or a radio group.
        if (question.answers.length > 1) {

          if(question.type === "checkbox") {
            $answer = $(templates.answerCheckbox(data));
          }else {
            $answer = $(templates.answerRadio(data));
          }

          // Store references to the questions for quick retrieval later
          referencesToAnswersForQuestion = app.boxAnswersByQuestionId[questionID];
          if (referencesToAnswersForQuestion === undefined) {
            referencesToAnswersForQuestion = [];
            app.boxAnswersByQuestionId[questionID] = referencesToAnswersForQuestion;
          }
          $answer.filter('input[type="radio"]').each(function (i, el) {
            referencesToAnswersForQuestion.push($(el));
          });
          $answer.filter('input[type="checkbox"]').each(function (i, el) {
            referencesToAnswersForQuestion.push($(el));
          });

        }else {
          if(question.type === "text") {
            $answer = $(templates.answerText(data));
          }else {
            $answer = $(templates.answerCheckbox(data));

            // Store references to answers for quick retrieval later
            referencesToAnswersForQuestion = app.boxAnswersByQuestionId[questionID];
            if (referencesToAnswersForQuestion === undefined) {
              referencesToAnswersForQuestion = [];
              app.boxAnswersByQuestionId[questionID] = referencesToAnswersForQuestion;
            }
            $answer.filter('input[type="radio"]').each(function (i, el) {
              referencesToAnswersForQuestion.push($(el));
            });
            $answer.filter('input[type="checkbox"]').each(function (i, el) {
              referencesToAnswersForQuestion.push($(el));
            });

          }
        }

        $question.append($answer);

        // Add the click handlers
        var input = $answer.parent().find('input#' + triggerID);
        if (input.length === 0) {
          input = $answer;
        }

        input.click(makeClickHandler(id, triggerID));

        // If there are conditional questions, add them.
        // They are hidden by default.
        if (answer.questions !== undefined) {
          // If users can repeat those conditional questions: 
          if(answer.repeatQuestions !== undefined) {
            var $repeatButton;
            var $repeatBox = $(templates.repeatButton({
              parentID: id,
              triggerID: id
            }));

            formQuestions.append($repeatBox);
            $repeatButton = $repeatBox.find('a');
            var $appendTo = $repeatBox.find('.append-to');
            console.log($appendTo);

            // If we click the repeat button, add the questions again
            $repeatButton.click(function handleClick(e) {
              e.preventDefault();

              // Append the questions to this answer again! 
              _.each(answer.questions, function (subq) {
                addQuestion(subq, true, id, triggerID, $appendTo);
              });

              form.trigger("create");
            });

            _.each(answer.questions, function (subq) {
              // Add the sub questions before the repeatButton
              addQuestion(subq, false, id, triggerID, $appendTo);
            });


          }else {
            _.each(answer.questions, function (subq) {
              // Add the sub questions before the repeatButton
              if(appendTo !== undefined){
                addQuestion(subq, false, id, triggerID, appendTo);
              }else {
                addQuestion(subq, false, id, triggerID);
              }
            });

          } // end repeating answers

        } // end check for sub-answers

      });
    }


    // Option group stuff ........................................................

    // Show / hide sub questions for a given parent
    function hideAndClearSubQuestionsFor(parent) {

      // Get the list of questions associated with that parent
      var questionsToProcess = app.questionsByParentId[parent]; // was var controlGroupQueue
      var answersToProcess = [];

      function handleQuestion(question) {
        var $el = $(question);
        $el.hide();

        // Get the answers we'll need to reset later
        var id = $el.attr('id');
        var answersForQuestion = app.boxAnswersByQuestionId[id];
        if (answersForQuestion !== undefined) {
          answersToProcess = answersToProcess.concat(answersForQuestion);
        }

        // Handle conditional questions.
        var subQuestions = app.questionsByParentId[$el.attr('id')];
        if (subQuestions !== undefined) {
          questionsToProcess = questionsToProcess.concat(subQuestions);
        }
      }

      var i = 0;
      var question;
      while (questionsToProcess !== undefined && i < questionsToProcess.length) {
        question = questionsToProcess[i];
        handleQuestion(question);
        i += 1;
      }

      // Uncheck all the things!
      var j;
      var answersToProcessLength = answersToProcess.length;
      for (j = 0; j < answersToProcessLength; j += 1) {
        if (answersToProcess[j].attr('checked')) {
          answersToProcess[j].attr('checked', false).checkboxradio("refresh");
        }
      }

      $('.repeating-button[data-parent=' + parent + ']').hide();
    }

    // Trigger form init .........................................................
    this.init();

  };
});
