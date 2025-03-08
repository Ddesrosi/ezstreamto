import { useState, useCallback, RefObject } from 'react';

interface YearRangeOptions {
  minYear?: number;
  maxYear?: number;
  fromRef?: RefObject<HTMLInputElement>;
  toRef?: RefObject<HTMLInputElement>;
}

export function useYearRange(options: YearRangeOptions = {}) {
  const {
    minYear = 1920,
    maxYear = new Date().getFullYear(),
    fromRef,
    toRef
  } = options;

  const [yearRange, setYearRange] = useState({ from: minYear, to: maxYear });

  const handleYearChange = useCallback((type: 'from' | 'to', value: number) => {
    setYearRange(prev => {
      const newValue = Math.max(minYear, Math.min(value, maxYear));
      
      if (type === 'from') {
        const newFrom = Math.min(newValue, prev.to);
        if (fromRef?.current) {
          fromRef.current.value = newFrom.toString();
        }
        return { ...prev, from: newFrom };
      } else {
        const newTo = Math.max(newValue, prev.from);
        if (toRef?.current) {
          toRef.current.value = newTo.toString();
        }
        return { ...prev, to: newTo };
      }
    });
  }, [minYear, maxYear, fromRef, toRef]);

  const handleDecadeSelect = useCallback((decade: number | 'pre1970') => {
    if (decade === 'pre1970') {
      const from = minYear;
      const to = 1969;
      setYearRange({ from, to });
      
      if (fromRef?.current) fromRef.current.value = from.toString();
      if (toRef?.current) toRef.current.value = to.toString();
    } else {
      const from = decade;
      const to = Math.min(decade + 9, maxYear);
      
      setYearRange({ from, to });
      
      if (fromRef?.current) fromRef.current.value = from.toString();
      if (toRef?.current) toRef.current.value = to.toString();
    }
  }, [minYear, maxYear, fromRef, toRef]);

  return {
    yearRange,
    handleYearChange,
    handleDecadeSelect
  };
}