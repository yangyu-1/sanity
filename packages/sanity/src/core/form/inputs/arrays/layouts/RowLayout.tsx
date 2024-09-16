import {useSortable} from '@dnd-kit/sortable'
import {Box, Card, type CardTone, Checkbox, Flex, Stack} from '@sanity/ui'
import {type MouseEventHandler, type ReactNode, useCallback, useContext, useRef} from 'react'
import {SortableItemIdContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {MOVING_ITEM_CLASS_NAME} from '../common/list'

interface RowLayoutProps {
  tone?: CardTone
  dragHandle?: boolean
  onSelect?: (options: {metaKey?: boolean; shiftKey?: boolean}) => void
  onUnselect?: () => void
  focused?: boolean
  presence?: ReactNode
  validation?: ReactNode
  menu?: ReactNode
  footer?: ReactNode
  selected?: boolean
  selectable?: boolean
  open?: boolean
  children?: ReactNode
  readOnly: boolean
}

const Root = styled(Card)`
  position: relative;
  border: 1px solid transparent;
  transition: border-color 250ms;

  .${MOVING_ITEM_CLASS_NAME} & {
    border-color: var(--card-shadow-umbra-color);
    box-shadow:
      0 0 0 0,
      0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }

  &:hover {
    border-color: var(--card-shadow-umbra-color);
  }

  &[aria-selected='true'] {
    border-color: var(--card-focus-ring-color);
  }
`
const PreviewWrapper = styled(Box)`
  border: 1px solid transparent;
  transition: border-color 250ms;

  &[aria-selected='true'] {
    border-color: var(--card-focus-ring-color);
  }
`
const noop = () => {}

export function RowLayout(props: RowLayoutProps) {
  const {
    validation,
    open,
    tone,
    presence,
    focused,
    onSelect,
    onUnselect,
    selected,
    selectable,
    children,
    dragHandle,
    menu,
    footer,
    readOnly,
  } = props

  const elementRef = useRef<HTMLDivElement | null>(null)
  const id = useContext(SortableItemIdContext)!
  const {listeners, attributes} = useSortable({id, disabled: readOnly})

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      elementRef.current?.focus()
    }
  })

  const handleCheckboxChange = useCallback(
    (event) => {
      if (event.currentTarget.checked) {
        onSelect?.({shiftKey: event.shiftKey, metaKey: true})
      } else {
        onUnselect?.()
      }
    },
    [onSelect, onUnselect],
  ) satisfies MouseEventHandler<HTMLInputElement>

  return (
    <Root
      ref={elementRef}
      selected={selected || open}
      aria-selected={selected || open}
      radius={1}
      padding={1}
      tone={tone}
      {...listeners}
      {...attributes}
    >
      <Stack space={1}>
        <Flex align="center" gap={1}>
          <Flex as="label" padding={1}>
            <Checkbox
              checked={!!selected}
              onClick={handleCheckboxChange}
              onChange={
                // shut up, react
                noop
              }
            />
          </Flex>

          <Box
            flex={1}
            onClickCapture={(e) => {
              if (selectable && (e.metaKey || e.shiftKey)) {
                e.preventDefault()
                e.stopPropagation()
                onSelect?.({metaKey: true, shiftKey: e.shiftKey})
              }
            }}
          >
            {children}
          </Box>

          {(presence || validation || menu) && (
            <Flex align="center" flex="none" gap={2} style={{lineHeight: 0}}>
              {presence && <Box flex="none">{presence}</Box>}
              {validation && <Box flex="none">{validation}</Box>}
              {menu}
            </Flex>
          )}
        </Flex>
        {footer}
      </Stack>
    </Root>
  )
}
