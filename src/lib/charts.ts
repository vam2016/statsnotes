import { power, requiredN, survival } from './statistics';
export type Kind = 'survival' | 'power';
export type Parameters = { hr: number; median: number; effect: number; n: number; alpha: number; target: number };
export const defaults: Parameters = { hr: 0.68, median: 12, effect: 0.4, n: 100, alpha: 0.05, target: 0.8 };
const x = (value: number, max: number) => 60 + value / max * 530;
const y = (value: number) => 248 - value * 206;
export function graph(kind: Kind, p: Parameters): string {
  const max = kind === 'survival' ? 36 : 400;
  let lines = '';
  for (let i = 0; i <= 4; i++) {
    const v = i / 4;
    lines += `<line class="gridline" x1="60" x2="590" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="44" y="${y(v) + 4}" text-anchor="end">${i * 25}%</text>`;
  }
  for (let i = 0; i <= 4; i++) {
    const v = i * max / 4;
    lines += `<text class="axis-label" x="${x(v, max)}" y="273" text-anchor="middle">${v}</text>`;
  }
  lines += `<text class="axis-title" x="325" y="304" text-anchor="middle">${kind === 'survival' ? '随访时间（月）' : '每组样本量 n'}</text>`;
  const points = (fn: (v: number) => number) => Array.from({ length: 121 }, (_, i) => { const t = i * max / 120; return `${i ? 'L' : 'M'}${x(t, max).toFixed(2)},${y(fn(t)).toFixed(2)}`; }).join(' ');
  if (kind === 'survival') {
    const treated = points(t => survival(t, p.median, p.hr));
    lines += `<path class="curve-fill" d="${treated}L590,248L60,248Z"/><path class="curve secondary" d="${points(t => survival(t, p.median))}"/><path class="curve primary" d="${treated}"/>`;
  } else {
    const path = points(n => power(n, p.effect, p.alpha));
    lines += `<path class="curve-fill" d="${path}L590,248L60,248Z"/><line class="target-line" x1="60" x2="590" y1="${y(p.target)}" y2="${y(p.target)}"/><text class="target-label" x="585" y="${y(p.target) - 9}" text-anchor="end">目标 ${Math.round(p.target * 100)}%</text><path class="curve primary" d="${path}"/><line class="marker-line" x1="${x(p.n, max)}" x2="${x(p.n, max)}" y1="42" y2="248"/><circle class="chart-point" cx="${x(p.n, max)}" cy="${y(power(p.n, p.effect, p.alpha))}" r="6"/>`;
  }
  return lines;
}
export function initCharts() {
  document.querySelectorAll<HTMLElement>('[data-chart]').forEach(root => {
    const kind = root.dataset.chart as Kind;
    let p = { ...defaults };
    const svg = root.querySelector<SVGSVGElement>('svg.chart-svg')!;
    const plot = root.querySelector<SVGGElement>('.plot')!;
    const hint = root.querySelector<HTMLElement>('.chart-hint')!;
    const tooltip = root.querySelector<HTMLElement>('.chart-tooltip')!;
    const crosshair = root.querySelector<SVGLineElement>('.crosshair')!;
    const readout = root.querySelector<HTMLElement>('[data-readout]')!;
    function update() {
      root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-param]').forEach(input => {
        const key = input.dataset.param as keyof Parameters; p[key] = Number(input.value);
        const output = root.querySelector<HTMLOutputElement>(`[data-value="${key}"]`);
        if (output) output.value = ['hr', 'effect'].includes(key) ? p[key].toFixed(2) : String(p[key]);
      });
      plot.innerHTML = graph(kind, p);
      if (kind === 'survival') {
        readout.innerHTML = `<strong>${(p.median / p.hr).toFixed(1)}<small> 月</small></strong><span>模型中的试验组中位生存期</span>`;
        hint.textContent = `12 个月时：试验组 ${(survival(12, p.median, p.hr) * 100).toFixed(1)}% · 对照组 ${(survival(12, p.median) * 100).toFixed(1)}%`;
      } else {
        readout.innerHTML = `<strong>${(power(p.n, p.effect, p.alpha) * 100).toFixed(1)}<small>%</small></strong><span>当前参数下的检验效能</span>`;
        hint.textContent = `达到 ${p.target * 100}% 效能，约需 ${requiredN(p.effect, p.alpha, p.target)} 人 / 组（未计脱落）`;
      }
    }
    root.querySelectorAll('[data-param]').forEach(input => input.addEventListener('input', update));
    root.querySelector('[data-reset]')?.addEventListener('click', () => {
      root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-param]').forEach(input => { input.value = String(defaults[input.dataset.param as keyof Parameters]); }); update();
    });
    svg.addEventListener('pointermove', event => {
      const rect = svg.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width * 640;
      if (px < 60 || px > 590) { tooltip.hidden = true; crosshair.style.opacity = '0'; return; }
      const max = kind === 'survival' ? 36 : 400, value = (px - 60) / 530 * max;
      crosshair.setAttribute('x1', String(px)); crosshair.setAttribute('x2', String(px)); crosshair.style.opacity = '1';
      tooltip.textContent = kind === 'survival' ? `${value.toFixed(1)} 月 · 试验组 ${(survival(value, p.median, p.hr) * 100).toFixed(1)}% · 对照组 ${(survival(value, p.median) * 100).toFixed(1)}%` : `n = ${Math.round(value)} / 组 · 效能 ${(power(Math.round(value), p.effect, p.alpha) * 100).toFixed(1)}%`;
      tooltip.hidden = false;
    });
    svg.addEventListener('pointerleave', () => { tooltip.hidden = true; crosshair.style.opacity = '0'; });
    root.querySelector('[data-download]')?.addEventListener('click', () => {
      const max = kind === 'survival' ? 36 : 400;
      const header = kind === 'survival' ? `month,control_survival,treatment_survival,hr,control_median_months\n` : `n_per_group,power,effect_size,alpha,target\n`;
      const rows = Array.from({ length: max + 1 }, (_, i) => kind === 'survival' ? `${i},${survival(i, p.median)},${survival(i, p.median, p.hr)},${p.hr},${p.median}` : `${i},${power(i, p.effect, p.alpha)},${p.effect},${p.alpha},${p.target}`);
      const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8' })); link.download = `trial-notes-${kind}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    });
    update();
  });
}
