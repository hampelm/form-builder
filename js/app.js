/* 



NO LONGER USED  x x x x x x x x x x x x x x x x x



*/

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('underscore');

  var app = {
    // Keep track of the form as we go. 
    form: [],
    formByFieldName: {},

    init: function() {
      console.log("Hi Matt!");

      $('.preview').click(function() {
        console.log("preview clicked)");
        $("#preview").show();
      });

      // Show the right question tab type
      $('#select-question-type a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
      });

      // When "Add a question" is clicked:
      $('.addquestion').click(function(e){
        e.preventDefault();

        // Set up to create a new question
        var newQuestion = {};
        var newQuestionForm = $('#question-to-select .active');
        var newQuestionType = newQuestionForm.attr('data-type');

        // Sensible default answers:
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

        // Parse the new question 
        console.log(newQuestionForm.find('[data-field="text"]').val());
        newQuestion.text = newQuestionForm.find('[data-field="text"]').val();
        newQuestion.name = slugify(newQuestion.text);

        console.log(newQuestion);

        // Add the question to the array of things 
        app.form.push(newQuestion);

        // Add the question to the stack on the page
        var $question = $(_.template($('#yesno-template').html(), newQuestion));
        $("#questions").append($question);

        // Update the JSON display
        $("#form-json").html(JSON.stringify(app.form));

        // Listen for events on the question form
        $question.find('[data-role="question"]').keyup(function(){
          var text = $(this).val();
          var name = slugify(text)

          newQuestion.text = text;
          newQuestion.name = name;

          app.updateJSON();
        });

        // Listen for events on the answers
        var answers = $question.find('[data-role="answer"]');

        _.each(answers, function(answer, index){

            // Change answer text
            var $input = $(answer).find('input');
            $input.keyup(function(){
              newQuestion.answers[index].text = $(this).val();
              newQuestion.answers[index].value = slugify($(this).val());
              app.updateJSON();
            });

            // Remove answer text
            var $remove = $(answer).find('.remove');
            $remove.click(function(e) {
              console.log("removing answer");

              // Remove it from the json
              console.log(newQuestion.answers);
              newQuestion.answers.splice(index, 1);
              console.log(newQuestion.answers);
              app.updateJSON();

              // Remove it from the DON.
              $(answer).remove();
            });

        }, this);


      });
    }, // end init()

    // Slugify a string
    slugify: function(text) {
      text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
      text = text.replace(/-/gi, "_");
      text = text.replace(/\s/gi, "-");
      return text;
    },

    // Update the display of JSON
    updateJSON: function() {
      console.log("Updating JSON!");
    }


    data: [
      {
        "name": "structure",
        "text": "Is there a structure on the site?",
        "answers": [
          {
            "value": "yes",
            "text": "Yes",
            "questions": [
              {
                "name":"How big is it?",
                "text":"How big is it?",
                "answers": [
                  {
                    "value": "big",
                    "text": "Big",
                    "questions": [
                      {
                        "name":"Is it nice?",
                        "text":"Is it nice?",
                        "answers": [
                          {
                            "value": "Yeah",
                            "text": "Yeah"
                          },
                          {
                            "value": "Nah",
                            "text": "Nah"
                          }

                        ]
                      }
                    ]
                  },
                  {
                    "value": "Not so big",
                    "text": "Not so big"
                  }

                ]
              }
            ]
          },
          {
            "value": "Maybe",
            "text": "Maybe"
          }
        ]
      }
    ]; // end data

  }; // end app{}

  return app;
});




