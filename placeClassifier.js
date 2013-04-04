const kNotWordPattern = /[^a-z0-9 ]+/g;
const kMinimumMatchTokens = 3;
const kSimilarityCutOff = Math.log(0.95);

function PlaceTokenizer(aUrlStopwordSet) {
  this._urlStopwordSet = aUrlStopwordSet;
}

PlaceTokenizer.prototype.tokenize = function(aUrl, aTitle) {
  aUrl = aUrl.toLowerCase().replace(kNotWordPattern, " ");
  aTitle = aTitle.toLowerCase().replace(kNotWordPattern, " ");

  tokens = [];

  urlTokens = aUrl.split(/\s+/);
  for (var tokenIndex=0; tokenIndex < urlTokens.length; tokenIndex++) {
    var token = urlTokens[tokenIndex];
    if (!(this._urlStopwordSet.hasOwnProperty(token))) {
      tokens.push(token);
    }
  }

  tokens = tokens.concat(aTitle.split(/\s+/));

  return tokens;
}

function NaiveBayesClassifier(aModel) {
  this._classes = aModel.classes;

  this._logLikelihoods = aModel.logLikelihoods;
  this._logPriors = aModel.logPriors;
}

NaiveBayesClassifier.prototype.classify = function(aTokens) {
  if (!(aTokens instanceof Array)) {
    throw new TypeError("invalid input data");
  }

  var posteriors = [];

  for (var index=0; index < this._logPriors.length; index++) {
    posteriors.push(this._logPriors[index]);
  }

  var tokenMatchCount = 0;
  for (var tokenIndex=0; tokenIndex < aTokens.length; tokenIndex++) {
    var token = aTokens[tokenIndex];
    if (this._logLikelihoods.hasOwnProperty(token)) {
      tokenMatchCount += 1;
      for (var index=0; index < posteriors.length; index++) {
        posteriors[index] += this._logLikelihoods[token][index];
      }
    }
  }

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
      } else if ((currentMax-maxValue) >= kSimilarityCutOff) {
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
