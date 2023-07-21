"use strict";
const moment = require('moment');
const md5 = require('md5');
const Promise = require('bluebird');

const CONFIG = require('../config/config');
const { MONGO:{ COL } } = require('../config/connection');
const TELCO_CONFIG = require('../config/telcoConfig');
const consts = require('../config/consts');
const model = require('../common/model');
const helper = require('../common/helper');

const writeLog = {};
module.exports = writeLog;


writeLog.saveLogMt = (paramsGeneral) => {
  const { params, reqBody, response, callApi } = paramsGeneral;

  let data = Object.assign({}, params, response);
  data = Object.assign(data, helper.getTimeCurr());

  delete data.callApi;
  data.route = 'mo_listen';

  data.moListener = {
    params: reqBody,
    response,
    callApiApp: callApi || {}
  };

  return model.insertOne({
    data,
    collection: COL.tran
  });
};
writeLog.saveTran = (paramsGeneral) => {
  const { params, reqBody, response, callApi, transId } = paramsGeneral;

  let data = Object.assign({}, params, response, { transId });
  data = Object.assign(data, helper.getTimeCurr());

  data.telcoId = TELCO_CONFIG.VIETTEL.TELCOID;
  data.route = 'add_package';
  delete data.callApi;
  delete data.return;

  const isCheckSub = (params.mode === consts.MODE.CHECK);
  if (isCheckSub) {
    data.checkSub = {
      params: reqBody,
      response,
      callApiApp: callApi
    };
    data.status = consts.STATE.INIT;//init

    return model.insertOne({
      data,
      collection: COL.tran
    });
  }
  else {
    data.notifySub = {
      params: reqBody,
      response,
      callApiApp: callApi,
      createdAt: data.createdAt,
      createdAt__: data.createdAt__,
    };

    data.status = (response.code == consts.CODE.OK)
      ? consts.STATE.FIRST_SUCESS
      : consts.STATE.FAIl;
    data.amount = Number(reqBody.amount || 0);

    return model.findOne({
      where: {
        msisdn: data.msisdn,
        mode: consts.MODE.REAL,
        status: consts.STATE.FIRST_SUCESS,
        route: 'add_package'
      },
      collection: COL.tran
    })
      .then((tranFirst) => {
        if (tranFirst && tranFirst.msisdn)
          data.status = consts.STATE.AGAIN_SUCESS;

        return model.insertOne({
          data,
          collection: COL.tran
        });
      })
  }
};
writeLog.saveUserPass = ({ username, password }) => {
  username = helper.addZeroPhone(username);

  const data = {
    _id: md5(username),
    username,
    password,
    day: Number(moment().format('YYYYMMDD')),
    hour: Number(moment().format('YYYYMMDDHH')),
    createdAt: new Date()
  };
  return model.insertOne({
    data,
    collection: COL.user
  });
};
writeLog.getPassword = (username) => {
  username = helper.addZeroPhone(username);

  return model.findOne({
    where: {
      username,
      createdAt: { $gte: new Date(moment().add(-1, 'm').format('YYYY-MM-DD HH:mm:ss')) }
    },
    collection: COL.user
  }).then((rs) => {
    return Promise.resolve(rs && rs.password || null);
  });
};

const checkRenewSuccess = (data) => {
  const condReg = [
      'reg_first_success',
      'reg_again_success',
    ].indexOf(data.nameCommand) > -1;
  const success = (data.errorCode == CONFIG.EC.SUCCESS.errorCode);
  const duplicatePackage = (data.packageCodePrev && data.packageCode == data.packageCodePrev);
  return (condReg && success && duplicatePackage);
};
