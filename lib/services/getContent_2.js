/**
 * Created by bi on 5/23/16.
 */

"use strict";

const app = require('../utils/express-singleton');
const config = require('config');
const moment = require('moment');
const WebServices = require('./webServices');
const consts = require('../consts/consts');
const helper = require('../../common/helper');

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
  
  this.validRequest = function (args) {
    const params = ['username', 'password', 'serviceid', 'msisdn', 'params', 'mode'];
    for (var i = 0; i < params.length; i++) {
      if (typeof args[params[i]] === 'undefined') {
        return consts.CODE.WRONG_PARAM;
      }
    }
    if (config.package[args.serviceid] === undefined) {
      return consts.CODE.WRONG_PARAM;
    }
    const arr = (args.command || '').split(' ');
    let cmd = arr[0].toUpperCase();
    
    if (arr.length === 2) {
      cmd = arr[1].toUpperCase();
    }
    args.cmd = cmd;
    args.msisdn = utils.convertPhone(args.msisdn);
    args.params = Number(args.params);
    args.package = config.package[args.serviceid];
    if (args.username !== config.username || args.password !== config.password) {
      return consts.CODE.AUTH_FAIL;
    }
    return consts.CODE.OK;
  };
  
  this.response = async (opts) =>{
    if (this.transaction) {
      this.transaction.updateAttributes({
        response: opts.msg || opts.ec
      });
    }
    
    //write log
    await writeLog.saveLogMt({
      params: reqBody,
      reqBody,
      response,
      callApi: {sendMt: rsSendMt},
    });
    
    return {
      return: util.format('%d', opts.ec)
      // return: util.format('%d|%s|0|0', opts.ec, opts.msg ? opts.msg : config.error[opts.ec])
    }
  };
  
  this.checkConnection = function (args, cb) {
    if (consts.PARAMS[args.params] === undefined) {
      return utils.invokeCallback(cb, false, config.error[consts.CODE.WRONG_PARAM]);
    }
    app
      .get('api')
      .checkPhoneExists(args.msisdn)
      .then(function (exists) {
        if (exists) {
          return utils.invokeCallback(cb, true);
        }
        utils.invokeCallback(cb, false, {
            ec: consts.CODE.USER_NOT_EXISTS,
            msg: utils.fillToken(config.msg.dontExists, {phone: args.msisdn})
          }
        );
      })
      .catch(function (err) {
        console.error(err);
        utils.invokeCallback(cb, false, {
          ec: consts.CODE.ERROR
        });
      });
  };
  
  this.getInfo = function (args, cb) {
    app
      .get('api')
      .getPlan({
        phone: args.msisdn
      }, function (err, res) {
        if (res) {
          return utils.invokeCallback(cb, null, {
            ec: consts.CODE.OK,
            msg: app.get('mtConfig')
              .get(res.name, consts.STATE.GET_INFO)
          });
        } else if (res === false) {
          return utils.invokeCallback(cb, null, {
            ec: consts.CODE.OK,
            msg: app.get('mtConfig')
              .get('fail', consts.STATE.GET_INFO)
          });
        }
        utils.invokeCallback(cb, err, {
          ec: consts.CODE.ERROR
        });
      });
  };
  
  this.guide = function (args, cb) {
    app
      .get('db')
      .mt
      .findOne({
        where: {
          cmd: args.cmd.toLowerCase(),
          state: consts.STATE.GUIDE
        },
        raw: true
      })
      .then(function (mt) {
        utils.invokeCallback(cb, null, {
          ec: consts.CODE.OK,
          msg: mt ? mt.msg : 'Khong tim thay dich vu'
        })
      })
      .catch(function (err) {
        utils.invokeCallback(cb, err, {
          ec: consts.CODE.ERROR
        });
      })
  };
  
  this.resetPassword = function (args, cb) {
    app
      .get('db')
      .subscriber
      .findOne({
        where: {
          msisdn: args.msisdn
        }
      })
      .then(function (user) {
        if (!user) {
          return utils.invokeCallback(cb, {
            ec: consts.CODE.FAIL,
            msg: config.resetPassword.fail
          });
        }
        var expire = moment(user.expireTime);
        if (!expire.isValid() || expire.isBefore(new Date()) || user.status !== consts.STATUS.ACTIVE) {
          return utils.invokeCallback(cb, null, {
            ec: consts.CODE.OK,
            msg: config.resetPassword.dontExists
          });
        }
        app
          .get('api')
          .resetPassword({
            phone: args.msisdn
          }, function (err, res) {
            if (res) {
              user
                .updateAttributes({
                  password: res.password
                })
                .then(function () {
                  utils.invokeCallback(cb, null, {
                    ec: consts.CODE.OK,
                    msg: utils.fillToken(config.resetPassword.ok, {
                      password: res.password
                    })
                  });
                })
                .catch(cb);
            } else {
              utils.invokeCallback(cb, err, {
                ec: consts.CODE.FAIL,
                msg: config.resetPassword.default
              });
            }
          })
      })
      .catch(cb);
  };
  
  this.startServer = function (env) {
    const myService = {
      ContentService: {
        ContentPort: {
          contentRequest: function (args, cb) {
            helper.consoleInit('contentRequest', 'args', args);
            
            if (args.msisdn != '0349609862')
              return utils.invokeCallback(cb, self.response({
                ec: consts.CODE.WRONG_PARAM
              }));
            
            const code = self.validRequest(args);
            if (code) {
              return utils.invokeCallback(cb, self.response(code, config.error[code]))
            }
            
            app
              .get('db')
              .transaction
              .create({
                serviceId: args.serviceid,
                msisdn: args.msisdn,
                params: args.params,
                amount: args.amount,
                command: args.command,
                mode: args.mode,
                route: 'getContent'
              })
              .then(function (transaction) {
                self.transaction = transaction;
                if (args.mode === consts.MODE.CHECK) {
                  self.checkConnection(args, function (status, data) {
                    if (status === true) {
                      return utils.invokeCallback(cb, self.response({
                        ec: consts.CODE.OK
                      }));
                    }
                    utils.invokeCallback(cb, self.response(data))
                  })
                } else {
                  
                  if (self.map.hasOwnProperty(args.cmd)) {
                    self.map[args.cmd](args, function (err, res) {
                      if (err) console.error(err);
                      utils.invokeCallback(cb, self.response(res || {
                          ec: consts.CODE.ERROR
                        }));
                    })
                  } else {
                    utils.invokeCallback(cb, self.response({
                      ec: consts.CODE.WRONG_PARAM
                    }));
                  }
                }
              })
              .catch(function (err) {
                if (lodash.isError(err)) {
                  console.error(err);
                  return utils.invokeCallback(cb, self.response(consts.CODE.ERROR))
                }
                utils.invokeCallback(cb, self.response(err));
              })
          }
        }
      }
    };
    
    const wsdl = config.getContent.wsdl[env];
    const port = config.getContent.port[env];
    const server = new WebServices();
    server.start(myService, port, wsdl, config.getContent.path);
  };
};

module.exports = GetContent;
