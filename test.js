const a = {
  PACKAGE: {
    ON_VIP1: {
      name: 'ON VIP 1',
      amount: '66.000',
      amountInt: 66000,
      expiredMap: 1,//month
      bonusTime: 0,//day,
      data3G: '300MB',
      numCurrentScreen: 1,
      numTotalDevice: 5,
      syntax: {
        reg: ['ON', 'VIP1'],
      }
    },
    ON_VIP3: {
      name: 'ON VIP 3',
      amount: '198.000',
      amountInt: 198000,
      expiredMap: 3,//month
      bonusTime: 0,//day,
      data3G: '1GB',
      numCurrentScreen: 1,
      numTotalDevice: 5,
      syntax: {
        reg: ['ON3', 'VIP3'],
      }
    },

    ON_GD1: {
      name: 'ON GD 1',
      amount: '88.000',
      amountInt: 88000,
      expiredMap: 1,//month
      bonusTime: 0,//day,
      data3G: '300MB',
      numCurrentScreen: 2,
      numTotalDevice: 5,
      syntax: {
        reg: ['GD', 'GD1'],
      }
    },
    ON_GD3: {
      name: 'ON GD 3',
      amount: '264.000',
      amountInt: 264000,
      expiredMap: 3,//month
      bonusTime: 0,//day,
      data3G: '1GB',
      numCurrentScreen: 2,
      numTotalDevice: 5,
      syntax: {
        reg: ['GD3'],
      }
    },
    ON_DA1: {
      name: 'ON DA 1',
      amount: '50.000',
      amountInt: 50000,
      expiredMap: 1,//month
      bonusTime: 0,//day,
      data3G: '300MB',
      numCurrentScreen: 4,
      numTotalDevice: 4,
      syntax: {
        reg: ['DA', 'DA1'],
      }
    },
    ON_DA3: {
      name: 'ON DA 3',
      amount: '150.000',
      amountInt: 150000,
      expiredMap: 3,//month
      bonusTime: 0,//day,
      data3G: '1GB',
      numCurrentScreen: 4,
      numTotalDevice: 4,
      syntax: {
        reg: ['DA3'],
      }
    },
    MX: {
      name: 'MX',
      amount: null,
      expiredMap: null,//month
      bonusTime: null,//day,
      data3G: '50MB',
      numCurrentScreen: 4,
      numTotalDevice: 5,
      syntax: {
        reg: [
          'M5 %content_code%',
          'M10 %content_code%',
          'M20 %content_code%',
          'M50 %content_code%',
          'M100 %content_code%',
        ],
      },
      mapContent: {
        5001: 'Thử tài trang điểm bịt mắt',
        5002: 'Tập luyện cho phần cơ bụng',
        5003: 'Đắp mặt bằng bột trà xanh',
        10001: 'Đổi đồ makeup cho nhau',
        10002: 'Trải nghiệm mô tô nước',
        10003: 'Tập luyện cho vòng ba săn chắc',
        20001: 'Tiểu phẩm hài chuyện xóm giềng',
        20002: 'Ai cũng hiểu chỉ một người không hiểu',
        20003: 'Tìm chồng',
        20004: 'Dạy chồng',
        50001: 'Đường Về Nhà',
        50002: 'Bí Mật Hầm Mộ',
        50003: 'Vũ Điệu Chim Cánh Cụt',
        50004: 'Ngày Tận Thế',
        100001: 'Đừng Để Em Đi',
        100002: 'Đẳng Cấp Qúy Ông',
        100003: 'Cuộc Vui Bất Đắc Dĩ',
        100004: 'Những Kẻ Hai Mặt'
      }
    }
  }
};

const getPackageItem = (packageCode) => {
  const {PACKAGE} = a;

  let packageItem = {};
  let packageKey = null;
  for (let key in PACKAGE) {
    const syntaxs = PACKAGE[key].syntax.reg;

    syntaxs.map(syntax => {
      if (!packageKey && syntax.indexOf(packageCode.toUpperCase()) > -1) {
        packageItem = PACKAGE[key];
        packageKey = key;
      }
    });
  }
  return {packageKey, packageItem};
};

const b = getPackageItem('ON');
console.log(b);