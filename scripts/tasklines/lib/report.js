const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual } = require('util');

const MAX_STEP_CHANGES_IN_REPORT = 5;

/**
 * @param {Array<any>} existing
 * @param {Array<any>} updated
 * @param {Function} getTasklineKey
 * @returns {{ added: Array<{name: string, id: string}>, removed: Array<{name: string, id: string}>, changed: Array<{name: string, id: string}>, changedDetails: Array<any>, stepsAdded: number, stepsRemoved: number, stepsChanged: number }}
 */
function diffTasklines(existing, updated, getTasklineKey) {
  const existingMap = new Map(existing.map(item => [getTasklineKey(item), item]));
  const updatedMap = new Map(updated.map(item => [getTasklineKey(item), item]));

  const added = [];
  const removed = [];
  const changed = [];
  const changedDetails = [];
  let stepsAdded = 0;
  let stepsRemoved = 0;
  let stepsChanged = 0;

  for (const [key, item] of updatedMap) {
    if (!existingMap.has(key)) {
      added.push({ name: item.name, id: item.id });
      stepsAdded += item.steps.length;
      continue;
    }
    const existingItem = existingMap.get(key);
    if (!isDeepStrictEqual(existingItem, item)) {
      changed.push({ name: item.name, id: item.id });
      const oldSteps = existingItem.steps || [];
      const newSteps = item.steps || [];
      const detail = {
        name: item.name,
        id: item.id,
        stepsAdded: 0,
        stepsRemoved: 0,
        stepsChanged: 0,
        stepChanges: [],
      };
      if (newSteps.length > oldSteps.length) {
        const delta = newSteps.length - oldSteps.length;
        stepsAdded += delta;
        detail.stepsAdded += delta;
      } else if (oldSteps.length > newSteps.length) {
        const delta = oldSteps.length - newSteps.length;
        stepsRemoved += delta;
        detail.stepsRemoved += delta;
      }
      const minLen = Math.min(oldSteps.length, newSteps.length);
      for (let i = 0; i < minLen; i++) {
        if (!isDeepStrictEqual(oldSteps[i], newSteps[i])) {
          stepsChanged += 1;
          detail.stepsChanged += 1;
          if (detail.stepChanges.length < MAX_STEP_CHANGES_IN_REPORT) {
            detail.stepChanges.push({
              order: oldSteps[i].order,
              before: oldSteps[i].objective,
              after: newSteps[i].objective,
            });
          }
        }
      }
      changedDetails.push(detail);
    }
  }

  for (const [key, item] of existingMap) {
    if (!updatedMap.has(key)) {
      removed.push({ name: item.name, id: item.id });
      stepsRemoved += item.steps.length;
    }
  }

  return {
    added,
    removed,
    changed,
    changedDetails,
    stepsAdded,
    stepsRemoved,
    stepsChanged,
  };
}

/**
 * @param {Array<{ diff: any }>} outputs
 * @returns {{ tasklinesAdded: number, tasklinesRemoved: number, tasklinesChanged: number, stepsAdded: number, stepsRemoved: number, stepsChanged: number }}
 */
function getDiffSummary(outputs) {
  return outputs.reduce(
    (acc, output) => {
      acc.tasklinesAdded += output.diff.added.length;
      acc.tasklinesRemoved += output.diff.removed.length;
      acc.tasklinesChanged += output.diff.changed.length;
      acc.stepsAdded += output.diff.stepsAdded;
      acc.stepsRemoved += output.diff.stepsRemoved;
      acc.stepsChanged += output.diff.stepsChanged;
      return acc;
    },
    {
      tasklinesAdded: 0,
      tasklinesRemoved: 0,
      tasklinesChanged: 0,
      stepsAdded: 0,
      stepsRemoved: 0,
      stepsChanged: 0,
    }
  );
}

/**
 * @param {string|null} reportPath
 * @param {Array<any>} outputs
 * @param {Array<{title: string, reason: string}>} failures
 */
function writeReport(reportPath, outputs, failures) {
  if (!reportPath) {
    return;
  }

  const timestamp = new Date().toISOString();
  const summary = getDiffSummary(outputs);

  const lines = [];
  lines.push('# Taskline Update Report');
  lines.push('');
  lines.push(`Generated: ${timestamp}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Tasklines added: ${summary.tasklinesAdded}`);
  lines.push(`- Tasklines removed: ${summary.tasklinesRemoved}`);
  lines.push(`- Tasklines changed: ${summary.tasklinesChanged}`);
  lines.push(`- Steps added: ${summary.stepsAdded}`);
  lines.push(`- Steps removed: ${summary.stepsRemoved}`);
  lines.push(`- Steps changed: ${summary.stepsChanged}`);
  lines.push('');

  if (summary.tasklinesRemoved > 0 || summary.stepsRemoved > 0) {
    lines.push('## Warning');
    lines.push(
      '- A decrease in taskline or step counts can be expected during major content changes.'
    );
    lines.push(
      '- Review removals to ensure the wiki data and progression logic still align with ToonScout.'
    );
    lines.push('');
  }

  lines.push('## Details');
  lines.push('<details>');
  lines.push('<summary>Per-file changes</summary>');
  lines.push('');
  for (const output of outputs) {
    const fileName = path.basename(output.filePath);
    const diff = output.diff;
    lines.push(`- ${fileName}`);
    lines.push(`  - tasklines: +${diff.added.length} / -${diff.removed.length} / ~${diff.changed.length}`);
    lines.push(`  - steps: +${diff.stepsAdded} / -${diff.stepsRemoved} / ~${diff.stepsChanged}`);
    if (diff.added.length) {
      lines.push(
        `  - added: ${diff.added.map(item => `${item.name} (${item.id})`).join(', ')}`
      );
    }
    if (diff.removed.length) {
      lines.push(
        `  - removed: ${diff.removed.map(item => `${item.name} (${item.id})`).join(', ')}`
      );
    }
    if (diff.changed.length) {
      lines.push(
        `  - changed: ${diff.changed.map(item => `${item.name} (${item.id})`).join(', ')}`
      );
    }
    if (diff.changedDetails.length) {
      lines.push(`  <details>`);
      lines.push(`  <summary>Taskline change details</summary>`);
      lines.push('');
      diff.changedDetails.forEach(detail => {
        lines.push(
          `  - ${detail.name} (${detail.id}): steps +${detail.stepsAdded} / -${detail.stepsRemoved} / ~${detail.stepsChanged}`
        );
        detail.stepChanges.forEach(change => {
          lines.push(
            `    - step ${change.order}: "${change.before}" -> "${change.after}"`
          );
        });
      });
      lines.push(`  </details>`);
      lines.push('');
    }
  }
  lines.push('</details>');
  lines.push('');

  if (failures.length) {
    lines.push('## Parsing Issues');
    failures.forEach(failure => {
      lines.push(`- ${failure.title} (${failure.reason})`);
    });
    lines.push('');
  }

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
}

module.exports = {
  diffTasklines,
  getDiffSummary,
  writeReport,
};
