import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { JOB_REDIRECTS } from './redirects.ts';

describe('job redirects', () => {
  it('does not redirect /jobs and sends /careers to /jobs', () => {
    assert.equal(JOB_REDIRECTS.some((rule) => rule.source === '/jobs' || rule.source.startsWith('/jobs/')), false);
    const index = JOB_REDIRECTS.find((rule) => rule.source === '/careers');
    assert.equal(index?.destination, '/jobs');
    assert.equal(index?.permanent, true);
  });

  it('keeps /careers/salaries and moves post and detail pages', () => {
    assert.equal(JOB_REDIRECTS.some((rule) => rule.source.includes('salaries')), false);
    assert.equal(JOB_REDIRECTS.find((rule) => rule.source === '/careers/post')?.destination, '/jobs/post');
    const detail = JOB_REDIRECTS.find((rule) => rule.source.includes(':id'));
    assert.equal(detail?.destination, '/jobs/:id');
    assert.match(detail?.source || '', /36/);
  });
});
