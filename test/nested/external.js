'use strict';

const _ = require('lodash'),
  mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const {
  nIterations,
  SubChild,
  Child,
  Parent,
  SimpleChild,
  SimpleParent,
} = require('./../model');

const tellme = require('./../tellme');

describe('Nested Docs', function() {
  beforeEach(async () => {
    await Parent.remove({});
    await SimpleParent.remove({});
  });

  afterEach(async () => {
    await Parent.remove({});
    await SimpleParent.remove({});
  });

  it('Save simple nested doc declared in extrenal schemas', async () => {
    let doc = await SimpleParent.create({
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
    doc.should.have.nested
      .property('children.0.slug')
      .and.equal(tellme.getSlug(2));
  });

  it('Save nested doc declared in extrenal schemas', async () => {
    let docCfg = Parent.getNewDoc();

    let doc = await Parent.create(docCfg);

    Parent.testNewDoc(doc);
    doc = Parent.changeNewDoc(doc);

    await doc.save();
    Parent.testChangedDoc(doc);
  });

  it('UpdateOne nested docs declared in extrenal schemas', async () => {
    await Parent.updateOne({}, Parent.getNewDoc(), { upsert: true });
    let doc = await Parent.findOne({});
    Parent.testNewDoc(doc);
    let mdf = Parent.changeNewDoc({});
    await Parent.updateOne({ _id: doc._id }, mdf);
    let editedDoc = await Parent.findById(doc._id);
    Parent.testChangedDoc(editedDoc);
  });

  it('Update nested docs declared in extrenal schemas', async () => {
    await Parent.update({}, Parent.getNewDoc(), { upsert: true });
    let doc = await Parent.findOne({});
    Parent.testNewDoc(doc);
    let mdf = Parent.changeNewDoc({});
    await Parent.update({ _id: doc._id }, mdf);
    let editedDoc = await Parent.findById(doc._id);
    Parent.testChangedDoc(editedDoc);
  });

  it('UpdateMany nested docs declared in extrenal schemas', async () => {
    await Parent.updateMany({}, Parent.getNewDoc(), { upsert: true });
    let doc = await Parent.findOne({});
    Parent.testNewDoc(doc);
    let mdf = Parent.changeNewDoc({});
    await Parent.updateMany({ _id: doc._id }, mdf);
    let editedDoc = await Parent.findById(doc._id);
    Parent.testChangedDoc(editedDoc);
  });

  it('findOneAndUpdate nested docs declared in extrenal schemas', async () => {
    let doc = await Parent.findOneAndUpdate({}, Parent.getNewDoc(), {
      upsert: true,
      new: true,
    });
    Parent.testNewDoc(doc);
    let mdf = Parent.changeNewDoc({});
    let editedDoc = await Parent.findOneAndUpdate({ _id: doc._id }, mdf, {
      new: true,
    });
    Parent.testChangedDoc(editedDoc);
  });
});
