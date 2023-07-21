module.exports = {
  MONGO: {
    // URL: "mongodb://localhost:27017/onpaygate",
    URL: "mongodb://u.onpaygate:jmZsBx6jHny9@sdrm-mongo01.gviet.vn:4637,sdrm-mongo02.gviet.vn:4737,sdrm-mongo03.gviet.vn:4837/onpaygate?maxPoolSize=100&connectTimeoutMS=20000",
    DB: 'onpaygate',
    COL: {
      tran: 'Transaction',
      user: 'User',
      logMt: 'LogMt'
    }
  },
  REDIS: {
    port: 6379,
    host: '127.0.0.1',
    db: 5
  }
};

