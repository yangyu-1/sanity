import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, ButtonTone, Flex} from '@sanity/ui'
import React from 'react'
import styled, {css} from 'styled-components'
import {TextWithTone, useTimeAgo} from 'sanity'
import {CheckmarkIcon} from '@sanity/icons'

export interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  showTick?: boolean // todo: rename, ya doofus
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

export function DocumentStatus({draft, published, showTick}: DocumentStatusProps) {
  const publishDate = published && '_updatedAt' in published && published._updatedAt
  const publishedTimeAgo = useTimeAgo(publishDate || '', {minimal: true, agoSuffix: true})

  if ((!draft && !published) || (!draft && published && !showTick)) {
    return null
  }

  let label
  if (draft && !published) {
    label = 'Unpublished'
  }
  if (draft && published) {
    label = `Published ${publishedTimeAgo} (edited)`
  }

  // refactor
  if (!draft && published && showTick) {
    return (
      <TextWithTone size={1} tone="positive">
        <CheckmarkIcon />
      </TextWithTone>
    )
  }

  return (
    <Flex align="center" height="fill" justify="center">
      <Dot aria-label={label} $draft={!!draft} $published={!!published} />
    </Flex>
  )
}
