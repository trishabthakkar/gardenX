'use strict';

/**
 * gardenX Live Graph Store
 *
 * Wraps chokidar to watch /notes for any .md change.
 * Exposes getGraph() so the Express layer always reads the latest state
 * without a manual reload.
 */

const chokidar = require('chokidar');
const path     = require('path');
const { buildGraph } = require('./parser');

/**
 * @param {string}   notesDir   Absolute path to the notes folder
 * @param {Function} onRebuild  Called with (graph, event, filePath) after rebuild
 * @returns {{ getGraph: () => object, close: () => Promise<void> }}
 */
function createWatcher(notesDir, onRebuild) {
  // Eager initial build so getGraph() is ready before the first request
  let state = buildGraph(notesDir);

  const watcher = chokidar.watch(path.join(notesDir, '*.md'), {
    persistent:    true,
    ignoreInitial: true,
    // Wait for the file write to settle before re-parsing
    awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 40 },
  });

  function rebuild(event, filePath) {
    state = buildGraph(notesDir);
    onRebuild(state, event, filePath);
  }

  watcher
    .on('add',    p => rebuild('add',    p))
    .on('change', p => rebuild('change', p))
    .on('unlink', p => rebuild('unlink', p));

  return {
    getGraph: () => state,
    close:    () => watcher.close(),
  };
}

module.exports = { createWatcher };
