/* eslint-disable max-statements */
import {Readable} from 'stream'
import {createWriteStream, existsSync, mkdirSync, PathLike} from 'fs'
import {tmpdir} from 'os'
import path from 'path'
import zlib from 'zlib'
import {randomKey} from '@sanity/block-tools'
import type {
  CliCommandArguments,
  CliCommandContext,
  CliCommandDefinition,
  CliOutputter,
  SanityClient,
} from '@sanity/cli'
import {QueryParams} from '@sanity/client'
import {absolutify} from '@sanity/util/fs'
import type chalk from 'chalk'
import {isBoolean, isNumber, isString} from 'lodash'
import prettyMs from 'pretty-ms'
import rimraf from 'rimraf'
import chooseBackupIdPrompt from '../../actions/backup/chooseBackupIdPrompt'
import resolveApiClient from '../../actions/backup/resolveApiClient'
import {defaultApiVersion} from './backupGroup'
import debug from './debug'

const archiver = require('archiver')
const {getIt} = require('get-it')
const {keepAlive, promise} = require('get-it/middleware')

const CONNECTION_TIMEOUT = 15 * 1000 // 15 seconds
const READ_TIMEOUT = 3 * 60 * 1000 // 3 minutes
const MAX_RETRIES = 5
const DEFAULT_DOWNLOAD_CONCURRENCY = 10
const MAX_CONCURRENCY = 24

const request = getIt([keepAlive(), promise({onlyBody: true})])
const socketsWithTimeout = new WeakSet()
const exponentialBackoff = (retryCount: number) => Math.pow(2, retryCount) * 200

type DownloadBackupOptions = {
  projectId: string
  datasetName: string
  token: string
  backupId: string
  outDir: string
  outFileName: string
  overwrite: boolean
  concurrency: number
}

type GetBackupResponse = {
  createdAt: string
  totalFiles: number
  files: file[]
  nextCursor?: string
}

type file = {
  name: string
  url: string
  type: string
}

interface ProgressEvent {
  step: string
  update?: boolean
  current?: number
  total?: number
}

const helpText = `
Options
  --backup-id <string> The backup ID to download. (required)
  --out <string>       The file or directory path the backup should download to.
  --overwrite          Allows overwriting of existing backup file.
  --concurrency <num>  Concurrent number of backup item downloads. (max: 24)

Examples
  sanity backup download DATASET_NAME --backup-id 2020-01-01-backup-1
  sanity backup download DATASET_NAME --backup-id 2020-01-01-backup-2 --out /path/to/file
  sanity backup download DATASET_NAME --backup-id 2020-01-01-backup-3 --out /path/to/file --overwrite
`

const downloadBackupCommand: CliCommandDefinition = {
  name: 'download',
  group: 'backup',
  signature: '[DATASET_NAME]',
  description: 'Download a dataset backup to a local file.',
  helpText,
  action: async (args, context) => {
    const {output, chalk} = context
    const [client, opts] = await prepareBackupOptions(context, args)
    const {projectId, datasetName, backupId, outDir, outFileName} = opts

    if (outDir === '' || outFileName === '') {
      output.print('Operation cancelled.')
      return
    }
    const outFilePath = path.join(outDir, outFileName)

    output.print('╭───────────────────────────────────────────────────────────╮')
    output.print('│                                                           │')
    output.print('│ Downloading backup for:                                   │')
    output.print(`│ ${chalk.bold('projectId')}: ${chalk.cyan(projectId).padEnd(56)} │`)
    output.print(`│ ${chalk.bold('dataset')}: ${chalk.cyan(datasetName).padEnd(58)} │`)
    output.print(`│ ${chalk.bold('backupId')}: ${chalk.cyan(backupId).padEnd(56)} │`)
    output.print('│                                                           │')
    output.print('╰───────────────────────────────────────────────────────────╯')
    output.print('')

    output.print(`Downloading backup to "${chalk.cyan(outFilePath)}"`)

    const start = Date.now()
    let currentStep = 'Downloading documents and assets...'
    let spinner = output.spinner(currentStep).start()
    const onProgress = (progress: ProgressEvent) => {
      if (progress.step !== currentStep) {
        spinner.succeed()
        spinner = output.spinner(progress.step).start()
      } else if (progress.step === currentStep && progress.update) {
        if (progress.current && progress.current > 0 && progress.total && progress.total > 0) {
          spinner.text = `${progress.step} (${progress.current}/${progress.total})`
        } else {
          spinner.text = `${progress.step}`
        }
      }

      currentStep = progress.step
    }

    // Create temporary directory to store files before bundling them into the archive at outputPath.
    // We are adding unix milliseconds and a random key to try to back up in a unique location on each attempt.
    // Temporary directories are normally deleted at the end of backup process, any unexpected exit may leave them
    // behind, hence it is important to create a unique directory for each attempt.
    // We intentionally avoid `datasetName` and `backupId`in path since some operating system have a max length
    // of 256 chars on path names and both of them can be quite long in some cases.
    const tmpOutDir = path.join(tmpdir(), `backup-${Date.now()}-${randomKey(5)}`)

    // Create temporary directories if they don't exist.
    for (const dir of [tmpOutDir, path.join(tmpOutDir, 'images'), path.join(tmpOutDir, 'files')]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true})
      }
    }

    debug('Writing to temporary directory %s', tmpOutDir)
    try {
      const backupFileStream = new PaginatedGetBackupStream(client, opts)
      let totalItemsDownloaded = 0

      for await (const file of backupFileStream) {
        await downloadFile(file, tmpOutDir)

        totalItemsDownloaded += 1
        onProgress({
          step: `Downloading documents and assets...`,
          update: true,
          current: totalItemsDownloaded,
          total: backupFileStream.totalFiles,
        })
      }
    } catch (error) {
      spinner.fail()
      let msg = error.statusCode ? error.response.body.message : error.message
      // If no message can be extracted, print the whole error.
      if (msg === undefined) {
        msg = String(error)
      }
      throw new Error(`Downloading dataset backup failed: ${msg}`)
    }

    onProgress({
      step: `Archiving files into a tarball...`,
      update: true,
    })

    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: {level: zlib.constants.Z_DEFAULT_COMPRESSION},
    })

    archive.on('error', (err: Error) => {
      debug('Archiving errored!\n%s', err.stack)
      cleanupTmpDir(output, chalk, tmpOutDir)
      throw err
    })

    // Catch warnings for non-blocking errors (stat failures and others)
    archive.on('warning', (err: Error) => {
      debug('Archive warning: %s', err.message)
    })

    const archiveDestination = createWriteStream(outFilePath as PathLike)
    archiveDestination.on('error', (err: Error) => {
      throw err
    })

    archiveDestination.on('close', () => {
      debug(`Written ${archive.pointer()} total bytes to archive`)
      cleanupTmpDir(output, chalk, tmpOutDir)
    })

    // Pipe archive data to the file
    archive.pipe(archiveDestination)
    archive.directory(tmpOutDir, false)
    archive.finalize()

    onProgress({
      step: `Backup download complete (${prettyMs(Date.now() - start)}).`,
      update: true,
    })
    spinner.succeed()
  },
}

class PaginatedGetBackupStream extends Readable {
  private cursor = ''
  private readonly client: SanityClient
  private readonly opts: DownloadBackupOptions
  public totalFiles = 0

  constructor(client: SanityClient, opts: DownloadBackupOptions) {
    super({objectMode: true})
    this.client = client
    this.opts = opts
  }

  async _read() {
    try {
      const data = await fetchNextBackupPage(this.client, this.opts, this.cursor)

      // Set totalFiles when it's fetched for the first time
      if (this.totalFiles === 0) {
        this.totalFiles = data.totalFiles
      }

      data.files.forEach((file) => this.push(file))

      if (typeof data.nextCursor === 'string' && data.nextCursor !== '') {
        this.cursor = data.nextCursor
      } else {
        // No more pages left to fetch.
        this.push(null)
      }
    } catch (err) {
      this.destroy(err as Error)
    }
  }
}

// fetchNextBackupPage fetches the next page of backed up files from the backup API.
async function fetchNextBackupPage(
  client: SanityClient,
  opts: DownloadBackupOptions,
  cursor: string,
): Promise<GetBackupResponse> {
  const query: QueryParams = cursor === '' ? {} : {nextCursor: cursor}

  let response: GetBackupResponse
  try {
    response = await client.request({
      headers: {Authorization: `Bearer ${opts.token}`},
      uri: `/projects/${opts.projectId}/datasets/${opts.datasetName}/backups/${opts.backupId}`,
      query,
    })

    if (!response || !response.files || response.files.length === 0) {
      throw new Error('No files to download')
    }

    return response
  } catch (error) {
    // It can be clearer to pull this logic out in a  common error handling function for re-usability.
    let msg = error.statusCode ? error.response.body.message : error.message

    // If no message can be extracted, print the whole error.
    if (msg === undefined) {
      msg = String(error)
    }
    throw new Error(`Downloading dataset backup failed: ${msg}`)
  }
}

async function downloadFile(file: file, tmpOutDir: string) {
  // File names that contain a path to file (sanity-storage/assets/file-name) fail when archive is created, so we
  // want to handle them by taking the base name as file name.
  file.name = path.basename(file.name)

  const assetFilePath = getAssetFilePath(file, tmpOutDir)
  let error
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    try {
      const response = await request({
        url: file.url,
        maxRedirects: 5,
        timeout: {connect: CONNECTION_TIMEOUT, socket: READ_TIMEOUT},
        stream: assetFilePath !== '', // Only stream the response if it's an asset file.
      })

      if (
        response.connection &&
        typeof response.connection.setTimeout === 'function' &&
        !socketsWithTimeout.has(response.connection)
      ) {
        socketsWithTimeout.add(response.connection)
        response.connection.setTimeout(READ_TIMEOUT, () => {
          response.destroy(
            new Error(`Read timeout: No data received on socket for ${READ_TIMEOUT} ms`),
          )
        })
      }

      if (assetFilePath === '') {
        const tmpOutDocumentsFile = path.join(tmpOutDir, 'data.ndjson')
        const outputStream = createWriteStream(tmpOutDocumentsFile, {flags: 'a'})
        outputStream.write(`${response}\n`)
      } else {
        response.pipe(createWriteStream(assetFilePath))
      }

      return true
    } catch (err) {
      error = err
      if (err.response && err.response.statusCode && err.response.statusCode < 500) {
        break
      }

      const retryDelay = exponentialBackoff(retryCount)
      debug(`Error, retrying after ${retryDelay}ms: %s`, err.message)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }
  throw error
}

// prepareBackupOptions validates backup options from CLI and prepares Client and DownloadBackupOptions.
async function prepareBackupOptions(
  context: CliCommandContext,
  args: CliCommandArguments,
): Promise<[SanityClient, DownloadBackupOptions]> {
  const flags = args.extOptions
  const [dataset] = args.argsWithoutOptions
  const {prompt, workDir} = context
  const {projectId, datasetName, client} = await resolveApiClient(
    context,
    dataset,
    defaultApiVersion,
  )

  const {token} = client.config()
  if (!isString(token) || token.length < 1) {
    throw new Error(`token is missing`)
  }

  const backupId = String(flags['backup-id'] || (await chooseBackupIdPrompt(context, datasetName)))
  if (backupId.length < 1) {
    throw new Error(`backup-id ${flags['backup-id']} should be a valid string`)
  }

  if (!isString(datasetName) || datasetName.length < 1) {
    throw new Error(`dataset ${datasetName} must be a valid dataset name`)
  }

  if ('concurrency' in flags) {
    if (
      !isNumber(flags.concurrency) ||
      Number(flags.concurrency) < 1 ||
      Number(flags.concurrency) > MAX_CONCURRENCY
    ) {
      throw new Error(`concurrency should be in 1 to ${MAX_CONCURRENCY} range`)
    }
  }

  if ('overwrite' in flags && !isBoolean(flags.overwrite)) {
    throw new Error(`overwrite should be valid boolean`)
  }

  const defaultOutFileName = `${datasetName}-backup-${backupId}.tar.gz`
  let out = await (async (): Promise<string> => {
    if ('out' in flags) {
      if (!isString(flags.out)) {
        throw new Error(`output path should be valid string`)
      }
      // Rewrite the output path to an absolute path, if it is not already.
      return absolutify(flags.out)
    }

    const input = await prompt.single({
      type: 'input',
      message: 'Output path:',
      default: path.join(workDir, defaultOutFileName),
      filter: absolutify,
    })
    return input
  })()

  // If path is a directory name, then add a default file name to the path.
  if (isPathDirName(out)) {
    out = path.join(out, defaultOutFileName)
  }

  // If the file already exists, ask for confirmation if it should be overwritten.
  if (!flags.overwrite && existsSync(out)) {
    const shouldOverwrite = await prompt.single({
      type: 'confirm',
      message: `File "${out}" already exists, would you like to overwrite it?`,
      default: false,
    })

    // If the user does not want to overwrite the file, set the output path to an empty string.
    // This should be handled by the caller of this function as cancel operation.
    if (!shouldOverwrite) {
      out = ''
    }
  }

  return [
    client,
    {
      projectId,
      datasetName,
      backupId,
      token,
      outDir: path.dirname(out),
      outFileName: path.basename(out),
      overwrite: Boolean(flags.overwrite),
      concurrency: Number(flags.concurrency) || DEFAULT_DOWNLOAD_CONCURRENCY,
    },
  ]
}

function cleanupTmpDir(output: CliOutputter, chalk: chalk.Chalk, tmpDir: string) {
  output.print(`Cleaning up temporary files at ${chalk.cyan(`${tmpDir}`)}`)
  rimraf(tmpDir, (err) => {
    if (err) {
      debug(`Error cleaning up temporary files: ${err.message}`)
    }
  })
}

function getAssetFilePath(file: file, tmpOutDir: string): string {
  // Set assetFilePath if we are downloading an asset file.
  // If it's a JSON document, assetFilePath will be an empty string.
  let assetFilePath = ''
  if (file.type === 'image') {
    assetFilePath = path.join(tmpOutDir, 'images', file.name)
  } else if (file.type === 'file') {
    assetFilePath = path.join(tmpOutDir, 'files', file.name)
  }

  return assetFilePath
}

function isPathDirName(filepath: string): boolean {
  // Check if the path has an extension, commonly indicating a file
  return !/\.\w+$/.test(filepath)
}

export default downloadBackupCommand
