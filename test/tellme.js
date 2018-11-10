'use strict';
const _ = require('lodash');
const { options, slug_padding_size } = require('./options');
const slugify = require('speakingurl');

// https://www.youtube.com/watch?v=--UPSacwPDA
const text = [
  `#0 Am I wrong, fallin' in love with you,`,
  `#1 tell me am I wrong, well, fallin' in love with you`,
  `#2 While your other man was out there,`,
  `#3 cheatin' and lyin', steppin' all over you`,

  `#4 Uh, sweet thing`,
  `#5 Tell me am I wrong, holdin' on to you so tight,`,
  `#6 Tell me, tell me, am I wrong, holdin' on to you so tight`,
  `#7 If your other man come to claim you,`,
  `#8 he'd better be ready, ready for a long long fight`,
];

const slug = text.map(t => slugify(t, options));

function getText(i){
  return text[i];
}
function getSlug(i, j) {
  return slug[i] + (j !== undefined ? options.separator + slug[j] : '');
}
const regex = slug.map(s => new RegExp('^' + s + options.separator + '.+$'));

function getCounterSlug(index, n) {
  return (
    getSlug(index) + options.separator + _.padStart(n, slug_padding_size, '0')
  );
}

function getShortRegex(index) {
  return regex[index];
}

module.exports = {
  getText,
  getSlug,
  getCounterSlug,
  getShortRegex,
};
