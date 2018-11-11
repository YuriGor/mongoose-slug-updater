'use strict';
const mongoose = require('mongoose');
const { options, slug_padding_size, nIterations } = require('./../options');
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
  UniqueParentSchema
} = require('./NestedSchema.js');
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
  forcedSlug: { type: String, slug: ['subtitle'], force_id: true },
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
  UniqueParent
};
