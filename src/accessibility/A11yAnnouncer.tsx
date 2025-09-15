import React from 'react';

export const A11yAnnouncer: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="sr-only"
    />
  );
};