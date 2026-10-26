export function dialogs(locale = 'en') {
  if (!['en', 'pt-BR'].includes(locale)) throw new Error(`Unsupported dialog locale: ${locale}`);
  const dialogText = locale === 'pt-BR' ? {
    analyticsTitle: 'Quer ajudar a melhorar o 12 Axes?',
    analyticsDescription: 'Permita que o Google Analytics meça visitas, início e conclusão do teste, downloads e compartilhamentos, e que o Microsoft Clarity registre interações nas páginas públicas. Não enviamos respostas, pontuações nem fragmentos de links de resultado como dados de análise. O Clarity não é carregado nas páginas de perguntas e resultados pessoais. Os cookies de análise são opcionais; o teste funciona de qualquer forma.',
    privacy: 'Política de privacidade',
    cookies: 'Cookies e armazenamento',
    reject: 'Recusar análise',
    allow: 'Permitir análise',
    later: 'Decidir depois',
    clearTitle: 'Apagar seus dados locais?',
    clearDescription: 'Isso remove as respostas salvas, o progresso do teste e o resultado mais recente deste navegador. Links compartilhados, arquivos baixados e cópias em outros aparelhos continuam disponíveis.',
    keep: 'Manter meus dados',
    clear: 'Apagar dados locais',
    shareTitle: 'Seu link de resultado',
    shareDescription: 'Copie este link manualmente. Qualquer pessoa com ele pode ver as doze pontuações. As respostas individuais não são incluídas. O link não pode ser revogado.',
    resultUrl: 'URL do resultado',
    done: 'Concluir'
  } : {
    analyticsTitle: 'Help improve 12 Axes?',
    analyticsDescription: 'Allow Google Analytics to measure visits, test starts and completions, downloads, and sharing, and Microsoft Clarity to record interactions on public pages. We do not send answers, scores, or result-link fragments as analytics data. Clarity is not loaded on questionnaire or personal result pages. Analytics cookies are optional; the test works either way.',
    privacy: 'Privacy policy',
    cookies: 'Cookies & storage',
    reject: 'Reject analytics',
    allow: 'Allow analytics',
    later: 'Decide later',
    clearTitle: 'Clear your local perspective?',
    clearDescription: 'This removes saved answers, test progress, and your latest result from this browser. Shared links, downloaded files, and copies on other devices remain available.',
    keep: 'Keep my data',
    clear: 'Clear local data',
    shareTitle: 'Your result link',
    shareDescription: 'Copy this link manually. Anyone with it can view all twelve scores. Individual answers are not included. The link cannot be revoked.',
    resultUrl: 'Result URL',
    done: 'Done'
  };
  return `<dialog id="analytics-dialog" aria-labelledby="analytics-title"><h2 id="analytics-title">${dialogText.analyticsTitle}</h2><p>${dialogText.analyticsDescription}</p><p><a href="/privacy">${dialogText.privacy}</a> · <a href="/cookies">${dialogText.cookies}</a></p><p id="analytics-storage-error" role="alert" hidden></p><div class="dialog-actions"><button class="button button-outline" data-analytics-consent="denied">${dialogText.reject}</button><button class="button" data-analytics-consent="granted">${dialogText.allow}</button><button class="text-button" data-action="close-dialog">${dialogText.later}</button></div></dialog>
<div id="notice" class="notice" role="status" aria-live="polite" aria-atomic="true"></div>
<dialog id="clear-dialog" aria-labelledby="clear-dialog-title"><h2 id="clear-dialog-title">${dialogText.clearTitle}</h2><p>${dialogText.clearDescription}</p><div class="dialog-actions"><button class="button button-outline" data-action="close-dialog">${dialogText.keep}</button><button class="button" data-action="confirm-clear">${dialogText.clear}</button></div></dialog>
<dialog id="share-dialog" aria-labelledby="share-dialog-title"><h2 id="share-dialog-title">${dialogText.shareTitle}</h2><p>${dialogText.shareDescription}</p><label for="share-link" class="eyebrow">${dialogText.resultUrl}</label><input id="share-link" class="share-input" type="text" readonly><div class="dialog-actions"><button class="button" data-action="close-dialog">${dialogText.done}</button></div></dialog>`;
}
