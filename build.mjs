#!/usr/bin/env node

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { cpSync } from 'node:fs';
import { fetchProfile } from '@singi-labs/sifa-sdk/query/fetchers';

import {
  renderHome,
  renderNewsPage,
  renderNewsPost,
  renderPublicationsPage,
  renderFundingPage,
  renderServicePage,
  renderBlogPage,
  renderBlogPost,
} from './site-renderer.mjs';

const SIFA_ID =
  process.env.SIFA_ID ??
  process.env.SIFA_DID ??
  process.env.SIFA_HANDLE ??
  'ronentk.me';

const SIFA_BASE = process.env.SIFA_BASE ?? 'https://sifa.id';
const OUT = 'dist';

async function readJson(path) {
  return JSON.parse(
    await readFile(new URL(path, import.meta.url), 'utf8')
  );
}

function stripQuotes(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseBlogPost(source, filename) {
  const metadata = {};
  let body = source.replace(/\r\n/g, '\n');

  if (body.startsWith('---\n')) {
    const end = body.indexOf('\n---\n', 4);

    if (end !== -1) {
      const frontMatter = body.slice(4, end);
      body = body.slice(end + 5);

      for (const line of frontMatter.split('\n')) {
        const separator = line.indexOf(':');
        if (separator === -1) continue;

        const key = line.slice(0, separator).trim();
        const value = stripQuotes(line.slice(separator + 1));
        if (key) metadata[key] = value;
      }
    }
  }

  const fileStem = filename.replace(/\.md$/i, '');
  const defaultSlug = fileStem.replace(/^\d{4}-\d{2}-\d{2}-/, '');

  return {
    title: metadata.title || defaultSlug.replaceAll('-', ' '),
    date: metadata.date || '',
    slug: metadata.slug || defaultSlug,
    summary: metadata.summary || '',
    markdown: body.trim(),
  };
}

async function readBlogPosts() {
  const directory = new URL('./content/blog/', import.meta.url);
  const files = await readdir(directory);

  const markdownFiles = files.filter(
    (name) => name.endsWith('.md') && !name.startsWith('_') && !name.startsWith('.')
  );

  return Promise.all(
    markdownFiles.map(async (filename) => {
      const source = await readFile(new URL(filename, directory), 'utf8');
      return parseBlogPost(source, filename);
    })
  );
}

async function main() {
  console.log(`Building site for "${SIFA_ID}"...`);

  const profile = await fetchProfile(
    { baseUrl: SIFA_BASE },
    SIFA_ID
  );

  if (!profile) {
    throw new Error(`No public Sifa profile found for "${SIFA_ID}".`);
  }

  const [
    localProfile,
    news,
    publications,
    funding,
    hiring,
    service,
    blog,
  ] = await Promise.all([
    readJson('./profile.json'),
    readJson('./content/news.json'),
    readJson('./content/publications.json'),
    readJson('./content/funding.json'),
    readJson('./content/hiring.json'),
    readJson('./content/service.json'),
    readBlogPosts(),
  ]);

  Object.assign(profile, localProfile, {
    news,
    publications,
    funding,
    hiring,
    service,
    blog,
  });

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await mkdir(`${OUT}/news`, { recursive: true });
  await mkdir(`${OUT}/blog`, { recursive: true });

  cpSync('assets', `${OUT}/assets`, { recursive: true });

  await writeFile(
    `${OUT}/site.css`,
    await readFile(new URL('./site.css', import.meta.url), 'utf8')
  );

  const pageWrites = [
    writeFile(`${OUT}/index.html`, renderHome(profile)),
    writeFile(`${OUT}/news.html`, renderNewsPage(profile)),
    writeFile(`${OUT}/blog.html`, renderBlogPage(profile)),
    writeFile(`${OUT}/publications.html`, renderPublicationsPage(profile)),
    writeFile(`${OUT}/funding.html`, renderFundingPage(profile)),
    writeFile(`${OUT}/service.html`, renderServicePage(profile)),
  ];

  for (const item of news) {
    if (!item.slug) continue;

    pageWrites.push(
      writeFile(
        `${OUT}/news/${encodeURIComponent(item.slug)}.html`,
        renderNewsPost(profile, item)
      )
    );
  }

  for (const post of blog) {
    pageWrites.push(
      writeFile(`${OUT}/blog/${post.slug}.html`, renderBlogPost(profile, post))
    );
  }

  await Promise.all(pageWrites);

  console.log(`Done. ${blog.length} blog post(s).`);
}

main().catch((err) => {
  console.error(`Build failed: ${err.message}`);
  process.exit(1);
});
