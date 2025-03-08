import { useState, useCallback } from 'react';

export function useArrayState<T>(initialState: T[] = []) {
  const [state, setState] = useState<T[]>(initialState);

  const toggle = useCallback((item: T) => {
    setState(prev => 
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  }, []);

  const add = useCallback((item: T) => {
    setState(prev => [...prev, item]);
  }, []);

  const remove = useCallback((item: T) => {
    setState(prev => prev.filter(i => i !== item));
  }, []);

  const clear = useCallback(() => {
    setState([]);
  }, []);

  return {
    value: state,
    toggle,
    add,
    remove,
    clear,
    set: setState
  };
}