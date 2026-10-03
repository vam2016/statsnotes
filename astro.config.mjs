import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const site = process.env.SITE_URL || (owner ? `https://${owner}.github.io` : 'http://localhost:4321');
const base = process.env.BASE_PATH ?? (repo && repo.toLowerCase() !== `${owner}.github.io`.toLowerCase() ? `/${repo}` : '/');
// Make root-relative links in Markdown portable to project Pages deployments.
function prefixContentLinks() {
  return tree => {
    function visit(node) {
      if (node.properties) for (const key of ['href', 'src', 'poster']) {
        const value = node.properties[key];
        if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//'))
          node.properties[key] = `${base.replace(/\/$/, '')}${value}`;
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
export default defineConfig({
  site, base, output: 'static', trailingSlash: 'always',
  integrations: [mdx()],
  markdown: {
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex, prefixContentLinks] }),
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
  devToolbar: { enabled: false },
});
