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
});

const ChildSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, /*unique: true,*/ slug: 'title' },
});

const ParentSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, unique: true, slug: 'title' },
  list: { type: Array },
  singleChild: ChildSchema,
  children: [ChildSchema],
  inlineChild: {
    title: { type: String },
    slug: { type: String, slug: 'title' },
  },
  inlineChildren: [
    {
      title: { type: String },
      slug: { type: String, slug: 'title' },
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
const Child = mongoose.model('ChildSchema', ChildSchema);
const Parent = mongoose.model('ParentSchema', ParentSchema);

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
  Child,
  Parent,
};
