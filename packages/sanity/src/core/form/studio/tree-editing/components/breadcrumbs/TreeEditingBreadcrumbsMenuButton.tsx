/* eslint-disable @sanity/i18n/no-attribute-string-literals */
import {Card, Flex, Popover, type PopoverProps, useClickOutside} from '@sanity/ui'
import {cloneElement, type ReactElement, useCallback, useState} from 'react'
import ReactFocusLock from 'react-focus-lock'
import {type Path} from 'sanity'
import styled, {css} from 'styled-components'

import {type TreeEditingBreadcrumb} from '../../types'
import {ITEM_HEIGHT, MAX_DISPLAYED_ITEMS} from './constants'
import {TreeEditingBreadcrumbsMenu} from './TreeEditingBreadcrumbsMenu'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom-start']

const RootFlex = styled(Flex)``

export const PopoverHeaderCard = styled(Card)`
  min-height: max-content;
`

export const PopoverListFlex = styled(Flex)<{
  $maxDisplayedItems: number
  $itemHeight: number
}>((props) => {
  const {$maxDisplayedItems, $itemHeight} = props

  return css`
    --item-height: ${$itemHeight}px;
    --max-items: ${$maxDisplayedItems};
    --list-padding: 0.5rem;

    position: relative;
    max-height: calc(var(--item-height) * var(--max-items) + var(--list-padding));
    min-height: calc((var(--item-height) * 1));
  `
})

const StyledPopover = styled(Popover)(() => {
  return css`
    [data-ui='Popover__wrapper'] {
      width: 250px;
      display: flex;
      flex-direction: column;
      border-radius: ${({theme}) => theme.sanity.radius[3]}px;
      position: relative;
      overflow: hidden;
      overflow: clip;
    }
  `
})

interface TreeEditingBreadcrumbsMenuButtonProps {
  button: ReactElement
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
}

export function TreeEditingBreadcrumbsMenuButton(
  props: TreeEditingBreadcrumbsMenuButtonProps,
): JSX.Element {
  const {button, items, selectedPath, onPathSelect} = props
  const [open, setOpen] = useState<boolean>(false)
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)
  // const [textInputElement, setTextInputElement] = useState<HTMLInputElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const closeAndFocus = useCallback(() => {
    if (!open) return

    setOpen(false)
    buttonElement?.focus()
  }, [buttonElement, open])

  const handlePopoverKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const {key, shiftKey} = event

      if ((shiftKey && key === 'Tab') || key === 'Escape' || key === 'Tab') {
        closeAndFocus()
      }
    },
    [closeAndFocus],
  )

  const handleButtonClick = useCallback(() => {
    const next = !open

    setOpen(next)
  }, [open])

  const handlePathSelect = useCallback(
    (path: Path) => {
      onPathSelect(path)
      setOpen(false)
    },
    [onPathSelect],
  )

  useClickOutside(() => setOpen(false), [rootElement, buttonElement])

  const content = (
    <RootFlex direction="column" flex={1} forwardedAs={ReactFocusLock} height="fill">
      {/* <PopoverHeaderCard sizing="border">
        <Stack>
          <Card borderBottom padding={1}>
            <TextInput fontSize={1} radius={2} ref={setTextInputElement} disabled={!open} />
          </Card>
        </Stack>
      </PopoverHeaderCard> */}

      <PopoverListFlex
        $itemHeight={ITEM_HEIGHT}
        $maxDisplayedItems={MAX_DISPLAYED_ITEMS}
        direction="column"
        overflow="hidden"
      >
        <TreeEditingBreadcrumbsMenu
          items={items}
          onPathSelect={handlePathSelect}
          selectedPath={selectedPath}
          // textInputElement={textInputElement}
          textInputElement={null}
        />
      </PopoverListFlex>
    </RootFlex>
  )

  const clonedButton = cloneElement(button, {
    'aria-expanded': open,
    'aria-haspopup': 'true',
    'id': 'tree-breadcrumb-menu-button',
    'onClick': handleButtonClick,
    'ref': setButtonElement,
    'selected': open,
  })

  return (
    <StyledPopover
      animate
      constrainSize
      content={content}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      onKeyDown={handlePopoverKeyDown}
      open={open}
      placement="bottom-start"
      portal
      ref={setRootElement}
    >
      {clonedButton}
    </StyledPopover>
  )
}
