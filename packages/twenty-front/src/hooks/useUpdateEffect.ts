import {
  type DependencyList,
  type EffectCallback,
  useEffect,
  useRef,
} from 'react';

export const useUpdateEffect = (
  effect: EffectCallback,
  deps?: DependencyList,
) => {
  // oxlint-disable-next-line twenty/no-state-useref
  const isFirst = useRef(true);
  const isFirstMount = isFirst.current;
  isFirst.current = false;

  useEffect(() => {
    if (!isFirstMount) {
      return effect();
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
