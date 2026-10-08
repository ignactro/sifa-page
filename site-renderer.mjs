const SITE_URL = 'https://ignacio-castro.uk';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value, SITE_URL);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

function sorted(items = []) {
  return [...items].sort((a, b) => {
    const aDate = new Date(a.date ?? 0).getTime();
    const bDate = new Date(b.date ?? 0).getTime();

    return bDate - aDate;
  });
}

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
  });
}

function liveHiring(profile) {
  return sorted(profile.hiring ?? []).filter(
    (item) => item.status === 'live'
  );
}

function selectedPublications(items = []) {
  const hasExplicitSelection = items.some(
    (item) => typeof item.selected === 'boolean'
  );

  if (hasExplicitSelection) {
    return sorted(
      items.filter((item) => item.selected === true)
    ).slice(0, 10);
  }

  // Fallback for publications data without explicit selected flags.
  return sorted(items).slice(0, 10);
}

function sidebar(profile, current = '') {
  const hasNews = (profile.news ?? []).length > 0;
  const hasBlog = (profile.blog ?? []).length > 0;
  const hasPublications = (profile.publications ?? []).length > 0;
  const hasFunding = (profile.funding ?? []).length > 0;
  const hasService = (profile.service ?? []).length > 0;
  const hasHiring = liveHiring(profile).length > 0;

  const avatar = safeUrl(profile.avatar);

  return `
    <aside class="sidebar">
      <div class="identity">
        ${
          avatar
            ? `<a href="/">
                 <img
                   class="avatar"
                   src="${escapeHtml(avatar)}"
                   alt="${escapeHtml(profile.displayName ?? '')}"
                 >
               </a>`
            : ''
        }

        <a class="name" href="/">
          ${escapeHtml(profile.displayName ?? '')}
        </a>

      ${
        profile.headline || profile.affiliation
          ? `<div class="headline">
               ${
                 profile.headline
                   ? `<div class="headline-role">${escapeHtml(profile.headline)}</div>`
                   : ''
               }
               ${
                 profile.affiliation
                   ? `<div class="headline-affiliation">${escapeHtml(profile.affiliation)}</div>`
                   : ''
               }
             </div>`
          : ''
      }

      <div class="profile-links">
        <a
          href="https://scholar.google.com/citations?user=WXj6ZtcAAAAJ&hl=en&authuser=1&oi=ao"
          target="_blank"
          rel="noopener noreferrer"
        >
          G'Scholar
        </a>

        <a
          href="https://dblp.org/pid/99/11343"
          target="_blank"
          rel="noopener noreferrer"
        >
          DBLP
        </a>
      

        <a
          href="https://orcid.org/0000-0002-7739-6184"
          target="_blank"
          rel="noopener noreferrer"
        >
          ORCID
        </a>
      </div>

      

      <nav class="nav">
        <a href="/research.html" ${
          current === 'research' ? 'aria-current="page"' : ''
        }>Research</a>

        ${
          hasPublications
            ? `<a href="/publications.html" ${
                current === 'publications' ? 'aria-current="page"' : ''
              }>Publications</a>`
            : ''
        }

        ${
          hasFunding
            ? `<a href="/funding.html" ${
                current === 'funding' ? 'aria-current="page"' : ''
              }>Funding</a>`
            : ''
        }

        ${
          hasService
            ? `<a href="/service.html" ${
                current === 'service' ? 'aria-current="page"' : ''
              }>Service</a>`
            : ''
        }

        <a href="/talks-media.html" ${
          current === 'talks-media' ? 'aria-current="page"' : ''
        }>Talks &amp; Media</a>

        ${
          hasNews
            ? `<a href="/news.html" ${
                current === 'news' ? 'aria-current="page"' : ''
              }>News</a>`
            : ''
        }

        ${
          hasHiring
            ? `<a href="/#hiring">Hiring</a>`
            : ''
        }

        ${
          hasBlog
            ? `<a href="/blog.html" ${
                current === 'blog' ? 'aria-current="page"' : ''
              }>Blog</a>`
            : ''
        }
      </nav>

      <button
        id="theme-toggle"
        class="theme-toggle"
        type="button"
        aria-label="Switch colour theme"
        title="Switch colour theme"
      >
        ◐
      </button>
    </aside>
  `;
}

function document(profile, body, current = '', title = '') {
  const displayName = profile.displayName ?? 'Ignacio Castro';

  const pageTitle = title
    ? `${title} — ${displayName}`
    : displayName;

  const description = stripHtml(
    profile.about ?? profile.headline ?? ''
  );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>${escapeHtml(pageTitle)}</title>

  <meta
    name="description"
    content="${escapeHtml(description)}"
  >

  <script>
    (() => {
      const savedTheme = localStorage.getItem('theme');
      document.documentElement.dataset.theme = savedTheme || 'dark';
    })();
  </script>

  <link rel="stylesheet" href="/site.css">
</head>

<body>
  <div class="layout">
    ${sidebar(profile, current)}

    <main class="main">
      ${body}

      <footer>
        © ${new Date().getFullYear()} ${escapeHtml(displayName)}
      </footer>
    </main>
  </div>

  <script>
    const themeToggle = document.getElementById('theme-toggle');

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const current =
          document.documentElement.dataset.theme || 'dark';

        const next =
          current === 'dark' ? 'light' : 'dark';

        document.documentElement.dataset.theme = next;
        localStorage.setItem('theme', next);
      });
    }
  </script>
</body>
</html>`;
}

function newsPostUrl(item) {
  return item.slug
    ? `/news/${encodeURIComponent(item.slug)}.html`
    : '/news.html';
}

function newsItem(item) {
  const postUrl = newsPostUrl(item);
  const body = item.html ?? escapeHtml(item.text ?? '');

  return `
    <article class="item news-item">
      ${
        item.date
          ? `<div class="item-date">${formatDate(item.date)}</div>`
          : ''
      }

      <div class="item-main">
        <div class="news-title">
          <a href="${postUrl}">
            ${escapeHtml(item.title ?? '')}
          </a>
        </div>

        <div class="item-description">
          ${body}
        </div>
      </div>
    </article>
  `;
}

function compactNewsCard(item) {
  const postUrl = newsPostUrl(item);
  const summary = stripHtml(item.html ?? item.text ?? '');

  return `
    <a class="compact-card" href="${postUrl}">
      ${
        item.date
          ? `<div class="card-date">${formatDate(item.date)}</div>`
          : ''
      }

      <div class="card-title">${escapeHtml(item.title ?? '')}</div>

      ${
        summary
          ? `<div class="card-summary">${escapeHtml(summary)}</div>`
          : ''
      }

      <div class="card-more">Read more →</div>
    </a>
  `;
}

function renderNewsBody(item) {
  return item.html ?? (
    item.text
      ? `<p>${escapeHtml(item.text)}</p>`
      : ''
  );
}

function newsExternalLink(item) {
  const url = safeUrl(item.url);

  if (!url) return '';

  return `
    <p class="news-external-link">
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
        More information →
      </a>
    </p>
  `;
}

function publicationExtra(entry, className = '') {
  const item = typeof entry === 'string'
    ? { label: entry }
    : entry ?? {};

  const label = escapeHtml(item.label ?? '');
  if (!label) return '';

  const url = safeUrl(item.url);
  const classes = className ? ` class="${className}"` : '';

  return url
    ? `<a${classes} href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">[${label}]</a>`
    : `<span${classes}>[${label}]</span>`;
}

function formatPublicationAuthors(authors) {
  const names = String(authors ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

function publicationItem(item, { showExtras = true } = {}) {
  const url = safeUrl(item.url);
  const title = escapeHtml(item.title ?? '');

  const authors = formatPublicationAuthors(item.authors);
  const venue = String(item.venue ?? '').trim();
  const venueText = venue
    ? venue.toLowerCase().startsWith('arxiv')
      ? venue
      : `In ${venue}`
    : '';


  const bibliographicLine = [
    authors ? `${authors}.` : null,
    venueText || null,
    item.year ? `(${item.year}).` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const details = bibliographicLine;

  const media = (item.media ?? [])
    .map((entry) => publicationExtra(entry))
    .filter(Boolean);

  const awards = (item.awards ?? [])
    .map((entry) => publicationExtra(entry, 'publication-award'))
    .filter(Boolean);

  const extras = [...media, ...awards].join(' ');

  return `
    <article class="item publication-item">
      <div class="item-main">

        <div class="publication-title">
          ${
            url
              ? `<a href="${escapeHtml(url)}">${title}</a>`
              : title
          }
        </div>

        ${
          details
            ? `<div class="authors">${escapeHtml(details)}</div>`
            : ''
        }

        ${
          showExtras && extras
            ? `<div class="publication-extras">${extras}</div>`
            : ''
        }

      </div>
    </article>
  `;
}

function fundingItem(item) {
  const url = safeUrl(item.url);
  const title = escapeHtml(item.title ?? '');
  const description = item.description ?? item.text ?? '';

  return `
    <article class="item funding-item">
      <div class="item-main">

        <div class="funding-title">
          ${
            url
              ? `<a href="${escapeHtml(url)}">${title}</a>`
              : title
          }
        </div>

        ${
          item.funder || item.years
            ? `<div class="metadata">
                 ${escapeHtml(
                   [item.funder, item.years]
                     .filter(Boolean)
                     .join(' · ')
                 )}
               </div>`
            : ''
        }

        ${
          description
            ? `<div class="item-description">${description}</div>`
            : ''
        }

      </div>
    </article>
  `;
}

function serviceItem(item) {
  const title = escapeHtml(item.title ?? '');
  const role = escapeHtml(item.role ?? '');
  const years = escapeHtml(item.years ?? '');

  return `
    <p class="service-item">
      <strong>${title}${title ? '.' : ''}</strong>${role ? ` ${role}` : ''}${years ? ` (${years})` : ''}
    </p>
  `;
}

function serviceGroup(title, items) {
  if (!items.length) return '';

  return `
    <div class="service-group">
      <h2>${escapeHtml(title)}</h2>
      <div class="items">
        ${items.map(serviceItem).join('')}
      </div>
    </div>
  `;
}

function hiringItem(item) {
  const url = safeUrl(item.url);
  const title = escapeHtml(item.title ?? '');

  return `
    <article class="item hiring-item">
      <div class="item-main">

        <div class="hiring-title">
          ${
            url
              ? `<a href="${escapeHtml(url)}">${title}</a>`
              : title
          }
        </div>

        ${
          item.text
            ? `<div class="item-description">${item.text}</div>`
            : ''
        }

      </div>
    </article>
  `;
}


function escapeInlineMarkdown(value = '') {
  let html = escapeHtml(value);

  html = html.replace(
    /`([^`]+)`/g,
    '<code>$1</code>'
  );

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  return html;
}

function renderMarkdown(source = '') {
  const lines = String(source).replace(/\r\n/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let inCode = false;
  let codeLines = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    output.push(`<p>${escapeInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!listType || !listItems.length) return;
    output.push(
      `<${listType}>${listItems
        .map((item) => `<li>${escapeInlineMarkdown(item)}</li>`)
        .join('')}</${listType}>`
    );
    listType = null;
    listItems = [];
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();

      if (inCode) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      output.push(`<h${level}>${escapeInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(unordered[1]);
      continue;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(ordered[1]);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      output.push(`<blockquote>${escapeInlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      flushList();
      output.push('<hr>');
      continue;
    }

    paragraph.push(line.trim());
  }

  if (inCode) {
    output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  flushParagraph();
  flushList();

  return output.join('\n');
}

function blogPostUrl(item) {
  return item.slug
    ? `/blog/${encodeURIComponent(item.slug)}.html`
    : '/blog.html';
}

function compactBlogCard(item) {
  const postUrl = blogPostUrl(item);
  const summary = item.summary || stripHtml(item.markdown ?? '');

  return `
    <a class="compact-card" href="${postUrl}">
      ${
        item.date
          ? `<div class="card-date">${formatDate(item.date)}</div>`
          : ''
      }

      <div class="card-title">${escapeHtml(item.title ?? '')}</div>

      ${
        summary
          ? `<div class="card-summary">${escapeHtml(summary)}</div>`
          : ''
      }

      <div class="card-more">Read more →</div>
    </a>
  `;
}

function section({
  id,
  title,
  items,
  renderer,
  allUrl,
}) {
  if (!items.length) return '';

  return `
    <section class="section" ${id ? `id="${id}"` : ''}>
      <header class="section-header">
        <h2>
          ${
            allUrl
              ? `<a href="${allUrl}">${escapeHtml(title)}</a>`
              : escapeHtml(title)
          }
        </h2>

        ${
          allUrl
            ? `<a class="view-all" href="${allUrl}">All →</a>`
            : ''
        }
      </header>

      <div class="items">
        ${items.map(renderer).join('')}
      </div>
    </section>
  `;
}

function markdownPage(profile, title, current, markdown) {
  return document(
    profile,
    `
      <section class="section listing-page">
        <header class="section-header">
          <h1>${escapeHtml(title)}</h1>
        </header>

        <div class="blog-content">
          ${renderMarkdown(markdown ?? '')}
        </div>
      </section>
    `,
    current,
    title
  );
}

export function renderHome(profile) {
  const news = sorted(profile.news ?? []).slice(0, 3);
  const blog = sorted(profile.blog ?? []).slice(0, 3);
  const publications = selectedPublications(profile.publications ?? []);
  const funding = sorted(profile.funding ?? []).slice(0, 5);
  const hiring = liveHiring(profile);

  const body = `
    <section class="section about-section">
      <div class="about">
        ${profile.about ?? ''}
      </div>
    </section>

    ${
      news.length
        ? `
          <section class="section" id="news">
            <header class="section-header">
              <h2><a href="/news.html">News</a></h2>
              <a class="view-all" href="/news.html">All →</a>
            </header>

            <div class="compact-grid">
              ${news.map(compactNewsCard).join('')}
            </div>
          </section>
        `
        : ''
    }

    ${
      blog.length
        ? `
          <section class="section" id="blog">
            <header class="section-header">
              <h2><a href="/blog.html">Blog</a></h2>
              <a class="view-all" href="/blog.html">All →</a>
            </header>

            <div class="compact-grid">
              ${blog.map(compactBlogCard).join('')}
            </div>
          </section>
        `
        : ''
    }

    ${section({
      id: 'publications',
      title: 'Selected Publications',
      items: publications,
      renderer: (item) => publicationItem(item),
      allUrl: '/publications.html',
    })}

    ${section({
      id: 'funding',
      title: 'Funding',
      items: funding,
      renderer: fundingItem,
      allUrl: '/funding.html',
    })}

    ${section({
      id: 'hiring',
      title: 'Hiring',
      items: hiring,
      renderer: hiringItem,
    })}
  `;

  return document(profile, body);
}

export function renderResearchPage(profile) {
  return markdownPage(
    profile,
    'Research',
    'research',
    profile.researchMarkdown
  );
}

export function renderTalksMediaPage(profile) {
  return markdownPage(
    profile,
    'Talks & Media',
    'talks-media',
    profile.talksMediaMarkdown
  );
}

export function renderNewsPage(profile) {
  const items = sorted(profile.news ?? []);

  return document(
    profile,
    `
      <section class="section listing-page">
        <header class="section-header">
          <h1>News</h1>
        </header>

        <div class="items">
          ${items.map(newsItem).join('')}
        </div>
      </section>
    `,
    'news',
    'News'
  );
}

export function renderNewsPost(profile, item) {
  const body = `
    <article class="section listing-page blog-post">
      <a class="back-link" href="/news.html">← News</a>

      <header class="blog-post-header">
        <h1>${escapeHtml(item.title ?? '')}</h1>
        ${
          item.date
            ? `<div class="blog-post-date">${formatDate(item.date)}</div>`
            : ''
        }
      </header>

      <div class="blog-content">
        ${renderNewsBody(item)}
        ${newsExternalLink(item)}
      </div>
    </article>
  `;

  return document(
    profile,
    body,
    'news',
    item.title ?? 'News'
  );
}

export function renderBlogPage(profile) {
  const items = sorted(profile.blog ?? []);

  return document(
    profile,
    `
      <section class="section listing-page">
        <header class="section-header">
          <h1>Blog</h1>
        </header>

        ${
          items.length
            ? `<div class="blog-list">${items.map(compactBlogCard).join('')}</div>`
            : '<p class="empty-state">No posts yet.</p>'
        }
      </section>
    `,
    'blog',
    'Blog'
  );
}

export function renderBlogPost(profile, post) {
  const body = `
    <article class="section listing-page blog-post">
      <a class="back-link" href="/blog.html">← Blog</a>

      <header class="blog-post-header">
        <h1>${escapeHtml(post.title ?? '')}</h1>

        ${
          post.date
            ? `<div class="blog-post-date">${formatDate(post.date)}</div>`
            : ''
        }

        ${
          post.summary
            ? `<p class="blog-post-summary">${escapeHtml(post.summary)}</p>`
            : ''
        }
      </header>

      <div class="blog-content">
        ${renderMarkdown(post.markdown ?? '')}
      </div>
    </article>
  `;

  return document(
    profile,
    body,
    'blog',
    post.title ?? 'Blog'
  );
}

export function renderPublicationsPage(profile) {
  const items = sorted(profile.publications ?? []);

  return document(
    profile,
    `
      <section class="section listing-page">
        <header class="section-header">
          <h1>Publications</h1>
        </header>

        <div class="items">
          ${items.map((item) => publicationItem(item)).join('')}
        </div>
      </section>
    `,
    'publications',
    'Publications'
  );
}

export function renderFundingPage(profile) {
  const items = sorted(profile.funding ?? []);

  return document(
    profile,
    `
      <section class="section listing-page">
        <header class="section-header">
          <h1>Funding</h1>
        </header>

        <div class="items">
          ${items.map(fundingItem).join('')}
        </div>
      </section>
    `,
    'funding',
    'Funding'
  );
}

export function renderServicePage(profile) {
  const items = profile.service ?? [];
  const categories = [
    'Technical Programme Committees',
    'Journals',
    'Grant Reviewing',
    'External Examining',
  ];

  const body = categories
    .map((category) =>
      serviceGroup(
        category,
        items.filter((item) => item.category === category)
      )
    )
    .join('');

  return document(
    profile,
    `
      <section class="section listing-page service-page">
        <header class="section-header">
          <h1>Service</h1>
        </header>

        ${body}
      </section>
    `,
    'service',
    'Service'
  );
}
