'use strict';
const _ = require('deepdash')(require('lodash'));
const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');
const tellme = require('./../tellme');

const InlineSchema = new mongoose.Schema({
  // root title
  title: { type: String },
  // root slug with relative path to root title
  slug: { type: String, slug: 'title' },
  // root slug with  absolute path to root title
  absoluteSlug: { type: String, slug: '/title' },
  // root slug with relative path to child title
  childSlug: { type: String, slug: 'child.title' },
  // root slug with absolute path to child title
  absoluteChildSlug: { type: String, slug: '/child.title' },
  // root slug with relative path to child's subchild title
  subChildSlug: { type: String, slug: 'child.subChild.title' },
  // root slug with relative path to the title of first children array element
  childrenSlug0: { type: String, slug: 'children.0.title' },
  // root slug with relative path to the title of 5th children array element
  childrenSlug4: { type: String, slug: 'children.4.title' },
  // root slug with relative path to the title of 4th subChildren' element of first children array element
  subChildrenSlug3: { type: String, slug: 'children.0.subChildren.3.title' },
  // root slug with relative path to the title of 8th subChildren' element of first children array element
  subChildrenSlug7: { type: String, slug: 'children.0.subChildren.7.title' },
  subChildrenSlug5SubChild: {
    type: String,
    // well, you see)
    slug: 'children.0.subChildren.5.subChild.title',
  },
  subChildrenSlug2SubChild: {
    type: String,
    slug: 'children.0.subChildren.2.subChild.title',
  },
  child: {
    title: { type: String },
    // inside nested doc relative path starts from current object,
    // so this is slug for child's title
    slug: { type: String, slug: 'title' },
    // absolute variant of path above, starting from root
    absoluteSlug: { type: String, slug: '/child.title' },
    // child's slug field generated for root title, absolute path
    absoluteParentSlug: { type: String, slug: '/title' },
    // relative path with parent reference `:`, so here root title will be used again.
    relativeParentSlug: { type: String, slug: ':title' },
    subChild: {
      title: { type: String },
      // relative path to the title of current nested doc,
      // in absolute form it wil be /child.subChild.title
      slug: { type: String, slug: 'title' },
      // absolute path to the root title
      absoluteParentSlug: { type: String, slug: '/title' },
      // relative path to the parent title, /child.title in this case
      relativeParentSlug: { type: String, slug: ':title' },
      // parent of the parent is root, so ::title = /title here
      relativeGrandParentSlug: { type: String, slug: '::title' },
    },
  },
  // nested arrays work too
  children: [
    {
      title: { type: String },
      // title of current array element
      slug: { type: String, slug: 'title' },
      // root title
      absoluteRootSlug: { type: String, slug: '/title' },
      // child's title
      absoluteChildSlug: { type: String, slug: '/child.title' },
      // root title. Array itself not counted as a parent and skipped.
      relativeRootSlug: { type: String, slug: ':title' },
      // absolute path to 4th element of array
      absoluteSiblingSlug: { type: String, slug: '/children.3.title' },
      // same in relative form for 5th element
      relativeSiblingSlug: { type: String, slug: ':children.4.title' },
      subChild: {
        title: { type: String },
        // current title
        slug: { type: String, slug: 'title' },
        // root title
        absoluteParentSlug: { type: String, slug: '/title' },
        // child title
        absoluteChildSlug: { type: String, slug: '/child.title' },
        // title of current array element, because its a parent of this subChild
        relativeParentSlug: { type: String, slug: ':title' },
        // two parents up is a root
        relativeGrandParentSlug: { type: String, slug: '::title' },
      },
      // arrays nested into array elements, welcome to the depth
      subChildren: [
        {
          title: { type: String },
          // current title
          slug: { type: String, slug: 'title' },
          // root title
          absoluteRootSlug: { type: String, slug: '/title' },
          // child title
          absoluteChildSlug: { type: String, slug: '/child.title' },
          // :--> children :--> root
          relativeRootSlug: { type: String, slug: '::title' },
          absoluteSiblingSlug: {
            type: String,
            // I don't know who will need it but it works, check yourself in /test
            slug: '/children.0.subChildren.5.title',
          },
          // relative ref to another subChildren's element from current children's element
          relativeSiblingSlug: { type: String, slug: ':subChildren.6.title' },
          // hope you got it.
          subChild: {
            title: { type: String },
            slug: { type: String, slug: 'title' },
            absoluteParentSlug: { type: String, slug: '/title' },
            absoluteChildSlug: { type: String, slug: '/child.title' },
            relativeParentSlug: { type: String, slug: ':title' },
            relativeGrandParentSlug: { type: String, slug: '::title' },
          },
        },
      ],
    },
  ],
});

InlineSchema.statics.getNewDoc = function() {
  return {
    title: tellme.getText(0),
    child: {
      title: tellme.getText(1),
      subChild: {
        title: tellme.getText(7),
      },
    },
    children: [
      {
        title: tellme.getText(0),
        subChild: {
          title: tellme.getText(8),
        },
        subChildren: [
          {
            title: tellme.getText(0),
            subChild: {
              title: tellme.getText(8),
            },
          },
          {
            title: tellme.getText(1),
            subChild: {
              title: tellme.getText(7),
            },
          },
          {
            title: tellme.getText(2),
            subChild: {
              title: tellme.getText(6),
            },
          },
          {
            title: tellme.getText(3),
            subChild: {
              title: tellme.getText(5),
            },
          },
          {
            title: tellme.getText(4),
            subChild: {
              title: tellme.getText(4),
            },
          },
          {
            title: tellme.getText(5),
            subChild: {
              title: tellme.getText(3),
            },
          },
          {
            title: tellme.getText(6),
            subChild: {
              title: tellme.getText(2),
            },
          },
          {
            title: tellme.getText(7),
            subChild: {
              title: tellme.getText(1),
            },
          },
          {
            title: tellme.getText(8),
            subChild: {
              title: tellme.getText(0),
            },
          },
        ],
      },
      {
        title: tellme.getText(1),
        subChild: {
          title: tellme.getText(7),
        },
      },
      {
        title: tellme.getText(2),
        subChild: {
          title: tellme.getText(6),
        },
      },
      {
        title: tellme.getText(3),
        subChild: {
          title: tellme.getText(5),
        },
      },
      {
        title: tellme.getText(4),
        subChild: {
          title: tellme.getText(4),
        },
      },
      {
        title: tellme.getText(5),
        subChild: {
          title: tellme.getText(3),
        },
      },
      {
        title: tellme.getText(6),
        subChild: {
          title: tellme.getText(2),
        },
      },
      {
        title: tellme.getText(7),
        subChild: {
          title: tellme.getText(1),
        },
      },
      {
        title: tellme.getText(8),
        subChild: {
          title: tellme.getText(0),
        },
      },
    ],
  };
};

InlineSchema.statics.testNewDoc = function(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(0));
  doc.should.have.property('slug').and.equal(tellme.getSlug(0));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(0));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(0));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(3));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(7));
  doc.should.have
    .property('subChildrenSlug5SubChild')
    .and.equal(tellme.getSlug(3));
  doc.should.have
    .property('subChildrenSlug2SubChild')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.absoluteParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(7));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.absoluteParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(0));
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children[${i}].title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`children[${i}].slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[${i}].absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[${i}].absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[${i}].relativeRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[${i}].absoluteSiblingSlug`)
      .and.equal(tellme.getSlug(3));
    doc.should.have.nested
      .property(`children[${i}].relativeSiblingSlug`)
      .and.equal(tellme.getSlug(4));
    doc.should.have.nested
      .property(`children[${i}].subChild.title`)
      .and.equal(tellme.getText(8 - i));
    doc.should.have.nested
      .property(`children[${i}].subChild.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children[${i}].subChild.absoluteParentSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[${i}].subChild.absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeParentSlug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(0));
  }
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].relativeRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].absoluteSiblingSlug`)
      .and.equal(tellme.getSlug(5));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].relativeSiblingSlug`)
      .and.equal(tellme.getSlug(6));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.title`)
      .and.equal(tellme.getText(8 - i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.absoluteParentSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.relativeParentSlug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(0));
  }
};

InlineSchema.statics.changeDocPaths = function(doc) {
  doc = this.changeDoc(doc);
  // console.log(doc);
  doc = _(doc)
    .indexate({ leafsOnly: true })
    .mapKeys((v, f) => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
    .pickBy((v, k) => v !== undefined && !_.isEqual(v,{}) && !_.isEqual(v,[]))
    .value();
  // console.log(doc);

  return { $set: doc };
};
InlineSchema.statics.changeDoc = function(doc) {
  if (!doc.child) doc.child = {};
  if (!doc.child.subChild) doc.child.subChild = {};
  if (!doc.children) doc.children = [];
  if (!doc.children[0]) doc.children[0] = {};
  if (!doc.children[3]) doc.children[3] = {};
  if (!doc.children[4]) doc.children[4] = {};
  if (!doc.children[0].subChildren) doc.children[0].subChildren = [];
  if (!doc.children[0].subChildren[2]) doc.children[0].subChildren[2] = {};
  if (!doc.children[0].subChildren[2].subChild)
    doc.children[0].subChildren[2].subChild = {};
  if (!doc.children[0].subChildren[3]) doc.children[0].subChildren[3] = {};
  if (!doc.children[0].subChildren[5]) doc.children[0].subChildren[5] = {};
  if (!doc.children[0].subChildren[5].subChild)
    doc.children[0].subChildren[5].subChild = {};
  if (!doc.children[0].subChildren[6]) doc.children[0].subChildren[6] = {};
  if (!doc.children[0].subChildren[7]) doc.children[0].subChildren[7] = {};

  if (!doc.children[0].subChildren[7].subChild)
    doc.children[0].subChildren[7].subChild = {};

  if (!doc.children[7]) doc.children[7] = {};
  // if (!doc.children[7].subChildren) doc.children[7].subChildren = [];
  if (!doc.children[7].subChild) doc.children[7].subChild = {};

  doc.title = tellme.getText(8);
  doc.child.title = tellme.getText(7);
  doc.child.subChild.title = tellme.getText(6);
  doc.children[0].title = tellme.getText(4);
  doc.children[3].title = tellme.getText(7);
  doc.children[4].title = tellme.getText(0);
  doc.children[0].subChildren[3].title = tellme.getText(8);
  doc.children[0].subChildren[7].title = tellme.getText(2);
  doc.children[0].subChildren[5].title = tellme.getText(4);
  doc.children[0].subChildren[6].title = tellme.getText(1);
  doc.children[0].subChildren[5].subChild.title = tellme.getText(2);
  doc.children[0].subChildren[2].subChild.title = tellme.getText(4);
  doc.children[7].subChild.title = tellme.getText(3);
  return doc;
};

InlineSchema.statics.testChangedDoc = function(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(8));
  doc.should.have.property('slug').and.equal(tellme.getSlug(8));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(8));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property(`children[0].title`)
    .and.equal(tellme.getText(4));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(4));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(0));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(8));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(2));
  doc.should.have
    .property('subChildrenSlug5SubChild')
    .and.equal(tellme.getSlug(2));
  doc.should.have
    .property('subChildrenSlug2SubChild')
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested.property('child.title').and.equal(tellme.getText(7));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.absoluteParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(6));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.subChild.absoluteParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(8));

  doc.should.have.nested
    .property(`children[0].slug`)
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested
    .property(`children[0].absoluteRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].relativeRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].absoluteSiblingSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].relativeSiblingSlug`)
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property(`children[7].subChild.title`)
    .and.equal(tellme.getText(3));
  doc.should.have.nested
    .property(`children[7].subChild.slug`)
    .and.equal(tellme.getSlug(3));
  doc.should.have.nested
    .property(`children[0].subChild.absoluteParentSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChild.absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].subChild.relativeParentSlug`)
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested
    .property(`children[0].subChild.relativeGrandParentSlug`)
    .and.equal(tellme.getSlug(8));

  doc.should.have.nested
    .property(`children[0].subChildren[3].title`)
    .and.equal(tellme.getText(8));
  doc.should.have.nested
    .property(`children[0].subChildren[7].title`)
    .and.equal(tellme.getText(2));
  doc.should.have.nested
    .property(`children[0].subChildren[3].slug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[7].slug`)
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property(`children[0].subChildren[3].absoluteRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[7].absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].subChildren[3].relativeRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[3].absoluteSiblingSlug`)
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested
    .property(`children[0].subChildren[7].relativeSiblingSlug`)
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property(`children[0].subChildren[5].subChild.title`)
    .and.equal(tellme.getText(2));
  doc.should.have.nested
    .property(`children[0].subChildren[5].subChild.slug`)
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property(`children[0].subChildren[2].subChild.absoluteParentSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[7].subChild.absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].subChildren[3].subChild.relativeParentSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChild.relativeGrandParentSlug`)
    .and.equal(tellme.getSlug(8));
};

module.exports = InlineSchema;
