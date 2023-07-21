const md5 = require('md5');
const moment = require('moment');
const parser = require('xml-js');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const Helper = {};
module.exports = Helper;

Helper.consoleInit = (methodName, variableName, variable, varExt = null) => {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), '-------------------------');
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), '-------------------------');
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), '-------------------------');
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), `-----${methodName}-----${variableName}: `, variable, varExt);
};

Helper.console = (methodName, variableName, variable, varExt = null) => {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss'), `-----${methodName}-----${variableName}: `, variable, varExt);
};


Helper.error = (methodName, variableName, variable, varExt = null) => {
  console.error(moment().format('YYYY-MM-DD HH:mm:ss'), `---ERROR--${methodName}-----${variableName}: `, variable, varExt);
};

Helper.generateTransactionId = (len = 4) => {
  let now = ((new Date().getTime() / 1000) | 0).toString()
  for (let i = 0; i < len; i++) {
    now += Math.round(Math.random() * 10)
  }
  return now
}

Helper.randomPass = (length) => {
  let text = "";
  const possible = "0123456789";
  for (let i = 0; i < length; i++) {
    const sup = Math.floor(Math.random() * possible.length);
    text += i > 0 && sup == i ? "0" : possible.charAt(sup);
  }
  return Number(text);
};


Helper.getTimeCurr = () => {
  const currTime = moment();

  const obj = {};
  obj.day = Number(currTime.format('YYYYMMDD'));
  obj.hour = Number(currTime.format('YYYYMMDDHH'));
  obj.createdAt = new Date();
  obj.updatedAt = new Date();
  obj.createdAt__ = currTime.format('YYYY-MM-DD HH:mm:ss');
  obj.updatedAt__ = currTime.format('YYYY-MM-DD HH:mm:ss');

  return obj;
};

Helper.getPackageCodeByCommand = (commandCode, packageConfig) => {
  let rs = null;

  for (const packageCode of Object.keys(packageConfig)) {
    const objSyntax = packageConfig[packageCode].syntax;

    for (const namCommand of Object.keys(objSyntax)) {
      const commandItem = objSyntax[namCommand];
      if (commandItem.command == commandCode.toUpperCase())
        rs = packageCode;
    }
  }
  return rs;
};


Helper.convertXmlToObject = (xml) => {
  const json = parser.xml2json(xml, {
    sanitize: true,
    trim: true
  });
  let obj = JSON.parse(json);
  obj = obj.elements || [];
  obj = obj[0] || {};
  obj = obj.elements || [];

  const dataObject = {};
  obj.forEach((item) => {
    if (item.name == 'COMMAND') {
      const arr = item.elements || [];

      arr.forEach((itemSub) => {
        const value = itemSub.elements && itemSub.elements[0] && itemSub.elements[0].text;
        dataObject[itemSub.name] = value;
      });
    }
  });
  return dataObject;
};

Helper.getObjectParams = (reqBody) => {
  const objAccessGw = reqBody.accessgw || {};
  const arrCommand = objAccessGw.command || [];
  const objCommand = arrCommand[0] || {};

  const objParams = {};
  for (let field in objCommand) {
    const value = objCommand[field][0] || '';
    objParams[field] = value;
  }
  return objParams;
};

Helper.convertObjectToObjectByKey = (obj, key) => {
  const rs = {};
  for (let i in obj) {
    const item = obj[i];
    item.key = i;

    rs[item[key]] = item;
  }
  return rs;
};

Helper.formatDataUpdatePackage = (reqBody) => {
  const params = Object.assign({}, reqBody);

  for (let key in params) {
    const value = params[key] ? params[key].trim() : params[key];
    if (key == 'isdn') {
      params[key] = Helper.formatPhone(value);
    }

    if (['isdn', 'endDatetime', 'message_send'].indexOf(key) == -1) {
      if (Number.isInteger(Number(value)))
        params[key] = Number(value);
    }
  }
  return params;
};
// Helper.isString = (variable) => {
//   if (typeof variable === 'string' || variable instanceof String)
//     return true;
//   else return false;
// };

Helper.addZeroPhone = (phone) => {
  let phoneLast;

  const addZero = phone.length <= 9
    ? true
    : false;
  const del84 = (phone.length > 10 && phone.substr(0, 2) == '84')
    ? true
    : false;

  if (addZero)
    phoneLast = '0' + phone;
  else if (del84)
    phoneLast = '0' + phone.substr(2, phone.length - 1);
  else phoneLast = phone;

  return phoneLast;
};
Helper.add84Phone = (phone) => {
  let phoneLast;

  const add84 = phone.length <= 9
    ? true
    : false;

  const del0 = (phone.length >= 10 && phone.substr(0, 1) == '0')
    ? true
    : false;

  if (add84)
    phoneLast = '84' + phone;
  else if (del0)
    phoneLast = '84' + phone.substr(1, phone.length - 1);
  else phoneLast = phone;

  return phoneLast;
};


Helper.sendEmail = (inputs) => {
  const provider = 'VIETTEL_TAI_LE';
  const { err, orderId, subject, params } = inputs;

  let textGeneral = `- PARTNER : ${provider} \n`;
  textGeneral += `- PARAMS : ${JSON.stringify(params)}\n`;
  textGeneral += `-------------------------------------\n`;
  textGeneral += `-------------------------------------\n`;
  textGeneral += `-------------------------------------\n`;
  textGeneral += `- ERROR : ${JSON.stringify(err)}\n`;

  let text = '';
  let subject__ = '';
  if (orderId) {
    //get text will send
    text += `- ORDERID : ${orderId} \n`;
    text += textGeneral;

    subject__ += `Transaction Error:  ${provider}:  ${orderId}`;
  } else {
    //get text will send
    text += textGeneral;

    subject__ += subject ? subject : 'Error';
  }

  const poolConfig = {
    pool: true,
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use TLS
    auth: {
      user: 'vuthuanh199x@gmail.com',
      pass: 'vxcuong199x@35'
    }
  };

  /*
   TODO: send Mail
   */
  const toMailArray = ['vxcuong.9x@gmail.com'];
  toMailArray.forEach((toMail, index) => {
    const transporter = nodemailer.createTransport(smtpTransport(poolConfig));
    const mailOptions = {
      from: poolConfig.auth.user,
      to: toMail,
      subject: subject__,
      text: text
    };

    return transporter.sendMail(mailOptions, (error, info) => {
      error
        ? console.error(moment().format('YYYY-MM-DD HH:mm:ss'), '-----------into----ERROR SEND MAIL---', toMail, error)
        : console.log(moment().format('YYYY-MM-DD HH:mm:ss'), '-----------into----SUCCESS SEND MAIL---', toMail, info.messageId);
      transporter.close();
    });
  });
};

