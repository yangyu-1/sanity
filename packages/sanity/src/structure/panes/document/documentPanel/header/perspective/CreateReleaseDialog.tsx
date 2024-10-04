import {DotIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  DEFAULT_RELEASE_TYPE,
  type FormBundleDocument,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isVersionId,
  LoadingBlock,
  Preview,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
  useSchema,
} from 'sanity'

import {
  AddedVersion,
  CreatedRelease,
} from '../../../../../../core/releases/__telemetry__/releases.telemetry'
import {ReleaseForm} from '../../../../../../core/releases/components/dialog/ReleaseForm'
import {createReleaseId} from '../../../../../../core/releases/util/createReleaseId'
import {useBundleOperations} from '../../../../../../core/store/bundles/useBundleOperations'
import {Dialog} from '../../../../../../ui-components'
import {BadgeIcon} from './BadgeIcon'

export function CreateReleaseDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
}): JSX.Element {
  const {onClose, documentId, documentType} = props
  const toast = useToast()

  const {setPerspective} = usePerspective()
  const schema = useSchema()
  const schemaType = schema.get(documentType)

  const documentStore = useDocumentStore()
  const [newReleaseId] = useState(createReleaseId())

  const [value, setValue] = useState((): FormBundleDocument => {
    return {
      _id: newReleaseId,
      _type: 'release',
      title: '',
      description: '',
      hue: 'gray',
      icon: 'cube',
      releaseType: DEFAULT_RELEASE_TYPE,
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isVersion = isVersionId(documentId)

  const telemetry = useTelemetry()
  const {createBundle} = useBundleOperations()

  const publishedId = getPublishedId(documentId)

  const {createVersion} = useDocumentOperation(
    publishedId,
    documentType,
    getVersionFromId(documentId),
  )

  const tone = 'default'

  const handleOnChange = useCallback((changedValue: FormBundleDocument) => {
    setValue(changedValue)
  }, [])

  const handleAddVersion = useCallback(async () => {
    // set up the listener before executing
    const createVersionSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(getPublishedId(documentId), documentType)
        .pipe(filter((e) => e.op === 'createVersion' && e.type === 'success')),
    )

    const docId = getVersionId(publishedId, newReleaseId)

    createVersion.execute(docId)

    // only change if the version was created successfully
    await createVersionSuccess
    setPerspective(newReleaseId)

    telemetry.log(AddedVersion, {
      schemaType: documentType,
      documentOrigin: isVersion ? 'version' : 'draft',
    })
  }, [
    createVersion,
    documentId,
    documentStore.pair,
    documentType,
    isVersion,
    newReleaseId,
    publishedId,
    setPerspective,
    telemetry,
  ])

  const handleCreateRelease = useCallback(async () => {
    try {
      setIsSubmitting(true)

      createBundle(value)

      handleAddVersion()
      telemetry.log(CreatedRelease, {origin: 'document-panel'})
    } catch (err) {
      console.error(err)
      toast.push({
        closable: true,
        status: 'error',
        title: `Failed to create release`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [createBundle, handleAddVersion, telemetry, toast, value])

  return (
    <Dialog
      id={'create-release-dialog'}
      header={'Copy version to new release'}
      onClickOutside={onClose}
      onClose={onClose}
      padding={false}
      width={1}
      footer={{
        cancelButton: {
          disabled: isSubmitting,
          onClick: onClose,
        },
        confirmButton: {
          text: 'Add to release',
          onClick: handleCreateRelease,
          disabled: isSubmitting,
          tone: 'primary',
        },
      }}
    >
      <Box
        paddingX={3}
        marginBottom={2}
        style={{borderBottom: '1px solid var(--card-border-color)'}}
      >
        <Flex align="center" padding={4} paddingTop={1} justify="space-between">
          {schemaType ? (
            <Preview value={{_id: documentId}} schemaType={schemaType} />
          ) : (
            <LoadingBlock />
          )}

          <Flex
            align="center"
            gap={2}
            padding={1}
            paddingRight={2}
            style={{borderRadius: 999, border: '1px solid var(--card-border-color)'}}
          >
            <BadgeIcon icon={DotIcon} tone={tone} />
            {/* eslint-disable-next-line i18next/no-literal-string*/}
            <Text size={1}>boop</Text>
          </Flex>
        </Flex>
      </Box>

      <Box padding={3}>
        <ReleaseForm onChange={handleOnChange} value={value} />
      </Box>
    </Dialog>
  )
}
