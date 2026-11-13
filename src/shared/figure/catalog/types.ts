/**
 * The catalog: a code-drawn figure for (nearly) every word in the vocabulary, each filed under a district of the
 * Atlas world and a group within it (fruit, dessert, power tools...).
 */
import type { Figure } from '../types';

export const DISTRICTS = {
  town: { title: 'Town Square', blurb: 'people at work and play' },
  fantasy: { title: 'Fantasy Grove', blurb: 'myths, monsters and magic' },
  pets: { title: 'Pet Park', blurb: 'dogs, cats and small pets' },
  farm: { title: 'Farm', blurb: 'farm animals and farming' },
  wild: { title: 'Wild Park', blurb: 'wild land animals' },
  sea: { title: 'Seaside', blurb: 'fish and sea life' },
  aviary: { title: 'Aviary', blurb: 'birds' },
  bugs: { title: 'Bug Garden', blurb: 'insects, spiders and creepy crawlies' },
  food: { title: 'Food Hall', blurb: 'food and drink' },
  kitchen: { title: 'Kitchen', blurb: 'cookware, utensils and appliances' },
  home: { title: 'Home', blurb: 'furniture, decor and household things' },
  wardrobe: { title: 'Wardrobe', blurb: 'clothes, shoes, hats and jewellery' },
  workshop: { title: 'Workshop', blurb: 'tools, hardware and building materials' },
  garage: { title: 'Garage', blurb: 'vehicles on land, water, air and space' },
  music: { title: 'Music Hall', blurb: 'instruments and audio' },
  sports: { title: 'Sports Field', blurb: 'sports and outdoor gear' },
  toys: { title: 'Toy Shop', blurb: 'toys, games and party things' },
  study: { title: 'School & Office', blurb: 'books, stationery and science' },
  tech: { title: 'Tech Lab', blurb: 'electronics, machines and gadgets' },
  armory: { title: 'Armory', blurb: 'weapons and armour' },
  garden: { title: 'Garden', blurb: 'plants, flowers and trees' },
  nature: { title: 'Wilderness', blurb: 'rocks, landforms, weather and elements' },
  sky: { title: 'Sky & Space', blurb: 'planets, stars and things in the sky' },
  places: { title: 'Little Places', blurb: 'buildings and landmarks in miniature' },
  clinic: { title: 'Clinic', blurb: 'medicine and the body' },
  ideas: { title: 'Ideas & Symbols', blurb: 'letters, numbers, shapes, signs and ideas' },
} as const;

export type District = keyof typeof DISTRICTS;

export interface CatalogEntry {
  /** The vocabulary word, exactly. */
  key: string;
  /** Atlas district. */
  d: District;
  /** Group within the district, a short lower-case noun phrase ("fruit", "power tools"). */
  g: string;
  /** Builds the figure (called lazily, once). */
  f: () => Figure;
  /** A prop that only exists for acts (a slice of bread for the toaster, burnt toast): not a vocabulary word,
   *  never placed in the city on its own. */
  extra?: boolean;
}

export const e = (key: string, d: District, g: string, f: () => Figure): CatalogEntry => ({ key, d, g, f });

/** An act-only prop (see CatalogEntry.extra): only when no vocabulary word fits. */
export const x = (key: string, f: () => Figure): CatalogEntry => ({ key, d: 'ideas', g: 'act props', f, extra: true });
