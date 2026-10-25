const title = document.getElementById('title'), detail = document.getElementById('detail'), progress = document.getElementById('progress'), action = document.getElementById('action');
let current;
function show(state) {
  current = state;
  const copy = {
    idle: ['Seu Enturma está aqui.', 'Confira se há uma nova versão disponível.'],
    checking: ['Procurando novidades…', 'Consultando o canal oficial de atualizações.'],
    available: ['Uma nova versão chegou.', 'Preparando o download verificado.'],
    downloading: ['Sua próxima versão está chegando.', 'Baixando a atualização · ' + Math.round(state.progress || 0) + '%'],
    ready: ['Tudo pronto para atualizar.', 'Conclua sua chamada antes de reiniciar. A instalação continuará em uma janela própria.'],
    installing: ['Atualizando o Enturma…', 'Iniciando o instalador seguro. O aplicativo abrirá novamente ao concluir.'],
    error: ['Vamos tentar novamente?', state.message || 'Não foi possível baixar a atualização. Sua versão atual continua disponível.'],
    current: ['Você está em dia.', 'Esta é a versão mais recente do Enturma.'],
  }[state.status] || ['Enturma', 'Este sistema utiliza seu canal de atualização.'];
  title.textContent = copy[0]; detail.textContent = copy[1];
  document.getElementById('version').textContent = state.version ? 'Versão ' + state.version : 'Versão atual ' + state.currentVersion;
  if (state.status === 'downloading') progress.value = Math.min(100, Math.max(0, state.progress || 0)); else progress.removeAttribute('value');
  progress.hidden = ['ready','error','current'].includes(state.status);
  action.hidden = !['ready','error','current','idle'].includes(state.status);
  action.disabled = false;
  action.textContent = state.status === 'ready' ? 'Atualizar e reiniciar' : state.status === 'current' ? 'Continuar estudando' : 'Tentar novamente';
}
action.addEventListener('click', async () => {
  action.disabled = true;
  try { if (current.status === 'ready') await window.setup.install(); else if (current.status === 'current') await window.setup.close(); else await window.setup.check(); }
  catch { detail.textContent = 'Não foi possível concluir. Tente novamente.'; action.disabled = false; }
});
document.getElementById('close').addEventListener('click', () => window.setup.close());
window.setup.subscribe(show); window.setup.state().then(show);
const film = document.querySelector('.film');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
function motion() { film.src = reduce.matches || document.hidden ? '../assets/icon.png' : '../assets/motion/update.gif'; }
reduce.addEventListener('change', motion); document.addEventListener('visibilitychange', motion); motion();
