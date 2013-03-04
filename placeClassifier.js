const kNotWordPattern = /[^a-z0-9 ]+/g;
const kMinimumMatchTokens = 3;

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

  if (tokenMatchCount > kMinimumMatchTokens) {
    max_index = posteriors.indexOf(Math.max.apply(Math, posteriors));
    return this._classes[max_index];
  }
  return null;
}

module.exports.NaiveBayesClassifier = NaiveBayesClassifier;
module.exports.PlaceTokenizer = PlaceTokenizer;
