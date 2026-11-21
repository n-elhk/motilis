import { Service } from '@angular/core';
import { AVAILABLE_CHRISTIAN_WORDS, DICTIONARY_WORDS } from './dictionary';

/**
 * Liste des mots acceptés comme tentative (~23 000 mots, ~255 kB).
 * Toujours chargé à la demande via `DictionaryLoader` pour rester hors du bundle initial.
 */
@Service()
export default class DictionaryService {
  private readonly words = new Set<string>([...DICTIONARY_WORDS, ...AVAILABLE_CHRISTIAN_WORDS]);

  has(word: string): boolean {
    return this.words.has(word);
  }
}

