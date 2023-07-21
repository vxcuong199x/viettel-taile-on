const md5 = require('md5');
const moment = require('moment');
const { mongo, redis } = require('./connector');
const ObjectId = require('mongodb').ObjectId;


const keyRedis = 'ON_VIETTEL_REVENUE'
const setRedis = ({ day, value, month }) => {
  return new Promise((resolve, reject) => {
    const key = day
      ? `${keyRedis}_${day}`
      : `${keyRedis}_${month}`

    const expireTime = day
      ? 5 * 864000
      : 80 * 864000

    console.log('setRedis: ', JSON.stringify({ key, day, month, value }))

    redis
      .multi()
      .incrby(key, +value)
      .expire(key, expireTime)
      .exec((error, result) => {
        if (error) {
          console.error('ERROR_setRedis: ', error.stack || error)
          return reject(error)
        }

        console.log('success_setRedis: ', result)
        resolve(result)
      })
  })
}

const getRedis = ({ day, month }) => {
  return new Promise((resolve, reject) => {
    const key = day
      ? `${keyRedis}_${day}`
      : `${keyRedis}_${month}`

    console.log('getRedis: ', JSON.stringify({ day, month, key }))

    redis.get(key, (error, result) => {
      if (error) {
        console.error('ERROR_getRedis: ', error.stack || error)
        return reject(error)
      }

      console.log('success_getRedis: ', result)
      resolve(result)
    })
  })
}

const findOne = (params) => {
  const runTime = moment().format('YYYY-MM-DD HH:mm:ss');
  return new Promise((resolve, reject) => {
    return mongo.then((db) => {
      db.collection(params.collection)
        .findOne(
          params.where,
          params.fields || {},
          (err, result) => {
            if (err) {
              console.error(runTime, '-----------ERROR--findOne-----', JSON.stringify(params), err);
              return reject(err);
            } else {
              console.log(runTime, '-----------SUCCESS--findOne--succecss---', JSON.stringify(params));
              return resolve(result);
            }
          })
    })
  });
};


const insertOne = (params) => {
  const { data, collection } = params;

  return new Promise((resolve, reject) => {
    return mongo.then((db) => {
      data.createdAt__ = moment().format('YYYY-MM-DD HH:mm:ss');

      const runTime = moment().format('YYYY-MM-DD HH:mm:ss');
      db.collection(collection).insertOne(
        data,
        (err, result) => {
          if (err) {
            console.error(runTime, '---------insertOne--err---', data.id || '', err);
            return reject(err);
          } else {
            console.log(runTime, '---------insertOne-succecss---', data.id || '');
            return resolve(result);
          }
        }
      );
    })
  });
};

const updateOne = (params) => {
  const { data, collection } = params;
  return new Promise((resolve, reject) => {
    return mongo.then((db) => {
      const runTime = moment().format('YYYY-MM-DD HH:mm:ss');
      db.collection(collection).updateOne(
        { _id: data._id },
        { $set: data },
        { multi: false, upsert: true },
        (err, result) => {
          if (err) {
            console.error(runTime, '-----------updateOne--err---', data._id, err);
            return reject(err);
          } else {
            console.log(runTime, '------------updateOne--succecss---', data._id);
            return resolve(result);
          }
        }
      );
    })
  });
};

module.exports = {
  findOne,
  insertOne,
  updateOne,
  setRedis,
  getRedis
};
