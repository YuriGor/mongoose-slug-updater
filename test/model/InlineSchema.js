const _ = require('deepdash')(require('lodash'));
const mongoose = require('mongoose');
const chai = require('chai');

const should = chai.should();
const assert = require('assert');
const tellme = require('../tellme');
const { options, slugPaddingSize } = require('../options');

const InlineSchema = new mongoose.Schema({
  n: { type: Number },
  // root title
  title: { type: String },
  // root slug with relative path to root title
  slug: { type: String, slug: 'title' },
  slugShort: { type: String, slug: 'title', unique: true },
  slugCounter: { type: String, slug: 'title', unique: true, slugPaddingSize },
  // root slug with  absolute path to root title
  absoluteSlug: { type: String, slug: '/title' },
  // root slug with relative path to child title
  childSlug: { type: String, slug: 'child.title' },
  // root slug with absolute path to child title
  absoluteChildSlug: { type: String, slug: '/child.title' },
  absoluteChildSlugShort: {
    type: String,
    slug: '/child.title',
    unique: true,
  },
  absoluteChildSlugCounter: {
    type: String,
    slug: '/child.title',
    unique: true,
    slugPaddingSize,
  },
  // root slug with relative path to child's subchild title
  subChildSlug: { type: String, slug: 'child.subChild.title' },
  subChildSlugShort: {
    type: String,
    slug: 'child.subChild.title',
    unique: true,
  },
  // root slug with relative path to the title of first children array element
  childrenSlug0: { type: String, slug: 'children.0.title' },
  // root slug with relative path to the title of 5th children array element
  childrenSlug4: { type: String, slug: 'children.4.title' },
  childrenSlug4Short: { type: String, slug: 'children.4.title', unique: true },
  childrenSlug4Counter: {
    type: String,
    slug: 'children.4.title',
    unique: true,
    slugPaddingSize,
  },
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
  subChildrenSlug2SubChildShort: {
    type: String,
    slug: 'children.0.subChildren.2.subChild.title',
    unique: true,
  },
  subChildrenSlug2SubChildCounter: {
    type: String,
    slug: 'children.0.subChildren.2.subChild.title',
    unique: true,
    slugPaddingSize,
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
        relativeParentSlugShort: { type: String, slug: ':title', unique: true },
        relativeParentSlugCounter: {
          type: String,
          slug: ':title',
          unique: true,
          slugPaddingSize,
        },
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

InlineSchema.statics.getNewDoc = function (n) {
  const res = {
    n: n || 0,
    title: tellme.getText(0),
    child: {
      title: tellme.getText(1),
      subChild: {
        title: tellme.getText(7),
      },
    },
    children: [],
  };
  for (let i = 0; i < 9; i++) {
    res.children[i] = {
      title: tellme.getText(i),
      subChild: {
        title: tellme.getText(8 - i),
      },
      subChildren: [],
    };
    for (let j = 0; j < 9; j++) {
      res.children[i].subChildren[j] = {
        title: tellme.getText(j),
        subChild: {
          title: tellme.getText(8 - j),
        },
      };
    }
  }
  return res;
};

InlineSchema.statics.testNewDoc = function (doc, n) {
  n = n || 0;
  doc.should.have.property('n').and.equal(n);
  doc.should.have.property('title').and.equal(tellme.getText(0));
  doc.should.have.property('slug').and.equal(tellme.getSlug(0));
  doc.should.have.property('slugShort').and.match(tellme.getShortRegex(0, n));
  doc.should.have.property('slugCounter').and.equal(tellme.getCounterSlug(0, n));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(0));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('absoluteChildSlugShort').and.match(tellme.getShortRegex(1, n));
  doc.should.have.property('absoluteChildSlugCounter').and.equal(tellme.getCounterSlug(1, n));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(0));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('childrenSlug4Short').and.match(tellme.getShortRegex(4, n));
  doc.should.have.property('childrenSlug4Counter').and.equal(tellme.getCounterSlug(4, n));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(3));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(7));
  doc.should.have.property('subChildrenSlug5SubChild').and.equal(tellme.getSlug(3));
  doc.should.have.property('subChildrenSlug2SubChild').and.equal(tellme.getSlug(6));
  doc.should.have.property('subChildrenSlug2SubChildShort').and.match(tellme.getShortRegex(6, n));
  doc.should.have
    .property('subChildrenSlug2SubChildCounter')
    .and.equal(tellme.getCounterSlug(6, n));

  doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
  doc.should.have.nested.property('child.absoluteSlug').and.equal(tellme.getSlug(1));
  doc.should.have.nested.property('child.absoluteParentSlug').and.equal(tellme.getSlug(0));
  doc.should.have.nested.property('child.relativeParentSlug').and.equal(tellme.getSlug(0));
  doc.should.have.nested.property('child.subChild.title').and.equal(tellme.getText(7));
  doc.should.have.nested.property('child.subChild.slug').and.equal(tellme.getSlug(7));
  doc.should.have.nested.property('child.subChild.absoluteParentSlug').and.equal(tellme.getSlug(0));
  doc.should.have.nested.property('child.subChild.relativeParentSlug').and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(0));
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested.property(`children[${i}].title`).and.equal(tellme.getText(i));
    doc.should.have.nested.property(`children[${i}].slug`).and.equal(tellme.getSlug(i));
    doc.should.have.nested.property(`children[${i}].absoluteRootSlug`).and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[${i}].absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested.property(`children[${i}].relativeRootSlug`).and.equal(tellme.getSlug(0));
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
      .property(`children[${i}].subChild.relativeParentSlugShort`)
      .and.match(tellme.getShortRegex(i, n));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeParentSlugCounter`)
      .and.equal(tellme.getCounterSlug(i, n));

    doc.should.have.nested
      .property(`children[${i}].subChild.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(0));

    for (let j = 0; j < 9; j++) {
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].title`)
        .and.equal(tellme.getText(j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].slug`)
        .and.equal(tellme.getSlug(j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].absoluteRootSlug`)
        .and.equal(tellme.getSlug(0));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].absoluteChildSlug`)
        .and.equal(tellme.getSlug(1));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].relativeRootSlug`)
        .and.equal(tellme.getSlug(0));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].absoluteSiblingSlug`)
        .and.equal(tellme.getSlug(5));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].relativeSiblingSlug`)
        .and.equal(tellme.getSlug(6));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.title`)
        .and.equal(tellme.getText(8 - j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.slug`)
        .and.equal(tellme.getSlug(8 - j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.absoluteParentSlug`)
        .and.equal(tellme.getSlug(0));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.absoluteChildSlug`)
        .and.equal(tellme.getSlug(1));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.relativeParentSlug`)
        .and.equal(tellme.getSlug(j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.relativeGrandParentSlug`)
        .and.equal(tellme.getSlug(i));
    }
  }
};

InlineSchema.statics.changeDocPaths = function (doc) {
  doc = this.changeDoc(doc);
  // console.log(doc);
  doc = _(doc)
    .index({ leafsOnly: true })
    .mapKeys((v, f) => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
    .pickBy((v, k) => v !== undefined && !_.isEqual(v, {}) && !_.isEqual(v, []))
    .value();
  // console.log(doc);

  return { $set: doc };
};
InlineSchema.statics.changeDoc = function (doc) {
  const res = {
    title: tellme.getText(8),
    child: {
      title: tellme.getText(7),
      subChild: {
        title: tellme.getText(1),
      },
    },
    children: [],
  };
  for (let i = 0; i < 9; i++) {
    res.children[i] = {
      title: tellme.getText(8 - i),
      subChild: {
        title: tellme.getText(i),
      },
      subChildren: [],
    };
    for (let j = 0; j < 9; j++) {
      res.children[i].subChildren[j] = {
        title: tellme.getText(8 - j),
        subChild: {
          title: tellme.getText(j),
        },
      };
    }
  }

  return _.merge(doc, res);
};

InlineSchema.statics.testChangedDoc = function (doc, n = 0) {
  n = n || 0;
  doc.should.have.property('n').and.equal(n);
  doc.should.have.property('title').and.equal(tellme.getText(8));
  doc.should.have.property('slug').and.equal(tellme.getSlug(8));
  doc.should.have.property('slugShort').and.match(tellme.getShortRegex(8, n));
  doc.should.have.property('slugCounter').and.equal(tellme.getCounterSlug(8, n));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(8));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('absoluteChildSlugShort').and.match(tellme.getShortRegex(7, n));
  doc.should.have.property('absoluteChildSlugCounter').and.equal(tellme.getCounterSlug(7, n));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(8));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('childrenSlug4Short').and.match(tellme.getShortRegex(4, n));
  doc.should.have.property('childrenSlug4Counter').and.equal(tellme.getCounterSlug(4, n));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(5));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(1));
  doc.should.have.property('subChildrenSlug5SubChild').and.equal(tellme.getSlug(5));
  doc.should.have.property('subChildrenSlug2SubChild').and.equal(tellme.getSlug(2));
  doc.should.have.property('subChildrenSlug2SubChildShort').and.match(tellme.getShortRegex(2, n));
  doc.should.have
    .property('subChildrenSlug2SubChildCounter')
    .and.equal(tellme.getCounterSlug(2, n));

  doc.should.have.nested.property('child.title').and.equal(tellme.getText(7));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(7));
  doc.should.have.nested.property('child.absoluteSlug').and.equal(tellme.getSlug(7));
  doc.should.have.nested.property('child.absoluteParentSlug').and.equal(tellme.getSlug(8));
  doc.should.have.nested.property('child.relativeParentSlug').and.equal(tellme.getSlug(8));
  doc.should.have.nested.property('child.subChild.title').and.equal(tellme.getText(1));
  doc.should.have.nested.property('child.subChild.slug').and.equal(tellme.getSlug(1));
  doc.should.have.nested.property('child.subChild.absoluteParentSlug').and.equal(tellme.getSlug(8));
  doc.should.have.nested.property('child.subChild.relativeParentSlug').and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(8));
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested.property(`children[${i}].title`).and.equal(tellme.getText(8 - i));
    doc.should.have.nested.property(`children[${i}].slug`).and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested.property(`children[${i}].absoluteRootSlug`).and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`children[${i}].absoluteChildSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested.property(`children[${i}].relativeRootSlug`).and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`children[${i}].absoluteSiblingSlug`)
      .and.equal(tellme.getSlug(5));
    doc.should.have.nested
      .property(`children[${i}].relativeSiblingSlug`)
      .and.equal(tellme.getSlug(4));
    doc.should.have.nested.property(`children[${i}].subChild.title`).and.equal(tellme.getText(i));
    doc.should.have.nested.property(`children[${i}].subChild.slug`).and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[${i}].subChild.absoluteParentSlug`)
      .and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`children[${i}].subChild.absoluteChildSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeParentSlug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeParentSlugCounter`)
      .and.equal(tellme.getCounterSlug(8 - i, n));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeParentSlugShort`)
      .and.match(tellme.getShortRegex(8 - i, n));

    doc.should.have.nested
      .property(`children[${i}].subChild.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(8));

    for (let j = 0; j < 9; j++) {
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].title`)
        .and.equal(tellme.getText(8 - j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].slug`)
        .and.equal(tellme.getSlug(8 - j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].absoluteRootSlug`)
        .and.equal(tellme.getSlug(8));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].absoluteChildSlug`)
        .and.equal(tellme.getSlug(7));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].relativeRootSlug`)
        .and.equal(tellme.getSlug(8));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].absoluteSiblingSlug`)
        .and.equal(tellme.getSlug(3));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].relativeSiblingSlug`)
        .and.equal(tellme.getSlug(2));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.title`)
        .and.equal(tellme.getText(j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.slug`)
        .and.equal(tellme.getSlug(j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.absoluteParentSlug`)
        .and.equal(tellme.getSlug(8));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.absoluteChildSlug`)
        .and.equal(tellme.getSlug(7));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.relativeParentSlug`)
        .and.equal(tellme.getSlug(8 - j));
      doc.should.have.nested
        .property(`children[${i}].subChildren[${j}].subChild.relativeGrandParentSlug`)
        .and.equal(tellme.getSlug(8 - i));
    }
  }
};
const SimpleInlineSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  child: {
    title: { type: String },
    slug: { type: String, slug: 'title' },
  },
  children: [
    {
      title: { type: String },
      slug: { type: String, slug: 'title' },
    },
  ],
});

const InlineUniqueSchema = new mongoose.Schema({
  n: { type: Number },
  title: { type: String },
  slugShort: { type: String, unique: true, slug: 'title' },
  slugCounter: { type: String, slug: 'title', unique: true, slugPaddingSize },
  child: {
    title: { type: String },
    slugShort: { type: String, slug: 'title', unique: true },
    slugCounter: {
      type: String,
      slug: 'title',
      unique: true,
      slugPaddingSize,
    },
  },
  children: [
    {
      title: { type: String },
      slugShort: { type: String, slug: 'title', unique: true },
      slugCounter: {
        type: String,
        slug: 'title',
        unique: true,
        slugPaddingSize,
      },
    },
  ],
});

InlineUniqueSchema.statics.getNewDoc = function (n) {
  const res = {
    n,
    title: tellme.getText(0),
    child: {
      title: tellme.getText(1),
    },
    children: [],
  };
  for (let i = 0; i < 9; i++) {
    res.children.push({ title: tellme.getText(8 - i) });
  }
  return res;
};

InlineUniqueSchema.statics.testNewDoc = function (doc, n) {
  doc.should.have.property('title').and.equal(tellme.getText(0));
  doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
  if (!n) {
    doc.should.have.property('slugShort').and.equal(tellme.getSlug(0));
    doc.should.have.property('slugCounter').and.equal(tellme.getSlug(0));
    doc.should.have.nested.property('child.slugShort').and.equal(tellme.getSlug(1));
    doc.should.have.nested.property('child.slugCounter').and.equal(tellme.getSlug(1));
  } else {
    doc.should.have.property('slugShort').and.match(tellme.getShortRegex(0));
    doc.should.have.property('slugCounter').and.equal(tellme.getCounterSlug(0, n));
    doc.should.have.nested.property('child.slugShort').and.match(tellme.getShortRegex(1));
    doc.should.have.nested.property('child.slugCounter').and.equal(tellme.getCounterSlug(1, n));
  }
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested.property(`children[${i}].title`).and.equal(tellme.getText(8 - i));
    if (!n) {
      doc.should.have.nested.property(`children[${i}].slugShort`).and.equal(tellme.getSlug(8 - i));
      doc.should.have.nested
        .property(`children[${i}].slugCounter`)
        .and.equal(tellme.getSlug(8 - i));
    } else {
      doc.should.have.nested
        .property(`children[${i}].slugShort`)
        .and.match(tellme.getShortRegex(8 - i));
      doc.should.have.nested
        .property(`children[${i}].slugCounter`)
        .and.equal(tellme.getCounterSlug(8 - i, n));
    }
  }
};

InlineUniqueSchema.statics.changeDocPaths = function (doc) {
  doc = this.changeDoc(doc);
  // console.log(doc);
  doc = _(doc)
    .index({ leafsOnly: true })
    .mapKeys((v, f) => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
    .pickBy((v, k) => v !== undefined && !_.isEqual(v, {}) && !_.isEqual(v, []))
    .value();
  // console.log(doc);

  return { $set: doc };
};

InlineUniqueSchema.statics.changeDoc = function (doc) {
  const res = {
    title: tellme.getText(8),
    child: {
      title: tellme.getText(7),
    },
    children: [],
  };
  for (let i = 0; i < 9; i++) {
    res.children.push({ title: tellme.getText(i) });
  }
  return _.merge(doc, res);
};

InlineUniqueSchema.statics.testChangedDoc = function (doc, n, nIterations = 0) {
  doc.should.have.property('title').and.equal(tellme.getText(8));
  doc.should.have.nested.property('child.title').and.equal(tellme.getText(7));
  doc.should.have.property('slugShort').and.match(tellme.getShortRegex(8, n));
  doc.should.have.property('slugCounter').and.equal(tellme.getCounterSlug(8, n));
  doc.should.have.nested.property('child.slugShort').and.match(tellme.getShortRegex(7, n));
  doc.should.have.nested.property('child.slugCounter').and.equal(tellme.getCounterSlug(7, n));

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested.property(`children[${i}].title`).and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`children[${i}].slugCounter`)
      .and.equal(tellme.getCounterSlug(i, (i != 4 ? nIterations : 0) + n));
    doc.should.have.nested
      .property(`children[${i}].slugShort`)
      .and.match(tellme.getShortRegex(i, (i != 4 ? nIterations : 0) + n));
    // console.log(`${i},${nIterations}`);
  }
};

module.exports = {
  InlineSchema,
  SimpleInlineSchema,
  InlineUniqueSchema,
};
