import {type EditDocumentVersionEvent} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getEditEvents} from './getEditEvents'

describe('getEditEvents()', () => {
  const editTransactions = [
    {
      id: 'edit-tx-2',
      timestamp: '2024-11-19T08:27:33.251404Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
          apply: [19, 4, 11, 3, 23, 0, 17, 22, '33', 23, 19, 20, 15],
          revert: [
            11,
            3,
            23,
            0,
            17,
            22,
            '27',
            23,
            19,
            20,
            15,
            17,
            {
              _ref: '54105815-db4e-4a96-8c8a-edaf1e2beab2',
              _type: 'reference',
            },
            'bestFriend',
          ],
        },
      },
    },
    {
      id: 'edit-tx-1',
      timestamp: '2024-11-19T08:27:27.753746Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
          apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'developer', 'role'],
          revert: [11, 3, 23, 0, 9, 22, '8T17:48:0', 23, 18, 20, 15, 17, 'designer', 'role'],
        },
      },
    },
  ]
  const expectedEvent: EditDocumentVersionEvent = {
    type: 'EditDocumentVersion',
    timestamp: '2024-11-19T08:27:33.251404Z',
    author: 'p8xDvUMxC',
    authors: ['p8xDvUMxC'],
    releaseId: 'rkaihDvC1',
    fromRevisionId: 'edit-tx-1',
    revisionId: 'edit-tx-2',
    transactions: [
      {
        type: 'EditTransaction',
        author: 'p8xDvUMxC',
        timestamp: '2024-11-19T08:27:33.251404Z',
        revisionId: 'edit-tx-2',
      },
      {
        type: 'EditTransaction',
        author: 'p8xDvUMxC',
        timestamp: '2024-11-19T08:27:27.753746Z',
        revisionId: 'edit-tx-1',
      },
    ],
  }

  it('should merge the events if they are in the time window.', () => {
    const events = getEditEvents(
      editTransactions,
      'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
    )
    expect(events).toEqual([expectedEvent])
  })
  it("should not merge the events if they aren't in the time window.", () => {
    const newTransaction = {
      id: 'new-tx',
      timestamp: '2024-11-19T08:35:27.753746Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
          apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
          revert: [11, 3, 23, 0, 9, 22, '8T17:48:0', 23, 18, 20, 15, 17, 'developer', 'role'],
        },
      },
    }
    const newEvent: EditDocumentVersionEvent = {
      type: 'EditDocumentVersion',
      timestamp: '2024-11-19T08:35:27.753746Z',
      author: 'p8xDvUMxC',
      authors: ['p8xDvUMxC'],
      releaseId: 'rkaihDvC1',
      fromRevisionId: 'new-tx',
      revisionId: 'new-tx',
      transactions: [
        {
          type: 'EditTransaction',
          author: 'p8xDvUMxC',
          timestamp: '2024-11-19T08:35:27.753746Z',
          revisionId: 'new-tx',
        },
      ],
    }
    const events = getEditEvents(
      [...editTransactions, newTransaction],
      'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
    )
    expect(events).toEqual([newEvent, expectedEvent])
  })
  it('should filter non edit events', () => {
    const creationTransaction = {
      id: 'create-tx',
      timestamp: '2024-11-19T08:35:27.753746Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
          apply: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
          revert: [0, null],
        },
      },
    }
    const deleteTx = {
      id: 'delete-tx',
      timestamp: '2024-11-19T08:35:27.753746Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': {
          apply: [0, null],
          revert: [11, 3, 23, 0, 9, 22, '9T08:27:2', 23, 18, 20, 15, 17, 'designer', 'role'],
        },
      },
    }
    const undefinedTx = {
      id: 'undefined-tx',
      timestamp: '2024-11-19T08:35:27.753746Z',
      author: 'p8xDvUMxC',
      mutations: [],
      documentIDs: ['versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183'],
      effects: {
        'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183': undefined,
      },
    }
    const events = getEditEvents(
      [deleteTx, ...editTransactions, undefinedTx, creationTransaction],
      'versions.rkaihDvC1.f8dece19-c458-4cff-bf76-732b00617183',
    )
    expect(events).toEqual([expectedEvent])
  })
})
