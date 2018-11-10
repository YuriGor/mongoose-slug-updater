'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const { Hook } = require('./../model');

const tellme = require('./../tellme');

describe('Turn hooks on/off', function() {
  beforeEach(async () => {
    await Hook.remove({});
  });

  afterEach(async () => {
    await Hook.remove({});
  });

  it('`save` - create new resource', async () => {
    let doc = await Hook.create({
      title: tellme.getText(0),
    });
    let newSlug = tellme.getSlug(0);

    doc.should.have.property('slug').and.equal(newSlug);

    should.not.exist(doc.slugNoSave);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`save` - update resource', async () => {
    await Hook.update(
      {},
      {
        title: tellme.getText(0),
      },
      { upsert: true }
    );
    let doc = await Hook.findOne({});

    doc.title = tellme.getText(1);
    doc = await doc.save();

    let oldSlug = tellme.getSlug(0);
    let newSlug = tellme.getSlug(1);

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(oldSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`update` - create(upsert) a new resource', async () => {
    await Hook.update(
      {},
      {
        title: tellme.getText(0),
      },
      { upsert: true }
    );
    let doc = await Hook.findOne({});
    let newSlug = tellme.getSlug(0);
    // console.log(doc);
    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    should.not.exist(doc.slugNoUpdate);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`update` - update resource', async () => {
    let doc = await Hook.create({
      title: tellme.getText(0),
    });
    let { _id } = doc;
    await Hook.update({ _id }, { title: tellme.getText(1) });
    doc = await Hook.findOne({ _id });
    let oldSlug = tellme.getSlug(0);
    let newSlug = tellme.getSlug(1);

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(oldSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`updateOne` - create(upsert) a new resource', async () => {
    let res = await Hook.updateOne(
      {},
      {
        title: tellme.getText(0),
      },
      { upsert: true }
    );
    // console.log("create by updateOne",res);
    let doc = await Hook.findOne({});
    let newSlug = tellme.getSlug(0);
    // console.log(doc);
    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    should.not.exist(doc.slugNoUpdateOne);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`updateOne` - update resource', async () => {
    let doc = await Hook.create({
      title: tellme.getText(0),
    });
    let { _id } = doc;
    await Hook.updateOne({ _id }, { title: tellme.getText(1) });
    doc = await Hook.findOne({ _id });
    let oldSlug = tellme.getSlug(0);
    let newSlug = tellme.getSlug(1);

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(oldSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`updateMany` - create(upsert) a new resource', async () => {
    let res = await Hook.updateMany(
      {},
      {
        title: tellme.getText(0),
      },
      { upsert: true }
    );
    // console.log("create by updateMany",res);
    let doc = await Hook.findOne({});
    let newSlug = tellme.getSlug(0);
    // console.log(doc);
    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    should.not.exist(doc.slugNoUpdateMany);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`updateMany` - update resource', async () => {
    let doc = await Hook.create({
      title: tellme.getText(0),
    });
    let { _id } = doc;
    await Hook.updateMany({ _id }, { title: tellme.getText(1) });
    doc = await Hook.findOne({ _id });
    let oldSlug = tellme.getSlug(0);
    let newSlug = tellme.getSlug(1);

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(oldSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(newSlug);
  });

  it('`findOneAndUpdate` - create(upsert) a new resource', async () => {
    let doc = await Hook.findOneAndUpdate(
      {},
      {
        title: tellme.getText(0),
      },
      { upsert: true, new: true }
    );
    // console.log("create by findOneAndUpdate",res);

    let newSlug = tellme.getSlug(0);
    // console.log(doc);
    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    should.not.exist(doc.slugNoFindOneAndUpdate);
  });

  it('`findOneAndUpdate` - update resource', async () => {
    let doc = await Hook.create({
      title: tellme.getText(0),
    });
    let { _id } = doc;
    doc = await Hook.findOneAndUpdate(
      { _id },
      { title: tellme.getText(1) },
      { new: true }
    );
    let oldSlug = tellme.getSlug(0);
    let newSlug = tellme.getSlug(1);

    doc.should.have.property('slug').and.equal(newSlug);

    doc.should.have.property('slugNoSave').and.equal(newSlug);

    doc.should.have.property('slugNoUpdate').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateOne').and.equal(newSlug);

    doc.should.have.property('slugNoUpdateMany').and.equal(newSlug);

    doc.should.have.property('slugNoFindOneAndUpdate').and.equal(oldSlug);
  });
});
