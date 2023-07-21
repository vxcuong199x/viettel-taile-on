/**
 * Created by bi on 3/4/16.
 */

module.exports = {
  CODE: {
    OK: 0,
    FAIL: 1,
    INVALID_SYNTAX: 2,
    OK_FREE: 3,
    OK_CHARGED: 4,
    NOT_ENOUGH_MONEY: 5,
    USER_NOT_EXISTS: 100,
    WRONG_PARAM: 300,
    AUTH_FAIL: 301,
    ERROR: 302,
    WRONG_PARAM_LISTENMO: 200,
    AUTH_FAIL_LISTENMO: 201,
    ERROR_LISTENMO: 400
  },


  CHARING: {
    FAIL: 1,
    OK: 0
  },

  MODE: {
    CHECK: 'CHECK',
    REAL: 'REAL'
  },

  STATE: {
    INIT: 'init',
    FIRST_SUCESS: 'reg',
    AGAIN_SUCESS: 'renew',
    FAIl: 'fail',
  },
  // STATE: {
  //   FIRST_REGISTER: 0,
  //   OK: 1,
  //   DUPLICATE: 2,
  //   EXISTS_PACKAGE_OTHER: 3,
  //   NOT_ENOUGH_MONEY: 4,
  //   CANCEL_OK: 5,
  //   CANCEL_FAIL: 6,
  //   FAIl: 7,
  //   GET_INFO: 8,
  //   GUIDE: 9,
  //   RENEW: 10
  // },

  CHANNEL: {
    SMS: 'SMS',
    WAP: 'WAP'
  },

  STATUS: {
    ACTIVE: 1,
    CANCEL_OK: 0,
    NOT_READY: -1,
    FAIL: 2
  },

  PARAMS: {
    REGISTER: 0,
    CANCEL: 1,
    PENDING: 2,
    RE_REGISTER: 3
  },

  REASON: {
    FIRST_REGISTER: 'REG',
    UN_REGISTER: 'UNREG',
    RENEW: 'RENEW'
  },

  MAX_RETRY: 105,

  DISTRIBUTOR_ID: 56
};
