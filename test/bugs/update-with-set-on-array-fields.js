// https://github.com/YuriGor/mongoose-slug-updater/issues/7

const mongoose = require('mongoose');

const chai = require('chai');

const should = chai.should();

const expect = chai.expect;

const assert = require('assert');

// const slugGenerator = require('../../.');

// mongoose.plugin(slugGenerator);

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    index: 1,
  },
  slug: { type: String, slug: ['name'], slugPaddingSize: 0, unique: true },
  other_image_ids: {
    type: Array,
  },
});

const Product = mongoose.model('ProductSchema', ProductSchema);

describe('Array update bug', () => {
  before(async () => {
    await Product.remove({});
  });

  after(async () => {
    await Product.remove({});
  });

  it('Create/Update a product and check Slug and UniqueSlug', async () => {
    let doc = await Product.create({ name: 'test', other_image_ids: [{ name: 'imagename' }] });

    doc.should.have.property('name').and.equal('test');
    doc.should.have.property('slug').and.equal('test');
    doc.should.have.property('other_image_ids').and.deep.equal([{ name: 'imagename' }]);
    // console.log('before findOneAndUpdate');
    doc = await Product.findOneAndUpdate(
      { _id: doc.id },

      { $set: { name: 'test1', other_image_ids: [{ name: 'imagename1' }] } },
      { new: true },
    );

    doc.should.have.property('name').and.equal('test1');
    doc.should.have.property('slug').and.equal('test1');
    doc.should.have.property('other_image_ids').and.deep.equal([{ name: 'imagename1' }]);
    doc = await Product.findOneAndUpdate(
      { _id: doc.id },
      { $set: { name: 'test2', 'other_image_ids.0.name': 'imagename2' } },
      { new: true },
    );
    doc.should.have.property('name').and.equal('test2');
    doc.should.have.property('slug').and.equal('test2');
    doc.should.have.property('other_image_ids').and.deep.equal([{ name: 'imagename2' }]);

    doc = await Product.findOneAndUpdate(
      { _id: doc.id },
      { name: 'test3', other_image_ids: [{ name: 'imagename3' }] },
      { new: true },
    );

    doc.should.have.property('name').and.equal('test3');
    doc.should.have.property('slug').and.equal('test3');
    doc.should.have.property('other_image_ids').and.deep.equal([{ name: 'imagename3' }]);
  });
});
