const _ = require('lodash');

const mongoose = require('mongoose');

const chai = require('chai');

const should = chai.should();

const assert = require('assert');

const { nIterations, SubChild, Child, Parent, SimpleChild, SimpleParent } = require('./../model');

const tellme = require('./../tellme');

describe('Nested Docs', () => {
  beforeEach(async () => {
    await Parent.remove({});
    await SimpleParent.remove({});
  });

  afterEach(async () => {
    await Parent.remove({});
    await SimpleParent.remove({});
  });

  it('Save simple nested doc declared in extrenal schemas', async () => {
    const doc = await SimpleParent.create({
      title: tellme.getText(0),
      child: {
        title: tellme.getText(1),
      },
      children: [
        {
          title: tellme.getText(2),
        },
      ],
    });

    doc.should.have.property('slug').and.equal(tellme.getSlug(0));
    doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
    doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
    doc.should.have.nested.property('children.0.slug').and.equal(tellme.getSlug(2));
  });

  it('Save nested doc declared in extrenal schemas', async () => {
    const docCfg = Parent.getNewDoc();

    let doc = await Parent.create(docCfg);

    Parent.testNewDoc(doc);
    doc = Parent.changeDoc(doc);

    await doc.save();
    Parent.testChangedDoc(doc);
  });

  it('UpdateOne nested docs declared in extrenal schemas', async () => {
    await Parent.updateOne({}, Parent.getNewDoc(), { upsert: true });
    const doc = await Parent.findOne({});
    // console.log('doc', doc);
    Parent.testNewDoc(doc);
    const mdf = Parent.changeDoc({});
    await Parent.updateOne({ _id: doc._id }, mdf);
    const editedDoc = await Parent.findById(doc._id);
    Parent.testChangedDoc(editedDoc);
  });

  it('Update nested docs declared in extrenal schemas', async () => {
    await Parent.update({}, Parent.getNewDoc(), { upsert: true });
    const doc = await Parent.findOne({});
    Parent.testNewDoc(doc);
    const mdf = Parent.changeDoc({});
    await Parent.update({ _id: doc._id }, mdf);
    const editedDoc = await Parent.findById(doc._id);
    Parent.testChangedDoc(editedDoc);
  });

  it('UpdateMany nested docs declared in extrenal schemas', async () => {
    await Parent.updateMany({}, Parent.getNewDoc(), { upsert: true });
    const doc = await Parent.findOne({});
    Parent.testNewDoc(doc);
    const mdf = Parent.changeDoc({});
    await Parent.updateMany({ _id: doc._id }, mdf);
    const editedDoc = await Parent.findById(doc._id);
    Parent.testChangedDoc(editedDoc);
  });

  it('findOneAndUpdate nested docs declared in extrenal schemas', async () => {
    const doc = await Parent.findOneAndUpdate({}, Parent.getNewDoc(), {
      upsert: true,
      new: true,
    });
    Parent.testNewDoc(doc);
    const mdf = Parent.changeDoc({});
    const editedDoc = await Parent.findOneAndUpdate({ _id: doc._id }, mdf, {
      new: true,
    });
    Parent.testChangedDoc(editedDoc);
  });
});
