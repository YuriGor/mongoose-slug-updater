const mongoose = require('mongoose');

const chai = require('chai');

const should = chai.should();

const assert = require('assert');

const { ShortId, Counter } = require('./../model');

const tellme = require('./../tellme');
const { nIterations } = require('./../options');

describe('updateOne', () => {
  beforeEach(async () => {
    await ShortId.remove({});
    await Counter.remove({});
  });

  afterEach(async () => {
    await ShortId.remove({});
    await Counter.remove({});
  });

  it('Update not watcher field shortId', async () => {
    const res = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      otherField: tellme.getText(1),
    });
    const { _id, slug, uniqueSlug } = res;
    res.should.have
      .property('forcedSlug')
      .match(tellme.getShortRegex(1))
      .and.not.equal(tellme.getSlug(1));
    let mdf = {
      otherField: tellme.getText(1),
    };
    await ShortId.updateOne({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: tellme.getText(4),
    };
    await ShortId.updateOne({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('Update not watcher field counter', async () => {
    const res = await Counter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
      otherField: tellme.getText(1),
    });
    const { _id, slug, uniqueSlug } = res;
    let mdf = {
      otherField: tellme.getText(1),
    };
    await Counter.updateOne({ _id }, mdf);
    let editedDoc = await Counter.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: tellme.getText(4),
    };
    await Counter.updateOne({ _id }, { $set: mdf });
    editedDoc = await Counter.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);
  });

  it('Update title and check if slug was updated', async () => {
    const res = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    const { _id, slug, uniqueSlug } = res;
    let mdf = {
      title: tellme.getText(2),
      // subtitle: tellme.getText(1)
    };
    // console.debug('upd_id', _id);
    await ShortId.updateOne({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(2, 1));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));
    mdf = {
      title: tellme.getText(3),
      // subtitle: tellme.getText(1)
    };
    // console.debug('upd_id', _id);
    await ShortId.updateOne({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(3, 1));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(3));
  });

  it('Update subtitle and check if slug was updated', async () => {
    const res = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    res.should.have
      .property('forcedSlug')
      .match(tellme.getShortRegex(1))
      .and.not.equal(tellme.getSlug(1));
    // console.debug('created doc', res);
    const { _id, slug, uniqueSlug } = res;
    let mdf = {
      subtitle: tellme.getText(3),
    };
    await ShortId.updateOne({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(0, 3));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));

    editedDoc.should.have
      .property('forcedSlug')
      .match(tellme.getShortRegex(3))
      .and.not.equal(tellme.getSlug(3));
    mdf = {
      subtitle: tellme.getText(4),
    };
    // console.debug('upd_id', _id);
    await ShortId.updateOne({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(0, 4));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    editedDoc.should.have
      .property('forcedSlug')
      .match(tellme.getShortRegex(4))
      .and.not.equal(tellme.getSlug(4));
  });

  it("Update watcher fields to the same values and check slugs wasn't changed", async () => {
    const res = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    const { _id, slug, uniqueSlug } = res;
    const mdf = {
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
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

  it("Update watcher fields to the same values and check counter wasn't changed", async () => {
    const mdf = {
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    };
    const docs = [];
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await Counter.create(mdf);
    }
    docs[0].should.have.property('title').and.equal(tellme.getText(0));
    docs[0].should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    for (let i = 1; i < nIterations; i++) {
      docs[i].should.have.property('title').and.equal(tellme.getText(0));
      docs[i].should.have.property('uniqueSlug').and.equal(tellme.getCounterSlug(0, i));
    }

    for (let i = 0; i < nIterations; i++) {
      await Counter.updateOne({ _id: docs[i]._id }, mdf);
      docs[i] = await Counter.findById(docs[i]._id);
    }

    docs[0].should.have.property('title').and.equal(tellme.getText(0));
    docs[0].should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    for (let i = 1; i < nIterations; i++) {
      docs[i].should.have.property('title').and.equal(tellme.getText(0));
      docs[i].should.have.property('uniqueSlug').and.equal(tellme.getCounterSlug(0, i));
    }
  });

  it('UpdateOne without _id', async () => {
    const doc = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    let { _id, slug, uniqueSlug } = doc;
    let mdf = {
      title: tellme.getText(2),
      subtitle: tellme.getText(3),
    };

    await ShortId.updateOne({ uniqueSlug }, mdf);
    let editedDoc = await ShortId.findOne(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(2, 3));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));

    ({ _id, slug, uniqueSlug } = editedDoc);

    mdf = {
      title: tellme.getText(4),
      subtitle: tellme.getText(5),
    };

    await ShortId.updateOne({ slug }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(4, 5));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(4));
  });
});
