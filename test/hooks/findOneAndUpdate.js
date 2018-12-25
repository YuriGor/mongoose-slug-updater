const mongoose = require('mongoose');

const chai = require('chai');

const should = chai.should();

const assert = require('assert');

const { ShortId, Counter } = require('./../model');

const tellme = require('./../tellme');

describe('findOneAndUpdate', () => {
  beforeEach(async () => {
    await ShortId.remove({});
    await Counter.remove({});
  });

  afterEach(async () => {
    await ShortId.remove({});
    await Counter.remove({});
  });

  it('Update not watcher field shortId', async () => {
    // console.log(' --- findOneAndUpdate --- ');
    const doc = await ShortId.findOneAndUpdate(
      { title: 'impossible' },
      {
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
        otherField: tellme.getText(2),
      },
      { upsert: true, new: true },
    );
    // console.log(doc);
    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    const { _id } = doc;
    let mdf = {
      otherField: tellme.getText(3),
    };
    let editedDoc = await ShortId.findOneAndUpdate({ _id }, mdf, { new: true });

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));

    mdf = {
      otherField: tellme.getText(4),
    };

    editedDoc = await ShortId.findOneAndUpdate({ _id }, { $set: mdf }, { new: true });

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
  });

  it('Update not watcher field counter', async () => {
    const doc = await Counter.findOneAndUpdate(
      { title: 'impossible' },
      {
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
        otherField: tellme.getText(2),
      },
      { upsert: true, new: true },
    );
    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));

    const { _id } = doc;
    let mdf = {
      otherField: tellme.getText(3),
    };
    let editedDoc = await Counter.findOneAndUpdate({ _id }, mdf, { new: true });

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));

    mdf = {
      otherField: tellme.getText(4),
    };
    editedDoc = await Counter.findOneAndUpdate({ _id }, { $set: mdf }, { new: true });

    editedDoc.should.have.property('otherField').and.equal(mdf.otherField);

    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
  });

  it('Update title and check if slug was updated', async () => {
    const doc = await ShortId.findOneAndUpdate(
      { title: 'impossible' },
      {
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
      },
      { upsert: true, new: true },
    );
    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    const { _id } = doc;
    let mdf = {
      title: tellme.getText(2),
      // subtitle: tellme.getText(1)
    };
    // console.debug('upd_id', _id);
    let editedDoc = await ShortId.findOneAndUpdate({ _id }, mdf, { new: true });

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(2, 1));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));
    mdf = {
      title: tellme.getText(3),
      // subtitle: tellme.getText(1)
    };
    // console.debug('upd_id', _id);
    editedDoc = await ShortId.findOneAndUpdate({ _id }, { $set: mdf }, { new: true });

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(3, 1));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(3));
  });

  it('Update subtitle and check if slug was updated', async () => {
    const doc = await ShortId.findOneAndUpdate(
      { title: 'impossible' },
      {
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
      },
      { upsert: true, new: true },
    );
    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    const { _id } = doc;
    let mdf = {
      subtitle: tellme.getText(2),
    };
    let editedDoc = await ShortId.findOneAndUpdate({ _id }, mdf, { new: true });

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(0, 2));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    mdf = {
      subtitle: tellme.getText(3),
    };
    // console.debug('upd_id', _id);
    editedDoc = await ShortId.findOneAndUpdate({ _id }, { $set: mdf }, { new: true });

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(0, 3));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
  });

  it("Update watcher fields to the same values and check slugs wasn't changed", async () => {
    const doc = await ShortId.findOneAndUpdate(
      { title: 'impossible' },
      {
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
      },
      { upsert: true, new: true },
    );
    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    const { _id } = doc;
    const mdf = {
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    };
    // console.log("same values");
    let editedDoc = await ShortId.findOneAndUpdate({ _id }, mdf, { new: true });

    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));

    editedDoc = await ShortId.findOneAndUpdate({ _id }, { $set: mdf }, { new: true });

    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
  });

  it('UpdateOne without _id', async () => {
    const doc = await ShortId.findOneAndUpdate(
      { title: 'impossible' },
      {
        title: tellme.getText(0),
        subtitle: tellme.getText(1),
      },
      { upsert: true, new: true },
    );
    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
    let { _id } = doc;
    let mdf = {
      title: tellme.getText(2),
      subtitle: tellme.getText(3),
    };

    let editedDoc = await ShortId.findOneAndUpdate({ uniqueSlug: tellme.getSlug(0) }, mdf, {
      new: true,
    });

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(2, 3));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));

    ({ _id } = editedDoc);

    mdf = {
      title: tellme.getText(4),
      subtitle: tellme.getText(5),
    };

    editedDoc = await ShortId.findOneAndUpdate(
      { slug: tellme.getSlug(2, 3) },
      { $set: mdf },
      { new: true },
    );

    editedDoc.should.have.property('slug').and.equal(tellme.getSlug(4, 5));
    editedDoc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(4));
  });
});
