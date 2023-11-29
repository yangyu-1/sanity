import {
  BoundaryElementProvider,
  Flex,
  PortalProvider,
  usePortal,
  useElementRect,
  Box,
  TooltipDelayGroupProvider,
} from '@sanity/ui'
import React, {createElement, useEffect, useMemo, useRef, useState} from 'react'
import styled, {css} from 'styled-components'
import {PaneContent, PaneHeaderActionButton, usePane, usePaneLayout} from '../../../components'
import {useDocumentPane} from '../useDocumentPane'
import {useDeskTool} from '../../../useDeskTool'
import {DocumentInspectorPanel} from '../documentInspector'
import {InspectDialog} from '../inspectDialog'
import {DeletedDocumentBanner} from './DeletedDocumentBanner'
import {ReferenceChangedBanner} from './ReferenceChangedBanner'
import {PermissionCheckBanner} from './PermissionCheckBanner'
import {FormView} from './documentViews'
import {DocumentPanelHeader} from './header'
import {
  ScrollContainer,
  useFieldActions,
  useTimelineSelector,
  VirtualizerScrollInstanceProvider,
} from 'sanity'
import {TOOLTIP_DELAY_PROPS} from '../../../../ui/tooltip/constants'
import {DocumentStatusBar} from '../statusBar'
import {DocumentHeaderTabs} from './header/DocumentHeaderTabs'
import {isMenuNodeButton, resolveMenuNodes} from '../../../menuNodes'

interface DocumentPanelProps {
  footerHeight: number | null
  rootElement: HTMLDivElement | null
  isInspectOpen: boolean
  setActionsBoxElement: (el: HTMLDivElement | null) => void
  setDocumentPanelPortalElement: (el: HTMLElement | null) => void
}

const DocumentBox = styled(Box)({
  position: 'relative',
})

const Scroller = styled(ScrollContainer)<{$disabled: boolean}>(({$disabled}) => {
  if ($disabled) {
    return {height: '100%'}
  }

  return css`
    height: 100%;
    overflow: auto;
    position: relative;
    scroll-behavior: smooth;
    outline: none;
  `
})

export const DocumentPanel = function DocumentPanel(props: DocumentPanelProps) {
  const {
    footerHeight,
    isInspectOpen,
    rootElement,
    setActionsBoxElement,
    setDocumentPanelPortalElement,
  } = props
  const {
    activeViewId,
    displayed,
    documentId,
    editState,
    inspector,
    value,
    views,
    ready,
    schemaType,
    permissions,
    onMenuAction,
    isPermissionsLoading,
    isDeleting,
    isDeleted,
    timelineStore,
    formState,
    menuItems,
    menuItemGroups,
  } = useDocumentPane()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {collapsed} = usePane()
  const parentPortal = usePortal()
  const {features} = useDeskTool()
  const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null)
  const headerRect = useElementRect(headerElement)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const formContainerElement = useRef<HTMLDivElement | null>(null)

  const requiredPermission = value._createdAt ? 'update' : 'create'

  const selectedGroup = useMemo(() => {
    if (!formState) return undefined

    return formState.groups.find((group) => group.selected)
  }, [formState])

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'},
    [activeViewId, views],
  )

  const showTabs = views.length > 1

  // Use a local portal container when split panes is supported
  const portalElement: HTMLElement | null = features.splitPanes
    ? portalRef.current || parentPortal.element
    : parentPortal.element

  // Calculate the height of the header
  const margins: [number, number, number, number] = useMemo(() => {
    if (layoutCollapsed) {
      return [headerRect?.height || 0, 0, footerHeight ? footerHeight + 2 : 2, 0]
    }

    return [0, 0, 2, 0]
  }, [layoutCollapsed, footerHeight, headerRect])

  const formViewHidden = activeView.type !== 'form'

  const activeViewNode = useMemo(
    () =>
      activeView.type === 'component' &&
      activeView.component &&
      createElement(activeView.component, {
        document: {
          draft: editState?.draft || null,
          displayed: displayed || value,
          historical: displayed,
          published: editState?.published || null,
        },
        documentId,
        options: activeView.options,
        schemaType,
      }),
    [activeView, displayed, documentId, editState?.draft, editState?.published, schemaType, value],
  )

  const lastNonDeletedRevId = useTimelineSelector(
    timelineStore,
    (state) => state.lastNonDeletedRevId,
  )

  // Scroll to top as `documentId` changes
  useEffect(() => {
    if (!documentScrollElement?.scrollTo) return
    documentScrollElement.scrollTo(0, 0)
  }, [documentId, documentScrollElement])

  // Pass portal element to `DocumentPane`
  useEffect(() => {
    if (portalElement) {
      setDocumentPanelPortalElement(portalElement)
    }
  }, [portalElement, setDocumentPanelPortalElement])

  const inspectDialog = useMemo(() => {
    return isInspectOpen ? <InspectDialog value={displayed || value} /> : null
  }, [isInspectOpen, displayed, value])

  const showInspector = Boolean(!collapsed && inspector)

  const {actions: fieldActions} = useFieldActions()

  const menuNodes = useMemo(
    () => resolveMenuNodes({actionHandler: onMenuAction, fieldActions, menuItems, menuItemGroups}),
    [fieldActions, menuItemGroups, menuItems, onMenuAction],
  )

  const menuButtonNodes = useMemo(() => menuNodes.filter(isMenuNodeButton), [menuNodes])

  return (
    <>
      <DocumentPanelHeader actionsBoxRef={setActionsBoxElement} ref={setHeaderElement} />
      {/* Badges + sparkline */}
      {/* <DocumentStatusBar /> */}

      {/* Tabs + menu button actions*/}
      <Flex
        align="center"
        justify="space-between"
        paddingLeft={3}
        paddingRight={2}
        paddingY={1}
        // style={{border: '1px solid orange'}}
      >
        {showTabs ? <DocumentHeaderTabs /> : <div />}

        <Flex gap={1}>
          {menuButtonNodes.map((item) => (
            <PaneHeaderActionButton key={item.key} node={item} />
          ))}
        </Flex>
      </Flex>
      <PaneContent>
        <Flex height="fill">
          {(features.resizablePanes || !showInspector) && (
            <DocumentBox flex={2} overflow="hidden">
              <PortalProvider
                element={portalElement}
                __unstable_elements={{documentScrollElement: documentScrollElement}}
              >
                <BoundaryElementProvider element={documentScrollElement}>
                  <VirtualizerScrollInstanceProvider
                    scrollElement={documentScrollElement}
                    containerElement={formContainerElement}
                  >
                    {activeView.type === 'form' && !isPermissionsLoading && ready && (
                      <>
                        <PermissionCheckBanner
                          granted={Boolean(permissions?.granted)}
                          requiredPermission={requiredPermission}
                        />
                        {!isDeleting && isDeleted && (
                          <DeletedDocumentBanner revisionId={lastNonDeletedRevId} />
                        )}
                        <ReferenceChangedBanner />
                      </>
                    )}

                    <Scroller
                      $disabled={layoutCollapsed || false}
                      data-testid="document-panel-scroller"
                      ref={setDocumentScrollElement}
                      // Note: this is to make sure the scroll container is changed
                      // when the selected group changes which causes virtualization
                      // to re-render and re-measure the scroll container
                      key={`${selectedGroup?.name}-${documentId}}`}
                    >
                      <FormView
                        hidden={formViewHidden}
                        key={documentId + (ready ? '_ready' : '_pending')}
                        margins={margins}
                        ref={formContainerElement}
                      />
                      {activeViewNode}
                    </Scroller>

                    {inspectDialog}

                    <div data-testid="document-panel-portal" ref={portalRef} />
                  </VirtualizerScrollInstanceProvider>
                </BoundaryElementProvider>
              </PortalProvider>
            </DocumentBox>
          )}

          {showInspector && (
            <BoundaryElementProvider element={rootElement}>
              <DocumentInspectorPanel
                documentId={documentId}
                documentType={schemaType.name}
                flex={1}
              />
            </BoundaryElementProvider>
          )}
        </Flex>
      </PaneContent>
    </>
  )
}
