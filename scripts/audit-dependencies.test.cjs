const assert = require('node:assert/strict');
const test = require('node:test');
const { evaluateAudit } = require('./audit-dependencies.cjs');

const braces = {
    name: 'braces', severity: 'high',
    url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
};
const now = Date.parse('2026-10-03T00:00:00Z');
const report = (vulnerabilities = {}) => ({ auditReportVersion: 2, vulnerabilities });
const entry = advisory => ({ severity: advisory.severity, via: [advisory] });

test('accepts a clean audit', () => {
    assert.deepEqual(evaluateAudit(report(), now), { ignored: [], blocked: [] });
});

test('accepts only the approved advisory and its affected parents', () => {
    const result = evaluateAudit(report({
        braces: entry(braces),
        micromatch: { severity: 'high', via: ['braces'] },
        jest: { severity: 'high', via: ['micromatch'] },
    }), now);
    assert.deepEqual(result, { ignored: [braces], blocked: [] });
});

test('blocks other high and critical advisories even alongside the exception', () => {
    for (const severity of ['high', 'critical']) {
        const other = { name: 'axios', severity, url: 'https://github.com/advisories/other' };
        const result = evaluateAudit(report({ braces: entry(braces), axios: entry(other) }), now);
        assert.deepEqual(result.blocked, [other]);
    }
});

test('blocks a new advisory for braces', () => {
    const other = { ...braces, url: 'https://github.com/advisories/another-braces-issue' };
    assert.deepEqual(evaluateAudit(report({ braces: entry(other) }), now).blocked, [other]);
});

test('exception expires on 2026-11-03', () => {
    const result = evaluateAudit(report({ braces: entry(braces) }), Date.parse('2026-11-03T00:00:00Z'));
    assert.deepEqual(result, { ignored: [], blocked: [braces] });
});

test('retains the existing high threshold for moderate advisories', () => {
    const moderate = { name: 'example', severity: 'moderate', url: 'https://example.com/advisory' };
    assert.deepEqual(evaluateAudit(report({ example: entry(moderate) }), now).blocked, []);
});

test('fails closed on audit errors, malformed entries and missing references', () => {
    for (const invalid of [
        null, {}, { ...report(), error: { message: 'Registry unavailable' } },
        report({ braces: { severity: 'high', via: [] } }),
        report({ parent: { severity: 'high', via: ['missing'] } }),
        report({ parent: { severity: 'high', via: ['parent'] } }),
        report({ braces: entry({ ...braces, severity: 'unknown' }) }),
    ]) {
        assert.throws(() => evaluateAudit(invalid, now));
    }
});
