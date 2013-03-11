const kNotWordPattern = /[^a-z0-9 ]+/g;
const kMinimumMatchTokens = 3;
const kSimilarityCutOff = 0.95;

function PlaceTokenizer(aUrlStopwordSet) {
  this._urlStopwordSet = aUrlStopwordSet;
}

PlaceTokenizer.prototype.tokenize = function(aUrl, aTitle) {
  aUrl = aUrl.toLowerCase().replace(kNotWordPattern, " ");
  aTitle = aTitle.toLowerCase().replace(kNotWordPattern, " ");

  tokens = [];

  urlTokens = aUrl.split(/\s+/);
  urlTokens.forEach(function(token){
    if (!(this._urlStopwordSet.hasOwnProperty(token))) {
      tokens.push(token);
    }
  }, this);

  tokens = tokens.concat(aTitle.split(/\s+/));

  return tokens;
}

function NaiveBayesClassifier(aModel) {
  this._classes = aModel.classes;
  this._likelihoods = aModel.likelihoods;
  this._priors = aModel.priors;
}

NaiveBayesClassifier.prototype.classify = function(aTokens) {
  if (!(aTokens instanceof Array)) {
    throw new TypeError("invalid input data");
  }

  var posteriors = [];
  this._priors.forEach(function(){
    posteriors.push(0);
  }, this);

  var tokenMatchCount = 0;
  aTokens.forEach(function(token){
    if (this._likelihoods.hasOwnProperty(token)) {
      tokenMatchCount += 1;
      posteriors.forEach(function(value, index) {
        if (posteriors[index] == 0) {
          posteriors[index] = this._priors[index];
        }
        posteriors[index] *= this._likelihoods[token][index];
      }, this);
    }
  }, this); 

  var classMatches = [];
  if (tokenMatchCount > kMinimumMatchTokens) {
    var maxValue = -Infinity;

    while(true) {
      currentMax = Math.max.apply(Math, posteriors);
      if (currentMax > maxValue) {
        // set max value, setup to get next biggest probability
        max_index = posteriors.indexOf(currentMax);
        maxValue = currentMax;
        classMatches.push(this._classes[max_index]);
        posteriors[max_index] = -Infinity;
      } else if (currentMax/maxValue >= kSimilarityCutOff) {
        max_index = posteriors.indexOf(currentMax);
        classMatches.push(this._classes[max_index]);
        posteriors[max_index] = -Infinity;
      } else {
        // selection is done, the next nearest item is less similar than the threshold
        break;
      }
    }
    return classMatches;
  }
  return null;
}

module.exports.NaiveBayesClassifier = NaiveBayesClassifier;
module.exports.PlaceTokenizer = PlaceTokenizer;
