import { axes } from './content.js';

const chartLabels = ['ECONOMY', 'AUTHORITY', 'GOVERNANCE', 'COOPERATION', 'USE OF FORCE', 'BORDERS', 'CULTURE', 'RELIGION', 'ENVIRONMENT', 'JUSTICE', 'STRUCTURE', 'TECHNOLOGY'];

export function radarChart(scores, { demo = false } = {}) {
  const center = 210;
  const radius = 126;
  const point = (index, distance) => {
    const angle = index * Math.PI / 6 - Math.PI / 2;
    return [center + Math.cos(angle) * distance, center + Math.sin(angle) * distance];
  };
  const polygon = distance => axes.map((_, index) => point(index, distance).join(',')).join(' ');
  const shape = scores.map((score, index) => point(index, radius * score / 100).join(',')).join(' ');
  return `<svg class="radar" viewBox="0 0 420 420" role="img" aria-label="${demo ? 'Illustrative' : 'Your'} political profile across twelve axes. Distance from the center shows the percentage toward the first pole of each axis.">
    ${[0.25, 0.5, 0.75, 1].map(scale => `<polygon points="${polygon(radius * scale)}" class="radar-grid"/>`).join('')}
    ${axes.map((_, index) => `<line x1="${center}" y1="${center}" x2="${point(index, radius)[0]}" y2="${point(index, radius)[1]}" class="radar-spoke"/>`).join('')}
    <polygon points="${shape}" class="radar-shape"/>
    ${scores.map((score, index) => `<circle cx="${point(index, radius * score / 100)[0]}" cy="${point(index, radius * score / 100)[1]}" r="3.3" class="radar-point"/>`).join('')}
    ${chartLabels.map((label, index) => { const [x, y] = point(index, radius + 29); return `<text x="${x}" y="${y}" dy="3" text-anchor="${x < 190 ? 'end' : x > 230 ? 'start' : 'middle'}">${label}</text>`; }).join('')}
    <circle cx="210" cy="210" r="3" fill="currentColor"/>
  </svg>`;
}

export function downloadResultImage(result) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1550;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser cannot create a result image. Please use the print option.');
  context.fillStyle = '#f4f1e8';
  context.fillRect(0, 0, 1200, 1550);
  context.fillStyle = '#f3cb46';
  context.fillRect(0, 0, 1200, 195);
  context.fillStyle = '#2d2615';
  context.font = 'bold 52px Arial';
  context.fillText('12 AXES', 65, 88);
  context.font = '26px Arial';
  context.fillText('Your politics, in perspective.', 65, 140);
  context.font = '20px Arial';
  context.fillText(`${result.mode === 'quick' ? '36' : '72'} statements · Original questionnaire v1 · Educational self-reflection`, 65, 250);
  axes.forEach((axis, index) => {
    const y = 310 + index * 90;
    const score = result.scores[index];
    context.fillStyle = '#2d2615';
    context.font = 'bold 23px Arial';
    context.fillText(`${String(index + 1).padStart(2, '0')}  ${axis.name}`, 65, y);
    context.font = '19px Arial';
    context.fillText(`${axis.left} ${score}%`, 65, y + 31);
    context.textAlign = 'right';
    context.fillText(`${100 - score}% ${axis.right}`, 1135, y + 31);
    context.textAlign = 'left';
    context.fillStyle = '#e4dcc7';
    context.fillRect(65, y + 43, 1070, 11);
    context.fillStyle = '#ae810e';
    context.fillRect(65, y + 43, 1070 * score / 100, 11);
  });
  context.fillStyle = '#706954';
  context.font = '20px Arial';
  context.fillText('A snapshot of your answers, not a scientific assessment or a political identity.', 65, 1440);
  context.fillText('12axes.lashreel.com · Results stay in your browser unless you share them.', 65, 1480);
  const link = document.createElement('a');
  link.download = '12axes-my-political-profile.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
