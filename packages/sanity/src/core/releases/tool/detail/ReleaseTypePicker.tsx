import {LockIcon} from '@sanity/icons'
import {Flex, Spinner, Stack, TabList, Text, useClickOutsideEvent} from '@sanity/ui'
import {format, isBefore} from 'date-fns'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type ReleaseDocument, type ReleaseType, useDateTimeFormat, useTranslation} from 'sanity'

import {Button, Popover, Tab} from '../../../../ui-components'
import {MONTH_PICKER_VARIANT} from '../../../../ui-components/inputs/DateInputs/calendar/Calendar'
import {type CalendarLabels} from '../../../../ui-components/inputs/DateInputs/calendar/types'
import {DatePicker} from '../../../../ui-components/inputs/DateInputs/DatePicker'
import {LazyTextInput} from '../../../../ui-components/inputs/DateInputs/LazyTextInput'
import {getCalendarLabels} from '../../../form/inputs/DateInputs/utils'
import {useReleaseOperations} from '../../../store/release/useReleaseOperations'
import {ReleaseAvatar} from '../../components/ReleaseAvatar'
import {releasesLocaleNamespace} from '../../i18n'
import {getReleaseTone} from '../../util/getReleaseTone'

export function ReleaseTypePicker(props: {release: ReleaseDocument}): JSX.Element {
  const {release} = props

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const {t} = useTranslation()
  const {updateRelease} = useReleaseOperations()

  const [open, setOpen] = useState(false)
  const [dateInputOpen, setDateInputOpen] = useState(release.metadata.releaseType === 'scheduled')
  const [releaseType, setReleaseType] = useState<ReleaseType>(release.metadata.releaseType)
  const [updatedDate, setUpdatedDate] = useState<string | undefined>(
    release.metadata.intendedPublishAt || release.publishAt,
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const dateFormatter = useDateTimeFormat()
  const [inputValue, setInputValue] = useState<string | undefined>(
    release.metadata.intendedPublishAt
      ? dateFormatter.format(new Date(release.metadata.intendedPublishAt))
      : undefined,
  )

  const calendarLabels: CalendarLabels = useMemo(() => getCalendarLabels(t), [t])

  const close = useCallback(() => {
    if (open) {
      setIsUpdating(true)
      updateRelease({
        ...release,
        metadata: {...release.metadata, intendedPublishAt: updatedDate, releaseType},
      }).then(() => {
        setIsUpdating(false)
      })
      setOpen(false)
      setDateInputOpen(releaseType === 'scheduled')
    }
  }, [updateRelease, release, updatedDate, releaseType, open])

  useClickOutsideEvent(close, () => [popoverRef.current, buttonRef.current, inputRef.current])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const publishDate = updatedDate
  const isPublishDateInPast = !!publishDate && isBefore(new Date(publishDate), new Date())
  const isReleaseScheduled = release.state === 'scheduling'

  const publishDateLabel = useMemo(() => {
    if (releaseType === 'asap') return t('release.type.asap')
    if (releaseType === 'undecided') return t('release.type.undecided')
    if (!publishDate) return null

    return isPublishDateInPast
      ? tRelease('dashboard.details.published-on', {
          date: format(new Date(publishDate), `MMM d, yyyy`),
        })
      : format(new Date(publishDate), `PPpp`)
  }, [isPublishDateInPast, publishDate, releaseType, t, tRelease])

  const handleButtonReleaseTypeChange = useCallback((pickedReleaseType: ReleaseType) => {
    if (pickedReleaseType === 'scheduled') {
      setDateInputOpen(true)
    }

    setReleaseType(pickedReleaseType)
  }, [])

  const handleBundlePublishAtChange = useCallback(
    (date: Date | null) => {
      setInputValue(dateFormatter.format(date || undefined))

      setUpdatedDate(date ? date.toISOString() : undefined)
    },
    [dateFormatter],
  )

  const handleInputChange = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const date = new Date(event.currentTarget.value)
      setInputValue(dateFormatter.format(new Date(event.currentTarget.value) || undefined))

      setUpdatedDate(date ? date.toISOString() : undefined)
    },
    [dateFormatter],
  )

  const PopoverContent = () => {
    return (
      <Stack space={1}>
        <TabList space={0.5}>
          <Tab
            aria-controls="release-timing-asap"
            id="release-timing-asap-tab"
            onClick={() => handleButtonReleaseTypeChange('asap')}
            label={t('release.type.asap')}
            selected={releaseType === 'asap'}
          />
          <Tab
            aria-controls="release-timing-at-time"
            id="release-timing-at-time-tab"
            onClick={() => handleButtonReleaseTypeChange('scheduled')}
            selected={releaseType === 'scheduled'}
            label={t('release.type.scheduled')}
          />
          <Tab
            aria-controls="release-timing-undecided"
            id="release-timing-undecided-tab"
            onClick={() => handleButtonReleaseTypeChange('undecided')}
            selected={releaseType === 'undecided'}
            label={t('release.type.undecided')}
          />
        </TabList>
        {dateInputOpen && (
          <>
            <LazyTextInput value={inputValue} onChange={handleInputChange} />

            <DatePicker
              monthPickerVariant={MONTH_PICKER_VARIANT.carousel}
              calendarLabels={calendarLabels}
              selectTime
              padding={0}
              value={updatedDate ? new Date(updatedDate) : undefined}
              onChange={handleBundlePublishAtChange}
            />
          </>
        )}
      </Stack>
    )
  }

  return (
    <Popover
      content={<PopoverContent />}
      open={open}
      padding={1}
      placement="bottom-start"
      portal
      ref={popoverRef}
    >
      <Button
        disabled={isReleaseScheduled || isPublishDateInPast}
        mode="bleed"
        onClick={() => setOpen(!open)}
        padding={2}
        ref={buttonRef}
        tooltipProps={{
          placement: 'bottom',
          content: isReleaseScheduled && tRelease('type-picker.tooltip.scheduled'),
        }}
        selected={open}
        tone={getReleaseTone({...release, metadata: {...release.metadata, releaseType}})}
      >
        <Flex flex={1} gap={2}>
          {isUpdating ? (
            <Spinner size={1} />
          ) : (
            <ReleaseAvatar
              tone={getReleaseTone({...release, metadata: {...release.metadata, releaseType}})}
              padding={0}
            />
          )}

          <Text muted size={1} weight="medium">
            {publishDateLabel}
          </Text>

          {isReleaseScheduled && (
            <Text size={1}>
              <LockIcon />
            </Text>
          )}
        </Flex>
      </Button>
    </Popover>
  )
}