/**
 * kdd-transform-lib — Core library for transforming documents into KDD artifacts.
 *
 * Two-phase pipeline:
 *   1. Analysis: document → decomposition plan (list of artifacts to create)
 *   2. Generation: for each artifact in the plan → full KDD spec
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, basename, extname, dirname } from 'path';
import matter from 'gray-matter';
import {
  ANALYSIS_SYSTEM_PROMPT,
  GENERATION_SYSTEM_PROMPT,
  buildAnalysisUserPrompt,
  buildGenerationUserPrompt,
} from './prompts.mjs';

// ─── Client ──────────────────────────────────────────────────────────────────

let _client;

function getClient(apiKey) {
  if (!_client) {
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// ─── File reading ────────────────────────────────────────────────────────────

const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.html', '.htm', '.xml', '.json', '.yaml', '.yml',
  '.csv', '.tsv', '.rst', '.adoc', '.tex', '.log', '.cfg', '.ini',
  '.toml', '.properties', '.sql', '.graphql', '.proto',
]);

export function readDocument(filePath) {
  const ext = extname(filePath).toLowerCase();
  const content = readFileSync(filePath, 'utf-8');

  if (ext === '.md') {
    const parsed = matter(content);
    return {
      name: basename(filePath),
      content: parsed.content,
      frontmatter: parsed.data,
      raw: content,
    };
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    return { name: basename(filePath), content, frontmatter: null, raw: content };
  }

  return { name: basename(filePath), content, frontmatter: null, raw: content };
}

// ─── Existing ID scanner ─────────────────────────────────────────────────────

export function scanExistingIds(specsDir) {
  const ids = [];
  const counters = {};

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.')) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.md')) {
        try {
          const parsed = matter(readFileSync(full, 'utf-8'));
          if (parsed.data.id) {
            ids.push(parsed.data.id);
            const match = parsed.data.id.match(/^([A-Z]+-[A-Z]+-?)(\d+)$/);
            if (match) {
              const prefix = match[1];
              const num = parseInt(match[2], 10);
              counters[prefix] = Math.max(counters[prefix] || 0, num);
            }
          }
        } catch { /* skip unparseable */ }
      }
    }
  }

  try { walk(specsDir); } catch { /* dir doesn't exist */ }
  return { ids, counters };
}

// ─── Phase 1: Analysis ──────────────────────────────────────────────────────

export async function analyzeDocument(document, options = {}) {
  const client = getClient(options.apiKey);

  const userPrompt = buildAnalysisUserPrompt(
    document.content,
    document.name,
    {
      domain: options.domain,
      existingIds: options.existingIds,
      startNumbers: options.startNumbers,
      focus: options.focus,
    }
  );

  const response = await client.messages.create({
    model: options.model || 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: [{ type: 'text', text: ANALYSIS_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse analysis response as JSON: ${e.message}\n\nRaw response:\n${text}`);
  }
}

// ─── Phase 2: Generation ────────────────────────────────────────────────────

export async function generateSpec(artifactPlan, sourceContent, options = {}) {
  const client = getClient(options.apiKey);
  const today = new Date().toISOString().slice(0, 10);

  const userPrompt = buildGenerationUserPrompt(artifactPlan, sourceContent, today);

  const response = await client.messages.create({
    model: options.model || 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: [{ type: 'text', text: GENERATION_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  return text.replace(/^```markdown\s*/, '').replace(/\s*```$/, '').trim();
}

// ─── Full pipeline ──────────────────────────────────────────────────────────

export async function transformDocument(filePath, options = {}) {
  const document = readDocument(filePath);
  const outDir = options.outDir || join(dirname(filePath), '_kdd_output');

  let existingIds = [];
  let startNumbers = {};
  if (options.specsDir) {
    const scan = scanExistingIds(options.specsDir);
    existingIds = scan.ids;
    startNumbers = scan.counters;
  }

  const onProgress = options.onProgress || (() => {});

  // Phase 1: Analysis
  onProgress('analysis_start', { document: document.name });

  const plan = await analyzeDocument(document, {
    ...options,
    existingIds,
    startNumbers,
  });

  onProgress('analysis_complete', {
    artifactCount: plan.artifacts.length,
    summary: plan.document_summary,
  });

  // Phase 2: Generation
  mkdirSync(outDir, { recursive: true });

  const results = [];
  const concurrency = options.concurrency || 3;

  for (let i = 0; i < plan.artifacts.length; i += concurrency) {
    const batch = plan.artifacts.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (artifact, batchIdx) => {
        const idx = i + batchIdx;
        onProgress('generating', { index: idx + 1, total: plan.artifacts.length, id: artifact.id });

        const spec = await generateSpec(artifact, document.content, options);

        const slug = artifact.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        const titleSlug = artifact.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50);
        const fileName = `${slug}-${titleSlug}.md`;

        const layerDir = mapLayerToDir(artifact.layer);
        const targetDir = join(outDir, layerDir);
        mkdirSync(targetDir, { recursive: true });

        const outPath = join(targetDir, fileName);
        writeFileSync(outPath, spec, 'utf-8');

        return { id: artifact.id, title: artifact.title, path: outPath, layer: artifact.layer };
      })
    );

    results.push(...batchResults);
  }

  // Write manifest
  const manifest = {
    source: document.name,
    generated: new Date().toISOString(),
    domain: plan.domain,
    summary: plan.document_summary,
    artifacts: results.map(r => ({ id: r.id, title: r.title, layer: r.layer, file: basename(r.path) })),
    cross_references: plan.cross_references || [],
  };

  const manifestPath = join(outDir, '_manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  onProgress('complete', { total: results.length, outDir, manifestPath });

  return { plan, results, manifest, manifestPath, outDir };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapLayerToDir(layer) {
  const map = {
    architecture: 'architecture',
    domain: 'domain',
    product: 'product',
    feature: 'feature',
    documentation: 'documentation',
    'work-spec': 'work',
    'work-plan': 'work',
    'work-task': 'work',
  };
  return map[layer] || 'other';
}
