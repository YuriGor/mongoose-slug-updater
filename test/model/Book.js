const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');
const tellme = require('./../tellme');
const { options, slugPaddingSize } = require('./../options');

// mongoose.plugin(require('mongoose-slug-updater'));
const { Schema } = mongoose;
const chapterSchema = new Schema(require('./ChapterSchema'));

const bookSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    // required: true,
    unique: true,
    slug: 'name',
  },
  githubRepo: {
    type: String,
    required: true,
  },
  githubLastCommitSha: String,

  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  price: {
    type: Number,
    required: true,
  },
  chapters: [chapterSchema],
});

class BookClass {
  static async list({ offset = 0, limit = 10 } = {}) {
    // chapters: 0 means exclude field 'chapters' from query result
    const books = await this.find({}, { chapters: 0 })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    return { books };
  }

  static async getBySlug({ slug }) {
    // we will not sort chapterson select, but on insert/update
    // const query = [
    //   { $match: { slug } },
    //   { $limit: 1 },
    //   { $unwind: '$chapters' },
    //   { $sort: { 'chapters.order': 1 } },
    //   {
    //     $group: {
    //       _id: '$_id',
    //       chapters: { $push: '$chapters' },
    //       name: { $first: '$name' },
    //       slug: { $first: '$slug' },
    //       githubRepo: { $first: '$githubRepo' },
    //       githubLastCommitSha: { $first: '$githubLastCommitSha' },
    //       createdAt: { $first: '$createdAt' },
    //       price: { $first: '$price' },
    //     },
    //   },
    // ];
    // const book = await this.aggregate(query, (err, res) => {
    //   if (err) console.error(query, err);
    // });
    const book = await this.find({ slug });
    if (!book || !book.length) {
      throw new Error('Book not found');
    }
    return book[0];
  }

  static async getChapterBySlug({ bookSlug, chapterSlug }) {
    const book = await this.aggregate(
      [
        { $match: { slug: bookSlug } },
        { $limit: 1 },
        { $unwind: '$chapters' },
        { $match: { 'chapters.slug': chapterSlug } },
        { $limit: 1 },
      ],
      (err, res) => {
        if (err) console.error('getChapterBySlug', err);
      },
    );
    // console.debug("chapter",book);
    if (!book || !book.length || !book[0].chapters) {
      throw new Error('Chapter not found');
    }

    return book[0];
  }

  // static async add({ name, price, githubRepo }) {
  //   return this.create({
  //     name,
  //     price,
  //     githubRepo,
  //   });
  // }

  static async edit({ id, name, price, githubRepo }) {
    const book = await this.findById(id, 'name');

    if (!book) {
      throw new Error('Not found');
    }

    const modifier = { price, githubRepo };
    if (name !== book.name) {
      modifier.name = name;
    }

    await this.updateOne({ _id: id }, { $set: modifier });

    const editedBook = await this.findById(id, { chapters: 0 });

    return editedBook;
  }
}

bookSchema.index({ slug: 1, 'chapters.slug': 1 }, { unique: true });
bookSchema.index({ slug: 1, 'chapters.githubFilePath': 1 }, { unique: true });

bookSchema.loadClass(BookClass);

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
