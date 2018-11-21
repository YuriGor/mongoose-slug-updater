'use strict';
const _ = require('deepdash')(require('lodash'));
const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');
const tellme = require('./../tellme');
const { options, slugPaddingSize } = require('./../options');

const ResourceGroupedUniqueCounter = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  group: { type: String },
  uniqueSlug: {
    type: String,
    uniqueGroupSlug: ['group'],
    slugPaddingSize,
    slug: 'title',
    index: true,
  },
  children: [
    {
      title: { type: String },
      globalGroupSlug: {
        type: String,
        uniqueGroupSlug: ['/group'],
        slugPaddingSize,
        slug: 'title',
        index: true,
      },
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
    uniqueGroupSlug: ['group'],
    slug: 'title',
    index: true,
  },
  children: [
    {
      title: { type: String },
      globalGroupSlug: {
        type: String,
        uniqueGroupSlug: ['/group'],
        slug: 'title',
        index: true,
      },
    },
  ],
});

const UniqueNestedSchema = new mongoose.Schema({
  n: { type: Number },
  title: { type: String },
  children: [
    {
      title: { type: String },
      subchildren: [
        {
          title: { type: String },
          slugShort: { type: String, slug: 'title', unique: true },
          slugCounter: {
            type: String,
            slug: 'title',
            unique: true,
            slugPaddingSize,
          },
          slugLocalShort: {
            type: String,
            slug: 'title',
            index: true,
            uniqueGroupSlug: '/_id',
          },
          slugLocalCounter: {
            type: String,
            slug: 'title',
            index: true,
            slugPaddingSize,
            uniqueGroupSlug: '/_id',
          },
        },
      ],
    },
  ],
});

UniqueNestedSchema.statics.getNewDoc = function(n) {
  let res = {
    n,
    title: tellme.getText(0),
    children: [],
  };
  for (let i = 0; i < 9; i++) {
    res.children[i] = {
      title: tellme.getText(i),
      subchildren: [],
    };
    for (let j = 0; j < 9; j++) {
      res.children[i].subchildren[j] = {
        title: tellme.getText(8 - j),
      };
    }
  }
  return res;
};

UniqueNestedSchema.statics.testNewDoc = function(doc,n) {
  doc.should.have.property('n').and.equal(n);
  doc.should.have.property('title').and.equal(tellme.getText(0));
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children[${i}].title`)
      .and.equal(tellme.getText(i));
    for (let j = 0; j < 9; j++) {
      // console.log(`n:${n} i${i} j${j}`);
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].title`)
        .and.equal(tellme.getText(8 - j));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugShort`)
        .and.match(tellme.getShortRegex(8 - j, n*9+i));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugCounter`)
        .and.equal(tellme.getCounterSlug(8 - j, n*9+i));
      // console.log(_.get(doc,`children[${i}].subchildren[${j}].slugLocalCounter`));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugLocalCounter`)
        .and.equal(tellme.getCounterSlug(8 - j, i));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugLocalShort`)
        .and.match(tellme.getShortRegex(8 - j, i));
    }
  }
};

UniqueNestedSchema.statics.changeDoc = function(doc) {
  let res = {
    title: tellme.getText(8),
    children: [],
  };
  for (let i = 0; i < 9; i++) {
    res.children[i] = {
      title: tellme.getText(8-i),
      subchildren: [],
    };
    for (let j = 0; j < 9; j++) {
      res.children[i].subchildren[j] = {
        title: tellme.getText(j),
      };
    }
  }
  return _.merge(doc,res);
};

UniqueNestedSchema.statics.testChangedDoc = function(doc,n,nIterations) {
  doc.should.have.property('n').and.equal(n);
  doc.should.have.property('title').and.equal(tellme.getText(8));
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children[${i}].title`)
      .and.equal(tellme.getText(8-i));
    for (let j = 0; j < 9; j++) {
      // console.log(`n:${n} i${i} j${j}`);
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].title`)
        .and.equal(tellme.getText(j));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugCounter`)
        .and.equal(tellme.getCounterSlug(j, (j!=4?nIterations*9:0)+n*9+i));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugShort`)
        .and.match(tellme.getShortRegex(j, (j!=4?nIterations*9:0)+n*9+i));
      // console.log(_.get(doc,`children[${i}].subchildren[${j}].slugLocalCounter`));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugLocalCounter`)
        .and.equal(tellme.getCounterSlug(j, i));
      doc.should.have.nested
        .property(`children[${i}].subchildren[${j}].slugLocalShort`)
        .and.match(tellme.getShortRegex(j, i));
    }
  }
};

module.exports = {
  ResourceGroupedUniqueCounter,
  ResourceGroupedUniqueShortId,
  UniqueNestedSchema,
};
