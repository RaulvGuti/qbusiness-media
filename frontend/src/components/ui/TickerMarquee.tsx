'use client';

import React from 'react';

export interface TickerMarqueeProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
  gap?: string;
}

export default function TickerMarquee({
  children,
  direction = 'left',
  speed = 20,
  pauseOnHover = true,
  className = '',
  gap = '2rem',
}: TickerMarqueeProps) {
  const animationName = direction === 'left' ? 'marquee-left' : 'marquee-right';

  return (
    <div
      className={`relative overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes marquee-left {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0%); }
}
.${animationName} {
  animation: ${animationName} ${speed}s linear infinite;
  will-change: transform;
}
          `,
        }}
      />
      <div
        className={`flex items-center ${animationName} ${
          pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
        }`}
        style={{ gap }}
      >
        <div className="flex items-center shrink-0" style={{ gap }}>
          {children}
        </div>
        <div className="flex items-center shrink-0" style={{ gap }}>
          {children}
        </div>
      </div>
    </div>
  );
}