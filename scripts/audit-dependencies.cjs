const { spawnSync } = require('node:child_process');

// Approved temporary exception: upstream has no patched braces release.
// https://github.com/advisories/GHSA-vfj7-8cjw-p6xm
// Remove once a patch is available; acceptance ends on 2026-11-03 UTC.
const BRACES_ADVISORY = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const EXPIRES_AT = Date.parse('2026-11-03T00:00:00Z');
const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];

function evaluateAudit(report, now = Date.now()) {
    if (!report || report.error || report.auditReportVersion !== 2 ||
        !report.vulnerabilities || typeof report.vulnerabilities !== 'object' ||
        Array.isArray(report.vulnerabilities)) {
        throw new Error('npm returned an invalid or failed audit report');
    }

    const advisories = new Map();
    const visited = new Set();
    const visiting = new Set();
    function visit(name) {
        if (visiting.has(name)) throw new Error(`Circular vulnerability reference: ${name}`);
        if (visited.has(name)) return;
        visiting.add(name);
        const vulnerability = report.vulnerabilities[name];
        if (!vulnerability || !Array.isArray(vulnerability.via) || vulnerability.via.length === 0 ||
            !SEVERITIES.includes(vulnerability.severity)) {
            throw new Error('Unrecognized vulnerability entry');
        }
        for (const via of vulnerability.via) {
            // npm also reports parents affected by an underlying advisory.
            if (typeof via === 'string') {
                if (!Object.hasOwn(report.vulnerabilities, via)) {
                    throw new Error(`Missing underlying vulnerability: ${via}`);
                }
                visit(via);
                continue;
            }
            if (!via || typeof via.url !== 'string' || typeof via.name !== 'string' ||
                !SEVERITIES.includes(via.severity)) {
                throw new Error('Unrecognized advisory entry');
            }
            advisories.set(`${via.name}:${via.url}`, via);
        }
        visiting.delete(name);
        visited.add(name);
    }
    for (const name of Object.keys(report.vulnerabilities)) visit(name);

    const ignored = [];
    const blocked = [];
    for (const advisory of advisories.values()) {
        if (advisory.name === 'braces' && advisory.url === BRACES_ADVISORY &&
            now < EXPIRES_AT) {
            ignored.push(advisory);
        } else if (['high', 'critical'].includes(advisory.severity)) {
            blocked.push(advisory);
        }
    }
    return { ignored, blocked };
}

function main() {
    const result = spawnSync('npm audit --json', {
        shell: true,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        timeout: 180000,
    });
    try {
        if (result.error || ![0, 1].includes(result.status)) {
            throw result.error || new Error(`npm audit failed with status ${result.status}`);
        }
        const { ignored, blocked } = evaluateAudit(JSON.parse(result.stdout));
        for (const advisory of ignored) {
            console.warn(`TEMPORARY EXCEPTION until 2026-11-03 UTC: ${advisory.name} ${advisory.url}`);
        }
        for (const advisory of blocked) {
            console.error(`BLOCKED (${advisory.severity}): ${advisory.name} ${advisory.url}`);
        }
        console.log(`${blocked.length} blocking advisories; ${ignored.length} temporary exceptions.`);
        process.exitCode = blocked.length ? 1 : 0;
    } catch (error) {
        console.error(`Dependency audit failed: ${error.message}`);
        if (result.stderr) console.error(result.stderr.trim());
        process.exitCode = 1;
    }
}

module.exports = { evaluateAudit };
if (require.main === module) main();
