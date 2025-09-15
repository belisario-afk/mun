let interacted = false;
let waiting: Array<() => void> = [];

function markInteracted() {
  if (interacted) return;
  interacted = true;
  // flush waiters
  for (const fn of waiting) fn();
  waiting = [];
  window.removeEventListener('pointerdown', markInteracted);
  window.removeEventListener('keydown', markInteracted);
}

export function waitForFirstGesture(): Promise<void> {
  if (interacted) return Promise.resolve();
  // ensure listeners are attached once
  window.addEventListener('pointerdown', markInteracted, { once: true });
  window.addEventListener('keydown', markInteracted, { once: true });
  return new Promise((resolve) => {
    waiting.push(resolve);
  });
}

export function hasUserGestured() {
  return interacted;
}