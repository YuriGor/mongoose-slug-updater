const mongoose = require('mongoose');

const chai = require('chai');

const should = chai.should();

const assert = require('assert');

const { nIterations, ShortId, Counter } = require('./../model');

const tellme = require('./../tellme');

describe('update', () => {
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
    let mdf = {
      otherField: tellme.getText(1),
    };
    await ShortId.update({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: tellme.getText(4),
    };
    await ShortId.update({ _id }, { $set: mdf });
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
    await Counter.update({ _id }, mdf);
    let editedDoc = await Counter.findById(_id);

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    editedDoc.should.have.property('slug').and.equal(slug);

    editedDoc.should.have.property('uniqueSlug').and.equal(uniqueSlug);

    mdf = {
      otherField: tellme.getText(4),
    };
    await Counter.update({ _id }, { $set: mdf });
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
    await ShortId.update({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(2, 1));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));
    mdf = {
      title: tellme.getText(3),
      // subtitle: tellme.getText(1)
    };
    // console.debug('upd_id', _id);
    await ShortId.update({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(3, 1));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(3));
  });

  it('Update subtitle and check if slug was updated', async () => {
    const res = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    // console.debug('created doc', res);
    const { _id, slug, uniqueSlug } = res;
    let mdf = {
      subtitle: tellme.getText(3),
    };
    await ShortId.update({ _id }, mdf);
    let editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(0, 3));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    mdf = {
      subtitle: tellme.getText(4),
    };
    // console.debug('upd_id', _id);
    await ShortId.update({ _id }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(0, 4));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
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
    const doc = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    let { _id, slug, uniqueSlug } = doc;
    let mdf = {
      title: tellme.getText(2),
      subtitle: tellme.getText(3),
    };

    await ShortId.update({ uniqueSlug }, mdf);
    let editedDoc = await ShortId.findOne(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(2, 3));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));

    ({ _id, slug, uniqueSlug } = editedDoc);

    mdf = {
      title: tellme.getText(4),
      subtitle: tellme.getText(5),
    };

    await ShortId.update({ slug }, { $set: mdf });
    editedDoc = await ShortId.findById(_id);

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(4, 5));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(4));
  });

  it('Update multiply slugs', async () => {
    let docs = [];
    for (let i = 0; i < 10; i++) {
      // console.log(i);
      docs[i] = await ShortId.create({
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
        otherField: i,
      });
      docs[i].should.have.property('slug').and.equal(tellme.getSlug(0, 1));
      if (i) docs[i].should.have.property('uniqueSlug').and.match(tellme.getShortRegex(0));
      else docs[i].should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    }
    // console.log(' ---- updateMany');
    await ShortId.updateMany({ otherField: { $gt: 4 } }, { title: tellme.getText(1) });
    // console.log(' ---- updateMany done');

    docs = ShortId.find({ otherField: { $lt: 5 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have.property('slug').and.equal(tellme.getSlug(0, 1));
      docs[i].should.have.property('uniqueSlug').and.match(tellme.getShortRegex(0));
    }

    docs = ShortId.find({ otherField: { $gt: 4 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have.property('slug').and.equal(tellme.getSlug(2, 1));
      if (i) docs[i].should.have.property('uniqueSlug').and.match(tellme.getShortRegex(2));
      else docs[i].should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));
    }
  });

  it('Update multiply counter slugs', async () => {
    let docs = [];
    for (let i = 0; i < 10; i++) {
      docs[i] = await Counter.create({
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
        otherField: i,
      });
      docs[i].should.have.property('slug').and.equal(tellme.getSlug(0, 1));
      if (i) docs[i].should.have.property('uniqueSlug').and.equal(tellme.getCounterSlug(0, i));
      else docs[i].should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    }
    await Counter.updateMany({ otherField: { $gt: 4 } }, { title: tellme.getText(1) });

    docs = Counter.find({ otherField: { $lt: 5 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have.property('slug').and.equal(tellme.getSlug(0, 1));
      if (i) docs[i].should.have.property('uniqueSlug').and.equal(tellme.getCounterSlug(0, i));
      else docs[i].should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    }

    docs = Counter.find({ otherField: { $gt: 4 } });
    for (let i = 0; i < docs.length; i++) {
      docs[i].should.have.property('slug').and.equal(tellme.getSlug(2, 1));
      if (i) docs[i].should.have.property('uniqueSlug').and.equal(tellme.getCounterSlug(2, i));
      else docs[i].should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));
    }
  });
});
