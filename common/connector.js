const MongoClient = require('mongodb').MongoClient;
const { MONGO:{ URL, DB }, REDIS } = require('../config/connection');

function connect (url, dbName) {
  console.log('mongoUrl: ', url);
  return new Promise((resolve, reject) => {
    MongoClient.connect(
      url,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      (err, client) => {
        if (err) {
          reject(err)
        }
        resolve(client.db(dbName))
      }
    )
  })
}


const Redis = require('ioredis')
module.exports.redis = new Redis(REDIS)
module.exports.mongo = connect(URL, DB)

