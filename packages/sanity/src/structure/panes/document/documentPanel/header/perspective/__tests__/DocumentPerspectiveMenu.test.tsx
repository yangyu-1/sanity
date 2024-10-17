import {render, screen} from '@testing-library/react'
import {type HTMLProps} from 'react'
import {type BundleDocument, usePerspective} from 'sanity'
import {type IntentLinkProps} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentPerspectiveMenu} from '../DocumentPerspectiveMenu'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: vi.fn().mockReturnValue({
    currentGlobalBundle: {},
    setPerspective: vi.fn(),
  }),
  useTranslation: vi.fn().mockReturnValue({t: vi.fn()}),
}))

vi.mock('sanity/router', () => {
  return {
    useRouter: vi.fn().mockReturnValue({
      stickyParams: {},
    }),
    route: {
      create: vi.fn(),
    },
    IntentLink(props: IntentLinkProps & HTMLProps<HTMLAnchorElement>) {
      const {params = {}, intent, ...rest} = props
      const stringParams = params
        ? Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('&')
        : ''

      return <a {...rest} href={`/intent/${intent}/${stringParams}`} />
    },
  }
})

vi.mock('../../../../useDocumentPane')

const mockUseDocumentPane = useDocumentPane as MockedFunction<
  () => Partial<DocumentPaneContextValue>
>

const mockUsePerspective = usePerspective as Mock

describe('DocumentPerspectiveMenu', () => {
  const mockCurrent: BundleDocument = {
    description: 'What a spring drop, allergies galore 🌸',
    _updatedAt: '2024-07-12T10:39:32Z',
    _rev: 'HdJONGqRccLIid3oECLjYZ',
    authorId: 'pzAhBTkNX',
    title: 'Spring Drop',
    icon: 'heart-filled',
    _id: 'spring-drop',
    _type: 'release',
    hue: 'magenta',
    _createdAt: '2024-07-02T11:37:51Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: mockCurrent,
      setPerspective: vi.fn(),
    })

    mockUseDocumentPane.mockReturnValue({
      documentVersions: [],
    })
  })

  it('should render "Published" and "Draft" chips when it has no other version', async () => {
    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveMenu />, {wrapper})

    expect(screen.getByRole('button', {name: 'Published'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Draft'})).toBeInTheDocument()
  })

  it('should render the release chip when it has a release version', async () => {
    mockUseDocumentPane.mockReturnValue({
      documentVersions: [
        {
          _id: 'spring-drop',
          title: 'Spring Drop',
          hue: 'magenta',
          icon: 'heart-filled',
          _type: 'release',
          authorId: '',
          _createdAt: '',
          _updatedAt: '',
          _rev: '',
        },
      ],
      displayed: {
        _id: 'versions.spring-drop.KJAiOpAH5r6P3dWt1df9ql',
      },
    })

    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveMenu />, {wrapper})

    expect(screen.getByRole('button', {name: 'Spring Drop'})).toBeInTheDocument()
  })
})