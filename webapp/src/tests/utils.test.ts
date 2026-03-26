import { describe, it, expect } from 'vitest';
import { cn } from '../lib/cn';
import { AutoQueryKey } from '../lib/utils/AutoQueryKey';

describe('cn — class name utility', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });
});

describe('AutoQueryKey decorator', () => {
  it('attaches .key to static methods', () => {
    @AutoQueryKey()
    class TestApi {
      static list = async () => [];
      static get = async (_id: number) => null;
    }

    expect(TestApi.list.key).toBe('TestApi.list');
    expect(TestApi.get.key).toBe('TestApi.get');
  });

  it('different classes have different keys', () => {
    @AutoQueryKey()
    class ApiA { static list = async () => []; }

    @AutoQueryKey()
    class ApiB { static list = async () => []; }

    expect(ApiA.list.key).toBe('ApiA.list');
    expect(ApiB.list.key).toBe('ApiB.list');
    expect(ApiA.list.key).not.toBe(ApiB.list.key);
  });

  it('method still works as a function after decoration', async () => {
    @AutoQueryKey()
    class TestApi {
      static double = async (n: number) => n * 2;
    }
    const result = await TestApi.double(5);
    expect(result).toBe(10);
  });
});
