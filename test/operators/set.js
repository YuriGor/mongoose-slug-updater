'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const { nIterations, SimpleInline, SimpleParent, Inline } = require('./../model');

const tellme = require('./../tellme');
/* Tests */

describe('$set', function() {
  beforeEach(async () => {
    await SimpleParent.remove({});
    await SimpleInline.remove({});
  });

  afterEach(async () => {
    await SimpleParent.remove({});
    await SimpleInline.remove({});
  });

  it('UpdateOne upsert nested docs SimpleInline', async () => {
    let doc = await SimpleInline.create({
      title: tellme.getText(0),
      child: { title: tellme.getText(1) },
      children:[
        { title: tellme.getText(8) },
        { title: tellme.getText(7) },
        { title: tellme.getText(6) },
      ]
    });
    doc.should.have.property('title').and.equal(tellme.getText(0));
    doc.should.have.property('slug').and.equal(tellme.getSlug(0));
    doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
    doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].title`)
      .and.equal(tellme.getText(8));
    doc.should.have.nested
      .property(`children[0].slug`)
      .and.equal(tellme.getSlug(8));
      doc.should.have.nested
      .property(`children[1].title`)
      .and.equal(tellme.getText(7));
    doc.should.have.nested
      .property(`children[1].slug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`children[2].title`)
      .and.equal(tellme.getText(6));
    doc.should.have.nested
      .property(`children[2].slug`)
      .and.equal(tellme.getSlug(6));
    doc = await SimpleInline.findOneAndUpdate(
      {},
      {
        "$set": {
          title: tellme.getText(8),
          'child.title': tellme.getText(7),
          'children.0.title': tellme.getText(0),
          'children.1.title': tellme.getText(1),
          'children.2.title': tellme.getText(2),
        },
      },{new:true}
    );
    doc.should.have.property('title').and.equal(tellme.getText(8));
    doc.should.have.property('slug').and.equal(tellme.getSlug(8));
    doc.should.have.nested.property('child.title').and.equal(tellme.getText(7));
    doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`children[0].title`)
      .and.equal(tellme.getText(0));
    doc.should.have.nested
      .property(`children[0].slug`)
      .and.equal(tellme.getSlug(0));
      doc.should.have.nested
      .property(`children[1].title`)
      .and.equal(tellme.getText(1));
    doc.should.have.nested
      .property(`children[1].slug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[2].title`)
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property(`children[2].slug`)
      .and.equal(tellme.getSlug(2));
  });

  it('UpdateOne nested docs declared inline', async () => {
    await Inline.updateOne({},Inline.getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDocPaths({});
    // console.log(mdf);
    await Inline.updateOne({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    Inline.testChangedDoc(editedDoc);
  });
  it('Update nested docs declared inline', async () => {
    await Inline.update({},Inline.getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDocPaths({});
    await Inline.update({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    Inline.testChangedDoc(editedDoc);
  });

  it('UpdateMany nested docs declared inline', async () => {
    await Inline.updateMany({},Inline.getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDocPaths({});
    await Inline.updateMany({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    Inline.testChangedDoc(editedDoc);
  });

  it('findOneAndUpdate nested docs declared inline', async () => {
    let doc = await Inline.findOneAndUpdate({},Inline.getNewDoc(),{upsert:true,new:true});
    Inline.testNewDoc(doc);
    let mdf = Inline.changeDocPaths({});
    let editedDoc = await Inline.findOneAndUpdate({ _id:doc._id }, mdf,{new:true});
    Inline.testChangedDoc(editedDoc);
  });
});
