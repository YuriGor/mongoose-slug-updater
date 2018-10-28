'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const {
  nIterations,
  Child,
  Parent,
} = require("./../models");

const tellme = require('./../tellme');
/* Tests */
var resource = {};


// describe('Nested Schema', function() {
//   beforeEach(async () => {
//     await Hook.remove({});
//   });
//
//   afterEach(async () => {
//     await Hook.remove({});
//   });
//
//   // it('Save nested docs', async () => {
//   //   let doc = await Parent.create({
//   //     title: tellme.getText(0),
//   //     singleChild: {
//   //       title: tellme.getText(1),
//   //     },
//   //     children: [
//   //       {
//   //         title: tellme.getext(2),
//   //       },
//   //       {
//   //         title: tellme.getText(1),
//   //       },
//   //       {
//   //         title: tellme.getText(4),
//   //       },
//   //       {
//   //         title: tellme.getText(5),
//   //       },
//   //       {
//   //         title: tellme.getText(6),
//   //       },
//   //     ],
//   //   });
//   //   // console.log(doc);
//   // });
//
//   it('UpdateOne new nested docs', async () => {
//     await Parent.updateOne(
//       {},
//       {
//         title: tellme.getText(0),
//         singleChild: {
//           title: tellme.getText(1),
//         },
//         children: [
//           {
//             title: tellme.getext(2),
//           },
//           {
//             title: tellme.getText(1),
//           },
//           {
//             title: tellme.getText(4),
//           },
//           {
//             title: tellme.getText(5),
//           },
//           {
//             title: tellme.getText(6),
//           },
//         ],
//       },
//       { upsert: true }
//     );
//     let doc = await Parent.findOne({});
//     // console.log(doc);
//     //     doc.should.have.property("slug")
//     //     .and.equal(tellme.getSlug(0));
//     //
//     //     doc.should.have.property("singleChild")
//     //     .and.should.have.property('slug')
//     //     .and.equal(tellme.getSlug(1));
//   });
// });


