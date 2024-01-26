import type {CliCommandDefinition, CliCommandGroupDefinition} from '@sanity/cli'
import backupGroup from './backup/backupGroup'
import disableBackupCommand from './backup/disableBackupCommand'
import downloadBackupCommand from './backup/downloadBackupCommand'
import enableBackupCommand from './backup/enableBackupCommand'
import listBackupCommand from './backup/listBackupCommand'
import buildCommand from './build/buildCommand'
import checkCommand from './check/checkCommand'
import configCheckCommand from './config/configCheckCommand'
import addCorsOriginCommand from './cors/addCorsOriginCommand'
import corsGroup from './cors/corsGroup'
import deleteCorsOriginCommand from './cors/deleteCorsOriginCommand'
import listCorsOriginsCommand from './cors/listCorsOriginsCommand'
import aliasDatasetCommand from './dataset/alias/aliasCommands'
import copyDatasetCommand from './dataset/copyDatasetCommand'
import createDatasetCommand from './dataset/createDatasetCommand'
import datasetGroup from './dataset/datasetGroup'
import datasetVisibilityCommand from './dataset/datasetVisibilityCommand'
import deleteDatasetCommand from './dataset/deleteDatasetCommand'
import exportDatasetCommand from './dataset/exportDatasetCommand'
import importDatasetCommand from './dataset/importDatasetCommand'
import listDatasetsCommand from './dataset/listDatasetsCommand'
import deployCommand from './deploy/deployCommand'
import undeployCommand from './deploy/undeployCommand'
import devCommand from './dev/devCommand'
import createDocumentsCommand from './documents/createDocumentsCommand'
import deleteDocumentsCommand from './documents/deleteDocumentsCommand'
import documentsGroup from './documents/documentsGroup'
import getDocumentsCommand from './documents/getDocumentsCommand'
import queryDocumentsCommand from './documents/queryDocumentsCommand'
import validateDocumentsCommand from './documents/validateDocumentsCommand'
import startCommand from './start/startCommand'
import validateSchemaCommand from './schema/validateSchemaCommand'
import previewCommand from './preview/previewCommand'
import uninstallCommand from './uninstall/uninstallCommand'
import hookGroup from './hook/hookGroup'
import createHookCommand from './hook/createHookCommand'
import deleteHookCommand from './hook/deleteHookCommand'
import listHooksCommand from './hook/listHooksCommand'
import printHookAttemptCommand from './hook/printHookAttemptCommand'
import listHookLogsCommand from './hook/listHookLogsCommand'
import execCommand from './exec/execCommand'
import deleteGraphQLAPICommand from './graphql/deleteGraphQLAPICommand'
import deployGraphQLAPICommand from './graphql/deployGraphQLAPICommand'
import graphqlGroup from './graphql/graphqlGroup'
import listGraphQLAPIsCommand from './graphql/listGraphQLAPIsCommand'
import inviteUserCommand from './users/inviteUserCommand'
import listUsersCommand from './users/listUsersCommand'
import migrationGroup from './migration/migrationGroup'
import createMigrationCommand from './migration/createMigrationCommand'
import runMigrationCommand from './migration/runMigrationCommand'
import listMigrationsCommand from './migration/listMigrationsCommand'
import schemaGroup from './schema/schemaGroup'
import usersGroup from './users/usersGroup'

const commands: (CliCommandDefinition | CliCommandGroupDefinition)[] = [
  buildCommand,
  checkCommand,
  configCheckCommand,
  datasetGroup,
  deployCommand,
  undeployCommand,
  listDatasetsCommand,
  createDatasetCommand,
  datasetVisibilityCommand,
  exportDatasetCommand,
  importDatasetCommand,
  deleteDatasetCommand,
  copyDatasetCommand,
  aliasDatasetCommand,
  backupGroup,
  listBackupCommand,
  downloadBackupCommand,
  disableBackupCommand,
  enableBackupCommand,
  corsGroup,
  listCorsOriginsCommand,
  addCorsOriginCommand,
  deleteCorsOriginCommand,
  usersGroup,
  inviteUserCommand,
  listUsersCommand,
  hookGroup,
  listHooksCommand,
  createHookCommand,
  migrationGroup,
  createMigrationCommand,
  runMigrationCommand,
  listMigrationsCommand,
  deleteHookCommand,
  listHookLogsCommand,
  printHookAttemptCommand,
  documentsGroup,
  getDocumentsCommand,
  queryDocumentsCommand,
  deleteDocumentsCommand,
  createDocumentsCommand,
  validateDocumentsCommand,
  graphqlGroup,
  listGraphQLAPIsCommand,
  deployGraphQLAPICommand,
  deleteGraphQLAPICommand,
  devCommand,
  startCommand,
  schemaGroup,
  validateSchemaCommand,
  previewCommand,
  uninstallCommand,
  execCommand,
]

/**
 * @deprecated Not actually deprecated, but these are internals and should not be relied upon outside of the Sanity team
 * @internal
 */
export const cliProjectCommands = {
  requiredCliVersionRange: '^3.0.0',
  commands,
}
