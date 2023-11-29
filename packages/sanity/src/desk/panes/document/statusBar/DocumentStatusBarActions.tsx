import {Flex, Hotkeys, LayerProvider, Text} from '@sanity/ui'
import React, {memo, useMemo, useState} from 'react'
import {RenderActionCollectionState} from '../../../components'
import {HistoryRestoreAction} from '../../../documentActions'
import {Button, TooltipWithNodes} from '../../../../ui'
import {useDocumentPane} from '../useDocumentPane'
import {_PaneMenuNode} from '../../../components/pane/types'
import {ActionMenuButton} from './ActionMenuButton'
import {ActionStateDialog} from './ActionStateDialog'
import {DocumentActionDescription, useTimelineSelector} from 'sanity'

interface DocumentStatusBarActionsInnerProps {
  contextMenuNodes?: _PaneMenuNode[]
  disabled: boolean
  showMenu: boolean
  states: DocumentActionDescription[]
}

function DocumentStatusBarActionsInner(props: DocumentStatusBarActionsInnerProps) {
  const {contextMenuNodes, disabled, showMenu, states} = props
  const [firstActionState, ...menuActionStates] = states
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  // TODO: This could be refactored to use the tooltip from the button if the firstAction.title was updated to a string.
  const tooltipContent = useMemo(() => {
    if (!firstActionState || (!firstActionState.title && !firstActionState.shortcut)) return null

    return (
      <Flex style={{maxWidth: 300}} align="center" gap={3}>
        {firstActionState.title && <Text size={1}>{firstActionState.title}</Text>}
        {firstActionState.shortcut && (
          <Hotkeys
            fontSize={1}
            style={{marginTop: -4, marginBottom: -4}}
            keys={String(firstActionState.shortcut)
              .split('+')
              .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase())}
          />
        )}
      </Flex>
    )
  }, [firstActionState])

  return (
    <Flex flex={1} justify="flex-end" gap={1}>
      {firstActionState && (
        <LayerProvider zOffset={200}>
          <TooltipWithNodes disabled={!tooltipContent} content={tooltipContent} placement="top">
            <div style={{flexShrink: 0}}>
              <Button
                data-testid={`action-${firstActionState.label}`}
                disabled={disabled || Boolean(firstActionState.disabled)}
                icon={firstActionState.icon}
                // eslint-disable-next-line react/jsx-handler-names
                onClick={firstActionState.onHandle}
                ref={setButtonElement}
                text={firstActionState.label}
                tone={firstActionState.tone || 'primary'}
              />
            </div>
          </TooltipWithNodes>
        </LayerProvider>
      )}
      {showMenu &&
        ((menuActionStates && menuActionStates.length > 0) ||
          (contextMenuNodes && contextMenuNodes.length > 0)) && (
          <ActionMenuButton
            actionStates={menuActionStates}
            contextMenuNodes={contextMenuNodes}
            disabled={disabled}
          />
        )}
      {firstActionState && firstActionState.dialog && (
        <ActionStateDialog dialog={firstActionState.dialog} referenceElement={buttonElement} />
      )}
    </Flex>
  )
}

export const DocumentStatusBarActions = memo(function DocumentStatusBarActions({
  contextMenuNodes,
}: {
  contextMenuNodes?: _PaneMenuNode[]
}) {
  const {actions, connectionState, documentId, editState} = useDocumentPane()

  if (!actions || !editState) {
    return null
  }

  return (
    <RenderActionCollectionState
      actions={actions}
      // @ts-expect-error TODO: fix the document actions
      actionProps={editState}
    >
      {({states}) => (
        <DocumentStatusBarActionsInner
          contextMenuNodes={contextMenuNodes}
          disabled={connectionState !== 'connected'}
          showMenu={actions.length > 1}
          states={states}
          // Use document ID as key to make sure that the actions state is reset when the document changes
          key={documentId}
        />
      )}
    </RenderActionCollectionState>
  )
})

export const HistoryStatusBarActions = memo(function HistoryStatusBarActions({
  contextMenuNodes,
}: {
  contextMenuNodes: _PaneMenuNode[]
}) {
  const {connectionState, editState, timelineStore} = useDocumentPane()

  // Subscribe to external timeline state changes
  const revTime = useTimelineSelector(timelineStore, (state) => state.revTime)

  const revision = revTime?.id || ''
  const disabled = (editState?.draft || editState?.published || {})._rev === revision
  const actionProps = useMemo(() => ({...(editState || {}), revision}), [editState, revision])
  const historyActions = useMemo(() => [HistoryRestoreAction], [])

  return (
    <RenderActionCollectionState actions={historyActions} actionProps={actionProps as any}>
      {({states}) => (
        <DocumentStatusBarActionsInner
          contextMenuNodes={contextMenuNodes}
          disabled={connectionState !== 'connected' || Boolean(disabled)}
          showMenu
          // showMenu={false}
          states={states}
        />
      )}
    </RenderActionCollectionState>
  )
})
