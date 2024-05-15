/* eslint-disable i18next/no-literal-string */
import {Select, TextInput} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {useCallback, useEffect, useState} from 'react'
import {type SanityDocument} from 'sanity'

import {useSheetListContext} from './SheetListContext'

export const SheetListCell = (
  props: CellContext<SanityDocument, unknown> & {
    type: any
  },
) => {
  const {column, row} = props
  const cellId = `cell-${props.column.id}-${props.row.index}`
  const [renderValue, setRenderValue] = useState(props.getValue())
  const {
    setFocusedCellId,
    focusedCellDetails,
    selectedCellIndexes,
    onSelectedCellChange,
    resetFocusSelection,
    resetSelection,
  } = useSheetListContext()

  const handleOnFocus = useCallback(() => {
    setFocusedCellId(column.id, row.index)
  }, [column.id, row.index, setFocusedCellId])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (document.activeElement?.id === `cell-${column.id}-${row.index}`) {
        if (event.shiftKey) {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            onSelectedCellChange('down')
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            onSelectedCellChange('up')
          }
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          resetSelection()
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          resetFocusSelection()
          setFocusedCellId(column.id, row.index + (event.key === 'ArrowDown' ? 1 : -1))
        }
      }
    }

    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('mousedown', resetSelection)

    const handlePaste = (event: ClipboardEvent) => {
      if (
        focusedCellDetails?.colId === column.id &&
        (selectedCellIndexes.includes(row.index) || focusedCellDetails?.rowIndex === row.index)
      ) {
        event.preventDefault()
        const clipboardData = event.clipboardData?.getData('Text')

        if (typeof clipboardData === 'string' || typeof clipboardData === 'number') {
          setRenderValue(clipboardData)
        }
      }
    }

    document.addEventListener('paste', handlePaste)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('mousedown', resetSelection)
    }
  }, [
    resetFocusSelection,
    column.id,
    focusedCellDetails?.colId,
    onSelectedCellChange,
    props.table.options.meta,
    row.index,
    selectedCellIndexes,
    handleOnFocus,
    resetSelection,
    focusedCellDetails?.rowIndex,
    setFocusedCellId,
  ])

  useEffect(() => {
    const focusedCellId = `cell-${focusedCellDetails?.colId}-${focusedCellDetails?.rowIndex}`
    if (cellId === focusedCellId && document.activeElement?.id !== focusedCellId) {
      document.getElementById(cellId)?.focus()
    }
  }, [
    cellId,
    focusedCellDetails?.colId,
    focusedCellDetails?.rowIndex,
    props.column.id,
    props.row.index,
  ])

  const handleOnBlur = () => {
    resetFocusSelection()
  }

  if (props.type.name === 'boolean') {
    return (
      <Select
        onChange={() => null}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        key={cellId}
        id={cellId}
        radius={0}
        style={{
          boxShadow: 'none',
        }}
        value={JSON.stringify(renderValue)}
      >
        <option value="true">True</option>
        <option value="false">False</option>
      </Select>
    )
  }

  return (
    <TextInput
      size={0}
      key={cellId}
      id={cellId}
      radius={0}
      border={false}
      style={{
        border:
          focusedCellDetails?.colId === props.column.id &&
          selectedCellIndexes.includes(props.row.index)
            ? '1px solid green'
            : '1px solid transparent',
      }}
      value={
        typeof renderValue === 'string' || typeof renderValue === 'number'
          ? renderValue
          : JSON.stringify(renderValue)
      }
      onChange={() => null}
      onFocus={handleOnFocus}
      onBlur={handleOnBlur}
    />
  )
}