import {CheckmarkCircleIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../../../config/document/fieldActions/define'
import {useParentArrayInput} from '../../members/object/fields/ArrayOfObjectsField'
import {defineActionItem} from './define'

export const selectAction = defineDocumentFieldAction({
  name: 'select',
  useAction() {
    const parentArrayInput = useParentArrayInput()

    const onAction = useCallback(() => {
      if (parentArrayInput?.active) {
        parentArrayInput?.onSelectEnd()
      } else {
        parentArrayInput?.onSelectBegin()
      }
    }, [parentArrayInput])
    if (!parentArrayInput) {
      return null
    }

    return (
      parentArrayInput &&
      defineActionItem({
        type: 'action',
        icon: CheckmarkCircleIcon,
        onAction,
        title: parentArrayInput.active ? 'Cancel select items' : 'Select items',
      })
    )
  },
})
