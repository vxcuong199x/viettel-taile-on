/**
 * Created by cuongvx on 26/12/19.
 */

'use strict';
const WebServices = require('./lib/libServices/webServices');

//const portGlobal = 8001;
 const portGlobal = process.env.PORT || 8400;
const env = (process.env.NODE_ENV === 'production')
  ? 'production'
  : 'local';
console.log('--------env--', env, portGlobal);


const webServer = new WebServices();
const server = webServer.start(portGlobal);

const ViettelContent = require('./lib/mainServices/getContent');
const serverContent = new ViettelContent();
serverContent.startServer(server, env);

// const ViettelMoListener = require('./lib/mainServices/moListener');
// const MoSubscriber = new ViettelMoListener();
// MoSubscriber.startServer(server, env);
