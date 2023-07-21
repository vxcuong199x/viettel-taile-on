/**
 * Created by vxcuong on 25/12/19.
 */

"use strict";

const config = require('../../config/config');

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const soapServices = require('../libServices/soapServices');
const consts = require('../../config/consts');
const helper = require('../../common/helper');
const callApi = require('../../common/callApi');
const model = require('../../common/model');

const TELCO_CONFIG = require('../../config/telcoConfig');
const writeLog = require('../../writeLog/writeLog');

const utils = require('../utils/utils');
const util = require('util');
const lodash = require('lodash');
const KhongDau = require('khong-dau');
const REVENUE_LIMIT = {
  DAY: 30 * 1000 * 1000,
  MONTH: 200 * 1000 * 1000
}

const GetContent = function () {
  let self = this;

  this.test = function (args, cb) {
    helper.consoleInit('contentRequest', 'args', args);
    let rsReturn = {};

    //check valid request
    const { valid, params, message } = self.validRequest(args);
    if (valid !== consts.CODE.OK) {
      rsReturn = {
        return: valid,
        message
      };
      self.response({ args, params, rsReturn });
      return;
    }
    const { hasBuyFilm } = self.checkValidSynTax(params);
    console.log('hasBuyFilm: ', { hasBuyFilm })

    //main logic
    const isModeCheck = (params.mode === consts.MODE.CHECK)
    const runPromise = isModeCheck
      ? self.modeCheck(params)
      : self.modeReal(params);

    const getRevenue = isModeCheck
      ? Promise.props({
      revenueDay: model.getRedis({ day: moment().format('YYYYMMDD') }),
      revenueMonth: model.getRedis({ month: moment().format('YYYYMM') }),
    })
      : Promise.resolve({})

    getRevenue
      .then(({ revenueDay, revenueMonth }) => {
        console.log({ revenueDay, revenueMonth })

        const overLimitRevenue = revenueDay > REVENUE_LIMIT.DAY || revenueMonth > REVENUE_LIMIT.MONTH
        if (isModeCheck && hasBuyFilm && overLimitRevenue) {

          const valRevenue = revenueDay > REVENUE_LIMIT.DAY
            ? `DAY = ${REVENUE_LIMIT.DAY}`
            : `MONTH = ${REVENUE_LIMIT.MONTH}`

          rsReturn = {
            return: consts.CODE.INVALID_SYNTAX,
            message: 'REVENUE_LIMIT: ' + valRevenue
          };
          self.response({ args, params, rsReturn }, cb);
          return;
        }
        return runPromise
      })
      .then((rs) => {
        console.log('rs: ', rs)

        if (rs) {
          rsReturn = rs;
          rsReturn.message = rsReturn.message || 'success';

          if (rsReturn.return === consts.CODE.OK && hasBuyFilm) {
            const setRevenue = isModeCheck
              ? Promise.resolve(({}))
              : Promise.props({
              setRevenueDay: model.setRedis({
                day: moment().format('YYYYMMDD'),
                value: +params.amount
              }),

              setRevenueMonth: model.setRedis({
                month: moment().format('YYYYMMDD'),
                value: +params.amount
              }),
            })
            return setRevenue
          }

          return rs
        }
        return
      })
      .then((rs) => {
        self.response({ args, params, rsReturn }, cb);
      })
      .catch((err) => {
        rsReturn = {
          return: consts.CODE.FAIL,
          message: (err.stack || err) || 'fail'
        };
        helper.console('rsReturn', 'catch', rsReturn);

        //helper.sendEmail({
        //  err: (err.stack || err),
        //  params: args,
        //  subject: `ERROR VIETTEL_TAI_LE: ${args.msisdn || ''}`
        //});
        self.response({ args, params, rsReturn }, cb);
      });
  }
  this.map = {
    'HD': 'guide',
    'KT': 'getInfo',
    'MK': 'resetPassword'
  };
  this.startServer = function (server, env) {
    const myService = {
      ContentService: {
        ContentPort: {
          contentRequest: (args, cb) => {
            helper.consoleInit('contentRequest', 'args', args);
            let rsReturn = {};

            //check valid request
            const { valid, params, message } = self.validRequest(args);
            if (valid !== consts.CODE.OK) {
              rsReturn = {
                return: valid,
                message
              };
              self.response({ args, params, rsReturn }, cb);
              return;
            }

            const { hasBuyFilm } = self.checkValidSynTax(params);
            const isModeCheck = (params.mode === consts.MODE.CHECK)
            console.log('hasBuyFilm: ', { hasBuyFilm })

            //disable cú pháp đối tác: cú pháp M xxxx
            //if (hasBuyFilm && isModeCheck) {
            //  rsReturn = {
            //    return: consts.CODE.INVALID_SYNTAX,
            //    message: 'WRONG_SYNTAX'
            //  };
            //
            //  self.response({ args, params, rsReturn }, cb);
            //  return;
            //}

            //main logic
            const runPromise = isModeCheck
              ? self.modeCheck(params)
              : self.modeReal(params);

            const getRevenue = isModeCheck
              ? model.getRedis({ day: moment().format('YYYYMMDD') })
              : Promise.resolve(0)


            getRevenue
              .then((revenue) => {
                console.log('revenue: ', revenue)

                if (isModeCheck && hasBuyFilm && revenue > REVENUE_LIMIT.DAY) {
                  rsReturn = {
                    return: consts.CODE.INVALID_SYNTAX,
                    message: 'REVENUE_LIMIT: ' + revenue
                  };
                  self.response({ args, params, rsReturn }, cb);
                  return;
                }
                return runPromise
              })
              .then((rs) => {
                console.log('rs: ', rs)

                if (rs) {
                  rsReturn = rs;
                  rsReturn.message = rsReturn.message || 'success';

                  if (rsReturn.return === consts.CODE.OK && hasBuyFilm) {
                    const setRevenue = isModeCheck
                      ? Promise.resolve(0)
                      : model.setRedis({
                      day: moment().format('YYYYMMDD'),
                      value: +params.amount
                    })
                    return setRevenue
                  }

                  return rs
                }
                return
              })
              .then((rs) => {
                self.response({ args, params, rsReturn }, cb);
              })
              .catch((err) => {
                rsReturn = {
                  return: consts.CODE.FAIL,
                  message: (err.stack || err) || 'fail'
                };
                helper.console('rsReturn', 'catch', rsReturn);

                //helper.sendEmail({
                //  err: (err.stack || err),
                //  params: args,
                //  subject: `ERROR VIETTEL_TAI_LE: ${args.msisdn || ''}`
                //});
                self.response({ args, params, rsReturn }, cb);
              });
          }
        }
      }
    };

    const wsdl = config.getContent.wsdl[env];
    const soapServer = new soapServices();
    soapServer.start(server, myService, wsdl, config.getContent.path);
  };

  this.modeCheck = function (args) {
    let rsCheckUser__, rsCreateUser__, rsCheckCondition__ = null;
    let successCheckUser, successCreateUser, successCheckCondition, condModeCheck = null;

    const { validSynTax, hasBuyFilm } = self.checkValidSynTax(args);
    args.hasBuyFilm = hasBuyFilm
    if (!validSynTax)
      return Promise.resolve({ return: consts.CODE.INVALID_SYNTAX });

    return callApi.checkUser(Object.assign({}, args,
      { account: args.msisdn })
    )
      .then((rsCheckUser) => {
        rsCheckUser__ = rsCheckUser;

        successCheckUser = _.get(rsCheckUser, 'resApi.info.username')
        rsCheckUser__.success = successCheckUser ? 'SUCCESS' : 'FAIL';

        if (!successCheckUser)
          return callApi.createUser({
            account: args.msisdn,
            password: helper.randomPass(5),
          });
        else return Promise.resolve({});
      })
      .then((rsCreateUser) => {
        rsCreateUser__ = rsCreateUser;

        successCreateUser = Number(_.get(rsCreateUser, 'resApi.info.code')) === 1
        rsCreateUser__.success = successCreateUser ? 'SUCCESS' : 'FAIL';

        condModeCheck = (
          successCheckUser
          || (!successCheckUser && successCreateUser)
        );

        if (!hasBuyFilm && condModeCheck) {
          return callApi.checkCondition_({
            msisdn: args.msisdn,
            account: args.msisdn,
            packageCode: args.packageCode,
            mo: args.mo,
            amount: args.amount || 0,
            tranId: args.tranId || null,
            uid: _.get(rsCheckUser__, 'resApi.info.uid') || _.get(rsCreateUser__, 'resApi.info.accountnumber')
          })
        }
        return Promise.resolve({})
      })
      .then((rsCheckCondition) => {
        rsCheckCondition__ = rsCheckCondition;

        successCheckCondition = Number(_.get(rsCheckCondition__, 'resApi.enable') === 1)
        rsCheckCondition__.success = successCheckCondition ? 'SUCCESS' : 'FAIL';

        if (rsCheckCondition__.dataApi) {
          condModeCheck = condModeCheck && successCheckCondition
        }

        const rsCallApi = {
          checkUser: rsCheckUser__,
          createUser: rsCreateUser__,
          checkCondition: rsCheckCondition__
        };

        const objReturn = condModeCheck
          ? { return: consts.CODE.OK, callApi: rsCallApi }
          : { return: consts.CODE.FAIL, callApi: rsCallApi };

        return Promise.resolve(objReturn);
      });
  };

  this.modeReal = function (args) {
    let rsAddPackage__ = null;
    let rsAddPackageIgnore__ = null;
    let successAddPackage = null;


    const { validSynTax, hasBuyFilm } = self.checkValidSynTax(args);
    args.hasBuyFilm = hasBuyFilm

    // if (!validSynTax)
    //   return Promise.resolve({ return: consts.CODE.INVALID_SYNTAX });

    const { packageItem } = self.getPackageItem(args.packageCode);
    const expireItem = moment().add(packageItem.expiredMap || 0 + packageItem.bonusTime || 0, 'months').unix();

    const ignoreRes = true;
    const params = Object.assign({}, args, {
      msisdn: args.msisdn,
      account: args.msisdn,
      packageCode: args.command || args.params,
      mo: args.mo || args.params,
      amount: packageItem.amountInt || args.amount || 0
    });

    const promiseList = hasBuyFilm
      ? {
      rsAddPackage: callApi.buyContent(params),
      rsAddPackageIgnore: callApi.addPackage(params, ignoreRes)
    }
      : { rsAddPackage: callApi.addPackage_(params) }

    return Promise.props(promiseList)
      .then(({ rsAddPackage, rsAddPackageIgnore }) => {
        rsAddPackage__ = rsAddPackage;
        rsAddPackageIgnore__ = rsAddPackageIgnore;
        rsAddPackage__.hasBuyFilm = hasBuyFilm;

        if (!hasBuyFilm
          && rsAddPackage
          && rsAddPackage.resApi
          && !rsAddPackage.resApi.expire
        ) {
          rsAddPackage.resApi.expire = expireItem;
        }

        successAddPackage = _.get(rsAddPackage, 'resApi.expire')
        rsAddPackage__.success = successAddPackage ? 'SUCCESS' : 'FAIL';

        if (successAddPackage) {
          return writeLog.getPassword(args.msisdn)
        } else Promise.resolve(null);
      })
      .then((password) => {
        const rsCallApi = {
          addPackage: rsAddPackage__,
          addPackageIgnore: rsAddPackageIgnore__,
        };
        const transId = _.get(rsAddPackage__, 'dataApi.transId')
        const condModeReal = successAddPackage;
        const objReturn = condModeReal
          ? { return: consts.CODE.OK, password, transId, callApi: rsCallApi }
          : { return: consts.CODE.FAIL, transId, callApi: rsCallApi };

        return Promise.resolve(objReturn);
      })
  };

  this.getMt = function (params, rsReturn) {
    const { MT1_VIP, MT1_GD, MT1_DA, MT1_MX, MT2_HAS_PASS, MT2_NOT_HAS_PASS, MT_ERROR_SYSTEM, MT_WRONG_SYNTAX } = TELCO_CONFIG.VIETTEL.MT_ACTIVE;
    const { MX } = TELCO_CONFIG.VIETTEL.PACKAGE;
    const { packageKey, packageItem } = self.getPackageItem(params.packageCode);

    if (rsReturn.return == consts.CODE.INVALID_SYNTAX)
      return MT_WRONG_SYNTAX;
    else if (rsReturn.return != consts.CODE.OK)
      return MT_ERROR_SYSTEM;
    else if (params.mode == consts.MODE.CHECK) {
      return 'success';
    }

    /*
     * get expire time in mt
     */
    const hasExpire = (rsReturn.callApi.addPackage.resApi && rsReturn.callApi.addPackage.resApi.expire);
    const hasBuyFilm = hasExpire && rsReturn.callApi.addPackage.hasBuyFilm;
    let expireTime = '';
    if (hasBuyFilm) {
      expireTime = rsReturn.callApi.addPackage.resApi.expire;
      expireTime = moment(expireTime, 'YYYY-MM-DD HH:mm:ss').format('HH:mm:ss')
        + ' ngay '
        + moment(expireTime, 'YYYY-MM-DD HH:mm:ss').format('DD-MM-YYYY');

    } else if (hasExpire) {
      expireTime = (rsReturn.callApi.addPackage.resApi && rsReturn.callApi.addPackage.resApi.expire);
      expireTime = moment.unix(expireTime).format('HH:mm:ss')
        + ' ngay '
        + moment.unix(expireTime).format('DD-MM-YYYY');
    }

    /*
     * get mt
     */
    const MT = (['ON_DA1', 'ON_DA3'].indexOf(packageKey) > -1)
      ? MT1_DA
      : (['ON_GD1', 'ON_GD3'].indexOf(packageKey) > -1)
                 ? MT1_GD
                 : (['ON_VIP1', 'ON_VIP3'].indexOf(packageKey) > -1)
          ? MT1_VIP
          : MT1_MX;

    const packageName = (packageKey !== 'MX')
      ? packageItem.name || ''
      : MX.mapContent[params.amount || 0]
                          ? MX.mapContent[params.amount || 0][params.contentCode] || ''
                          : '';

    const mt1 = MT.replace('<packageName>', packageName)
      .replace('<amount>', packageItem.amount || params.amount || '')
      .replace('<data3G>', packageItem.data3G || '')
      .replace('<numCurrentScreen>', packageItem.numCurrentScreen || '')
      .replace('<numTotalDevice>', packageItem.numTotalDevice || '')
      .replace('<expireTime>', expireTime);

    const mt2 = rsReturn.password
      ? MT2_HAS_PASS.replace('<password>', rsReturn.password || '')
      : MT2_NOT_HAS_PASS;

    const mt = mt1 + mt2;
    return KhongDau(mt);
  };

  this.getPackageItem = function (packageCode) {
    const { PACKAGE } = TELCO_CONFIG.VIETTEL;

    let packageItem = {};
    let packageKey = null;
    for (let key in PACKAGE) {
      const syntaxs = PACKAGE[key].syntax.reg;

      syntaxs.map(syntax => {
        if (!packageKey && syntax.indexOf(packageCode.toUpperCase()) > -1) {
          packageItem = PACKAGE[key];
          packageKey = key;
        }
      });
    }
    return { packageKey, packageItem };
  };

  this.checkValidSynTax = function (params) {
    const rs = { validSynTax: false, hasBuyFilm: false };

    const { packageKey } = self.getPackageItem(params.packageCode);
    if (packageKey != 'MX') {
      rs.validSynTax = true;
      return rs;
    }


    const { MX } = TELCO_CONFIG.VIETTEL.PACKAGE;
    const packageName = MX.mapContent[params.amount || 0]
      ? MX.mapContent[params.amount || 0][params.contentCode] || null
      : null;

    // const packageName = MX.mapContent[params.contentCode] || null;
    if (packageName) {
      rs.validSynTax = true;
      rs.hasBuyFilm = true;
    }

    if ((params.mode || '').trim() === 'REAL') {
      rs.hasBuyFilm = true;
    }
    return rs;
  };
  this.validRequest = function (args) {
    const params = Object.assign({}, args);

    const fields = ['username', 'password', 'serviceid', 'msisdn', 'params', 'mode'];
    for (let i = 0; i < fields.length; i++) {
      if (typeof params[fields[i]] === 'undefined') {
        return {
          valid: consts.CODE.WRONG_PARAM,
          message: 'WRONG_PARAM',
          params
        };
      }
    }
    if (params.username !== config.auth.username
      || params.password !== config.auth.password) {
      return {
        valid: consts.CODE.AUTH_FAIL,
        message: 'AUTH_FAIL',
        params
      };
    }
    params.msisdn = helper.addZeroPhone(params.msisdn);
    params.mo = params.params.toUpperCase();
    const arrCommand = params.mo.split(' ');
    params.packageCode = arrCommand[0] ? arrCommand[0].trim() : '';
    params.contentCode = arrCommand[1] ? arrCommand[1].trim() : '';

    helper.console('validRequest', 'params', params);

    return {
      valid: consts.CODE.OK,
      message: 'SUCCESS',
      params
    };
  };

  this.response = ({ args, params, rsReturn }, cb) => {
    const mt = self.getMt(params, rsReturn);

    const ecResponse = (rsReturn.return == consts.CODE.OK)
      ? consts.CODE.OK
      : consts.CODE.FAIL;

    const resLast = { return: ecResponse + '|' + mt };
    const rsCallApi = rsReturn.callApi || {};

    const resSave = {
      params,
      reqBody: args,
      callApi: rsCallApi,
      response: Object.assign({
        code: rsReturn.return,
        message: rsReturn.message || '',
        mt
      }, resLast),
      transId: rsReturn.transId
    };

    writeLog.saveTran(resSave);

    if (_.get(rsCallApi, 'createUser.dataApi.password')) {
      writeLog.saveUserPass({
        username: args.msisdn,
        password: _.get(rsCallApi, 'createUser.dataApi.password')
      });
    }

    console.log('resLast', resLast)
    cb(resLast);
  };
};
module.exports = GetContent;

//new GetContent().test({
//  username: "vtvcabon",
//  password: "vtvcabon@535",
//  serviceid: "VTVCABON_TAILEM5",
//  msisdn: "376557351",
//  params: "m5 5001 205",
//  mode: "CHECK",
//  amount: 5000
//}, console.log)

//setTimeout(function () {
//  new GetContent().test({
//    username: "vtvcabon",
//    password: "vtvcabon@535",
//    serviceid: "VTVCABON_TAILEM5",
//    msisdn: "376557351",
//    params: "m5 5001 205",
//    mode: "REAL",
//    amount: 5000
//  }, console.log)
//}, 1000)

