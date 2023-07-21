/**
 *	Testing subscriber services
 *
 */

'use strict';

const soap = require('soap');
// const url = 'http://127.0.0.1:8003/subscribe?wsdl';
const url = 'http://210.211.99.118:8003/getcontent?wsdl';

var client;

// before(function (done) {
	soap.createClient(url, function (err, cli) {
		if (err) {
			console.error(err);
			process.exit();
		}
		client = cli;
    
    let args = {
      username: 'sctvsub',
      password: 'sctv@789',
      serviceid: 'CHUYENGIABONGDA_SCTV',
      msisdn: '0349609862',
      chargetime: '20160531161630',
      params: 0,
      mode: 'REAL',
      amount: 3000,
      command: 'BD'
    };
    client.contentRequest(args, function (err, result) {
      console.log('response: ', err, result);
      // done(err);
		// done();
	});

// });

// describe('Subscriber services testing', function () {

	// it('Register should be ok ', function (done) {
	// 	let args = {
	// 		username: 'sctvsub',
	// 		password: 'sctv@789',
	// 		serviceid: 'CHUYENGIABONGDA_SCTV',
	// 		msisdn: '983970942',
	// 		chargetime: '20160531161630',
	// 		params: 0,
	// 		mode: 'REAL',
	// 		amount: 3000,
	// 		command: 'BD'
	// 	};
	// 	client.contentRequest(args, function (err, result) {
	// 		console.log('response: ', err, result);
	// 		done(err);
	// 	});
	// });

	// it('Register mode check should be ok', function (done) {
	// 	let args = {
	// 		username: 'sctvsub',
	// 		password: 'sctv@789',
	// 		serviceid: 'TIP',
	// 		msisdn: '979286705',
	// 		chargetime: '20150303080808',
	// 		params: 1,
	// 		command: 'TIP',
	// 		mode: 'CHECK',
	// 		amount: 10000
	// 	};
	// 	client.subRequest(args, function (err, result) {
	// 		console.log('response: ', err, result);
	// 		done(err);
	// 	});
	// });
	// it('Register should be ok', function (done) {
	// 	let args = {
	// 		username: 'sctvsub',
	// 		password: 'sctv@789',
	// 		serviceid: 'TIP',
	// 		msisdn: '979286704',
	// 		chargetime: '20150303080808',
	// 		params: 1,
	// 		command: 'TIP',
	// 		mode: 'REAL',
	// 		amount: 10000
	// 	};
	// 	client.subRequest(args, function (err, result) {
	// 		console.log('response: ', err, result);
	// 		done(err);
	// 	});
	// });

	// it('UnRegisterVip should ok', function (done) {
	// 	let args = {
	// 		username: 'sctvsub',
	// 		password: 'sctv@789',
	// 		serviceid: 'TIP',
	// 		msisdn: '979286704',
	// 		chargetime: '20150303080808',
	// 		params: 3,
	// 		command: 'TIP',
	// 		mode: 'REAL',
	// 		amount: 10000
	// 	};
	// 	client.subRequest(args, function (err, result) {
	// 		console.log('response: ', err, result);
	// 		done(err);
	// 	});
	// });
});
