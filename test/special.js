'use strict';
const mongoose = require('mongoose');
const { options, slugPaddingSize, nIterations } = require('./options');
const slugGenerator = require('../.');
options.symbols=false;
mongoose.plugin(slugGenerator, options);

const SpecialResourceShortId = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] }
});

const
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const ShortId = mongoose.model('SpecialResourceShortId', SpecialResourceShortId);

describe('No Special Chars', function() {
  before(async () => {
    await ShortId.remove({});
  });

  after(async () => {
    await ShortId.remove({});
  });

  it('special characters', async ()=>{
    let doc = await ShortId.create({
      title: "I hate this \"#^(@ special characters. Remove|replace&don't show me"
    });
    doc.should.have
      .property('slug')
      .and.equal(
        'i-hate-this-special-characters-remove-replace-don-t-show-me'
      );
  });
});