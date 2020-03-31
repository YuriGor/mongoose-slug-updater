'use strict';
const mongoose = require('mongoose');
const { options } = require('./options');
const slugGenerator = require('../.');
options.symbols=false;
mongoose.plugin(slugGenerator, options);

const TransformResourceShortId = new mongoose.Schema({
  text: { type: String },
  slug: { type: String, slug: ['text'],  transform: v => v.replace(/(<([^>]+)>)/gi, "") }
});


const ShortId = mongoose.model('TransformResourceShortId', TransformResourceShortId);

describe('Transform Option', function() {
  before(async () => {
    await ShortId.remove({});
  });

  after(async () => {
    await ShortId.remove({});
  });

  it('remove tags using transform', async ()=>{
    let doc = await ShortId.create({
      text: "<p>text only</p>",
    });
    doc.should.have
      .property('slug')
      .and.equal(
        'text-only'
      );
  });
});