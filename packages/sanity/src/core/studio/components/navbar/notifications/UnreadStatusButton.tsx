import {useKnockFeed} from '@knocklabs/react-notification-feed'
import {BellIcon} from '@sanity/icons'
import {Box, Text, Tooltip} from '@sanity/ui'
import pluralize from 'pluralize-esm'
import React, {ForwardedRef, forwardRef} from 'react'
import {StatusButton} from '../../../../components'
import {useColorScheme} from '../../../colorScheme'

interface UnreadStatusButtonProps {
  onClick: () => void
  open?: boolean
}

export const UnreadStatusButton = forwardRef(function UnreadStatusButton(
  {onClick, open}: UnreadStatusButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {useFeedStore} = useKnockFeed()
  const {
    metadata: {unread_count: unreadCount},
  } = useFeedStore()

  const {scheme} = useColorScheme()

  const tooltipMessage = unreadCount
    ? `${unreadCount} unread ${pluralize('notification', unreadCount)}`
    : 'No unread notifications'

  return (
    <div>
      <Tooltip
        content={
          <Box padding={2}>
            <Text size={1}>{tooltipMessage}</Text>
          </Box>
        }
        disabled={open}
        scheme={scheme}
        placement="bottom"
        portal
      >
        <div>
          <StatusButton
            aria-label="Notifications"
            fontSize={2}
            icon={BellIcon}
            mode="bleed"
            onClick={onClick}
            ref={ref}
            tone={unreadCount ? 'critical' : undefined}
          />
        </div>
      </Tooltip>
    </div>
  )
})
