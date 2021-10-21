import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {catchError, tap, map, mergeMapTo} from 'rxjs/operators'
import {Observable, of, Subscription, throwError} from 'rxjs'
import {ReferenceInfo} from './types'

const INITIAL_LOADING_STATE: Loadable<ReferenceInfo> = {
  isLoading: true,
  result: undefined,
  error: undefined,
  retry: () => {},
}

const EMPTY_STATE: Loadable<undefined> = {
  isLoading: false,
  result: undefined,
  error: undefined,
  retry: () => {},
}

type Loadable<T> =
  | {isLoading: true; result: undefined; error: undefined; retry: () => void}
  | {isLoading: false; result: T; error: undefined; retry: () => void}
  | {isLoading: false; result: undefined; error: Error; retry: () => void}

type GetReferenceInfo = (id: string) => Observable<ReferenceInfo>

export function useReferenceInfo(
  id: string | undefined,
  getReferenceInfo: GetReferenceInfo
): Loadable<ReferenceInfo | undefined> {
  const [state, setState] = useState<Loadable<ReferenceInfo | undefined>>(INITIAL_LOADING_STATE)
  const [retryAttempt, setRetryAttempt] = useState<number>(0)

  const retry = useCallback(() => {
    setRetryAttempt((current) => current + 1)
  }, [])

  const subscription = useRef<Subscription>()
  // eslint-disable-next-line consistent-return
  useLayoutEffect(() => {
    if (id) {
      setState(INITIAL_LOADING_STATE)
      subscription.current?.unsubscribe()
      subscription.current = getReferenceInfo(id)
        .pipe(
          map(
            (result) =>
              ({
                isLoading: false,
                result,
                error: undefined,
                retry,
              } as const)
          ),
          catchError((err: Error) => {
            console.error(err)
            return of({isLoading: false, result: undefined, error: err, retry} as const)
          }),
          tap((nextState: Loadable<ReferenceInfo>) => setState(nextState))
        )
        .subscribe()
    } else {
      setState(EMPTY_STATE)
    }
    return () => {
      subscription.current?.unsubscribe()
    }
  }, [retryAttempt, getReferenceInfo, id, retry])

  return useMemo(() => ({...state, retry}), [state, retry])
}
