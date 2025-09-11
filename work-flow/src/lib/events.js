// Simple event bus for cross-component notifications
// Usage:
// import { onEvent, emitEvent, offEvent } from '../lib/events';

const listeners = new Map(); // eventName -> Set<fn>

export function onEvent(eventName, fn) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(fn);
  return () => offEvent(eventName, fn); // unsubscribe helper
}

export function offEvent(eventName, fn) {
  const set = listeners.get(eventName);
  if (set) set.delete(fn);
}

export function emitEvent(eventName, payload) {
  const set = listeners.get(eventName);
  if (set) {
    for (const fn of set) {
      try { fn(payload); } catch (e) { /* ignore */ }
    }
  }
}