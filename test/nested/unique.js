'use strict';
const _ = require('lodash');
const mongoose = require('mongoose'),
  chai = require('chai'),
  should = chai.should(),
  assert = require('assert');
const { nIterations } = require('./../options');
const {
  InlineUnique,
  UniqueChild,
  UniqueParent,
  UniqueNested,
} = require('./../model');

const tellme = require('./../tellme');

describe('Inline Unique Docs', function() {
  beforeEach(async () => {
    await InlineUnique.remove({});
  });

  afterEach(async () => {
    await InlineUnique.remove({});
  });

  it('Create/change/save Inline Unique Docs', async () => {
    // console.log('nIterations', nIterations);
    let docs = [];
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await InlineUnique.create(InlineUnique.getNewDoc(i));
      // console.log(`create ${i}`,docs[i]);
      InlineUnique.testNewDoc(docs[i], i);
    }
    // let all = await InlineUnique.find();
    // console.log(all);
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.changeDoc(docs[i]);
      // console.log(`change ${i}`);
      docs[i] = await docs[i].save();
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.changeDoc(docs[i]);
      docs[i] = await docs[i].save();
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });
  it('Upsert/updateOne Inline Unique Docs', async () => {
    // console.log('nIterations', nIterations);
    for (let i = 0; i < nIterations; i++) {
      await InlineUnique.updateOne({ n: i }, InlineUnique.getNewDoc(i), {
        upsert: true,
      });
    }
    let docs = await InlineUnique.find();
    // console.log(0);
    // console.log(docs[0 ]);
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.testNewDoc(docs[i], i);
    }
    // console.log(docs[0].children[4]);
    for (let i = 0; i < nIterations; i++) {
      let mdf = InlineUnique.changeDoc({});
      // if(!i){
      //   console.log(mdf);
      // }
      await InlineUnique.updateOne({ n: i }, mdf);
    }
    docs = await InlineUnique.find();
    // console.log(docs);
    for (let i = 0; i < nIterations; i++) {
      // console.log(i);
      // console.log(docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });

  it('Upsert/updateMany Inline Unique Docs', async () => {
    // console.log('nIterations', nIterations);
    for (let i = 0; i < nIterations; i++) {
      await InlineUnique.updateMany({ n: i }, InlineUnique.getNewDoc(i), {
        upsert: true,
      });
    }
    let docs = await InlineUnique.find();
    // console.log(0);
    // console.log(docs[0 ]);
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.testNewDoc(docs[i], i);
    }
    // console.log(docs[0].children[4]);
    let mdf = InlineUnique.changeDocPaths({});
    // console.log(mdf);
    await InlineUnique.updateMany({}, mdf);
    docs = await InlineUnique.find();
    // console.log(docs);
    for (let i = 0; i < nIterations; i++) {
      // console.log(i);
      // console.log(docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });
  it('Upsert/findOneAndUpdate Inline Unique Docs', async () => {
    let docs = [];
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await InlineUnique.findOneAndUpdate(
        { n: i },
        InlineUnique.getNewDoc(i),
        { upsert: true, new: true }
      );
      InlineUnique.testNewDoc(docs[i], i);
    }

    let mdf = InlineUnique.changeDoc({});
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await InlineUnique.findOneAndUpdate({ n: i }, mdf, {
        new: true,
      });
      // console.log(i,docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await InlineUnique.findOneAndUpdate({ n: i }, mdf, {
        new: true,
      });
      // console.log(i,docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });
});

describe('Nested Unique Docs', function() {
  beforeEach(async () => {
    await UniqueParent.remove({});
  });

  afterEach(async () => {
    await UniqueParent.remove({});
  });

  it('Create/change/save Inline Unique Docs', async () => {
    // console.log('nIterations', nIterations);
    let docs = [];
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await UniqueParent.create(InlineUnique.getNewDoc(i));
      // console.log(i);
      // console.log(docs[i]);
      InlineUnique.testNewDoc(docs[i], i);
    }
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.changeDoc(docs[i]);
      docs[i] = await docs[i].save();
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.changeDoc(docs[i]);
      docs[i] = await docs[i].save();
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });
  it('Upsert/updateOne Inline Unique Docs', async () => {
    // console.log('nIterations', nIterations);
    for (let i = 0; i < nIterations; i++) {
      await UniqueParent.updateOne({ n: i }, InlineUnique.getNewDoc(i), {
        upsert: true,
      });
    }
    let docs = await UniqueParent.find();
    // console.log(0);
    // console.log(docs[0 ]);
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.testNewDoc(docs[i], i);
    }
    // console.log(docs[0].children[4]);
    for (let i = 0; i < nIterations; i++) {
      let mdf = InlineUnique.changeDoc({});
      // if(!i){
      //   console.log(mdf);
      // }
      await UniqueParent.updateOne({ n: i }, mdf);
    }
    docs = await UniqueParent.find();
    // console.log(docs);
    for (let i = 0; i < nIterations; i++) {
      // console.log(i);
      // console.log(docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });

  it('Upsert/updateMany Inline Unique Docs', async () => {
    // console.log('nIterations', nIterations);
    for (let i = 0; i < nIterations; i++) {
      await UniqueParent.updateMany({ n: i }, InlineUnique.getNewDoc(i), {
        upsert: true,
      });
    }
    let docs = await UniqueParent.find();
    // console.log(0);
    // console.log(docs[0 ]);
    for (let i = 0; i < nIterations; i++) {
      InlineUnique.testNewDoc(docs[i], i);
    }
    // console.log(docs[0].children[4]);
    let mdf = InlineUnique.changeDocPaths({});
    // console.log(mdf);
    await UniqueParent.updateMany({}, mdf);
    docs = await UniqueParent.find();
    // console.log(docs);
    for (let i = 0; i < nIterations; i++) {
      // console.log(i);
      // console.log(docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });
  it('Upsert/findOneAndUpdate Inline Unique Docs', async () => {
    let docs = [];
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await UniqueParent.findOneAndUpdate(
        { n: i },
        InlineUnique.getNewDoc(i),
        { upsert: true, new: true }
      );
      InlineUnique.testNewDoc(docs[i], i);
    }

    let mdf = InlineUnique.changeDoc({});
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await UniqueParent.findOneAndUpdate({ n: i }, mdf, {
        new: true,
      });
      // console.log(i,docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
    for (let i = 0; i < nIterations; i++) {
      docs[i] = await UniqueParent.findOneAndUpdate({ n: i }, mdf, {
        new: true,
      });
      // console.log(i,docs[i]);
      InlineUnique.testChangedDoc(docs[i], i, nIterations);
    }
  });
});

describe('Nested array unique', function() {
  this.timeout(5000);
  let nIterations = 2;
  beforeEach(async () => {
    await UniqueNested.remove({});
  });

  afterEach(async () => {
    await UniqueNested.remove({});
  });
  it('Create/save', async () => {
    let docs = [];
    for (let n = 0; n < nIterations; n++) {
      let doc = UniqueNested.getNewDoc(n);
      docs[n] = await UniqueNested.create(doc);
      UniqueNested.testNewDoc(docs[n], n);
    }
    let mdf = UniqueNested.changeDoc({});
    // console.log(mdf);
    for (let n = 0; n < nIterations; n++) {
      docs[n] = await UniqueNested.findOneAndUpdate({ n }, mdf, { new: true });
      // console.log(n,docs[n]);
      UniqueNested.testChangedDoc(docs[n], n, nIterations);
    }
    for (let n = 0; n < nIterations; n++) {
      docs[n] = await UniqueNested.findOneAndUpdate({ n }, mdf, { new: true });
      // console.log(n,docs[n]);
      UniqueNested.testChangedDoc(docs[n], n, nIterations);
    }
  });

  it('README example', async () => {
    let docs = [];

    let doc = {
      children: [
        {
          subchildren: [
            {
              title: tellme.getText(0),
              // slug       -> 'am-i-wrong-fallin-in-love-with-you'
              // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you'
            },
            {
              title: tellme.getText(0),
              // slug       -> 'am-i-wrong-fallin-in-love-with-you-0001'
              // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0001'
            },
          ],
        },
        {
          subchildren: [
            {
              title: tellme.getText(0),
              // slug       -> 'am-i-wrong-fallin-in-love-with-you-0002'
              // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0002'
            },
            {
              title: tellme.getText(0),
              // slug       -> 'am-i-wrong-fallin-in-love-with-you-0003'
              // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0003'
            },
          ],
        },
      ],
    };
    for (let n = 0; n < nIterations; n++) {
      let res = await UniqueNested.create(doc);
      for(let i=0;i<nIterations;i++){
        for(let j=0;j<nIterations;j++){
          // console.log(_.get(res,`children[${i}].subchildren[${j}].title`));
          // console.log(`n:${n} i${i} j${j}`);
          // console.log(_.get(res,`children[${i}].subchildren[${j}].slugCounter`));
          res.should.have.nested.property(`children[${i}].subchildren[${j}].title`)
          .and.equal(tellme.getText(0));
          res.should.have.nested.property(`children[${i}].subchildren[${j}].slugCounter`)
          .and.equal(tellme.getCounterSlug(0,n*2*nIterations+i*nIterations+j));
          // console.log(_.get(res,`children[${i}].subchildren[${j}].slugLocalCounter`));
          res.should.have.nested.property(`children[${i}].subchildren[${j}].slugLocalCounter`)
          .and.equal(tellme.getCounterSlug(0,i*nIterations+j));
        }
      }
    }
    
  });
});
