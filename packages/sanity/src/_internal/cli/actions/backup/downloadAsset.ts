import path from 'path'
import {createWriteStream} from 'fs'
import withRetry from './withRetry'
import debug from './debug'

const {getIt} = require('get-it')
const {keepAlive, promise} = require('get-it/middleware')

const CONNECTION_TIMEOUT = 15 * 1000 // 15 seconds
const READ_TIMEOUT = 3 * 60 * 1000 // 3 minutes

const request = getIt([keepAlive(), promise()])

async function downloadAsset(
  url: string,
  fileName: string,
  fileType: string,
  outDir: string,
): Promise<void> {
  // File names that contain a path to file (sanity-storage/assets/file-name) fail when archive is created, so we
  // want to handle them by taking the base name as file name.
  const normalizedFileName = path.basename(fileName)

  const assetFilePath = getAssetFilePath(normalizedFileName, fileType, outDir)
  await withRetry(async () => {
    const response = await request({
      url: url,
      maxRedirects: 5,
      timeout: {connect: CONNECTION_TIMEOUT, socket: READ_TIMEOUT},
      stream: true,
    })

    debug('Received asset %s with status code %d', normalizedFileName, response?.statusCode)

    response.body.pipe(createWriteStream(assetFilePath))
  })
}

function getAssetFilePath(fileName: string, fileType: string, outDir: string): string {
  // Set assetFilePath if we are downloading an asset file.
  // If it's a JSON document, assetFilePath will be an empty string.
  let assetFilePath = ''
  if (fileType === 'image') {
    assetFilePath = path.join(outDir, 'images', fileName)
  } else if (fileType === 'file') {
    assetFilePath = path.join(outDir, 'files', fileName)
  }

  return assetFilePath
}

export default downloadAsset
