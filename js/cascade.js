/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('underscore');

  return function(app) {
    // Add Question stuff
    var boxAnswersByQuestionId = {};
    var questionsByParentId = {};
    var repeatCounter = {};
    var formQuestions = $('#questions');
    var templates;

    this.init = function() {
      $('.preview').click(function() {
        console.log("preview clicked");
        // app.formRender.renderForm();
      });
    };

    this.renderForm = function() {
      $('#questions').html('');

      // Render form
      _.each(data, function (question, questionIndex) {
        addQuestion(question, undefined, undefined, undefined, undefined, questionIndex, data);
      }, this); 
    };

    this.suffix = function (name) {
      if(_.has(repeatCounter, name)) {
        repeatCounter[name] += 1;
        return "-" + repeatCounter[name].toString();
      }

      repeatCounter[name] = 1; 
      return "";
    };



  } // end app{}

}); 





$(function() {

  // check
  var renderForm = function() {
    // Clear form
    $('#questions').html('');

    // Render form
    _.each(data, function (question, questionIndex) {
      addQuestion(question, undefined, undefined, undefined, undefined, questionIndex, data);
    }, this); 
  };


  // check
  function suffix(name) {
    if(_.has(repeatCounter, name)) {
      repeatCounter[name] += 1;
      return "-" + repeatCounter[name].toString();
    }

    repeatCounter[name] = 1; 
    return "";
  }

  function addQuestion(question, visible, parentID, triggerID, appendTo, questionIndex, parent) {
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
        question: _.template($('#question-template').html()),
        answer: _.template($('#answer-template').html())
      };
    }

    // Give the question an ID based on its name
    var id = _.uniqueId(question.name);

    // Render the questions ----------------------------------------------------
    var $question = $(templates.question(question));

    // Listen for changes to the question
    $question.find('> input').keyup(function(){
      var text = $(this).val();
      var name = slugify(text)

      question.text = text;
      question.name = name;

      updateJSON();
    });

    // Change question type
    $question.find('.question-type').click(function(){
      var dataRole = $(this).attr('data-role');
      if (dataRole === 'radio-question') {
        delete question.type;
      }
      if (dataRole === 'checkbox-question') {
        question.type = "checkbox";
      }
    });

    // Remove a question
    $question.find('> .remove').click(function(){
      console.log("removing question");

      // Remove it from the DON.
      $question.remove();

      // Remove it from the json
      parent.splice(questionIndex, 1);
      updateJSON();
    });

    // Add a question
    $question.find('> .add-question').click(function(){
      console.log("adding question");
      // Sensible default answers:
      var newQuestion = {};
      newQuestion.text = '';
      newQuestion.name = '';
      newQuestion.answers = [
        {
          "value": "yes",
          "text": "Yes"
        },
        {
          "value": "no",
          "text": "No"
        }
      ];
      parent.splice(questionIndex + 1, 0, newQuestion);
      updateJSON();
      renderForm();
    });

    // Add an answer 
    $question.find('.add-answer').click(function(){
      question.answers.push({
        'text': 'hi!',
        'value': 'hi'
      });
      updateJSON();
      renderForm();
    });

    // Some stuff with siblings -- forget what this does. 
    var siblings = questionsByParentId[parentID];
    if (siblings === undefined) {
      siblings = [];
      questionsByParentId[parentID] = siblings;
    }
    siblings.push($question); 

    if (appendTo !== undefined) {
      $(appendTo).append($question);
    }else {
      formQuestions.append($question);
    }

    var suffixed_name = question.name + suffix(question.name);

    // TODO Infoboxes (aka help text for questions)
    // if(question.info !== undefined) {
    // }

    // Deal with answers -------------------------------------------------------
    var questionID = id;
    // Add each answer to the question
    _.each(question.answers, function (answer, index) {
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

      $answer = $(templates.answer(data));
      referencesToAnswersForQuestion = boxAnswersByQuestionId[questionID];
      if (referencesToAnswersForQuestion === undefined) {
        referencesToAnswersForQuestion = [];
        boxAnswersByQuestionId[questionID] = referencesToAnswersForQuestion;
      }

      $question.find('> .answers').append($answer);

      // Change the answer text when updated
      var $input = $answer.find('input');
      $input.keyup(function(){
        question.answers[index].text = $(this).val();
        question.answers[index].value = slugify($(this).val());
        updateJSON();
      });

      // Remove an answer
      var $remove = $answer.find('.remove');
      $remove.click(function(e) {
        console.log("removing answer");

        // Remove it from the json
        question.answers.splice(index, 1);
        updateJSON();

        // Remove it from the DON.
        $answer.remove();
      });

      // If there are conditional questions, add them.
      // They are hidden by default.
      if (answer.questions !== undefined) {
        appendTo = $answer;
        _.each(answer.questions, function (subq, questionIndex) {
          // Add the sub questions before the repeatButton
          if(appendTo !== undefined){
            addQuestion(subq, false, id, triggerID, appendTo, questionIndex, answer.questions);
          }else {
            addQuestion(subq, false, id, triggerID, undefined, questionIndex, answer.questions);
          }
        });
      } // end check for sub-answers

    });
  } // end addQuestion

  function slugify(text) {
    text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
    text = text.replace(/-/gi, "_");
    text = text.replace(/\s/gi, "-");
    return text;
  }

  function updateJSON() {
    $("#form-json").html(JSON.stringify(data));
  }

  renderForm();
  updateJSON();
});
