import {Virtualizer} from '@tanstack/react-virtual'
import {createContext, Dispatch, MouseEvent, SetStateAction} from 'react'

export interface CommandListContextValue {
  focusInputElement: () => void
  getTopIndex: () => number
  itemIndices: (number | null)[]
  onChildMouseDown: (event: MouseEvent) => void
  onChildMouseEnter: (index: number) => () => void
  setChildContainerElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setInputElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setPointerOverlayElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setVirtualizer: (virtualizer: Virtualizer<HTMLDivElement, Element>) => void
  setVirtualListElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  virtualizer?: Virtualizer<HTMLDivElement, Element> | null
  virtualItemDataAttr: Record<string, ''>
  virtualListElement: HTMLDivElement | null
}

export const CommandListContext = createContext<CommandListContextValue | undefined>(undefined)
