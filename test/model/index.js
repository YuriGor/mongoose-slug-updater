'use strict';
const mongoose = require('mongoose');
const { options, slug_padding_size,nIterations } = require('./../options');
const slugGenerator = require('../../.');
mongoose.plugin(slugGenerator, options);

const InlineSchema = require('./InlineSchema.js');
const {SubChildSchema,ChildSchema,ParentSchema} = require('./NestedSchema.js');
const CompoundUnique = new mongoose.Schema({
  type:{type: String},
  name:{type: String},
});
CompoundUnique.index({
  type:1,
  name:1,
},{unique: true});

const ResourceShortId = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: { type: String, unique: true, slug: 'title' },
  forcedSlug: { type:String, slug: ['subtitle'], force_id:true }
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


const SimpleInlineSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  child:{
    title: { type: String },
    slug: { type: String, slug: 'title' }
  },
  children:[
    {
      title: { type: String },
      slug: { type: String, slug: 'title' }
    }
  ]
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
const CompoundU = mongoose.model('CompoundUnique',CompoundUnique);
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
};
