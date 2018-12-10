'use strict';

const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  expect = chai.expect,
  assert = require('assert');

const { nIterations, slugPaddingSize, Book } = require('./../model');

const tellme = require('./../tellme');
/* Tests */
var resource = {};

describe('Book create', function() {
  before(async () => {
    await Book.remove({});
  });

  after(async () => {
    await Book.remove({});
  });

  it('Create a new resource and check Slug and UniqueSlug', async () => {
    let doc = await createBook();

    doc.should.have.property('slug').and.equal('my-test-book');
    doc.should.have.nested.property('chapters[3].slug').and.equal('chapter-3');
  });
  it('Create list',async()=>{
      await createBook(1);
      await createBook(2);
      await createBook(3);
      await createBook(4);
      await createBook(5);
      await createBook(6);
      await createBook(7);
      await createBook(8);
      await createBook(9);
      await createBook(10);
      await createBook(11);
      let books = await Book.list();
      expect(books.books.length).to.equal(10);
      expect(books.books[0].slug).to.equal('my-test-book-11');
      expect(books.books[4].slug).to.equal('my-test-book-7');
      expect(books.books[9].slug).to.equal('my-test-book-2');
      books = await Book.list({ offset: 5, limit: 1 });
      // console.debug(books);
      expect(books.books[0].slug).to.equal('my-test-book-6');
      expect(books.books[0].chapters).to.equal(undefined);
      // books = await Book.list({ offset: 0, limit: 20 });
      // console.debug(books);

  });
});

async function createBook(B = '', C = 10) {
  if (B) B = ` ${B}`;

  const cfg = {
    name: `My Test Book ${B}`,
    price: 102030405060708090,
    githubRepo: `My Test ${B} repo`,
    chapters: [],
  };

  for (let c = 0; c < C; c++) {
    cfg.chapters.push({
      title: `Chapter ${c}`,
      content: `Chapter ${c} goes here`,
      htmlContent: `<h1>Chapter ${c} goes here</h1>`,
      githubFilePath: `./qqq.qqq.${c}`,
      order: c,
    });
  }

  return Book.create(cfg).catch((err) => {
    console.error(err, cfg);
  });
}