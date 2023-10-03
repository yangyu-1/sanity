import {useKnockFeed} from '@knocklabs/react-notification-feed'
import {CheckmarkCircleIcon, CogIcon} from '@sanity/icons'
import {Badge, Button, Card, Flex, Inline, Label, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import React, {Dispatch, SetStateAction, useCallback} from 'react'
import ReactFocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {VIEW_MODES} from './constants'
import {NotificationItems} from './NotificationItems'
import {ViewMode} from './types'

const TAB_PANEL_ID = 'notifications-tab-panel'

export const RootFlex = styled(Flex)``

interface NotificationsContentProps {
  onSetViewMode: Dispatch<SetStateAction<ViewMode>>
  viewMode: ViewMode
}

export function NotificationsContent({onSetViewMode, viewMode}: NotificationsContentProps) {
  const {knock, feedClient, useFeedStore} = useKnockFeed()
  const {
    metadata: {unread_count: unreadCount},
  } = useFeedStore()

  const handleSetMode = useCallback(
    (mode: ViewMode) => {
      return function () {
        onSetViewMode(mode)
      }
    },
    [onSetViewMode],
  )

  const handleMarkAllAsRead = useCallback(() => {
    feedClient.markAllAsRead()
  }, [feedClient])

  return (
    <RootFlex direction="column" flex={1} forwardedAs={ReactFocusLock} height="fill" returnFocus>
      <Card radius={3} style={{overflowY: 'auto'}}>
        {/* Header */}
        <Card borderBottom style={{position: 'sticky', top: 0, zIndex: 1}}>
          <Flex padding={3}>
            <Flex align="center" gap={1} padding={1}>
              <Label muted size={1}>
                Notifications for
              </Label>
              <Badge fontSize={1} tone="default">
                {knock.userId}
              </Badge>
            </Flex>
          </Flex>

          <Flex justify="space-between" marginBottom={2} paddingX={2}>
            <Flex>
              <TabList space={1}>
                {VIEW_MODES.map((mode) => (
                  <Tab
                    aria-controls="content-panel"
                    fontSize={1}
                    id={mode.id}
                    key={mode.id}
                    label={mode.title}
                    onClick={handleSetMode(mode)}
                    selected={viewMode === mode}
                  />
                ))}
              </TabList>
            </Flex>

            <Flex gap={1}>
              <Button
                disabled={unreadCount === 0}
                mode="bleed"
                onClick={handleMarkAllAsRead}
                padding={2}
              >
                <Inline space={2}>
                  <Text muted size={1}>
                    <CheckmarkCircleIcon />
                  </Text>
                  <Text muted size={1}>
                    Mark all as read
                  </Text>
                </Inline>
              </Button>

              {/* Preferences */}
              <Button disabled fontSize={1} icon={CogIcon} mode="bleed" padding={2} />
            </Flex>
          </Flex>
        </Card>

        <TabPanel aria-labelledby={viewMode.id} id={TAB_PANEL_ID}>
          <NotificationItems viewMode={viewMode} />
        </TabPanel>
      </Card>
    </RootFlex>
  )
}
