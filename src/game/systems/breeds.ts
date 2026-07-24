/** Persists the player's chosen cat breed across sessions. */

import { CAT_BREED_ORDER, CAT_BREED_STORAGE_KEY, type CatBreed } from '../config.ts';

export function loadSelectedBreed(): CatBreed {
  try {
    const raw = localStorage.getItem(CAT_BREED_STORAGE_KEY);
    return (CAT_BREED_ORDER as string[]).includes(raw ?? '') ? (raw as CatBreed) : 'orange';
  } catch {
    // Private browsing / disabled storage — fall back to the default breed.
    return 'orange';
  }
}

export function saveSelectedBreed(breed: CatBreed): void {
  try {
    localStorage.setItem(CAT_BREED_STORAGE_KEY, breed);
  } catch {
    /* ignore */
  }
}
