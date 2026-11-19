// /news/ … お知らせ・勉強会の一覧（?category=お知らせ / 勉強会 で絞り込み）
import { cms, esc, fmtDate, first, tagHtml, secHead, page, html, errorPage } from '../../lib/microcms.js';

export async function onRequestGet({ env, request }) {
  try {
    const category = new URL(request.url).searchParams.get('category') || '';
    const params = { limit: 50, orders: '-date', fields: 'id,title,date,category' };
    if (category === 'お知らせ' || category === '勉強会') params.filters = `category[contains]${category}`;
    const data = await cms(env, 'news', params);

    const items = (data?.contents || [])
      .map(
        (n) => `<a class="news-row" href="/news/${esc(n.id)}">
<time>${fmtDate(n.date)}</time>${tagHtml(first(n.category))}<span class="title">${esc(n.title)}</span>
</a>`,
      )
      .join('\n');

    const tab = (label, q) =>
      `<a class="${category === q ? 'active' : ''}" href="/news/${q ? `?category=${encodeURIComponent(q)}` : ''}">${label}</a>`;

    return html(
      page({
        title: 'お知らせ・勉強会',
        description: 'それいゆ訪問看護ステーションからのお知らせと勉強会のご案内です。',
        active: 'news',
        body: `<section class="page">
<div class="wrap narrow">
${secHead('NEWS', 'お知らせ・勉強会')}
<div class="tabs">${tab('すべて', '')}${tab('お知らせ', 'お知らせ')}${tab('勉強会', '勉強会')}</div>
<div class="news-box on-cream">
${items || '<div class="empty">現在お知らせはありません。</div>'}
</div>
</div>
</section>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
