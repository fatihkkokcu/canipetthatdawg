import { describe, expect, it } from 'vitest';
import { animals } from '../data/animals';
import { decodeBucketListFromShare, encodeBucketListForShare } from './bucketShare';

describe('bucketShare', () => {
  it('round-trips ids and trims the shared title', () => {
    const sample = [animals[0], animals[0], animals[1]];
    const encoded = encodeBucketListForShare(sample, '  Weekend Pets  ');
    const decoded = decodeBucketListFromShare(encoded);

    expect(decoded).toEqual({
      ids: [animals[0].id, animals[1].id],
      title: 'Weekend Pets',
    });
  });

  it('caps shared ids to 100', () => {
    const template = animals[0];
    const oversized = Array.from({ length: 140 }, (_, index) => ({
      ...template,
      id: `test-${index}`,
      name: `Animal ${index}`,
    }));
    const encoded = encodeBucketListForShare(oversized);
    const decoded = decodeBucketListFromShare(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.ids).toHaveLength(100);
  });

  it('returns null for invalid encoded payload', () => {
    expect(decodeBucketListFromShare('definitely-not-valid')).toBeNull();
  });
});
