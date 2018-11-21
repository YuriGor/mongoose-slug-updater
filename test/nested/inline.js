'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  expect = chai.expect,
  assert = require('assert');

const { nIterations, Inline, SimpleInline } = require('./../model');

const tellme = require('./../tellme');

describe('Inline Docs', function() {
  this.timeout(5000);
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
          {
            title: tellme.getText(3),
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
    doc.should.have.nested
      .property(`children[1].title`)
      .and.equal(tellme.getText(3));
    doc.should.have.nested
      .property(`children[1].slug`)
      .and.equal(tellme.getSlug(3));
    await SimpleInline.updateOne(
      {_id:doc._id},
      {
        $set:{
          'children.1.title': tellme.getText(4),
        }
      }
    );
    doc = await SimpleInline.findById(doc._id);
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
    doc.should.have.nested
      .property(`children[1].title`)
      .and.equal(tellme.getText(4));
    doc.should.have.nested
      .property(`children[1].slug`)
      .and.equal(tellme.getSlug(4));

    doc.children[1].title=tellme.getText(5);
    await doc.save();
    doc.should.have.property('slug').and.equal(tellme.getSlug(0));
    doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
    doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].title`)
      .and.equal(tellme.getText(2));
    doc.should.have.nested
      .property(`children[0].slug`)
      .and.equal(tellme.getSlug(2));
    doc.should.have.nested
      .property(`children[1].title`)
      .and.equal(tellme.getText(5));
    doc.should.have.nested
      .property(`children[1].slug`)
      .and.equal(tellme.getSlug(5));
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

  it('Create/Save nested docs declared inline', async () => {
    let docs = [];
    for(let i=0;i<nIterations;i++){
      docs[i] = await Inline.create(Inline.getNewDoc(i));
      Inline.testNewDoc(doc,i);
    }
    for(let i=0;i<nIterations;i++){
      docs[i] = Inline.changeDoc(docs[i],i);
      await docs[i].save();
      Inline.testChangedDoc(docs[i],i);
    }
    let equalDocs = [];
    for(let i=0;i<nIterations;i++){
      equalDocs[i] = Inline.changeDoc(docs[i],i);
      await equalDocs[i].save();
      Inline.testChangedDoc(equalDocs[i],i);
    }
    expect(equalDocs).to.deep.equal(docs);
  });

  it('UpdateOne nested docs declared inline', async () => {
    let docs = [];
    for(let i=0;i<nIterations;i++){
      await Inline.updateOne({n:i},Inline.getNewDoc(n),{upsert:true});
      docs[i] = await Inline.findOne({n:i});
      Inline.testNewDoc(docs[i],i);
    }
    let mdf = Inline.changeDoc({});
    for(let i=0;i<nIterations;i++){
      await Inline.updateOne({ n:i }, mdf);
      docs[i] = await Inline.findOne({n:i});
      Inline.testChangedDoc(docs[i],n);
    }
    let equalDocs=[];
    for(let i=0;i<nIterations;i++){
      await Inline.updateOne({ n:i }, mdf);
      equalDocs[i] = await Inline.findOne({n:i});
      Inline.testChangedDoc(equalDocs[i],n);
    }
    expect(equalDocs).to.deep.equal(docs);
  });

  it('Update nested docs declared inline', async () => {
    let docs = [];
    for(let i=0;i<nIterations;i++){
      await Inline.update({n:i},Inline.getNewDoc(n),{upsert:true});
      docs[i] = await Inline.findOne({n:i});
      Inline.testNewDoc(docs[i],i);
    }
    let mdf = Inline.changeDoc({});
    for(let i=0;i<nIterations;i++){
      await Inline.update({ n:i }, mdf);
      docs[i] = await Inline.findOne({n:i});
      Inline.testChangedDoc(docs[i],n);
    }
    let equalDocs=[];
    for(let i=0;i<nIterations;i++){
      await Inline.update({ n:i }, mdf);
      equalDocs[i] = await Inline.findOne({n:i});
      Inline.testChangedDoc(equalDocs[i],n);
    }
    expect(equalDocs).to.deep.equal(docs);
  });

  it('UpdateMany nested docs declared inline', async () => {
    for(let i=0;i<nIterations;i++){
      await Inline.updateMany({n:i},Inline.getNewDoc(n),{upsert:true});
    }
    let docs = await Inline.find();
    for(let i=0;i<nIterations;i++){
      Inline.testNewDoc(docs[i],i);
    }
    let mdf = Inline.changeDocPaths({});
    await Inline.updateMany({}, mdf);
    docs = await Inline.find();
    for(let i=0;i<nIterations;i++){
      Inline.testChangedDoc(docs[i],i);
    }
    await Inline.updateMany({}, mdf);
    let equalDocs=await Inline.find();
    for(let i=0;i<nIterations;i++){
      Inline.testChangedDoc(equalDocs[i],i);
    }
    expect(equalDocs).to.deep.equal(docs);
  });

  it('findOneAndUpdate nested docs declared inline', async () => {
    let docs = [];
    for(let i=0;i<nIterations;i++){
      docs[i] = await Inline.findOneAndUpdate({n:i},Inline.getNewDoc(i),{upsert:true,new:true});
      Inline.testNewDoc(docs[i],i);
    }
    let mdf = Inline.changeDoc({});
    for(let i=0;i<nIterations;i++){
      docs[i] = await Inline.findOneAndUpdate({n:i}, mdf,{new:true});
      Inline.testNewDoc(docs[i],i);
    }
    let equalDocs=[];
    for(let i=0;i<nIterations;i++){
      equalDocs[i] = await Inline.findOneAndUpdate({n:i}, mdf,{new:true});
      Inline.testNewDoc(equalDocs[i],i);
    }
    expect(equalDocs).to.deep.equal(docs);
  });
});