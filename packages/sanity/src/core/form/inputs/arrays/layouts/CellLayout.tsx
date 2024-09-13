import {Box, Card, type CardTone, Checkbox, Flex} from '@sanity/ui'
import {type ComponentProps, type MouseEventHandler, type ReactNode, useCallback} from 'react'
import {styled} from 'styled-components'

import {DragHandle} from '../common/DragHandle'
import {MOVING_ITEM_CLASS_NAME} from '../common/list'

interface RowLayoutProps {
  tone?: CardTone
  dragHandle?: boolean
  presence?: ReactNode
  validation?: ReactNode
  menu?: ReactNode
  footer?: ReactNode
  selectable?: boolean
  onSelect: (range?: boolean) => void
  onUnselect?: () => void
  open?: boolean
  children?: ReactNode
}

const FooterFlex = styled(Flex)`
  min-height: 33px;
`
const PresenceFlex = styled(Flex)`
  position: absolute;
  top: 0;
  right: 0;
  height: 33px;
`

const DragHandleCard = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
`

const CheckBoxCard = styled(Flex)`
  position: absolute;
  top: 0;
  left: 0;
`

const Root = styled(Card)`
  transition: border-color 250ms;
  box-sizing: border-box;
  position: relative;

  @media (hover: hover) {
    ${DragHandleCard} {
      opacity: 0;
    }

    &:hover,
    &:focus-within {
      ${DragHandleCard} {
        opacity: 1;
      }
    }
  }

  .${MOVING_ITEM_CLASS_NAME} & {
    box-shadow:
      0 0 0 0,
      0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }

  &[aria-selected='true'] {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color);
  }
`

/**
 * Use this to get the layout for grid items
 */
export function CellLayout(props: RowLayoutProps & Omit<ComponentProps<typeof Root>, 'onSelect'>) {
  const {
    validation,
    selected,
    tone,
    presence,
    children,
    selectable,
    open,
    onSelect,
    onUnselect,
    dragHandle,
    menu,
    footer,
    readOnly,
    ...rest
  } = props

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
      forwardedAs={Flex}
      direction="column"
      border
      selected={selected || open}
      aria-selected={selected || open}
      radius={1}
      tone={tone}
      {...rest}
    >
      {children}

      {selectable ? (
        <CheckBoxCard>
          <Card as="label" display="flex" margin={0} padding={2} radius={2} tone="inherit">
            <Checkbox checked={selected} onClick={handleSelectionChange} />
          </Card>
        </CheckBoxCard>
      ) : (
        dragHandle && (
          <DragHandleCard
            margin={1}
            radius={2}
            display="flex"
            tone="inherit"
            data-ui="DragHandleCard"
          >
            <DragHandle $grid mode="ghost" readOnly={!!readOnly} />
          </DragHandleCard>
        )
      )}

      {presence && (
        <PresenceFlex align="center" marginX={1}>
          {presence}
        </PresenceFlex>
      )}

      <FooterFlex align="center" paddingX={1} sizing="border" justify="space-between">
        <Flex>{validation}</Flex>
        <Box>{footer}</Box>
        {menu}
      </FooterFlex>
    </Root>
  )
}
