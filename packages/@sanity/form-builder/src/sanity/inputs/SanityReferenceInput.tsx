import React, {ComponentProps, ForwardedRef, forwardRef, useCallback, useMemo, useRef} from 'react'

import {
  Marker,
  ObjectSchemaType,
  Path,
  Reference,
  ReferenceFilterSearchOptions,
  ReferenceOptions,
  ReferenceSchemaType,
  SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {FormFieldPresence} from '@sanity/base/presence'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'
import {getDraftId} from '@sanity/base/_internal'
import {
  Box,
  Flex,
  Inline,
  Tooltip,
  Text,
  Theme,
  Label,
  useRootTheme,
  ThemeColorToneKey,
} from '@sanity/ui'
import {EditIcon, PublishIcon} from '@sanity/icons'
import styled, {css} from 'styled-components'
import * as PathUtils from '@sanity/util/paths'
import Preview from '../../Preview'
import withValuePath from '../../utils/withValuePath'
import withDocument from '../../utils/withDocument'
import {useReferenceInputOptions} from '../contexts/ReferenceInputOptions'
import {ReferenceInput} from '../../inputs/ReferenceInput'
import PatchEvent from '../../PatchEvent'
import {ReferenceInfo} from '../../inputs/ReferenceInput/types'
import {TimeAgo} from '../../inputs/ReferenceInput/utils/TimeAgo'
import * as adapter from './client-adapters/reference'

const TextWithTone = styled(Text)<{$tone: ThemeColorToneKey}>(
  ({$tone, theme}: {$tone: ThemeColorToneKey; theme: Theme}) => {
    const tone = theme.sanity.color.button.bleed[$tone]
    return css`
      &:not(*[data-selected]) {
        --card-fg-color: ${tone ? tone.enabled.fg : undefined};
        --card-muted-fg-color: ${tone ? tone.enabled.fg : undefined};
      }
      [data-ui='Card']:disabled & {
        --card-fg-color: inherit;
        --card-muted-fg-color: inherit;
      }
    `
  }
)

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 * @param props
 * @constructor
 */
function ReferencePreview(props: {
  referenceInfo: ReferenceInfo
  refType: ObjectSchemaType
  layout: string
  showTypeLabel: boolean

  // this provides us with a workaround for an issue with css modules (https://github.com/thysultan/stylis.js/issues/272)
  // the workaround is to write a `data-selected` prop on the <TextWithTone> component and use that instead of not()
  // When the upstream issue is fixed, removing this prop (and usage sites) should make things just work again
  // eslint-disable-next-line camelcase
  __workaround_selected?: boolean
}) {
  const {layout, refType, showTypeLabel, referenceInfo} = props

  const theme = useRootTheme()

  const stub = {
    _id: referenceInfo.draft.availability.available
      ? getDraftId(referenceInfo.id)
      : referenceInfo.id,
    _type: refType.name,
  }

  return (
    <Flex align="center">
      <Box flex={1}>
        <Preview type={refType} value={stub} layout={layout} />
      </Box>
      <Box marginLeft={4} marginRight={2}>
        <Inline space={4}>
          {showTypeLabel && (
            <Label size={1} muted>
              {refType.title}
            </Label>
          )}
          {referenceInfo?.published.preview && (
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>
                    Published <TimeAgo time={referenceInfo.published.preview._updatedAt} />
                  </Text>
                </Box>
              }
            >
              <TextWithTone
                $tone={theme.tone === 'default' ? 'positive' : 'default'}
                size={1}
                data-selected={props.__workaround_selected ? '' : undefined}
              >
                <PublishIcon />
              </TextWithTone>
            </Tooltip>
          )}
          {referenceInfo?.draft.preview && (
            <Tooltip
              content={
                <Box padding={2}>
                  <Text size={1}>
                    Edited <TimeAgo time={referenceInfo.draft.preview._updatedAt} />
                  </Text>
                </Box>
              }
            >
              <TextWithTone
                $tone={theme.tone === 'default' ? 'caution' : 'default'}
                size={1}
                data-selected={props.__workaround_selected ? '' : undefined}
              >
                <EditIcon />
              </TextWithTone>
            </Tooltip>
          )}
        </Inline>
      </Box>
    </Flex>
  )
}

// eslint-disable-next-line require-await
async function resolveUserDefinedFilter(
  options: ReferenceOptions | undefined,
  document: SanityDocument,
  valuePath: Path
): Promise<ReferenceFilterSearchOptions> {
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = get(document, parentPath) as Record<string, unknown>
    return options.filter({document, parentPath, parent})
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}

export type Props = {
  value?: Reference
  compareValue?: Reference
  type: ReferenceSchemaType
  markers: Marker[]
  focusPath: Path
  readOnly?: boolean
  onFocus: (path: Path) => void
  onChange: (event: PatchEvent) => void
  level: number
  presence: FormFieldPresence[]

  // From withDocument
  document: SanityDocument

  // From withValuePath
  getValuePath: () => Path
}

function useValueRef<T>(value: T): {current: T} {
  const ref = useRef(value)
  ref.current = value
  return ref
}

type SearchError = {
  message: string
  details?: {
    type: string
    description: string
  }
}

const SanityReferenceInput = forwardRef(function SanityReferenceInput(
  props: Props,
  ref: ForwardedRef<HTMLInputElement>
) {
  const {getValuePath, type, document, value} = props
  const {EditReferenceLinkComponent, onEditReference, activePath} = useReferenceInputOptions()

  const documentRef = useValueRef(document)

  const valuePath = useMemo(getValuePath, [getValuePath])

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(type.options, documentRef.current, getValuePath())).pipe(
        mergeMap(({filter, params}) =>
          adapter.search(searchString, type, {
            ...type.options,
            filter,
            params,
            tag: 'search.reference',
          })
        ),
        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (type.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        })
      ),
    [documentRef, getValuePath, type]
  )

  const EditReferenceLink = useMemo(
    () =>
      forwardRef(function EditReferenceLink_(
        _props: ComponentProps<typeof EditReferenceLinkComponent>,
        forwardedRef: ForwardedRef<'a'>
      ) {
        return (
          <EditReferenceLinkComponent {..._props} ref={forwardedRef} parentRefPath={valuePath} />
        )
      }),
    [EditReferenceLinkComponent, valuePath]
  )

  const handleEditReference = useCallback(
    (id: string, schemaType: ObjectSchemaType) => {
      onEditReference({
        parentRefPath: valuePath,
        id,
        type: schemaType.name,
      })
    },
    [onEditReference, valuePath]
  )

  const selectedState = PathUtils.startsWith(valuePath, activePath.path) ? activePath.state : 'none'

  return (
    <ReferenceInput
      {...props}
      onSearch={handleSearch}
      getReferenceInfo={adapter.getReferenceInfo}
      ref={ref}
      selectedState={selectedState}
      previewComponent={ReferencePreview}
      editReferenceLinkComponent={EditReferenceLink}
      onEditReference={handleEditReference}
    />
  )
})

export default withValuePath(withDocument(SanityReferenceInput))
