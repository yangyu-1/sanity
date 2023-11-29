import {Box, Flex, Text, useElementRect} from '@sanity/ui'
import React, {useEffect, useMemo, useState, memo, useLayoutEffect} from 'react'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentStatus} from '../../../../../ui/documentStatus'
import {DocumentBadges} from './DocumentBadges'
// import {PublishStatus} from './PublishStatus'
import {TextWithTone, useDocumentStatusTimeAgo, useSyncState, useTimelineSelector} from 'sanity'

export const DocumentSparkline = memo(function DocumentSparkline() {
  const {
    changesOpen,
    documentId,
    documentType,
    editState,
    onHistoryClose,
    onHistoryOpen,
    timelineStore,
    value,
  } = useDocumentPane()
  const syncState = useSyncState(documentId, documentType)

  const lastPublished = editState?.published?._updatedAt
  const liveEdit = Boolean(editState?.liveEdit)
  const published = Boolean(editState?.published)

  const [rootFlexElement, setRootFlexElement] = useState<HTMLDivElement | null>(null)
  const rootFlexRect = useElementRect(rootFlexElement)
  const collapsed = !rootFlexRect || rootFlexRect?.width < 300

  // Subscribe to TimelineController changes and store internal state.
  const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

  const statusTimeAgo = useDocumentStatusTimeAgo({
    draftUpdatedAt: editState?.draft?._updatedAt,
    hidePublishedDate: true,
    publishedUpdatedAt: editState?.published?._updatedAt,
  })

  return (
    <Flex align="center" data-ui="DocumentSparkline" paddingLeft={2} ref={setRootFlexElement}>
      <Flex align="center" gap={3}>
        <DocumentStatus draft={editState?.draft} published={editState?.published} showTick />
        <Text muted size={1} weight="medium">
          {statusTimeAgo}
        </Text>
      </Flex>
    </Flex>
  )
})
