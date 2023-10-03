import {FeedItem} from '@knocklabs/client'
import {Box, Button, Stack} from '@sanity/ui'
import React, {useMemo} from 'react'
import {CellContent} from './CellContent.styled'

interface NotificationCellMentionProps {
  callToActionLabel?: string
  item: FeedItem
}

export function NotificationCellMessage({
  callToActionLabel = 'Learn more',
  item,
}: NotificationCellMentionProps) {
  const blocksByName: any = useMemo(() => {
    return item.blocks.reduce((acc, block) => {
      return {...acc, [block.name]: block}
    }, {})
  }, [item])

  return (
    <Stack space={3}>
      {blocksByName?.body && (
        <CellContent dangerouslySetInnerHTML={{__html: blocksByName?.body?.rendered}} />
      )}
      {item.data?.linkUrl && (
        <Box>
          <Button fontSize={1} padding={2} text={callToActionLabel} />
        </Box>
      )}
    </Stack>
  )
}
