import { axes, questions } from './content.js';
import { questions as portugueseQuestions } from './content-pt.js';
import { pagePath } from './paths.js';

export function questionsForMode(mode, locale = 'en') {
  if (!['en', 'pt-BR'].includes(locale)) throw new Error(`Unknown questionnaire locale: ${locale}`);
  if (!['quick', 'full'].includes(mode)) throw new Error(`Unknown test length: ${mode}`);
  const localizedQuestions = locale === 'pt-BR' ? portugueseQuestions : questions;
  const count = mode === 'quick' ? 3 : 6;
  return Array.from({ length: count }, (_, round) => axes.map(axis => localizedQuestions.filter(question => question.axis === axis.id)[round])).flat();
}

export function calculateScores(selectedQuestions, answers) {
  if (selectedQuestions.length !== answers.length || answers.some(answer => !Number.isInteger(answer) || answer < -2 || answer > 2)) throw new Error('Every statement needs an answer from -2 to 2 before scoring.');
  return axes.map(axis => {
    const positions = selectedQuestions.map((question, index) => question.axis === axis.id ? index : -1).filter(index => index !== -1);
    if (!positions.length) throw new Error(`No statements found for axis: ${axis.id}`);
    const total = positions.reduce((sum, index) => sum + answers[index] * selectedQuestions[index].direction, 0);
    return Math.round(50 + total / (positions.length * 2) * 50);
  });
}

export function readSharedResult(hash, locale = 'en') {
  const match = /^#r=1\.(quick|full)\.([0-9a-z.]+)$/.exec(hash);
  if (!match) throw new Error(locale === 'pt-BR' ? 'Este link de resultado compartilhado tem um formato incompatível.' : 'This shared result link has an unsupported format.');
  const scores = match[2].split('.').map(value => parseInt(value, 36));
  if (scores.length !== axes.length || scores.some(score => !Number.isInteger(score) || score < 0 || score > 100)) throw new Error(locale === 'pt-BR' ? `Este resultado compartilhado precisa conter exatamente ${axes.length} pontuações entre 0 e 100.` : `This shared result needs exactly ${axes.length} scores between 0 and 100.`);
  return { version: 1, mode: match[1], scores, shared: true };
}

export function sharedResultUrl(result, locale = 'en') {
  return `${location.origin}${pagePath('/results', locale)}#r=1.${result.mode}.${result.scores.map(score => score.toString(36)).join('.')}`;
}
