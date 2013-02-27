#!/usr/bin/env node
var modelFilename = process.argv[2];
var testDataFilename = process.argv[3];

var model = require(modelFilename);
var urlStopwordSet = require('./urlStopwordSet');
var nbayes = require('./nbayes');

var gTokenizer = new nbayes.PlaceTokenizer(urlStopwordSet);
var gClassifier = new nbayes.NaiveBayesClassifier(model);

var fs = require('fs');
var lazy = require('lazy');

var gSuccessCount = 0;
var gErrorCount = 0;
var gUnCategorized = 0;
var gDocumentCount = 0;

var start = new Date().getTime();
new lazy(fs.createReadStream(testDataFilename)).lines.forEach(function(line){
  gDocumentCount += 1;
  var data = line.toString().split('\t');

  var categorySet = {};
  data[2].split(',').forEach(function(category){
    categorySet[category] = true;
  }, this);

  var tokens = gTokenizer.tokenize(data[0], data[1]);
  var category = gClassifier.classify(tokens);

  if (category != null) {
    if (categorySet.hasOwnProperty(category)) {
      gSuccessCount += 1;
    } else {
      gErrorCount += 1;
    }
  } else {
    gUnCategorized += 1;
  }
  if (gDocumentCount%100000 == 0) {
    var now = new Date().getTime();
    console.log("");
    console.log("Sucess rate: " + (gSuccessCount/gDocumentCount*100).toFixed(2) + "%");
    console.log("Error rate: " + (gErrorCount/gDocumentCount*100).toFixed(2) + "%");
    console.log("Uncategorized rate: " + (gUnCategorized/gDocumentCount*100).toFixed(2) + "%");
    console.log("----");
    console.log("Document Count: " + gDocumentCount);
    console.log("Rate: " + (gDocumentCount/(now-start)).toFixed(2) + " docs/sec");
  }
});
