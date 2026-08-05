#!/usr/bin/env node

/**
 * kdd-transform — CLI to transform any document into KDD knowledge artifacts.
 *
 * Usage:
 *   node kdd-transform.mjs transform <file> [options]
 *   node kdd-transform.mjs analyze <file> [options]
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';
import { transformDocument, analyzeDocument, readDocument, scanExistingIds } from './kdd-transform-lib.mjs';

const program = new Command();

program
  .name('kdd-transform')
  .description('Transform documents into KDD knowledge artifacts')
  .version('1.0.0');

// ─── analyze ─────────────────────────────────────────────────────────────────

program
  .command('analyze')
  .description('Analyze a document and show the decomposition plan (no files written)')
  .argument('<file>', 'Path to the source document')
  .option('-m, --model <model>', 'Claude model to use', 'claude-sonnet-4-6')
  .option('-d, --domain <domain>', 'Target functional domain')
  .option('-f, --focus <focus>', 'Focus on specific aspect of the document')
  .option('-s, --specs-dir <dir>', 'Existing specs directory (to avoid ID collisions)')
  .option('-k, --api-key <key>', 'Anthropic API key (or set ANTHROPIC_API_KEY)')
  .action(async (file, opts) => {
    const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Error: ANTHROPIC_API_KEY not set. Use --api-key or set the environment variable.');
      process.exit(1);
    }

    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`\n  Analyzing: ${relative(process.cwd(), filePath)}\n`);

    const document = readDocument(filePath);

    let existingIds = [];
    let startNumbers = {};
    if (opts.specsDir) {
      const scan = scanExistingIds(resolve(opts.specsDir));
      existingIds = scan.ids;
      startNumbers = scan.counters;
      console.log(`  Found ${existingIds.length} existing specs in ${opts.specsDir}\n`);
    }

    try {
      const plan = await analyzeDocument(document, {
        apiKey,
        model: opts.model,
        domain: opts.domain,
        focus: opts.focus,
        existingIds,
        startNumbers,
      });

      console.log(`  Domain: ${plan.domain}`);
      console.log(`  Summary: ${plan.document_summary}\n`);
      console.log(`  Artifacts identified: ${plan.artifacts.length}\n`);

      const maxIdLen = Math.max(...plan.artifacts.map(a => a.id.length));
      const maxTitleLen = Math.max(...plan.artifacts.map(a => a.title.length), 5);

      console.log(`  ${'ID'.padEnd(maxIdLen)}  ${'Layer'.padEnd(14)}  ${'Conf'.padEnd(6)}  Title`);
      console.log(`  ${'─'.repeat(maxIdLen)}  ${'─'.repeat(14)}  ${'─'.repeat(6)}  ${'─'.repeat(40)}`);

      for (const a of plan.artifacts) {
        console.log(`  ${a.id.padEnd(maxIdLen)}  ${a.layer.padEnd(14)}  ${a.confidence.padEnd(6)}  ${a.title}`);
      }

      if (plan.cross_references?.length) {
        console.log(`\n  Cross-references: ${plan.cross_references.length}`);
        for (const ref of plan.cross_references) {
          console.log(`    ${ref.from} ──${ref.relation}──▶ ${ref.to}  (${ref.reason})`);
        }
      }

      console.log(`\n  Run 'kdd-transform transform ${file}' to generate the specs.\n`);
    } catch (e) {
      console.error(`\n  Error: ${e.message}`);
      process.exit(1);
    }
  });

// ─── transform ───────────────────────────────────────────────────────────────

program
  .command('transform')
  .description('Transform a document into KDD knowledge artifact files')
  .argument('<file>', 'Path to the source document')
  .option('-o, --out-dir <dir>', 'Output directory for generated specs')
  .option('-m, --model <model>', 'Claude model to use', 'claude-sonnet-4-6')
  .option('-d, --domain <domain>', 'Target functional domain')
  .option('-f, --focus <focus>', 'Focus on specific aspect of the document')
  .option('-s, --specs-dir <dir>', 'Existing specs directory (to avoid ID collisions)')
  .option('-c, --concurrency <n>', 'Parallel generation concurrency', '3')
  .option('-k, --api-key <key>', 'Anthropic API key (or set ANTHROPIC_API_KEY)')
  .action(async (file, opts) => {
    const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Error: ANTHROPIC_API_KEY not set. Use --api-key or set the environment variable.');
      process.exit(1);
    }

    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`\n  Transforming: ${relative(process.cwd(), filePath)}\n`);

    try {
      const result = await transformDocument(filePath, {
        apiKey,
        model: opts.model,
        domain: opts.domain,
        focus: opts.focus,
        specsDir: opts.specsDir ? resolve(opts.specsDir) : undefined,
        outDir: opts.outDir ? resolve(opts.outDir) : undefined,
        concurrency: parseInt(opts.concurrency, 10),
        onProgress: (event, data) => {
          switch (event) {
            case 'analysis_start':
              console.log(`  Phase 1: Analyzing ${data.document}...`);
              break;
            case 'analysis_complete':
              console.log(`  ✓ Found ${data.artifactCount} artifacts`);
              console.log(`    ${data.summary}\n`);
              console.log(`  Phase 2: Generating specs...\n`);
              break;
            case 'generating':
              console.log(`    [${data.index}/${data.total}] ${data.id}`);
              break;
            case 'complete':
              console.log(`\n  ✓ Generated ${data.total} specs in ${relative(process.cwd(), data.outDir)}/`);
              console.log(`    Manifest: ${relative(process.cwd(), data.manifestPath)}\n`);
              break;
          }
        },
      });

      console.log(`  Generated artifacts:\n`);
      const maxIdLen = Math.max(...result.results.map(r => r.id.length));
      for (const r of result.results) {
        console.log(`    ${r.id.padEnd(maxIdLen)}  ${relative(process.cwd(), r.path)}`);
      }
      console.log('');
    } catch (e) {
      console.error(`\n  Error: ${e.message}`);
      process.exit(1);
    }
  });

// ─── batch ───────────────────────────────────────────────────────────────────

program
  .command('batch')
  .description('Transform multiple documents at once')
  .argument('<files...>', 'Paths to source documents')
  .option('-o, --out-dir <dir>', 'Output directory for generated specs')
  .option('-m, --model <model>', 'Claude model to use', 'claude-sonnet-4-6')
  .option('-d, --domain <domain>', 'Target functional domain')
  .option('-s, --specs-dir <dir>', 'Existing specs directory')
  .option('-k, --api-key <key>', 'Anthropic API key')
  .action(async (files, opts) => {
    const apiKey = opts.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Error: ANTHROPIC_API_KEY not set.');
      process.exit(1);
    }

    console.log(`\n  Batch transform: ${files.length} documents\n`);

    let totalArtifacts = 0;

    for (const file of files) {
      const filePath = resolve(file);
      if (!existsSync(filePath)) {
        console.error(`  Skipping (not found): ${file}`);
        continue;
      }

      console.log(`  ── ${relative(process.cwd(), filePath)} ──`);

      try {
        const result = await transformDocument(filePath, {
          apiKey,
          model: opts.model,
          domain: opts.domain,
          specsDir: opts.specsDir ? resolve(opts.specsDir) : undefined,
          outDir: opts.outDir ? resolve(opts.outDir) : undefined,
          concurrency: 3,
          onProgress: (event, data) => {
            if (event === 'analysis_complete') {
              console.log(`    → ${data.artifactCount} artifacts`);
            } else if (event === 'complete') {
              console.log(`    ✓ Done → ${relative(process.cwd(), data.outDir)}/`);
            }
          },
        });
        totalArtifacts += result.results.length;
      } catch (e) {
        console.error(`    ✗ Error: ${e.message}`);
      }

      console.log('');
    }

    console.log(`  Total: ${totalArtifacts} artifacts from ${files.length} documents\n`);
  });

program.parse();
