'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const {
  nIterations,
  slug_padding_size,
  GroupedUniqueCounter,
  GroupedUniqueShortId,
} = require("./models");

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
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
  });

  it("Create new resource for grouped ID and check it's generated as with increment", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0,1));
  });

  it("Create new resource for second group and check it's generated as normal", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
  });

  it("Create new resource for second group and check it's generated as with increment", async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0,1));
  });

  it('Change group and check slug counter was incremented accordingly', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 2',
      uniqueSlug: tellme.getCounterSlug(0,1),
    });
    doc.group = 'group 1';
    doc = await doc.save();
    // let docs = await GroupedUniqueCounter.find();
    // console.log("grouped docs",docs);
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0,2));
  });

  it('UpdateOne group and check slug counter was incremented accordingly', async () => {
    let doc = await GroupedUniqueCounter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0,1));

    // console.log("---------------updateOne group");
    await GroupedUniqueCounter.updateOne({ _id: doc.id }, { group: 'group 1' });
    let editedDoc = await GroupedUniqueCounter.findById(doc.id);
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getCounterSlug(0,3));
  });

  it('Change group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 1',
      uniqueSlug: tellme.getCounterSlug(0,2),
    });
    doc.group = 'group 3';
    doc = await doc.save();
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
  });

  it('UpdateOne group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueCounter.findOne({
      group: 'group 1',
      uniqueSlug: tellme.getCounterSlug(0,3),
    });
    await GroupedUniqueCounter.updateOne({ _id: doc.id }, { group: 'group 4' });
    let editedDoc = await GroupedUniqueCounter.findById(doc.id);
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
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
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
  });

  it("Create new resource for grouped ID and check it's generated with id postfix", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0));
  });

  it("Create new resource for second group and check it's generated as normal", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
  });

  it("Create new resource for second group and check it's generated with id postfix", async () => {
    let doc = await GroupedUniqueShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
      otherField: 'to move in group 1',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0));
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
        .and.match(tellme.getShortRegex(0))
        .and.not.equal(uniqueSlug);
  });

  it('updateOne group and check slug counter was appended with id postfix', async () => {
    let doc = await GroupedUniqueShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      group: 'group 2',
    });
    doc.should.have
      .property('uniqueSlug')
      .and.match(tellme.getShortRegex(0));

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
        .and.match(tellme.getShortRegex(0))
        .and.not.equal(doc.uniqueSlug);
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
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
  });

  it('UpdateOne group to brand new and check slug was updated to normal', async () => {
    let doc = await GroupedUniqueShortId.findOne({
      group: 'group 1',
      uniqueSlug: { $ne: tellme.getSlug(0) },
    });
    await GroupedUniqueShortId.updateOne({ _id: doc.id }, { group: 'group 4' });
    let editedDoc = await GroupedUniqueShortId.findById(doc.id);
    editedDoc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(0));
  });
});