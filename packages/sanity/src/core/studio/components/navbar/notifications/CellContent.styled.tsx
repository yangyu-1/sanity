import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const CellContent = styled.div(({theme}: {theme: Theme}) => {
  const {fonts} = theme.sanity
  return css`
    font-family: ${fonts.text.family};
    font-size: ${fonts.text.sizes[1].fontSize}px;
    line-height: ${fonts.text.sizes[1].lineHeight}px;
    blockquote {
      border-left: 2px solid var(--card-border-color);
      margin: 0;
      padding-left: 0.5rem;
    }
    p {
      margin: 0.5rem 0;
      &:first-child {
        margin-top: 0;
      }
      &:last-child {
        margin-bottom: 0;
      }
    }
    strong {
      font-weight: ${fonts.text.weights.medium};
    }
  `
})
