import React, {useEffect, useLayoutEffect, useState} from 'react'
import {Box, Card, Flex} from '@sanity/ui'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentBadges} from './sparkline/DocumentBadges'
import {AnimatedStatusIcon} from './sparkline/ReviewChangesButton/AnimatedStatusIcon'
import {ReviewChangesButton} from './sparkline/ReviewChangesButton/ReviewChangesButton'
import {useSyncState} from 'sanity'

const SYNCING_TIMEOUT = 1000
const SAVED_TIMEOUT = 3000

export function DocumentStatusBar() {
  const {badges, documentId, documentType, editState, value} = useDocumentPane()

  const lastUpdated = value?._updatedAt
  const changed = Boolean(editState?.draft)

  const syncState = useSyncState(documentId, documentType)

  const [status, setStatus] = useState<'saved' | 'syncing' | null>(null)

  // eslint-disable-next-line consistent-return
  useEffect(() => {
    // Schedule an update to set the status to 'saved' when status changed to 'syncing.
    // We use `syncState.isSyncing` here to avoid the status being set to 'saved' when the document is syncing.
    if (status === 'syncing' && !syncState.isSyncing) {
      const timerId = setTimeout(() => setStatus('saved'), SYNCING_TIMEOUT)
      return () => clearTimeout(timerId)
    }
    // Schedule an update to clear the status when status changed to 'saved'
    if (status === 'saved') {
      const timerId = setTimeout(() => setStatus(null), SAVED_TIMEOUT)
      return () => clearTimeout(timerId)
    }
  }, [status, lastUpdated, syncState.isSyncing])

  // Clear the status when documentId changes to make sure we don't show the wrong status when opening a new document
  useLayoutEffect(() => {
    setStatus(null)
  }, [documentId])

  // Set status to 'syncing' when lastUpdated changes and we go from not syncing to syncing
  useLayoutEffect(() => {
    if (syncState.isSyncing) {
      setStatus('syncing')
    }
  }, [syncState.isSyncing, lastUpdated])

  return (
    <Card borderTop paddingX={3} paddingY={3} style={{border: '1px solid blue'}}>
      <Flex align="center" justify="space-between">
        <Box>{badges && <DocumentBadges />}</Box>
        <ReviewChangesButton status={status || (changed ? 'changes' : undefined)} />
      </Flex>
    </Card>
  )
}
