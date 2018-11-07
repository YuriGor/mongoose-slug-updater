'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const { nIterations, Inline, SimpleInline } = require('./../models');

const tellme = require('./../tellme');
/* Tests */

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
    let doc = await Inline.create(getNewDoc());
    testNewDoc(doc);
    changeDoc(doc);
    doc = await doc.save();
    testChangedDoc(doc);
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
    await Inline.updateOne({},getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    testNewDoc(doc);
    let mdf = changeDoc({});
    await Inline.updateOne({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    testChangedDoc(editedDoc);
  });

  it('Update nested docs declared inline', async () => {
    await Inline.update({},getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    testNewDoc(doc);
    let mdf = changeDoc({});
    await Inline.update({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    testChangedDoc(editedDoc);
  });

  it('UpdateMany nested docs declared inline', async () => {
    await Inline.updateMany({},getNewDoc(),{upsert:true});
    let doc = await Inline.findOne({});
    testNewDoc(doc);
    let mdf = changeDoc({});
    await Inline.updateMany({ _id:doc._id }, mdf);
    let editedDoc = await Inline.findById(doc._id);
    testChangedDoc(editedDoc);
  });

  it('findOneAndUpdate nested docs declared inline', async () => {
    let doc = await Inline.findOneAndUpdate({},getNewDoc(),{upsert:true,new:true});
    testNewDoc(doc);
    let mdf = changeDoc({});
    let editedDoc = await Inline.findOneAndUpdate({ _id:doc._id }, mdf,{new:true});
    testChangedDoc(editedDoc);
  });
});

function getNewDoc() {
  return {
    title: tellme.getText(0),
    child: {
      title: tellme.getText(1),
      subChild: {
        title: tellme.getText(7),
      },
    },
    children: [
      {
        title: tellme.getText(0),
        subChild: {
          title: tellme.getText(8),
        },
        subChildren: [
          {
            title: tellme.getText(0),
            subChild: {
              title: tellme.getText(8),
            },
          },
          {
            title: tellme.getText(1),
            subChild: {
              title: tellme.getText(7),
            },
          },
          {
            title: tellme.getText(2),
            subChild: {
              title: tellme.getText(6),
            },
          },
          {
            title: tellme.getText(3),
            subChild: {
              title: tellme.getText(5),
            },
          },
          {
            title: tellme.getText(4),
            subChild: {
              title: tellme.getText(4),
            },
          },
          {
            title: tellme.getText(5),
            subChild: {
              title: tellme.getText(3),
            },
          },
          {
            title: tellme.getText(6),
            subChild: {
              title: tellme.getText(2),
            },
          },
          {
            title: tellme.getText(7),
            subChild: {
              title: tellme.getText(1),
            },
          },
          {
            title: tellme.getText(8),
            subChild: {
              title: tellme.getText(0),
            },
          },
        ],
      },
      {
        title: tellme.getText(1),
        subChild: {
          title: tellme.getText(7),
        },
      },
      {
        title: tellme.getText(2),
        subChild: {
          title: tellme.getText(6),
        },
      },
      {
        title: tellme.getText(3),
        subChild: {
          title: tellme.getText(5),
        },
      },
      {
        title: tellme.getText(4),
        subChild: {
          title: tellme.getText(4),
        },
      },
      {
        title: tellme.getText(5),
        subChild: {
          title: tellme.getText(3),
        },
      },
      {
        title: tellme.getText(6),
        subChild: {
          title: tellme.getText(2),
        },
      },
      {
        title: tellme.getText(7),
        subChild: {
          title: tellme.getText(1),
        },
      },
      {
        title: tellme.getText(8),
        subChild: {
          title: tellme.getText(0),
        },
      },
    ],
  };
}

function testNewDoc(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(0));
  doc.should.have.property('slug').and.equal(tellme.getSlug(0));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(0));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(0));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(3));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(7));
  doc.should.have
    .property('subChildrenSlug5SubChild')
    .and.equal(tellme.getSlug(3));
  doc.should.have
    .property('subChildrenSlug2SubChild')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.absoluteParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(7));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.absoluteParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(0));
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children[${i}].title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`children[${i}].slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[${i}].absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[${i}].absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[${i}].relativeRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[${i}].absoluteSiblingSlug`)
      .and.equal(tellme.getSlug(3));
    doc.should.have.nested
      .property(`children[${i}].relativeSiblingSlug`)
      .and.equal(tellme.getSlug(4));
    doc.should.have.nested
      .property(`children[${i}].subChild.title`)
      .and.equal(tellme.getText(8 - i));
    doc.should.have.nested
      .property(`children[${i}].subChild.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children[${i}].subChild.absoluteParentSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[${i}].subChild.absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeParentSlug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(0));
  }
  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].relativeRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].absoluteSiblingSlug`)
      .and.equal(tellme.getSlug(5));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].relativeSiblingSlug`)
      .and.equal(tellme.getSlug(6));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.title`)
      .and.equal(tellme.getText(8 - i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.absoluteParentSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children[0].subChildren[${i}].subChild.relativeParentSlug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children[${i}].subChild.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(0));
  }
}

function changeDoc(doc) {
  if(!doc.child)doc.child={};
  if(!doc.child.subChild)doc.child.subChild={};
  if(!doc.children)doc.children=[];
  if(!doc.children[0])doc.children[0]={};
  if(!doc.children[3])doc.children[3]={};
  if(!doc.children[4])doc.children[4]={};
  if(!doc.children[0].subChildren)doc.children[0].subChildren=[];
  if(!doc.children[0].subChildren[2])doc.children[0].subChildren[2]={};
  if(!doc.children[0].subChildren[2].subChild)doc.children[0].subChildren[2].subChild={};
  if(!doc.children[0].subChildren[3])doc.children[0].subChildren[3]={};
  if(!doc.children[0].subChildren[5])doc.children[0].subChildren[5]={};
  if(!doc.children[0].subChildren[5].subChild)doc.children[0].subChildren[5].subChild={};
  if(!doc.children[0].subChildren[6])doc.children[0].subChildren[6]={};
  if(!doc.children[0].subChildren[7])doc.children[0].subChildren[7]={};
  if(!doc.children[0].subChildren[8])doc.children[0].subChildren[8]={};
  if(!doc.children[0].subChildren[8].subChild)doc.children[0].subChildren[8].subChild={};

  if(!doc.children[7])doc.children[7]={};
  if(!doc.children[7].subChildren)doc.children[7].subChildren=[];
  if(!doc.children[7].subChild)doc.children[7].subChild={};

  doc.title = tellme.getText(8);
  doc.child.title = tellme.getText(7);
  doc.child.subChild.title = tellme.getText(6);
  doc.children[0].title = tellme.getText(4);
  doc.children[3].title = tellme.getText(7);
  doc.children[4].title = tellme.getText(0);
  doc.children[0].subChildren[3].title = tellme.getText(8);
  doc.children[0].subChildren[7].title = tellme.getText(2);
  doc.children[0].subChildren[5].title = tellme.getText(4);
  doc.children[0].subChildren[6].title = tellme.getText(1);
  doc.children[0].subChildren[5].subChild.title = tellme.getText(2);
  doc.children[0].subChildren[2].subChild.title = tellme.getText(4);
  doc.children[7].subChild.title = tellme.getText(3);
  return doc;
}

function testChangedDoc(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(8));
  doc.should.have.property('slug').and.equal(tellme.getSlug(8));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(8));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property(`children[0].title`)
    .and.equal(tellme.getText(4));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(4));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(0));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(8));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(2));
  doc.should.have
    .property('subChildrenSlug5SubChild')
    .and.equal(tellme.getSlug(2));
  doc.should.have
    .property('subChildrenSlug2SubChild')
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested.property('child.title').and.equal(tellme.getText(7));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.absoluteParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(6));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.subChild.absoluteParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(8));

  
  doc.should.have.nested
    .property(`children[0].slug`)
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested
    .property(`children[0].absoluteRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].relativeRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].absoluteSiblingSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].relativeSiblingSlug`)
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property(`children[7].subChild.title`)
    .and.equal(tellme.getText(3));
  doc.should.have.nested
    .property(`children[7].subChild.slug`)
    .and.equal(tellme.getSlug(3));
  doc.should.have.nested
    .property(`children[0].subChild.absoluteParentSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChild.absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].subChild.relativeParentSlug`)
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested
    .property(`children[0].subChild.relativeGrandParentSlug`)
    .and.equal(tellme.getSlug(8));

  doc.should.have.nested
    .property(`children[0].subChildren[3].title`)
    .and.equal(tellme.getText(8));
  doc.should.have.nested
    .property(`children[0].subChildren[7].title`)
    .and.equal(tellme.getText(2));
  doc.should.have.nested
    .property(`children[0].subChildren[3].slug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[7].slug`)
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property(`children[0].subChildren[3].absoluteRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[7].absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].subChildren[3].relativeRootSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[3].absoluteSiblingSlug`)
    .and.equal(tellme.getSlug(4));
  doc.should.have.nested
    .property(`children[0].subChildren[7].relativeSiblingSlug`)
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property(`children[0].subChildren[5].subChild.title`)
    .and.equal(tellme.getText(2));
  doc.should.have.nested
    .property(`children[0].subChildren[5].subChild.slug`)
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property(`children[0].subChildren[2].subChild.absoluteParentSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChildren[8].subChild.absoluteChildSlug`)
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property(`children[0].subChildren[3].subChild.relativeParentSlug`)
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property(`children[0].subChild.relativeGrandParentSlug`)
    .and.equal(tellme.getSlug(8));
}
