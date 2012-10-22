/*jslint nomen: true */
/*globals require: true */

require.config({
  paths: { 
    jquery: 'jquery',
    bootstrap: 'bootstrap'
  },
  shim: {
    'underscore': {
      exports: '_'
    }
  }
});


require(['jquery', 'underscore', 'bootstrap', 'app'],
        function ($, _, bootstrap, app) {
  'use strict';

  $(document).ready(function () {
    app.init();
  });
});
