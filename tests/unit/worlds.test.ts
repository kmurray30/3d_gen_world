import { beforeEach, describe, expect, it } from 'vitest';
import { displayName, forgetWorld, lastWorld, listWorlds, parseWorldRef, prettySlug, recordVisit, renameWorld, timeAgo } from '../../src/client/app/worlds';

beforeEach(() => {
  for (const w of listWorlds()) forgetWorld(w.slug);
});

describe('parseWorldRef', () => {
  it('accepts links, paths and bare names', () => {
    expect(parseWorldRef('https://web-production-c924.up.railway.app/w/sunny-meadow-1234')).toBe('sunny-meadow-1234');
    expect(parseWorldRef('https://x.app/w/Sunny-Meadow-1234?dev=1')).toBe('sunny-meadow-1234');
    expect(parseWorldRef('/w/quiet-glade-0042/')).toBe('quiet-glade-0042');
    expect(parseWorldRef('  wild-valley-6769 ')).toBe('wild-valley-6769');
  });
  it('rejects anything else', () => {
    expect(parseWorldRef('')).toBeNull();
    expect(parseWorldRef('hello world')).toBeNull();
    expect(parseWorldRef('ab')).toBeNull();
    expect(parseWorldRef('https://x.app/')).toBeNull();
  });
});

describe('known worlds', () => {
  it('orders by last visit, remembers the last, and keeps names and counts', () => {
    recordVisit('aaa-bbb-1111', 5, 1000);
    recordVisit('ccc-ddd-2222', 7, 2000);
    recordVisit('aaa-bbb-1111', undefined, 3000);
    expect(listWorlds().map((w) => w.slug)).toEqual(['aaa-bbb-1111', 'ccc-ddd-2222']);
    expect(lastWorld()).toBe('aaa-bbb-1111');
    expect(listWorlds()[0].entities).toBe(5);
    renameWorld('ccc-ddd-2222', '  My farm  ');
    expect(displayName(listWorlds()[1])).toBe('My farm');
    renameWorld('ccc-ddd-2222', '');
    expect(displayName(listWorlds()[1])).toBe('Ccc ddd');
    forgetWorld('aaa-bbb-1111');
    expect(lastWorld()).toBe('ccc-ddd-2222');
  });
  it('ignores invalid slugs', () => {
    recordVisit('no', 1);
    expect(listWorlds()).toEqual([]);
  });
});

describe('labels', () => {
  it('prettifies slugs and times', () => {
    expect(prettySlug('sunny-meadow-1234')).toEqual({ title: 'Sunny meadow', tag: '1234' });
    expect(prettySlug('custom')).toEqual({ title: 'Custom', tag: '' });
    expect(timeAgo(0, 10_000)).toBe('just now');
    expect(timeAgo(0, 5 * 60_000)).toBe('5 min ago');
    expect(timeAgo(0, 3 * 3600_000)).toBe('3 h ago');
    expect(timeAgo(0, 2 * 86400_000)).toBe('2 d ago');
  });
});
