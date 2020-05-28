const _ = require('lodash');

const mongoose = require('mongoose');
const chai = require('chai');

const should = chai.should();
const assert = require('assert');

const childSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    slug: 'title',
    index: true,
    slugPaddingSize: 4,
    uniqueGroupSlug: '/_id',
  },
});

const scratchSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    slug: 'title',
    unique: true,
    slugPaddingSize: 4,
  },
  children: [childSchema],
  // children: [
  //     {
  //         title: {
  //             type: String,
  //             required: true,
  //             maxlength: 100,
  //         },
  //         slug: {
  //             type: String,
  //             slug: "title",
  //             index: true,
  //             slugPaddingSize: 4,
  //             uniqueGroupSlug: "/_id",
  //         },
  //     },
  // ],
});

const Scratch = mongoose.model('scratchSchema', scratchSchema);

describe('Grouped Nested Resources (Counter)', function () {
  before(async () => {
    await Scratch.remove({});
  });

  after(async () => {
    await Scratch.remove({});
  });

  it("Create new resource and check it's generated as normal with children unique locally", async () => {
    const doc = await Scratch.create({
      title: 'This is a long title',
      children: [
        {
          title: 'This is subtitle',
        },
        {
          title: 'This is subtitle',
        },
      ],
    });
    doc.should.have.property('title').and.equal('This is a long title');
    doc.should.have.property('slug').and.equal('this-is-a-long-title');

    doc.should.have.nested.property('children[0].title').and.equal('This is subtitle');
    doc.should.have.nested.property('children[0].slug').and.equal('this-is-subtitle');

    doc.should.have.nested.property('children[1].title').and.equal('This is subtitle');
    doc.should.have.nested.property('children[1].slug').and.equal('this-is-subtitle-0001');
  });

  it("Create new resource and check it's generated as with increment with children unique locally", async () => {
    const doc = await Scratch.create({
      title: 'This is a long title',
      children: [
        {
          title: 'This is subtitle',
        },
        {
          title: 'This is subtitle',
        },
      ],
    });
    doc.should.have.property('title').and.equal('This is a long title');
    doc.should.have.property('slug').and.equal('this-is-a-long-title-0001');

    doc.should.have.nested.property('children[0].title').and.equal('This is subtitle');
    doc.should.have.nested.property('children[0].slug').and.equal('this-is-subtitle');

    doc.should.have.nested.property('children[1].title').and.equal('This is subtitle');
    doc.should.have.nested.property('children[1].slug').and.equal('this-is-subtitle-0001');
  });
});
