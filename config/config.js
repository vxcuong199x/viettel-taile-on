module.exports = {
  "portGlobal": 8400,
  "getContent": {
    "path": "/getcontent",
    "wsdl": {
      "production": "wsdl/production/viettelcontent.wsdl",
      "test": "wsdl/test/viettelcontent.wsdl",
      "local": "wsdl/local/viettelcontent.wsdl"
    },
    "port": {
      "production": 8400,
      "test": 8013,
      "local": 8400
    }
  },
  "moListener": {
    "path": "/molistener",
    "wsdl": {
      "production": "wsdl/production/viettelmo.wsdl",
      "test": "wsdl/test/viettelmo.wsdl",
      "local": "wsdl/local/viettelmo.wsdl"
    },
    "port": {
      "production": 8400,
      "test": 8012,
      "local": 8400
    }
  },
  "auth": {
    "username": "vtvcabon",
    "password": "vtvcabon@535"
  }
};


