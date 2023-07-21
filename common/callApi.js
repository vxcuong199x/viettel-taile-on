"use strict";
const moment = require('moment');
const Promise = require('bluebird');
const axios = require('axios');
const _ = require('lodash');

const md5 = require('md5');
const TELCO_CONFIG = require('../config/telcoConfig');
const { SERVER_APP, PAYGATE_SERVICE, USER_SERVICE } = TELCO_CONFIG
const STATUS_USER_SERVICE = {
  SUCCESS: 0,
  USER_NOT_FOUND: 4002,
  USER_EXISTED: 4007
}


const helper = require('../common/helper');
const paymentApi = require('../common/paymentApi');
const { redis } = require('./connector')

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
};
const timeout = 15000;

const callApi = {};
callApi.buyContent = (params, again = 0) => {
  const { BUY_FILM } = TELCO_CONFIG.VIETTEL;

  const dataApi = {
    msisdn: params.msisdn,//
    cmdCode: params.mo,//syntax

    //config
    serviceID: TELCO_CONFIG.VIETTEL.SERVICE_CODE,
    telcoId: BUY_FILM.TELCO_MAP.VIETTEL,
    username: BUY_FILM.USER,
  };
  dataApi.chargeTime = moment().format('YYYY-MM-DD HH:mm:ss');
  dataApi.cmdCode = dataApi.cmdCode.trim();
  dataApi.signature = md5(
    dataApi.msisdn
    + BUY_FILM.PREFIX + dataApi.cmdCode
    + BUY_FILM.PREFIX + dataApi.serviceID
    + BUY_FILM.PREFIX + BUY_FILM.PASS
  );

  dataApi.transactionId = md5(
    (params.msisdn || 0)
    + dataApi.cmdCode
    + (again === 0
        ? moment().format('YYYYMMDDHHmmss')
        : moment().format('YYYYMMDDHH')
    )
  );

  const url = BUY_FILM.HOST;
  helper.console('buyContent', 'dataApi', url, dataApi);

  return axios.post(
    url,
    dataApi,
    headers,
    timeout
  ).then(res => {
    helper.console('SUCCESS', 'buyContent', dataApi, res.data);

    return Promise.resolve({
      url,
      dataApi,
      resApi: res.data
    });
  })
    .catch(err => {
      helper.error('buyContent', 'buyContent', err);
      const resMessage = `buyContent: ${(err.stack || err).substr(0, 100)}`;
      const condRetry = (resMessage.indexOf('timeout') > -1);

      if (condRetry && again < 3) {
        again++;
        return callApi.buyContent(params, again);
      }
      else
        return Promise.reject({
          url,
          dataApi,
          resApi: resMessage
        });
    });
};

callApi.createUser = (params, again = 0) => {
  const dataApi = {
    username: params.account,
    password: params.password.toString()
  }

  const url = USER_SERVICE.BASE_URL + USER_SERVICE.API.CREATE_USER
  const opts = {
    url,
    method: 'POST',
    data: dataApi,
    headers,
    timeout
  }

  helper.console('createUser', 'opts', JSON.stringify(opts));
  return axios(opts)
    .then(({ data }) => {
      helper.console('SUCCESS', 'createUser', JSON.stringify(opts), JSON.stringify(data));

      const rsLast = formatDataCreateUser(data)
      helper.console('SUCCESS', 'createUser_rsLast', JSON.stringify(opts), JSON.stringify(rsLast));

      return Promise.resolve({
        url,
        dataApi,
        resApi: rsLast
      });
    })
    .catch(err_ => {
      const isTimeout = checkTimoutRequest(err_)
      const err = _.get(err_, 'response.data') || err_.stack || err_

      helper.error('createUser', 'createUser_error', JSON.stringify(opts), JSON.stringify(err));
      helper.console('createUser', 'createUser_error', JSON.stringify(opts), JSON.stringify(err));
      const resMessage = `createUser: ${JSON.stringify(err).substr(0, 100)}`;

      //retry
      if (isTimeout && again < 3) {
        again++;
        return callApi.createUser(params, again);
      } else if (_.has(err, 'status')) {
        const rsLast = formatDataCreateUser(err)
        helper.console('SUCCESS', 'createUser_rsLast_error', JSON.stringify(opts), JSON.stringify(rsLast));

        return Promise.resolve({
          url: opts.url,
          dataApi: opts.data || opts.params,
          resApi: rsLast
        });
      }
      else
        return Promise.reject({
          url,
          dataApi,
          resApi: resMessage
        });
    });
};

callApi.checkUser = (params, again = 0) => {
  let opts;

  opts = {
    url: USER_SERVICE.BASE_URL + USER_SERVICE.API.CHECK_USER,
    method: 'GET',
    params: {
      phone: params.account
    }
  }

  helper.console('checkUser', 'opts', JSON.stringify(opts));
  return axios(opts)
    .then(({ data }) => {
      helper.console('SUCCESS', 'checkUser', JSON.stringify(opts), JSON.stringify(data));

      const rsLast = formatDataGetUser(data)
      helper.console('SUCCESS', 'checkUser_rsLast', JSON.stringify(opts), JSON.stringify(rsLast));

      return Promise.resolve({
        url: opts.url,
        dataApi: opts.data || opts.params,
        resApi: rsLast
      });
    })
    .catch(err_ => {
      const isTimeout = checkTimoutRequest(err_)
      const err = _.get(err_, 'response.data') || err_.stack || err_

      helper.error('checkUser', 'checkUser_error', JSON.stringify(opts), JSON.stringify(err));
      helper.console('checkUser', 'checkUser_error', JSON.stringify(opts), JSON.stringify(err));
      const resMessage = `checkUser: ${JSON.stringify(err).substr(0, 100)}`;

      //retry
      if (isTimeout && again < 3) {
        again++;
        return callApi.checkUser(params, again);
      } else if (_.has(err, 'status')) {
        const rsLast = formatDataGetUser(err)
        helper.console('SUCCESS', 'checkUser_rsLast_error', JSON.stringify(opts), JSON.stringify(rsLast));

        return Promise.resolve({
          url: opts.url,
          dataApi: opts.data || opts.params,
          resApi: rsLast
        });
      }
      else
        return Promise.reject({
          url: opts.url,
          dataApi: opts.data || opts.params,
          resApi: resMessage
        });
    });
};

const fnTransIdSms = {
  prefix: 'viettel_taile_',
  set: ({ params, transId }) => {
    const key = `${fnTransIdSms.prefix}___${params.msisdn}___${params.mo}`
    console.log('key', key)

    return redis.rpush(key, transId)
  },
  get: ({ params }) => {
    const key = `${fnTransIdSms.prefix}___${params.msisdn}___${params.mo}`
    console.log('key', key)

    return redis.rpop(key)
  }
}

callApi.checkCondition_ = (params) => {
  const dataApi = {
    username: params.account,
    telcoSyntax: params.mo,
    amount: Number(params.amount || 0),
    uid: params.uid
  }
  dataApi.transId = md5(params.msisdn + dataApi.telcoSyntax +
      moment().unix().toString()
    ).substr(0, 16) + Math.floor(Math.random() * 1000)

  let rsLast = {}
  return paymentApi.checkCondition({
    params: dataApi
  }).then(rs => {
    rsLast = rs;
    return fnTransIdSms.set({ params, transId: dataApi.transId })
  }).then(rs => {
    return rsLast
  })
}
callApi.addPackage_ = (params, ignoreRes = false, again = 0) => {
  const KEYLOG = `-------${params.msisdn || ''}: method: addPackage; again=${again}; ignoreRes = false:    `

  return Promise.delay(0)
    .then(rs => {
      return fnTransIdSms.get({ params })
    }).then(transIdPharse1 => {

      const dataApi = {
        username: params.account,
        transId: params.transId || transIdPharse1,
        partnerTransId: params.partnerTransId || md5(params.msisdn + params.mo + moment().unix().toString()),
        amount: Number(params.amount || 0)
      }

      return paymentApi.addPackage({
        params: dataApi
      })
    })
}
callApi.addPackage = (params, ignoreRes = false, again = 0) => {
  const KEYLOG = `-------${params.account || ''}___${params.msisdn || ''}: /api/addPackage; method = addPackage; indexAgain=${again}; ignoreRes=${ignoreRes}: `;
  console.log('params addPackage', params)

  params.transactionId = params.transactionId || helper.generateTransactionId();
  let opts;
  if (!params.hasBuyFilm && PAYGATE_SERVICE.PHONES_TEST.includes(params.account)) {
    opts = {
      url: PAYGATE_SERVICE.BASE_URL + PAYGATE_SERVICE.API.addPackage,
      method: 'POST',
      headers,
      timeout,
      data: {
        "msisdn": params.msisdn,
        "mo": (params.mo || '').trim().toUpperCase(),
        "partnerTransId": null,
        "amount": params.amount,
        "partner": PAYGATE_SERVICE.PARTNER_ID
      }
    }
  } else {
    const dataApi = {
      username: params.account,
      telcoSyntax: params.packageCode,
      telcoId: TELCO_CONFIG.VIETTEL.TELCOID,
      amount: Number(params.amount || 0),
      transactionId: params.transactionId,
    };

    dataApi.telcoOrderId = md5(
      (params.msisdn || 0)
      + dataApi.username
      + dataApi.telcoSyntax
      + dataApi.amount.toString()
      + (again === 0
          ? moment().format('YYYYMMDDHHmmss')
          : moment().format('YYYYMMDDHH')
      )
    );

    dataApi.signature = md5(
      dataApi.username
      + '|' + dataApi.telcoSyntax
      + '|' + dataApi.telcoId
      + '|' + TELCO_CONFIG.SERVER_APP.SECRET
    );

    opts = {
      url: SERVER_APP.BASE_URL + SERVER_APP.API.addPackage,
      method: 'POST',
      headers,
      timeout,
      data: dataApi
    }
  }
  opts.data.addPackageInfo = JSON.parse(JSON.stringify(opts))

  console.log('DATA_API_TO_APP', KEYLOG, JSON.stringify(opts));
  return axios(opts)
    .then(({ data }) => {
      console.log('RESPONSE_FROM_SERVER_APP', KEYLOG, JSON.stringify(opts), JSON.stringify(data));

      return Promise.resolve({
        url: opts.url,
        dataApi: opts.data,
        resApi: data
      });
    })
    .catch(err => {
      console.log('ERROR_FROM_SERVER_APP', KEYLOG, JSON.stringify(opts), err.stack || err);
      console.error('ERROR_FROM_SERVER_APP', KEYLOG, JSON.stringify(opts), err.stack || err);

      const resMessage = `addPackage: ${(_.get(err, 'response.data') || err.stack || err).substr(0, 100)}`;
      const condRetry = (resMessage.indexOf('timeout') > -1);

      //retry
      if (condRetry && again < 3) {
        again++;
        return callApi.addPackage(params, again);
      }
      else {
        if (ignoreRes)
          return Promise.resolve({
            url: opts.url,
            dataApi: opts.data,
            resApi: resMessage
          });
        else
          return Promise.reject({
            url: opts.url,
            dataApi: opts.data,
            resApi: resMessage
          });
      }
    });
};


// old data:
// "data": {
//  "info": {
//    "success": "true",
//      "code": "1",
//      "msg": "Tạo tài khoản thành công. Mã tài khoản của quý khách là : 25075322",
//      "accountnumber": "25075322"
//  }
// }

// new data
// {
//  "status": 0,
//  "data": {
//  "uid": "KT6C47HWRU",
//    "username": "0946789312",
//    "password": "12345Aa@"
// },
//  "message": "Success"
// }

function formatDataCreateUser (newData) {
  let oldData = {}
  const userInfo = _.get(newData, 'data') || {}

  if (newData && +newData.status === STATUS_USER_SERVICE.SUCCESS) { // success
    oldData = {
      info: Object.assign(
        userInfo,
        {
          'success': 'true',
          'code': 1,
          'accountnumber': userInfo.uid
        }
      )
    }
  }

  return oldData
}

// old data
// {
//  "info": {
//  "uid": "8139446",
//    "status": NumberInt("0"),
//    "username": "0349609863",
//    "packages": [
//    {
//      "username": "0349609863",
//      "planId": NumberInt("1"),
//      "screenId": NumberInt("1"),
//      "maxLogin": NumberInt("5"),
//      "maxScreen": NumberInt("1"),
//      "expire": NumberInt("1644710883"),
//      "amount": NumberInt("66000"),
//      "planLimit": { },
//      "updatedAt": "2021-07-16T03:11:11.870Z",
//      "_id": "1",
//      "code": "LYS024914814",
//      "name": "Gói ON VIP",
//      "deviceType": [
//        NumberInt("1"),
//        NumberInt("2"),
//        NumberInt("3")
//      ]
//    },
//    ]
// }

// new data
// {
//  "status": 0,
//   "data": {
// "userInfo": {
//  "id": "MWC5ARRF59",
//    "displayName": "0945789305",
//    "avatar": "https://lh3.googleusercontent.com/a-/AOh14Gh3J0JECQ3UZ1bsUJwzHWKoPPtaLAZRF9M2ytn4Rw=s96-c",
//    "dtId": null,
//    "spId": null,
//    "phone": "0945789305",
//  },
//  "message": "Success"
// }

function formatDataGetUser (newData) {
  let oldData = {}
  const userInfo = _.get(newData, 'data.userInfo') || {}

  if (newData && +newData.status === STATUS_USER_SERVICE.SUCCESS) { // success
    oldData = {
      info: Object.assign(
        userInfo,
        {
          'status': 0,
          uid: userInfo.id,
          username: userInfo.phone
        }
      )
    }
  }

  return oldData
}

function checkTimoutRequest (error) {
  const statusCode = +_.get(error, 'response.status')
  const isTimeout = [408, 504].includes(statusCode)

  return isTimeout
}

//callApi.checkUser({ account: '0349111223' })
//callApi.createUser({ account: '0349111221', password: '555555' })

module.exports = callApi;
