#!/usr/bin/env node
var fs = require('fs');

var lazy = require('lazy');
var timeago = require('timeago');

var urlStopwordSet = require('./urlStopwordSet');
var placeClassifier = require('./placeClassifier');

var modelFilename = process.argv[2];
var testDataFilename = process.argv[3];
var model = require(modelFilename);

var gTokenizer = new placeClassifier.PlaceTokenizer(urlStopwordSet);
var gClassifier = new placeClassifier.NaiveBayesClassifier(model);

var gSuccessCount = 0;
var gErrorCount = 0;
var gUnCategorized = 0;
var gDocumentCount = 0;
var gObservedMultiClassDoc = 0;
var gDataMultiClassDoc = 0;

var startDate = new Date();
var startTime = startDate.getTime();

timeago.settings.strings.suffixAgo = "";

function printProgress() {
    var now = new Date().getTime();
    console.log("");
    console.log("Success rate: " + (gSuccessCount/gDocumentCount*100).toFixed(2) + "%");
    console.log("Error rate: " + (gErrorCount/gDocumentCount*100).toFixed(2) + "%");
    console.log("Uncategorized rate: " + (gUnCategorized/gDocumentCount*100).toFixed(2) + "%");
    console.log("MultiClass Doc observed/expected: " + gObservedMultiClassDoc + " / " + gDataMultiClassDoc);
    console.log("----");
    console.log("Document Count: " + gDocumentCount);
    console.log("Rate: " + (gDocumentCount/(now-startTime)).toFixed(2) + " docs/sec");
    console.log("");
}

new lazy(fs.createReadStream(testDataFilename))
  .on('end', function() { printProgress(); console.log("time taken: " + timeago(startDate)) })
  .lines
  .forEach(function(line){
    gDocumentCount += 1;
    var data = line.toString().split('\t');

    var categorySet = {};
    var givenCategories = data[2].split(/[,\s]/)
    for(var catIndex=0; catIndex < givenCategories.length; catIndex++) {
      categorySet[givenCategories[catIndex]] = true;
    }

    if (Object.keys(categorySet).length > 1) {
      gDataMultiClassDoc += 1;
    }

    var tokens = gTokenizer.tokenize(data[0], data[1]);
    var categories = gClassifier.classify(tokens);
    var matchCount = 0;

    if (categories == null) {
      gUnCategorized += 1;
    } else {
      if (categories.length > 1) {
        gObservedMultiClassDoc += 1;
      }
      for(var catIndex=0; catIndex < categories.length; catIndex++) {
        if (categorySet.hasOwnProperty(categories[catIndex])) {
          matchCount += 1;
        }
      }
    }
    // if at least one category is right, this will be 1
    var successRatio = matchCount/Object.keys(categorySet).length;
    gSuccessCount += successRatio;
    gErrorCount += 1-successRatio;

    if (gDocumentCount%100000 == 0) {
      printProgress();
    }
});
