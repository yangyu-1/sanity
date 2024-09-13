import {Box, Card, type CardTone, Checkbox, Flex, Stack} from '@sanity/ui'
import {type MouseEventHandler, type ReactNode, useCallback, useRef} from 'react'
import {styled} from 'styled-components'

import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {DragHandle} from '../common/DragHandle'
import {MOVING_ITEM_CLASS_NAME} from '../common/list'

interface RowLayoutProps {
  tone?: CardTone
  dragHandle?: boolean
  onSelect?: (range: boolean) => void
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

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      elementRef.current?.focus()
    }
  })

  const handleSelectionChange = useCallback(
    (event) => {
      if (event.currentTarget.checked) {
        onSelect?.(event.shiftKey)
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
    >
      <Stack space={1}>
        <Flex align="center" gap={1}>
          {selectable ? (
            <Flex as="label" padding={1}>
              <Checkbox checked={selected} onClick={handleSelectionChange} />
            </Flex>
          ) : (
            dragHandle && <DragHandle paddingY={3} readOnly={readOnly} />
          )}

          <Box flex={1}>{children}</Box>

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
