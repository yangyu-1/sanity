import {useCallback, useRef} from 'react'
import styled from 'styled-components'

import {CommandList} from '../CommandList'
import {type CommandListHandle, type CommandListRenderItemCallback} from '../types'

const ITEMS = [...Array(5000).keys()].map((i) => `Item ${i}`)

const StyledLink = styled.a`
  background: #1a1a1a;
  font-family: sans-serif;
  display: block;
  padding: 5px;
  &[data-active] {
    background: #333;
  }
`

export default function MinimalStory() {
  const commandListRef = useRef<CommandListHandle | null>(null)

  const handleSelectFirst = useCallback(() => {
    commandListRef?.current?.selectIndex(0)
  }, [])

  const handleSelectNext = useCallback(() => {
    commandListRef?.current?.selectNext()
  }, [])

  const handleSelectPrevious = useCallback(() => {
    commandListRef?.current?.selectPrevious()
  }, [])

  const renderItem = useCallback<CommandListRenderItemCallback<string>>((item) => {
    return <StyledLink>{item}</StyledLink>
  }, [])

  return (
    <div
      style={{
        height: '400px',
        maxWidth: '400px',
        padding: '25px',
        width: '100%',
      }}
    >
      <div style={{height: '400px', position: 'relative'}}>
        <CommandList
          ariaLabel="Children"
          fixedHeight
          itemHeight={28}
          items={ITEMS}
          overscan={20}
          ref={commandListRef}
          renderItem={renderItem}
        />
      </div>

      <button type="button" onClick={handleSelectFirst}>
        Select first item
      </button>

      <button type="button" onClick={handleSelectNext}>
        Select next item
      </button>

      <button type="button" onClick={handleSelectPrevious}>
        Select previous item
      </button>
    </div>
  )
}
