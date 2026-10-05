import { describe, expect, it } from 'vitest';
import { formatPagination, getPagination } from '../../src/shared/utils/pagination.js';

describe('pagination helpers', () => {
  it('uses defaults and computes offsets', () => {
    expect(getPagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20, take: 10 });
  });
  it('falls back for invalid values and caps the limit', () => {
    expect(getPagination({ page: '-1', limit: '500' })).toEqual({ page: 1, limit: 100, skip: 0, take: 100 });
  });
  it('formats documented metadata', () => {
    expect(formatPagination({ page: 2, limit: 10, total: 87 })).toEqual({ page: 2, limit: 10, total: 87, totalPages: 9 });
  });
});
