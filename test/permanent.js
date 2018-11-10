'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const {
  Permanent
} = require("./model");

const tellme = require('./tellme');
/* Tests */
var resource = {};

describe('Permanent option', function() {
  beforeEach(async () => {
    await Permanent.remove({});
  });

  afterEach(async () => {
    await Permanent.remove({});
  });

  it('Change fields and check permanent slugs remain unchanged', async () => {
    let doc = await Permanent.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    doc.should.have
      .property('slug')
      .and.equal(
        tellme.getSlug(0,1)
      );

    doc.should.have
      .property('titleSlug')
      .and.equal(tellme.getSlug(0));

    doc.should.have
      .property('subtitleSlug')
      .and.equal(tellme.getSlug(1));

    let { _id, slug, titleSlug, subtitleSlug } = doc;
    doc.title = tellme.getText(2);
    doc.subtitle = tellme.getText(3);
    let editedDoc = await doc.save();

    editedDoc.should.have
      .property('slug')
      .and.equal(
        tellme.getSlug(2,3)
      );

    editedDoc.should.have.property('titleSlug').and.equal(titleSlug);

    editedDoc.should.have.property('subtitleSlug').and.equal(subtitleSlug);
  });

  it('UpdateOne fields and check permanent slugs remain unchanged', async () => {
    let doc = await Permanent.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    doc.should.have
      .property('slug')
      .and.equal(
        tellme.getSlug(0,1)
      );

    doc.should.have
      .property('titleSlug')
      .and.equal(tellme.getSlug(0));

    doc.should.have
      .property('subtitleSlug')
      .and.equal(tellme.getSlug(1));

    let { _id, slug, titleSlug, subtitleSlug } = doc;
    let mdf = {
      title: tellme.getText(2),
      subtitle: tellme.getText(3),
    };
    await Permanent.updateOne({ _id }, mdf);
    let editedDoc = await Permanent.findOne({ _id });

    editedDoc.should.have
      .property('slug')
      .and.equal(
        tellme.getSlug(2,3)
      );

    editedDoc.should.have.property('titleSlug').and.equal(titleSlug);

    editedDoc.should.have.property('subtitleSlug').and.equal(subtitleSlug);
  });
});