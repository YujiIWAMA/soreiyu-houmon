// /news/ … お知らせ・勉強会の一覧
import { cms, esc, fmtDate, first, page, html, errorPage } from '../../lib/microcms.js';

export async function onRequestGet({ env, request }) {
  try {
    const category = new URL(request.url).searchParams.get('category'); // お知らせ / 勉強会
    const params = { limit: 50, orders: '-date', fields: 'id,title,date,category' };
    if (category === 'お知らせ' || category === '勉強会') params.filters = `category[contains]${category}`;
    const data = await cms(env, 'news', params);

    const items = (data?.contents || [])
      .map(
        (n) => `<li><a href="/news/${esc(n.id)}">
  <time>${fmtDate(n.date)}</time>
  <span class="tag">${esc(first(n.category))}</span>
  <span class="title">${esc(n.title)}</span>
</a></li>`,
      )
      .join('\n');

    const tab = (label, q) =>
      `<a class="${(category || '') === q ? 'active' : ''}" href="/news/${q ? `?category=${encodeURIComponent(q)}` : ''}">${label}</a>`;

    return html(
      page({
        title: 'お知らせ・勉強会',
        body: `<section class="container">
<h1>お知らせ・勉強会</h1>
<div class="tabs">${tab('すべて', '')}${tab('お知らせ', 'お知らせ')}${tab('勉強会', '勉強会')}</div>
<ul class="news-list">
${items || '<li class="empty">現在お知らせはありません。</li>'}
</ul>
</section>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
