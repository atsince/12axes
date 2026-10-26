import { axes as englishAxes } from './content.js';
import { axes as portugueseAxes } from './content-pt.js';
import { questionCountForMode, questionsForMode, calculateScores, summarizeAnswers, readSharedResult, sharedResultUrl } from './scoring.js';
import { radarChart, downloadResultImage } from './chart.js';
import { header, footer, staticPage, routeMetadata, arrow, emptyResultsPage, siteOrigin } from './views.js';
import { initializeAnalytics, trackPageView, trackConversion, showAnalyticsPreferences, isPrivatePage } from './analytics.js';
import { localeForPath, basePath, pagePath, localizeLinks, routeKey } from './paths.js';

const locale = localeForPath(location.pathname);
const axes = locale === 'pt-BR' ? portugueseAxes : englishAxes;
const sessionKey = '12axes.session.v1';
const resultKey = '12axes.result.v1';
const main = document.getElementById('main');
const responseLabels = locale === 'pt-BR' ? ['Concordo totalmente', 'Concordo', 'Neutro / não sei', 'Discordo', 'Discordo totalmente'] : ['Strongly agree', 'Agree', 'Neutral / unsure', 'Disagree', 'Strongly disagree'];
const responseValues = [2, 1, 0, -1, -2];
let storageWarningShown = false;
let toastTimer;
let answerAdvanceTimer;
let advanceOnAnswer = true;
let previewIndex = 0;

function localizedText(english, portuguese) {
  return locale === 'pt-BR' ? portuguese : english;
}

function notify(message, kind = 'info') {
  const notice = document.getElementById('notice');
  notice.textContent = message;
  notice.className = `notice visible ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { notice.className = 'notice'; }, 9000);
}

function storageUnavailable(error) {
  if (!['SecurityError', 'QuotaExceededError'].includes(error.name)) throw error;
  if (!storageWarningShown) notify(localizedText('Browser storage is unavailable. You can still take the test, but keep this tab open to retain your progress.', 'O armazenamento do navegador está indisponível. Você ainda pode fazer o teste, mas mantenha esta aba aberta para preservar seu progresso.'), 'warning');
  storageWarningShown = true;
}

function validSession(value) {
  if (!value || ![1, 2].includes(value.version) || !['quick', 'full'].includes(value.mode)) return false;
  const count = questionCountForMode(value.mode, value.version);
  return Number.isInteger(value.index) && value.index >= 0 && value.index < count && Array.isArray(value.answers) && value.answers.length === count && value.answers.every(answer => answer === null || Number.isInteger(answer) && answer >= -2 && answer <= 2);
}

function validAnswerSummary(summary, mode, version) {
  if (!summary || !Array.isArray(summary.axes) || summary.axes.length !== axes.length) return false;
  const selectedQuestions = questionsForMode(mode, locale, version);
  const perAxis = selectedQuestions.length / axes.length;
  if (!Number.isInteger(summary.neutralCount) || summary.neutralCount < 0 || summary.neutralCount > selectedQuestions.length) return false;
  if (summary.repeatedAnswer !== null && (!Number.isInteger(summary.repeatedAnswer) || summary.repeatedAnswer < -2 || summary.repeatedAnswer > 2)) return false;
  if (!summary.axes.every((axisSummary, index) => {
    if (!axisSummary || ![axisSummary.neutralCount, axisSummary.firstPoleCount, axisSummary.secondPoleCount].every(count => Number.isInteger(count) && count >= 0 && count <= perAxis)) return false;
    if (axisSummary.neutralCount + axisSummary.firstPoleCount + axisSummary.secondPoleCount !== perAxis || !Array.isArray(axisSummary.evidence) || axisSummary.evidence.length !== Math.min(2, perAxis - axisSummary.neutralCount)) return false;
    const evidenceIds = new Set();
    return axisSummary.evidence.every(answer => {
      const question = selectedQuestions.find(question => question.id === answer?.id && question.axis === axes[index].id);
      if (!question || evidenceIds.has(answer.id) || !Number.isInteger(answer.answer) || answer.answer === 0 || answer.answer < -2 || answer.answer > 2) return false;
      evidenceIds.add(answer.id);
      return true;
    });
  })) return false;
  if (summary.axes.reduce((sum, axisSummary) => sum + axisSummary.neutralCount, 0) !== summary.neutralCount) return false;
  if (summary.repeatedAnswer !== null && summary.neutralCount !== (summary.repeatedAnswer === 0 ? selectedQuestions.length : 0)) return false;
  return true;
}

function validResult(value) {
  if (!value || ![1, 2].includes(value.version) || !['quick', 'full'].includes(value.mode) || !Array.isArray(value.scores) || value.scores.length !== axes.length || !value.scores.every(score => Number.isInteger(score) && score >= 0 && score <= 100) || typeof value.completedAt !== 'string' || !Number.isFinite(Date.parse(value.completedAt))) return false;
  return value.answerSummary === undefined ? value.version === 1 : validAnswerSummary(value.answerSummary, value.mode, value.version);
}

function loadStored(key, validate) {
  let stored;
  try { stored = localStorage.getItem(key); } catch (error) { storageUnavailable(error); return null; }
  if (!stored) return null;
  let value;
  try { value = JSON.parse(stored); } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    notify(localizedText(`Saved information in ${key} could not be read. Please start a new test.`, `Não foi possível ler as informações salvas em ${key}. Inicie um novo teste.`), 'warning');
    return null;
  }
  if (!validate(value)) {
    notify(localizedText(`Saved information in ${key} has an unsupported format. Please start a new test.`, `As informações salvas em ${key} têm um formato incompatível. Inicie um novo teste.`), 'warning');
    return null;
  }
  return value;
}

function saveStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { storageUnavailable(error); }
}

function removeStored(key) {
  try { localStorage.removeItem(key); } catch (error) { storageUnavailable(error); }
}

let session = loadStored(sessionKey, validSession);
let result = loadStored(resultKey, validResult);

function pathName() {
  return basePath(location.pathname);
}

function navigate(path) {
  const destination = new URL(path, location.href);
  if (localeForPath(destination.pathname) !== locale || (window.clarity || !storageWarningShown) && isPrivatePage(location.pathname) !== isPrivatePage(destination.pathname)) {
    location.assign(destination.href);
    return;
  }
  history.pushState({}, '', `${pagePath(basePath(destination.pathname), locale)}${destination.search}${destination.hash}`);
  render();
}

function quizProgressSegments(selectedQuestions, answers, currentAxisId) {
  return axes.map(axis => {
    const positions = selectedQuestions.map((question, index) => question.axis === axis.id ? index : -1).filter(index => index !== -1);
    const answered = positions.filter(index => answers[index] !== null).length;
    return `<span class="progress-segment ${axis.id === currentAxisId ? 'is-current' : ''}" title="${axis.name}: ${localizedText(`${answered} of ${positions.length} answered`, `${answered} de ${positions.length} respondidas`)}"><span style="width:${answered / positions.length * 100}%"></span></span>`;
  }).join('');
}

function quizPage() {
  if (!session) return `<section class="container empty-state"><span class="eyebrow">${localizedText('A fresh perspective', 'Uma nova perspectiva')}</span><h1>${localizedText('Choose your starting point.', 'Escolha por onde começar.')}</h1><p>${localizedText('Select a test length to begin your questionnaire.', 'Escolha a duração do teste para começar seu questionário.')}</p><a href="/political-test" class="button">${localizedText('Choose your test', 'Escolha seu teste')} ${arrow}</a></section>`;
  const selectedQuestions = questionsForMode(session.mode, locale, session.version);
  const question = selectedQuestions[session.index];
  const axis = axes.find(item => item.id === question.axis);
  const answeredCount = session.answers.filter(answer => answer !== null).length;
  const selected = session.answers[session.index];
  const questionNumber = String(session.index + 1).padStart(2, '0');
  return `<section class="quiz-shell container">${session.version === 1 ? `<p class="legacy-progress">${localizedText(`Continuing your earlier v1 questionnaire (${selectedQuestions.length} statements). Your saved progress keeps its original questions and scoring.`, `Continuando seu questionário anterior v1 (${selectedQuestions.length} afirmações). O progresso salvo mantém as perguntas e a pontuação originais.`)}</p>` : ''}<div class="quiz-progress-label"><span>${localizedText('Question', 'Questão')} <strong>${session.index + 1} ${localizedText('of', 'de')} ${selectedQuestions.length}</strong></span><span class="quiz-complete">${Math.round(answeredCount / selectedQuestions.length * 100)}% ${localizedText('complete', 'concluído')}</span></div><div class="progress-track" role="progressbar" aria-valuenow="${answeredCount}" aria-valuemin="0" aria-valuemax="${selectedQuestions.length}" aria-label="${localizedText('Statements answered across twelve axes', 'Afirmações respondidas nos doze eixos')}">${quizProgressSegments(selectedQuestions, session.answers, axis.id)}</div><article class="question-panel" aria-labelledby="question-title"><span class="question-watermark" aria-hidden="true">${questionNumber}</span><div class="question-topic"><span class="question-category"><span class="question-topic-icon" aria-hidden="true">${String(axes.indexOf(axis) + 1).padStart(2, '0')}</span>${axis.name}</span><a href="/axes#${axis.id}" class="question-info" aria-label="${localizedText(`Understand the ${axis.name.toLowerCase()} axis`, `Entenda o eixo ${axis.name.toLowerCase()}`)}">?</a></div><h1 id="question-title">${question.text}</h1><div class="answer-options" role="group" aria-label="${localizedText('How much do you agree with this statement?', 'Até que ponto você concorda com esta afirmação?')}">${responseLabels.map((label, index) => `<button type="button" class="answer-option answer-${index} ${selected === responseValues[index] ? 'selected' : ''}" data-action="answer" data-value="${responseValues[index]}" aria-pressed="${selected === responseValues[index]}"><span class="answer-symbol" aria-hidden="true">${index < 2 ? '✓' : index === 2 ? '−' : '×'}</span><span>${label}</span><span class="answer-radio" aria-hidden="true"></span></button>`).join('')}</div></article><nav class="quiz-navigation" aria-label="${localizedText('Quiz navigation', 'Navegação do teste')}"><button class="quiz-back" data-action="previous" ${session.index === 0 ? 'disabled' : ''}><span aria-hidden="true">←</span> ${localizedText('Back', 'Voltar')}</button><button type="button" class="advance-toggle" role="switch" aria-checked="${advanceOnAnswer}" data-action="toggle-advance"><span class="advance-track" aria-hidden="true"><span></span></span>${localizedText('Advance on answer', 'Avançar ao responder')}</button><button class="quiz-next" data-action="next" ${selected === null ? 'disabled' : ''}>${session.index === selectedQuestions.length - 1 ? localizedText('See results', 'Ver resultado') : localizedText('Next', 'Próxima')} <span aria-hidden="true">→</span></button></nav><div class="quiz-caption"><a href="/political-test">${storageWarningShown ? localizedText('Progress stays in this tab', 'O progresso fica nesta aba') : localizedText('Progress saved on this device', 'Progresso salvo neste dispositivo')} · ${localizedText('Save & exit', 'Salvar e sair')}</a><p class="keyboard-note">${localizedText('Keyboard:', 'Teclado:')} <kbd>1</kbd>–<kbd>5</kbd> ${localizedText('to choose', 'para escolher')} <span>·</span> <kbd>→</kbd> ${localizedText('to continue', 'para continuar')}</p></div></section>`;
}

function activeResult() {
  if (location.hash) {
    try { return readSharedResult(location.hash, locale); } catch (error) {
      notify(error.message, 'warning');
      return null;
    }
  }
  return result;
}

function resultHighlights(profile) {
  const rankedAxes = profile.scores.map((score, index) => ({ score, index, distance: Math.abs(score - 50) })).filter(axis => axis.distance > 10).sort((a, b) => b.distance - a.distance);
  if (!rankedAxes.length) return `<h2>${localizedText('Scores near the middle.', 'Pontuações perto do meio.')}</h2><p>${localizedText('No axis is more than ten points from its midpoint. Neutral answers, uncertainty and views that offset each other can all produce this pattern. It does not establish a centrist identity.', 'Nenhum eixo está a mais de dez pontos do meio. Respostas neutras, incerteza e opiniões que se compensam podem produzir esse padrão. Ele não define uma identidade centrista.')}</p>`;
  const cutoff = rankedAxes[Math.min(2, rankedAxes.length - 1)].distance;
  const highlights = rankedAxes.filter(axis => axis.distance >= cutoff);
  return `<h2>${localizedText('The directions in your answers.', 'As direções das suas respostas.')}</h2><p>${localizedText('These scores sit furthest from the midpoint. They describe this set of answers, not which issues matter most to you. Tied scores are shown together.', 'Estas pontuações estão mais distantes do meio. Elas descrevem estas respostas, não quais temas são mais importantes para você. Pontuações empatadas aparecem juntas.')}</p><ul class="result-leans">${highlights.map(({ score, index }) => `<li><span>${axes[index].name}</span><strong>${score > 50 ? axes[index].left : axes[index].right} <span>${score > 50 ? score : 100 - score}%</span></strong></li>`).join('')}</ul>`;
}

function resultReadingNotes(profile) {
  const notes = [];
  if (profile.version === 1) notes.push(localizedText('This is an earlier questionnaire (v1), with its original scores preserved. The current short version uses 48 statements with equal numbers pointing toward each pole. Compare results from the same version and length.', 'Este é um questionário anterior (v1), com as pontuações originais preservadas. A versão curta atual usa 48 afirmações, com quantidades iguais em direção a cada polo. Compare resultados da mesma versão e duração.'));
  const summary = profile.answerSummary;
  if (!summary) {
    notes.push(profile.shared ? localizedText('This shared link contains scores only. The answers behind them are not included, so their response pattern cannot be assessed here.', 'Este link compartilhado contém apenas pontuações. As respostas não estão incluídas, por isso não é possível avaliar aqui o padrão de respostas.') : localizedText('This earlier saved result has no answer details. A new test can show the answers behind each axis.', 'Este resultado anterior não contém detalhes das respostas. Um novo teste pode mostrar as respostas por trás de cada eixo.'));
  } else {
    const count = questionCountForMode(profile.mode, profile.version);
    if (summary.repeatedAnswer === 0) notes.push(localizedText('Every answer was neutral or unsure. There is no directional information in these answers; a midpoint score does not establish a balanced or centrist position.', 'Todas as respostas foram neutras ou incertas. Não há informação direcional nessas respostas; uma pontuação no meio não estabelece uma posição equilibrada ou centrista.'));
    else if (summary.repeatedAnswer !== null) notes.push(localizedText(`You selected “${responseLabels[responseValues.indexOf(summary.repeatedAnswer)]}” for every statement. Statements point in different directions, so repeating one choice can cancel scores out. Review individual statements before treating the result as a settled position.`, `Você selecionou “${responseLabels[responseValues.indexOf(summary.repeatedAnswer)]}” em todas as afirmações. Elas apontam em direções diferentes, então repetir uma opção pode anular pontuações. Releia cada afirmação antes de interpretar o resultado como uma posição definida.`));
    else if (summary.neutralCount >= count / 2) notes.push(localizedText(`${summary.neutralCount} of ${count} answers were neutral or unsure. At least half the responses provide no direction, so read the individual axes with that limited information in mind.`, `${summary.neutralCount} de ${count} respostas foram neutras ou incertas. Pelo menos metade não indica uma direção; considere essa informação limitada ao ler cada eixo.`));
    else notes.push(localizedText(`${summary.neutralCount} of ${count} answers were neutral or unsure. The breakdown below shows how answers contributed to each pole, with up to two examples per axis.`, `${summary.neutralCount} de ${count} respostas foram neutras ou incertas. A análise abaixo mostra como as respostas contribuíram para cada polo, com até dois exemplos por eixo.`));
    notes.push(localizedText('Answer details stay on this device and are excluded from result links and downloaded images. They are not an accuracy rating.', 'Os detalhes das respostas ficam neste dispositivo e não são incluídos nos links nem nas imagens baixadas. Eles não medem a precisão do resultado.'));
  }
  return `<aside class="result-reading-notes"><h3>${localizedText('How to read these scores', 'Como ler estas pontuações')}</h3>${notes.map(note => `<p>${note}</p>`).join('')}</aside>`;
}

function axisInterpretation(profile, axis, index) {
  const score = profile.scores[index];
  const summary = profile.answerSummary?.axes[index];
  if (summary && summary.neutralCount === questionCountForMode(profile.mode, profile.version) / axes.length) return localizedText('Every answer on this axis was neutral or unsure. The midpoint here means no direction was expressed, not that the two positions are equally supported.', 'Todas as respostas deste eixo foram neutras ou incertas. O meio indica que nenhuma direção foi expressa, não que as duas posições tenham o mesmo apoio.');
  if (Math.abs(score - 50) <= 10) return summary?.firstPoleCount && summary?.secondPoleCount ? localizedText('Answers contributed toward both poles and partly offset one another. This score is near the midpoint; the examples below show the different views behind it.', 'As respostas contribuíram para os dois polos e se compensaram parcialmente. A pontuação está perto do meio; os exemplos abaixo mostram as diferentes opiniões por trás dela.') : localizedText('This score is near the midpoint. Neutral answers, uncertainty or a mix of views can produce this result; it is not a separate political identity.', 'Esta pontuação está perto do meio. Respostas neutras, incerteza ou uma combinação de opiniões podem produzir esse resultado; ele não define uma identidade política.');
  return `${localizedText('In this set of answers:', 'Neste conjunto de respostas:')} ${score > 50 ? axis.leftDescription : axis.rightDescription}`;
}

function axisAnswerEvidence(profile, axis, index, selectedQuestions) {
  const summary = profile.answerSummary?.axes[index];
  if (!summary) return '';
  const counts = localizedText(`${summary.firstPoleCount} toward ${axis.left} · ${summary.secondPoleCount} toward ${axis.right} · ${summary.neutralCount} neutral / unsure`, `${summary.firstPoleCount} em direção a ${axis.left} · ${summary.secondPoleCount} em direção a ${axis.right} · ${summary.neutralCount} neutras / incertas`);
  const evidence = summary.evidence.map(answer => {
    const question = selectedQuestions.find(question => question.id === answer.id);
    const pole = answer.answer * question.direction > 0 ? axis.left : axis.right;
    return `<li><blockquote>${question.text}</blockquote><p><strong>${responseLabels[responseValues.indexOf(answer.answer)]}</strong> · ${localizedText(`Contributes toward ${pole}`, `Contribui para ${pole}`)}</p></li>`;
  }).join('');
  return `<div class="axis-answer-counts"><span>${localizedText('Answer counts', 'Contagem de respostas')}</span><p>${counts}</p></div>${evidence ? `<details class="answer-evidence"><summary>${localizedText('Answers behind this axis', 'Respostas por trás deste eixo')}</summary><p>${localizedText('Up to two examples with the strongest contributions. When answers point both ways, one from each direction is shown. All answers count equally in the score.', 'Até dois exemplos com as contribuições mais fortes. Quando há respostas nas duas direções, mostramos uma de cada lado. Todas têm o mesmo peso na pontuação.')}</p><ol>${evidence}</ol></details>` : ''}`;
}

function resultsPage() {
  const profile = activeResult();
  if (!profile) return emptyResultsPage(locale);
  const selectedQuestions = questionsForMode(profile.mode, locale, profile.version);
  const completedDate = profile.shared ? '' : new Date(profile.completedAt).toLocaleDateString(localizedText('en-US', 'pt-BR'), { year: 'numeric', month: 'short', day: 'numeric' });
  return `<section class="container result-intro"><div><span class="eyebrow">${profile.shared ? localizedText('A shared perspective', 'Uma perspectiva compartilhada') : localizedText('Your answers. A wider view.', 'Suas respostas. Uma visão mais ampla.')}</span><h1>${profile.shared ? localizedText('A political perspective.', 'Uma perspectiva política.') : localizedText('Meet your perspective.', 'Conheça sua perspectiva.')}</h1><p>${localizedText(`Twelve dimensions. A snapshot of ${profile.shared ? 'someone’s' : 'your'} views, with room to keep thinking.`, `Doze dimensões. Um retrato ${profile.shared ? 'das opiniões de alguém' : 'das suas opiniões'}, com espaço para continuar refletindo.`)}</p></div><span class="result-stamp"><span aria-hidden="true">✳</span> ${selectedQuestions.length} ${localizedText('statements', 'afirmações')}<small>${localizedText('Questionnaire', 'Questionário')} v${profile.version}</small>${completedDate ? `<small>${completedDate}</small>` : `<small>${localizedText('Shared result · unverified', 'Resultado compartilhado · não verificado')}</small>`}</span></section><section class="container results-overview"><div class="results-chart-panel"><div class="profile-card-top"><span class="eyebrow">${localizedText('The bigger picture', 'Uma visão mais ampla')}</span><span class="sample-pill">${profile.shared ? localizedText('Shared profile', 'Perfil compartilhado') : localizedText('Your profile', 'Seu perfil')}</span></div>${radarChart(profile.scores, { locale })}<p class="chart-key"><span></span> ${localizedText('Distance from center = first-pole score.<br>A larger shape is not a better result.', 'Distância do centro = pontuação do primeiro polo.<br>Uma área maior não significa um resultado melhor.')}</p></div><div class="result-summary"><span class="eyebrow">${localizedText('A place to begin', 'Um ponto de partida')}</span>${resultHighlights(profile)}${resultReadingNotes(profile)}<div class="result-actions"><button class="button" data-action="download">${localizedText('Download image', 'Baixar imagem')} <span aria-hidden="true">↓</span></button><button class="button button-outline" data-action="share">${localizedText('Copy result link', 'Copiar link do resultado')} ${arrow}</button><button class="text-button" data-action="print">${localizedText('Print / save PDF', 'Imprimir / salvar PDF')}</button></div><p class="sharing-note">${localizedText('Sharing is optional. A link reveals all twelve scores to anyone who has it. It contains no individual answers or answer details and cannot be revoked.', 'Compartilhar é opcional. O link revela as doze pontuações a qualquer pessoa que o tenha. Ele não contém respostas individuais nem detalhes das respostas e não pode ser revogado.')}</p></div></section><section class="container result-breakdown"><div class="section-heading"><div><span class="eyebrow">${localizedText('Look closer', 'Veja de perto')}</span><h2>${localizedText('Every dimension<br>adds something.', 'Cada dimensão<br>acrescenta algo.')}</h2></div><p>${localizedText('Each pair adds up to 100%. These percentages summarize answers, not certainty, population rank, or a political identity.', 'Cada par soma 100%. Essas porcentagens resumem respostas; não medem certeza, posição na população ou identidade política.')}</p></div><div class="score-grid">${axes.map((axis, index) => {
    const score = profile.scores[index];
    return `<article class="score-card"><div class="score-title"><span class="axis-number">${String(index + 1).padStart(2, '0')}</span><h3>${axis.name}</h3><a href="/axes#${axis.id}" aria-label="${localizedText(`Learn about ${axis.name.toLowerCase()}`, `Saiba mais sobre ${axis.name.toLowerCase()}`)}">↗</a></div><div class="score-labels"><span>${axis.left}<strong>${score}%</strong></span><span>${axis.right}<strong>${100 - score}%</strong></span></div><div class="score-bar" role="img" aria-label="${axis.left}: ${score} ${localizedText('percent', 'por cento')}; ${axis.right}: ${100 - score} ${localizedText('percent', 'por cento')}"><span style="width:${score}%"></span><i></i></div><p>${axisInterpretation(profile, axis, index)}</p>${axisAnswerEvidence(profile, axis, index, selectedQuestions)}</article>`;
  }).join('')}</div><div class="interpretation-note"><span aria-hidden="true">↗</span><div><strong>${localizedText('A starting point, not a final word.', 'Um ponto de partida, não uma conclusão definitiva.')}</strong><p>${localizedText('This original questionnaire is not scientifically validated. Wording, context, and the limited number of questions affect scores.', 'Este questionário original não tem validação científica. A formulação, o contexto e o número limitado de perguntas afetam as pontuações.')} <a href="/methodology">${localizedText('Read the scoring method and limitations.', 'Leia o método de pontuação e suas limitações.')}</a></p></div></div><div class="results-bottom"><a class="button" href="/political-test">${localizedText('Explore again', 'Explore novamente')} ${arrow}</a><span>${localizedText('Your views can evolve. That’s part of the conversation.', 'Suas opiniões podem evoluir. Isso faz parte da reflexão.')}</span></div></section>`;
}

function render({ initial = false } = {}) {
  clearTimeout(answerAdvanceTimer);
  const path = pathName();
  const localizedPath = routeKey(location.pathname);
  document.getElementById('site-header').innerHTML = header(localizedPath);
  syncThemeButtons();
  document.getElementById('site-footer').innerHTML = footer(locale);
  main.innerHTML = path === '/test' ? localizeLinks(quizPage(), locale) : path === '/results' ? localizeLinks(resultsPage(), locale) : staticPage(localizedPath);
  document.body.classList.toggle('quiz-active', path === '/test');
  if (path === '/') showPreviewProfile(previewIndex);
  const metadata = routeMetadata[localizedPath];
  document.title = metadata ? metadata[0] : localizedText('Page Not Found — 12 Axes', 'Página não encontrada — 12 Axes');
  if (metadata) document.querySelector('meta[name="description"]').setAttribute('content', metadata[1]);
  document.querySelector('meta[name="robots"]').setAttribute('content', ['/test', '/results'].includes(path) || !metadata ? 'noindex, follow' : 'index, follow');
  const canonical = `${siteOrigin}${pagePath(path, locale)}`;
  document.querySelector('link[rel="canonical"]').setAttribute('href', canonical);
  document.querySelector('meta[property="og:url"]').setAttribute('content', canonical);
  document.querySelector('meta[property="og:title"]').setAttribute('content', document.title);
  document.querySelector('meta[property="og:description"]').setAttribute('content', metadata ? metadata[1] : '');
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
  if (metadata && !isPrivatePage(localizedPath)) {
    for (const language of ['en', 'pt-BR', 'x-default']) {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = language;
      link.href = `${siteOrigin}${pagePath(path, language === 'x-default' ? 'en' : language)}`;
      document.head.appendChild(link);
    }
  }
  if (path === '/results' && location.hash.startsWith('#r=')) document.querySelectorAll('a[hreflang]').forEach(link => { link.hash = location.hash; });
  trackPageView(localizedPath);
  if (path === '/political-test' && session) {
    const answeredCount = session.answers.filter(answer => answer !== null).length;
    document.getElementById('resume-slot').innerHTML = `<div class="resume-banner"><div><strong>${localizedText('A little perspective, in progress.', 'Sua perspectiva está tomando forma.')}</strong><p>${localizedText(`${answeredCount} of ${session.answers.length} statements answered in your ${session.mode} test (v${session.version}). Starting a new test replaces this progress.`, `${answeredCount} de ${session.answers.length} afirmações respondidas na versão ${session.mode === 'quick' ? 'rápida' : 'completa'} (v${session.version}). Iniciar um novo teste substitui esse progresso.`)}</p></div><button class="button button-small" data-action="resume">${localizedText('Resume test', 'Continuar teste')} →</button></div>`;
  }
  if (location.hash && !location.hash.startsWith('#r=')) {
    requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
  } else if (!initial) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}


function showPreviewProfile(index) {
  const cards = [...document.querySelectorAll('[data-preview-card]')];
  if (!cards.length) return;
  if (!Number.isInteger(index) || index < 0 || index >= cards.length) throw new Error(`Unknown example profile index: ${index}`);
  previewIndex = index;
  cards.forEach((card, cardIndex) => {
    const position = (cardIndex - index + cards.length) % cards.length;
    card.classList.toggle('is-current', position === 0);
    card.classList.toggle('is-after', position === 1);
    card.classList.toggle('is-before', position > 1);
    card.setAttribute('aria-hidden', String(position !== 0));
  });
  document.querySelectorAll('[data-action="preview-profile"]').forEach(button => {
    const active = Number(button.dataset.index) === index;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function selectAnswer(value) {
  if (!session || !Number.isInteger(value) || value < -2 || value > 2) throw new Error(`Invalid answer value: ${value}`);
  clearTimeout(answerAdvanceTimer);
  session.answers[session.index] = value;
  saveStored(sessionKey, session);
  const options = document.querySelectorAll('[data-action="answer"]');
  options.forEach(button => {
    const selected = Number(button.dataset.value) === value;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelector('[data-action="next"]').disabled = false;
  const answeredCount = session.answers.filter(answer => answer !== null).length;
  const selectedQuestions = questionsForMode(session.mode, locale, session.version);
  document.querySelector('.quiz-complete').textContent = `${Math.round(answeredCount / session.answers.length * 100)}% ${localizedText('complete', 'concluído')}`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(answeredCount));
  document.querySelector('.progress-track').innerHTML = quizProgressSegments(selectedQuestions, session.answers, selectedQuestions[session.index].axis);
  if (advanceOnAnswer) {
    const answeredSession = session;
    const answeredIndex = session.index;
    answerAdvanceTimer = setTimeout(() => {
      if (pathName() === '/test' && session === answeredSession && session.index === answeredIndex && !document.querySelector('dialog[open]')) nextQuestion();
    }, 220);
  }
}

function nextQuestion() {
  clearTimeout(answerAdvanceTimer);
  if (!session || session.answers[session.index] === null) return;
  if (session.index < session.answers.length - 1) {
    session.index += 1;
    saveStored(sessionKey, session);
    render();
    return;
  }
  const unanswered = session.answers.indexOf(null);
  if (unanswered !== -1) {
    session.index = unanswered;
    saveStored(sessionKey, session);
    render();
    notify(localizedText('Please answer every statement before viewing your results.', 'Responda a todas as afirmações antes de ver seu resultado.'));
    return;
  }
  const selectedQuestions = questionsForMode(session.mode, locale, session.version);
  result = { version: session.version, mode: session.mode, scores: calculateScores(selectedQuestions, session.answers), answerSummary: summarizeAnswers(selectedQuestions, session.answers), completedAt: new Date().toISOString() };
  saveStored(resultKey, result);
  trackConversion('quiz_complete', result.mode);
  removeStored(sessionKey);
  session = null;
  navigate(pagePath('/results', locale));
}

function previousQuestion() {
  clearTimeout(answerAdvanceTimer);
  if (!session || session.index === 0) return;
  session.index -= 1;
  saveStored(sessionKey, session);
  render();
}

function showClearDialog() {
  clearTimeout(answerAdvanceTimer);
  const dialog = document.getElementById('clear-dialog');
  if (!dialog.open) dialog.showModal();
}

function syncThemeButtons() {
  const dark = document.documentElement.dataset.theme === 'dark';
  document.querySelectorAll('[data-action="toggle-theme"]').forEach(button => {
    button.setAttribute('aria-label', localizedText(`Switch to ${dark ? 'light' : 'dark'} mode`, `Mudar para o tema ${dark ? 'claro' : 'escuro'}`));
    button.setAttribute('aria-pressed', String(dark));
  });
}

async function copyResultLink() {
  const profile = activeResult();
  if (!profile) return;
  const link = sharedResultUrl(profile, locale);
  if (!navigator.clipboard) {
    showShareFallback(link);
    trackConversion('result_share', profile.mode);
    return;
  }
  try {
    await navigator.clipboard.writeText(link);
    notify(localizedText('Result link copied. Anyone with this link can view the twelve scores.', 'Link do resultado copiado. Qualquer pessoa com esse link pode ver as doze pontuações.'));
  } catch (error) {
    if (error.name !== 'NotAllowedError' && error.name !== 'SecurityError') throw error;
    showShareFallback(link);
  }
  trackConversion('result_share', profile.mode);
}

function showShareFallback(link) {
  const dialog = document.getElementById('share-dialog');
  document.getElementById('share-link').value = link;
  dialog.showModal();
  document.getElementById('share-link').select();
}

document.addEventListener('click', event => {
  const actionButton = event.target.closest('[data-action]');
  if (actionButton && !actionButton.disabled) {
    const action = actionButton.dataset.action;
    if (action === 'start') {
      const mode = actionButton.dataset.mode;
      session = { version: 2, mode, index: 0, answers: questionsForMode(mode, locale, 2).map(() => null) };
      saveStored(sessionKey, session);
      trackConversion('quiz_start', mode);
      navigate(pagePath('/test', locale));
    }
    if (action === 'resume') navigate(pagePath('/test', locale));
    if (action === 'preview-profile') showPreviewProfile(Number(actionButton.dataset.index));
    if (action === 'toggle-menu') {
      const expanded = actionButton.getAttribute('aria-expanded') !== 'true';
      actionButton.setAttribute('aria-expanded', String(expanded));
      actionButton.setAttribute('aria-label', expanded ? localizedText('Close navigation', 'Fechar navegação') : localizedText('Open navigation', 'Abrir navegação'));
      document.getElementById('main-navigation').classList.toggle('is-open', expanded);
    }
    if (action === 'toggle-advance') {
      clearTimeout(answerAdvanceTimer);
      advanceOnAnswer = !advanceOnAnswer;
      actionButton.setAttribute('aria-checked', String(advanceOnAnswer));
    }
    if (action === 'toggle-theme') {
      document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      syncThemeButtons();
    }
    if (action === 'answer') selectAnswer(Number(actionButton.dataset.value));
    if (action === 'next') nextQuestion();
    if (action === 'previous') previousQuestion();
    if (action === 'share') copyResultLink();
    if (action === 'download') {
      const profile = activeResult();
      if (profile) {
        downloadResultImage(profile, locale);
        trackConversion('result_download', profile.mode);
      }
    }
    if (action === 'print') window.print();
    if (action === 'clear-data') showClearDialog();
    if (action === 'analytics-settings') showAnalyticsPreferences();
    if (action === 'confirm-clear') {
      removeStored(sessionKey);
      removeStored(resultKey);
      session = null;
      result = null;
      document.getElementById('clear-dialog').close();
      if (pathName() === '/test' || pathName() === '/results' && !location.hash) navigate(pagePath('/political-test', locale));
      else render();
      notify(localizedText('Your saved answers, result and answer details have been removed from this browser. Shared links and downloaded files are unchanged.', 'Suas respostas, seu resultado e os detalhes das respostas foram removidos deste navegador. Links compartilhados e arquivos baixados continuam disponíveis.'));
    }
    if (action === 'close-dialog') actionButton.closest('dialog').close();
    return;
  }
  const anchor = event.target.closest('a[href]');
  if (anchor?.classList.contains('skip-link')) { event.preventDefault(); main.focus(); return; }
  if (!anchor || anchor.target || anchor.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin || !Object.hasOwn(routeMetadata, routeKey(url.pathname))) return;
  if (localeForPath(url.pathname) !== locale && pathName() === '/results' && basePath(url.pathname) === '/results' && location.hash.startsWith('#r=')) url.hash = location.hash;
  event.preventDefault();
  navigate(`${url.pathname}${url.search}${url.hash}`);
});

document.addEventListener('keydown', event => {
  if (pathName() !== '/test' || !session || document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
  if (/^[1-5]$/.test(event.key)) {
    event.preventDefault();
    selectAnswer(responseValues[Number(event.key) - 1]);
  }
  if (event.key === 'ArrowRight') { event.preventDefault(); nextQuestion(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); previousQuestion(); }
});
setInterval(() => {
  const gallery = document.querySelector('.hero-gallery');
  if (!gallery || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches || gallery.matches(':hover, :focus-within')) return;
  showPreviewProfile((previewIndex + 1) % gallery.querySelectorAll('[data-preview-card]').length);
}, 6000);
window.addEventListener('popstate', () => render());
window.addEventListener('hashchange', () => render());
render({ initial: true });
initializeAnalytics();
