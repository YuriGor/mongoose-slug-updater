'use strict';
const _ = require('deepdash')(require('lodash'));
const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');
const tellme = require('./../tellme');
const { options, slug_padding_size, nIterations } = require('./../options');

const ResourceGroupedUniqueCounter = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  group: { type: String },
  uniqueSlug: {
    type: String,
    uniqueGroup: ['group'],
    slug_padding_size: slug_padding_size,
    slug: 'title',
    index: true,
  },
  children: [
    {
      title: { type: String },
      globalGroupSlug: {
        type: String,
        uniqueGroup: ['/group'],
        slug_padding_size,
        slug: 'title',
        index: true,
      }
    },
  ],
});

const ResourceGroupedUniqueShortId = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  group: { type: String },
  uniqueSlug: {
    type: String,
    uniqueGroup: ['group'],
    slug: 'title',
    index: true,
  },
    children: [
    {
      title: { type: String },
      globalGroupSlug: {
        type: String,
        uniqueGroup: ['/group'],
        slug: 'title',
        index: true,
      }
    },
  ],
});


module.exports = {
  ResourceGroupedUniqueCounter,
  ResourceGroupedUniqueShortId,
};
