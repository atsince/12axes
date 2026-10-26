import { axes, questions } from './content.js';
import { questions as portugueseQuestions } from './content-pt.js';
import { pagePath } from './paths.js';

export function questionCountForMode(mode, version = 2) {
  if (![1, 2].includes(version)) throw new Error(`Unknown questionnaire version: ${version}`);
  if (!['quick', 'full'].includes(mode)) throw new Error(`Unknown test length: ${mode}`);
  return mode === 'full' ? 72 : version === 1 ? 36 : 48;
}

export function questionsForMode(mode, locale = 'en', version = 2) {
  if (!['en', 'pt-BR'].includes(locale)) throw new Error(`Unknown questionnaire locale: ${locale}`);
  const localizedQuestions = locale === 'pt-BR' ? portugueseQuestions : questions;
  const count = questionCountForMode(mode, version) / axes.length;
  return Array.from({ length: count }, (_, round) => axes.map(axis => localizedQuestions.filter(question => question.axis === axis.id)[round])).flat();
}

function validateAnswers(selectedQuestions, answers) {
  if (!Array.isArray(selectedQuestions) || !selectedQuestions.length) throw new Error(`Expected a nonempty question array, received: ${selectedQuestions}`);
  if (!Array.isArray(answers)) throw new Error(`Expected an answer array, received: ${answers}`);
  if (selectedQuestions.length !== answers.length) throw new Error(`Expected ${selectedQuestions.length} answers, received: ${answers.length}`);
  const questionIds = new Set();
  for (let index = 0; index < selectedQuestions.length; index += 1) {
    const question = selectedQuestions[index];
    const originalQuestion = questions.find(original => original.id === question?.id);
    if (!originalQuestion) throw new Error(`Unknown question at index ${index}: ${question?.id}`);
    if (questionIds.has(question.id)) throw new Error(`Duplicate question at index ${index}: ${question.id}`);
    questionIds.add(question.id);
    if (question.axis !== originalQuestion.axis) throw new Error(`Invalid axis for question ${question.id}: ${question.axis}; expected ${originalQuestion.axis}`);
    if (![1, -1].includes(question.direction) || question.direction !== originalQuestion.direction) throw new Error(`Invalid direction for question ${question.id}: ${question.direction}; expected ${originalQuestion.direction}`);
    if (!Number.isInteger(answers[index]) || answers[index] < -2 || answers[index] > 2) throw new Error(`Invalid answer for question ${question.id} at index ${index}: ${answers[index]}; expected an integer from -2 to 2`);
  }
  for (const axis of axes) {
    if (!selectedQuestions.some(question => question.axis === axis.id)) throw new Error(`No statements found for axis: ${axis.id}`);
  }
}

export function calculateScores(selectedQuestions, answers) {
  validateAnswers(selectedQuestions, answers);
  return axes.map(axis => {
    const positions = selectedQuestions.map((question, index) => question.axis === axis.id ? index : -1).filter(index => index !== -1);
    const total = positions.reduce((sum, index) => sum + answers[index] * selectedQuestions[index].direction, 0);
    return Math.round(50 + total / (positions.length * 2) * 50);
  });
}

export function summarizeAnswers(selectedQuestions, answers) {
  validateAnswers(selectedQuestions, answers);
  return {
    neutralCount: answers.filter(answer => answer === 0).length,
    repeatedAnswer: answers.every(answer => answer === answers[0]) ? answers[0] : null,
    axes: axes.map(axis => {
      const contributions = selectedQuestions.flatMap((question, index) => question.axis === axis.id ? [{ id: question.id, answer: answers[index], directedAnswer: answers[index] * question.direction }] : []);
      const firstPoleAnswers = contributions.filter(contribution => contribution.directedAnswer > 0).sort((a, b) => b.directedAnswer - a.directedAnswer);
      const secondPoleAnswers = contributions.filter(contribution => contribution.directedAnswer < 0).sort((a, b) => a.directedAnswer - b.directedAnswer);
      const evidence = firstPoleAnswers.length && secondPoleAnswers.length ? [firstPoleAnswers[0], secondPoleAnswers[0]] : [...firstPoleAnswers, ...secondPoleAnswers].slice(0, 2);
      return {
        neutralCount: contributions.length - firstPoleAnswers.length - secondPoleAnswers.length,
        firstPoleCount: firstPoleAnswers.length,
        secondPoleCount: secondPoleAnswers.length,
        evidence: evidence.map(({ id, answer }) => ({ id, answer })),
      };
    }),
  };
}

function validateResultScores(scores, locale) {
  if (!Array.isArray(scores) || scores.length !== axes.length) throw new Error(locale === 'pt-BR' ? `O resultado precisa de ${axes.length} pontuações; recebido: ${Array.isArray(scores) ? scores.length : scores}.` : `Expected ${axes.length} result scores, received: ${Array.isArray(scores) ? scores.length : scores}`);
  for (let index = 0; index < scores.length; index += 1) {
    if (!Number.isInteger(scores[index]) || scores[index] < 0 || scores[index] > 100) throw new Error(locale === 'pt-BR' ? `Pontuação inválida no eixo ${axes[index].id}: ${scores[index]}; esperado um inteiro entre 0 e 100.` : `Invalid score for axis ${axes[index].id}: ${scores[index]}; expected an integer from 0 to 100`);
  }
}

export function readSharedResult(hash, locale = 'en') {
  if (!['en', 'pt-BR'].includes(locale)) throw new Error(`Unknown result locale: ${locale}`);
  const match = typeof hash === 'string' && /^#r=(1|2)\.(quick|full)\.(.*)$/.exec(hash);
  if (!match || match[0] !== hash) throw new Error(locale === 'pt-BR' ? `Formato incompatível para o resultado compartilhado: ${hash}` : `Unsupported shared result format: ${hash}`);
  const encodedScores = match[3].split('.');
  if (encodedScores.length !== axes.length) throw new Error(locale === 'pt-BR' ? `O resultado compartilhado precisa de ${axes.length} pontuações; recebido: ${encodedScores.length}.` : `Expected ${axes.length} shared result scores, received: ${encodedScores.length}`);
  const scores = encodedScores.map((encodedScore, index) => {
    if (!/^[0-9a-z]{1,2}$/.test(encodedScore)) throw new Error(locale === 'pt-BR' ? `Pontuação codificada inválida no eixo ${axes[index].id}: ${encodedScore}` : `Invalid encoded score for axis ${axes[index].id}: ${encodedScore}`);
    return [...encodedScore].reduce((score, character) => score * 36 + '0123456789abcdefghijklmnopqrstuvwxyz'.indexOf(character), 0);
  });
  validateResultScores(scores, locale);
  return { version: Number(match[1]), mode: match[2], scores, shared: true };
}

export function sharedResultUrl(result, locale = 'en') {
  if (!result || typeof result !== 'object') throw new Error(`Expected a result object, received: ${result}`);
  if (![1, 2].includes(result.version)) throw new Error(`Unknown result version: ${result.version}`);
  questionCountForMode(result.mode, result.version);
  validateResultScores(result.scores, locale);
  return `${location.origin}${pagePath('/results', locale)}#r=${result.version}.${result.mode}.${result.scores.map(score => score.toString(36)).join('.')}`;
}
