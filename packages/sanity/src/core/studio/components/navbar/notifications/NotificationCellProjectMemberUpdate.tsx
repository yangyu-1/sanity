import {FeedItem} from '@knocklabs/client'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'
import {UserAvatar} from '../../../../components'
import {useUser} from '../../../../store'

interface NotificationCellMentionProps {
  item: FeedItem
  suffix: string
}

export function NotificationCellProjectMemberUpdate({item, suffix}: NotificationCellMentionProps) {
  const projectMember = item.data?.memberId
  const [user] = useUser(projectMember)
  if (!user) {
    return null
  }

  return (
    <Flex align="center" gap={3}>
      {/* Project member */}
      {projectMember && (
        <Box marginTop={1}>
          <UserAvatar size={0} user={projectMember} />
        </Box>
      )}
      <Stack space={3}>
        <Text size={1}>
          <span style={{fontWeight: 500}}>{user.displayName}</span> {suffix}
        </Text>
      </Stack>
    </Flex>
  )
}
