// Pure functions, for validating inputs

import * as validator from 'validator';
import * as R from 'ramda';
import mimetypelist from './ericsmimetypelist.json';

function required(predicate) {
  return function (value, key) {
    if (value === undefined) {
      return "REQUIRED : " + key;
    }
    return predicate(value, key);
  }
}

function optional(predicate) {
  return function (value, key) {
    if (value === undefined) {
      return false;
    }
    return predicate(value, key);
  }
}

/// Validators return true if pass, string if fail

function isURL(input) {
  let res = isString(input);
  if (res !== true) {
    return "Not a URL > " + res;
  }
  res = validator.isURL(input);
  if (!res) {
    return "Not a URL > " + input;
  }
  return true;
}

function isString(input) {
  let res = (typeof input === 'string');
  if (!res) {
    return "Not a string > " + input;
  }
  return true;
}

function isStringArray(input) {
  if (!Array.isArray(input)) {
    return "Not an array";
  }
  for (const v of input) {
    const res = isString(v);
    if (res !== true) {
      return "Inside string array > " + res;
    }
  }
  return true;
}

function isLongitude(input) {
  let res = validator.isFloat(input.toString(), { min: -180, max: 180 });
  if (!res) {
    return 'Invalid Coordinate : ' + input + '\n Range is (-180, 180)';
  }
  return true;
}

function isLatitude(input) {
  let res = validator.isFloat(input.toString(), { min: -90, max: 90 });
  if (!res) {
    return 'Invalid Coordinate : ' + input + '\n Range is (-90, 90)';
  }
  return true;
}

// function isFloat(input) {
//   let res = validator.isFloat(input, )
// }

function isBox(input) {
  let res = isStringOfNumbers(input);
  if (res !== true) { return 'Invalid Box > ' + res; }
  //Regex, finds coordinate pairs, requires leading 0. ".314" not accepted
  res = isSeriesOfCoordinates(input);
  if (typeof res === 'string') { return res; }

  if (res !== 2) {
    return 'Incorrect number of coordinates > ' + input + ` has ${res} coords.`;
  }
  return true;
}

function isPolygon(input) {
  let res = isStringOfNumbers(input);
  if (res !== true) { return 'Invalid Polygon > ' + res; }

  res = isSeriesOfCoordinates(input);
  if (res < 3) {
    return "Not enough coordinates > " + input.trim() + ` has ${res} coords.`;
  }
  return true;
}

function isRestrictedMimeType(input) {
  return mimetypelist.includes(input.trim());
}

function isMimeType(input) {
  let res = validator.isMimeType(input);
  if (!res) {
    return false;
  }
  return true;
}

function isBoolean(input) {
  if (typeof input === 'boolean') {
    return true;
  } else {
    return "Needs to be true or false > " + input;
  }
}

/**
 * @param {string} input | example : 24.94972,-80.45361 24.94972,-80.45361
 * @returns {string | number} string = error | number = # of coords
 */
function isSeriesOfCoordinates(input) {
  const coordPairs = /(-?\d*\.\d+,-?\d*\.\d+)/g;
  const res = input.match(coordPairs);
  if (res === null) {
    return 'No coordinates detected > ' + input;
  }
  return res.length;
}

//Weak check for charaters that dont belong in series of numbers
function isStringOfNumbers(input) {
  //Test for non-numeric chars
  let test = input.replace(/,|\.|-|\s/g, '');
  let res = validator.isNumeric(test);
  // let res = validator.isNumeric(input);
  if (!res) {
    const invalidChars = '[' + test.replace(/[0-9]/g, '').split('').join(',') + ']';
    return "Contains non-numeric values, such as " + invalidChars;
  }
  return true;
}


// Stage 2 validators

/**
 * @param {key} key to access object with
 * @returns predicate to use against obj
 */
function hasValidatedProp(key) {
  return obj => R.has(key)(obj) && obj.hasOwnProperty(key);
}

/**
 * 
 * @param {geo obj or array} input 
 */
// function isGeos(input) {
//   if (Array.isArray(input)) {
//     return input.map(geo => isGeo(geo)).every(b => b === true);
//   }

//   return isGeo(input);

//   function isGeo(geo) {
//     if (geo === undefined) { return false; }
//     const { allPass, has } = R;

//     if (allPass([has('longitude'), has('latitude')])(geo)) {
//       return true;
//     }
//     if (has('box')(geo)) {
//       return true;
//     }
//     if (has('polygon')(geo)) {
//       return true;
//     }

//     return "Invalid Geo object.";
//   }
// }

function isValidGeo(geo) {
  if (geo === undefined) { return false; }
  const { all, allPass, anyPass, has } = R;
  // const has = hasValidatedProp;

  const coordPredicate = allPass([has('longitude'), has('latitude')]);
  const boxPredicate = has('box');
  const polygonPredicate = has('polygon');

  const anyValidGeo = anyPass([coordPredicate, boxPredicate, polygonPredicate]);

  if (anyValidGeo(geo) === false) {
    return "Invalid Geo. Needs Coordinates, box, or polygon";
  }

  const result = {};
  if (coordPredicate(geo)) {
    result.longitude = isLongitude(geo.longitude);
    result.latitude = isLatitude(geo.latitude);
  }

  if (boxPredicate(geo)) {
    result.box = isBox(geo.box);
  }

  if (polygonPredicate(geo)) {
    result.polygon = isPolygon(geo.polygon);
  }

  return [all(a => a === true, Object.values(result)), result];
}

module.exports = {
  required,
  optional,

  isString,
  isStringArray,
  isBoolean,
  // isFloat,
  isPolygon,
  isBox,
  isRestrictedMimeType,
  isLatitude,
  isLongitude,
  isURL,

  // isGeos,
  isValidGeo
}