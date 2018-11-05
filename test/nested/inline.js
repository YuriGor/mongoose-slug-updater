'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const { nIterations, Inline } = require('./../models');

const tellme = require('./../tellme');
/* Tests */
var resource = {};

describe('Inline Docs', function() {
  beforeEach(async () => {
    await Inline.remove({});
  });

  afterEach(async () => {
    await Inline.remove({});
  });

  it('Save nested docs declared inline', async () => {
    let doc = await Inline.create({
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
    });

    // console.log(doc);
    doc.should.have.property('slug').and.equal(tellme.getSlug(0));
    doc.should.have.property('absoluteSlug').and.equal(tellme.getSlug(0));
    doc.should.have.property('childSlug').and.equal(tellme.getSlug(1));
    doc.should.have.property('absoluteChildSlug').and.equal(tellme.getSlug(1));
    doc.should.have.property('subChildSlug').and.equal(tellme.getSlug(7));
    doc.should.have.property('childrenSlug0').and.equal(tellme.getSlug(0));
    doc.should.have.property('childrenSlug4').and.equal(tellme.getSlug(4));
    doc.should.have.property('subChildrenSlug3').and.equal(tellme.getSlug(3));
    doc.should.have.property('subChildrenSlug7').and.equal(tellme.getSlug(7));
    doc.should.have.property('subChildrenSlug5SubChild').and.equal(tellme.getSlug(3));
    doc.should.have.property('subChildrenSlug2SubChild').and.equal(tellme.getSlug(6));
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
  });

  // it('UpdateOne new nested docs', async () => {
  //   await Parent.updateOne(
  //     {},
  //     {
  //       title: tellme.getText(0),
  //       singleChild: {
  //         title: tellme.getText(1),
  //       },
  //       children: [
  //         {
  //           title: tellme.getext(2),
  //         },
  //         {
  //           title: tellme.getText(1),
  //         },
  //         {
  //           title: tellme.getText(4),
  //         },
  //         {
  //           title: tellme.getText(5),
  //         },
  //         {
  //           title: tellme.getText(6),
  //         },
  //       ],
  //     },
  //     { upsert: true }
  //   );
  //   let doc = await Parent.findOne({});
  //   // console.log(doc);
  //   //     doc.should.have.property("slug")
  //   //     .and.equal(tellme.getSlug(0));
  //   //
  //   //     doc.should.have.property("singleChild")
  //   //     .and.should.have.property('slug')
  //   //     .and.equal(tellme.getSlug(1));
  // });
});
