import React from 'react';

export default function SeaTurtle({ size = 24, className = '', style = {}, fill = 'currentColor' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      className={className}
      style={style}
    >
      {/* Loggerhead Head: Characterized by an unusually large, broad head and thick neck */}
      <path d="M12 5.8c1.3 0 2.2-.8 2.2-2.3 0-1.3-.8-2-2.2-2s-2.2.7-2.2 2c0 1.5.9 2.3 2.2 2.3z" />

      {/* Carapace: Heart-shaped (cordiform), broad at the shoulders and tapered to a point at the rear */}
      <path d="M12 6.5c4.5 0 7 2.2 7 5.7 0 3.5-3 7.5-7 9.2-4-1.7-7-5.7-7-9.2 0-3.5 2.5-5.7 7-5.7z" />

      {/* Front Flippers (Elongated, slender, hydrofoil-like paddles sweeping back) */}
      {/* Left Front Flipper */}
      <path d="M 7.8, 8.8 C 5, 6 1.8, 7.5 0.2, 10.5 C -0.5, 12 0, 13 1.2, 13 C 3.5, 13 6, 11.2 7.5, 9.3 Z" />
      {/* Right Front Flipper */}
      <path d="M 16.2, 8.8 C 19, 6 22.2, 7.5 23.8, 10.5 C 24.5, 12 24, 13 22.8, 13 C 20.5, 13 18, 11.2 16.5, 9.3 Z" />

      {/* Rear Flippers */}
      {/* Left Rear Flipper */}
      <path d="M 7.8, 18.2 C 6, 19.2 5, 21.2 5.5, 22 C 5.8, 22.5 6.8, 22.5 7.5, 21.8 C 8.6, 20.8 8.8, 19.2 8, 18.2 Z" />
      {/* Right Rear Flipper */}
      <path d="M 16.2, 18.2 C 18, 19.2 19, 21.2 18.5, 22 C 18.2, 22.5 17.2, 22.5 16.5, 21.8 C 15.4, 20.8 15.2, 19.2 16, 18.2 Z" />
    </svg>
  );
}
