import {route} from 'sanity/router'

import {definePlugin} from '../../config'
// import {ReleasesStudioNavbar} from '../navbar/ReleasesStudioNavbar'
// import {ReleasesTool} from '../tool/ReleasesTool'
// import resolveDocumentActions from './documentActions'
// import {ReleasesStudioLayout} from './ReleasesStudioLayout'

// TODO: DiffView may not be the best name? DiffTool? DocumentDiffTool? VersionDiffTool?

/**
 * @internal
 */
export const DIFF_VIEW_NAME = 'sanity/diffView'

/**
 * @internal
 */
export const DIFF_VIEW_TOOL_NAME = 'diffView'

/**
 * @internal
 */
export const DIFF_VIEW_INTENT = 'diffView'

/**
 * @internal
 */
export const releases = definePlugin({
  name: DIFF_VIEW_NAME,
  studio: {
    components: {
      layout: ReleasesStudioLayout,
      navbar: ReleasesStudioNavbar,
    },
  },
  tools: [
    {
      name: DIFF_VIEW_TOOL_NAME,
      title: 'Releases',
      // component: ReleasesTool,
      router: route.create('/', [route.create('/:releaseId')]),
      canHandleIntent: (intent) => intent === DIFF_VIEW_INTENT,
      getIntentState(intent, params) {
        if (intent === DIFF_VIEW_INTENT) {
          // return {releaseId: params.id}
        }
        return null
      },
    },
  ],
  // i18n: {
  //   bundles: [releasesUsEnglishLocaleBundle],
  // },
  // document: {
  //   actions: (actions, context) => resolveDocumentActions(actions, context),
  // },
})
