// /staff/ … スタッフ一覧
import { cms, esc, imgUrl, first, page, html, errorPage } from '../../lib/microcms.js';

export async function onRequestGet({ env }) {
  try {
    const data = await cms(env, 'staff', {
      limit: 100,
      orders: 'order', // 「表示順」の小さい順
      fields: 'id,name,role,photo',
    });
    const items = (data?.contents || [])
      .map(
        (s) => `<a class="staff-card" href="/staff/${esc(s.id)}">
  ${s.photo ? `<img src="${imgUrl(s.photo, 400)}" alt="${esc(s.name)}" loading="lazy" width="200" height="200">` : '<div class="noimg"></div>'}
  <span class="role">${esc(first(s.role))}</span>
  <span class="name">${esc(s.name)}</span>
</a>`,
      )
      .join('\n');

    return html(
      page({
        title: 'スタッフ紹介',
        description: 'それいゆ訪問看護ステーションのスタッフをご紹介します。',
        body: `<section class="container">
<h1>スタッフ紹介</h1>
<div class="staff-grid">
${items || '<p>準備中です。</p>'}
</div>
</section>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
