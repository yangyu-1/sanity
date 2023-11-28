import React, {ReactElement, createElement, useCallback} from 'react'
import {Box, Card, Flex} from '@sanity/ui'
import {usePane} from '../../../components'
import {useDeskTool} from '../../../useDeskTool'
import {DOCUMENT_INSPECTOR_MAX_WIDTH, DOCUMENT_INSPECTOR_MIN_WIDTH} from '../constants'
import {useDocumentPane} from '../useDocumentPane'
// import {Resizable} from './Resizable'

interface DocumentInspectorPanelProps {
  documentId: string
  documentType: string
  flex?: number | number[]
}

export function DocumentInspectorPanel(props: DocumentInspectorPanelProps): ReactElement | null {
  const {documentId, documentType, flex} = props
  const {collapsed} = usePane()
  const {closeInspector, inspector} = useDocumentPane()
  const {features} = useDeskTool()

  const handleClose = useCallback(() => {
    if (inspector) closeInspector(inspector.name)
  }, [closeInspector, inspector])

  if (collapsed || !inspector) return null

  const element = createElement(inspector.component, {
    onClose: handleClose,
    documentId,
    documentType,
  })

  if (features.resizablePanes) {
    /*
    return (
      <Resizable
        as="aside"
        data-ui="DocumentInspectorPanel"
        flex={flex}
        height="fill"
        maxWidth={DOCUMENT_INSPECTOR_MAX_WIDTH}
        minWidth={DOCUMENT_INSPECTOR_MIN_WIDTH}
      >
        <Flex height="fill" flex={1} marginX={3}>
          <Card border flex={1} overflow="hidden" radius={3}>
            {element}
          </Card>
        </Flex>
      </Resizable>
    )
    */
    return (
      <Flex
        height="fill"
        flex={1}
        marginX={3}
        style={{
          maxWidth: DOCUMENT_INSPECTOR_MAX_WIDTH,
          minWidth: DOCUMENT_INSPECTOR_MIN_WIDTH,
        }}
      >
        <Card border flex={1} overflow="hidden" radius={3}>
          {element}
        </Card>
      </Flex>
    )
  }

  return (
    <Box as="aside" data-ui="DocumentInspectorPanel" flex={flex}>
      {element}
    </Box>
  )
}
