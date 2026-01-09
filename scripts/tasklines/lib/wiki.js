const API_BASE = 'https://toontownrewritten.wiki/api.php';
const API_TIMEOUT_MS = 30000;

/**
 * @typedef {Object} WikiPageContent
 * @property {string} wikitext
 * @property {string|null} timestamp
 */

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`);
  }
  return response.json();
}

async function fetchCategoryMembers(category) {
  const members = [];
  let cmcontinue = null;
  do {
    const params = new URLSearchParams({
      action: 'query',
      list: 'categorymembers',
      cmtitle: `Category:${category.replace(/ /g, '_')}`,
      cmlimit: 'max',
      format: 'json',
    });
    if (cmcontinue) {
      params.append('cmcontinue', cmcontinue);
    }
    const url = `${API_BASE}?${params.toString()}`;
    const data = await fetchJson(url);
    members.push(...data.query.categorymembers);
    cmcontinue = data.continue ? data.continue.cmcontinue : null;
  } while (cmcontinue);
  return members;
}

async function fetchPageContent(title) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'revisions',
    titles: title,
    rvprop: 'timestamp|content',
    rvslots: 'main',
    redirects: '1',
    format: 'json',
  });
  const url = `${API_BASE}?${params.toString()}`;
  const data = await fetchJson(url);
  const pages = data.query && data.query.pages ? data.query.pages : {};
  const page = pages[Object.keys(pages)[0]];
  if (!page || !page.revisions || !page.revisions.length) {
    throw new Error('Missing page revisions');
  }
  const revision = page.revisions[0];
  const slot = revision.slots ? revision.slots.main : null;
  const wikitext =
    slot && typeof slot['*'] === 'string'
      ? slot['*']
      : slot && typeof slot.content === 'string'
        ? slot.content
        : typeof revision['*'] === 'string'
          ? revision['*']
          : revision.content || '';
  if (!wikitext) {
    throw new Error('Missing wikitext content');
  }
  return {
    wikitext,
    timestamp: revision.timestamp || null,
  };
}

module.exports = {
  fetchCategoryMembers,
  fetchPageContent,
};
