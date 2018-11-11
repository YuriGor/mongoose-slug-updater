'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const { nIterations, Inline, SimpleInline } = require('./../model');

const tellme = require('./../tellme');

describe('Inline Docs', function() {
  beforeEach(async () => {
    await Inline.remove({});
    await SimpleInline.remove({});
  });

  afterEach(async () => {
    await Inline.remove({});
    await SimpleInline.remove({});
  });

  it('Save nested docs declared inline', async () => {
    let doc = await Inline.create(Inline.getNewDoc());
    Inline.testNewDoc(doc);
    Inline.changeDoc(doc);
    doc = await doc.save();
    Inline.testChangedDoc(doc);
  });

  it('UpdateOne upsert simple nested docs declared inline', async () => {
    await SimpleInline.updateOne(
      {},
      {
        title: tellme.getText(0),
        child: {
          title: tellme.getText(1),
        },
        children: [
          {
            title: tellme.getText(2),
          },
        ],
      },
      { upsert: true }
    );
    let doc = await SimpleInline.findOne({});
    doc.should.have.property('slug').and.equal(tellme.getSlug(0));
    doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
    doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].title`)
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property(`children[0].slug`)
      .and.equal(tellme.getSlug(2));
  });

  it('Create partial nested docs declared inline', async () => {
    let doc = await Inline.create({
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
      .property(`children[0].title`)
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property(`children[0].slug`)
      .and.equal(tellme.getSlug(2));
  });
  it('UpdateOne upsert partial nested docs declared inline', async () => {
    await Inline.updateOne(
      {},
      {
        title: tellme.getText(0),
        child: {
          title: tellme.getText(1),
        },
        children: [
          {
            title: tellme.getText(2),
          },
        ],
      },
      { upsert: true }
    );
    let doc = await Inline.findOne({});
    // console.log(doc);
    doc.should.have.property('slug').and.equal(tellme.getSlug(0));
    doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
    doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].title`)
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property(`children[0].slug`)
      .and.equal(tellme.getSlug(2));
  });

  it('UpdateOne nested docs declared inline', async () => {
    await Inline.updateOne({},Inline.getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDoc({});
    await Inline.updateOne({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    Inline.testChangedDoc(editedDoc);
  });

  it('Update nested docs declared inline', async () => {
    await Inline.update({},Inline.getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDoc({});
    await Inline.update({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    Inline.testChangedDoc(editedDoc);
  });

  it('UpdateMany nested docs declared inline', async () => {
    await Inline.updateMany({},Inline.getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDoc({});
    await Inline.updateMany({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    Inline.testChangedDoc(editedDoc);
  });

  it('findOneAndUpdate nested docs declared inline', async () => {
    let doc = await Inline.findOneAndUpdate({},Inline.getNewDoc(),{upsert:true,new:true});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDoc({});
    let editedDoc = await Inline.findOneAndUpdate({ _id:doc._id }, mdf,{new:true});
    Inline.testChangedDoc(editedDoc);
  });
});