#!/usr/bin/env node
// Read-only by default. The scheduled workflow may open one tracking issue.
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const baseline = JSON.parse(await readFile(new URL('../UPSTREAM.json', import.meta.url), 'utf8'));
function api(path, body) {
  const result = spawnSync('gh', ['api', path, ...(body ? ['--method', 'POST', '--input', '-'] : [])], {
    encoding: 'utf8', input: body ? JSON.stringify(body) : undefined, maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) throw new Error(`GitHub API failed: ${path}`);
  return JSON.parse(result.stdout);
}
const latest = api(`repos/${baseline.repository}/commits/${encodeURIComponent(baseline.branch)}`);
if (!/^[a-f0-9]{40}$/.test(latest.sha)) throw new Error('Invalid upstream commit');
const changed = latest.sha !== baseline.commit;
console.log(JSON.stringify({ repository: baseline.repository, baseline: baseline.commit, latest: latest.sha, changed }));
if (changed && process.argv.includes('--issue')) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('GITHUB_REPOSITORY required');
  const title = `Upstream Effortless: review ${latest.sha.slice(0, 12)}`;
  let exists = false;
  for (let page = 1; ; page++) {
    const issues = api(`repos/${repo}/issues?state=all&per_page=100&page=${page}`);
    exists = issues.some(issue => !issue.pull_request && issue.title === title);
    if (exists || issues.length < 100) break;
  }
  if (!exists) {
    api(`repos/${repo}/issues`, {
      title,
      body: `New upstream commit: https://github.com/${baseline.repository}/commit/${latest.sha}\n\nCompare: https://github.com/${baseline.repository}/compare/${baseline.commit}...${latest.sha}\n\nReview in a separate branch, preserve both adapters, run all gates and merge via PR. Update UPSTREAM.json only after incorporating the changes. No automatic installation or merge.`,
    });
    console.log('Tracking issue created. No code changed.');
  }
}
