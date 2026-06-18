import { useState, useCallback } from 'react';

const KEY = 'beautyos_favs';

function read(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); }
}

function write(s: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...s]));
}

export function useFavorites() {
  const [favs, setFavs] = useState<Set<string>>(read);

  const toggle = useCallback((id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      write(next);
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => favs.has(id), [favs]);

  return { favs, toggle, isFav, count: favs.size };
}
