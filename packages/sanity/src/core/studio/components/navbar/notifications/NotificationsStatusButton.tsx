import {useKnockFeed} from '@knocklabs/react-notification-feed'
import {Popover, useClickOutside} from '@sanity/ui'
import React, {useCallback, useEffect, useState} from 'react'
import styled from 'styled-components'
import {useColorScheme} from '../../../colorScheme'
import {VIEW_MODES} from './constants'
import {NotificationsContent} from './NotificationsContent'
import {ViewMode} from './types'
import {UnreadStatusButton} from './UnreadStatusButton'

const StyledPopover = styled(Popover)`
  width: 420px;
`

export function NotificationsButton() {
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES[0])

  const {scheme} = useColorScheme()
  const knockFeed = useKnockFeed()

  const handleToggleOpen = useCallback(() => setOpen((v) => !v), [])

  const handleClose = useCallback(() => {
    setOpen(false)
    buttonElement?.focus()
  }, [buttonElement])

  // Close popover on escape or tab
  const handlePopoverKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Escape' || e.key === 'Tab') && open) {
        handleClose()
      }
    },
    [handleClose, open],
  )

  // Close popover on click outside
  useClickOutside(() => {
    if (open) {
      handleClose()
    }
  }, [buttonElement, popoverElement])

  // Fetch knock notifications
  useEffect(() => {
    if (open) {
      knockFeed?.feedClient.fetch({archived: viewMode.archived})
    } else {
      knockFeed?.feedClient.fetch({archived: VIEW_MODES[0].archived})
    }
  }, [knockFeed?.feedClient, open, viewMode, viewMode.archived])

  if (!knockFeed) {
    return null
  }

  return (
    <StyledPopover
      constrainSize
      content={<NotificationsContent onSetViewMode={setViewMode} viewMode={viewMode} />}
      onKeyDown={handlePopoverKeyDown}
      open={open}
      radius={3}
      ref={setPopoverElement}
      scheme={scheme}
    >
      <UnreadStatusButton onClick={handleToggleOpen} open={open} ref={setButtonElement} />
    </StyledPopover>
  )
}
