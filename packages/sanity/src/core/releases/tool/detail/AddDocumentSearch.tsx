import {useTelemetry} from '@sanity/telemetry/react'
import {type SanityDocumentLike} from '@sanity/types'
import {LayerProvider, PortalProvider, useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {AddedVersion} from 'sanity'

import {useReleaseOperations} from '../../../store/release/useReleaseOperations'
import {SearchPopover} from '../../../studio/components/navbar/search/components/SearchPopover'
import {SearchProvider} from '../../../studio/components/navbar/search/contexts/search/SearchProvider'
import {getBundleIdFromReleaseDocumentId} from '../../util/getBundleIdFromReleaseDocumentId'
import {getCreateVersionOrigin} from '../../util/util'

export function AddDocumentSearch({
  open,
  onClose,
  releaseId,
}: {
  open: boolean
  onClose: () => void
  releaseId: string
}): JSX.Element {
  const {createVersion} = useReleaseOperations()
  const toast = useToast()
  const telemetry = useTelemetry()

  const addDocument = useCallback(
    async (item: Pick<SanityDocumentLike, '_id' | '_type'>) => {
      try {
        await createVersion(getBundleIdFromReleaseDocumentId(releaseId), item._id)

        toast.push({
          closable: true,
          status: 'success',
          title: 'Document added to release',
        })

        const origin = getCreateVersionOrigin(item._id)

        telemetry.log(AddedVersion, {
          documentOrigin: origin,
        })
      } catch (error) {
        /* empty */

        toast.push({
          closable: true,
          status: 'error',
          title: error.message,
        })
      }
    },
    [createVersion, releaseId, telemetry, toast],
  )

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <LayerProvider zOffset={1}>
      <SearchProvider>
        <PortalProvider>
          <SearchPopover
            onClose={handleClose}
            onItemSelect={addDocument}
            open={open}
            disableIntentLink
          />
        </PortalProvider>
      </SearchProvider>
    </LayerProvider>
  )
}
