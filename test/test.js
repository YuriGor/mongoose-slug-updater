"use stric";

var mongoose = require('mongoose'),
    slugGenerator = require('../.'),
    chai = require("chai"),
    should = chai.should(),
    Resource;


/* Setup */
mongoose.connect('mongodb://localhost/mongoose-slug-generator');

Resource = new mongoose.Schema({
    title: {type: String},
    subtitle: {type: String},
    otherField: {type: String},
    slug: {type: String, slug: ["title", "subtitle"]},
    uniqueSlug: {type: String, unique: true, slug: "title"}
});


mongoose.plugin(slugGenerator);
//mongoose.plugin(slugGenerator, {separator: "_"});
mongoose.model('Resource', Resource);


/*
 https://www.youtube.com/watch?v=--UPSacwPDA
 Am I wrong, fallin' in love with you,
 tell me am I wrong, well, fallin' in love with you
 While your other man was out there,
 cheatin' and lyin', steppin' all over you

 Uh, sweet thing
 Tell me am I wrong, holdin' on to you so tight,
 Tell me, tell me, am I wrong, holdin' on to you so tight
 If your other man come to claim you,
 he'd better be ready, ready for a long long fight

 */

/* Tests */
var resource = {};

describe('Default plugin usage', function () {
    before(function (done) {
        mongoose.model('Resource').remove({}, function () {
            done();
        });
    });

    after(function (done) {
        mongoose.model('Resource').remove({}, function () {
            done();
        });
    });

    it('Create a new resource and check Slug and UniqueSlug', function (done) {
        mongoose.model('Resource').create({
            title: 'Am I wrong, fallin\' in love with you!',
            subtitle: "tell me am I wrong, well, fallin' in love with you"
        }, function (err, doc) {
            should.not.exist(err);
            should.exist(doc);
            doc.should.have.property('slug').and.equal('am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you');
            doc.should.have.property('uniqueSlug').and.equal('am-i-wrong-fallin-in-love-with-you');
            done();
        });
    });

    it('Create a second resource and check Slug and UniqueSlug', function (done) {
        mongoose.model('Resource').create({
            title: 'Am I wrong, fallin\' in love with you!',
            subtitle: "tell me am I wrong, well, fallin' in love with you"
        }, function (err, doc) {
            should.not.exist(err);
            should.exist(doc);
            doc.should.have.property('slug').and.equal('am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you');
            doc.should.have.property('uniqueSlug').and.equal('am-i-wrong-fallin-in-love-with-you-1');
            done();
        });
    });

    it('Create a third resource and check Slug and UniqueSlug', function (done) {
        mongoose.model('Resource').create({
            title: 'Am I wrong, fallin\' in love with you!',
            subtitle: "tell me am I wrong, well, fallin' in love with you"
        }, function (err, doc) {
            should.not.exist(err);
            should.exist(doc);
            doc.should.have.property('slug').and.equal('am-i-wrong-fallin-in-love-with-you-tell-me-am-i-wrong-well-fallin-in-love-with-you');
            doc.should.have.property('uniqueSlug').and.equal('am-i-wrong-fallin-in-love-with-you-2');
            done();
            resource = doc;
        });
    });

    it('Create a different resource and check Slug and UniqueSlug', function (done) {
        mongoose.model('Resource').create({
            title: 'While your other man was out there,',
            subtitle: "cheatin' and lyin', steppin' all over you"
        }, function (err, doc) {
            should.not.exist(err);
            should.exist(doc);
            doc.should.have.property('slug').and.equal('while-your-other-man-was-out-there-cheatin-and-lyin-steppin-all-over-you');
            doc.should.have.property('uniqueSlug').and.equal('while-your-other-man-was-out-there');
            done();
        });
    });


    it('Upsert a "watcher" element in an resource', function (done) {
        resource.title = "Uh, sweet thing";
        resource.save(function (err, doc) {
            should.not.exist(err);
            should.exist(doc);
            doc.should.have.property("title", 'Uh, sweet thing');
            doc.should.have.property("subtitle", 'tell me am I wrong, well, fallin\' in love with you');
            doc.should.have.property('slug', 'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you');
            doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
            done();
        })
    });


    it('Upsert a "not watcher" element in an resource', function (done) {
        resource.description = "Tell me am I wrong, holdin' on to you so tight,";
        resource.save(function (err, doc) {
            should.not.exist(err);
            should.exist(doc);
            doc.should.have.property("title", 'Uh, sweet thing');
            doc.should.have.property("subtitle", 'tell me am I wrong, well, fallin\' in love with you');
            doc.should.have.property('slug', 'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you');
            doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
            done();
        })
    });


    it('Upsert a "watcher" element in an resource trying to not update slug', function (done) {
        resource.title = "uh-sweet-thing";
        resource.save(function (err, doc) {
            should.not.exist(err);
            should.exist(doc);
            doc.should.have.property("title", 'uh-sweet-thing');
            doc.should.have.property("subtitle", 'tell me am I wrong, well, fallin\' in love with you');
            doc.should.have.property('slug', 'uh-sweet-thing-tell-me-am-i-wrong-well-fallin-in-love-with-you');
            doc.should.have.property('uniqueSlug', 'uh-sweet-thing');
            done();
        })
    });




});

