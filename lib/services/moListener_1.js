/**
 * Created by bi on 5/23/16.
 */

'use strict';

const app = require('../utils/express-singleton');
const config = require('../../config/config');

const moment = require('moment');
const WebServices = require('./webServices');
const consts = require('../consts/consts');
const utils = require('../utils/utils');
const util = require('util');
const lodash = require('lodash');
const handlerMT = require('../utils/handlerMT');

const MoListener = function () {
  const self = this;

  this.map = {
    'HD': 'guide',
    'KT': 'getInfo',
    'MK': 'resetPassword'
  };

  this.validRequest = function (args) {
    console.log('mo args: ', args);
    let params = ['username', 'password', 'source', 'dest', 'content'];
    for (let i = 0; i < params.length; i++) {
      if (typeof args[params[i]] === 'undefined') {
        return consts.CODE.WRONG_PARAM;
      }
    }
    if (args.username !== config.auth.username || args.password !== config.auth.password) {
      return consts.CODE.AUTH_FAIL;
    }
    let arr = (args.content || '')
      .split(' ');
    let cmd = arr[0].toUpperCase();
    if (arr.length === 2) {
      cmd = arr[1].toUpperCase();
    }
    args.cmd = cmd;
    args.msisdn = utils.convertPhone(args.source);
    return consts.CODE.OK;
  };

  this.response = function (opts) {
    console.log('Opts: ', opts);
    if (this.transaction) {
      this.transaction.updateAttributes({
        response: opts.msg || opts.ec
      });
    }
    return {
      return: util.format('%d|%s|0|0', opts.ec, opts.msg ? opts.msg : config.error[opts.ec])
    };
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
          msg: utils.fillToken(config.msg.dontExists, {
            phone: args.msisdn
          })
        });
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
      .getPlanInfo(args.msisdn)
      .then(function (res) {
        console.log('getInfo: ', res);
        if (res && res.plan) {
          let mt = app.get('mtConfig').get(res.plan, consts.STATE.GET_INFO);
          handlerMT.send({
            msisdn: args.msisdn,
            content: mt
          });
          return utils.invokeCallback(cb, null, {
            ec: consts.CODE.OK,
            msg: mt
          });
        } else if (res !== false) {
          let mt = app.get('mtConfig').get('fail', consts.STATE.GET_INFO);
          handlerMT.send({
            msisdn: args.msisdn,
            content: mt
          });
          return utils.invokeCallback(cb, null, {
            ec: consts.CODE.OK,
            msg: mt
          });
        }
        utils.invokeCallback(cb, null, {
          ec: consts.CODE.ERROR
        });
      })
      .catch(cb);
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
        });
      })
      .catch(function (err) {
        utils.invokeCallback(cb, err, {
          ec: consts.CODE.ERROR
        });
      });
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
          handlerMT.send({
            msisdn: args.msisdn,
            content: config.resetPassword.fail
          });
          return utils.invokeCallback(cb, null, {
            ec: consts.CODE.FAIL,
            msg: config.resetPassword.fail
          });
        }
        let expire = moment(user.expireTime);
        // if (!expire.isValid() || expire.isBefore(new Date()) || user.status !== consts.STATUS.ACTIVE) {
        //   handlerMT.send({
        //     msisdn: user.msisdn,
        //     content: config.resetPassword.fail
        //   });
        //   return utils.invokeCallback(cb, null, {
        //     ec: consts.CODE.OK,
        //     msg: config.resetPassword.fail
        //   });
        // }
        app
          .get('api')
          .resetPassword({
            phone: args.msisdn
          })
          .then(function(res) {
            if (res) {
              user
                .updateAttributes({
                  password: res.password
                })
                .then(function () {
                  let mt = utils.fillToken(config.resetPassword.ok, {
                    password: res.password
                  });
                  handlerMT.send({
                    msisdn: user.msisdn,
                    content: mt
                  });
                  utils.invokeCallback(cb, null, {
                    ec: consts.CODE.OK,
                    msg: mt 
                  });
                })
                .catch(cb);
            } else {
              handlerMT.send({
                msisdn: user.msisdn,
                content: config.resetPassword.default
              });
              utils.invokeCallback(cb, err, {
                ec: consts.CODE.FAIL,
                msg: config.resetPassword.default
              });
            }
          });
      })
      .catch(cb);
  };

  this.startServer = function (env) {
    let myService = {
      MoService: {
        MoPort: {
          moRequest: function (args, cb) {
            let code = self.validRequest(args);
            if (code) {
              return utils.invokeCallback(cb, self.response(code, config.error[code]));
            }
            app
              .get('db')
              .transaction
              .create({
                serviceId: args.content,
                msisdn: args.msisdn,
                route: 'moListener',
                day: Number(moment().format('YYYYMMDD'))
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
                    utils.invokeCallback(cb, self.response(data));
                  });
                } else {
                  if (self.map.hasOwnProperty(args.cmd)) {
                    console.log('map: ', self.map[args.cmd]);
                    self[self.map[args.cmd]](args, function (err, res) {
                      if (err) console.error(err);
                      utils.invokeCallback(cb, self.response(res || {
                        ec: consts.CODE.ERROR
                      }));
                    });
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
                  return utils.invokeCallback(cb, self.response(consts.CODE.ERROR));
                }
                utils.invokeCallback(cb, self.response(err));
              });
          }
        }
      }
    };

    let wsdl = config.moListener.wsdl[env];
    let port = config.moListener.port[env];
    let server = new WebServices();
    server.start(myService, port, wsdl, config.moListener.path);
  };
};

module.exports = MoListener;
