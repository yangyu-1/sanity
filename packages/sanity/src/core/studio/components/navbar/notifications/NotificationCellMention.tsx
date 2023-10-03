import {FeedItem} from '@knocklabs/client'
import {Box, Flex, Stack} from '@sanity/ui'
import React, {useMemo} from 'react'
import {UserAvatar} from '../../../../components'
import {CellContent} from './CellContent.styled'

interface NotificationCellMentionProps {
  item: FeedItem
}

export function NotificationCellMention({item}: NotificationCellMentionProps) {
  const blocksByName: any = useMemo(() => {
    return item.blocks.reduce((acc, block) => {
      return {...acc, [block.name]: block}
    }, {})
  }, [item])

  const firstActor = item.actors[0]

  return (
    <Flex align="flex-start" gap={3}>
      {/* Actor */}
      {firstActor && (
        <Box marginTop={1}>
          <UserAvatar size={0} user={firstActor.id} />
        </Box>
      )}
      <Stack space={3}>
        {blocksByName?.body && (
          <CellContent dangerouslySetInnerHTML={{__html: blocksByName?.body?.rendered}} />
        )}
      </Stack>
    </Flex>
  )
}
