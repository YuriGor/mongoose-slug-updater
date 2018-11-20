'use strict';
const _ = require('deepdash')(require('lodash'));
const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');
const tellme = require('./../tellme');
const { options, slugPaddingSize } = require('./../options');

const SubChildSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  absoluteRootSlug: { type: String, slug: '/title' },
  absoluteChildSlug: { type: String, slug: '/child.title' },
  relativeParentSlug: { type: String, slug: ':title' }, // child's title
  relativeGrandParentSlug: { type: String, slug: '::title' }, //parent's title
});

const ChildSchema = new mongoose.Schema({
  title: { type: String },
  subChild: SubChildSchema,
  subChildren: [SubChildSchema],
  slug: { type: String, slug: 'title' },
  subChildSlug: { type: String, slug: 'subChild.title' },
  absoluteSlug: { type: String, slug: '/child.title' },
  absoluteRootSlug: { type: String, slug: '/title' },
  relativeParentSlug: { type: String, slug: ':title' }, //Parent
  subChildrenSlug2: { type: String, slug: 'subChildren.2.title' },
  subChildrenSlug3: { type: String, slug: 'subChildren.3.title' },
});

const ParentSchema = new mongoose.Schema({
  title: { type: String },
  child: ChildSchema,
  children: [ChildSchema],
  slug: { type: String, slug: 'title' },
  absoluteSlug: { type: String, slug: '/title' },
  childSlug: { type: String, slug: 'child.title' },
  absoluteChildSlug: { type: String, slug: '/child.title' },
  subChildSlug: { type: String, slug: 'child.subChild.title' },
  childrenSlug0: { type: String, slug: 'children.0.title' },
  childrenSlug4: { type: String, slug: 'children.4.title' },
  subChildrenSlug3: { type: String, slug: 'children.7.subChildren.3.title' },
  subChildrenSlug7: { type: String, slug: 'children.3.subChildren.7.title' },
});

ParentSchema.statics.getNewDoc = function() {
  let doc = {
    title: tellme.getText(0),
    child: {
      title: tellme.getText(1),
      subChild: {
        title: tellme.getText(2),
      },
      subChildren: [],
    },
    children: [],
  };

  for (let i = 0; i < 9; i++) {
    doc.child.subChildren.push({
      title: tellme.getText(i),
    });
  }

  for (let i = 0; i < 9; i++) {
    doc.children.push({
      title: tellme.getText(8 - i),
      subChild: {
        title: tellme.getText(i),
      },
      subChildren: _.cloneDeep(doc.child.subChildren),
    });
  }

  return doc;
};

ParentSchema.statics.testNewDoc = function(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(0));
  doc.should.have.property('slug').and.equal(tellme.getSlug(0));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(0));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(2));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(8));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(3));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(7));

  doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChildSlug')
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.absoluteRootSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChildrenSlug2')
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property('child.subChildrenSlug3')
    .and.equal(tellme.getSlug(3));

  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(2));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property('child.subChild.absoluteRootSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChild.absoluteChildSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(0));

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`child.subChildren.${i}.title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`child.subChildren.${i}.slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(0));
  }

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children.${i}.title`)
      .and.equal(tellme.getText(8 - i));
    doc.should.have.nested
      .property(`children.${i}.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children.${i}.subChildSlug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children.${i}.absoluteSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug2`)
      .and.equal(tellme.getSlug(2));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug3`)
      .and.equal(tellme.getSlug(3));

    for (let j = 0; j < 9; j++) {
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.title`)
        .and.equal(tellme.getText(j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.slug`)
        .and.equal(tellme.getSlug(j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteRootSlug`)
        .and.equal(tellme.getSlug(0));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteChildSlug`)
        .and.equal(tellme.getSlug(1));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeParentSlug`)
        .and.equal(tellme.getSlug(8 - i));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeGrandParentSlug`)
        .and.equal(tellme.getSlug(0));
    }
  }
};

ParentSchema.statics.changeDoc = function(doc) {
  let changed = {
    title: tellme.getText(8),
    child: {
      title: tellme.getText(7),
      subChild: { title: tellme.getText(6) },
      subChildren: [],
    },
    children: [],
  };

  for (let i = 0; i < 9; i++) {
    changed.child.subChildren[i] = { title: tellme.getText(8 - i) };
  }

  for (let i = 0; i < 9; i++) {
    changed.children[i] = { title: tellme.getText(i), subChildren: [] };
    changed.children[i].subChild = { title: tellme.getText(8 - i) };
    for (let j = 0; j < 9; j++) {
      changed.children[i].subChildren[j] = { title: tellme.getText(8 - j) };
    }
  }
  return _.merge(doc, changed);
};

ParentSchema.statics.testChangedDoc = function(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(8));
  doc.should.have.property('slug').and.equal(tellme.getSlug(8));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(8));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(6));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(0));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(5));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(1));

  doc.should.have.nested.property('child.title').and.equal(tellme.getText(7));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChildSlug')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.absoluteRootSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChildrenSlug2')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.subChildrenSlug3')
    .and.equal(tellme.getSlug(5));

  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(6));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.subChild.absoluteRootSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChild.absoluteChildSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(8));

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`child.subChildren.${i}.title`)
      .and.equal(tellme.getText(8 - i));
    // console.log(i);
    doc.should.have.nested
      .property(`child.subChildren.${i}.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteChildSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(8));
  }

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children.${i}.title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`children.${i}.slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children.${i}.subChildSlug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children.${i}.absoluteSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`children.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`children.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug2`)
      .and.equal(tellme.getSlug(6));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug3`)
      .and.equal(tellme.getSlug(5));

    for (let j = 0; j < 9; j++) {
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.title`)
        .and.equal(tellme.getText(8 - j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.slug`)
        .and.equal(tellme.getSlug(8 - j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteRootSlug`)
        .and.equal(tellme.getSlug(8));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteChildSlug`)
        .and.equal(tellme.getSlug(7));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeParentSlug`)
        .and.equal(tellme.getSlug(i));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeGrandParentSlug`)
        .and.equal(tellme.getSlug(8));
    }
  }
};

const SimpleChildSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
});

const SimpleParentSchema = new mongoose.Schema({
  simpleParent: { type: String },
  title: { type: String },
  slug: { type: String, slug: 'title' },
  child: SimpleChildSchema,
  children: [SimpleChildSchema],
});

const UniqueChildSchema = new mongoose.Schema({
  title: { type: String },
  slugShort: { type: String, slug: 'title', unique:true },
  slugCounter: { type: String, slug: 'title', unique:true, slugPaddingSize },
});

const UniqueParentSchema = new mongoose.Schema({
  n: { type: Number },
  title: { type: String },
  slugShort: { type: String, slug: 'title', unique:true },
  slugCounter: { type: String, slug: 'title', unique:true, slugPaddingSize },
  child: UniqueChildSchema,
  children: [UniqueChildSchema],
});

module.exports = {
  SubChildSchema,
  ChildSchema,
  ParentSchema,
  SimpleChildSchema,
  SimpleParentSchema,
  UniqueChildSchema,
  UniqueParentSchema,
};
