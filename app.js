import { firebaseConfig } from './firebase-config.js';

const app = document.querySelector('#app');
const state = { view: 'home', classNo: null, tab: 'submit', db: null, online: false };
const firebaseReady = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

if (firebaseReady) {
  try {
    const [{ initializeApp }, firestore] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')
    ]);
    const fbApp = initializeApp(firebaseConfig);
    state.db = { instance: firestore.getFirestore(fbApp), ...firestore };
    state.online = true;
  } catch (error) { console.error('Firebase 연결 실패:', error); }
}

const clone = id => document.querySelector(id).content.cloneNode(true);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const seconds = (min, sec) => Number(min) * 60 + Number(sec);
const timeText = total => `${Math.floor(total / 60)}분 ${String(total % 60).padStart(2, '0')}초`;

function navigate(view, classNo = null) {
  state.view = view; if (classNo) state.classNo = classNo;
  render(); app.focus(); window.scrollTo({ top: document.querySelector('.hero').offsetHeight - 20, behavior: 'smooth' });
}

function render() {
  app.replaceChildren();
  if (state.view === 'home') app.append(clone('#home-template'));
  if (state.view === 'classes') {
    app.append(clone('#classes-template'));
    const grid = app.querySelector('#class-grid');
    for (let n = 1; n <= 7; n++) grid.insertAdjacentHTML('beforeend', `<button class="class-card" data-class="${n}"><b>1학년 ${n}반</b><span>입장하기 →</span></button>`);
  }
  if (state.view === 'class') renderClass();
  if (state.view === 'guide') app.append(clone('#guide-template'));
}

function renderClass() {
  app.append(clone('#class-template'));
  app.querySelector('#class-name').textContent = `1학년 ${state.classNo}반`;
  app.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === state.tab));
  const area = app.querySelector('#tab-content');
  if (state.tab === 'submit') area.append(clone('#form-template'));
  else { area.append(clone('#results-template')); loadResults(); }
  app.querySelector('#refresh-button').hidden = state.tab !== 'results';
}

document.addEventListener('click', e => {
  const view = e.target.closest('[data-view]'); if (view) navigate(view.dataset.view);
  const cls = e.target.closest('[data-class]'); if (cls) { state.tab = 'submit'; navigate('class', Number(cls.dataset.class)); }
  const tab = e.target.closest('[data-tab]'); if (tab) { state.tab = tab.dataset.tab; renderClassOnly(); }
  if (e.target.closest('#refresh-button')) loadResults();
});

function renderClassOnly() { app.replaceChildren(); renderClass(); }

document.addEventListener('submit', async e => {
  if (e.target.id !== 'result-form') return;
  e.preventDefault();
  const form = e.target, button = form.querySelector('button[type="submit"]'), message = form.querySelector('#form-message');
  const raw = Object.fromEntries(new FormData(form));
  const data = {
    classNo: state.classNo, team: raw.team.trim(), writer: raw.writer.trim(),
    firstTime: seconds(raw.firstMin, raw.firstSec), secondTime: seconds(raw.secondMin, raw.secondSec),
    firstStrategy: raw.firstStrategy.trim(), problem: raw.problem.trim(), aiAdvice: raw.aiAdvice.trim(),
    chosenStrategy: raw.chosenStrategy.trim(), reason: raw.reason.trim(), reflection: raw.reflection.trim(),
    createdAt: new Date().toISOString()
  };
  button.disabled = true; button.textContent = '게시하는 중…';
  try {
    await saveResult(data); message.textContent = '게시되었습니다! 우리 반 결과판에서 확인하세요.'; message.style.color = '#16803a';
    form.reset(); setTimeout(() => { state.tab = 'results'; renderClassOnly(); }, 900);
  } catch (error) {
    console.error(error); message.textContent = '저장하지 못했습니다. 인터넷 연결을 확인하고 다시 시도하세요.'; message.style.color = '#dc2626';
    button.disabled = false; button.textContent = '우리 모둠 결과 게시하기';
  }
});

async function saveResult(data) {
  if (state.online) {
    const id = `${data.classNo}-${data.team.replace(/[^가-힣a-zA-Z0-9_-]/g, '') || Date.now()}`;
    const { doc, setDoc, serverTimestamp } = state.db;
    await setDoc(doc(state.db.instance, 'mission2000-results', id), { ...data, createdAt: serverTimestamp() });
  } else {
    const all = JSON.parse(localStorage.getItem('mission2000-results') || '[]');
    const index = all.findIndex(x => x.classNo === data.classNo && x.team === data.team);
    if (index >= 0) all[index] = data; else all.push(data);
    localStorage.setItem('mission2000-results', JSON.stringify(all));
  }
}

async function getResults() {
  if (state.online) {
    const { collection, query, where, getDocs } = state.db;
    const snap = await getDocs(query(collection(state.db.instance, 'mission2000-results'), where('classNo', '==', state.classNo)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return JSON.parse(localStorage.getItem('mission2000-results') || '[]').filter(x => x.classNo === state.classNo);
}

async function loadResults() {
  const list = app.querySelector('#results-list'), summary = app.querySelector('#summary');
  if (!list) return;
  list.innerHTML = '<div class="empty">기록을 불러오는 중입니다.</div>';
  try {
    const results = (await getResults()).sort((a,b) => a.secondTime - b.secondTime);
    const improved = results.filter(x => x.secondTime < x.firstTime).length;
    const changes = results.map(x => x.firstTime - x.secondTime);
    const avg = changes.length ? Math.round(changes.reduce((a,b)=>a+b,0)/changes.length) : 0;
    summary.innerHTML = `<div class="summary-card"><span>참여 모둠</span><b>${results.length}모둠</b></div><div class="summary-card"><span>기록 향상</span><b>${improved}모둠</b></div><div class="summary-card"><span>평균 기록 변화</span><b>${avg > 0 ? '-' : avg < 0 ? '+' : ''}${timeText(Math.abs(avg))}</b></div>`;
    if (!results.length) { list.innerHTML = `<div class="empty">아직 게시된 기록이 없습니다.${state.online ? '' : '<br><small>현재 체험 모드: 결과는 이 기기에만 표시됩니다.</small>'}</div>`; return; }
    list.innerHTML = results.map(resultCard).join('');
  } catch (error) { console.error(error); list.innerHTML = '<div class="empty">기록을 불러오지 못했습니다. 잠시 후 다시 시도하세요.</div>'; }
}

function resultCard(r) {
  const change = r.firstTime - r.secondTime;
  const label = change > 0 ? `${timeText(change)} 단축` : change < 0 ? `${timeText(-change)} 증가` : '기록 동일';
  const cls = change > 0 ? 'good' : change < 0 ? 'bad' : '';
  return `<article class="result-card"><div class="result-top"><div><h3>${esc(r.team)}</h3><small>기록자 ${esc(r.writer)}</small></div><div class="record">${timeText(r.firstTime)} → ${timeText(r.secondTime)} <span class="change ${cls}">${label}</span></div></div><div class="result-details"><div class="detail"><b>1차 전략과 문제점</b><p>${esc(r.firstStrategy)}\n${esc(r.problem)}</p></div><div class="detail"><b>AI 제안</b><p>${esc(r.aiAdvice)}</p></div><div class="detail"><b>우리가 선택한 전략과 이유</b><p>${esc(r.chosenStrategy)}\n${esc(r.reason)}</p></div><div class="detail"><b>결과 해석</b><p>${esc(r.reflection)}</p></div></div></article>`;
}

render();
