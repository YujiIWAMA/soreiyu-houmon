// /staff/ … スタッフ一覧
import { cms, esc, imgUrl, first, secHead, page, html, errorPage } from '../../lib/microcms.js';

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
${s.photo ? `<img src="${imgUrl(s.photo, 400)}" alt="${esc(s.name)}" loading="lazy" width="150" height="150">` : '<div class="noimg"></div>'}
<span class="role">${esc(first(s.role))}</span>
<span class="name">${esc(s.name)}</span>
</a>`,
      )
      .join('\n');

    return html(
      page({
        title: 'スタッフ紹介',
        description: 'それいゆ訪問看護ステーションのスタッフをご紹介します。',
        active: 'staff',
        body: `<section class="page">
<div class="wrap">
${secHead('STAFF', 'スタッフ紹介')}
${items ? `<div class="staff-grid">\n${items}\n</div>` : '<p class="empty-msg">準備中です。</p>'}
</div>
</section>`,
      }),
    );
  } catch (e) {
    console.error(e);
    return errorPage();
  }
}
