'use strict';
const mongoose = require('mongoose');
const { options, slugPaddingSize, nIterations } = require('./../options');
const slugGenerator = require('../../.');
mongoose.plugin(slugGenerator, options);

const {
  InlineSchema,
  SimpleInlineSchema,
  InlineUniqueSchema,
} = require('./InlineSchema.js');
const {
  SubChildSchema,
  ChildSchema,
  ParentSchema,
  SimpleChildSchema,
  SimpleParentSchema,
  UniqueChildSchema,
  UniqueParentSchema,
} = require('./NestedSchema.js');

const {
  ResourceGroupedUniqueCounter,
  ResourceGroupedUniqueShortId,
  UniqueNestedSchema,
} = require('./Unique.js');

const Book = require('./Book');
const CompoundUnique = new mongoose.Schema({
  type: { type: String },
  name: { type: String },
});
CompoundUnique.index(
  {
    type: 1,
    name: 1,
  },
  { unique: true }
);

const ResourceShortId = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: { type: String, unique: true, slug: 'title' },
  forcedSlug: { type: String, slug: ['subtitle'], forceIdSlug: true },
});

const ResourceCounter = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: {
    type: String,
    unique: true,
    slugPaddingSize: slugPaddingSize,
    slug: 'title',
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
    slugPaddingSize: slugPaddingSize,
  },
});

const HooksSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  slugNoSave: { type: String, slug: 'title', slugOn: { save: false } },
  slugNoUpdate: { type: String, slug: 'title', slugOn: { update: false } },
  slugNoUpdateOne: {
    type: String,
    slug: 'title',
    slugOn: { updateOne: false },
  },
  slugNoUpdateMany: {
    type: String,
    slug: 'title',
    slugOn: { updateMany: false },
  },
  slugNoFindOneAndUpdate: {
    type: String,
    slug: 'title',
    slugOn: { findOneAndUpdate: false },
  },
});

const CompoundU = mongoose.model('CompoundUnique', CompoundUnique);
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
const SimpleInline = mongoose.model('SimpleInlineSchema', SimpleInlineSchema);
const InlineUnique = mongoose.model('InlineUniqueSchema', InlineUniqueSchema);
const SimpleChild = mongoose.model('SimpleChildSchema', SimpleChildSchema);
const SimpleParent = mongoose.model('SimpleParentSchema', SimpleParentSchema);
const UniqueChild = mongoose.model('UniqueChildSchema', UniqueChildSchema);
const UniqueParent = mongoose.model('UniqueParentSchema', UniqueParentSchema);
const UniqueNested = mongoose.model('UniqueNestedSchema', UniqueNestedSchema);
module.exports = {
  CompoundU,
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
  SimpleInline,
  InlineUnique,
  UniqueChild,
  UniqueParent,
  UniqueNested,
  Book
};
