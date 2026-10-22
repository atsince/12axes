import { axes } from './content.js';
import { questionsForMode, calculateScores, readSharedResult, sharedResultUrl } from './scoring.js';
import { radarChart, downloadResultImage } from './chart.js';
import { header, footer, staticPage, routeMetadata, arrow, emptyResultsPage } from './views.js';

const sessionKey = '12axes.session.v1';
const resultKey = '12axes.result.v1';
const main = document.getElementById('main');
const responseLabels = ['Strongly agree', 'Agree', 'Neutral / unsure', 'Disagree', 'Strongly disagree'];
const responseValues = [2, 1, 0, -1, -2];
let storageWarningShown = false;
let toastTimer;

function notify(message, kind = 'info') {
  const notice = document.getElementById('notice');
  notice.textContent = message;
  notice.className = `notice visible ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { notice.className = 'notice'; }, 9000);
}

function storageUnavailable(error) {
  if (!['SecurityError', 'QuotaExceededError'].includes(error.name)) throw error;
  if (!storageWarningShown) notify('Browser storage is unavailable. You can still take the test, but keep this tab open to retain your progress.', 'warning');
  storageWarningShown = true;
}

function validSession(value) {
  if (!value || value.version !== 1 || !['quick', 'full'].includes(value.mode)) return false;
  const count = questionsForMode(value.mode).length;
  return Number.isInteger(value.index) && value.index >= 0 && value.index < count && Array.isArray(value.answers) && value.answers.length === count && value.answers.every(answer => answer === null || Number.isInteger(answer) && answer >= -2 && answer <= 2);
}

function validResult(value) {
  return value && value.version === 1 && ['quick', 'full'].includes(value.mode) && Array.isArray(value.scores) && value.scores.length === axes.length && value.scores.every(score => Number.isInteger(score) && score >= 0 && score <= 100) && typeof value.completedAt === 'string' && Number.isFinite(Date.parse(value.completedAt));
}

function loadStored(key, validate) {
  let stored;
  try { stored = localStorage.getItem(key); } catch (error) { storageUnavailable(error); return null; }
  if (!stored) return null;
  let value;
  try { value = JSON.parse(stored); } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    notify(`Saved information in ${key} could not be read. Please start a new test.`, 'warning');
    return null;
  }
  if (!validate(value)) {
    notify(`Saved information in ${key} has an unsupported format. Please start a new test.`, 'warning');
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
  return location.pathname.replace(/\/$/, '') || '/';
}

function navigate(path) {
  history.pushState({}, '', path);
  render();
}

function quizPage() {
  if (!session) return `<section class="container empty-state"><span class="eyebrow">A fresh perspective</span><h1>Choose your starting point.</h1><p>Select a test length to begin your questionnaire.</p><a href="/political-test" class="button">Choose your test ${arrow}</a></section>`;
  const selectedQuestions = questionsForMode(session.mode);
  const question = selectedQuestions[session.index];
  const axis = axes.find(item => item.id === question.axis);
  const answeredCount = session.answers.filter(answer => answer !== null).length;
  const selected = session.answers[session.index];
  return `<section class="quiz-shell container"><div class="quiz-topline"><a href="/political-test" class="back-link">← Save & exit</a><span>${session.mode === 'quick' ? 'Quick' : 'Full'} perspective <span class="middot">·</span> ${storageWarningShown ? 'This tab only' : 'Saved on this device'}</span></div><div class="quiz-progress-label"><strong>Question ${session.index + 1} <span>of ${selectedQuestions.length}</span></strong><span>${answeredCount} answered</span></div><div class="progress-track" role="progressbar" aria-valuenow="${answeredCount}" aria-valuemin="0" aria-valuemax="${selectedQuestions.length}" aria-label="Statements answered"><span style="width:${answeredCount / selectedQuestions.length * 100}%"></span></div><div class="question-panel"><span class="eyebrow question-category">${String(axes.indexOf(axis) + 1).padStart(2, '0')} / ${axis.name}</span><h1>${question.text}</h1><p class="question-prompt">How much do you agree with this statement?</p><div class="answer-options" role="group" aria-label="Your response">${responseLabels.map((label, index) => `<button type="button" class="answer-option answer-${index} ${selected === responseValues[index] ? 'selected' : ''}" data-action="answer" data-value="${responseValues[index]}" aria-pressed="${selected === responseValues[index]}"><span class="answer-radio" aria-hidden="true"></span><span>${label}</span><kbd>${index + 1}</kbd></button>`).join('')}</div><div class="quiz-navigation"><button class="text-button back-question" data-action="previous" ${session.index === 0 ? 'disabled' : ''}>← Previous</button><button class="button" data-action="next" ${selected === null ? 'disabled' : ''}>${session.index === selectedQuestions.length - 1 ? 'See my results' : 'Continue'} <span aria-hidden="true">→</span></button></div><p class="keyboard-note">Keyboard: <kbd>1</kbd>–<kbd>5</kbd> to choose <span>·</span> <kbd>→</kbd> to continue</p></div><p class="quiz-reassurance">There’s no right answer. Neutral is a valid response, too.</p></section>`;
}

function activeResult() {
  if (location.hash) {
    try { return readSharedResult(location.hash); } catch (error) {
      notify(error.message, 'warning');
      return null;
    }
  }
  return result;
}

function resultsPage() {
  const profile = activeResult();
  if (!profile) return emptyResultsPage();
  const strongest = profile.scores.map((score, index) => ({ score, index, distance: Math.abs(score - 50) })).sort((a, b) => b.distance - a.distance)[0];
  const strongestAxis = axes[strongest.index];
  const lean = strongest.score >= 50 ? strongestAxis.left : strongestAxis.right;
  const completedDate = profile.shared ? '' : new Date(profile.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return `<section class="container result-intro"><div><span class="eyebrow">${profile.shared ? 'A shared perspective' : 'Your answers. A wider view.'}</span><h1>${profile.shared ? 'A political perspective.' : 'Meet your perspective.'}</h1><p>Twelve dimensions. A snapshot of ${profile.shared ? 'someone’s' : 'your'} views, with room to keep thinking.</p></div><span class="result-stamp"><span aria-hidden="true">✳</span> ${profile.mode === 'quick' ? 36 : 72} statements${completedDate ? `<small>${completedDate}</small>` : '<small>Shared result · unverified</small>'}</span></section><section class="container results-overview"><div class="results-chart-panel"><div class="profile-card-top"><span class="eyebrow">The bigger picture</span><span class="sample-pill">${profile.shared ? 'Shared profile' : 'Your profile'}</span></div>${radarChart(profile.scores)}<p class="chart-key"><span></span> Distance from center = first-pole score.<br>A larger shape is not a better result.</p></div><div class="result-summary"><span class="eyebrow">A place to begin</span><h2>${strongest.distance <= 10 ? 'A balance of perspectives.' : `A lean toward<br>${lean.toLowerCase()}.`}</h2><p>${strongest.distance <= 10 ? 'Your scores stay near the middle of the scales. That can reflect balance, uncertainty, or a mix of views. The individual dimensions tell you more than an overall label.' : `Your strongest lean in these answers is on ${strongestAxis.name.toLowerCase()}. That’s one part of the picture. Read all twelve dimensions below to see where your priorities differ.`}</p><div class="result-actions"><button class="button" data-action="download">Download image <span aria-hidden="true">↓</span></button><button class="button button-outline" data-action="share">Copy result link ${arrow}</button><button class="text-button" data-action="print">Print / save PDF</button></div><p class="sharing-note">Sharing is optional. A link reveals all twelve scores to anyone who has it. It contains no individual answers and cannot be revoked.</p></div></section><section class="container result-breakdown"><div class="section-heading"><div><span class="eyebrow">Look closer</span><h2>Every dimension<br>adds something.</h2></div><p>Each pair adds up to 100%. These percentages summarize answers, not certainty, population rank, or a political identity.</p></div><div class="score-grid">${axes.map((axis, index) => {
    const score = profile.scores[index];
    const balanced = Math.abs(score - 50) <= 10;
    return `<article class="score-card"><div class="score-title"><span class="axis-number">${String(index + 1).padStart(2, '0')}</span><h3>${axis.name}</h3><a href="/axes#${axis.id}" aria-label="Learn about ${axis.name.toLowerCase()}">↗</a></div><div class="score-labels"><span>${axis.left}<strong>${score}%</strong></span><span>${axis.right}<strong>${100 - score}%</strong></span></div><div class="score-bar" role="img" aria-label="${axis.left}: ${score} percent; ${axis.right}: ${100 - score} percent"><span style="width:${score}%"></span><i></i></div><p>${balanced ? `Your answers balance the two poles on ${axis.name.toLowerCase()}. This can reflect a mixture of views or neutral responses.` : score > 50 ? axis.leftDescription : axis.rightDescription}</p></article>`;
  }).join('')}</div><div class="interpretation-note"><span aria-hidden="true">↗</span><div><strong>A starting point, not a final word.</strong><p>This original questionnaire is not scientifically validated. Wording, context, and the limited number of questions affect scores. <a href="/methodology">Read the scoring method and limitations.</a></p></div></div><div class="results-bottom"><a class="button" href="/political-test">Explore again ${arrow}</a><span>Your views can evolve. That’s part of the conversation.</span></div></section>`;
}

function render({ initial = false } = {}) {
  const path = pathName();
  document.getElementById('site-header').innerHTML = header(path);
  document.getElementById('site-footer').innerHTML = footer();
  main.innerHTML = path === '/test' ? quizPage() : path === '/results' ? resultsPage() : staticPage(path);
  document.body.classList.toggle('quiz-active', path === '/test');
  const metadata = routeMetadata[path];
  document.title = metadata ? metadata[0] : 'Page Not Found — 12 Axes';
  if (metadata) document.querySelector('meta[name="description"]').setAttribute('content', metadata[1]);
  document.querySelector('meta[name="robots"]').setAttribute('content', ['/test', '/results'].includes(path) || !metadata ? 'noindex, follow' : 'index, follow');
  document.querySelector('link[rel="canonical"]').setAttribute('href', `https://12axes.lashreel.com${path === '/' ? '/' : path}`);
  if (path === '/political-test' && session) {
    const answeredCount = session.answers.filter(answer => answer !== null).length;
    document.getElementById('resume-slot').innerHTML = `<div class="resume-banner"><div><strong>A little perspective, in progress.</strong><p>${answeredCount} of ${session.answers.length} statements answered in your ${session.mode} test. Starting a new test replaces this progress.</p></div><button class="button button-small" data-action="resume">Resume test →</button></div>`;
  }
  if (location.hash && !location.hash.startsWith('#r=')) {
    requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView());
  } else if (!initial) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

function selectAnswer(value) {
  if (!session || !Number.isInteger(value) || value < -2 || value > 2) throw new Error(`Invalid answer value: ${value}`);
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
  document.querySelector('.quiz-progress-label > span').textContent = `${answeredCount} answered`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(answeredCount));
  document.querySelector('.progress-track > span').style.width = `${answeredCount / session.answers.length * 100}%`;
}

function nextQuestion() {
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
    notify('Please answer every statement before viewing your results.');
    return;
  }
  result = { version: 1, mode: session.mode, scores: calculateScores(questionsForMode(session.mode), session.answers), completedAt: new Date().toISOString() };
  saveStored(resultKey, result);
  removeStored(sessionKey);
  session = null;
  navigate('/results');
}

function previousQuestion() {
  if (!session || session.index === 0) return;
  session.index -= 1;
  saveStored(sessionKey, session);
  render();
}

function showClearDialog() {
  const dialog = document.getElementById('clear-dialog');
  if (!dialog.open) dialog.showModal();
}

async function copyResultLink() {
  const profile = activeResult();
  if (!profile) return;
  const link = sharedResultUrl(profile);
  if (!navigator.clipboard) {
    showShareFallback(link);
    return;
  }
  try {
    await navigator.clipboard.writeText(link);
    notify('Result link copied. Anyone with this link can view the twelve scores.');
  } catch (error) {
    if (error.name !== 'NotAllowedError' && error.name !== 'SecurityError') throw error;
    showShareFallback(link);
  }
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
      session = { version: 1, mode, index: 0, answers: questionsForMode(mode).map(() => null) };
      saveStored(sessionKey, session);
      navigate('/test');
    }
    if (action === 'resume') navigate('/test');
    if (action === 'answer') selectAnswer(Number(actionButton.dataset.value));
    if (action === 'next') nextQuestion();
    if (action === 'previous') previousQuestion();
    if (action === 'share') copyResultLink();
    if (action === 'download') {
      const profile = activeResult();
      if (profile) downloadResultImage(profile);
    }
    if (action === 'print') window.print();
    if (action === 'clear-data') showClearDialog();
    if (action === 'confirm-clear') {
      removeStored(sessionKey);
      removeStored(resultKey);
      session = null;
      result = null;
      document.getElementById('clear-dialog').close();
      if (pathName() === '/test' || pathName() === '/results' && !location.hash) navigate('/political-test');
      else render();
      notify('Your saved answers and result have been removed from this browser. Shared links and downloaded files are unchanged.');
    }
    if (action === 'close-dialog') actionButton.closest('dialog').close();
    return;
  }
  const anchor = event.target.closest('a[href]');
  if (anchor?.classList.contains('skip-link')) { event.preventDefault(); main.focus(); return; }
  if (!anchor || anchor.target || anchor.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  const url = new URL(anchor.href, location.href);
  if (url.origin !== location.origin) return;
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
window.addEventListener('popstate', () => render());
window.addEventListener('hashchange', () => render());
render({ initial: true });
