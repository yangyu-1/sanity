import {type SanityClient} from '@sanity/client'
import {type InitialValueResolverContext, type Schema} from '@sanity/types'
import {type Observable} from 'rxjs'
import {filter, map} from 'rxjs/operators'

import {type SourceClientOptions} from '../../../config'
import {type LocaleSource} from '../../../i18n'
import {type DocumentPreviewStore} from '../../../preview'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {type Template} from '../../../templates'
import {getIdPair, isDraftId} from '../../../util'
import {type ValidationStatus} from '../../../validation'
import {type HistoryStore} from '../history'
import {checkoutPair, type DocumentVersionEvent, type Pair} from './document-pair/checkoutPair'
import {consistencyStatus} from './document-pair/consistencyStatus'
import {documentEvents} from './document-pair/documentEvents'
import {editOperations} from './document-pair/editOperations'
import {editState, type EditStateFor} from './document-pair/editState'
import {
  type OperationError,
  operationEvents,
  type OperationSuccess,
} from './document-pair/operationEvents'
import {type OperationsAPI} from './document-pair/operations'
import {validation} from './document-pair/validation'
import {getVisitedDocuments} from './getVisitedDocuments'
import {getInitialValueStream, type InitialValueMsg, type InitialValueOptions} from './initialValue'
import {listenQuery, type ListenQueryOptions} from './listenQuery'
import {resolveTypeForDocument} from './resolveTypeForDocument'
import {type IdPair} from './types'

/**
 * @hidden
 * @beta */
export type QueryParams = Record<string, string | number | boolean | string[]>

function getIdPairFromPublished(publishedId: string, version?: string): IdPair {
  if (isDraftId(publishedId)) {
    throw new Error('editOpsOf does not expect a draft id.')
  }

  return getIdPair(publishedId, {version})
}

/**
 * @hidden
 * @beta */
export interface DocumentStore {
  /** @internal */
  checkoutPair: (idPair: IdPair) => Pair
  initialValue: (
    opts: InitialValueOptions,
    context: InitialValueResolverContext,
  ) => Observable<InitialValueMsg>
  listenQuery: (
    query: string | {fetch: string; listen: string},
    params: QueryParams,
    options: ListenQueryOptions,
  ) => Observable<any>
  resolveTypeForDocument: (id: string, specifiedType?: string) => Observable<string>

  pair: {
    consistencyStatus: (publishedId: string, type: string, version?: string) => Observable<boolean>
    /** @internal */
    documentEvents: (
      publishedId: string,
      type: string,
      version?: string,
    ) => Observable<DocumentVersionEvent>
    /** @internal */
    editOperations: (
      publishedId: string,
      type: string,
      version?: string,
    ) => Observable<OperationsAPI>
    editState: (publishedId: string, type: string, version?: string) => Observable<EditStateFor>
    operationEvents: (
      publishedId: string,
      type: string,
    ) => Observable<OperationSuccess | OperationError>
    validation: (
      publishedId: string,
      type: string,
      version?: string,
    ) => Observable<ValidationStatus>
  }
}

/** @internal */
export interface DocumentStoreOptions {
  getClient: (options: SourceClientOptions) => SanityClient
  documentPreviewStore: DocumentPreviewStore
  historyStore: HistoryStore
  schema: Schema
  initialValueTemplates: Template[]
  i18n: LocaleSource
  serverActionsEnabled: Observable<boolean>
}

/** @internal */
export function createDocumentStore({
  getClient,
  documentPreviewStore,
  historyStore,
  initialValueTemplates,
  schema,
  i18n,
  serverActionsEnabled,
}: DocumentStoreOptions): DocumentStore {
  const observeDocumentPairAvailability =
    documentPreviewStore.unstable_observeDocumentPairAvailability

  const visitedDocuments = getVisitedDocuments({
    observeDocuments: documentPreviewStore.unstable_observeDocuments,
  })

  // Note that we're both passing a shared `client` here which is used by the
  // internal operations, and a `getClient` method that we expose to user-land
  // for things like validations
  const client = getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const ctx = {
    client,
    getClient,
    observeDocumentPairAvailability,
    historyStore,
    schema,
    i18n,
    serverActionsEnabled,
  }

  return {
    // Public API
    checkoutPair(idPair) {
      return checkoutPair(client, idPair, serverActionsEnabled)
    },
    initialValue(opts, context) {
      return getInitialValueStream(
        schema,
        initialValueTemplates,
        documentPreviewStore,
        opts,
        context,
      )
    },
    listenQuery(query, params, options) {
      return listenQuery(client, query, params, options)
    },
    resolveTypeForDocument(id, specifiedType) {
      return resolveTypeForDocument(client, id, specifiedType)
    },
    pair: {
      consistencyStatus(publishedId, type, version) {
        return consistencyStatus(
          ctx.client,
          getIdPairFromPublished(publishedId, version),
          type,
          serverActionsEnabled,
        )
      },
      documentEvents(publishedId, type, version) {
        return documentEvents(
          ctx.client,
          getIdPairFromPublished(publishedId, version),
          type,
          serverActionsEnabled,
        )
      },
      editOperations(publishedId, type, version) {
        return editOperations(ctx, getIdPairFromPublished(publishedId, version), type)
      },
      editState(publishedId, type, version) {
        const edit = editState(
          ctx,
          getIdPairFromPublished(publishedId, version),
          type,
          visitedDocuments.observed$,
        )
        visitedDocuments.add(publishedId)
        return edit
      },
      operationEvents(publishedId, type) {
        return operationEvents({
          client,
          historyStore,
          schema,
          serverActionsEnabled,
        }).pipe(
          filter(
            (result) =>
              result.args.idPair.publishedId === publishedId && result.args.typeName === type,
          ),
          map((result): OperationSuccess | OperationError => {
            const {operationName, idPair: documentIds} = result.args
            return result.type === 'success'
              ? {type: 'success', op: operationName, id: documentIds.publishedId}
              : {type: 'error', op: operationName, id: documentIds.publishedId, error: result.error}
          }),
        )
      },
      validation(publishedId, type, version) {
        return validation(ctx, getIdPairFromPublished(publishedId, version), type)
      },
    },
  }
}
