import {useRouter} from 'sanity/router'

import {type ReleaseType, useReleases} from '../../store/release'
import {type ReleaseDocument} from '../../store/release/types'
import {LATEST} from '../util/const'

/**
 * @internal
 */
export type CurrentPerspective = Omit<Partial<ReleaseDocument>, 'metadata'> & {
  metadata: {title: string; releaseType?: ReleaseType}
}
/**
 * @internal
 */
export interface PerspectiveValue {
  /* Return the current global release */
  currentGlobalBundle: CurrentPerspective
  /* Change the perspective in the studio based on the perspective name */
  setPerspective: (releaseId: string) => void
}

/**
 * TODO: Improve distinction between global and pane perspectives.
 *
 * @internal
 */
export function usePerspective(selectedPerspective?: string): PerspectiveValue {
  const router = useRouter()
  const {data: releases} = useReleases()
  const perspective = selectedPerspective ?? router.stickyParams.perspective

  // TODO: Should it be possible to set the perspective within a pane, rather than globally?
  const setPerspective = (releaseId: string | undefined) => {
    if (releaseId === 'drafts') {
      router.navigateStickyParam('perspective', '')
    } else if (releaseId === 'published') {
      router.navigateStickyParam('perspective', 'published')
    } else {
      router.navigateStickyParam('perspective', `release.${releaseId}`)
    }
  }

  const selectedBundle =
    perspective && releases
      ? releases.find((release: ReleaseDocument) => `release.${release._id}` === perspective)
      : LATEST

  // TODO: Improve naming; this may not be global.
  const currentGlobalBundle =
    perspective === 'published'
      ? {
          _id: 'published',
          metadata: {
            title: 'Published',
          },
        }
      : selectedBundle || LATEST

  return {
    setPerspective,
    currentGlobalBundle: currentGlobalBundle,
  }
}
