import {filter, firstValueFrom, switchMap, zip} from 'rxjs'

import {type AddonDatasetStore} from '../../../studio'

interface RemoveOperationProps {
  id: string
  onRemove?: (id: string) => void
  addonDatasetStore: AddonDatasetStore
}

export async function removeOperation(props: RemoveOperationProps): Promise<void> {
  const {id, onRemove, addonDatasetStore} = props
  onRemove?.(id)

  await firstValueFrom(
    addonDatasetStore.client$.pipe(
      filter((clientStore) => clientStore.state === 'ready'),
      switchMap(({client}) =>
        zip(
          client.observable.delete({query: `*[_type == "comment" && parentCommentId == "${id}"]`}),
          client.observable.delete(id),
        ),
      ),
    ),
  )
}
