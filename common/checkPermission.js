const moment = require('moment');
const md5 = require('md5');
const _ = require('lodash');
const CONFIG = require('../config/config');
const TELCO_CONFIG = require('../config/telcoConfig');
const Validator = require('validatorjs');

const ruleConfig = {
  updatePackage: {
    isdn: 'required|string',
    serviceCode: ['required', 'string', {'in': [TELCO_CONFIG.MOBI.SERVICE_CODE]}],//99909
    packageCode: 'required|string',
    groupCode: 'string',
    commandCode: 'required|string',
    regDatetime: 'required|string',
    staDatetime: 'required|string',
    endDatetime: 'string',
    expireDatetime: 'string',
    status: 'required|string',
    channel: 'required|string',
    charge_price: 'string',
    message_send: 'string',
    org_request: 'required|string',
  },
};

module.exports = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  const params = !_.isEmpty(req.body) ? req.body : req.query;
  const url = req.originalUrl || null;
  
  console.log('---------------------------------------------------------------------------------------');
  console.log('---------------------------------------------------------------------------------------');
  console.log('---------------------------------------------------------------------------------------');
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), '---into ----into---params----', params);
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), '-----into---url----', url);
  
  //check invalid params
  let ruleParams = {};
  for (let tmpUrl in ruleConfig) {
    if (url && url.indexOf(tmpUrl) > -1)
      ruleParams = ruleConfig[tmpUrl];
  }
  const validator = new Validator(params, ruleParams);
  if (validator.fails()) {
    const objError = Object.assign({}, CONFIG.EC.INVALID_PARAM, {SUB_MESSAGE: validator.errors.all()});
    return next(objError);
  }
  return next();
};
