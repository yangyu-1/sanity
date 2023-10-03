import {FeedItem} from '@knocklabs/client'
import {useKnockFeed} from '@knocklabs/react-notification-feed'
import {
  ArchiveIcon,
  CheckmarkCircleIcon,
  CircleIcon,
  EllipsisVerticalIcon,
  RetrieveIcon,
} from '@sanity/icons'
import {Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import styled, {useTheme} from 'styled-components'
import {useTimeAgo} from '../../../../hooks'
import {NotificationCellMention} from './NotificationCellMention'
import {NotificationCellMessage} from './NotificationCellMessage'
import {NotificationCellProjectMemberUpdate} from './NotificationCellProjectMemberUpdate'

interface NotificationCellProps {
  item: FeedItem
}

const Dot = styled.div({
  width: 6,
  height: 6,
  borderRadius: 3,
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})

export function NotificationCell({item}: NotificationCellProps) {
  const {feedClient} = useKnockFeed()

  const theme = useTheme()
  const toneColor = theme.sanity.color.solid.primary
  const dotStyle = useMemo(
    () => ({
      backgroundColor: toneColor?.enabled.bg,
      marginTop: 2,
    }),
    [toneColor],
  )

  const timeAgo = useTimeAgo(item.inserted_at, {agoSuffix: true})

  const isArchived = !!item.archived_at
  const isRead = !!item.read_at

  const handleToggleArchive = useCallback(() => {
    if (isArchived) {
      feedClient.markAsUnarchived(item)
    } else {
      feedClient.markAsArchived(item)
    }
  }, [feedClient, isArchived, item])

  const handleToggleMarkAsRead = useCallback(() => {
    if (isRead) {
      feedClient.markAsUnread(item)
    } else {
      feedClient.markAsRead(item)
    }
  }, [feedClient, isRead, item])

  const tone = useMemo(() => {
    switch (item.source.key) {
      case 'feature-invitation':
        return 'primary'
      case 'maintenance-alert':
        return 'critical'
      case 'overage-alert':
        return 'caution'
      default:
        return 'default'
    }
  }, [item.source.key])

  const cellContent = useMemo(() => {
    switch (item.source.key) {
      case 'feature-invitation':
        return <NotificationCellMessage item={item} />
      case 'comments-branched':
        return <NotificationCellMention item={item} />
      case 'maintenance-alert':
        return <NotificationCellMessage item={item} />
      case 'overage-alert':
        return <NotificationCellMessage callToActionLabel="View on manage" item={item} />
      case 'project-member-added':
        return (
          <NotificationCellProjectMemberUpdate item={item} suffix="was added to this project." />
        )
      case 'project-member-removed':
        return (
          <NotificationCellProjectMemberUpdate
            item={item}
            suffix="was removed from this project."
          />
        )
      default:
        return null
    }
  }, [item])

  if (!cellContent) {
    return null
  }

  return (
    <Card borderBottom tone={tone}>
      <Flex paddingLeft={3} paddingRight={2} paddingY={3}>
        {/* Read dot */}
        <Flex align="flex-start" paddingTop={1} style={{width: '18px'}}>
          {!isRead && <Dot style={dotStyle} />}
        </Flex>

        <Stack flex={1} space={3}>
          <Box marginTop={1}>
            <Text muted size={1}>
              {timeAgo}
            </Text>
          </Box>

          <Flex justify="space-between" marginBottom={1}>
            {cellContent}

            {/* Context menu */}
            <Box marginLeft={3} style={{flexShrink: 0}}>
              <MenuButton
                button={
                  <Button
                    fontSize={1}
                    iconRight={EllipsisVerticalIcon}
                    mode="bleed"
                    padding={2}
                    space={2}
                  />
                }
                id="notificationActions"
                menu={
                  <Menu>
                    <MenuItem
                      fontSize={1}
                      icon={isRead ? CircleIcon : CheckmarkCircleIcon}
                      onClick={handleToggleMarkAsRead}
                      text={`Mark as ${isRead ? 'unread' : 'read'}`}
                    />
                    <MenuItem
                      fontSize={1}
                      icon={isArchived ? RetrieveIcon : ArchiveIcon}
                      onClick={handleToggleArchive}
                      text={`${isArchived ? 'Unarchive' : 'Archive'}`}
                      tone={isArchived ? 'default' : 'critical'}
                    />
                  </Menu>
                }
                popover={{portal: false, tone: 'default'}}
              />
            </Box>
          </Flex>
        </Stack>
      </Flex>
    </Card>
  )
}
