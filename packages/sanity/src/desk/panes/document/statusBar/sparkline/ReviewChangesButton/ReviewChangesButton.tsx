import {Inline, Text} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from 'sanity'
import {AnimatedStatusIcon} from './AnimatedStatusIcon'

interface ReviewChangesButtonProps
  extends Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'width' | 'as' | 'type'> {
  status?: 'changes' | 'saved' | 'syncing'
}

const ReviewButton = React.forwardRef(function ReviewButton(
  props: ReviewChangesButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const {status} = props

  if (!status) {
    return null
  }

  const tone = status === 'saved' ? 'positive' : 'default'

  return (
    <Inline space={3}>
      {status === 'syncing' && (
        <Text muted size={1}>
          Saving...
        </Text>
      )}
      {status === 'saved' && (
        <TextWithTone size={1} tone={tone}>
          Saved!
        </TextWithTone>
      )}

      <TextWithTone size={1} tone={tone}>
        <AnimatedStatusIcon status={status} />
      </TextWithTone>
    </Inline>
  )
})

export const ReviewChangesButton = React.memo(ReviewButton)
