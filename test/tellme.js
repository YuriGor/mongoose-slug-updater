'use strict';
const _ = require('lodash');
const { options, slug_padding_size } = require('./models');
const slugify = require('speakingurl');

// https://www.youtube.com/watch?v=--UPSacwPDA
const text = [
  `Am I wrong, fallin' in love with you,`,
  `tell me am I wrong, well, fallin' in love with you`,
  `While your other man was out there,`,
  `cheatin' and lyin', steppin' all over you`,

  `Uh, sweet thing`,
  `Tell me am I wrong, holdin' on to you so tight,`,
  `Tell me, tell me, am I wrong, holdin' on to you so tight`,
  `If your other man come to claim you,`,
  `he'd better be ready, ready for a long long fight`,
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
