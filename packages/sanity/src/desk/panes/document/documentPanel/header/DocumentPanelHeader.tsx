import {ArrowLeftIcon, CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Box, Flex, TooltipDelayGroupProvider} from '@sanity/ui'
import React, {createElement, memo, forwardRef, useMemo} from 'react'
import {PaneHeader, PaneHeaderActionButton, usePane, usePaneRouter} from '../../../../components'
import {TimelineMenu} from '../../timeline'
import {useDocumentPane} from '../../useDocumentPane'
import {isMenuNodeButton, isNotMenuNodeButton, resolveMenuNodes} from '../../../../menuNodes'
import {useDeskTool} from '../../../../useDeskTool'
import {Button} from '../../../../../ui'
import {TOOLTIP_DELAY_PROPS} from '../../../../../ui/tooltip/constants'
import {DocumentHeaderTabs} from './DocumentHeaderTabs'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'
import {useFieldActions, useTimelineSelector} from 'sanity'
import {
  DocumentStatusBarActions,
  HistoryStatusBarActions,
} from '../../statusBar/DocumentStatusBarActions'
import {DocumentSparkline} from '../../statusBar/sparkline/DocumentSparkline'

export interface DocumentPanelHeaderProps {
  // @todo: refactor
  // eslint-disable-next-line react/no-unused-prop-types
  actionsBoxRef?: React.Ref<HTMLDivElement>
}

export const DocumentPanelHeader = memo(
  forwardRef(function DocumentPanelHeader(
    props: DocumentPanelHeaderProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {actionsBoxRef} = props
    const {
      badges,
      onMenuAction,
      onPaneClose,
      onPaneSplit,
      menuItems,
      menuItemGroups,
      schemaType,
      timelineStore,
      ready,
      views,
      unstable_languageFilter,
    } = useDocumentPane()
    const {features} = useDeskTool()
    const {index, BackLink, hasGroupSiblings} = usePaneRouter()
    const {actions: fieldActions} = useFieldActions()
    const menuNodes = useMemo(
      () =>
        resolveMenuNodes({actionHandler: onMenuAction, fieldActions, menuItems, menuItemGroups}),
      [onMenuAction, fieldActions, menuItemGroups, menuItems],
    )
    const menuButtonNodes = useMemo(() => menuNodes.filter(isMenuNodeButton), [menuNodes])
    const contextMenuNodes = useMemo(() => menuNodes.filter(isNotMenuNodeButton), [menuNodes])
    const showTabs = views.length > 1

    // Subscribe to external timeline state changes
    const rev = useTimelineSelector(timelineStore, (state) => state.revTime)

    const {collapsed, isLast} = usePane()
    // Prevent focus if this is the last (non-collapsed) pane.
    const tabIndex = isLast && !collapsed ? -1 : 0

    // there are three kinds of buttons possible:
    //
    // 1. split pane - creates a new split pane
    // 2. close split pane — closes the current split pane
    // 3. close pane group — closes the current pane group

    // show the split pane button if they're enabled and there is more than one
    // view available to use to create a split view
    const showSplitPaneButton = features.splitViews && onPaneSplit && views.length > 1

    // show the split pane button close button if the split button is showing
    // and there is more than one split pane open (aka has-siblings)
    const showSplitPaneCloseButton = showSplitPaneButton && hasGroupSiblings

    // show the pane group close button if the `showSplitPaneCloseButton` is
    // _not_ showing (the split pane button replaces the group close button)
    // and if the back button is not showing (the back button and the close
    // button) do the same thing and shouldn't be shown at the same time)
    const showPaneGroupCloseButton = !showSplitPaneCloseButton && !features.backButton

    // Subscribe to external timeline state changes
    const showingRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)

    return (
      <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
        <PaneHeader
          ref={ref}
          loading={!ready}
          title={<DocumentHeaderTitle />}
          tabIndex={tabIndex}
          backButton={
            features.backButton &&
            index > 0 && (
              <Button
                as={BackLink}
                data-as="a"
                icon={ArrowLeftIcon}
                mode="bleed"
                size="small"
                tooltipProps={{content: 'Back'}}
              />
            )
          }
          // ACTIONS - top right
          actions={
            <Flex
              align="center"
              gap={1}
              style={{
                flexShrink: 0,
                // outline: '1px solid red',
              }}
            >
              {/* Language filter */}
              {/*unstable_languageFilter.length > 0 && (
                <>
                  {unstable_languageFilter.map((languageFilterComponent, idx) => {
                    return createElement(languageFilterComponent, {
                      // eslint-disable-next-line react/no-array-index-key
                      key: `language-filter-${idx}`,
                      schemaType,
                    })
                  })}
                </>
              )*/}

              <Flex align="center" gap={2} marginLeft={6}>
                {/* Document status */}
                {!showingRevision && <Box>{badges && <DocumentSparkline />}</Box>}
                {/* Document history */}
                <TimelineMenu chunk={rev} mode="rev" placement="bottom-end" />
              </Flex>

              <Box flex={1} ref={actionsBoxRef}>
                {showingRevision ? (
                  <HistoryStatusBarActions contextMenuNodes={contextMenuNodes} />
                ) : (
                  <DocumentStatusBarActions contextMenuNodes={contextMenuNodes} />
                )}
              </Box>

              {/* Split pane */}
              {showSplitPaneButton && (
                <Button
                  icon={SplitVerticalIcon}
                  key="split-pane-button"
                  mode="bleed"
                  onClick={onPaneSplit}
                  tooltipProps={{content: 'Split pane right'}}
                />
              )}

              {/* Close button */}
              {showSplitPaneCloseButton && (
                <Button
                  icon={CloseIcon}
                  key="close-view-button"
                  mode="bleed"
                  onClick={onPaneClose}
                  tooltipProps={{content: 'Close split pane'}}
                />
              )}

              {/* Close pane group */}
              {showPaneGroupCloseButton && (
                <Button
                  icon={CloseIcon}
                  key="close-view-button"
                  mode="bleed"
                  as={BackLink}
                  tooltipProps={{content: 'Close pane group'}}
                />
              )}
            </Flex>
          }
        />
      </TooltipDelayGroupProvider>
    )
  }),
)
