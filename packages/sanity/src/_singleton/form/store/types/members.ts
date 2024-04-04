import {type ArraySchemaType} from '@sanity/types'

import {type FieldsetState} from './fieldsetState'
import {type FieldError} from './memberErrors'
import {type BaseFormNode, type ObjectArrayFormNode} from './nodes'

/**
 * @hidden
 * @beta */
export interface ArrayOfObjectsItemMember<Node extends ObjectArrayFormNode = ObjectArrayFormNode> {
  kind: 'item'
  key: string
  index: number

  collapsed: boolean | undefined
  collapsible: boolean | undefined

  open: boolean

  parentSchemaType: ArraySchemaType

  /**
   * @hidden
   * @beta */
  item: Node
}

/**
 * Represents a field member in a form.
 * @public
 */
export interface FieldMember<Node extends BaseFormNode = BaseFormNode> {
  /** The kind of the form node. */
  kind: 'field'
  /** The key of the field. */
  key: string
  /** The name of the field. */
  name: string
  /** The index of the field. */
  index: number
  /** Whether the field is collapsed. */
  collapsed: boolean | undefined
  /** Whether the field is collapsible. */
  collapsible: boolean | undefined
  /** Whether the field is open. */
  open: boolean

  /**
   * @internal
   * Whether this field is in the selected group.
   */
  inSelectedGroup: boolean

  /**
   * @internal
   * Names of the field groups this field is part of.
   */
  groups: string[]

  /**
   * @hidden
   * @beta
   * The form node that represents this field.
   */
  field: Node
}

/**
 * Represents a member of a field set.
 * @public
 */
export interface FieldSetMember {
  /** The kind of member. */
  kind: 'fieldSet'
  /** The key of the member. */
  key: string

  /**
   * Indicates whether the member is included in the currently selected group.
   * If it's hidden and in the currently selected group, it should still be excluded from its group.
   * @internal
   */
  _inSelectedGroup: boolean
  /** The names of the field groups the member belongs to. */
  groups: string[]

  /**
   * @hidden
   * @beta
   * The state of the field set.
   */
  fieldSet: FieldsetState
}

/** @public */
export type ObjectMember = FieldMember | FieldSetMember | FieldError
