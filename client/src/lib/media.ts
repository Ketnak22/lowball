import { readable } from 'svelte/store';

/** Same breakpoint as the desktop layout in app.css. */
export const wide = readable(false, (set) => {
  const query = window.matchMedia('(min-width: 900px)');
  set(query.matches);
  const update = () => set(query.matches);
  query.addEventListener('change', update);
  return () => query.removeEventListener('change', update);
});
