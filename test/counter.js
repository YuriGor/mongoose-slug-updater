'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const { nIterations, slugPaddingSize, Counter } = require('./model');

const tellme = require('./tellme');
/* Tests */
var resource = {};

describe('Counter plugin usage', function() {
  before(async () => {
    await Counter.remove({});
  });

  after(async () => {
    await Counter.remove({});
  });

  it('Create a new resource and check Slug and UniqueSlug', async () => {
    let doc = await Counter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    resource = doc;

    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
  });

  // it('Create several new resources concurrently', async () => {
  //   return Promise.all([
  //     Counter.create({
  //       title: tellme.getText(0),
  //       subtitle: tellme.getText(1),
  //     }),
  //     Counter.create({
  //       title: tellme.getText(0),
  //       subtitle: tellme.getText(1),
  //     }),
  //     Counter.create({
  //       title: tellme.getText(0),
  //       subtitle: tellme.getText(1),
  //     }),
  //     Counter.create({
  //       title: tellme.getText(0),
  //       subtitle: tellme.getText(1),
  //     }),
  //   ]).then((docs)=>{
  //     for (let i = 1; i <= 4; i++) {
  //       let doc = docs[i];
  //       doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
  //       doc.should.have
  //         .property('uniqueSlug')
  //         .and.equal(tellme.getCounterSlug(0, i));
  //     }
  //   });
  // });

  it(
    'Create ' + nIterations + ' resources and check Slug and UniqueSlug',
    async () => {
      for (let i = 1; i <= nIterations; i++) {
        let doc = await Counter.create({
          title: tellme.getText(0),
          subtitle: tellme.getText(1),
        });
        doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
        doc.should.have
          .property('uniqueSlug')
          .and.equal(tellme.getCounterSlug(0, i));
      }
    }
  );

  it('Create a different resource and check Slug and UniqueSlug', async () => {
    let doc = await Counter.create({
      title: tellme.getText(2),
      subtitle: tellme.getText(3),
    });
    doc.should.have.property('slug').and.equal(tellme.getSlug(2, 3));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));
  });

  it('Upsert a "watcher" element in an resource', async () => {
    resource.title = tellme.getText(4);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getText(4));
    doc.should.have.property('subtitle', tellme.getText(1));
    doc.should.have.property('slug', tellme.getSlug(4, 1));
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });

  it('Upsert a "not watcher" element in an resource', async () => {
    resource.description = tellme.getText(5);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getText(4));
    doc.should.have.property('subtitle', tellme.getText(1));
    doc.should.have.property('slug', tellme.getSlug(4, 1));
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });

  it('Upsert a "watcher" element in an resource trying to not update slug', async () => {
    resource.title = tellme.getSlug(4);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getSlug(4));
    doc.should.have.property('subtitle', tellme.getText(1));
    doc.should.have.property('slug', tellme.getSlug(4, 1));
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });
});

describe('Counter plugin usage to check titles including other titles', function() {
  before(async () => {
    await Counter.remove({});
  });
  before(async () => {
    await Counter.remove({});
  });
  it('Create a resource and check Slug and UniqueSlug', async () => {
    let doc = await Counter.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });
    doc.should.have.property('slug').and.equal(tellme.getSlug(0, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(0));
  });
  it('Create a second resource which has a title part of first resources title', async () => {
    let doc = await Counter.create({
      title: tellme.getText(2),
      subtitle: tellme.getText(1),
    });
    doc.should.have.property('slug').and.equal(tellme.getSlug(2, 1));
    doc.should.have.property('uniqueSlug').and.equal(tellme.getSlug(2));
  });
});
