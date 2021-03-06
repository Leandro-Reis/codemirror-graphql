/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

// Create the expected hint response given a possible list and a token
export default function hintList(cursor, token, list) {
  const hints = filterAndSortList(list, normalizeText(token.string));
  if (!hints) {
    return;
  }

  const tokenStart = token.type !== null && /"|\w/.test(token.string[0]) ?
    token.start :
    token.end;

  const results = {
    list: hints,
    from: { line: cursor.line, column: tokenStart },
    to: { line: cursor.line, column: token.end },
  };

  return results;
}

// Given a list of hint entries and currently typed text, sort and filter to
// provide a concise list.
function filterAndSortList(list, text) {
  const sorted = !text ? list : list.map(
    entry => ({
      proximity: getProximity(normalizeText(entry.text), text),
      entry
    })
  ).filter(
    pair => pair.proximity <= 2
  ).sort(
    (a, b) =>
      (a.proximity - b.proximity) ||
      (a.entry.text.length - b.entry.text.length)
  ).map(
    pair => pair.entry
  );

  return sorted.length > 0 ? sorted : list;
}

function normalizeText(text) {
  return text.toLowerCase().replace(/\W/g, '');
}

// Determine a numeric proximity for a suggestion based on current text.
function getProximity(suggestion, text) {
  // start with lexical distance
  let proximity = lexicalDistance(text, suggestion);
  if (suggestion.length > text.length) {
    // do not penalize long suggestions.
    proximity -= suggestion.length - text.length - 1;
    // penalize suggestions not starting with this phrase
    proximity += suggestion.indexOf(text) === 0 ? 0 : 0.5;
  }
  return proximity;
}

/**
 * Computes the lexical distance between strings A and B.
 *
 * The "distance" between two strings is given by counting the minimum number
 * of edits needed to transform string A into string B. An edit can be an
 * insertion, deletion, or substitution of a single character, or a swap of two
 * adjacent characters.
 *
 * This distance can be useful for detecting typos in input or sorting
 *
 * @param {string} a
 * @param {string} b
 * @return {int} distance in number of edits
 */
function lexicalDistance(a, b) {
  let i;
  let j;
  let d = [];
  const aLength = a.length;
  const bLength = b.length;

  for (i = 0; i <= aLength; i++) {
    d[i] = [ i ];
  }

  for (j = 1; j <= bLength; j++) {
    d[0][j] = j;
  }

  for (i = 1; i <= aLength; i++) {
    for (j = 1; j <= bLength; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );

      if (i > 1 && j > 1 &&
          a[i - 1] === b[j - 2] &&
          a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[aLength][bLength];
}
