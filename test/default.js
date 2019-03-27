const
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');

const {
  nIterations,
  ShortId
} = require("./model");

const tellme = require("./tellme");

describe('Default plugin usage', function() {
  var resource = {};
  var uniqueSlugs = [];

  before(async () => {
    await ShortId.remove({});
  });

  after(async () => {
    await ShortId.remove({});
  });

  it('Create a new resource and check Slug and UniqueSlug', async () => {
    resource = await ShortId.create({
      title: tellme.getText(0),
      subtitle: tellme.getText(1),
    });

    should.exist(resource);
    resource.should.have
      .property('slug')
      .and.equal(tellme.getSlug(0,1));

    resource.should.have
      .property('forcedSlug')
      .match(tellme.getShortRegex(1))
      .and.not.equal(tellme.getSlug(1));

    assert.equal(-1, uniqueSlugs.indexOf(resource.uniqueSlug));

    uniqueSlugs.push(resource.uniqueSlug);
  });

  it(
    'Create ' + nIterations + ' resources and check Slug and UniqueSlug',
    async () => {
      for (let i = 0; i < nIterations; i++) {
        let doc = await ShortId.create({
          title: tellme.getText(0),
          subtitle: tellme.getText(1),
        });
        doc.should.have
          .property('slug')
          .and.equal(
            tellme.getSlug(0,1)
          );
        assert.equal(-1, uniqueSlugs.indexOf(doc.uniqueSlug));

        uniqueSlugs.push(doc.uniqueSlug);
      }
    }
  );

  it('Create a different resource and check Slug and UniqueSlug', async () => {
    let doc = await ShortId.create({
      title: tellme.getText(2),
      subtitle: tellme.getText(3),
    });
    doc.should.have
      .property('slug')
      .and.equal(
        tellme.getSlug(2,3)
      );
    doc.should.have
      .property('uniqueSlug')
      .and.equal(tellme.getSlug(2));
  });

  it('Upsert a "watcher" element in an resource', async () => {
    resource.title = tellme.getText(4);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getText(4));
    doc.should.have.property(
      'subtitle',
      tellme.getText(1)
    );
    doc.should.have.property(
      'slug',
      tellme.getSlug(4,1)
    );
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });

  it('Upsert a "not watcher" element in an resource', async () => {
    resource.description = tellme.getText(5);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getText(4));
    doc.should.have.property(
      'subtitle',
      tellme.getText(1)
    );
    doc.should.have.property(
      'slug',
      tellme.getSlug(4,1)
    );
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });

  it('Upsert a "watcher" element in an resource trying to not update slug', async () => {
    resource.title = tellme.getSlug(4);
    let doc = await resource.save();
    doc.should.have.property('title', tellme.getSlug(4));
    doc.should.have.property(
      'subtitle',
      tellme.getText(1)
    );
    doc.should.have.property(
      'slug',
      tellme.getSlug(4,1)
    );
    doc.should.have.property('uniqueSlug', tellme.getSlug(4));
  });

  it('special characters', async ()=>{
    let doc = await ShortId.create({
      title: "I hate this \"#^(@ special characters. Remove|replace&don't show me"
    });
    doc.should.have
      .property('slug')
      .and.equal(
        'i-hate-this-special-characters-remove-or-replace-and-don-t-show-me'
      );
  });
});