import type {MiddlewareResponse} from 'get-it/src/types'
import debug from './debug'
import withRetry from './withRetry'

const {getIt} = require('get-it')
const {keepAlive, promise} = require('get-it/middleware')

const CONNECTION_TIMEOUT = 15 * 1000 // 15 seconds
const READ_TIMEOUT = 3 * 60 * 1000 // 3 minutes

const request = getIt([keepAlive(), promise()])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function downloadDocument(url: string): Promise<any> {
  const response = await withRetry<MiddlewareResponse>(() =>
    request({
      url,
      maxRedirects: 5,
      timeout: {connect: CONNECTION_TIMEOUT, socket: READ_TIMEOUT},
    }),
  )

  debug('Received document from %s with status code %d', url, response?.statusCode)

  return response.body
}

export default downloadDocument
