/**
 * 지능형 과학실 ON 공통 «학습 흐름» 레이어
 *   학습목표 · 진단하기 · 탐구하기(▾3) · 확인하기 · 정리하기 ·
 *   창의적으로 생각하기 · 보고서 양식 다운로드 · 실험 다시하기
 *
 * 3D 시뮬레이션(Lab 셸)은 그대로 두고, 상단에 흐름 메뉴 바를 얹는다.
 * 탐구하기의 세 소주제는 기존 실험 탭(top-tabs)과 연동된다.
 */
const LabFlow = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => (s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const state = {
    diag: { pick: [null, null, null], ok: [false, false, false], retry: [false, false, false] },
    quiz: { pick: [null, null, null], essay: '' },
    creative: '',
    t0: Date.now(),
  };

  /* ── 진단하기 3문항 (선행 개념) ─────────────────────── */
  const DIAG = [
    { q: '전류가 흐를 때, 도선 속에서 실제로 이동하는 것은 무엇일까요?',
      c: ['도선을 이루는 금속 원자 전체', '전하를 띤 알갱이(전자)', '도선을 감싼 플라스틱 껍질'], a: 1,
      scene: 'wire', cap: '도선 속에서 전하를 띤 알갱이가 줄지어 이동합니다.' },
    { q: '같은 종류의 전하 사이에는 어떤 힘이 작용할까요?',
      c: ['서로 끌어당긴다', '서로 밀어낸다', '아무 힘도 작용하지 않는다'], a: 1,
      scene: 'force', cap: '같은 종류의 전하는 서로 밀어냅니다(척력).' },
    { q: '발광 다이오드(LED)의 특징으로 알맞은 것은?',
      c: ['어느 방향으로 연결해도 똑같이 켜진다', '한쪽 방향으로 연결해야 전류가 흐른다', '전류가 없어도 스스로 빛난다'], a: 1,
      scene: 'led', cap: 'LED는 긴 다리가 + 쪽일 때만 전류가 흘러 빛납니다.' },
  ];

  /** 오답일 때 먼저 보여 주는 개념 장면 (정답은 알려 주지 않는다) */
  function conceptSVG(kind) {
    if (kind === 'wire') {
      return `<svg viewBox="0 0 460 110" style="width:100%;background:#f6f9fd;border:1px solid #dde5f0;border-radius:9px">
        <rect x="20" y="40" width="420" height="30" rx="6" fill="#dbe6f3" stroke="#b9cde6"/>
        ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${50 + i * 60}" cy="55" r="8" fill="#2f6fd6">
          <animate attributeName="cx" values="${50 + i * 60};${110 + i * 60}" dur="1.1s" repeatCount="indefinite"/></circle>
          <text x="${50 + i * 60}" y="59" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">−
          <animate attributeName="x" values="${50 + i * 60};${110 + i * 60}" dur="1.1s" repeatCount="indefinite"/></text>`).join('')}
        <text x="230" y="95" font-size="12" fill="#41566f" text-anchor="middle">전하를 띤 알갱이가 도선을 따라 이동합니다</text></svg>`;
    }
    if (kind === 'force') {
      return `<svg viewBox="0 0 460 110" style="width:100%;background:#f6f9fd;border:1px solid #dde5f0;border-radius:9px">
        <defs><marker id="fwAr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#d8434e"/></marker></defs>
        <circle cx="170" cy="52" r="20" fill="#d8434e"/><text x="170" y="59" font-size="20" fill="#fff" text-anchor="middle" font-weight="700">+</text>
        <circle cx="290" cy="52" r="20" fill="#d8434e"/><text x="290" y="59" font-size="20" fill="#fff" text-anchor="middle" font-weight="700">+</text>
        <line x1="150" y1="52" x2="90" y2="52" stroke="#d8434e" stroke-width="3" marker-end="url(#fwAr)"/>
        <line x1="310" y1="52" x2="370" y2="52" stroke="#d8434e" stroke-width="3" marker-end="url(#fwAr)"/>
        <text x="230" y="95" font-size="12" fill="#41566f" text-anchor="middle">같은 종류의 전하는 서로 밀어냅니다</text></svg>`;
    }
    return `<svg viewBox="0 0 460 110" style="width:100%;background:#f6f9fd;border:1px solid #dde5f0;border-radius:9px">
      <defs><radialGradient id="fwLed"><stop offset="0" stop-color="#fff8c9"/><stop offset="1" stop-color="#f5a623" stop-opacity="0"/></radialGradient></defs>
      <line x1="40" y1="50" x2="180" y2="50" stroke="#8899ad" stroke-width="4"/>
      <polygon points="180,32 180,68 214,50" fill="#d8434e"/><line x1="214" y1="30" x2="214" y2="70" stroke="#d8434e" stroke-width="4"/>
      <line x1="214" y1="50" x2="330" y2="50" stroke="#8899ad" stroke-width="4"/>
      <circle cx="330" cy="50" r="26" fill="url(#fwLed)"/><circle cx="330" cy="50" r="14" fill="#f5a623"/>
      <text x="120" y="38" font-size="11" fill="#2e9e5b" text-anchor="middle">이 방향 ○</text>
      <text x="272" y="90" font-size="11" fill="#d8434e" text-anchor="middle">반대 방향 ✕</text>
      <text x="382" y="54" font-size="12" fill="#41566f" text-anchor="middle">점등</text></svg>`;
  }

  /* ── 확인하기 (형성평가 3 선택 + 1 서술) ───────────── */
  const QUIZ = [
    { q: '축전기를 전지에 연결했을 때 일어나는 일로 알맞은 것은?',
      c: ['두 판 사이로 전하가 계속 통과한다', '한쪽 판에는 +, 다른 판에는 − 전하가 모인다', '전하가 판에서 사라진다'],
      a: 1, fb: '충전 실험 화면으로 돌아가 전하가 어디에 멈추어 쌓이는지 다시 관찰해 보세요.', exp: 'circuit' },
    { q: '충전된 축전기에 LED를 연결하면 불이 켜지는 까닭은?',
      c: ['LED가 스스로 빛을 만들어서', '축전기에 저장된 전하가 이동하면서 에너지를 공급해서', '도선이 뜨거워져서'],
      a: 1, fb: '방전을 슬로 모션으로 다시 보세요. 판에 있던 전하가 어디로 갔나요?', exp: 'circuit' },
    { q: '많은 전하를 저장하는 축전기를 만드는 방법으로 알맞은 것은?',
      c: ['판 간격을 넓히고 면적을 줄인다', '판 간격을 좁히고 면적을 넓힌다', '판을 하나만 사용한다'],
      a: 1, fb: '조립 미션에서 게이지가 2배가 되었을 때 무엇을 바꾸었는지 떠올려 보세요.', exp: 'struct' },
  ];
  const ESSAY_KEYS = [
    ['접촉 지점', /접촉|닿|누른|그 자리|그 지점|위치/],
    ['전하 변화', /전하|전자/],
    ['센서 감지', /감지|알아|인식|신호|찾/],
  ];

  /* ── 메뉴 ──────────────────────────────────────────── */
  const MENU = [
    { id: 'goal', label: '학습목표' },
    { id: 'diag', label: '진단하기' },
    { id: 'explore', label: '탐구하기', caret: true, sub: [
        { exp: 'circuit', label: '① 전하 창고를 채워라 — 충전과 방전' },
        { exp: 'struct', label: '② 분해해서 들여다보기 — 축전기의 구조' },
        { exp: 'devices', label: '③ 네 대의 기기를 수리하라 — 생활 속 축전기' }] },
    { id: 'check', label: '확인하기' },
    { id: 'wrap', label: '정리하기' },
    { id: 'creative', label: '창의적으로 생각하기' },
    { id: 'report', label: '보고서 양식 다운로드' },
    { id: 'restart', label: '실험 다시하기' },
  ];

  const diagDone = () => state.diag.pick.every((p, i) => p !== null && (state.diag.ok[i] || state.diag.retry[i]));
  const quizScore = () => QUIZ.filter((q, i) => state.quiz.pick[i] === q.a).length;

  function curExp() {
    const b = $('.top-tabs button.active');
    return b ? b.dataset.exp : 'circuit';
  }
  function switchExp(exp) {
    const b = $(`.top-tabs button[data-exp="${exp}"]`);
    if (b) b.click();
    paintNav();
  }

  /* ── 메뉴 바 렌더 ──────────────────────────────────── */
  function paintNav() {
    const nav = $('#flowNav');
    if (!nav) return;
    nav.innerHTML = MENU.map((m, i) => {
      const done = (m.id === 'diag' && diagDone()) ||
        (m.id === 'check' && state.quiz.pick.every((p) => p !== null)) ||
        (m.id === 'creative' && state.creative.trim().length >= 10);
      const on = m.id === 'explore';
      return `<button class="fn-item ${on ? 'on' : ''}" data-fn="${i}">
          ${m.label}${m.caret ? '<span class="fn-caret">▾</span>' : ''}${done ? '<span class="fn-done">✓</span>' : ''}
        </button>` +
        (m.sub ? `<div class="fn-dd" id="fnDd${i}">${m.sub.map((s, j) =>
          `<button class="fn-dd-item ${curExp() === s.exp ? 'on' : ''}" data-fn="${i}" data-sub="${j}">
             <span class="fn-num">${j + 1}</span>${s.label}</button>`).join('')}</div>` : '');
    }).join('');

    $$('#flowNav .fn-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const m = MENU[+el.dataset.fn];
        if (m.sub) {
          const dd = $('#fnDd' + el.dataset.fn);
          const wasOpen = dd.classList.contains('open');
          $$('.fn-dd').forEach((d) => d.classList.remove('open'));
          if (!wasOpen) dd.classList.add('open');
          e.stopPropagation();
          return;
        }
        $$('.fn-dd').forEach((d) => d.classList.remove('open'));
        if (m.id === 'report') { downloadReport(); return; }
        if (m.id === 'restart') { doRestart(); return; }
        openView(m.id);
      });
    });
    $$('#flowNav .fn-dd-item').forEach((el) => {
      el.addEventListener('click', () => {
        $$('.fn-dd').forEach((d) => d.classList.remove('open'));
        switchExp(MENU[+el.dataset.fn].sub[+el.dataset.sub].exp);
      });
    });
  }
  document.addEventListener('click', () => $$('.fn-dd').forEach((d) => d.classList.remove('open')));

  /* ── 모달 ──────────────────────────────────────────── */
  function openView(id) {
    const body = $('#flowBody');
    if (id === 'goal') body.innerHTML = renderGoal();
    else if (id === 'diag') { body.innerHTML = renderDiag(); bindDiag(); }
    else if (id === 'check') { body.innerHTML = renderCheck(); bindCheck(); }
    else if (id === 'wrap') body.innerHTML = renderWrap();
    else if (id === 'creative') { body.innerHTML = renderCreative(); bindCreative(); }
    $('#flowModal').classList.remove('hidden');
  }
  function closeView() { $('#flowModal').classList.add('hidden'); paintNav(); }

  /* ── 학습목표 ──────────────────────────────────────── */
  function renderGoal() {
    return (typeof LabContent !== 'undefined' && LabContent.goal) ? LabContent.goal
      : '<h2>학습목표</h2><p>준비 중입니다.</p>';
  }

  /* ── 진단하기 ──────────────────────────────────────── */
  function renderDiag() {
    const d = state.diag;
    const idx = d.pick.findIndex((v, i) => !(v !== null && (d.ok[i] || d.retry[i])));
    const cur = idx === -1 ? 3 : idx;

    let block;
    if (cur === 3) {
      const nOk = d.ok.filter(Boolean).length;
      block = `<div class="quiz-result o">
          진단을 마쳤습니다 — 맞힌 문항 <b>${nOk} / 3</b>.<br>
          ${nOk === 3 ? '선행 개념이 잘 잡혀 있어요. 바로 작업대로 가 봅시다.'
                      : '헷갈린 개념은 ① 충전과 방전 실험에서 직접 확인할 수 있습니다.'}
        </div>
        <div class="quiz-actions">
          <button class="primary" id="fdStart">탐구 시작하기 →</button>
          <button id="fdRetryAll">진단 다시 하기</button>
        </div>`;
    } else {
      const Q = DIAG[cur];
      const picked = d.pick[cur];
      const showScene = picked !== null && !d.ok[cur] && !d.retry[cur];
      block = `
        <p class="src">진단 ${cur + 1} / 3 · ${['전하 개념', '전기력', '다이오드'][cur]}</p>
        <h3 style="margin-top:6px">${Q.q}</h3>
        <div id="fdOpts">${Q.c.map((c, j) =>
          `<button class="quiz-opt ${picked === j ? (d.ok[cur] ? 'right' : 'wrong') : ''}" data-fd="${j}"
             ${picked !== null && (d.ok[cur] || d.retry[cur]) ? 'disabled' : ''}>${j + 1}. ${c}</button>`).join('')}</div>
        ${showScene ? `<div class="quiz-result x">정답을 바로 알려 주지 않을게요. 아래 장면을 먼저 보고
            <b>한 번 더</b> 골라 보세요.<span id="fdCd" style="font-weight:800"></span></div>${conceptSVG(Q.scene)}` : ''}
        ${d.ok[cur] ? `<div class="quiz-result o">맞았어요! ${Q.cap}</div>
          <div class="quiz-actions"><button class="primary" id="fdNext">다음 문항 →</button></div>` : ''}
        ${d.retry[cur] && !d.ok[cur] ? `<div class="quiz-result x">${Q.cap}<br>① 충전과 방전 실험에서 이 부분을 다시 확인해 봅시다.</div>
          <div class="quiz-actions"><button class="primary" id="fdNext">다음 문항 →</button></div>` : ''}`;
    }
    return `<h2>진단하기</h2>
      <p class="src">본 학습 전, 알고 있는 것을 확인합니다 — 틀려도 괜찮아요.</p>${block}`;
  }
  function bindDiag() {
    const d = state.diag;
    const idx = d.pick.findIndex((v, i) => !(v !== null && (d.ok[i] || d.retry[i])));
    const cur = idx === -1 ? 3 : idx;
    const st = $('#fdStart');
    if (st) st.onclick = () => { closeView(); switchExp('circuit'); };
    const ra = $('#fdRetryAll');
    if (ra) ra.onclick = () => {
      state.diag = { pick: [null, null, null], ok: [false, false, false], retry: [false, false, false] };
      openView('diag');
    };
    const nx = $('#fdNext');
    if (nx) nx.onclick = () => openView('diag');
    $$('#fdOpts [data-fd]').forEach((el) => {
      el.onclick = () => {
        const j = +el.dataset.fd, Q = DIAG[cur];
        if (d.pick[cur] !== null) {           // 재도전
          d.retry[cur] = true;
          d.ok[cur] = (j === Q.a);
          d.pick[cur] = j;
          openView('diag');
          return;
        }
        d.pick[cur] = j;
        d.ok[cur] = (j === Q.a);
        if (d.ok[cur]) d.retry[cur] = true;
        openView('diag');
        if (!d.ok[cur]) {                     // 오답 — 장면을 5초 본 뒤 재선택
          $$('#fdOpts [data-fd]').forEach((b) => b.setAttribute('disabled', ''));
          let s = 5;
          const cd = $('#fdCd');
          if (cd) cd.textContent = ' (5초 뒤 다시 선택할 수 있어요)';
          const t = setInterval(() => {
            s -= 1;
            const cd2 = $('#fdCd');
            if (cd2) cd2.textContent = s > 0 ? ` (${s}초 뒤 다시 선택할 수 있어요)` : '';
            if (s <= 0) {
              clearInterval(t);
              $$('#fdOpts [data-fd]').forEach((b) => b.removeAttribute('disabled'));
            }
          }, 1000);
        }
      };
    });
  }

  /* ── 확인하기 ──────────────────────────────────────── */
  function renderCheck() {
    const q = state.quiz;
    const hits = ESSAY_KEYS.map((k) => k[1].test(q.essay));
    return `<h2>확인하기</h2>
      <p class="src">형성평가 — 선택형 3문항 + 서술형 1문항. 오답이어도 정답을 바로 알려 주지 않습니다.</p>
      ${QUIZ.map((Q, i) => `
        <h3>${i + 1}. ${Q.q}</h3>
        <div>${Q.c.map((c, j) =>
          `<button class="quiz-opt ${q.pick[i] === j ? (j === Q.a ? 'right' : 'wrong') : ''}"
             data-fq="${i}" data-fj="${j}">${j + 1}. ${c}</button>`).join('')}</div>
        ${q.pick[i] !== null && q.pick[i] !== Q.a ? `<div class="quiz-result x">${Q.fb}
            <div class="quiz-actions" style="margin-top:8px">
              <button data-fgo="${Q.exp}">그 실험 화면으로 가기 →</button></div></div>` : ''}
        ${q.pick[i] === Q.a ? `<div class="quiz-result o">맞았어요.</div>` : ''}`).join('')}
      <h3>4. 전기 용량식 터치스크린이 손가락이 닿은 위치를 알아내는 과정을 ‘전하’라는 낱말을 사용하여 서술하시오.</h3>
      <textarea id="fqEssay" style="width:100%;min-height:90px;border:1px solid var(--line);border-radius:9px;
        padding:10px 12px;font-size:14px;font-family:inherit;resize:vertical"
        placeholder="예: 손가락이 화면에 닿으면 그 지점의 전하가 손가락 쪽으로 빠져나가 전하량이 줄어들고, 센서가 전하량이 변한 자리를 찾아 위치를 알아낸다.">${esc(q.essay)}</textarea>
      <p id="fqEssayFb" style="font-size:13px;margin-top:6px;color:#62718a"></p>
      <div class="quiz-result ${quizScore() === 3 ? 'o' : 'x'}" style="margin-top:10px">
        선택형 점수 <b>${quizScore()} / 3</b> · 서술형은 점수화하지 않고 핵심어만 확인합니다.</div>`;
  }
  function bindCheck() {
    $$('#flowBody [data-fq]').forEach((el) => {
      el.onclick = () => {
        state.quiz.pick[+el.dataset.fq] = +el.dataset.fj;
        openView('check');
      };
    });
    $$('#flowBody [data-fgo]').forEach((el) => {
      el.onclick = () => { closeView(); switchExp(el.dataset.fgo); };
    });
    const ta = $('#fqEssay');
    const fb = $('#fqEssayFb');
    const renderFb = () => {
      const hits = ESSAY_KEYS.map((k) => k[1].test(state.quiz.essay));
      fb.innerHTML = state.quiz.essay.length < 8 ? '' :
        '핵심어 확인 — ' + ESSAY_KEYS.map((k, i) =>
          `<b style="color:${hits[i] ? '#2f9e6b' : '#9aa7b8'}">${hits[i] ? '✓' : '○'} ${k[0]}</b>`).join(' · ') +
        (hits.every(Boolean) ? '<br>세 가지가 모두 들어 있어요. 잘 서술했습니다.'
          : '<br>빠진 것이 있다면 ③ 생활 속 축전기의 터치스크린 점검 장면을 다시 보고 덧붙여 볼까요? (통과/미통과를 표시하지 않습니다)');
    };
    if (ta) {
      ta.oninput = () => { state.quiz.essay = ta.value; renderFb(); };
      renderFb();
    }
  }

  /* ── 정리하기 ──────────────────────────────────────── */
  function renderWrap() {
    const sortOk = (typeof DeviceScene !== 'undefined') ? DeviceScene.sortScore() : 0;
    const round = (typeof StructScene !== 'undefined') ? StructScene.state.round : 1;
    const stage = (typeof StructScene !== 'undefined') ? StructScene.state.stage : 0;
    return `<h2>정리하기</h2>
      <p class="src">축전기 서비스 센터 — 오늘 배운 것 요약</p>
      <table>
        <tr><th style="width:50%">충전 · 방전 이용</th><th>충전된 전하량 변화 이용</th></tr>
        <tr><td><b>자동 심장 충격기</b> · <b>카메라 플래시</b></td><td><b>터치스크린</b> · <b>습도 센서</b></td></tr>
        <tr><td>전원 → 변환 회로 → 축전기에 전하를 모아 두었다가, 필요한 순간 <b>한 번에 방전</b>한다.</td>
            <td>환경(손가락 접촉·습도)이 바뀌면 <b>충전되는 전하의 양이 변하고</b>, 회로가 이 변화를 신호로 바꾼다.</td></tr>
      </table>
      <div class="eq" style="text-align:center">
        <b>충전 = 전하 모으기 · 방전 = 전하 내보내기</b><br>
        간격은 가깝게 · 면적은 넓게 · 돌돌 말아 부피는 작게
      </div>
      <h3>나의 탐구 현황</h3>
      <ul>
        <li>진단하기 — ${diagDone() ? `완료 (${state.diag.ok.filter(Boolean).length}/3 정답)` : '미실시'}</li>
        <li>② 분해 관찰 — ${stage + 1} / 5 단계 · 조립 라운드 ${Math.min(round, 3)}${round === 4 ? ' (모두 통과 🏅)' : ''}</li>
        <li>③ 원리 분류 게임 — ${sortOk} / 4 정답${sortOk === 4 ? ' (정식 엔지니어 인증서 🏅)' : ''}</li>
        <li>확인하기 — ${state.quiz.pick.every((p) => p !== null) ? `선택형 ${quizScore()}/3` : '미실시'}</li>
      </ul>
      <p style="margin-top:8px">아직 못 해 본 활동이 있다면 <b>탐구하기 ▾</b> 메뉴로 돌아가 이어서 해 보세요.
      마치면 <b>창의적으로 생각하기</b>와 <b>보고서 양식 다운로드</b>로 정리합니다.</p>`;
  }

  /* ── 창의적으로 생각하기 ───────────────────────────── */
  function renderCreative() {
    return `<h2>창의적으로 생각하기</h2>
      <p class="src">교과서 85쪽 창의 융합 활동 연계</p>
      <h3>알루미늄 포일과 종이만으로 나만의 축전기를 만든다면 어떻게 만들까요?<br>
          더 많은 전하를 저장하려면 무엇을 바꾸면 좋을까요?</h3>
      <textarea id="fcText" style="width:100%;min-height:130px;border:1px solid var(--line);border-radius:9px;
        padding:10px 12px;font-size:14px;font-family:inherit;resize:vertical"
        placeholder="예: 알루미늄 포일 두 장 사이에 얇은 종이 한 장을 끼우고 돌돌 말아서 만든다. 종이를 더 얇게 하면 간격이 좁아지고, 포일을 더 길게 하면 면적이 넓어져 더 많은 전하를 저장할 수 있다.">${esc(state.creative)}</textarea>
      <p style="font-size:13px;color:#62718a;margin-top:6px">쓴 내용은 «보고서 양식 다운로드»에 함께 담깁니다.</p>`;
  }
  function bindCreative() {
    const ta = $('#fcText');
    if (ta) ta.oninput = () => { state.creative = ta.value; };
  }

  /* ── 보고서 양식 다운로드 ──────────────────────────── */
  function downloadReport() {
    const C = (typeof CircuitScene !== 'undefined') ? CircuitScene : null;
    const S = (typeof StructScene !== 'undefined') ? StructScene : null;
    const D = (typeof DeviceScene !== 'undefined') ? DeviceScene : null;
    const mins = Math.max(1, Math.round((Date.now() - state.t0) / 60000));
    const row = (a, b) => `<tr><th>${a}</th><td>${esc(String(b ?? '')) || '—'}</td></tr>`;
    const DEV_NAME = { aed: '자동 심장 충격기', flash: '카메라 플래시', touch: '터치스크린', humid: '습도 센서' };
    const shelfName = { cd: '충전·방전 이용', qc: '전하량 변화 이용', 0: '미분류' };

    const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>축전기의 원리와 활용 — 활동 보고서</title><style>
body{font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;max-width:820px;margin:32px auto;padding:0 20px;color:#12233d;line-height:1.7}
h1{font-size:22px;border-bottom:3px solid #1a4fa0;padding-bottom:10px}
h2{font-size:17px;margin-top:28px;color:#1a4fa0;border-left:5px solid #1a4fa0;padding-left:9px}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:14px}
th,td{border:1px solid #c8d4e2;padding:8px 10px;text-align:left;vertical-align:top}
th{background:#eef4fb;width:200px;color:#1a4fa0}
.meta{font-size:13px;color:#5a6c82}
</style></head><body>
<h1>축전기의 원리와 활용 — 활동 보고서</h1>
<p class="meta">축전기 서비스 센터 · 지능형 과학실 ON · 작성일 ${new Date().toLocaleDateString('ko-KR')}<br>
학교 __________ 학년 ____ 반 ____ 이름 __________</p>
<table>${row('총 학습 시간', '약 ' + mins + '분')}</table>

<h2>진단하기 (선행 개념)</h2>
<table>${DIAG.map((Q, i) => row('진단 ' + (i + 1) + ' · ' + ['전하 개념', '전기력', '다이오드'][i],
      state.diag.pick[i] === null ? '미응답' : (state.diag.ok[i] ? '정답' : '오답 → 장면 확인 후 재도전'))).join('')}</table>

<h2>탐구하기 ① 충전과 방전 — 회로 관찰</h2>
<table>
${row('마지막 실험 조건', C ? `전압 ${C.state.volt}V · 용량 ${C.state.cap}μF · τ=RC=${C.tauChg().toFixed(1)}s` : '—')}
${row('판의 전하 기호', C ? C.chargeCount() + '개 (Q=CV에 비례)' : '—')}
${row('스위치 · LED', C ? `${{ chg: 'A 충전', open: '열림', dis: 'B 방전' }[C.state.sw]} · LED ${C.state.ledDir > 0 ? '정방향' : '거꾸로'}` : '—')}
</table>

<h2>탐구하기 ② 축전기의 구조 — 분해 · 조립</h2>
<table>
${row('분해 단계', S ? (S.state.stage + 1) + ' / 5' : '—')}
${row('조립 조건', S ? `간격 ${S.state.gapMm.toFixed(1)}mm · 면적 ${S.state.areaCm2}cm² · ${S.state.rolled ? '원통형으로 말기' : '평행판'}` : '—')}
${row('충전되는 전하량(상대값)', S ? S.chargeRel() + ' (기준 100)' : '—')}
${row('라운드 진행', S ? (S.state.round === 4 ? '3라운드 모두 통과 🏅' : '라운드 ' + S.state.round + ' 진행 중') : '—')}
</table>

<h2>탐구하기 ③ 생활 속 축전기 — 기기 점검 · 분류</h2>
<table>
${row('충전·방전 기기 사용', D ? D.state.shots + '회 방전' : '—')}
${row('터치스크린 입력', D ? (D.state.dialed || '입력 전') : '—')}
${row('습도 센서', D ? `습도 ${D.state.humid.toFixed(0)}% → 전하량 ${D.humidCharge()}(상대값)` : '—')}
</table>
<table><tr><th>기기</th><th>내가 놓은 선반</th><th>정오</th></tr>
${D ? ['aed', 'flash', 'touch', 'humid'].map((k) => {
      const p = D.state.sorted[k];
      return `<tr><td>${DEV_NAME[k]}</td><td>${shelfName[p] || '미분류'}</td>
        <td>${p ? (p === D.ANSWER[k] ? '○' : '✕') : '—'}</td></tr>`;
    }).join('') : ''}</table>
${D && D.sortScore() === 4 ? '<p><b>정식 엔지니어 인증서 획득 🏅</b></p>' : ''}

<h2>확인하기 (형성평가)</h2>
<table>${QUIZ.map((Q, i) => row('문항 ' + (i + 1),
      state.quiz.pick[i] === null ? '미응답' : (state.quiz.pick[i] === Q.a ? '정답' : '오답 → 실험 재확인 필요'))).join('')}
${row('서술형 (터치스크린 위치 감지)', state.quiz.essay)}</table>

<h2>창의적으로 생각하기</h2>
<table>${row('나만의 축전기 설계', state.creative)}</table>
</body></html>`;

    const blob = new Blob(['﻿' + html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `축전기_활동보고서_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof Lab !== 'undefined') Lab.showHint('활동 보고서를 내려받았습니다 — 인쇄에서 PDF로 저장할 수 있어요.', true);
  }

  /* ── 실험 다시하기 ─────────────────────────────────── */
  function doRestart() {
    const b = $('.sidebar button[data-action="restart"]');
    if (b) b.click();
    if (typeof Lab !== 'undefined') Lab.showHint('현재 실험을 처음 상태로 되돌렸습니다. 기록한 내용(진단·확인·창의)은 유지됩니다.', true);
  }

  /* ── 초기화 ────────────────────────────────────────── */
  function init() {
    const screen = $('.lab-screen');
    const header = $('.topbar');
    if (!screen || !header) return;
    const nav = document.createElement('nav');
    nav.className = 'flownav';
    nav.id = 'flowNav';
    header.insertAdjacentElement('afterend', nav);

    const modal = document.createElement('div');
    modal.className = 'modal hidden';
    modal.id = 'flowModal';
    modal.innerHTML = `<div class="modal-box">
        <button class="modal-close" id="flowClose">✕</button>
        <div id="flowBody"></div>
      </div>`;
    document.body.appendChild(modal);
    $('#flowClose').onclick = closeView;
    modal.addEventListener('click', (e) => { if (e.target.id === 'flowModal') closeView(); });

    // 실험 탭 전환 시 드롭다운 표시 동기화
    $$('.top-tabs button').forEach((b) => b.addEventListener('click', () => setTimeout(paintNav, 30)));

    paintNav();
  }

  return { init, openView, state, downloadReport };
})();

LabFlow.init();
