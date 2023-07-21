'use strict'
const moment = require('moment')
const axios = require('axios')
const Promise = require('bluebird')
const _ = require('lodash')

const {
        SERVER_PAYMENT: {
          PARTNER,
          BASE_URL,
          API: {
            checkSynTaxUrl,
            addPackageUrl
          },
          TIMEOUT,
          HEADERS
        }
      } = require('../config/telcoConfig')

const { headers, timeout } = {
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  },
  timeout: 15000
}

const callApi = {}

callApi.checkCondition = ({ params, again = 0 }) => {
  const KEYLOG = `-------${params.username || ''}; again=${again}; `

  const dataApi = {
    transId: params.transId,
    partner: PARTNER,
    phone: params.username,
    uid: params.uid || '',
    // content: 'ON 0855104287',
    content: params.telcoSyntax || ''
  }
  const opts = {
    url: BASE_URL + checkSynTaxUrl,
    method: 'POST',
    data: dataApi,
    timeout,
    headers
  }

  return axios(opts)
    .then(({ data }) => {
      console.log('RESPONSE_CHECK_SYNTAX', KEYLOG, JSON.stringify(opts), JSON.stringify(data))
      return Promise.resolve({
        url: opts.url,
        dataApi: opts.data,
        resApi: { enable: Number(_.get(data, 'status')) === 0 ? 1 : 0 },
        resApiOrigin: data
      })
    })
    .catch(err => {
      const { error, isTimeout } = getError(err)
      console.log('ERROR_CHECK_SYNTAX', KEYLOG, JSON.stringify(opts), JSON.stringify(error))
      console.error('ERROR_CHECK_SYNTAX', KEYLOG, JSON.stringify(opts), JSON.stringify(error))

      if (isTimeout) {
        if (again <= 3) {
          again++

          return Promise.delay(5000)
            .then(rs => callApi.checkCondition({ params, again }))
        } else {
          return Promise.resolve({
            url: opts.url,
            dataApi: opts.data,
            errorApi: error,
            again
          })
        }
      } else {
        return Promise.resolve({
          url: opts.url,
          dataApi: opts.data,
          errorApi: error,
          again
        })
      }
    })
}
callApi.addPackage = ({ params, again = 0 }) => {
  const KEYLOG = `-------${params.username || ''}; again=${again}; `
  console.log('---- params addPackage ---', params)

  const dataApi = {
    transId: params.orderId || params.transId,
    partnerTransId: params.partnerTransId,
    amount: Number(params.amount || 0)
  }

  const opts = {
    url: BASE_URL + addPackageUrl,
    method: 'POST',
    data: dataApi,
    timeout,
    headers
  }

  return axios(opts)
    .then(({ data }) => {
      console.log('RESPONSE_ADD_PACKAGE', KEYLOG, JSON.stringify(opts), JSON.stringify(data))
      return Promise.resolve({
        url: opts.url,
        dataApi: opts.data,
        resApiOrigin: data,
        resApi: { orderId: Number(_.get(data, 'status')) === 0 ? dataApi.transId : null }
      })
    })
    .catch(err => {
      const { error, isTimeout } = getError(err)
      console.log('ERROR_ADD_PACKAGE', KEYLOG, JSON.stringify(opts), JSON.stringify(error))
      console.error('ERROR_ADD_PACKAGE', KEYLOG, JSON.stringify(opts), JSON.stringify(error))

      const isRetry = Number(_.get(error, 'status')) !== 3004 // 3004: retry
      if (isTimeout || isRetry) {
        if (again <= 3) {
          again++

          return Promise.delay(1000)
            .then(rs => callApi.addPackage({ params, again }))
        } else {
          return Promise.resolve({
            url: opts.url,
            dataApi: opts.dataApi,
            errorApi: error,
            again
          })
        }
      } else {
        return Promise.resolve({
          url: opts.url,
          dataApi: opts.dataApi,
          errorApi: error,
          again
        })
      }
    })
}
const getError = (err) => {
  return {
    error: _.get(err, 'response.data') || err.stack || err,
    isTimeout: (err.code === 'ECONNABORTED') ||
    _.get(err, 'response.status') === 408
  }
}

module.exports = callApi
