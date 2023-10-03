import {FeedClientOptions} from '@knocklabs/client'

type ViewModeID = 'inbox' | 'archived'

export interface ViewMode {
  archived: FeedClientOptions['archived']
  id: ViewModeID
  title: string
}
