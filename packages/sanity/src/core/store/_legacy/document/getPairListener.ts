/* eslint-disable @typescript-eslint/no-use-before-define */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {groupBy} from 'lodash'
import {concat, defer, EMPTY, merge, type Observable, of, throwError, timer} from 'rxjs'
import {catchError, concatMap, filter, map, mergeMap, scan} from 'rxjs/operators'

import {LISTENER_RESET_DELAY} from '../../../preview/constants'
import {shareReplayLatest} from '../../../preview/utils/shareReplayLatest'
import {debug} from './debug'
import {
  type IdPair,
  type MutationEvent,
  type PendingMutationsEvent,
  type ReconnectEvent,
  type WelcomeEvent,
} from './types'
import {OutOfSyncError, sequentializeListenerEvents} from './utils/sequentializeListenerEvents'

interface Snapshots {
  draft: SanityDocument | null
  published: SanityDocument | null
}

/** @internal */
export interface InitialSnapshotEvent {
  type: 'snapshot'
  documentId: string
  initialRevision: string | undefined
  document: SanityDocument | null
}

/** @internal */
export type ListenerEventWithSnapshot = MutationEvent | ReconnectEvent | InitialSnapshotEvent

/** @internal */
export interface PairListenerOptions {
  tag?: string
}

/** @internal */
export type ListenerEvent =
  | MutationEvent
  | ReconnectEvent
  | InitialSnapshotEvent
  | PendingMutationsEvent

const PENDING_START: PendingMutationsEvent = {type: 'pending', phase: 'begin'}
const PENDING_END: PendingMutationsEvent = {type: 'pending', phase: 'end'}

function isMutationEvent(msg: ListenerEvent): msg is MutationEvent {
  return msg.type === 'mutation'
}
function isMultiTransactionEvent(msg: MutationEvent) {
  return msg.transactionTotalEvents > 1
}

function allPendingTransactionEventsReceived(listenerEvents: ListenerEvent[]) {
  const groupedMutations = groupBy(
    listenerEvents.filter((ev): ev is MutationEvent => ev.type === 'mutation'),
    (e) => e.transactionId,
  )
  // Note: we can't assume that the events come in order, so instead of checking the counter attributes we check that we have actually received all
  return Object.values(groupedMutations).every(
    (mutations) => mutations.length === mutations[0].transactionTotalEvents,
  )
}

/** @internal */
export function getPairListener(
  client: SanityClient,
  idPair: IdPair,
  options: PairListenerOptions = {},
): Observable<ListenerEvent> {
  const {publishedId, draftId} = idPair

  const sharedEvents = defer(() =>
    client
      .listen(
        `*[_id == $publishedId || _id == $draftId]`,
        {
          publishedId,
          draftId,
        },
        {
          includeResult: false,
          events: ['welcome', 'mutation', 'reconnect'],
          effectFormat: 'mendoza',
          tag: options.tag || 'document.pair-listener',
        },
      )
      .pipe(
        shareReplayLatest({
          predicate: (event) => event.type === 'welcome' || event.type === 'reconnect',
          resetOnRefCountZero: () => timer(LISTENER_RESET_DELAY),
        }),
      ),
  ) as Observable<WelcomeEvent | MutationEvent | ReconnectEvent>

  return defer(() => sharedEvents).pipe(
    concatMap((event) => {
      return event.type === 'welcome'
        ? fetchInitialDocumentSnapshots().pipe(
            concatMap((snapshots) => {
              return merge(
                concat(
                  of(createSnapshotEvent(draftId, snapshots.draft)),
                  sharedEvents.pipe(
                    filter((event) => event.type !== 'welcome'),
                    filter(
                      (sharedListenerEvent) =>
                        sharedListenerEvent.type !== 'mutation' ||
                        sharedListenerEvent.documentId === draftId,
                    ),
                  ),
                ).pipe(sequentializeListenerEvents()),
                concat(
                  of(createSnapshotEvent(publishedId, snapshots.published)),
                  sharedEvents.pipe(
                    filter((event) => event.type !== 'welcome'),
                    filter(
                      (sharedListenerEvent) =>
                        sharedListenerEvent.type !== 'mutation' ||
                        sharedListenerEvent.documentId === publishedId,
                    ),
                  ),
                ).pipe(sequentializeListenerEvents()),
              )
            }),
          )
        : EMPTY
    }),
    catchError((err, caught$) => {
      if (err instanceof OutOfSyncError) {
        console.error(err)
        return caught$
      }
      return throwError(err)
    }),
    scan(
      (acc: {next: ListenerEvent[]; buffer: ListenerEvent[]}, msg) => {
        // we only care about mutation events
        if (!isMutationEvent(msg)) {
          return {next: [msg], buffer: []}
        }

        const isBuffering = acc.buffer.length > 0
        const isMulti = isMultiTransactionEvent(msg)
        if (!isMulti && !isBuffering) {
          // simple case, we have no buffer, and the event is a single-transaction event, so just pass it on
          return {next: [msg], buffer: []}
        }

        if (!isMulti) {
          // we have received a single transaction event while waiting for the rest of events from a multi transaction
          // put it in the buffer
          return {next: [], buffer: acc.buffer.concat(msg)}
        }

        const nextBuffer = acc.buffer.concat(msg)
        if (allPendingTransactionEventsReceived(nextBuffer)) {
          // we have received all pending transactions, emit the buffer, and signal end of buffer
          return {next: nextBuffer.concat(PENDING_END), buffer: []}
        }
        // if we get here, we are still waiting for more multi-transaction messages
        // if nextBuffer only has one element, we know we just started buffering
        return {next: nextBuffer.length === 1 ? [PENDING_START] : [], buffer: nextBuffer}
      },
      {next: [], buffer: []},
    ),
    // note: this flattens the array, and in the case of an empty array, no event will be pushed downstream
    mergeMap((v) => v.next),
  )

  function fetchInitialDocumentSnapshots(): Observable<Snapshots> {
    return client.observable
      .getDocuments<SanityDocument>([draftId, publishedId], {tag: 'document.snapshots'})
      .pipe(
        map(([draft, published]) => ({
          draft,
          published,
        })),
      )
  }
}

function createSnapshotEvent(
  documentId: string,
  document: null | SanityDocument,
): InitialSnapshotEvent {
  return {
    type: 'snapshot',
    documentId,
    document,
    initialRevision: document?._rev,
  }
}
