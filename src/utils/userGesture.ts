let interacted = false;
let waiting: Array<() => void> = [];

function flush() {
  for (const fn of waiting) fn();
  waiting = [];
}

function onInteract() {
  if (interacted) return;
  interacted = true;
  flush();
  window.removeEventListener('pointerdown', onInteract);
  window.removeEventListener('keydown', onInteract);
}

export function waitForFirstGesture(): Promise<void> {
  if (interacted) return Promise.resolve();
  window.addEventListener('pointerdown', onInteract, { once: true });
  window.addEventListener('keydown', onInteract, { once: true });
  return new Promise((resolve) => {
    waiting.push(resolve);
  });
}

export function hasUserGestured() {
  return interacted;
}