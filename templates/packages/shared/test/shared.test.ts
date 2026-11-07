import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  AppError, buildOpenApi, buildPath, chunk, compareVersions, contract, dayKey, endpoint, formatCompactIN,
  groupBy, parseInput, phoneINSchema, relativeDay, splitEvenly, uniqBy, upiIdSchema,
} from '../src';

describe('money + format', () => {
  it('splits exactly', () => expect(splitEvenly(1000, 3)).toEqual([334, 333, 333]));
  it('formats lakh/crore', () => {
    expect(formatCompactIN(950)).toBe('950');
    expect(formatCompactIN(12500)).toBe('13K');
    expect(formatCompactIN(250000)).toBe('2.5L');
    expect(formatCompactIN(34000000)).toBe('3.4Cr');
  });
});

describe('dates', () => {
  it('dayKey is local yyyy-mm-dd', () => expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05'));
  it('relativeDay', () => {
    const now = new Date(2026, 10, 7, 10);
    expect(relativeDay(new Date(2026, 10, 7, 1), now)).toBe('Today');
    expect(relativeDay(new Date(2026, 10, 6, 23), now)).toBe('Yesterday');
  });
});

describe('validators', () => {
  it('normalises Indian phones', () => {
    expect(phoneINSchema.parse('98765 43210')).toBe('+919876543210');
    expect(phoneINSchema.safeParse('12345').success).toBe(false);
  });
  it('checks UPI ids', () => {
    expect(upiIdSchema.safeParse('arun@okhdfcbank').success).toBe(true);
    expect(upiIdSchema.safeParse('arun').success).toBe(false);
  });
  it('compares versions', () => {
    expect(compareVersions('1.2.10', '1.2.9')).toBe(1);
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });
});

describe('collections', () => {
  it('groups, dedupes, chunks', () => {
    expect(groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even'))).toEqual({ odd: [1, 3], even: [2, 4] });
    expect(uniqBy([{ id: 1 }, { id: 1 }, { id: 2 }], (x) => x.id)).toHaveLength(2);
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]]);
  });
});

describe('contract', () => {
  const e = endpoint({ method: 'POST', path: '/x/:id', summary: 'x', params: z.object({ id: z.string() }), body: z.object({ n: z.number() }), response: z.object({ ok: z.boolean() }) });
  it('builds paths', () => expect(buildPath('/notes/:id', { id: 'a b' })).toBe('/notes/a%20b'));
  it('parses valid input', () => expect(parseInput(e, { params: { id: '1' }, body: { n: 2 } }).body.n).toBe(2));
  it('rejects bad input with BAD_REQUEST', () => {
    try { parseInput(e, { params: { id: '1' }, body: { n: 'no' } }); throw new Error('should fail'); }
    catch (err) { expect(err).toBeInstanceOf(AppError); expect((err as AppError).status).toBe(400); }
  });
  it('makes an OpenAPI doc for the whole contract', () => {
    const doc = buildOpenApi(contract, { title: 'T', version: '1', serverUrl: 'http://x' });
    expect(doc.paths['/health']).toBeDefined();
    expect(doc.openapi).toBe('3.1.0');
  });
});
