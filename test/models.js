'use strict';
const mongoose = require('mongoose');
const slug_padding_size = 4,
  nIterations = 100;
const slugGenerator = require('../.');
const options = {
  separator: '-',
  lang: 'en',
  truncate: 120,
};
mongoose.plugin(slugGenerator, options);

const ResourceShortId = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: { type: String, unique: true, slug: 'title' },
});

const ResourceCounter = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: {
    type: String,
    unique: true,
    slug_padding_size: slug_padding_size,
    slug: 'title',
  },
});

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
});

const ResourcePermanent = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  titleSlug: { type: String, slug: 'title', permanent: true },
  subtitleSlug: {
    type: String,
    slug: 'subtitle',
    permanent: true,
    slug_padding_size: slug_padding_size,
  },
});

const HooksSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  slugNoSave: { type: String, slug: 'title', on: { save: false } },
  slugNoUpdate: { type: String, slug: 'title', on: { update: false } },
  slugNoUpdateOne: { type: String, slug: 'title', on: { updateOne: false } },
  slugNoUpdateMany: { type: String, slug: 'title', on: { updateMany: false } },
  slugNoFindOneAndUpdate: {
    type: String,
    slug: 'title',
    on: { findOneAndUpdate: false },
  },
});

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

const SubChildSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  absoluteRootSlug: { type: String, slug: '/title' },
  absoluteChildSlug: { type: String, slug: '/child.title' },
  relativeParentSlug: { type: String, slug: ':title' },// child's title
  relativeGrandParentSlug: { type: String, slug: '::title' },//parent's title
});

const ChildSchema = new mongoose.Schema({
  title: { type: String },
  subChild: SubChildSchema,
  subChildren: [SubChildSchema],
  slug: { type: String, slug: 'title' },
  subChildSlug: { type: String, slug: 'subChild.title' },
  absoluteSlug: { type: String, slug: '/child.title' },
  absoluteRootSlug: { type: String, slug: '/title' },
  relativeParentSlug: { type: String, slug: ':title' },//Parent
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

const InlineUniqueSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, unique: true, slug: 'title' },
  list: { type: Array },
  child: {
    title: { type: String },
    slug: { type: String, slug: 'title', unique: true },
  },
  children: [
    {
      title: { type: String, unique: true },
      slug: { type: String, /*slug: 'title',*/ unique: true },
    },
  ],
});

const ShortId = mongoose.model('ResourceShortId', ResourceShortId);
const Counter = mongoose.model('ResourceCounter', ResourceCounter);
const GroupedUniqueCounter = mongoose.model(
  'ResourceGroupedUniqueCounter',
  ResourceGroupedUniqueCounter
);
const GroupedUniqueShortId = mongoose.model(
  'ResourceGroupedUniqueShortId',
  ResourceGroupedUniqueShortId
);
const Permanent = mongoose.model('ResourcePermanent', ResourcePermanent);
const Hook = mongoose.model('HooksSchema', HooksSchema);
const SubChild = mongoose.model('SubChildSchema', SubChildSchema);
const Child = mongoose.model('ChildSchema', ChildSchema);
const Parent = mongoose.model('ParentSchema', ParentSchema);
const Inline = mongoose.model('InlineSchema', InlineSchema);
const InlineUnique = mongoose.model('InlineUniqueSchema', InlineUniqueSchema);
const SimpleChild = mongoose.model('SimpleChildSchema', SimpleChildSchema);
const SimpleParent = mongoose.model('SimpleParentSchema', SimpleParentSchema);

module.exports = {
  options,
  nIterations,
  slug_padding_size,
  ShortId,
  Counter,
  GroupedUniqueCounter,
  GroupedUniqueShortId,
  Permanent,
  Hook,
  SubChild,
  SimpleChild,
  SimpleParent,
  Child,
  Parent,
  Inline,
  InlineUnique,
};
