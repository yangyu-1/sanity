import {useTimeAgo} from './useTimeAgo'

/**
 * React hook which returns a human readable string of the provided document's status.
 *
 * @internal
 * @hidden
 */
export function useDocumentStatusTimeAgo({
  draftUpdatedAt,
  hidePublishedDate,
  publishedUpdatedAt,
}: {
  draftUpdatedAt?: string
  hidePublishedDate?: boolean
  publishedUpdatedAt?: string
}): string | undefined {
  const updatedDateTimeAgo = useTimeAgo(draftUpdatedAt || '', {minimal: true, agoSuffix: true})
  const publishedTimeAgo = useTimeAgo(publishedUpdatedAt || '', {minimal: true, agoSuffix: true})

  let label
  if (!draftUpdatedAt && publishedTimeAgo) {
    label = `Published${hidePublishedDate ? '' : ` ${publishedTimeAgo}`}`
  }
  if (draftUpdatedAt && !publishedTimeAgo) {
    label = `Not published`
  }
  if (draftUpdatedAt && publishedTimeAgo) {
    label = `Published${hidePublishedDate ? '' : ` ${publishedTimeAgo}`}`
  }
  if (label && updatedDateTimeAgo) {
    label += ` (Updated ${updatedDateTimeAgo})`
  }

  return label
}
