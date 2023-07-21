"use strict";
const moment = require('moment');
const Promise = require('bluebird');
const axios = require('axios');
const _ = require('lodash');

const md5 = require('md5');
const TELCO_CONFIG = require('../config/telcoConfig');
const { SERVER_APP, PAYGATE_SERVICE } = TELCO_CONFIG
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
    password: params.password.toString(),
    signature: md5(params.account + '|' + params.password + '|' + TELCO_CONFIG.SERVER_APP.SECRET),
  };
  const url = TELCO_CONFIG.SERVER_APP.BASE_URL + TELCO_CONFIG.SERVER_APP.API.createUser;

  helper.console('createUser', 'dataApi', url, dataApi);

  return axios.post(
    url,
    dataApi,
    headers,
    timeout
  ).then(res => {
    helper.console('SUCCESS', 'createUser', dataApi, res.data);

    return Promise.resolve({
      url,
      dataApi,
      resApi: res.data
    });
  })
    .catch(err => {
      helper.error('createUser', 'createUser', err);
      const resMessage = `createUser: ${(err.stack || err).substr(0, 100)}`;
      const condRetry = (resMessage.indexOf('timeout') > -1);

      //retry
      if (condRetry && again < 3) {
        again++;
        return callApi.createUser(params, again);
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

  if (!params.hasBuyFilm && PAYGATE_SERVICE.PHONES_TEST.includes(params.account)) {
    opts = {
      url: PAYGATE_SERVICE.BASE_URL + PAYGATE_SERVICE.API.checkUser,
      method: 'POST',
      data: {
        "username": params.account,
        "msisdn": params.msisdn,
        "mo": (params.mo || '').trim().toUpperCase(),
        "cpCode": null,
        "gameCode": null,
        "packageCode": (params.packageCode || '').trim().toUpperCase(),
        "amount": params.amount,
        "logTime": moment(params.eventTime).toDate(),
        "partner": PAYGATE_SERVICE.PARTNER_ID
      }
    }
  } else {
    opts = {
      url: SERVER_APP.BASE_URL + SERVER_APP.API.checkUser,
      method: 'GET',
      params: {
        username: params.account,
        signature: md5(params.account + '|' + SERVER_APP.SECRET),
      }
    }
  }

  helper.console('checkUser', 'opts', JSON.stringify(opts));

  return axios(opts)
    .then(({ data }) => {
      helper.console('SUCCESS', 'checkUser', JSON.stringify(opts), JSON.stringify(data));

      return Promise.resolve({
        url: opts.url,
        dataApi: opts.data || opts.params,
        resApi: data
      });
    })
    .catch(err => {
      helper.error('checkUser', 'checkUser', err);
      const resMessage = `checkUser: ${(err.stack || err).substr(0, 100)}`;
      const condRetry = (resMessage.indexOf('timeout') > -1);

      //retry
      if (condRetry && again < 3) {
        again++;
        return callApi.checkUser(params, again);
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

module.exports = callApi;
