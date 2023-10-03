import {KnockFeedProvider} from '@knocklabs/react-notification-feed'
import {User} from '@sanity/types'
import React, {useEffect, useState} from 'react'
import {useClient} from '../hooks'
import {useCurrentUser} from '../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'

// eslint-disable-next-line no-process-env
const KNOCK_PUBLIC_API_KEY = process.env.SANITY_STUDIO_DEBUG_KNOCK_PUBLIC_API_KEY
// eslint-disable-next-line no-process-env
const KNOCK_FEED_CHANNEL_ID = process.env.SANITY_STUDIO_DEBUG_KNOCK_FEED_CHANNEL_ID

interface NotificationProviderProps {
  children: React.ReactNode
}

type UserWithSanityId = User & {sanityUserId: string}

export function NotificationsProvider({children}: NotificationProviderProps): JSX.Element {
  const currentUser = useCurrentUser()
  const [currentUserSanityId, setCurrentUserSanityId] = useState<string | null>(null)

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  // @todo: Remove this quick and dirty fetch
  // It's used to obtain the current user's `sanityUserId` as Knock notifications are scoped to this ID.
  // Ideally, calls to `/users/me` should return this, so we can avoid this request altogether.
  useEffect(() => {
    async function fetchUser(): Promise<UserWithSanityId | null> {
      if (!currentUser?.id) {
        return null
      }
      const res = await client.request<UserWithSanityId>({
        uri: `/users/${currentUser.id}`,
        withCredentials: true,
        tag: 'users.get',
      })
      return res
    }

    fetchUser().then((res) => {
      if (res?.sanityUserId) {
        setCurrentUserSanityId(res.sanityUserId)
      }
    })
  }, [client, currentUser?.id])

  if (!currentUserSanityId || !KNOCK_PUBLIC_API_KEY || !KNOCK_FEED_CHANNEL_ID) {
    return <>{children}</>
  }

  return (
    <KnockFeedProvider
      apiKey={KNOCK_PUBLIC_API_KEY}
      feedId={KNOCK_FEED_CHANNEL_ID}
      rootless
      userId={currentUserSanityId}
    >
      <>{children}</>
    </KnockFeedProvider>
  )
}
