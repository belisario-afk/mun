export function byId<T extends HTMLElement>(id: string) {
  return document.getElementById(id) as T | null;
}