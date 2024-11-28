import {TransferIcon} from '@sanity/icons'
import {useMemo} from 'react'

import {type ActionComponent, type DocumentActionProps} from '../../../config'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'

export const CompareVersionsAction: ActionComponent<DocumentActionProps> = () => {
  const {t} = useTranslation(releasesLocaleNamespace)

  return useMemo(
    () => ({
      icon: TransferIcon,
      label: t('action.compare-versions'),
      title: t('actions.create.text'),
      group: ['paneActions'],
    }),
    [t],
  )
}
