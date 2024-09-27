import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {combineLatest, defer, type Observable, of} from 'rxjs'
import {map, publishReplay, refCount, startWith, switchMap, tap} from 'rxjs/operators'

import {type DocumentsStorage} from '../documentsStorage'
import {type IdPair, type PendingMutationsEvent} from '../types'
import {memoize} from '../utils/createMemoizer'
import {memoizeKeyGen} from './memoizeKeyGen'
import {snapshotPair} from './snapshotPair'
import {isLiveEditEnabled} from './utils/isLiveEditEnabled'

interface TransactionSyncLockState {
  enabled: boolean
}

/**
 * @hidden
 * @beta */
export interface EditStateFor {
  id: string
  type: string
  transactionSyncLock: TransactionSyncLockState | null
  draft: SanityDocument | null
  published: SanityDocument | null
  liveEdit: boolean
  ready: boolean
}
const LOCKED: TransactionSyncLockState = {enabled: true}
const NOT_LOCKED: TransactionSyncLockState = {enabled: false}

/** @internal */
export const editState = memoize(
  (
    ctx: {
      client: SanityClient
      schema: Schema
      serverActionsEnabled: Observable<boolean>
      storage: DocumentsStorage
    },
    idPair: IdPair,
    typeName: string,
  ): Observable<EditStateFor> => {
    const liveEdit = isLiveEditEnabled(ctx.schema, typeName)
    const storage = ctx.storage

    return defer(() => {
      return of({
        draft: storage.get(idPair.draftId) || null,
        published: storage.get(idPair.publishedId) || null,
      })
    }).pipe(
      switchMap((cachePair) => {
        return snapshotPair(ctx.client, idPair, typeName, ctx.serverActionsEnabled).pipe(
          switchMap((versions) =>
            combineLatest([
              versions.draft.snapshots$,
              versions.published.snapshots$,
              versions.transactionsPendingEvents$.pipe(
                // eslint-disable-next-line max-nested-callbacks
                map((ev: PendingMutationsEvent) => (ev.phase === 'begin' ? LOCKED : NOT_LOCKED)),
                startWith(NOT_LOCKED),
              ),
            ]),
          ),
          tap(([draftSnapshot, publishedSnapshot]) => {
            if (draftSnapshot) {
              storage.save(idPair.draftId, draftSnapshot)
            } else if (publishedSnapshot) {
              storage.save(idPair.publishedId, publishedSnapshot)
            }
          }),
          map(([draftSnapshot, publishedSnapshot, transactionSyncLock]) => ({
            id: idPair.publishedId,
            type: typeName,
            draft: draftSnapshot,
            published: publishedSnapshot,
            liveEdit,
            ready: true,
            transactionSyncLock,
          })),
          startWith({
            id: idPair.publishedId,
            type: typeName,
            draft: cachePair.draft,
            published: cachePair.published,
            liveEdit,
            ready: false,
            transactionSyncLock: null,
          }),
        )
      }),
      publishReplay(1),
      refCount(),
    )
  },
  (ctx, idPair, typeName) => memoizeKeyGen(ctx.client, idPair, typeName),
)
