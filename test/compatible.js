'use strict';
const mongoose = require('mongoose');
const { options, slugPaddingSize, nIterations } = require('./options');
const slugGenerator = require('../.');
options.backwardCompatible=true;
mongoose.plugin(slugGenerator, options);

const CompatResourceShortId = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String, slug: {field:'wrong'} },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: { type: String, unique_slug: true, slug: 'title' },
  forcedSlug: { type: String, slug: ['subtitle'], force_id: true },
});

const CompatResourceCounter = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: {
    type: String,
    unique: true,
    slug_padding_size: slugPaddingSize,
    slug: 'title',
  },
});

const CompatResourceGroupedUniqueCounter = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  group: { type: String },
  uniqueSlug: {
    type: String,
    uniqueGroup: ['group'],
    slug_padding_size: slugPaddingSize,
    slug: 'title',
    index: true,
    on: { save: true }
  },
  children: [
    {
      title: { type: String },
      globalGroupSlug: {
        type: String,
        uniqueGroup: ['/group'],
        slug_padding_size: slugPaddingSize,
        slug: 'title',
        index: true,
        on: { save: true }
      },
    },
  ],
});

const
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const tellme = require("./tellme");


const ShortId = mongoose.model('CompatResourceShortId', CompatResourceShortId);
const Counter = mongoose.model('CompatResourceCounter', CompatResourceCounter);
const GroupedUniqueCounter = mongoose.model(
  'CompatResourceGroupedUniqueCounter',
  CompatResourceGroupedUniqueCounter
);

describe('Compatible mode', function() {
  var resource = {};
  var uniqueSlugs = [];

  before(async () => {
    await ShortId.remove({});
  });

  after(async () => {
    await ShortId.remove({});
  });

  it('Create a new resource and check Slug and UniqueSlug', async () => {
    resource = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });

    should.exist(resource);
    resource.should.have
      .property('slug')
      .and.equal(tellme.getSlug(0,1));

    resource.should.have
      .property('forcedSlug')
      .match(tellme.getShortRegex(1))
      .and.not.equal(tellme.getSlug(1));

    assert.equal(-1, uniqueSlugs.indexOf(resource.uniqueSlug));

    uniqueSlugs.push(resource.uniqueSlug);
  });

  it(
    'Create ' + nIterations + ' resources and check Slug and UniqueSlug',
    async () => {
      for (let i = 0; i < nIterations; i++) {
        let doc = await ShortId.create({
          title: tellme.getText(0),
          subtitle: tellme.getText(1),
        });
        doc.should.have
          .property('slug')
          .and.equal(
            tellme.getSlug(0,1)
          );
        assert.equal(-1, uniqueSlugs.indexOf(doc.uniqueSlug));

        uniqueSlugs.push(doc.uniqueSlug);
      }
    }
  );

  it('Create a different resource and check Slug and UniqueSlug', async () => {
    let doc = await ShortId.create({
      title: tellme.getText(2),
      subtitle: tellme.getText(3),
    });
    doc.should.have
      .property('slug')
      .and.equal(
        tellme.getSlug(2,3)
      );
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(2));
  });

  it('Upsert a "watcher" element in an resource', async () => {
    resource.title = tellme.getText(4);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getText(4));
    doc.should.have.property(
      'subtitle',
      tellme.getText(1)
    );
    doc.should.have.property(
      'slug',
      tellme.getSlug(4,1)
    );
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });

  it('Upsert a "not watcher" element in an resource', async () => {
    resource.description = tellme.getText(5);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getText(4));
    doc.should.have.property(
      'subtitle',
      tellme.getText(1)
    );
    doc.should.have.property(
      'slug',
      tellme.getSlug(4,1)
    );
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });

  it('Upsert a "watcher" element in an resource trying to not update slug', async () => {
    resource.title = tellme.getSlug(4);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getSlug(4));
    doc.should.have.property(
      'subtitle',
      tellme.getText(1)
    );
    doc.should.have.property(
      'slug',
      tellme.getSlug(4,1)
    );
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });
});

describe('Compatible mode Grouped Resources (Counter)', function() {
  before(async () => {
    await GroupedUniqueCounter.remove({});
  });

  after(async () => {
    await GroupedUniqueCounter.remove({});
  });

  it("Create new resource for grouped ID and check it's generated as normal", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 1',
      children: [
        {
          title: tellme.getText(2),
        },
        {
          title: tellme.getText(2),
        },
      ],
    });
    doc.should.have.property('title').and.equal(tellme.getText(0, 0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2, 0));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2, 0));

    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 0));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 1));
    // console.log(doc);
  });

  it("Create new resource for grouped ID and check it's generated as with increment", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 1',
      children: [
        {
          title: tellme.getText(2),
        },
        {
          title: tellme.getText(2),
        },
      ],
    });
    doc.should.have.property('title').and.equal(tellme.getText(0, 1));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2, 1));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2, 1));

    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0, 1));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 2));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 3));
  });
});