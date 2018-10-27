'use strict';
const MongodbMemoryServer = require('mongodb-memory-server');

var mongoose = require('mongoose'),
  slugGenerator = require('../.'),
  chai = require('chai'),
  should = chai.should(),
  //async = require('async'),
  assert = require('assert'),
  ResourceShortId,
  ResourceCounter,
  ResourceGroupedUniqueCounter,
  ResourceGroupedUniqueShortId,
  ResourcePermanent,
  HooksSchema,
  ChildSchema,
  ParentSchema;

var slug_padding_size = 4;
var nIterations = 100;

/* Setup */

var mongod;
mongoose.Promise = global.Promise;

before('new inmemory mongo', async function() {
  mongod = new MongodbMemoryServer.default({
    instance: {
      dbName: 'slug',
    },
  });
  const mongoUri = await mongod.getConnectionString();
  mongoose.connect(
    mongoUri,
    { useNewUrlParser: true },
    error => {
      if (error) console.error(error);
    }
  );
});

after('dispose inmemory mongo', async function() {
  await mongoose.disconnect();
  mongod.stop();
});

ResourceShortId = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  uniqueSlug: { type: String, unique: true, slug: 'title' },
});

ResourceCounter = new mongoose.Schema({
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

ResourceGroupedUniqueCounter = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  group: { type: String },
  uniqueSlug: {
    type: String,
    uniqueGroup: ['group'],
    slug_padding_size: 4,
    slug: 'title',
    index: true,
  },
});

ResourceGroupedUniqueShortId = new mongoose.Schema({
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

ResourcePermanent = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },
  titleSlug: { type: String, slug: 'title', permanent: true },
  subtitleSlug: {
    type: String,
    slug: 'subtitle',
    permanent: true,
    slug_padding_size: 4,
  },
});

HooksSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  slugNoSave: { type: String, slug: 'title', on: { save: false } },
  slugNoUpdate: { type: String, slug: 'title', on: { update: false } },
  slugNoUpdateOne: { type: String, slug: 'title', on: { updateOne: false } },
  slugNoUpdateMany: { type: String, slug: 'title', on: { updateMany: false } },
});

ChildSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, /*unique: true,*/ slug: 'title' },
});

ParentSchema = new mongoose.Schema({
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

mongoose.plugin(slugGenerator);
//mongoose.plugin(slugGenerator, {separator: "_"});

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

/*
 https://www.youtube.com/watch?v=--UPSacwPDA
 Am I wrong, fallin' in love with you,
 tell me am I wrong, well, fallin' in love with you
 While your other man was out there,
 cheatin' and lyin', steppin' all over you

 Uh, sweet thing
 Tell me am I wrong, holdin' on to you so tight,
 Tell me, tell me, am I wrong, holdin' on to you so tight
 If your other man come to claim you,
 he'd better be ready, ready for a long long fight

 */

/* Tests */
var resource = {};

describe('Default plugin usage', function() {
  var uniqueSlugs = [];

  before(async () => {
    await ShortId.remove({});
  });

  after(async () => {
    await ShortId.remove({});
  });

  it('Create a new resource and check Slug and UniqueSlug', async () => {
    resource = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });

    should.exist(resource);
    resource.should.have
      .property('slug')
      .and.equal(
        'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );
    assert.equal(-1, uniqueSlugs.indexOf(resource.uniqueSlug));

    uniqueSlugs.push(resource.uniqueSlug);
  });

  it(
    'Create ' + nIterations + ' resources and check Slug and UniqueSlug',
    async () => {
      for (let i = 0; i < nIterations; i++) {
        let doc = await ShortId.create({
          title: "Am I wrong, fallin' in love with you!",
          subtitle: "tell me am I wrong, well, fallin' in love with you",
        });
        doc.should.have
          .property('slug')
          .and.equal(
            'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
          );
        assert.equal(-1, uniqueSlugs.indexOf(doc.uniqueSlug));

        uniqueSlugs.push(doc.uniqueSlug);
      }
    }
  );

  it('Create a different resource and check Slug and UniqueSlug', async () => {
    let doc = await ShortId.create({
      title: 'While your other man was out there,',
      subtitle: "cheatin' and lyin', steppin' all over you",
    });
    doc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-cheatin-and-lyin-steppin-all-over-you'
      );
    doc.should.have
      .property('uniqueSlug')
      .and.equal('while-your-other-man-was-out-there');
  });

  it('Upsert a "watcher" element in an resource', async () => {
    resource.title = 'Uh, sweet thing';
    let doc = await resource.save();
    doc.should.have.property('title', 'Uh, sweet thing');
    doc.should.have.property(
      'subtitle',
      "tell me am I wrong, well, fallin' in love with you"
    );
    doc.should.have.property(
      'slug',
      'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you'
    );
    doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
  });

  it('Upsert a "not watcher" element in an resource', async () => {
    resource.description = "Tell me am I wrong, holdin' on to you so tight,";
    let doc = await resource.save();
    doc.should.have.property('title', 'Uh, sweet thing');
    doc.should.have.property(
      'subtitle',
      "tell me am I wrong, well, fallin' in love with you"
    );
    doc.should.have.property(
      'slug',
      'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you'
    );
    doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
  });

  it('Upsert a "watcher" element in an resource trying to not update slug', async () => {
    resource.title = 'uh-sweet-thing';
    let doc = await resource.save();
    doc.should.have.property('title', 'uh-sweet-thing');
    doc.should.have.property(
      'subtitle',
      "tell me am I wrong, well, fallin' in love with you"
    );
    doc.should.have.property(
      'slug',
      'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you'
    );
    doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
  });
});

describe('Counter plugin usage', function() {
  before(async () => {
    await Counter.remove({});
  });

  after(async () => {
    await Counter.remove({});
  });

  it('Create a new resource and check Slug and UniqueSlug', async () => {
    let doc = await Counter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    resource = doc;

    doc.should.have
      .property('slug')
      .and.equal(
        'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it(
    'Create ' + nIterations + ' resources and check Slug and UniqueSlug',
    async () => {
      for (let i = 1; i <= nIterations; i++) {
        let doc = await Counter.create({
          title: "Am I wrong, fallin' in love with you!",
          subtitle: "tell me am I wrong, well, fallin' in love with you",
        });
        doc.should.have
          .property('slug')
          .and.equal(
            'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
          );
        doc.should.have
          .property('uniqueSlug')
          .and.equal(
            'am-i-wrong-fallin-in-love-with-you-' +
              i.toString().padStart(slug_padding_size, '0')
          );
      }
    }
  );

  it('Create a different resource and check Slug and UniqueSlug', async () => {
    let doc = await Counter.create({
      title: 'While your other man was out there,',
      subtitle: "cheatin' and lyin', steppin' all over you",
    });
    doc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-cheatin-and-lyin-steppin-all-over-you'
      );
    doc.should.have
      .property('uniqueSlug')
      .and.equal('while-your-other-man-was-out-there');
  });

  it('Upsert a "watcher" element in an resource', async () => {
    resource.title = 'Uh, sweet thing';
    let doc = await resource.save();
    doc.should.have.property('title', 'Uh, sweet thing');
    doc.should.have.property(
      'subtitle',
      "tell me am I wrong, well, fallin' in love with you"
    );
    doc.should.have.property(
      'slug',
      'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you'
    );
    doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
  });

  it('Upsert a "not watcher" element in an resource', async () => {
    resource.description = "Tell me am I wrong, holdin' on to you so tight,";
    let doc = await resource.save();
    doc.should.have.property('title', 'Uh, sweet thing');
    doc.should.have.property(
      'subtitle',
      "tell me am I wrong, well, fallin' in love with you"
    );
    doc.should.have.property(
      'slug',
      'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you'
    );
    doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
  });

  it('Upsert a "watcher" element in an resource trying to not update slug', async () => {
    resource.title = 'uh-sweet-thing';
    let doc = await resource.save();
    doc.should.have.property('title', 'uh-sweet-thing');
    doc.should.have.property(
      'subtitle',
      "tell me am I wrong, well, fallin' in love with you"
    );
    doc.should.have.property(
      'slug',
      'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you'
    );
    doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
  });
});

if (typeof String.prototype.padStart === 'undefined') {
  String.prototype.padStart = function(targetLength, padString) {
    var s = this;
    while (s.length < targetLength) s = padString + s;

    return s;
  };
}

describe('Grouped Resources (Counter)', function() {
  before(async () => {
    await GroupedUniqueCounter.remove({});
  });

  after(async () => {
    await GroupedUniqueCounter.remove({});
  });

  it("Create new resource for grouped ID and check it's generated as normal", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it("Create new resource for grouped ID and check it's generated as with increment", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you-0001');
  });

  it("Create new resource for second group and check it's generated as normal", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it("Create new resource for second group and check it's generated as with increment", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you-0001');
  });

  it('Change group and check slug counter was incremented accordingly', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 2',
      uniqueSlug: 'am-i-wrong-fallin-in-love-with-you-0001',
    });
    doc.group = 'group 1';
    doc = await doc.save();
    // let docs = await GroupedUniqueCounter.find();
    // console.log("grouped docs",docs);
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you-0002');
  });

  it('UpdateOne group and check slug counter was incremented accordingly', async () => {
    let doc = await GroupedUniqueCounter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you-0001');

    // console.log("---------------updateOne group");
    await GroupedUniqueCounter.updateOne({ _id: doc.id }, { group: 'group 1' });
    let editedDoc = await GroupedUniqueCounter.findById(doc.id);
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you-0003');
  });

  it('Change group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 1',
      uniqueSlug: 'am-i-wrong-fallin-in-love-with-you-0002',
    });
    doc.group = 'group 3';
    doc = await doc.save();
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it('UpdateOne group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 1',
      uniqueSlug: 'am-i-wrong-fallin-in-love-with-you-0003',
    });
    await GroupedUniqueCounter.updateOne({ _id: doc.id }, { group: 'group 4' });
    let editedDoc = await GroupedUniqueCounter.findById(doc.id);
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });
});

describe('Grouped Resources (ShortId)', function() {
  before(async () => {
    await GroupedUniqueShortId.remove({});
  });

  after(async () => {
    await GroupedUniqueShortId.remove({});
  });

  it("Create new resource for grouped ID and check it's generated as normal", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it("Create new resource for grouped ID and check it's generated with id postfix", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.match(/^am-i-wrong-fallin-in-love-with-you-.+$/);
  });

  it("Create new resource for second group and check it's generated as normal", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it("Create new resource for second group and check it's generated with id postfix", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 2',
      otherField: 'to move in group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.match(/^am-i-wrong-fallin-in-love-with-you-.+$/);
  });

  it('Change group and check slug was appended with id postfix', async () => {
    let doc = await GroupedUniqueShortId.findOne({
      group: 'group 2',
      otherField: 'to move in group 1',
    });
    doc.group = 'group 1';
    let uniqueSlug = doc.uniqueSlug;
    let existingSlug = await GroupedUniqueShortId.findOne({
      group: 'group 1',
      uniqueSlug,
    });
    // console.log('exists', existingSlug);
    doc = await doc.save();
    if (!existingSlug)
      doc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
    else
      doc.should.have
        .property('uniqueSlug')
        .and.match(/^am-i-wrong-fallin-in-love-with-you-.+$/)
        .and.not.equal(uniqueSlug);
  });

  it('updateOne group and check slug counter was appended with id postfix', async () => {
    let doc = await GroupedUniqueShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.match(/^am-i-wrong-fallin-in-love-with-you-.+$/);

    let existingSlug = await GroupedUniqueShortId.findOne({
      group: 'group 1',
      uniqueSlug: doc.uniqueSlug,
    });
    await GroupedUniqueShortId.updateOne({ _id: doc.id }, { group: 'group 1' });
    let editedDoc = await GroupedUniqueShortId.findById(doc.id);
    if (!existingSlug)
      editedDoc.should.have.property('uniqueSlug').and.equal(doc.uniqueSlug);
    else
      editedDoc.should.have
        .property('uniqueSlug')
        .and.match(/^am-i-wrong-fallin-in-love-with-you-.+$/)
        .and.not.equal(doc.uniqueSlug);
  });

  it('Change group to brand new and check slug was updated to normal', async () => {
    // let docs = await GroupedUniqueShortId.find({group: 'group 1'});
    // console.log("docs 1",docs);
    let doc = await GroupedUniqueShortId.findOne({
      group: 'group 1',
      uniqueSlug: { $ne: 'am-i-wrong-fallin-in-love-with-you' },
    });
    doc.group = 'group 3';
    doc = await doc.save();
    doc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it('UpdateOne group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueShortId.findOne({
      group: 'group 1',
      uniqueSlug: { $ne: 'am-i-wrong-fallin-in-love-with-you' },
    });
    await GroupedUniqueShortId.updateOne({ _id: doc.id }, { group: 'group 4' });
    let editedDoc = await GroupedUniqueShortId.findById(doc.id);
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });
});

describe('updateOne', function() {
  beforeEach(async () => {
    await ShortId.remove({});
  });

  afterEach(async () => {
    await ShortId.remove({});
  });

  it('Update not watcher field shortId', async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      otherField: 'While your other man was out there,',
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      otherField: "cheatin' and lyin', steppin' all over you",
    };
    await ShortId.updateOne({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: 'Uh, sweet thing',
    };
    await ShortId.updateOne({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('Update not watcher field counter', async () => {
    let res = await Counter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      otherField: 'While your other man was out there,',
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      otherField: "cheatin' and lyin', steppin' all over you",
    };
    await Counter.updateOne({ _id }, mdf);
    let editedDoc = await Counter.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: 'Uh, sweet thing',
    };
    await Counter.updateOne({ _id }, { $set: mdf });
    editedDoc = await Counter.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('Update title and check if slug was updated', async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      title: 'While your other man was out there,',
      // subtitle: "cheatin' and lyin', steppin' all over you"
    };
    // console.debug('upd_id', _id);
    await ShortId.updateOne({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('while-your-other-man-was-out-there');
    mdf = {
      title: "cheatin' and lyin', steppin' all over you",
      // subtitle: "cheatin' and lyin', steppin' all over you"
    };
    // console.debug('upd_id', _id);
    await ShortId.updateOne({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'cheatin-and-lyin-steppin-all-over-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('cheatin-and-lyin-steppin-all-over-you');
  });

  it('Update subtitle and check if slug was updated', async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    // console.debug('created doc', res);
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      subtitle: "cheatin' and lyin', steppin' all over you",
    };
    await ShortId.updateOne({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'am-i-wrong-fallin-in-love-with-you-cheatin-and-lyin-steppin-all-over-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
    mdf = {
      subtitle: 'Uh, sweet thing',
    };
    // console.debug('upd_id', _id);
    await ShortId.updateOne({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal('am-i-wrong-fallin-in-love-with-you-uh-sweet-thing');
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it("Update watcher fields to the same values and check slugs wasn't changed", async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    };
    // console.log("same values");
    await ShortId.updateOne({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);
    editedDoc.should.have.property('slug').and.equal(slug);
    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
    await ShortId.updateOne({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);
    editedDoc.should.have.property('slug').and.equal(slug);
    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('UpdateOne without _id', async () => {
    let doc = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    let { _id, slug, uniqueSlug } = doc;
    let mdf = {
      title: 'While your other man was out there,',
      subtitle: "cheatin' and lyin', steppin' all over you",
    };

    await ShortId.updateOne({ uniqueSlug }, mdf);
    let editedDoc = await ShortId.findOne(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-cheatin-and-lyin-steppin-all-over-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('while-your-other-man-was-out-there');

    ({ _id, slug, uniqueSlug } = editedDoc);

    mdf = {
      title: 'Uh, sweet thing',
      subtitle: "Tell me am I wrong, holdin' on to you so tight,",
    };

    await ShortId.updateOne({ slug }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal('uh-sweet-thing-tell-me-am-i-wrong-holdin-on-to-you-so-tight');
    editedDoc.should.have.property('uniqueSlug').and.equal('uh-sweet-thing');
  });
});

describe('update', function() {
  beforeEach(async () => {
    await ShortId.remove({});
    await Counter.remove({});
  });

  afterEach(async () => {
    await ShortId.remove({});
    await Counter.remove({});
  });

  it('Update not watcher field shortId', async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      otherField: 'While your other man was out there,',
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      otherField: "cheatin' and lyin', steppin' all over you",
    };
    await ShortId.update({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: 'Uh, sweet thing',
    };
    await ShortId.update({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('Update not watcher field counter', async () => {
    let res = await Counter.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
      otherField: 'While your other man was out there,',
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      otherField: "cheatin' and lyin', steppin' all over you",
    };
    await Counter.update({ _id }, mdf);
    let editedDoc = await Counter.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: 'Uh, sweet thing',
    };
    await Counter.update({ _id }, { $set: mdf });
    editedDoc = await Counter.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('Update title and check if slug was updated', async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      title: 'While your other man was out there,',
      // subtitle: "cheatin' and lyin', steppin' all over you"
    };
    // console.debug('upd_id', _id);
    await ShortId.update({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('while-your-other-man-was-out-there');
    mdf = {
      title: "cheatin' and lyin', steppin' all over you",
      // subtitle: "cheatin' and lyin', steppin' all over you"
    };
    // console.debug('upd_id', _id);
    await ShortId.update({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'cheatin-and-lyin-steppin-all-over-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('cheatin-and-lyin-steppin-all-over-you');
  });

  it('Update subtitle and check if slug was updated', async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    // console.debug('created doc', res);
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      subtitle: "cheatin' and lyin', steppin' all over you",
    };
    await ShortId.update({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'am-i-wrong-fallin-in-love-with-you-cheatin-and-lyin-steppin-all-over-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
    mdf = {
      subtitle: 'Uh, sweet thing',
    };
    // console.debug('upd_id', _id);
    await ShortId.update({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal('am-i-wrong-fallin-in-love-with-you-uh-sweet-thing');
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');
  });

  it("Update watcher fields to the same values and check slugs wasn't changed", async () => {
    let res = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    let { _id, slug, uniqueSlug } = res;
    let mdf = {
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    };
    // console.log("same values");
    await ShortId.update({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);
    editedDoc.should.have.property('slug').and.equal(slug);
    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
    await ShortId.update({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);
    editedDoc.should.have.property('slug').and.equal(slug);
    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('UpdateOne without _id', async () => {
    let doc = await ShortId.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    let { _id, slug, uniqueSlug } = doc;
    let mdf = {
      title: 'While your other man was out there,',
      subtitle: "cheatin' and lyin', steppin' all over you",
    };

    await ShortId.update({ uniqueSlug }, mdf);
    let editedDoc = await ShortId.findOne(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-cheatin-and-lyin-steppin-all-over-you'
      );
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal('while-your-other-man-was-out-there');

    ({ _id, slug, uniqueSlug } = editedDoc);

    mdf = {
      title: 'Uh, sweet thing',
      subtitle: "Tell me am I wrong, holdin' on to you so tight,",
    };

    await ShortId.update({ slug }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have
      .property('slug')
      .and.equal('uh-sweet-thing-tell-me-am-i-wrong-holdin-on-to-you-so-tight');
    editedDoc.should.have.property('uniqueSlug').and.equal('uh-sweet-thing');
  });

  it('Update multiply slugs', async () => {
    let docs = [];
    for (let i = 0; i < 10; i++) {
      docs[i] = await ShortId.create({
        title: "Am I wrong, fallin' in love with you!",
        subtitle: "tell me am I wrong, well, fallin' in love with you",
        otherField: i,
      });
      docs[i].should.have
        .property('slug')
        .and.equal(
          'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
        );
      docs[i].should.have
        .property('uniqueSlug')
        .and.match(/^am-i-wrong-fallin-in-love-with-you.*$/);
    }
    await ShortId.updateMany(
      { otherField: { $gt: 4 } },
      { title: 'While your other man was out there,' }
    );

    docs = ShortId.find({ otherField: { $lt: 5 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have
        .property('slug')
        .and.equal(
          'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
        );
      docs[i].should.have
        .property('uniqueSlug')
        .and.match(/^am-i-wrong-fallin-in-love-with-you.*$/);
    }

    docs = ShortId.find({ otherField: { $gt: 4 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have
        .property('slug')
        .and.equal(
          'while-your-other-man-was-out-there-tell-me-am-i-wrong-well-fallin-in-love-with-you'
        );
      docs[i].should.have
        .property('uniqueSlug')
        .and.match(/^while-your-other-man-was-out-there.*$/);
    }
  });

  it('Update multiply counter slugs', async () => {
    let docs = [];
    for (let i = 0; i < 10; i++) {
      docs[i] = await Counter.create({
        title: "Am I wrong, fallin' in love with you!",
        subtitle: "tell me am I wrong, well, fallin' in love with you",
        otherField: i,
      });
      docs[i].should.have
        .property('slug')
        .and.equal(
          'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
        );
      docs[i].should.have
        .property('uniqueSlug')
        .and.equal(
          'am-i-wrong-fallin-in-love-with-you' + (i ? '-000' + i : '')
        );
    }
    await Counter.updateMany(
      { otherField: { $gt: 4 } },
      { title: 'While your other man was out there,' }
    );

    docs = Counter.find({ otherField: { $lt: 5 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have
        .property('slug')
        .and.equal(
          'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
        );
      docs[i].should.have
        .property('uniqueSlug')
        .and.equal(
          'am-i-wrong-fallin-in-love-with-you' + (i ? '-000' + i : '')
        );
    }

    docs = Counter.find({ otherField: { $gt: 4 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have
        .property('slug')
        .and.equal(
          'while-your-other-man-was-out-there-tell-me-am-i-wrong-well-fallin-in-love-with-you'
        );
      docs[i].should.have
        .property('uniqueSlug')
        .and.equal('while-your-other-man-was-out-there' + (i ? '000' + i : ''));
    }
  });
});

describe('Permanent option', function() {
  beforeEach(async () => {
    await ShortId.remove({});
  });

  afterEach(async () => {
    await ShortId.remove({});
  });

  it('Change fields and check permanent slugs remain unchanged', async () => {
    let doc = await Permanent.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    doc.should.have
      .property('slug')
      .and.equal(
        'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );

    doc.should.have
      .property('titleSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');

    doc.should.have
      .property('subtitleSlug')
      .and.equal('tell-me-am-i-wrong-well-fallin-in-love-with-you');

    let { _id, slug, titleSlug, subtitleSlug } = doc;
    doc.title = 'While your other man was out there,';
    doc.subtitle = "cheatin' and lyin', steppin' all over you";
    let editedDoc = await doc.save();

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-cheatin-and-lyin-steppin-all-over-you'
      );

    editedDoc.should.have.property('titleSlug').and.equal(titleSlug);

    editedDoc.should.have.property('subtitleSlug').and.equal(subtitleSlug);
  });

  it('UpdateOne fields and check permanent slugs remain unchanged', async () => {
    let doc = await Permanent.create({
      title: "Am I wrong, fallin' in love with you!",
      subtitle: "tell me am I wrong, well, fallin' in love with you",
    });
    doc.should.have
      .property('slug')
      .and.equal(
        'am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you'
      );

    doc.should.have
      .property('titleSlug')
      .and.equal('am-i-wrong-fallin-in-love-with-you');

    doc.should.have
      .property('subtitleSlug')
      .and.equal('tell-me-am-i-wrong-well-fallin-in-love-with-you');

    let { _id, slug, titleSlug, subtitleSlug } = doc;
    let mdf = {
      title: 'While your other man was out there,',
      subtitle: "cheatin' and lyin', steppin' all over you",
    };
    await Permanent.updateOne({ _id }, mdf);
    let editedDoc = await Permanent.findOne({ _id });

    editedDoc.should.have
      .property('slug')
      .and.equal(
        'while-your-other-man-was-out-there-cheatin-and-lyin-steppin-all-over-you'
      );

    editedDoc.should.have.property('titleSlug').and.equal(titleSlug);

    editedDoc.should.have.property('subtitleSlug').and.equal(subtitleSlug);
  });
});

describe('Turn hooks on/off', function() {
  beforeEach(async () => {
    await Hook.remove({});
  });

  afterEach(async () => {
    await Hook.remove({});
  });

  it('`save` - create new resource', async () => {
    let doc = await Hook.create({
      title: "Am I wrong, fallin' in love with you!",
    });
    let newSlug = 'am-i-wrong-fallin-in-love-with-you';

    doc.should.have.property('slug').and.equal(newSlug);

    should.not.exist(doc.slugNoSave);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);
  });

  it('`save` - update resource', async () => {
    await Hook.update(
      {},
      {
        title: "Am I wrong, fallin' in love with you!",
      },
      { upsert: true }
    );
    let doc = await Hook.findOne({});

    doc.title = "tell me am I wrong, well, fallin' in love with you";
    doc = await doc.save();

    let oldSlug = 'am-i-wrong-fallin-in-love-with-you';
    let newSlug = 'tell-me-am-i-wrong-well-fallin-in-love-with-you';

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(oldSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);
  });

  it('`update` - create(upsert) a new resource', async () => {
    await Hook.update(
      {},
      {
        title: "Am I wrong, fallin' in love with you!",
      },
      { upsert: true }
    );
    let doc = await Hook.findOne({});
    let newSlug = 'am-i-wrong-fallin-in-love-with-you';
    // console.log(doc);
    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    should.not.exist(doc.slugNoUpdate);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);
  });

  it('`update` - update resource', async () => {
    let doc = await Hook.create({
      title: "Am I wrong, fallin' in love with you!",
    });
    let { _id } = doc;
    await Hook.update(
      { _id },
      { title: "tell me am I wrong, well, fallin' in love with you" }
    );
    doc = await Hook.findOne({ _id });
    let oldSlug = 'am-i-wrong-fallin-in-love-with-you';
    let newSlug = 'tell-me-am-i-wrong-well-fallin-in-love-with-you';

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(oldSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);
  });

  it('`updateOne` - create(upsert) a new resource', async () => {
    let res = await Hook.updateOne(
      {},
      {
        title: "Am I wrong, fallin' in love with you!",
      },
      { upsert: true }
    );
    // console.log("create by updateOne",res);
    let doc = await Hook.findOne({});
    let newSlug = 'am-i-wrong-fallin-in-love-with-you';
    // console.log(doc);
    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    should.not.exist(doc.slugNoUpdateOne);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);
  });

  it('`updateOne` - update resource', async () => {
    let doc = await Hook.create({
      title: "Am I wrong, fallin' in love with you!",
    });
    let { _id } = doc;
    await Hook.updateOne(
      { _id },
      { title: "tell me am I wrong, well, fallin' in love with you" }
    );
    doc = await Hook.findOne({ _id });
    let oldSlug = 'am-i-wrong-fallin-in-love-with-you';
    let newSlug = 'tell-me-am-i-wrong-well-fallin-in-love-with-you';

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(oldSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);
  });

  it('`updateMany` - create(upsert) a new resource', async () => {
    let res = await Hook.updateMany(
      {},
      {
        title: "Am I wrong, fallin' in love with you!",
      },
      { upsert: true }
    );
    // console.log("create by updateMany",res);
    let doc = await Hook.findOne({});
    let newSlug = 'am-i-wrong-fallin-in-love-with-you';
    // console.log(doc);
    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    should.not.exist(doc.slugNoUpdateMany);
  });

  it('`updateMany` - update resource', async () => {
    let doc = await Hook.create({
      title: "Am I wrong, fallin' in love with you!",
    });
    let { _id } = doc;
    await Hook.updateMany(
      { _id },
      { title: "tell me am I wrong, well, fallin' in love with you" }
    );
    doc = await Hook.findOne({ _id });
    let oldSlug = 'am-i-wrong-fallin-in-love-with-you';
    let newSlug = 'tell-me-am-i-wrong-well-fallin-in-love-with-you';

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(oldSlug);
  });
});

// describe('Nested Schema', function() {
//   beforeEach(async () => {
//     await Hook.remove({});
//   });
//
//   afterEach(async () => {
//     await Hook.remove({});
//   });
//
//   // it('Save nested docs', async () => {
//   //   let doc = await Parent.create({
//   //     title: "Am I wrong, fallin' in love with you!",
//   //     singleChild: {
//   //       title: "tell me am I wrong, well, fallin' in love with you",
//   //     },
//   //     children: [
//   //       {
//   //         title: 'While your other man was out there',
//   //       },
//   //       {
//   //         title: "cheatin' and lyin', steppin' all over you",
//   //       },
//   //       {
//   //         title: 'Uh, sweet thing',
//   //       },
//   //       {
//   //         title: "Tell me am I wrong, holdin' on to you so tight,",
//   //       },
//   //       {
//   //         title: "Tell me, tell me, am I wrong, holdin' on to you so tight",
//   //       },
//   //     ],
//   //   });
//   //   // console.log(doc);
//   // });
//
//   it('UpdateOne new nested docs', async () => {
//     await Parent.updateOne(
//       {},
//       {
//         title: "Am I wrong, fallin' in love with you!",
//         singleChild: {
//           title: "tell me am I wrong, well, fallin' in love with you",
//         },
//         children: [
//           {
//             title: 'While your other man was out there',
//           },
//           {
//             title: "cheatin' and lyin', steppin' all over you",
//           },
//           {
//             title: 'Uh, sweet thing',
//           },
//           {
//             title: "Tell me am I wrong, holdin' on to you so tight,",
//           },
//           {
//             title: "Tell me, tell me, am I wrong, holdin' on to you so tight",
//           },
//         ],
//       },
//       { upsert: true }
//     );
//     let doc = await Parent.findOne({});
//     // console.log(doc);
//     //     doc.should.have.property("slug")
//     //     .and.equal('am-i-wrong-fallin-in-love-with-you');
//     //
//     //     doc.should.have.property("singleChild")
//     //     .and.should.have.property('slug')
//     //     .and.equal('tell-me-am-i-wrong-well-fallin-in-love-with-you');
//   });
// });

describe('Counter plugin usage to check titles including other titles', function() {
  before(async () => {
    await Counter.remove({});
  });
  before(async () => {
    await Counter.remove({});
  });
  it('Create a resource and check Slug and UniqueSlug', async () => {
    let doc = await Counter.create({
      title: 'pineapple',
      subtitle: 'subtitle',
    });
    doc.should.have.property('slug').and.equal('pineapple-subtitle');
    doc.should.have.property('uniqueSlug').and.equal('pineapple');
  });
  it('Create a second resource which has a title part of first resources title', async () => {
    let doc = await Counter.create({
      title: 'apple',
      subtitle: 'subtitle',
    });
    doc.should.have.property('slug').and.equal('apple-subtitle');
    doc.should.have.property('uniqueSlug').and.equal('apple');
  });
});
