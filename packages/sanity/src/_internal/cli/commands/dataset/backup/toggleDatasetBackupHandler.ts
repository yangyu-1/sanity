import {CliCommandArguments, CliCommandContext} from '@sanity/cli'
import {promptForDatasetName} from '../../../actions/dataset/datasetNamePrompt'

async function toggleDatasetBackupHandler(
  args: CliCommandArguments,
  context: CliCommandContext,
  enableBackups: boolean,
): Promise<void> {
  const {apiClient, output, prompt, chalk} = context
  const [dataset] = args.argsWithoutOptions
  let client = apiClient()

  const datasetName = await (dataset || promptForDatasetName(prompt))
  client = client.clone().config({dataset: datasetName})
  try {
    await client.request({
      method: 'PUT',
      uri: `/datasets/${datasetName}/settings/backups`,
      body: {
        enable: enableBackups,
      },
    })
    const action = enableBackups ? 'enabled' : 'disabled'
    output.print(`${chalk.green(`Dataset backup ${action}\n`)}`)
  } catch (error) {
    const action = enableBackups ? 'Enabling' : 'Disabling'
    const msg = error.statusCode ? error.response.body.message : error.message
    output.print(`${chalk.red(`${action} dataset backup failed::\n${msg}`)}\n`)
  }
}

export default toggleDatasetBackupHandler
