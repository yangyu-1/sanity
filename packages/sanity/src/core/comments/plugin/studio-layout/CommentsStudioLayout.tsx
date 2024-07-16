import {ConditionalWrapper} from '../../../../ui-components'
import {type LayoutProps} from '../../../config'
import {useFeatureEnabled} from '../../../hooks'
import {CommentsOnboardingProvider, CommentsUpsellProvider} from '../../context'

export function CommentsStudioLayout(props: LayoutProps) {
  const {enabled, isLoading} = useFeatureEnabled('studioComments')

  return (
    <CommentsOnboardingProvider>
      <ConditionalWrapper
        condition={!enabled && !isLoading}
        // eslint-disable-next-line react/jsx-no-bind
        wrapper={(children) => <CommentsUpsellProvider>{children}</CommentsUpsellProvider>}
      >
        {props.renderDefault(props)}
      </ConditionalWrapper>
    </CommentsOnboardingProvider>
  )
}
