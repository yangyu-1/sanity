import {ViewMode} from './types'

export const WORKFLOW_IDS = [
  'comments-branched',
  /*
  'feature-invitation',
  'maintenance-alert',
  'overage-alert',
  'project-member-added',
  'project-member-removed',
  */
]

export const VIEW_MODES: ViewMode[] = [
  {
    archived: 'exclude',
    id: 'inbox',
    title: 'Inbox',
  },
  {
    archived: 'only',
    id: 'archived',
    title: 'Archived',
  },
]
