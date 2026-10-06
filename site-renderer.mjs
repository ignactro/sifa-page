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

function sidebar(profile, current = '') {
  const hasNews = (profile.news ?? []).length > 0;
  const hasPublications = (profile.publications ?? []).length > 0;
  const hasFunding = (profile.funding ?? []).length > 0;
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
          profile.headline
            ? `<div class="headline">${escapeHtml(profile.headline)}</div>`
            : ''
        }
      </div>

      <nav class="nav">
        ${
          hasNews
            ? `<a href="/news.html" ${
                current === 'news' ? 'aria-current="page"' : ''
              }>News</a>`
            : ''
        }

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
          hasHiring
            ? `<a href="/#hiring">Hiring</a>`
            : ''
        }
      </nav>
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
</body>
</html>`;
}

function newsItem(item) {
  const url = safeUrl(item.url);

  const content = url
    ? `<a href="${escapeHtml(url)}">${escapeHtml(item.text ?? '')}</a>`
    : escapeHtml(item.text ?? '');

  return `
    <article class="item news-item">
      ${
        item.date
          ? `<div class="item-date">${formatDate(item.date)}</div>`
          : ''
      }

      <div class="item-main">
        ${content}
      </div>
    </article>
  `;
}

function publicationItem(item) {
  const url = safeUrl(item.url);
  const title = escapeHtml(item.title ?? '');

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
          item.authors
            ? `<div class="authors">${escapeHtml(item.authors)}</div>`
            : ''
        }

        ${
          item.venue || item.year
            ? `<div class="metadata">
                 ${escapeHtml(
                   [item.venue, item.year]
                     .filter(Boolean)
                     .join(', ')
                 )}
               </div>`
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

export function renderHome(profile) {
  const news = sorted(profile.news ?? []).slice(0, 1);
  const publications = sorted(profile.publications ?? []).slice(0, 10);
  const funding = sorted(profile.funding ?? []).slice(0, 5);
  const hiring = liveHiring(profile);

  const body = `
    <section class="section about-section">
      <header class="section-header">
        <h1>About</h1>
      </header>

      <div class="about">
        ${profile.about ?? ''}
      </div>
    </section>

    ${section({
      id: 'news',
      title: 'News',
      items: news,
      renderer: newsItem,
      allUrl: '/news.html',
    })}

    ${section({
      id: 'publications',
      title: 'Publications',
      items: publications,
      renderer: publicationItem,
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
          ${items.map(publicationItem).join('')}
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
