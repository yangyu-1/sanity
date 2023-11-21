import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, ButtonTone, Flex} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'
import {useTimeAgo} from 'sanity'

export interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
}

const SIZE = 4 // px

const Dot = styled(Box)<{$draft?: boolean; $published: boolean}>(({theme, $draft, $published}) => {
  let tone: ButtonTone = 'default'
  if ($published) {
    tone = $draft ? 'caution' : 'positive'
  }

  const color = theme.sanity.color.solid[tone].enabled.bg

  return css`
    background: ${$published ? color : 'var(--card-muted-fg-color)'};
    border: ${$published ? `1px solid ${color}` : '1px solid var(--card-muted-fg-color)'};
    border-radius: ${SIZE}px;
    height: ${SIZE}px;
    opacity: ${$published ? 1 : 0.25};
    width: ${SIZE}px;
  `
})

export function DocumentStatus({draft, published}: DocumentStatusProps) {
  const publishDate = published && '_updatedAt' in published && published._updatedAt
  const publishedTimeAgo = useTimeAgo(publishDate || '', {minimal: true, agoSuffix: true})

  if ((!draft && !published) || (!draft && published)) {
    return null
  }

  let label
  if (draft && !published) {
    label = 'Unpublished'
  }
  if (draft && published) {
    label = `Published ${publishedTimeAgo} (edited)`
  }

  return (
    <Flex align="center" height="fill" justify="center">
      <Dot aria-label={label} $draft={!!draft} $published={!!published} />
    </Flex>
  )
}
