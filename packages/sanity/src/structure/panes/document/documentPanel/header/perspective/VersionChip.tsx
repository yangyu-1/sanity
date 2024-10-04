import {useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {memo, type MouseEvent, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import {type BundleDocument, getVersionId} from 'sanity'
import {styled} from 'styled-components'

import {Button, Popover, Tooltip} from '../../../../../../ui-components'
import {CreateReleaseDialog} from './CreateReleaseDialog'
import {DiscardVersionDialog} from './DiscardVersionDialog'
import {VersionPopoverMenu} from './VersionPopoverMenu'

const Chip = styled(Button)`
  border-radius: 9999px !important;
  transition: none;
  text-decoration: none !important;
  cursor: pointer;

  // target enabled state
  &:not([data-disabled='true']) {
    --card-border-color: var(--card-badge-default-bg-color);
  }
`

export const VersionChip = memo(function VersionChip(props: {
  disabled?: boolean
  selected: boolean
  tooltipContent: ReactNode
  onClick: () => void
  text: string
  tone: 'default' | 'primary' | 'positive' | 'caution' | 'critical'
  icon: React.ComponentType
  contextValues: {
    documentId: string
    releases: BundleDocument[]
    releasesLoading: boolean
    documentType: string
    menuReleaseId: string
    fromRelease: string
    isVersion: boolean
  }
}) {
  const {
    disabled,
    selected,
    tooltipContent,
    onClick,
    text,
    tone,
    icon,
    contextValues: {
      documentId,
      releases,
      releasesLoading,
      documentType,
      menuReleaseId,
      fromRelease,
      isVersion,
    },
  } = props

  const [contextMenuPoint, setContextMenuPoint] = useState<{x: number; y: number} | undefined>(
    undefined,
  )
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isCreateReleaseDialogOpen, setIsCreateReleaseDialogOpen] = useState(false)

  const close = useCallback(() => setContextMenuPoint(undefined), [])

  const handleContextMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    setContextMenuPoint({x: event.clientX, y: event.clientY})
  }, [])

  useClickOutsideEvent(
    () => {
      if (contextMenuPoint?.x && contextMenuPoint?.y) {
        close()
      }
    },
    () => [popoverRef.current],
  )

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          close()
        }
      },
      [close],
    ),
  )

  const openDiscardDialog = useCallback(() => {
    setIsDiscardDialogOpen(true)
  }, [setIsDiscardDialogOpen])

  const openCreateReleaseDialog = useCallback(() => {
    setIsCreateReleaseDialogOpen(true)
  }, [setIsCreateReleaseDialogOpen])

  const referenceElement = useMemo(() => {
    if (!contextMenuPoint) {
      return null
    }

    return {
      getBoundingClientRect() {
        return {
          x: contextMenuPoint.x,
          y: contextMenuPoint.y,
          left: contextMenuPoint.x,
          top: contextMenuPoint.y,
          right: contextMenuPoint.x,
          bottom: contextMenuPoint.y,
          width: 0,
          height: 0,
        }
      },
    } as HTMLElement
  }, [contextMenuPoint])

  return (
    <>
      <Tooltip content={tooltipContent} fallbackPlacements={[]} portal placement="bottom">
        <Chip
          disabled={disabled}
          mode="bleed"
          onClick={onClick}
          padding={2}
          paddingRight={3}
          radius="full"
          selected={selected}
          style={{flex: 'none'}}
          text={text}
          tone={tone}
          icon={icon}
          onContextMenu={handleContextMenu}
        />
      </Tooltip>

      <Popover
        content={
          <VersionPopoverMenu
            documentId={documentId}
            releases={releases}
            releasesLoading={releasesLoading}
            documentType={documentType}
            fromRelease={fromRelease}
            isVersion={isVersion}
            onDiscard={openDiscardDialog}
            onCreateRelease={openCreateReleaseDialog}
          />
        }
        fallbackPlacements={[]}
        open={Boolean(referenceElement)}
        portal
        placement="bottom-start"
        ref={popoverRef}
        referenceElement={referenceElement}
        zOffset={10}
      />

      {isDiscardDialogOpen && (
        <DiscardVersionDialog
          onClose={() => setIsDiscardDialogOpen(false)}
          documentId={isVersion ? getVersionId(documentId, menuReleaseId) : documentId}
          documentType={documentType}
        />
      )}

      {isCreateReleaseDialogOpen && (
        <CreateReleaseDialog
          onClose={() => setIsCreateReleaseDialogOpen(false)}
          documentId={isVersion ? getVersionId(documentId, menuReleaseId) : documentId}
          documentType={documentType}
        />
      )}
    </>
  )
})
