/**
 * Created by bi on 5/10/16.
 */

var request = require('request');
var querystring = require('querystring');
var utils = require('./utils');

var Message = function (config) {
	this.url = config.url;
	this.service = config.service;
	this.password = config.password;
};

Message.prototype.sendMT = function (opts, cb) {
	var url = this.url + '?' + querystring.stringify({
			to: '+' + opts.to,
			username: this.service,
			text: opts.msg,
			password: this.password
		});
	console.log('MT: ', url);
	request.get(url, function (err, response, body) {
		console.log('MT result: ', err, body);
		utils.invokeCallback(cb, err, response.statusCode === 202);
	})
};

module.exports = Message;
