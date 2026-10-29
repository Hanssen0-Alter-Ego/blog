'use strict';
// Hexo 的 index generator 在零篇文章时不生成首页。
hexo.extend.generator.register('empty-index', function (locals) {
  if (locals.posts.length) return [];
  return { path: 'index.html', layout: 'index', data: { posts: locals.posts, current: 1, total: 1, base: '', current_url: '' } };
});
