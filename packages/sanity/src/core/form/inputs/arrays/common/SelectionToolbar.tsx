import {ChevronDownIcon, CloseIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {Card, Checkbox, Flex, Inline, Menu, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {styled} from 'styled-components'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useCopyPaste} from '../../../../studio'
import {useGetFormValue} from '../../../contexts/GetFormValue'
import {type FormDocumentValue} from '../../../types'

interface SelectionToolbarProps {
  invalidItemKeys: string[]
  selectedItemKeys: string[]
  path: Path
  id: string
  allKeys: string[]
  onItemSelect: (item: string, range?: boolean) => void
  onItemUnselect: (item: string) => void
  onSelectedItemsRemove: () => void
  onSelectEnd: () => void
}

const StickyCard = styled(Card)`
  position: sticky;
  top: 0;
  z-index: 1;
`

export function SelectionToolbar(props: SelectionToolbarProps) {
  const {
    invalidItemKeys,
    selectedItemKeys,
    onItemSelect,
    onItemUnselect,
    allKeys,
    path,
    id,
    onSelectedItemsRemove,
    onSelectEnd,
  } = props
  const handleSelectInvalid = useCallback(() => {
    invalidItemKeys.forEach((key) => onItemSelect(key))
  }, [invalidItemKeys, onItemSelect])
  const handleSelectAll = useCallback(() => {
    allKeys.forEach((key) => onItemSelect(key))
  }, [allKeys, onItemSelect])

  const handleSelectNone = useCallback(() => {
    selectedItemKeys.forEach((key) => onItemUnselect(key))
  }, [onItemUnselect, selectedItemKeys])

  const allSelected = selectedItemKeys.length === allKeys.length
  const itemTxt = (len: number) => <>item{len === 1 ? '' : 's'}</>

  const {onCopy} = useCopyPaste()
  const getFormValue = useGetFormValue()

  const handleCopySelection = useCallback(async () => {
    const selectedPaths: Path[] = selectedItemKeys.map((itemKey) => [{_key: itemKey}])
    await onCopy(path, getFormValue([]) as FormDocumentValue, {
      selection: selectedPaths,
      context: {source: 'unknown'},
    })
  }, [getFormValue, onCopy, path, selectedItemKeys])

  return (
    <StickyCard display="flex" padding={2} border tone="primary" radius={2}>
      <>
        <Flex flex={1} gap={3} paddingLeft={1} align="center" justify="flex-start">
          <Inline space={2}>
            <Checkbox
              indeterminate={!allSelected && selectedItemKeys.length > 0}
              checked={allSelected}
              onClick={allSelected ? handleSelectNone : handleSelectAll}
            />
            <MenuButton
              id={`${id}-selectMenuButton`}
              button={
                <Button
                  mode="bleed"
                  icon={ChevronDownIcon}
                  tooltipProps={{
                    content: 'Select…',
                  }}
                />
              }
              menu={
                <Menu>
                  <MenuItem
                    text={`Select all (${allKeys.length})`}
                    disabled={allSelected}
                    onClick={handleSelectAll}
                  />
                  <MenuItem
                    text="Select none"
                    disabled={selectedItemKeys.length === 0}
                    onClick={handleSelectNone}
                  />
                  {invalidItemKeys.length > 0 ? (
                    <MenuItem
                      text={`Select invalid (${invalidItemKeys.length})`}
                      disabled={invalidItemKeys.length === 0}
                      onClick={handleSelectInvalid}
                    />
                  ) : null}
                </Menu>
              }
              popover={{portal: true, tone: 'default'}}
            />
          </Inline>
          <Inline space={1}>
            <Text size={1} muted>
              {selectedItemKeys.length} {itemTxt(selectedItemKeys.length)} selected
            </Text>
          </Inline>
        </Flex>
        <Flex gap={2} align="center">
          {selectedItemKeys.length ? (
            <>
              <Button
                tone="critical"
                mode="bleed"
                icon={TrashIcon}
                text="Remove"
                tooltipProps={{
                  content: (
                    <Text size={1}>
                      Remove {selectedItemKeys.length} {itemTxt(selectedItemKeys.length)}
                    </Text>
                  ),
                }}
                onClick={onSelectedItemsRemove}
              />
              <Button
                mode="bleed"
                icon={CopyIcon}
                text="Copy"
                tooltipProps={{
                  content: (
                    <Text size={1}>
                      Copy {selectedItemKeys.length} {itemTxt(selectedItemKeys.length)}
                    </Text>
                  ),
                }}
                onClick={handleCopySelection}
              />
            </>
          ) : null}
          <Button
            mode="bleed"
            icon={CloseIcon}
            onClick={onSelectEnd}
            tooltipProps={{content: 'Cancel'}}
          />
        </Flex>
      </>
    </StickyCard>
  )
}
