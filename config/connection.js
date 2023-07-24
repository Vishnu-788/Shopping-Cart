const { MongoClient } = require('mongodb');

const state = {
  db: null,
};

module.exports.connect = function (done) {
  const url = 'mongodb://127.0.0.1:27017';
  const dbname = 'shopping';

  const client = new MongoClient(url, { useUnifiedTopology: true });

  client.connect((err) => {
    if (err) {
      return done(err);
    }

    state.db = client.db(dbname);
    console.log('Connected to the MongoDB server.');
    done();
  });
};

module.exports.get = function () {
  return state.db;
};


