const fs = require('fs');

function readMetadata(metadataPath) {
  if (!fs.existsSync(metadataPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function writeMetadata(metadataPath, outputs, failures, getDiffSummary) {
  const summary = getDiffSummary(outputs);
  const hasChanges =
    summary.tasklinesAdded > 0 ||
    summary.tasklinesRemoved > 0 ||
    summary.tasklinesChanged > 0 ||
    summary.stepsAdded > 0 ||
    summary.stepsRemoved > 0 ||
    summary.stepsChanged > 0;

  if (!hasChanges) {
    return;
  }

  const now = new Date().toISOString();
  const existing = readMetadata(metadataPath);
  const metadata = {
    lastChecked: now,
    lastUpdated: hasChanges ? now : (existing && existing.lastUpdated) || now,
    generator: {
      script: 'scripts/tasklines/update_tasklines.js',
      mode: hasChanges ? 'refresh' : 'check',
    },
    summary: {
      tasklines: {
        added: summary.tasklinesAdded,
        removed: summary.tasklinesRemoved,
        changed: summary.tasklinesChanged,
      },
      steps: {
        added: summary.stepsAdded,
        removed: summary.stepsRemoved,
        changed: summary.stepsChanged,
      },
    },
    parsingFailures: failures.length,
  };

  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
}

module.exports = {
  readMetadata,
  writeMetadata,
};
