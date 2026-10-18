'use client';
/* Verbatim from the advanced-stats project (stagger-reveal on intersection). */
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

interface TimelineAnimationProps {
  /** Position in the stagger sequence; higher numbers animate later. */
  animationNum: number;
  /** Shared ref for the container observed to trigger the animations. */
  timelineRef: React.RefObject<HTMLDivElement>;
  className?: string;
  children: React.ReactNode;
  /** Delay in ms between each step of the sequence. */
  stepDelay?: number;
}

export function TimelineAnimation({
  animationNum,
  timelineRef,
  className,
  children,
  stepDelay = 120,
}: TimelineAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = timelineRef?.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [timelineRef]);

  return (
    <div
      className={cn(
        'transition-all duration-700 ease-out will-change-transform',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      style={{ transitionDelay: `${animationNum * stepDelay}ms` }}
    >
      {children}
    </div>
  );
}
