import {useTimeAgo} from './useTimeAgo'

/**
 * React hook which returns a human readable string of the provided document's status.
 *
 * @internal
 * @hidden
 */
export function useDocumentStatusTimeAgo({
  draftUpdatedAt,
  publishedUpdatedAt,
}: {
  draftUpdatedAt?: string
  publishedUpdatedAt?: string
}): string | undefined {
  const updatedDateTimeAgo = useTimeAgo(draftUpdatedAt || '', {minimal: true, agoSuffix: true})
  const publishedTimeAgo = useTimeAgo(publishedUpdatedAt || '', {minimal: true, agoSuffix: true})

  let label
  if (!draftUpdatedAt && publishedTimeAgo) {
    label = `Published ${publishedTimeAgo}`
  }
  if (draftUpdatedAt && !publishedTimeAgo) {
    label = `Not published`
  }
  if (draftUpdatedAt && publishedTimeAgo) {
    label = `Published ${publishedTimeAgo}`
  }
  if (label && updatedDateTimeAgo) {
    label += ` (Updated ${updatedDateTimeAgo})`
  }

  return label
}
