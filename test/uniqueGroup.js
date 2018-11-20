'use strict';

const _ = require('lodash');

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const {
  nIterations,
  slugPaddingSize,
  GroupedUniqueCounter,
  GroupedUniqueShortId,
} = require('./model');

const tellme = require('./tellme');
/* Tests */

describe('Grouped Resources (Counter)', function() {
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

  it("Create new resource for second group and check it's generated as normal", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
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
  });

  it("Create new resource for second group and check it's generated as with increment", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
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

  it('Change group and check slug counter was incremented accordingly', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 2',
      uniqueSlug: tellme.getCounterSlug(0, 1),
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
    doc.group = 'group 1';
    doc = await doc.save();

    doc.should.have.property('title').and.equal(tellme.getText(0, 2));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2, 2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2, 2));

    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0, 2));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 4));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 5));
  });

  it('UpdateOne group and check slug counter was incremented accordingly', async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
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

    await GroupedUniqueCounter.updateOne(
      { _id: doc._id },
      { $set: { group: 'group 1' } }
    );
    let editedDoc = await GroupedUniqueCounter.findById(doc._id);
    editedDoc.should.have.property('title').and.equal(tellme.getText(0, 3));
    editedDoc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2, 3));
    editedDoc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2, 3));

    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0, 3));
    editedDoc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 6));
    editedDoc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 7));
  });

  it('Change group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 1',
      uniqueSlug: tellme.getCounterSlug(0, 2),
    });

    doc.should.have.property('title').and.equal(tellme.getText(0, 2));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2, 2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2, 2));

    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0, 2));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 4));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 5));

    doc.group = 'group 3';
    doc = await doc.save();

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
  });

  it('UpdateOne group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 1',
      uniqueSlug: tellme.getCounterSlug(0, 3),
    });

    doc.should.have.property('title').and.equal(tellme.getText(0, 3));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2, 3));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2, 3));

    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0, 3));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 6));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 7));

    await GroupedUniqueCounter.updateOne(
      { _id: doc._id },
      { group: 'group 4' }
    );
    let editedDoc = await GroupedUniqueCounter.findById(doc._id);

    doc.should.have.property('title').and.equal(tellme.getText(0, 0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2, 0));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2, 0));

    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    editedDoc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 0));
    editedDoc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.equal(tellme.getCounterSlug(2, 1));
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
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));

    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0, 0));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 0));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 1));
  });

  it("Create new resource for grouped ID and check it's generated with id postfix", async () => {
    let doc = await GroupedUniqueShortId.create({
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
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));

    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0, 1));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 2));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 3));
  });

  it("Create new resource for second group and check it's generated as normal", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
      children: [
        {
          title: tellme.getText(2),
        },
        {
          title: tellme.getText(2),
        },
      ],
    });
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));

    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0, 0));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 0));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 1));
  });

  it("Create new resource for second group and check it's generated with id postfix", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
      otherField: 'to move in group 1',
      children: [
        {
          title: tellme.getText(2),
        },
        {
          title: tellme.getText(2),
        },
      ],
    });
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));

    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0, 1));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 2));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 3));
  });

  it('Change group and check slug was appended with id postfix', async () => {
    let doc = await GroupedUniqueShortId.findOne({
      group: 'group 2',
      otherField: 'to move in group 1',
    });
    doc.group = 'group 1';
    let uniqueSlug = doc.uniqueSlug;
    let globalGroupSlug0 = doc.children[0].globalGroupSlug;
    let globalGroupSlug1 = doc.children[1].globalGroupSlug;
    let existingDocs = await GroupedUniqueShortId.find({
      group: 'group 1',
    });
    let uniqueSlugExists = _.some(existingDocs, ['uniqueSlug', uniqueSlug]);
    let globalGroupSlug0Exists =
      _.some(existingDocs, ['children[0].globalGroupSlug', globalGroupSlug0]) ||
      _.some(existingDocs, ['children[1].globalGroupSlug', globalGroupSlug0]);
    let globalGroupSlug1Exists =
      _.some(existingDocs, ['children[0].globalGroupSlug', globalGroupSlug1]) ||
      _.some(existingDocs, ['children[1].globalGroupSlug', globalGroupSlug1]);

    doc = await doc.save();

    if (!uniqueSlugExists) {
      doc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
    } else{
      doc.should.have
        .property('uniqueSlug')
        .and.match(tellme.getShortRegex(0))
        .and.not.equal(uniqueSlug);
    }
    if(!globalGroupSlug0Exists){
      doc.should.have.nested
        .property('children[0].globalGroupSlug')
        .and.equal(globalGroupSlug0);
    }else{
      doc.should.have.nested.property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2))
      .and.not.equal(globalGroupSlug0Exists);
    }
    if(!globalGroupSlug1Exists){
      doc.should.have.nested
        .property('children[1].globalGroupSlug')
        .and.equal(globalGroupSlug1);
    }else{
      doc.should.have.nested.property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2))
      .and.not.equal(globalGroupSlug1Exists);
    }
  });

  it('updateOne group and check slug was appended with id postfix', async () => {
    let doc = await GroupedUniqueShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
      children: [
        {
          title: tellme.getText(2),
        },
        {
          title: tellme.getText(2),
        },
      ],
    });
    doc.should.have.property('uniqueSlug').and.match(tellme.getShortRegex(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));

    let uniqueSlug = doc.uniqueSlug;
    let globalGroupSlug0 = doc.children[0].globalGroupSlug;
    let globalGroupSlug1 = doc.children[1].globalGroupSlug;
    let existingDocs = await GroupedUniqueShortId.find({
      group: 'group 1',
    });
    let uniqueSlugExists = _.some(existingDocs, ['uniqueSlug', uniqueSlug]);
    let globalGroupSlug0Exists =
      _.some(existingDocs, ['children[0].globalGroupSlug', globalGroupSlug0]) ||
      _.some(existingDocs, ['children[1].globalGroupSlug', globalGroupSlug0]);
    let globalGroupSlug1Exists =
      _.some(existingDocs, ['children[0].globalGroupSlug', globalGroupSlug1]) ||
      _.some(existingDocs, ['children[1].globalGroupSlug', globalGroupSlug1]);

    await GroupedUniqueShortId.updateOne(
      { _id: doc._id },
      {$set:{ group: 'group 1' }}
    );
    doc = await GroupedUniqueShortId.findById(doc._id);
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));
    if (!uniqueSlugExists) {
      doc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
    } else{
      doc.should.have
        .property('uniqueSlug')
        .and.match(tellme.getShortRegex(0))
        .and.not.equal(uniqueSlug);
    }
    if(!globalGroupSlug0Exists){
      doc.should.have.nested
        .property('children[0].globalGroupSlug')
        .and.equal(globalGroupSlug0);
    }else{
      doc.should.have.nested.property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2))
      .and.not.equal(globalGroupSlug0Exists);
    }
    if(!globalGroupSlug1Exists){
      doc.should.have.nested
        .property('children[1].globalGroupSlug')
        .and.equal(globalGroupSlug1);
    }else{
      doc.should.have.nested.property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2))
      .and.not.equal(globalGroupSlug1Exists);
    }
  });

  it('Change group to brand new and check slug was updated to normal', async () => {
    // let docs = await GroupedUniqueShortId.find({group: 'group 1'});
    // console.log("docs 1",docs);
    let doc = await GroupedUniqueShortId.findOne({
      group: 'group 1',
      uniqueSlug: { $ne: tellme.getSlug(0) },
    });
    doc.group = 'group 3';
    doc = await doc.save();
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));

    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0, 0));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 0));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 1));
  });

  it('UpdateOne group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueShortId.findOne({
      group: 'group 1',
      uniqueSlug: { $ne: tellme.getSlug(0) },
    });
    await GroupedUniqueShortId.updateOne(
      { _id: doc._id },
      {$set:{ group: 'group 4' }}
    );
    doc = await GroupedUniqueShortId.findById(doc._id);
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.nested
      .property('children[0].title')
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property('children[1].title')
      .and.equal(tellme.getText(2));

    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0, 0));
    doc.should.have.nested
      .property('children[0].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 0));
    doc.should.have.nested
      .property('children[1].globalGroupSlug')
      .and.match(tellme.getShortRegex(2, 1));
  });
});
