/**
 * Created by vxcuong on 25/12/19.
 */

"use strict";

const app = require('../utils/express-singleton');
const config = require('../../config/config');

const moment = require('moment');
const Promise = require('bluebird');
const WebServices = require('./webServices');
const consts = require('../../config/consts');
const helper = require('../../common/helper');
const callApi = require('../../common/callApi');

const TELCO_CONFIG = require('../../config/telcoConfig');
const writeLog = require('../../writeLog/writeLog');

const utils = require('../utils/utils');
const util = require('util');
const lodash = require('lodash');

const GetContent = function () {
  let self = this;
  
  this.map = {
    'HD': 'guide',
    'KT': 'getInfo',
    'MK': 'resetPassword'
  };
  this.startServer = function (env) {
    const myService = {
      ContentService: {
        ContentPort: {
          contentRequest: (args, cb) => {
            helper.consoleInit('contentRequest', 'args', args);
            let rsReturn = {};
            
            //check valid request
            const {valid, params, message} = self.validRequest(args);
            if (valid !== consts.CODE.OK) {
              rsReturn = {
                return: valid,
                message
              };
              self.response({args, params, rsReturn}, cb);
              return;
            }
            
            //main logic
            const runPromise = (params.mode === consts.MODE.CHECK)
              ? self.modeCheck(params)
              : self.modeReal(params);
            
            runPromise
              .then((rs) => {
                rsReturn = rs;
                rsReturn.message = rsReturn.message || 'success';
                self.response({args, params, rsReturn}, cb);
              })
              .catch((err) => {
                rsReturn = {
                  return: consts.CODE.FAIL,
                  message: (err.stack || err) || 'fail'
                };
                self.response({args, params, rsReturn}, cb);
              });
          }
        }
      }
    };
    
    const wsdl = config.getContent.wsdl[env];
    const port = config.getContent.port[env];
    const server = new WebServices();
    server.start(myService, port, wsdl, config.getContent.path);
  };
  
  this.modeCheck = function (args) {
    let rsCheckUser__, rsCreateUser__ = null;
    let successCheckUser, successCreateUser = null;
    
    return callApi.checkUser({
      account: args.msisdn
    })
      .then((rsCheckUser) => {
        rsCheckUser__ = rsCheckUser;
        
        successCheckUser = (
        rsCheckUser
        && rsCheckUser.resApi
        && rsCheckUser.resApi.info
        && rsCheckUser.resApi.info.username);
        rsCheckUser__.success = successCheckUser ? 'SUCCESS' : 'FAIL';
        helper.console('successCheckUser', 'successCheckUser', successCheckUser);
        
        if (!successCheckUser)
          return callApi.createUser({
            account: args.msisdn,
            password: helper.randomPass(5),
          });
        else return Promise.resolve({});
      })
      .then((rsCreateUser) => {
        rsCreateUser__ = rsCreateUser;
        
        successCreateUser = (
        rsCreateUser
        && rsCreateUser.resApi
        && rsCreateUser.resApi.info
        && rsCreateUser.resApi.info.code
        && rsCreateUser.resApi.info.code == '1');//success
        
        if (rsCreateUser.resApi)
          rsCreateUser__.success = successCreateUser ? 'SUCCESS' : 'FAIL';
        
        const condModeCheck = (
          successCheckUser
          || (!successCheckUser && successCreateUser)
        );
        
        const callApi = {
          checkUser: rsCheckUser__,
          createUser: rsCreateUser__
        };
        
        const objReturn = condModeCheck
          ? {return: consts.CODE.OK, callApi}
          : {return: consts.CODE.FAIL, callApi};
        
        return Promise.resolve(objReturn);
      });
  };
  this.modeReal = function (args) {
    let rsAddPackage__ = null;
    let successAddPackage = null;
    
    return callApi.addPackage({
      account: args.msisdn,
      packageCode: args.command || args.params
    })
      .then((rsAddPackage) => {
        rsAddPackage__ = rsAddPackage;
        
        successAddPackage = (
          rsAddPackage
          && rsAddPackage.resApi
          && rsAddPackage.resApi.expire
        );
        rsAddPackage__.success = successAddPackage ? 'SUCCESS' : 'FAIL';
        
        if (successAddPackage) {
          return writeLog.getPassword(args.msisdn)
        } else Promise.resolve(null);
      })
      .then((password) => {
        helper.console('password', 'password', password);
        
        const callApi = {
          addPackage: rsAddPackage__
        };
        const condModeReal = successAddPackage;
        const objReturn = condModeReal
          ? {return: consts.CODE.OK, password, callApi}
          : {return: consts.CODE.FAIL, rsApi};
        
        return objReturn;
      })
  };
  
  this.getMt = function (params, rsReturn) {
    const {MT2, MT_ERROR_SYSTEM} = TELCO_CONFIG.VIETTEL.MT_ACTIVE;
    const packageCode = params.cmd || params.package;
    const packageItem = self.getPackageItem(packageCode);
    
    if (rsReturn.return != consts.CODE.OK)
      return MT_ERROR_SYSTEM;
    else if (params.mode == consts.MODE.CHECK) {
      return 'success';
    }
    
    let expireTime = (rsReturn.callApi.addPackage.resApi && rsReturn.callApi.addPackage.resApi.expire);
    expireTime = moment.unix(expireTime).format('HH:mm:ss DD-MM-YYYY');
    
    const mt = MT2.replace('<packageName>', packageItem.name || '')
      .replace('<expireTime>', expireTime)
      .replace('<password>', rsReturn.password || 'XXX');
    return mt;
  };
  
  this.getPackageItem = function (packageCode) {
    const {PACKAGE} = TELCO_CONFIG.VIETTEL;
    let rs = {};
    for (let key in PACKAGE) {
      const syntax = PACKAGE[key].syntax.reg;
      
      if (syntax.indexOf(packageCode) > -1)
        rs = PACKAGE[key];
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
    
    // if (config.package[params.serviceid] === undefined) {
    //   return {return: consts.CODE.WRONG_PARAM, params};
    // }
    const arr = (params.command || '').split(' ');
    let cmd = arr[0].toUpperCase();
    
    if (arr.length === 2) {
      cmd = arr[1].toUpperCase();
    }
    
    params.cmd = cmd;
    // params.msisdn = utils.convertPhone(params.msisdn);
    params.msisdn = helper.add84Phone(params.msisdn);
    params.params = Number(params.params);
    params.package = params.serviceid;
    // params.package = config.package[params.serviceid];
    
    return {
      valid: consts.CODE.OK,
      message: 'SUCCESS',
      params
    };
  };
  
  this.response = ({args, params, rsReturn}, cb) => {
    const mt = self.getMt(params, rsReturn);
    const resLast = {return: rsReturn.return + '|' + mt};
    const callApi = rsReturn.callApi || {};
    
    const resSave = {
      params,
      reqBody: args,
      callApi: callApi,
      response: Object.assign({
        code: rsReturn.return,
        message: rsReturn.message || '',
        mt
      }, resLast),
    };
    
    writeLog.saveTran(resSave);
    if (callApi.createUser && Object.keys(callApi.createUser).length)
      writeLog.saveUserPass({
        username: args.msisdn,
        password: callApi.createUser.dataApi.password,
      });
    
    cb(resLast);
  };
};
module.exports = GetContent;
