/**
 * Created by bi on 5/23/16.
 */

'use strict';

const app = require('../utils/express-singleton');
const config = require('../../config/config');

const moment = require('moment');
const WebServices = require('./webServices');
const consts = require('../../config/consts');
const utils = require('../utils/utils');
const util = require('util');
const lodash = require('lodash');
const handlerMT = require('../utils/handlerMT');
const helper = require('../../common/helper');
const writeLog = require('../../writeLog/writeLog');

const MoListener = function () {
  const self = this;
  
  this.map = {
    'HD': 'guide',
    'KT': 'getInfo',
    'MK': 'resetPassword'
  };
  this.validRequest = function (args) {
    const params = Object.assign({}, args);
    
    const fields = ['username', 'password', 'source', 'dest', 'content'];
    for (let i = 0; i < fields.length; i++) {
      if (typeof params[fields[i]] === 'undefined') {
        return {
          valid: consts.CODE.WRONG_PARAM_LISTENMO,
          message: 'WRONG_PARAM',
          params
        };
      }
    }
    if (params.username !== config.auth.username
      || params.password !== config.auth.password) {
      return {
        valid: consts.CODE.AUTH_FAIL_LISTENMO,
        message: 'AUTH_FAIL',
        params
      };
    }
    
    const arr = (args.content || '')
      .split(' ');
    let cmd = arr[0].toUpperCase();
    if (arr.length === 2) {
      cmd = arr[1].toUpperCase();
    }
    params.cmd = cmd;
    params.msisdn = helper.add84Phone(args.source);
    
    return {
      valid: consts.CODE.OK,
      message: 'SUCCESS',
      params
    };
  };
  this.startServer = function (env) {
    let myService = {
      MoService: {
        MoPort: {
          moRequest: function (args, cb) {
            helper.consoleInit('moRequest11', 'args', args);
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
            
            rsReturn = {
              return: consts.CODE.OK,
              message: 'success'
            };
            self.response({args, params, rsReturn}, cb);
          }
        }
      }
    };
    
    let wsdl = config.moListener.wsdl[env];
    let port = config.moListener.port[env];
    let server = new WebServices();
    server.start(myService, port, wsdl, config.moListener.path);
  };
  
  
  this.response = ({args, params, rsReturn}, cb) => {
    const resLast = {return: rsReturn.return};
    const callApi = rsReturn.callApi || {};
    
    const resSave = {
      params,
      reqBody: args,
      callApi: callApi,
      response: Object.assign({
        code: rsReturn.return,
        message: rsReturn.message || '',
      }, resLast),
    };
    
    writeLog.saveLogMt(resSave);
    cb(resLast);
  };
  
  
};

module.exports = MoListener;
