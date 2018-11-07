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
} = require('./../models');

const tellme = require('./../tellme');

describe('Inline Docs', function() {
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
    let docCfg = getNewDoc();

    let doc = await Parent.create(docCfg);

    testNewDoc(doc);
    doc = changeNewDoc(doc);

    await doc.save();
    testChangedDoc(doc);
  });

  it('UpdateOne nested docs declared in extrenal schemas', async () => {
    await Parent.updateOne({}, getNewDoc(), { upsert: true });
    let doc = await Parent.findOne({});
    testNewDoc(doc);
    let mdf = changeNewDoc({});
    await Parent.updateOne({ _id: doc._id }, mdf);
    let editedDoc = await Parent.findById(doc._id);
    testChangedDoc(editedDoc);
  });

  it('Update nested docs declared in extrenal schemas', async () => {
    await Parent.update({}, getNewDoc(), { upsert: true });
    let doc = await Parent.findOne({});
    testNewDoc(doc);
    let mdf = changeNewDoc({});
    await Parent.update({ _id: doc._id }, mdf);
    let editedDoc = await Parent.findById(doc._id);
    testChangedDoc(editedDoc);
  });

  it('UpdateMany nested docs declared in extrenal schemas', async () => {
    await Parent.updateMany({}, getNewDoc(), { upsert: true });
    let doc = await Parent.findOne({});
    testNewDoc(doc);
    let mdf = changeNewDoc({});
    await Parent.updateMany({ _id: doc._id }, mdf);
    let editedDoc = await Parent.findById(doc._id);
    testChangedDoc(editedDoc);
  });

  it('findOneAndUpdate nested docs declared in extrenal schemas', async () => {
    let doc = await Parent.findOneAndUpdate({}, getNewDoc(), {
      upsert: true,
      new: true,
    });
    testNewDoc(doc);
    let mdf = changeNewDoc({});
    let editedDoc = await Parent.findOneAndUpdate({ _id: doc._id }, mdf, {
      new: true,
    });
    testChangedDoc(editedDoc);
  });
});

function getNewDoc() {
  let doc = {
    title: tellme.getText(0),
    child: {
      title: tellme.getText(1),
      subChild: {
        title: tellme.getText(2),
      },
      subChildren: [],
    },
    children: [],
  };

  for (let i = 0; i < 9; i++) {
    doc.child.subChildren.push({
      title: tellme.getText(i),
    });
  }

  for (let i = 0; i < 9; i++) {
    doc.children.push({
      title: tellme.getText(8 - i),
      subChild: {
        title: tellme.getText(i),
      },
      subChildren: _.cloneDeep(doc.child.subChildren),
    });
  }

  return doc;
}

function testNewDoc(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(0));
  doc.should.have.property('slug').and.equal(tellme.getSlug(0));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(0));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(1));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(2));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(8));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(3));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(7));

  doc.should.have.nested.property('child.title').and.equal(tellme.getText(1));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChildSlug')
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.absoluteRootSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChildrenSlug2')
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property('child.subChildrenSlug3')
    .and.equal(tellme.getSlug(3));

  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(2));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(2));
  doc.should.have.nested
    .property('child.subChild.absoluteRootSlug')
    .and.equal(tellme.getSlug(0));
  doc.should.have.nested
    .property('child.subChild.absoluteChildSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(1));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(0));

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`child.subChildren.${i}.title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`child.subChildren.${i}.slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteChildSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(0));
  }

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children.${i}.title`)
      .and.equal(tellme.getText(8 - i));
    doc.should.have.nested
      .property(`children.${i}.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children.${i}.subChildSlug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children.${i}.absoluteSlug`)
      .and.equal(tellme.getSlug(1));
    doc.should.have.nested
      .property(`children.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(0));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug2`)
      .and.equal(tellme.getSlug(2));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug3`)
      .and.equal(tellme.getSlug(3));

    for (let j = 0; j < 9; j++) {
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.title`)
        .and.equal(tellme.getText(j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.slug`)
        .and.equal(tellme.getSlug(j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteRootSlug`)
        .and.equal(tellme.getSlug(0));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteChildSlug`)
        .and.equal(tellme.getSlug(1));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeParentSlug`)
        .and.equal(tellme.getSlug(8 - i));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeGrandParentSlug`)
        .and.equal(tellme.getSlug(0));
    }
  }
}

function changeNewDoc(doc) {
  let changed = {
    title: tellme.getText(8),
    child: {
      title: tellme.getText(7),
      subChild: { title: tellme.getText(6) },
      subChildren: [],
    },
    children: [],
  };

  for (let i = 0; i < 9; i++) {
    changed.child.subChildren[i] = { title: tellme.getText(8 - i) };
  }

  for (let i = 0; i < 9; i++) {
    changed.children[i] = { title: tellme.getText(i), subChildren: [] };
    changed.children[i].subChild = { title: tellme.getText(8 - i) };
    for (let j = 0; j < 9; j++) {
      changed.children[i].subChildren[j] = { title: tellme.getText(8 - j) };
    }
  }
  return _.merge(doc, changed);
}

function testChangedDoc(doc) {
  doc.should.have.property('title').and.equal(tellme.getText(8));
  doc.should.have.property('slug').and.equal(tellme.getSlug(8));
  doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(8));
  doc.should.have.property('childSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(7));
  doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(6));
  doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(0));
  doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
  doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(5));
  doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(1));

  doc.should.have.nested.property('child.title').and.equal(tellme.getText(7));
  doc.should.have.nested.property('child.slug').and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChildSlug')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.absoluteSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.absoluteRootSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.relativeParentSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChildrenSlug2')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.subChildrenSlug3')
    .and.equal(tellme.getSlug(5));

  doc.should.have.nested
    .property('child.subChild.title')
    .and.equal(tellme.getText(6));
  doc.should.have.nested
    .property('child.subChild.slug')
    .and.equal(tellme.getSlug(6));
  doc.should.have.nested
    .property('child.subChild.absoluteRootSlug')
    .and.equal(tellme.getSlug(8));
  doc.should.have.nested
    .property('child.subChild.absoluteChildSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.relativeParentSlug')
    .and.equal(tellme.getSlug(7));
  doc.should.have.nested
    .property('child.subChild.relativeGrandParentSlug')
    .and.equal(tellme.getSlug(8));

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`child.subChildren.${i}.title`)
      .and.equal(tellme.getText(8 - i));
    doc.should.have.nested
      .property(`child.subChildren.${i}.slug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`child.subChildren.${i}.absoluteChildSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`child.subChildren.${i}.relativeGrandParentSlug`)
      .and.equal(tellme.getSlug(8));
  }

  for (let i = 0; i < 9; i++) {
    doc.should.have.nested
      .property(`children.${i}.title`)
      .and.equal(tellme.getText(i));
    doc.should.have.nested
      .property(`children.${i}.slug`)
      .and.equal(tellme.getSlug(i));
    doc.should.have.nested
      .property(`children.${i}.subChildSlug`)
      .and.equal(tellme.getSlug(8 - i));
    doc.should.have.nested
      .property(`children.${i}.absoluteSlug`)
      .and.equal(tellme.getSlug(7));
    doc.should.have.nested
      .property(`children.${i}.absoluteRootSlug`)
      .and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`children.${i}.relativeParentSlug`)
      .and.equal(tellme.getSlug(8));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug2`)
      .and.equal(tellme.getSlug(6));
    doc.should.have.nested
      .property(`children.${i}.subChildrenSlug3`)
      .and.equal(tellme.getSlug(5));

    for (let j = 0; j < 9; j++) {
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.title`)
        .and.equal(tellme.getText(8 - j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.slug`)
        .and.equal(tellme.getSlug(8 - j));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteRootSlug`)
        .and.equal(tellme.getSlug(8));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.absoluteChildSlug`)
        .and.equal(tellme.getSlug(7));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeParentSlug`)
        .and.equal(tellme.getSlug(i));
      doc.should.have.nested
        .property(`children.${i}.subChildren.${j}.relativeGrandParentSlug`)
        .and.equal(tellme.getSlug(8));
    }
  }
}
