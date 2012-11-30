/*globals define: true */

define(function (require) {
  'use strict';
  return {
    // ID of the current survey -- set on init.
    surveyId: '', 
    
    // URLs of services used to store, retrieve survey data
    api: {
      baseurl: 'http://localhost:3000/api', //'http://localhost:3000', // 'http://surveydet.herokuapp.com', // no trailing slash
      geo: 'http://localhost:3000/api'
    },
      
    // Keys for external services
    // In the future, we should move these out to a separate, untracked file
    // Right now, the danger is low. 
    bing_key: 'Arc0Uekwc6xUCJJgDA6Kv__AL_rvEh4Hcpj4nkyUmGTIx-SxMd52PPmsqKbvI_ce'
  };
});
