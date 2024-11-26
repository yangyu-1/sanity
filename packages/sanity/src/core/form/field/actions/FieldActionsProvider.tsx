import {type Path} from '@sanity/types'
import {memo, type PropsWithChildren, useCallback, useMemo, useSyncExternalStore} from 'react'
import {FieldActionsContext, type FieldActionsContextValue} from 'sanity/_singletons'

import {type DocumentFieldActionNode} from '../../../config'
import {pathToString} from '../../../field'
import {supportsTouch} from '../../../util'
import {useHoveredField} from '../useHoveredField'

type FieldActionsProviderProps = PropsWithChildren<{
  actions: DocumentFieldActionNode[]
  focused?: boolean
  path: Path
}>

/** @internal */
export const FieldActionsProvider = memo(function FieldActionsProvider(
  props: FieldActionsProviderProps,
) {
  const {actions, children, path, focused} = props
  const {
    onMouseEnter: onFieldMouseEnter,
    onMouseLeave: onFieldMouseLeave,
    store: hoveredStore,
  } = useHoveredField()

  const hovered = useSyncExternalStore(hoveredStore.subscribe, () => {
    const [hoveredPath] = hoveredStore.getSnapshot()
    return supportsTouch || (hoveredPath ? pathToString(path) === hoveredPath : false)
  })

  const handleMouseEnter = useCallback(() => {
    onFieldMouseEnter(path)
  }, [onFieldMouseEnter, path])

  const handleMouseLeave = useCallback(() => {
    onFieldMouseLeave(path)
  }, [onFieldMouseLeave, path])

  const context: FieldActionsContextValue = useMemo(
    () => ({
      actions,
      focused,
      hovered,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    [actions, focused, handleMouseEnter, handleMouseLeave, hovered],
  )

  return <FieldActionsContext.Provider value={context}>{children}</FieldActionsContext.Provider>
})
FieldActionsProvider.displayName = 'Memo(FieldActionsProvider)'
