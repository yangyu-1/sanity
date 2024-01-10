import type {CliCommandDefinition} from '@sanity/cli'
import {promptForDatasetName} from '../../../actions/dataset/datasetNamePrompt'

const listHelpText = `
Options
  -- limit <int> Maximum number of backups returned. Default 30. Cannot exceed 100.
  -- start <timestamp> Only return backups after this timestamp (inclusive)
  -- end <timestamp> Only return backups before this timestamp (exclusive)

Example
  sanity dataset backup list <name>
  sanity dataset backup list --limit 50 <name>
  sanity dataset backup list --start 2020-01-01T09:00:00 --limit 10 <name>
`

const defaultLimit = 30
const maxLimit = 100

interface queryParams {
  limit: number
  start?: string
  end?: string
}

const listDatasetBackupsCommand: CliCommandDefinition = {
  name: 'backup list',
  group: 'dataset',
  signature: '[datasetName]',
  helpText: listHelpText,
  description: 'List dataset backups for this dataset',
  action: async (args: any, context: any) => {
    const {apiClient, output, prompt, chalk} = context
    const flags = args.extOptions
    const [dataset] = args.argsWithoutOptions
    let client = apiClient()

    const datasetName = await (dataset || promptForDatasetName(prompt))
    client = client.clone().config({dataset: datasetName})

    const query: queryParams = {limit: defaultLimit}
    if (flags.limit) {
      query.limit = parseLimit(flags.limit)
    }

    if (flags.start) {
      query.start = parseTimestamp(flags.start)
    }

    if (flags.end) {
      query.end = parseTimestamp(flags.end)
    }

    let response
    try {
      response = await client.request({
        uri: `/datasets/${datasetName}/backups`,
        query,
      })
    } catch {
      // TODO: Handle error.
    }
    // TODO: Do something with response.
  },
}

function parseLimit(input: any): number {
  if (isNaN(input)) throw new Error('Limit must be an integer')

  const limit = parseInt(input, 10)
  if (limit < 1 || limit > maxLimit) {
    throw new Error('Limit must be an integer between 1 and 100')
  }
  return limit
}

// TODO: Finish func.
function parseTimestamp(timestamp: any): string {
  return ''
}

export default listDatasetBackupsCommand
