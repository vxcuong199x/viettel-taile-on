module.exports = {
  SERVER_APP: {
    BASE_URL: 'http://api3-onplay.gviet.vn',
    API: {
      createUser: '/api/v2/server-api/createUser',
      checkUser: '/api/v2/server-api/checkUserExists',
      addPackage: '/api/v2/server-api/addPackage',
    },
    SECRET: 'VTVCabON@6789'
  },
  SERVER_PAYMENT: {
    PARTNER: 'viettelMuale',

    // BASE_URL: 'http://123.30.235.187:1005',
    // BASE_URL_TEST: 'http://123.30.235.187:1005',
    BASE_URL: 'http://api3-onplay.gviet.vn',
    API: {
      checkSynTaxUrl: '/payment-purchase/webhook/v1/create-payment',
      addPackageUrl: '/payment-purchase/webhook/v1/finish-payment'
    }
  },
  PAYGATE_SERVICE: {
    // BASE_URL_TEST: 'http://localhost:8008',
    BASE_URL: 'http://localhost:8008',
    // BASE_URL: 'http://api3-onplay.gviet.vn',

    API: {
      checkUser: '/paygate/sms/checkUser',
      addPackage: '/paygate/sms/addPackage',
    },
    SECRET: 'VTVCabON@6789',
    PARTNER_ID: 'viettelMuale',
    PHONES_TEST: ['0904229846']
  },
  VIETTEL: {
    PAY_PARTNER: 'telco',
    TELCOID: 'VIETTEL_TAI_LE',
    PAYTYPE: 1,
    TYPE: 2,

    BUY_FILM: {
      HOST: 'http://123.30.235.199:2094/vtvcab-on/mo',
      USER: "cuongvx",
      PASS: "mjhurtSZdoNHxyxs875NXH",
      PREFIX: "$",
      TELCO_MAP: {
        VINA: 1,
        VIETTEL: 2,
        MOBI: 3,
        VNM: 4
      }
    },

    //relation telco config
    SERVICE_CODE: '9262',
    MT_ACTIVE: {
      MT1_VIP: 'Quy khach da mua le goi <packageName> thang thanh cong (phi DV <amount>d).'
      + ' Quy khach duoc tang <data3G> Data khi truy cap ung dung VTVcab ON va'
      + ' xem <numCurrentScreen> thiet bi, dang nhap tren <numTotalDevice> thiet bi.'
      + ' Vui long tai ung dung VTVcab ON tren App Store hoac Google Play'
      + ' de xem truc tiep cac giai the thao trong nuoc va quoc te, phim dien anh, phim truyen hinh,'
      + ' cac chuong trinh giai tri doc quyen dac sac...'
      + ' Han su dung den <expireTime>.',

      MT1_MX: 'Quy khach da mua le noi dung <packageName> thanh cong (Phi DV <amount>d).'
      + ' Quy khach duoc tang <data3G> Data khi truy cap Internet trong ngay va'
      + ' xem ung dung VTVCab ON tren <numCurrentScreen> thiet bi, dang nhap tren <numTotalDevice> thiet bi.'
      + ' Vui long tai ung dung VTVcab ON tren App Store hoac Google Play'
      + ' de xem truc tiep cac giai the thao trong nuoc va quoc te, phim dien anh, phim truyen hinh,'
      + ' cac chuong trinh giai tri doc quyen dac sac...'
      + ' Han su dung den <expireTime>.',

      MT1_GD: 'Quy khach da mua le goi <packageName> thang thanh cong (Phi DV <amount>d).'
      + ' Goi truyen hinh danh cho gia dinh, Quy khach duoc tang <data3G> Data khi truy cap ung dung VTVcab ON va'
      + ' xem <numCurrentScreen> thiet bi dong thoi, dang nhap tren <numTotalDevice> thiet bi.'
      + ' Vui long tai ung dung VTVcab ON tren App Store hoac Google Play'
      + ' de xem truc tiep cac giai the thao trong nuoc va quoc te, phim dien anh, phim truyen hinh,'
      + ' cac chuong trinh giai tri doc quyen dac sac...'
      + ' Han su dung den <expireTime>.',

      MT1_DA: 'Quy khach da mua le goi <packageName> thang thanh cong (Phi DV <amount>d).'
      + ' Quy khach duoc tang <data3G> Data khi truy cap ung dung VTVcab ON va'
      + ' xem <numCurrentScreen> thiet bi dong thoi.'
      + ' Vui long tai ung dung VTVcab ON tren App Store hoac Google Play'
      + ' de xem kho phim dac sac, cap nhat lien tuc cac bo phim dien anh hot tu khap noi tren the gioi.'
      + ' Han su dung goi cuoc den <expireTime>.',

      MT2_HAS_PASS: ' Mat khau dang nhap la <password>. LH 198 (mien phi).',
      MT2_NOT_HAS_PASS: ' LH 198 (mien phi).',

      MT_ERROR_SYSTEM: 'Hien tai he thong dang ban. Quy khach vui long thu lai sau. Chi tiet LH 198 (mien phi).',
      MT_WRONG_SYNTAX: 'Tin nhan sai cu phap. Quy khach vui long kiem tra lai. Chi tiet LH 198 (mien phi).',

      //syntax info
      MT_KT: 'Quy Khach dang su dung goi cuoc <packageCode> <account> dich vu Truyen hinh ON.'
      + ' Han su dung den <expireTime>.'
      + ' Truy cap http://vtvcab.vn hoac ung dung VTVcab ON de su dung. De duoc tro giup, LH 198 (mien phi).'
      + ' Tran trong cam on.',

      MT_HD: 'Chao mung Quy Khach den voi dich vu Truyen hinh ON.'
      + ' De dang ky goi ON VIP soan'
      + ' ON <account> gui 9262 (66.000d/thang),'
      + ' ON3 <account> gui 9262 (198.000d/3 thang);'
      + ' Goi ON GD soan GD <account> gui 9262 (88.000d/thang),'
      + ' GD3 <account> gui 9262 (264.000d/3 thang);'
      + ' Goi ON DA soan DA <account> gui 9262 (50.000d/thang),'
      + ' DA3 <account> gui 9262 (150.000d/3 thang).'
      + ' Chi tiet lien he 1900585868 (2000d/phut). Tran trong cam on.',
    },

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
          5000: {
            5001: 'Thử tài trang điểm bịt mắt',
            5002: 'Tập luyện cho phần cơ bụng',
            5003: 'Đắp mặt bằng bột trà xanh',
            5004: 'Chuẩn bị món chay',
            5005: 'Hướng Dẫn Làm Sashimi Tại Nhà',
            5006: 'Phố Ẩm Thực Hà Nội',
            5007: 'Bánh Mì Nem Nướng',
            5008: 'Chân Giò Ngũ Vị',
            5009: 'Cá Rán Ớt Tươi',
          },
          10000: {
            10001: 'Đổi đồ makeup cho nhau',
            10002: 'Trải nghiệm mô tô nước',
            10003: 'Tập luyện cho vòng ba săn chắc',
            10004: 'Pizza Bún Đậu Mắm Tôm',
            10005: 'Bún Ốc Hà Nội',
            10006: 'Xúc Xích Nhà Làm',
            10007: 'Lòng Cuộn Ớt Xanh',
            10008: 'Đuôi Heo Nướng',
            10009: 'Mực Lụi Nướng Sả',
          },
          20000: {
            20001: 'Tiểu phẩm hài chuyện xóm giềng',
            20002: 'Ai cũng hiểu chỉ một người không hiểu',
            20003: 'Tìm chồng',
            20004: 'Dạy chồng',
            20005: 'Hướng Dẫn Làm Xoài Lắc Mắm  Cay',
            20006: 'Phở Cuốn Thập Cẩm',
            20007: 'Cơm Cá Chiên Giòn',
            20008: 'Nộm Bạch Tuộc Kim Chi',
            20009: 'Gà Ác Om Bia',
            20010: 'Chân Giò Chiên Mắm',
            20011: 'Cánh Gà Sốt Ớt',
            20012: 'Vịt Chiên Mắc Khén',
          },
          50000: {
            50001: 'Đường Về Nhà',
            50002: 'Bí Mật Hầm Mộ',
            50003: 'Vũ Điệu Chim Cánh Cụt',
            50004: 'Ngày Tận Thế',
            50005: 'Chuyện Hài Ở Đám Cưới',
            50006: 'Những Kẻ Khờ Khạo',
            50007: 'Đám Trẻ Con',
            50008: 'Tuổi Trẻ Nổi Loạn',
            50009: 'Bánh Dày Quán Gánh',
            50010: 'Tranh Sơn Mài',
            50011: 'Chợ Hoa Đêm Hà Nội',
            50012: 'Tuổi Trẻ Nổi Loạn',
            50013: 'Steak Bò Sốt Rượu Vang',
            50014: 'Tôm Hấp Xôi',
            50015: 'Burger Bò Chuẩn Vị',
            50016: 'Cá Diêu Hồng Hấp Nấm',
          },
          100000: {
            100001: 'Đừng Để Em Đi',
            100002: 'Đẳng Cấp Qúy Ông',
            100003: 'Cuộc Vui Bất Đắc Dĩ',
            100004: 'Những Kẻ Hai Mặt',
            100005: 'Siêu Trộm Thế Kỷ',
            100006: 'Những Kẻ Đi Săn',
            100007: 'Lùng Ma Diệt Quỷ',
            100008: 'Gia Đình Thân Yêu',
            100009: 'Chùm Phim Ma Cà Rồng',
            100010: 'Series Phim: Theo Dấu Sát Nhân',
            100011: 'Xác Ướp Cổ Đại',
            100012: 'Lời Nguyền Chết Chóc',
            100013: 'Series Phim Tốc Độ',
            100014: 'Loạt Phim Xác Sống',
            100015: 'Loạt Phim Những Kẻ Đi Săn',
            100016: 'Hành Trình Cô Độc',
          }
        }
      }
    }
  },
};

