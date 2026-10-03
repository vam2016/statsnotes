import rss from '@astrojs/rss';
import { allPosts, site, url } from '../lib/site';
import type { APIContext } from 'astro';
export async function GET(context: APIContext) {
  return rss({ title: `${site.name} · ${site.title}`, description: site.description, site: context.site!,
    items: (await allPosts()).map(post => ({ title: post.data.title, pubDate: post.data.date, description: post.data.description, link: url(`posts/${post.id}/`), categories: post.data.tags })), customData: '<language>zh-cn</language>' });
}
