import {createContext, type ReactNode, useContext, useMemo} from 'react'

import {type DocumentFieldAction} from '../../../config'
import {EMPTY_ARRAY} from '../../../util'

/**
 * @internal
 */
export interface DocumentFieldActionsContextValue {
  actions: DocumentFieldAction[]
}

const DocumentFieldActionsContext = createContext<DocumentFieldActionsContextValue | null>(null)

/**
 * @internal
 */
export function DocumentFieldActionsProvider(props: {
  actions: DocumentFieldAction[] | undefined
  children: ReactNode
}) {
  const value = useMemo(() => ({actions: props.actions || EMPTY_ARRAY}), [props.actions])
  return (
    <DocumentFieldActionsContext.Provider value={value}>
      {props.children}
    </DocumentFieldActionsContext.Provider>
  )
}

/**
 * @internal
 */
export function useDocumentFieldActions() {
  const context = useContext(DocumentFieldActionsContext)
  if (!context) {
    throw new Error('useDocumentFieldActions must be used within a DocumentFieldActionsProvider')
  }
  return context.actions
}
