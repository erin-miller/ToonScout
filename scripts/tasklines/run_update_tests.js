const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'packages', 'webapp', 'data', 'tasklines');
const EXCLUDED_FILES = new Set(['metadata.json', 'sellbot_cog_disguise.json']);
const REPORT_PATH = path.join(ROOT, '.github', 'taskline-update-report.md');
const RESULTS_PATH = path.join(__dirname, 'UPDATE_TASKLINES_TEST_RESULTS.md');

function run(command) {
  execSync(command, { stdio: 'inherit', cwd: ROOT, timeout: 120000 });
}

function listAllJsonFiles() {
  return fs
    .readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.json'));
}

function listTasklineFiles() {
  return listAllJsonFiles().filter(file => !EXCLUDED_FILES.has(file));
}

function hashRawFiles() {
  const hashes = {};
  listTasklineFiles().forEach(file => {
    const content = fs.readFileSync(path.join(DATA_DIR, file));
    hashes[file] = crypto.createHash('sha256').update(content).digest('hex');
  });
  return hashes;
}

function getCounts() {
  const counts = {};
  listTasklineFiles().forEach(file => {
    const parsed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    const tasklines = Array.isArray(parsed) ? parsed.length : 0;
    const steps = Array.isArray(parsed)
      ? parsed.reduce((total, taskline) => {
          const stepCount = Array.isArray(taskline.steps) ? taskline.steps.length : 0;
          return total + stepCount;
        }, 0)
      : 0;
    counts[file] = { tasklines, steps };
  });
  return counts;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function backupFiles(backupDir) {
  fs.mkdirSync(backupDir, { recursive: true });
  listAllJsonFiles().forEach(file => {
    fs.copyFileSync(path.join(DATA_DIR, file), path.join(backupDir, file));
  });
}

function restoreFiles(backupDir) {
  listAllJsonFiles().forEach(file => {
    fs.rmSync(path.join(DATA_DIR, file));
  });
  fs.readdirSync(backupDir).forEach(file => {
    if (file.endsWith('.json')) {
      fs.copyFileSync(path.join(backupDir, file), path.join(DATA_DIR, file));
    }
  });
}

function removeFiles() {
  listAllJsonFiles().forEach(file => {
    fs.rmSync(path.join(DATA_DIR, file));
  });
}

function applyPartialDeletions() {
  const daisyPath = path.join(DATA_DIR, 'daisy_gardens.json');
  const daisy = JSON.parse(fs.readFileSync(daisyPath, 'utf8'));
  daisy.shift();
  writeJson(daisyPath, daisy);

  const brrrghPath = path.join(DATA_DIR, 'the_brrrgh.json');
  const brrrgh = JSON.parse(fs.readFileSync(brrrghPath, 'utf8'));
  brrrgh.pop();
  writeJson(brrrghPath, brrrgh);

  const ttcPath = path.join(DATA_DIR, 'toontown_central.json');
  const ttc = JSON.parse(fs.readFileSync(ttcPath, 'utf8'));
  if (ttc[0] && Array.isArray(ttc[0].steps)) {
    ttc[0].steps.pop();
  }
  writeJson(ttcPath, ttc);
}

function appendResults(lines) {
  const timestamp = new Date().toISOString();
  const newRun = [
    '',
    `Test Run: ${timestamp}`,
    ...lines,
    '',
  ].join('\n');

  // Keep only the last test run to prevent unbounded growth
  let existingContent = '';
  if (fs.existsSync(RESULTS_PATH)) {
    const fullContent = fs.readFileSync(RESULTS_PATH, 'utf8');
    const runs = fullContent.split(/(?=\nTest Run: )/);
    // Keep the most recent run (last element)
    if (runs.length > 0) {
      existingContent = runs[runs.length - 1].trimStart();
    }
  }

  const finalContent = existingContent ? `${existingContent}\n${newRun}` : newRun;
  fs.writeFileSync(RESULTS_PATH, finalContent);
}

function main() {
  const args = new Set(process.argv.slice(2));
  const useExistingBaseline = args.has('--baseline-existing');
  const backupDir = path.join(__dirname, 'test_backups', `run-${Date.now()}`);
  const results = [];

  let baseHashes, baseCounts;

  if (useExistingBaseline) {
    results.push('Steps');
    results.push('0) Using existing files as baseline (skip initial refresh)');
    baseHashes = hashRawFiles();
    baseCounts = getCounts();
    results.push(`- Captured baseline from existing files`);
  } else {
    results.push('Steps');
    results.push('1) Run refresh and capture hashes');
    run(`node scripts/tasklines/update_tasklines.js --refresh --report-path ${REPORT_PATH}`);
    baseHashes = hashRawFiles();
    baseCounts = getCounts();
  }

  if (useExistingBaseline) {
    results.push('1) Refresh from wiki and compare to existing baseline');
  } else {
    results.push('1b) Re-run refresh and confirm deterministic output');
  }
  run(`node scripts/tasklines/update_tasklines.js --refresh --report-path ${REPORT_PATH}`);
  const repeatHashes = hashRawFiles();
  const repeatMatch = JSON.stringify(baseHashes) === JSON.stringify(repeatHashes);
  if (useExistingBaseline) {
    results.push(`- Local files match wiki: ${repeatMatch ? 'PASS' : 'FAIL (wiki has updates)'}`);
  } else {
    results.push(`- Repeat refresh hash match: ${repeatMatch ? 'PASS' : 'FAIL'}`);
  }

  results.push('2) Backup JSON files and regenerate from empty folder');
  backupFiles(backupDir);
  removeFiles();
  run(`node scripts/tasklines/update_tasklines.js --refresh --report-path ${REPORT_PATH}`);
  const regenCounts = getCounts();
  const regenMatch = JSON.stringify(baseCounts) === JSON.stringify(regenCounts);
  results.push(`- Regeneration count match: ${regenMatch ? 'PASS' : 'FAIL'}`);
  if (!regenMatch) {
    const mismatches = Object.keys(baseCounts).filter(file => {
      const base = baseCounts[file];
      const regen = regenCounts[file];
      return !regen || base.tasklines !== regen.tasklines || base.steps !== regen.steps;
    });
    results.push(`- Regeneration count mismatches: ${mismatches.join(', ') || 'none'}`);
  }

  results.push('3) Apply partial deletions and rerun refresh');
  applyPartialDeletions();
  run(`node scripts/tasklines/update_tasklines.js --refresh --report-path ${REPORT_PATH}`);
  const postDeletionCounts = getCounts();
  const restoreMatch = JSON.stringify(baseCounts) === JSON.stringify(postDeletionCounts);
  results.push(`- Partial deletion recovery (counts): ${restoreMatch ? 'PASS' : 'FAIL'}`);
  if (!restoreMatch) {
    const mismatches = Object.keys(baseCounts).filter(file => {
      const base = baseCounts[file];
      const current = postDeletionCounts[file];
      return !current || base.tasklines !== current.tasklines || base.steps !== current.steps;
    });
    results.push(`- Recovery count mismatches: ${mismatches.join(', ') || 'none'}`);
  }

  results.push('4) Restore backup to reset state');
  restoreFiles(backupDir);
  results.push('- Restore completed');

  results.push('5) Clean up test backup directory');
  fs.rmSync(backupDir, { recursive: true, force: true });
  results.push('- Cleanup completed');

  appendResults(results);
}

main();
