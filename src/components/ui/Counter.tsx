import { useEffect, useState } from 'react';

interface CounterProps {
  value: number | string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function Counter({ value, duration = 1000, className = '', prefix = '', suffix = '' }: CounterProps) {
  const [count, setCount] = useState<number | string>(0);
  const isNumeric = typeof value === 'number';

  useEffect(() => {
    if (!isNumeric) {
      setCount(value);
      return;
    }

    const start = 0;
    const end = value as number;
    const increment = end / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, isNumeric]);

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}