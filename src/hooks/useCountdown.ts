'use client';

import { useState, useEffect } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
  isEndingSoon: boolean; // less than 24h
  isCritical: boolean; // less than 1h
  progress: number; // 0-100, percentage elapsed
  formatted: string;
}

/**
 * Live countdown to an end date. Updates every second.
 * @param endDate ISO date string
 * @param startDate Optional start date string for progress calculation
 */
export function useCountdown(endDate: string, startDate?: string): CountdownResult {
  const calc = (): CountdownResult => {
    const now = Date.now();
    const end = new Date(endDate).getTime();
    const totalMs = end - now;

    // Progress calculation
    let progress = 0;
    if (startDate) {
      const start = new Date(startDate).getTime();
      const totalDuration = end - start;
      if (totalDuration > 0) {
        progress = Math.min(100, Math.max(0, ((now - start) / totalDuration) * 100));
      }
    }

    if (totalMs <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
        isExpired: true,
        isEndingSoon: false,
        isCritical: false,
        progress: 100,
        formatted: 'Finalizado',
      };
    }

    const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

    const totalHours = totalMs / (1000 * 60 * 60);

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${hours}h`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`;
    } else {
      formatted = `${seconds}s`;
    }

    return {
      days,
      hours,
      minutes,
      seconds,
      totalMs,
      isExpired: false,
      isEndingSoon: totalHours < 24,
      isCritical: totalHours < 1,
      progress,
      formatted,
    };
  };

  const [result, setResult] = useState<CountdownResult>(() => calc());

  useEffect(() => {
    const interval = setInterval(() => {
      setResult(calc());
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate, startDate]);

  return result;
}
