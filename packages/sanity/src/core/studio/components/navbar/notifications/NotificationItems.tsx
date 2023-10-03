import {useKnockFeed} from '@knocklabs/react-notification-feed'
import {Card, Flex, Spinner, Text} from '@sanity/ui'
import React from 'react'
import {WORKFLOW_IDS} from './constants'
import {SuccessIcon} from './icons/SuccessIcon'
import {NotificationCell} from './NotificationCell'
import {ViewMode} from './types'

interface NotificationItemsProps {
  viewMode: ViewMode
}

export function NotificationItems({viewMode}: NotificationItemsProps) {
  const {useFeedStore} = useKnockFeed()
  const {items, loading} = useFeedStore()

  const filteredItems = items.filter((item) => {
    if (!WORKFLOW_IDS.includes(item.source.key)) {
      return false
    }

    const showArchived = (['include', 'only'] as ReadonlyArray<ViewMode['archived']>).includes(
      viewMode.archived,
    )
    if (showArchived) {
      return !!item.archived_at
    }
    return !item.archived_at
  })

  if (loading) {
    return (
      <Flex align="center" flex={1} justify="center" style={{minHeight: '80px'}}>
        <Spinner />
      </Flex>
    )
  }

  return (
    <Card>
      {filteredItems.length > 0 ? (
        <>
          <Card borderBottom padding={0}>
            {filteredItems.map((item) => (
              <NotificationCell item={item} key={item.id} />
            ))}
          </Card>
        </>
      ) : (
        <Flex align="center" direction="column" gap={3} justify="center" padding={4}>
          <SuccessIcon />
          <Text muted size={1}>
            No notifications – you're all up to date!
          </Text>
        </Flex>
      )}
    </Card>
  )
}
