var http = require('http');
var soap = require('soap');

var WebServices = function () {

	this.start = function (service, port, wsdl, path) {
		console.log('Log: ', wsdl, port, path);
		var xml = require('fs')
			.readFileSync(wsdl, 'utf8');
		var server = http.createServer(function (request, response) {
			response.end("404: Not Found: " + request.url);
		});
		server.listen(port);
		var soapServer = soap.listen(server, path, service, xml);
    soapServer.log = function(event, msg) {
      console.log('SOAP: ', event, msg);
    };
    console.log("SOAP service " + path + " listening.. on port " + port);
	};
};

module.exports = WebServices;
