export interface CalendarContextValue {
  date?: Date
  endDate?: Date
  focusedDate: Date
  selectRange?: boolean
  selectTime?: boolean

  /**
   * An integer indicating the first day of the week.
   * Can be either 1 (Monday) or 7 (Sunday).
   */
  firstWeekDay: 1 | 7
}
