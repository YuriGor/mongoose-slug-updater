'use strict';
const MongodbMemoryServer = require('mongodb-memory-server');
var mongoose = require('mongoose'),
  slugGenerator = require('../.');

var mongod;
mongoose.Promise = global.Promise;

before('new inmemory mongo', async function() {
  mongod = new MongodbMemoryServer.default({
    instance: {
      dbName: 'slug',
    },
  });
  const mongoUri = await mongod.getConnectionString();
  mongoose.connect(
    mongoUri,
    { useNewUrlParser: true },
    error => {
      if (error) console.error(error);
    }
  );
});

after('dispose inmemory mongo', async function() {
  await mongoose.disconnect();
  mongod.stop();
});
