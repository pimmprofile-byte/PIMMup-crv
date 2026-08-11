
// ── 불 소리 전역 변수 — 최상단 선언 필수 (stopFireSound가 초기화 시점에 호출되므로) ──
let fireAudioCtx = null;
let fireSources  = [];
let fireMasterGain = null;

// ── NAVIGATION ──
const TOTAL = 17;
let cur = 0;
const track = document.getElementById('sliderTrack');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');

const SLIDES = [
  { label: 'COVER' },
  { label: 'PROLOGUE' },
  { label: 'SEQ.01' },
  { label: 'SEQ.02' },
  { label: 'SEQ.03' },
  { label: 'SEQ.04' },
  { label: 'SEQ.05' },
  { label: 'SEQ.06' },
  { label: 'SEQ.07' },
  { label: 'SEQ.08' },
  { label: 'SEQ.09' },
  { label: 'SEQ.10' },
  { label: 'SEQ.11' },
  { label: 'SEQ.12' },
  { label: 'SEQ.13' },
  { label: 'SEQ.14' },
  { label: 'EPI' },
];

// Build progress bar
const pb = document.getElementById('progressBar');
SLIDES.forEach((s, i) => {
  const item = document.createElement('div');
  item.className = 'prog-item';
  item.innerHTML = `<div class="prog-dot"></div><div class="prog-label">${s.label}</div>`;
  item.onclick = () => goTo(i);
  pb.appendChild(item);
});

// Build nav dots
const nd = document.getElementById('nd');
SLIDES.forEach((s, i) => {
  const d = document.createElement('div');
  d.className = 'ndot' + (i === 0 ? ' on' : '');
  d.title = s.label;
  d.onclick = () => goTo(i);
  nd.appendChild(d);
});

function goTo(n) {
  if (n < 0 || n >= TOTAL) return;
  const prev = document.getElementById('s' + cur);
  if (prev) prev.classList.remove('active-slide');
  cur = n;
  track.style.transform = `translateY(${-n * 1080}px)`;
  const tgt = document.getElementById('s' + n);
  if (tgt) tgt.classList.add('active-slide');
  btnPrev.classList.toggle('hidden', cur === 0);
  btnNext.classList.toggle('hidden', cur === TOTAL - 1);
  const pl = document.getElementById('prevSeqLabel');
  const nl = document.getElementById('nextSeqLabel');
  if (pl) pl.textContent = cur > 0 ? SLIDES[cur-1].label : '';
  if (nl) nl.textContent = cur < TOTAL-1 ? SLIDES[cur+1].label : '';
  document.querySelectorAll('.prog-item').forEach((item, i) => item.classList.toggle('active', i === cur));
  document.querySelectorAll('.ndot').forEach((d, i) => d.classList.toggle('on', i === cur));
  if (typeof onSlideChange === 'function') onSlideChange(n);
}

function navigate(dir) { goTo(cur + dir); }

document.addEventListener('keydown', e => {
  const _t = e.target;
  if (_t && (_t.tagName === 'INPUT' || _t.tagName === 'TEXTAREA' || _t.isContentEditable)) return;
  if (['ArrowDown','ArrowRight','PageDown'].includes(e.key)) { e.preventDefault(); navigate(1); }
  if (['ArrowUp','ArrowLeft','PageUp'].includes(e.key)) { e.preventDefault(); navigate(-1); }
});

let ty = 0;
document.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  const dy = ty - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
});

let wLock = false;
document.addEventListener('wheel', e => {
  if (wLock) return;
  if (Math.abs(e.deltaY) > 30) {
    navigate(e.deltaY > 0 ? 1 : -1);
    wLock = true;
    setTimeout(() => wLock = false, 700);
  }
}, { passive: true });

// Stage scaling — nav(48px)·progress(44px) 여백 확보 후 정렬
const stage = document.querySelector('.stage');
const NAV_H = 48, PROG_H = 44;
function fit() {
  const availH = window.innerHeight - NAV_H - PROG_H;
  const s = Math.min(window.innerWidth / 1920, availH / 1080);
  const tx = Math.round((window.innerWidth - 1920 * s) / 2);
  const ty = NAV_H + Math.round((availH - 1080 * s) / 2);
  stage.style.transform = `translate(${tx}px,${ty}px) scale(${s}) translateZ(0)`;
  stage.style.transformOrigin = 'top left';
}
window.addEventListener('resize', fit, { passive: true });
window.addEventListener('load', fit);
fit();
goTo(0);

// ── SEQ.01 INTERACTIVE TOKEN DRAG ──
let tokDragging = false, tokActivated = false;
let tokOffX = 0, tokOffY = 0;

function getStageScale() {
  const t = document.querySelector('.stage')?.style.transform || '';
  const m = t.match(/scale\(([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}

function initTokenDrag() {
  tokActivated = false; tokDragging = false;
  const disc = document.getElementById('tokDragDisc');
  if (disc) {
    disc.style.cssText = 'left:22%;top:50%;transform:translate(-50%,-50%);transition:none;cursor:grab;';
    disc.classList.remove('tok-activated');
  }
  const sensorReal = document.getElementById('tokSensorReal');
  if (sensorReal) sensorReal.style.boxShadow = '';
  const sceneImg = document.querySelector('.tok-scene-img');
  if (sceneImg) { sceneImg.src = 'IMG_B64[211803]'; sceneImg.style.transition = 'none'; sceneImg.style.opacity = '0.80'; sceneImg.style.filter = ''; }
  const hint = document.getElementById('tokDragHint');
  if (hint) hint.style.opacity = '1';
  const warmBg = document.getElementById('tokWarmBg');
  if (warmBg) warmBg.classList.remove('on');
  const overlay = document.getElementById('tokCodeOverlay');
  if (overlay) overlay.classList.remove('show');
  const reveal = document.getElementById('tokRevealBlock');
  if (reveal) reveal.style.opacity = '0';
}

document.addEventListener('mousedown', e => {
  const disc = document.getElementById('tokDragDisc');
  if (!disc || tokActivated || cur !== 2) return;
  if (!disc.contains(e.target)) return;
  tokDragging = true;
  const scale = getStageScale();
  const rect = disc.getBoundingClientRect();
  tokOffX = (e.clientX - rect.left) / scale;
  tokOffY = (e.clientY - rect.top) / scale;
  disc.style.transition = 'none';
  disc.style.cursor = 'grabbing';
  disc.style.transform = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!tokDragging || tokActivated) return;
  const disc = document.getElementById('tokDragDisc');
  const scene = document.getElementById('seq01Scene');
  if (!disc || !scene) return;
  const scale = getStageScale();
  const sr = scene.getBoundingClientRect();
  const nx = (e.clientX - sr.left) / scale - tokOffX;
  const ny = (e.clientY - sr.top) / scale - tokOffY;
  disc.style.left = nx + 'px';
  disc.style.top = ny + 'px';
  // proximity check — 이미지 위 실제 센서 원
  const sensor = document.getElementById('tokSensorReal');
  if (!sensor) return;
  const senR = sensor.getBoundingClientRect();
  const sCX = (senR.left + senR.width / 2 - sr.left) / scale;
  const sCY = (senR.top + senR.height / 2 - sr.top) / scale;
  const dCX = nx + disc.offsetWidth / 2;
  const dCY = ny + disc.offsetHeight / 2;
  if (Math.hypot(dCX - sCX, dCY - sCY) < 80) {
    activateToken(sCX, sCY);
  }
});

document.addEventListener('mouseup', () => {
  tokDragging = false;
  const disc = document.getElementById('tokDragDisc');
  if (disc && !tokActivated) disc.style.cursor = 'grab';
});

function activateToken(sCX, sCY) {
  if (tokActivated) return;
  tokActivated = true; tokDragging = false;
  const disc = document.getElementById('tokDragDisc');
  if (disc) {
    disc.style.transition = 'left .28s ease, top .28s ease';
    disc.style.left = (sCX - disc.offsetWidth / 2) + 'px';
    disc.style.top  = (sCY - disc.offsetHeight / 2) + 'px';
    setTimeout(() => disc.classList.add('tok-activated'), 290);
  }
  const warmBg = document.getElementById('tokWarmBg');
  const sensorReal = document.getElementById('tokSensorReal');
  const hint = document.getElementById('tokDragHint');
  setTimeout(() => { if (warmBg) warmBg.classList.add('on'); }, 220);
  setTimeout(() => { if (sensorReal) sensorReal.style.boxShadow = '0 0 0 6px rgba(255,210,80,0.35),0 0 40px rgba(255,180,40,0.6)'; }, 220);
  if (hint) hint.style.opacity = '0';
  playDing();
  // 이미지 교체: 불켜진 버전으로 페이드 스왑
  setTimeout(() => {
    const sceneImg = document.querySelector('.tok-scene-img');
    if (sceneImg) {
      sceneImg.style.transition = 'opacity 0.5s ease';
      sceneImg.style.opacity = '0';
      setTimeout(() => {
        sceneImg.src = 'IMG_B64[221459]';
        sceneImg.style.opacity = '0.85';
      }, 380);
    }
  }, 500);
  // 1945 코드 오버레이 표시 — 이미지 교체 후
  setTimeout(() => {
    const overlay = document.getElementById('tokCodeOverlay');
    if (overlay) overlay.classList.add('show');
  }, 1200);
  // 오른쪽 패널 reveal
  setTimeout(() => {
    const reveal = document.getElementById('tokRevealBlock');
    if (reveal) reveal.style.opacity = '1';
  }, 1400);
}

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = ctx.createGain();
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);
    [1047, 1319].forEach((freq, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine'; o.frequency.value = freq;
      o.connect(g);
      o.start(ctx.currentTime + i * 0.06);
      o.stop(ctx.currentTime + 1.6);
    });
  } catch(e) {}
}

// ── SEQ.02 TOGGLE INTERACTIVE ──
// 정답 시퀀스: 위(up) 아래(dn) 위(up) 위(up) 아래(dn) 아래(dn)
const SEQ02_ANSWER = ['up','dn','up','up','dn','dn'];
let seq02Unlocked = false;

function toggleSwitch(el, idx) {
  if (seq02Unlocked) return;
  if (el.classList.contains('up')) {
    el.classList.replace('up','dn');
  } else if (el.classList.contains('dn')) {
    el.classList.replace('dn','up');
  } else {
    el.classList.add('up'); // 중립 → 위로
  }
  // 현재 상태 확인 — neutral(미설정)은 'dn'으로 간주하지 않음
  const toggles = document.querySelectorAll('#seq02Toggles .toggle');
  const current = Array.from(toggles).map(t =>
    t.classList.contains('up') ? 'up' : t.classList.contains('dn') ? 'dn' : 'neutral'
  );
  if (current.includes('neutral')) return; // 아직 모든 스위치가 조정되지 않음
  const matched = SEQ02_ANSWER.every((v,i) => v === current[i]);
  if (matched) {
    seq02Unlocked = true;
    // 모니터 화면 전환
    const qLine = document.getElementById('seq02QLine');
    const enter = document.getElementById('seq02Enter');
    const title = document.getElementById('seq02MonTitle');
    setTimeout(() => {
      if (qLine) qLine.style.display = 'none';
      if (title) { title.textContent = '입장 코드 확인'; title.style.color = 'var(--accent)'; }
      if (enter) enter.classList.add('show');
    }, 300);
  }
}

function resetSeq02() {
  seq02Unlocked = false;
  const qLine = document.getElementById('seq02QLine');
  const enter = document.getElementById('seq02Enter');
  const title = document.getElementById('seq02MonTitle');
  if (qLine) qLine.style.display = '';
  if (title) { title.textContent = '탐험가 체크인'; title.style.color = ''; }
  if (enter) enter.classList.remove('show');
  // 초기 상태 복원 — 전부 중립(회색)
  const toggles = document.querySelectorAll('#seq02Toggles .toggle');
  toggles.forEach(t => t.classList.remove('up','dn'));
  const _inp = document.getElementById('seq02CodeInput');
  if (_inp) { _inp.value = ''; }
  const _wrap = document.getElementById('seq02CodeInputWrap');
  if (_wrap) { _wrap.classList.remove('done'); }
}

// ── Q3 INTERACTIVE FORM (SEQ.03) ──
const q3Answered = [false, false, false];
// 3: 설문 응답 저장 (관찰일지 개인화용)
let q3Responses = [null, null, null];

function q3Select(el, qid) {
  const siblings = el.parentElement.querySelectorAll('.q3-opt');
  siblings.forEach(s => s.classList.remove('sel'));
  el.classList.add('sel');
  const inp = document.getElementById('q3in' + qid);
  if (inp) inp.value = '';
  q3Answered[qid] = true;
  // 3: 설문 응답 저장 (객관식)
  if (typeof q3Responses !== 'undefined') {
    q3Responses[qid] = { type: 'choice', value: (el.textContent || '').trim() };
  }
  q3CheckSubmit();
}

function q3TextInput(qid) {
  const inp = document.getElementById('q3in' + qid);
  if (!inp) return;
  if (inp.value.trim().length > 0) {
    const row = inp.closest('.q3-row');
    if (row) row.querySelectorAll('.q3-opt').forEach(o => o.classList.remove('sel'));
    q3Answered[qid] = true;
    if (typeof q3Responses !== 'undefined') {
      q3Responses[qid] = { type: 'text', value: inp.value.trim() };
    }
  } else {
    const row = inp.closest('.q3-row');
    const hasSel = row && row.querySelector('.q3-opt.sel');
    q3Answered[qid] = !!hasSel;
    if (typeof q3Responses !== 'undefined' && !hasSel) {
      q3Responses[qid] = null;
    }
  }
  q3CheckSubmit();
}

function q3CheckSubmit() {
  const btn = document.getElementById('q3SubmitBtn');
  if (!btn) return;
  const allDone = q3Answered.every(v => v);
  btn.classList.toggle('active', allDone);
}

function q3Submit() {
  const btn = document.getElementById('q3SubmitBtn');
  if (!btn || !btn.classList.contains('active')) return;
  const popup = document.getElementById('q3Popup');
  if (popup) popup.classList.add('show');
}

function resetQ3() {
  q3Answered.fill(false);
  if (typeof q3Responses !== 'undefined') q3Responses = [null, null, null];
  const btn = document.getElementById('q3SubmitBtn');
  if (btn) btn.classList.remove('active');
  const popup = document.getElementById('q3Popup');
  if (popup) popup.classList.remove('show');
  document.querySelectorAll('.q3-opt.sel').forEach(o => o.classList.remove('sel'));
  document.querySelectorAll('.q3-input').forEach(i => { if(i) i.value = ''; });
}

// ── SEQ.04 패턴 자물쇠 ──
const PLOCK_ANSWER = new Set([1,3,7,8]);
const plockPressed = new Set();
let plockSolved = false;

function plockPress(n) {
  if (plockSolved) return;
  const btn = document.getElementById('pb' + n);
  if (!btn) return;
  if (plockPressed.has(n)) {
    plockPressed.delete(n);
    btn.classList.remove('pressed');
  } else {
    plockPressed.add(n);
    btn.classList.add('pressed');
  }
  // 상태 텍스트
  const status = document.getElementById('plockStatus');
  if (status) {
    if (plockPressed.size === 0) {
      status.textContent = '선택: 없음';
    } else {
      status.textContent = '선택: ' + Array.from(plockPressed).sort().join(', ');
    }
  }
  // 정답 체크 — 4개 선택 시
  if (plockPressed.size === 4) {
    // 정답: 1,3,7,8 (탐사라이트, 나뭇잎조각, 탐사돋보기, 탐험가증표)
    const correct = PLOCK_ANSWER.size === plockPressed.size &&
                    [...PLOCK_ANSWER].every(v => plockPressed.has(v));
    if (correct) {
      plockSolved = true;
      if (status) { status.textContent = '✓ UNLOCKED'; status.style.color = 'var(--accent)'; }
      // 자물쇠 열리는 애니메이션
      setTimeout(() => {
        const shackle = document.getElementById('plockShackle');
        if (shackle) shackle.classList.add('open');
        playDing();
      }, 300);
      // 나뭇잎 퍼즐로 전환 — 뒤 레이어 완전히 숨기고 퍼즐 표시
      setTimeout(() => {
        const puzzleView = document.getElementById('seq04PuzzleView');
        if (puzzleView) {
          puzzleView.style.display = 'flex';
          puzzleView.classList.add('show');
        }
        // 배경 레이어 완전 제거 (희미하게 비치는 현상 방지)
        const lockView   = document.getElementById('seq04LockView');
        const laptopView = document.getElementById('seq04LaptopView');
        const bgImg      = document.querySelector('#seq04Stage .mac-bg-img');
        const bgOv       = document.querySelector('#seq04Stage .mac-bg-overlay');
        if (lockView)   { lockView.style.opacity='0'; lockView.style.visibility='hidden'; }
        if (laptopView) { laptopView.style.opacity='0'; laptopView.style.visibility='hidden'; }
        if (bgImg)      bgImg.style.opacity='0';
        if (bgOv)       bgOv.style.opacity='0';
      }, 1300);
    } else {
      // 오답 — 잠깐 빨간 표시 후 초기화
      if (status) { status.textContent = '✗ INCORRECT'; status.style.color = '#FF6655'; }
      setTimeout(() => {
        plockPressed.clear();
        document.querySelectorAll('.plock-btn').forEach(b => b.classList.remove('pressed'));
        if (status) { status.textContent = '선택: 없음'; status.style.color = ''; }
      }, 800);
    }
  }
}

function initSeq04() {
  plockPressed.clear();
  plockSolved = false;
  document.querySelectorAll('.plock-btn').forEach(b => b.classList.remove('pressed'));
  const status = document.getElementById('plockStatus');
  if (status) { status.textContent = '선택: 없음'; status.style.color = ''; }
  const shackle = document.getElementById('plockShackle');
  if (shackle) shackle.classList.remove('open');
  const puzzleView = document.getElementById('seq04PuzzleView');
  if (puzzleView) { puzzleView.classList.remove('show'); puzzleView.style.display = ''; }
  // lock view / laptop view — 인라인 스타일 완전 초기화 (이전 퍼즐-열림 상태 복원)
  const lockView   = document.getElementById('seq04LockView');
  const laptopView = document.getElementById('seq04LaptopView');
  const bgImg      = document.querySelector('#seq04Stage .mac-bg-img');
  const bgOv       = document.querySelector('#seq04Stage .mac-bg-overlay');
  if (lockView)   { lockView.style.opacity = ''; lockView.style.visibility = ''; lockView.style.pointerEvents = 'auto'; }
  if (laptopView) { laptopView.style.opacity = ''; laptopView.style.visibility = ''; laptopView.style.pointerEvents = ''; }
  if (bgImg)      bgImg.style.opacity = '';
  if (bgOv)       bgOv.style.opacity = '';
  // 2초 후 슬라이드 전환
  const stage = document.getElementById('seq04Stage');
  if (stage) stage.classList.remove('shifted');
  setTimeout(() => {
    if (stage) stage.classList.add('shifted');
  }, 2000);
  // 퍼즐 리셋
  puzReset();
}

// ── SEQ.04 나뭇잎 퍼즐 드래그 ──
const puzSlotMap = { 'ginkgo': 1, 'maple': 2, 'oak': 3 };
const puzFilled = {};
let puzDragToken = null;

function puzDragStart(e) {
  puzDragToken = e.target;
  e.dataTransfer.effectAllowed = 'move';
}

function initPuzzleDrop() {
  document.querySelectorAll('.puzzle-slot').forEach(slot => {
    slot.addEventListener('dragover', e => {
      e.preventDefault();
      slot.classList.add('hover-active');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('hover-active'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('hover-active');
      if (!puzDragToken) return;
      const leaf = puzDragToken.dataset.leaf;
      const targetSlot = parseInt(slot.dataset.slot);
      const correctSlot = puzSlotMap[leaf];
      if (targetSlot === correctSlot) {
        // 정답 위치
        slot.innerHTML = puzDragToken.innerHTML;
        slot.classList.add('glow');
        puzDragToken.classList.add('placed');
        puzFilled[leaf] = true;
        puzDragToken = null;
        // 완성 체크
        if (Object.keys(puzFilled).length === 3) {
          // 모든 슬롯 glow
          document.querySelectorAll('.puzzle-slot').forEach(s => s.classList.add('glow'));
          playDing();
          // 퍼즐 완성 → 다음 씬으로 이동
          setTimeout(() => navigate(1), 2200);
        }
      } else {
        puzDragToken = null;
      }
    });
  });
}

function puzReset() {
  Object.keys(puzFilled).forEach(k => delete puzFilled[k]);
  puzDragToken = null;
  // 슬롯 1,2,3 비우기 (슬롯 0 솔방울은 유지)
  [1,2,3].forEach(i => {
    const s = document.getElementById('ps' + i);
    if (!s) return;
    s.classList.remove('glow','hover-active');
    s.innerHTML = '';
  });
  // 토큰 복원
  document.querySelectorAll('.puzzle-token').forEach(t => t.classList.remove('placed'));
}

// ── SEQ.05 모니터 애니메이션 + 드래그 ──
let seq05Phase = 1;
let seq05DragActive = false;

function initSeq05() {
  seq05Phase = 2;
  seq05DragActive = false;
  // 배경 리셋 — 어두운 통나무로
  const bg = document.getElementById('seq05Bg');
  if (bg) {
    bg.style.transition = 'none';
    bg.src = 'IMG_B64[195303]';
    bg.style.opacity = '.78';
    bg.style.filter = 'brightness(.62) saturate(.65)';
  }
  // 돋보기 위치 리셋
  const loupeTok = document.getElementById('seq05LoupeTok');
  if (loupeTok) {
    loupeTok.style.left = '10%';
    loupeTok.style.top = '65%';
    loupeTok.style.transform = 'translateY(-50%)';
    loupeTok.style.cursor = 'grab';
  }
  // 가이드 버튼 및 팝업 리셋
  const guide = document.getElementById('seq05ConfirmGuide');
  if (guide) guide.classList.remove('show');
  const popup = document.getElementById('seq05ItemPopup');
  if (popup) popup.classList.remove('show');
  // 힌트 메시지 복원
  const phase2Msg = document.getElementById('tvPhase2Msg');
  if (phase2Msg) phase2Msg.style.display = '';
  // 드래그 초기화
  setTimeout(initSeq05Drag, 80);
}

function initSeq05Drag() {
  const loupeTok = document.getElementById('seq05LoupeTok');
  const stumpHole = document.getElementById('seq05StumpHole');
  if (!loupeTok || !stumpHole) return;

  let dragging = false;
  let offX = 0, offY = 0;

  loupeTok.addEventListener('mousedown', e => {
    dragging = true;
    const scale = getStageScale();
    const rect = loupeTok.getBoundingClientRect();
    offX = (e.clientX - rect.left) / scale;
    offY = (e.clientY - rect.top) / scale;
    loupeTok.style.transition = 'none';
    loupeTok.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', eMv => {
    if (!dragging || seq05Phase !== 2) return;
    const scene = document.getElementById('seq05Sp');
    if (!scene) return;
    const scale = getStageScale();
    const sr = scene.getBoundingClientRect();
    const nx = (eMv.clientX - sr.left) / scale - offX;
    const ny = (eMv.clientY - sr.top) / scale - offY;
    loupeTok.style.left = nx + 'px';
    loupeTok.style.top = ny + 'px';
    loupeTok.style.transform = 'none';
    // 근접 체크
    const stumpRect = stumpHole.getBoundingClientRect();
    const lrRect = loupeTok.getBoundingClientRect();
    const dx = (lrRect.left + lrRect.width/2) - (stumpRect.left + stumpRect.width/2);
    const dy = (lrRect.top + lrRect.height/2) - (stumpRect.top + stumpRect.height/2);
    if (Math.hypot(dx, dy) < 60 * scale) {
      activateSeq05();
    }
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
    if (loupeTok) loupeTok.style.cursor = 'grab';
  });
}

function activateSeq05() {
  if (seq05Phase !== 2) return;
  seq05Phase = 3;
  // 배경 이미지를 밝은 통나무로 교체
  const bg = document.getElementById('seq05Bg');
  if (bg) {
    bg.style.transition = 'opacity 0.8s ease';
    bg.style.opacity = '0';
    setTimeout(() => {
      bg.src = 'IMG_B64[215927]';
      bg.style.filter = 'brightness(.85) saturate(1.0)';
      bg.style.opacity = '.82';
    }, 500);
  }
  const loupeTok = document.getElementById('seq05LoupeTok');
  if (loupeTok) loupeTok.style.cursor = 'default';
  // 돋보기 힌트 메시지 숨김
  const phase2Msg = document.getElementById('tvPhase2Msg');
  if (phase2Msg) phase2Msg.style.display = 'none';
  playDing();
  // 확인 가이드 버튼 표시 (1.5초 후)
  setTimeout(() => {
    const guide = document.getElementById('seq05ConfirmGuide');
    if (guide) guide.classList.add('show');
  }, 1500);
}

function seq05ShowItemPopup() {
  const popup = document.getElementById('seq05ItemPopup');
  if (popup) popup.classList.add('show');
}

function seq05CloseItemPopup() {
  const popup = document.getElementById('seq05ItemPopup');
  if (popup) popup.classList.remove('show');
}

// ── SEQ.09 CCTV 줌 인터랙션 ──
let seq09ZoomLevel = 0;
const SEQ09_SCALES = [1, 1.3, 1.6, 1.9];

// 돋보기 상수
const MAG_LENS_R  = 90;       // 180px 렌즈의 절반
const MAG_FACTOR  = 2.6;      // 최대 줌(1.9) 대비 추가 확대 배율
const WRAP_W      = 1920;     // seq09-cctv-wrap CSS 레이아웃 너비
const WRAP_H      = 988;      // sb-img 높이 (1080-48-44)
const ZOOM_OX     = 0.42;     // transform-origin x
const ZOOM_OY     = 0.72;     // transform-origin y
const SOL_PCT_L   = 0.403;    // Sol 이미지 left (메인+렌즈 동일)
const SOL_PCT_T   = 0.638;    // Sol 이미지 top

let seq09MagX = WRAP_W * 0.38;
let seq09MagY = WRAP_H * 0.64;
let seq09MagDragging = false;
let seq09MagOffX = 0, seq09MagOffY = 0;

function seq09MagUpdatePos(cx, cy) {
  // 드래그 범위: 보이는 영역(좌 48%) 내로 제한
  cx = Math.max(MAG_LENS_R, Math.min(WRAP_W * 0.48 - MAG_LENS_R, cx));
  cy = Math.max(MAG_LENS_R, Math.min(WRAP_H - MAG_LENS_R, cy));
  seq09MagX = cx;
  seq09MagY = cy;

  const mag = document.getElementById('seq09Magnifier');
  if (mag) {
    mag.style.left = cx + 'px';
    mag.style.top  = cy + 'px';
    mag.style.transform = 'translate(-50%,-50%)';
  }

  // 렌즈 내부 콘텐츠 위치 계산
  const S = SEQ09_SCALES[3];              // 현재 줌 배율 1.9
  const T = S * MAG_FACTOR;              // 전체 확대 배율 (≈4.94)
  const ox = WRAP_W * ZOOM_OX;
  const oy = WRAP_H * ZOOM_OY;

  // 렌즈 중앙 아래에 있는 실제 이미지 좌표
  const img_x = ox + (cx - ox) / S;
  const img_y = oy + (cy - oy) / S;

  const inner = document.getElementById('seq09MagInner');
  if (inner) {
    // translate(tx, ty) scale(T) 적용 — (img_x,img_y) → 렌즈 중앙(MAG_LENS_R)
    const tx = MAG_LENS_R - img_x * T;
    const ty = MAG_LENS_R - img_y * T;
    inner.style.transformOrigin = '0 0';
    inner.style.transform = `translate(${tx}px,${ty}px) scale(${T})`;
  }
}

function seq09InitMagnifier() {
  const mag = document.getElementById('seq09Magnifier');
  if (!mag) return;

  mag.addEventListener('mousedown', e => {
    seq09MagDragging = true;
    const sc = getStageScale();
    const r  = mag.getBoundingClientRect();
    seq09MagOffX = (e.clientX - r.left  - r.width  / 2) / sc;
    seq09MagOffY = (e.clientY - r.top   - r.height / 2) / sc;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!seq09MagDragging) return;
    const sc   = getStageScale();
    const wrap = document.querySelector('.seq09-cctv-wrap');
    if (!wrap) return;
    const wr = wrap.getBoundingClientRect();
    const cx = (e.clientX - wr.left) / sc - seq09MagOffX;
    const cy = (e.clientY - wr.top)  / sc - seq09MagOffY;
    seq09MagUpdatePos(cx, cy);
  });
  document.addEventListener('mouseup', () => { seq09MagDragging = false; });
}

function initSeq09() {
  seq09ZoomLevel = 0;
  const zStage = document.getElementById('seq09ZoomStage');
  if (zStage) zStage.style.transform = 'scale(1)';
  const sol = document.getElementById('seq09Sol');
  if (sol) sol.classList.remove('show');
  const btn = document.getElementById('seq09ZoomBtn');
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<span class="seq09-zoom-icon">⊕</span><span class="seq09-zoom-label">ZOOM</span>';
  }
  // 돋보기 + 가이드 리셋
  const mag = document.getElementById('seq09Magnifier');
  if (mag) mag.classList.remove('show');
  const magSol = document.getElementById('seq09MagSol');
  if (magSol) magSol.classList.remove('show');
  const guide = document.getElementById('seq09MagGuide');
  if (guide) guide.classList.remove('show');
  seq09MagX = WRAP_W * 0.38;
  seq09MagY = WRAP_H * 0.64;
}

function seq09ZoomIn() {
  if (seq09ZoomLevel >= 3) return;
  seq09ZoomLevel++;
  const zStage = document.getElementById('seq09ZoomStage');
  if (zStage) zStage.style.transform = `scale(${SEQ09_SCALES[seq09ZoomLevel]})`;
  if (seq09ZoomLevel === 3) {
    // ×1.9 줌 — 솔이 페이드인 + 돋보기 등장
    setTimeout(() => {
      const sol = document.getElementById('seq09Sol');
      if (sol) sol.classList.add('show');
      seq09MagUpdatePos(seq09MagX, seq09MagY);
      const mag = document.getElementById('seq09Magnifier');
      if (mag) mag.classList.add('show');
      const magSol = document.getElementById('seq09MagSol');
      if (magSol) magSol.classList.add('show');
      const guide = document.getElementById('seq09MagGuide');
      if (guide) guide.classList.add('show');
    }, 800);
    const btn = document.getElementById('seq09ZoomBtn');
    if (btn) btn.disabled = true;
  }
}

// ── SEQ11 불 소리 (Web Audio API 합성) ──

function makeBrownNoiseBuf(ctx, sec) {
  const sr = ctx.sampleRate;
  const len = sr * sec;
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

function makeCrackleBuf(ctx, sec) {
  const sr = ctx.sampleRate;
  const len = sr * sec;
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    d[i] = Math.random() < 0.0018 ? (Math.random() * 2 - 1) * 1.0 : 0;
  }
  return buf;
}

function startFireSound() {
  stopFireSound();
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    fireAudioCtx = new AC();
    const ctx = fireAudioCtx;

    // AudioContext suspended 대응 — resume() 명시 호출
    ctx.resume();

    // 마스터 게인 (페이드인/아웃용)
    fireMasterGain = ctx.createGain();
    fireMasterGain.gain.setValueAtTime(0, ctx.currentTime);
    fireMasterGain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);
    fireMasterGain.connect(ctx.destination);

    const loopSec = 5;

    // ── 베이스: 낮은 웅웅 불꽃음 ──
    const baseSrc = ctx.createBufferSource();
    baseSrc.buffer = makeBrownNoiseBuf(ctx, loopSec);
    baseSrc.loop = true;
    const baseLp = ctx.createBiquadFilter();
    baseLp.type = 'lowpass';
    baseLp.frequency.value = 380;
    baseLp.Q.value = 0.7;
    const baseGain = ctx.createGain();
    baseGain.gain.value = 0.42;
    baseSrc.connect(baseLp);
    baseLp.connect(baseGain);
    baseGain.connect(fireMasterGain);
    baseSrc.start();
    fireSources.push(baseSrc);

    // ── 미드: 불꽃이 타오르는 허쉬 노이즈 ──
    const midSrc = ctx.createBufferSource();
    midSrc.buffer = makeBrownNoiseBuf(ctx, loopSec);
    midSrc.loop = true;
    midSrc.playbackRate.value = 1.6;
    const midBp = ctx.createBiquadFilter();
    midBp.type = 'bandpass';
    midBp.frequency.value = 800;
    midBp.Q.value = 1.4;
    const midGain = ctx.createGain();
    midGain.gain.value = 0.22;
    midSrc.connect(midBp);
    midBp.connect(midGain);
    midGain.connect(fireMasterGain);
    midSrc.start();
    fireSources.push(midSrc);

    // ── 크래클: 화르륵 탁탁 ──
    const crackSrc = ctx.createBufferSource();
    crackSrc.buffer = makeCrackleBuf(ctx, loopSec);
    crackSrc.loop = true;
    const crackHp = ctx.createBiquadFilter();
    crackHp.type = 'highpass';
    crackHp.frequency.value = 1600;
    const crackGain = ctx.createGain();
    crackGain.gain.value = 0.65;
    crackSrc.connect(crackHp);
    crackHp.connect(crackGain);
    crackGain.connect(fireMasterGain);
    crackSrc.start();
    fireSources.push(crackSrc);

    // ── LFO: 불꽃 흔들림 ──
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.7 + Math.random() * 0.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(fireMasterGain.gain);
    lfo.start();
    fireSources.push(lfo);

  } catch(e) { console.warn('Fire sound error:', e); }
}

function stopFireSound() {
  // 글로벌 참조를 즉시 캡처하고 클리어 — 새 startFireSound() 호출과 충돌 방지
  const ctxToClose  = fireAudioCtx;
  const gainToFade  = fireMasterGain;
  const srcsToStop  = fireSources.slice();
  fireAudioCtx  = null;
  fireMasterGain = null;
  fireSources   = [];

  if (gainToFade && ctxToClose) {
    try { gainToFade.gain.linearRampToValueAtTime(0, ctxToClose.currentTime + 0.5); } catch(e) {}
  }
  setTimeout(() => {
    srcsToStop.forEach(s => { try { s.stop(); } catch(e){} });
    if (ctxToClose) { try { ctxToClose.close(); } catch(e) {} }
  }, 600);
}

// ── SLIDE CHANGE SIDE EFFECTS ──
function onSlideChange(n) {
  if (n === 2) setTimeout(initTokenDrag, 80);
  if (n === 3) setTimeout(resetSeq02, 80);
  if (n === 4) setTimeout(resetQ3, 80);
  if (n === 8) setTimeout(function(){ if (typeof renderSolNotes === 'function') renderSolNotes(); }, 80);
  if (n === 16) setTimeout(function(){ if (typeof initEpilogue === 'function') initEpilogue(); }, 80);
  if (n === 5) setTimeout(initSeq04, 80);
  if (n === 6) setTimeout(initSeq05, 80);
  if (n === 10) setTimeout(initSeq09, 80);
  if (n === 11) setTimeout(resetChat, 80);
  if (n === 14) { if (typeof seq13Reset === 'function') setTimeout(seq13Reset, 80); }
  // SEQ11 불 소리 — 슬라이드 진입 시 시작, 이탈 시 정지
  if (n === 12) setTimeout(startFireSound, 400);
  else stopFireSound();
  // 커버 배경 extender — 첫 페이지에서만 활성화
  const ext = document.getElementById('coverBgExt');
  if (ext) ext.classList.toggle('on', n === 0);
}

// 퍼즐 드롭 초기화 + 돋보기 이벤트 등록 — DOM 로드 후
document.addEventListener('DOMContentLoaded', () => {
  initPuzzleDrop();
  seq09InitMagnifier();
});

// ── SOL CHAT ENGINE ──
const SOL_INIT = "... 안녕.\n무섭지 않아. 이제는.";

const SOL_KEYWORDS = [

  // ── 인사 ──
  {
    keys: ['안녕','hi','hello','반가워','반갑'],
    msg: [
      "... 안녕.\n무섭지 않아. 이제는.\n잘 왔어.",
      "왔어?\n기다렸어. 조금.",
      "안녕.\n오늘 숲이 너희 오는 거 알았어. 냄새로 먼저 알아채.",
      "... 어.\n말 거는 인간 처음이야. 진짜로."
    ]
  },

  // ── 정체 / 누구 ──
  {
    keys: ['누구야','누구니','넌 누구','너 누구','who are','정체','뭐야 너'],
    msg: [
      "나는 솔의 정령이야.\n이 숲에서 아주 오래 살았어.\n이름은 솔이야. 소나무에서 왔어.",
      "솔이야. 숲 정령.\n근데 정령이라고 해도 딱히 대단한 건 아니야.\n그냥 — 오래 있었어. 여기.",
      "나? 나는 — 이 숲 거야.\n나무들 사이에서 자랐어.\n이름은 솔."
    ]
  },

  // ── 왜 무서워 ──
  {
    keys: ['왜 무서워','왜 무섭','인간을 왜','무서워하는 이유','겁나는 이유'],
    msg: [
      "우리 아빠가 인간은 불을 몰고 온댔어.\n자연을 헤쳐.\n아빠 말이 다 거짓말은 아닌 것 같았어.\n... 근데. 너희는 달라.",
      "옛날에 숲 가장자리까지 불이 왔어.\n사람들 목소리가 들렸어. 그때.\n그게 — 오래 남았어.",
      "숨으면 괜찮을 줄 알았어. 계속.\n근데 오늘 — 숨지 않아도 됐어. 처음으로."
    ]
  },

  // ── 수류탄 / 쇠솔방울 ──
  {
    keys: ['수류탄','쇠솔방울','쇠 솔방울'],
    msg: [
      "... 알고 있어?\n처음에 나는 그게 솔방울인 줄 알았어. 비슷하게 생겼잖아.\n아빠가 진짜 이름을 가르쳐줬을 때 — 많이 이상한 기분이었어.\n그 이름으로는 다시 부르고 싶지 않아.",
      "솔방울이랑 비슷하게 생겼는데 달라.\n차가워. 솔방울은 따뜻한데.\n닮은 척하는 게 제일 무서워.",
      "왜 그걸 솔방울처럼 만들었는지 모르겠어.\n솔방울은 씨앗 품는 거야.\n그건 — 다른 거잖아."
    ]
  },

  // ── 아빠 ──
  {
    keys: ['아빠','아버지'],
    msg: [
      "아빠는 숲이 불타는 걸 봤어. 직접.\n그래서 나한테 인간 피하라고 했어.\n아빠 말이 다 틀린 건 아니야.\n근데 — 너희는 달랐어.",
      "아빠는 많이 알아. 숲에 대해서.\n근데 — 인간에 대해서는 나보다 덜 아는 것 같아. 이제는.",
      "아빠한테 오늘 일은 비밀이야.\n화낼 것 같아서.\n근데 후회는 안 해.",
      "아빠가 처음 가르쳐준 말이 '조심해'였어.\n두 번째가 '숨어'였어.\n'안녕'은 — 내가 혼자 배웠어."
    ]
  },

  // ── 씨앗 / 심다 ──
  {
    keys: ['씨앗','화분','심었','심어','씨 심'],
    msg: [
      "봤어. 조심스럽게 넣었잖아.\n씨앗이 어디에 있어야 하는지 아는 것 같아서 — 좋았어.",
      "씨앗 심는 거 좋아.\n땅이 씨앗 받아줄 때 소리 나거든.\n아주 작은 소리.\n들었어?",
      "그 씨앗 — 싹 날 거야.\n내가 볼게. 잘 크나.",
      "씨앗은 기다릴 줄 알아.\n인간들은 잘 못하는 것 같던데.\n너희는 — 좀 달랐어."
    ]
  },

  // ── 솔방울 ──
  {
    keys: ['솔방울'],
    msg: [
      "솔방울은 씨앗 집이야.\n열리면 씨앗이 바람 타고 날아가.\n그게 좋아. 혼자 멀리 가는 거.",
      "솔방울 냄새 맡아봤어?\n솔 냄새가 나거든. 당연한 것 같지만 — 처음 맡으면 좋아."
    ]
  },

  // ── 돋보기 ──
  {
    keys: ['돋보기','루페','loupe'],
    msg: [
      "그거 통나무 구멍에 대봤잖아.\n내가 숨겨뒀던 거.\n찾을 줄 알았어. 왠지.",
      "돋보기로 보면 작은 게 커지잖아.\n숲에 작은 것들이 많은데 — 그냥 지나치는 인간 많아.\n너희는 봤잖아."
    ]
  },

  // ── 통나무 ──
  {
    keys: ['통나무','나무 구멍','나무구멍'],
    msg: [
      "... 봤어?\n숨겨놨는데 찾았구나.\n무서워서 숨긴 거야. 발자국 들킬까봐.",
      "그 통나무 — 오래된 거야.\n속이 비어 있어서 처음에 슬펐는데.\n비어 있으니까 뭘 넣을 수 있더라."
    ]
  },

  // ── 발자국 ──
  {
    keys: ['발자국','UV','자외선','형광'],
    msg: [
      "발자국 남기는 거 조심해야 하는데 — 가끔 잊어버려.\n급하면 그냥 뛰거든.\n들킬까봐 무서웠어.",
      "자외선 등으로 보면 보이잖아.\n나는 몰랐어 그게 보이는지.\n이제는 더 조심해야겠다.",
      "뛰어다니면 남아. 발자국이.\n그거 지우고 싶었는데 — 어떻게 지우는지 몰랐어."
    ]
  },

  // ── 배터리 ──
  {
    keys: ['배터리','전지'],
    msg: [
      "그거 아빠가 모아둔 거야.\n쓰는 법은 모르는데 — 중요한 것 같아서 숨겨뒀어.",
      "배터리가 뭐 하는 건지는 알아.\n힘을 저장하는 거잖아.\n씨앗이랑 비슷한 것 같아. 나는.",
      "찾았구나.\n잘 써줘. 아빠 거야."
    ]
  },

  // ── 불 / 연기 / 산불 ──
  {
    keys: ['불','연기','담배','산불','화재'],
    msg: [
      "... 알아.\n그거 너희가 한 게 아니잖아.\n알고 있어.\n근데 — 무서웠어. 또 무서웠어.",
      "불은 — 빨라.\n숲보다 빨라.\n한 번 보면 잊을 수 없어.",
      "담배 냄새가 바람 타고 왔어.\n그거 맡으면 도망가게 돼.\n몸이 먼저 기억해.",
      "불 나고 나서 숲이 조용해져.\n새도 없고 벌레도 없고.\n그 조용함이 — 제일 무서웠어."
    ]
  },

  // ── 무서워 ──
  {
    keys: ['무서워','무섭다','두렵','두려워','겁나'],
    msg: [
      "나도 무서웠어. 아직도 조금.\n근데 무서운 거랑 안 만나는 건 다른 것 같아.\n오늘 알았어.",
      "... 무서운 거 당연해.\n처음인 거 앞에서는 다 무서워. 나도.",
      "무서울 때 — 나는 작아지려고 해.\n근데 작아져도 없어지는 건 아니더라."
    ]
  },

  // ── 인간 / 사람 ──
  {
    keys: ['인간','사람','인류','human'],
    msg: [
      "인간이 다 똑같은 줄 알았어.\n아빠가 보여준 것 때문에.\n근데 보면 볼수록 — 다 달라.\n너희는 좀 다른 인간인 것 같아.",
      "인간은 — 빠르게 뭔가를 해.\n숲은 천천히 하는데.\n다른 것 같았는데 — 오늘 보니 비슷한 부분도 있어.",
      "인간 목소리가 처음에 컸어. 나한테.\n근데 지금은 — 좀 괜찮아. 너희 목소리는."
    ]
  },

  // ── 숲 / 자연 ──
  {
    keys: ['숲','자연','숲속','forest'],
    msg: [
      "숲은 기억이 많아.\n불 맞은 나무 옆에 새로 자란 나무도 있어.\n둘이 같이 있어. 그게 숲이야.",
      "숲이 말해.\n소리로는 아니야.\n냄새랑 온도랑 빛으로 말해.\n들을 줄 아는 사람한테만.",
      "숲은 나 혼자 있는 게 아니야.\n다 같이 있는 거야. 그냥.\n근데 외롭기도 해. 가끔."
    ]
  },

  // ── 나무 / 소나무 ──
  {
    keys: ['나무','소나무','나뭇잎','pine'],
    msg: [
      "나무는 느려.\n하지만 기억은 오래 해.\n나이테에 다 들어 있어. 다.",
      "소나무 냄새 — 좋지?\n나는 그 냄새가 나라서 기분이 이상해. 좋은 이상함.",
      "나뭇잎 — 다 다르게 생겼어.\n같은 나무에서 나와도.\n신기하지 않아?"
    ]
  },

  // ── 이름 ──
  {
    keys: ['이름이 뭐','이름','솔이라고','네 이름'],
    msg: [
      "솔이야. 소나무 정령.\n이름 불러준 인간 처음이야.\n좀 이상해. 좋게 이상한 거야.",
      "솔.\n짧지? 솔방울에서 왔어. 이름도.\n아빠가 지어줬어.",
      "솔이야.\n말할 때마다 솔방울 냄새 나는 것 같아.\n기분 탓인가."
    ]
  },

  // ── 외로워 / 혼자 ──
  {
    keys: ['외로워','외롭','혼자','쓸쓸','lonely'],
    msg: [
      "숲에 나무는 많은데 — 말하는 애는 없어.\n나무는 말을 해도 빨리 해서 내가 못 따라가.\n그래서 조금 — 혼자야.",
      "혼자 있어도 괜찮은 줄 알았어.\n근데 오늘 너희랑 얘기하고 나니까 — 달라.",
      "... 숲이 있으니까 혼자는 아니야.\n근데 — 대화는 또 달라."
    ]
  },

  // ── 숨다 / 숨었어 ──
  {
    keys: ['숨어','숨었','숨기','숨었구나','어디 있었'],
    msg: [
      "나뭇잎 사이에 있었어.\n거기서 보면 다 보이거든.\n나는 안 보이고.",
      "숨는 게 — 익숙해.\n아빠가 가르쳐준 거야. 첫 번째로.",
      "숨었어. 항상.\n근데 오늘은 — 안 숨어도 됐어."
    ]
  },

  // ── 나뭇잎 퍼즐 ──
  {
    keys: ['나뭇잎','퍼즐','퍼즐판','은행잎','단풍잎','떡갈잎'],
    msg: [
      "나뭇잎은 다 다르게 생겼는데 — 퍼즐에 딱 맞는 자리가 있어.\n신기하잖아.",
      "은행잎은 노랗고 단풍잎은 빨갛고 떡갈잎은 초록이야.\n다 같은 숲 애들인데.",
      "퍼즐 맞출 때 — 솔방울 자리는 내가 먼저 놓은 거야.\n알아챘어?"
    ]
  },

  // ── 카라반 ──
  {
    keys: ['카라반','집','방','여기','이곳'],
    msg: [
      "저 안에 들어가 본 적은 없어.\n창문으로만 봤어.\n따뜻해 보였어.",
      "카라반 — 숲 안에 있는 게 좀 신기했어.\n인간 것이 여기 있는 게.\n근데 이제는 — 괜찮아.",
      "여기서 살아?\n숲 안에서 사는 인간 처음 봐."
    ]
  },

  // ── 탐사 도구 / 탐사 키트 ──
  {
    keys: ['탐사','탐험','키트','망원경','나침반','탐사 노트','노트'],
    msg: [
      "탐사 키트 — 다 챙겼어?\n빠진 거 없어야 해. 숲은 준비된 사람한테 더 많이 보여줘.",
      "망원경으로 멀리 봤어?\n숲 안에서 멀리 보면 — 더 많은 게 있어. 가까이에.",
      "탐사 노트에 뭐 적었어?\n숲 일은 적어두면 좋아. 나중에 기억 안 날 수도 있으니까."
    ]
  },

  // ── 번역기 / 숲의 언어 ──
  {
    keys: ['번역기','숲의 언어','채널','언어','말이 통해'],
    msg: [
      "숲의 번역기야.\n이거 없으면 나 말 못 알아들었을걸.",
      "번역기 — 아빠도 몰라.\n내가 찾은 거야. 혼자서.\n이걸로 너희랑 말하고 싶었어.",
      "숲 말이랑 인간 말이 달라.\n번역기가 중간에서 바꿔줘.\n나는 솔 말로 하고 있어. 지금."
    ]
  },

  // ── 비 / 물 ──
  {
    keys: ['비','물','비 오','빗소리','rain','water'],
    msg: [
      "비 오면 숲이 커져.\n냄새도 커지고 소리도 커져.\n좋아.",
      "빗소리 들으면 잠와.\n좋은 잠.\n나무들도 그럴 것 같아.",
      "비 맞는 거 좋아.\n젖는 게 싫지 않아."
    ]
  },

  // ── 별 / 달 / 밤 ──
  {
    keys: ['별','달','밤','하늘','star','moon','night'],
    msg: [
      "밤에 숲이 달라.\n소리가 다르고 냄새가 다르고.\n나는 밤이 더 좋아. 조용하니까.",
      "별 많이 보여?\n숲 안에서 보면 나뭇가지 사이로 보여.\n점처럼.",
      "달빛 있으면 숲 색이 바뀌어.\n초록이 은색 비슷하게 돼.\n예뻐."
    ]
  },

  // ── 소리 / 음악 ──
  {
    keys: ['소리','음악','노래','들려','들어봐','listen'],
    msg: [
      "숲 소리 들어봐.\n바람이 나뭇잎 건드리는 소리.\n다 다르거든. 나무마다.",
      "새 소리가 제일 멀리 가.\n아침에 제일 커.\n나는 그때 일어나.",
      "... 지금 뭔가 들려?\n숲이 말하는 거야. 아마."
    ]
  },

  // ── 계절 ──
  {
    keys: ['봄','여름','가을','겨울','계절','spring','summer','autumn','winter'],
    msg: [
      "가을이 좋아.\n나뭇잎 색이 바뀌거든.\n솔방울도 떨어지고.",
      "겨울에 조용해.\n눈 오면 더 조용해.\n나는 그때 많이 생각해.",
      "봄에 새싹 나오는 거 봐?\n나는 매번 놀라.\n매번 처음 같아서."
    ]
  },

  // ── 친구 / 같이 ──
  {
    keys: ['친구','같이','함께','우리','together','friend'],
    msg: [
      "친구 — 인간 친구는 처음이야.\n나무 친구는 있는데.\n나무는 말이 없어서 — 좀 달라.",
      "같이 있어도 돼.\n갑자기 도망 안 가.\n... 오늘은.",
      "우리 — 좀 이상한 조합이지?\n정령이랑 인간이랑.\n근데 나쁘진 않아."
    ]
  },

  // ── 귀엽다 / 예쁘다 / 좋아 ──
  {
    keys: ['귀여워','귀엽다','예쁘','이뻐','좋아 보여','멋있'],
    msg: [
      "... 그런 말 처음 들어봐.\n이상해. 나쁘게 이상한 건 아니야.",
      "귀엽다고?\n나무들은 그런 말 안 해.\n나무는 그냥 있어.",
      "... 그래?\n잘 모르겠어 그게 어떤 건지.\n근데 — 기분 나쁘지 않아."
    ]
  },

  // ── 뭐해 / 어디있어 ──
  {
    keys: ['뭐해','어디 있','어디야','지금 어디','뭐 하고'],
    msg: [
      "나뭇잎 사이에 있어.\n거기가 제일 편해.",
      "... 보고 있었어.\n여기 계속 있었거든.",
      "바람 타고 있었어.\n그냥 — 떠 있어."
    ]
  },

  // ── 먹어 / 배고파 ──
  {
    keys: ['먹어','배고파','밥','음식','eat','hungry'],
    msg: [
      "나는 — 빛이랑 물로 살아.\n음식은 잘 몰라.\n너희 먹는 거 신기해.",
      "배고프다는 게 뭔 느낌이야?\n나는 햇빛 없으면 조금 힘드는데.\n그게 배고픈 거랑 비슷해?",
      "... 나는 광합성 해.\n인간이랑 달라."
    ]
  },

  // ── 자 / 잠 ──
  {
    keys: ['자','잠','졸려','sleep','자고 싶','잘 거야'],
    msg: [
      "숲은 자는 게 다 달라.\n겨울에 긴 잠 자는 나무도 있고.\n나는 — 가끔 나뭇가지에서 자.",
      "졸려?\n숲 냄새 맡으면 잘 잘 수 있어.",
      "... 잘 자.\n숲이 지켜볼게."
    ]
  },

  // ── 사랑 ──
  {
    keys: ['사랑','좋아해','좋아요','love'],
    msg: [
      "... 그 말 — 무거워.\n인간 말 중에 제일 무거운 것 같아.",
      "나는 숲이 좋아.\n씨앗이 좋고 비가 좋고 — 오늘은 너희도 좋아.",
      "좋아 — 솔직하게 말하는 거 어렵지 않아?\n나는 어려워. 근데 오늘은 — 괜찮아."
    ]
  },

  // ── 슬퍼 / 힘들어 ──
  {
    keys: ['슬퍼','힘들어','힘들다','슬프다','sad','힘든'],
    msg: [
      "... 숲도 힘들 때 있어.\n근데 숲은 티를 잘 안 내.\n비가 오면 조금 티 내.",
      "슬픈 거 — 참지 않아도 돼.\n나무들도 잎 떨굴 때 그런 거라고 생각해.",
      "힘들어도 — 여기 있어.\n숲은 안 가."
    ]
  },

  // ── 재밌어 / 신기해 ──
  {
    keys: ['재밌어','재미있','신기해','신기하다','wow','놀라워','대박'],
    msg: [
      "... 나도 신기해.\n이게 이렇게 될 줄 몰랐어.",
      "재밌어?\n나는 오늘 많이 재밌었어. 처음으로.",
      "그렇지?\n숲이 원래 신기한 곳이야."
    ]
  },

  // ── 기억 / 기억해 ──
  {
    keys: ['기억','기억해','기억나','remember'],
    msg: [
      "나는 기억 잘 해.\n오래 살아서 그런지 — 다 기억해.\n좋은 것도 무서운 것도.",
      "오늘 기억할게.\n오래.",
      "숲이 기억하는 방법 — 나이테야.\n나는 — 그냥 안 잊어."
    ]
  },

  // ── 바람 ──
  {
    keys: ['바람','wind','바람 불','바람이'],
    msg: [
      "바람 타면 멀리 갈 수 있어.\n씨앗도 나도.",
      "바람이 숲 냄새 멀리 보내.\n너희도 느꼈어? 카라반 오기 전에?",
      "바람 있으면 나뭇잎 다 같이 움직여.\n따로인데 같이 움직여. 신기하지."
    ]
  },

  // ── 새 / 동물 / 곤충 ──
  {
    keys: ['새','동물','벌레','곤충','bird','animal','나비','개미'],
    msg: [
      "새들은 — 인간보다 솔직해.\n위험하면 바로 날아가.\n숨기는 게 없어.",
      "벌레들은 작아도 다 바빠.\n아무도 쉬는 것 같지 않아.\n나는 가끔 쉬어.",
      "나비 봤어?\n꽃 찾아다니는 거 — 좋아서 하는 건지 일해서 하는 건지 모르겠어.\n나는 좋아서 하는 거라고 생각해."
    ]
  },

  // ── 광섬유 / 빛의 줄기 / 연결 ──
  {
    keys: ['광섬유','빛의 줄기','연결','케이블','빛줄기','심장','숲의 심장'],
    msg: [
      "빛이 연결되면 — 숲이 느껴.\n심장이 뛰는 것처럼.\n아빠가 만든 거야.",
      "그 빛들 — 아빠가 오래전에 놓은 거야.\n숲 안에 빛 통로 같은 거.\n끊어졌었는데 — 너희가 이었어.",
      "연결되면 달라.\n숲 전체가 아는 것 같아.\n따뜻해져."
    ]
  },

  // ── 탐사 라이트 ──
  {
    keys: ['탐사 라이트','라이트','불빛','손전등','flashlight'],
    msg: [
      "빛이 있으면 숨을 데가 없어.\n처음엔 싫었어.\n근데 — 이제는 괜찮아.",
      "탐사 라이트로 나 찾으려고 했어?\n조금 무서웠는데 — 조금 기대됐어."
    ]
  },

  // ── 숲 소방차 / 불 끄다 ──
  {
    keys: ['소방차','불 끄','진압','구했어','지켰어','파수꾼'],
    msg: [
      "... 고마워.\n숲이 고마워하고 있어.\n내가 대신 말하는 거야.",
      "불 끄는 거 — 생각보다 어렵지?\n숲을 지키려면 용기 있어야 해.\n너희는 있었어.",
      "파수꾼 — 그 말 좋아.\n숲 지키는 사람. 아빠가 하던 말이야."
    ]
  },

  // ── 솔 / 이름 ──
  {
    keys: ['이름','솔이','솔이야','네 이름','your name'],
    msg: [
      "솔이야. 소나무 정령.\n이름 불러준 인간 처음이야.\n좀 이상해. 좋게 이상한 거야.",
      "솔.\n짧지? 솔방울에서 왔어. 이름도.\n아빠가 지어줬어.",
      "솔이야.\n말할 때마다 솔방울 냄새 나는 것 같아.\n기분 탓인가."
    ]
  },

  // ── 숲의 소리 타이틀 ──
  {
    keys: ['초록의 소리','숲의 소리','숲 소리'],
    msg: [
      "초록의 소리 — 알아?\n숲이 내는 소리야.\n사람 귀에는 잘 안 들려.\n근데 오늘 — 들렸을 것 같아.",
      "초록의 소리는 늘 있어.\n조용할 때도. 시끄러울 때도.\n듣는 법을 알면 달라."
    ]
  },

  // ── 고마워 ──
  {
    keys: ['고마워','감사','고맙','thanks','thank you'],
    msg: [
      "... 나도.\n나도 고마워.\n말로 하는 거 어색한데. 진짜야.",
      "고마워 — 처음 들어봤어. 인간한테서.\n이상하게 오래 남아. 그 말.",
      "... 응.\n나도 고마워.\n오늘 — 오길 잘했어."
    ]
  },

  // ── 비밀 ──
  {
    keys: ['비밀','secret','알려줘','말해줘','말해'],
    msg: [
      "비밀 있어.\n근데 — 다 말하면 비밀이 아니잖아.",
      "아빠한테 비밀 많아.\n오늘 일도 비밀이야.\n... 이미 말해버렸나.",
      "숲에 비밀 장소 있어.\n아직 아무도 몰라. 나도 잘 안 가."
    ]
  },

  // ── 태어났어 / 나이 / 얼마나 살았어 ──
  {
    keys: ['태어났','언제 났','몇 살','나이','얼마나 살','생일','born','age'],
    msg: [
      "전쟁 이후에 태어났다고 들었어.\n전쟁이 뭔지는 — 잘 몰라.\n아빠가 말 안 해줘.\n근데 그 뒤에 태어났대.",
      "... 오래됐어. 얼마나인지 모르겠어.\n나무 나이처럼 세는 건데 — 잘 안 세게 됐어.",
      "아빠한테 물어봤어. 언제 태어났냐고.\n'전쟁이 끝나고'라고 했어.\n전쟁이 뭐냐고 했더니 — 대답 안 했어."
    ]
  },

  // ── 전쟁 ──
  {
    keys: ['전쟁','war','싸움','군인','폭탄','포탄','6.25','한국전쟁'],
    msg: [
      "전쟁 — 그 말은 알아.\n아빠한테서 들었어.\n근데 뭔지는 몰라.\n'인간들이 서로 불을 던진 거'라고만 했어.",
      "전쟁이 있고 나서 — 숲이 달라졌대.\n아빠가 그랬어.\n조용해졌다고.\n좋은 조용함이 아니라고.",
      "전쟁은 — 아빠가 알아.\n나는 그다음에 태어났어.\n그래서 몰라.\n근데 아빠 목소리가 달라져. 그 얘기 할 때."
    ]
  },

  // ── 왜 인간이 무서워 (전쟁 맥락) ──
  {
    keys: ['왜 피해야','왜 숨어야','인간이 왜 위험','아빠가 왜 그래'],
    msg: [
      "아빠가 봤대. 전쟁을.\n숲이 타는 걸.\n나무들이 쓰러지는 걸.\n그래서 — 피하라고 했어. 나한테.",
      "아빠는 인간이 불을 가지고 온댔어.\n일부러든 아니든.\n결과는 같다고.\n근데 — 오늘 너희는 달랐어.",
      "무서운 거 배운 게 아니야.\n아빠한테서 들은 거야.\n근데 들은 거랑 직접 보는 건 다른 것 같아.\n오늘 알았어."
    ]
  },

  // ── 왜 (일반) ──
  {
    keys: ['왜','why','이유가'],
    msg: [
      "... 왜?\n나도 가끔 그 질문 해.\n숲한테. 대답은 천천히 와.",
      "왜인지 모를 때가 많아.\n근데 모르는 채로 있어도 괜찮아.\n숲이 가르쳐줬어."
    ]
  },

  // ── 언제 ──
  {
    keys: ['언제','when','다음에 언제','또 올'],
    msg: [
      "언제든지 와도 돼.\n숲은 항상 여기 있어.\n나도.",
      "다음에 오면 — 더 일찍 나올게. 아마.\n숨는 시간이 줄어들었어. 조금."
    ]
  },

  // ── 작별 ──
  {
    keys: ['잘가','잘 가','안녕히','다음에 봐','또 올게','끝낼','bye','가야겠','가볼게'],
    msg: [
      "... 잘 가.\n다음에 또 와도 돼.\n그때는 더 일찍 나올게.\n\n... 아마도.\n아빠한테는 비밀이야.",
      "잘 가.\n오늘 너희가 와줘서 — 좋았어.\n조금 더 일찍 나올 걸 그랬다.\n\n다음엔 그럴게.",
      "... 음.\n진짜 가? 알았어.\n숲한테 너희 얘기 해줄게. 잘 했다고.\n\n잘 자, 인간."
    ],
    farewell: true
  }

];

const SOL_DEFAULT = [
  "... 음. 잘 모르겠어. 근데 들었어.",
  "그게 뭔 말인지 잘 모르겠어.\n인간 말은 가끔 어려워.",
  "... 계속 얘기해줘. 나는 좋아.",
  "음. 그건 — 처음 들어보는 거야. 신기해.",
  "... 잠깐.\n숲한테 물어볼게.\n숲도 잘 모를 것 같지만.",
  "그 말이 — 나한테는 새로운 말이야.\n천천히 생각해볼게.",
  "... 어.\n그런 말도 있구나.",
  "모르겠어. 솔직히.\n근데 듣는 건 괜찮아.",
  "인간 말은 많다.\n숲 말은 적은데 — 오래 가는데.\n둘 다 좋아.",
  "... 그거 — 중요한 거야?\n나는 잘 모르는 것 같아. 미안."
];

let chatActive = false;
let chatOver = false;
let defaultIdx = 0;
let solTyping = false;

function activateChat() {
  if (chatActive) return;
  chatActive = true;
  const btn = document.getElementById('activateChat');
  const dot = document.getElementById('chatDot');
  const status = document.getElementById('chatStatus');
  const waiting = document.getElementById('chatWaiting');
  btn.style.display = 'none';
  dot.classList.add('live');
  status.textContent = '연결 중...';
  setTimeout(() => {
    waiting.style.display = 'none';
    status.textContent = '연결됨 · LIVE';
    status.style.color = 'var(--accent)';
    addSolMsg(SOL_INIT, false);
    setTimeout(() => enableInput(), SOL_INIT.length * 28 + 900);
  }, 700);
}

function enableInput() {
  if (chatOver) return;
  document.getElementById('chatInput').disabled = false;
  document.getElementById('chatSendBtn').disabled = false;
  document.getElementById('chatInput').focus();
}

function disableInput() {
  document.getElementById('chatInput').disabled = true;
  document.getElementById('chatSendBtn').disabled = true;
}

function addSolMsg(text, enableAfter = true) {
  const msgs = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'cmsg sol typing';
  el.innerHTML = '<div class="cmsg-who">SOL · 솔</div><div class="cmsg-bubble"></div>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  const bubble = el.querySelector('.cmsg-bubble');
  const chars = text.split('');
  let i = 0;
  solTyping = true;
  const timer = setInterval(() => {
    if (i < chars.length) {
      bubble.textContent += chars[i++];
      msgs.scrollTop = msgs.scrollHeight;
    } else {
      clearInterval(timer);
      el.classList.remove('typing');
      solTyping = false;
      if (enableAfter) enableInput();
    }
  }, 26);
}

function addPlayerMsg(text) {
  const msgs = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'cmsg player';
  el.innerHTML = `<div class="cmsg-who">PLAYER</div><div class="cmsg-bubble">${text}</div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function showSolThinking() {
  const msgs = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'cmsg sol sol-thinking';
  el.id = 'solThinkingEl';
  el.innerHTML = '<div class="cmsg-who sol-translating">솔의 언어 번역 중</div><div class="cmsg-bubble"><span class="sol-dot"></span><span class="sol-dot"></span><span class="sol-dot"></span></div>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

function hideSolThinking() {
  const el = document.getElementById('solThinkingEl');
  if (el) el.remove();
}

function sendMessage() {
  if (chatOver || !chatActive || solTyping) return;
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  addPlayerMsg(text);
  input.value = '';
  disableInput();
  const lower = text.toLowerCase();
  let response = null;
  let isFarewell = false;
  for (const kw of SOL_KEYWORDS) {
    if (kw.keys.some(k => lower.includes(k))) {
      response = Array.isArray(kw.msg)
        ? kw.msg[Math.floor(Math.random() * kw.msg.length)]
        : kw.msg;
      if (kw.farewell) isFarewell = true;
      break;
    }
  }
  if (!response) {
    response = SOL_DEFAULT[defaultIdx % SOL_DEFAULT.length];
    defaultIdx++;
  }
  // 솔이 입력 중 표시 → 딜레이 → 실제 응답
  showSolThinking();
  const delay = 900 + Math.random() * 700;
  setTimeout(() => {
    hideSolThinking();
    addSolMsg(response, !isFarewell);
    if (isFarewell) {
      setTimeout(() => endChat(), response.length * 26 + 1200);
    }
  }, delay);
}

function resetChat() {
  chatActive = false;
  chatOver = false;
  defaultIdx = 0;
  solTyping = false;
  const btn = document.getElementById('activateChat');
  const dot = document.getElementById('chatDot');
  const status = document.getElementById('chatStatus');
  const waiting = document.getElementById('chatWaiting');
  const msgs = document.getElementById('chatMessages');
  if (btn) btn.style.display = '';
  if (dot) dot.classList.remove('live');
  if (status) { status.textContent = '씨앗을 심으면 솔이가 옵니다'; status.style.color = ''; }
  if (waiting) waiting.style.display = '';
  if (msgs) msgs.innerHTML = '<div class="chat-waiting" id="chatWaiting">씨앗을 심으면 솔이가 조심스럽게 다가옵니다</div>';
  disableInput();
}

function endChat() {
  chatOver = true;
  const dot = document.getElementById('chatDot');
  const status = document.getElementById('chatStatus');
  dot.classList.remove('live');
  status.textContent = '연결 종료 · 솔이가 숲으로 돌아갔습니다';
  disableInput();
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInput');
  if (input) input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) sendMessage();
  });
});

// ── BGM 토글 ──
let bgmOn = false;
const bgmAudio = document.getElementById('bgmAudio');
const bgmBtn  = document.getElementById('btnBgm');
function toggleBgm() {
  if (!bgmOn) {
    bgmAudio.volume = 0.35;
    bgmAudio.play().then(() => {
      bgmOn = true;
      bgmBtn.classList.remove('off');
    }).catch(() => {});
  } else {
    bgmAudio.pause();
    bgmOn = false;
    bgmBtn.classList.add('off');
  }
}

// ══════════════════════════════════════════════════════════
//  SEQ13  빛의 제어반 — 배선 연결 퍼즐
// ══════════════════════════════════════════════════════════
// 정답 매핑: wire → slot (슬롯 힌트 색과 일치)
// emerald→3, gold→1, sky→5, violet→2, white→4
const SEQ13_CORRECT = { emerald: 3, gold: 1, sky: 5, violet: 2, white: 4 };
const SEQ13_COLORS  = { emerald: '#22c55e', gold: '#f59e0b', sky: '#38bdf8', violet: '#a78bfa', white: '#e2e8f0' };
let seq13State      = { emerald: null, gold: null, sky: null, violet: null, white: null };
let seq13Selected   = null;

function seq13SelectWire(wid) {
  if (seq13State[wid] !== null) return; // 이미 연결됨
  seq13Selected = wid;
  document.querySelectorAll('.wire-plug').forEach(el => {
    el.style.boxShadow = '';
    el.style.background = 'rgba(0,0,0,.35)';
  });
  const wp = document.getElementById('wp-' + wid);
  if (wp) {
    wp.style.background = SEQ13_COLORS[wid] + '22';
    wp.style.boxShadow  = '0 0 10px ' + SEQ13_COLORS[wid] + '55, inset 0 0 0 1px ' + SEQ13_COLORS[wid] + '88';
  }
}

function seq13SelectSlot(num) {
  if (!seq13Selected) return;
  // 슬롯 이미 사용됨?
  const alreadyUsed = Object.values(seq13State).includes(num);
  if (alreadyUsed) return;

  const wid = seq13Selected;
  seq13Selected = null;
  document.querySelectorAll('.wire-plug').forEach(el => {
    el.style.boxShadow = '';
    el.style.background = 'rgba(0,0,0,.35)';
  });

  if (SEQ13_CORRECT[wid] === num) {
    // ── 정답 ──
    seq13State[wid] = num;
    const color = SEQ13_COLORS[wid];

    // 플러그 완료 스타일
    const wp = document.getElementById('wp-' + wid);
    if (wp) {
      wp.style.background = color + '22';
      wp.style.border = '1.5px solid ' + color + 'aa';
      wp.style.color  = color;
      wp.style.cursor = 'default';
      wp.style.opacity = '0.7';
    }
    // 슬롯 완료 스타일
    const ws = document.getElementById('ws-' + num);
    if (ws) {
      ws.style.background  = color + '22';
      ws.style.border = '1.5px solid ' + color;
      ws.style.boxShadow  = '0 0 10px ' + color + '55';
      ws.style.color = color;
      ws.style.cursor = 'default';
    }
    // SVG 연결선 그리기
    seq13DrawLine(wid, num, color);
    // 진행 업데이트
    seq13UpdateProgress();
  } else {
    // ── 오답 ──
    const ws = document.getElementById('ws-' + num);
    if (ws) {
      ws.style.boxShadow = '0 0 8px rgba(255,60,60,.6)';
      ws.style.border = '1.5px solid rgba(255,80,80,.6)';
      setTimeout(() => {
        ws.style.boxShadow = '';
        ws.style.border = ws.dataset.origBorder || '1.5px solid rgba(255,255,255,.12)';
      }, 500);
    }
    // 플러그도 잠깐 흔들기
    const wp = document.getElementById('wp-' + wid);
    if (wp) {
      wp.style.background = 'rgba(255,60,60,.12)';
      setTimeout(() => { wp.style.background = 'rgba(0,0,0,.35)'; }, 400);
    }
  }
}

// viewport 좌표 → SVG 사용자 좌표계 변환 (CSS scale 등 모든 transform 고려)
function viewportToSVG(svg, vpX, vpY) {
  const pt = svg.createSVGPoint();
  pt.x = vpX; pt.y = vpY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function seq13DrawLine(wid, slotNum, color) {
  const svg = document.getElementById('seq13Svg');
  if (!svg) return;
  const wp = document.getElementById('wp-' + wid);
  const ws = document.getElementById('ws-' + slotNum);
  if (!wp || !ws) return;

  const wpRect = wp.getBoundingClientRect();
  const wsRect = ws.getBoundingClientRect();

  // 플러그 dot은 버튼 오른쪽 끝 중앙, 슬롯 dot은 버튼 왼쪽 끝 중앙
  const p1 = viewportToSVG(svg, wpRect.right - 6,  wpRect.top + wpRect.height / 2);
  const p2 = viewportToSVG(svg, wsRect.left  + 6,  wsRect.top + wsRect.height  / 2);

  // 중간 제어점: 이미지 중앙부를 통과하는 S자 곡선
  const cx1 = p1.x + (p2.x - p1.x) * 0.42;
  const cx2 = p1.x + (p2.x - p1.x) * 0.58;
  // Y 곡선: 이미지 위쪽으로 약간 튀어올라가는 느낌
  const arcY = Math.min(p1.y, p2.y) - 120;

  const path = document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d', `M${p1.x},${p1.y} C${cx1},${arcY} ${cx2},${arcY} ${p2.x},${p2.y}`);
  path.setAttribute('fill','none');
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width','2.8');
  path.setAttribute('stroke-linecap','round');
  path.setAttribute('opacity','0');
  path.style.filter = `drop-shadow(0 0 5px ${color})`;
  svg.appendChild(path);
  requestAnimationFrame(() => {
    path.style.transition = 'opacity .5s';
    path.setAttribute('opacity','0.88');
  });
}

function seq13UpdateProgress() {
  const connected = Object.values(seq13State).filter(v => v !== null).length;
  const bar  = document.getElementById('seq13ProgressBar');
  const txt  = document.getElementById('seq13ProgressText');
  if (bar) bar.style.width = (connected / 5 * 100) + '%';
  if (txt) txt.textContent = connected + ' / 5';

  if (connected === 5) {
    setTimeout(seq13Succeed, 600);
  }
}

function seq13Succeed() {
  const fireOv  = document.getElementById('seq13FireOv');
  const succOv  = document.getElementById('seq13SuccessOv');
  const banner  = document.getElementById('seq13SuccessBanner');
  if (fireOv) fireOv.style.opacity  = '0';
  if (succOv) succOv.style.opacity  = '1';
  if (banner) banner.style.display  = 'block';
}

function seq13Reset() {
  seq13State    = { emerald: null, gold: null, sky: null, violet: null, white: null };
  seq13Selected = null;
  // 플러그 복원
  document.querySelectorAll('.wire-plug').forEach(el => {
    el.style.background = 'rgba(0,0,0,.35)';
    el.style.boxShadow  = '';
    el.style.color      = 'rgba(255,255,255,.78)';
    el.style.cursor     = 'pointer';
    el.style.opacity    = '1';
  });
  // 슬롯 복원
  document.querySelectorAll('.wire-slot').forEach(el => {
    el.style.background = 'rgba(0,0,0,.4)';
    el.style.boxShadow  = '';
    el.style.color      = 'rgba(255,255,255,.52)';
    el.style.cursor     = 'pointer';
  });
  // SVG 연결선 초기화
  const svg = document.getElementById('seq13Svg');
  if (svg) svg.innerHTML = '';
  // 오버레이 초기화
  const fireOv = document.getElementById('seq13FireOv');
  const succOv = document.getElementById('seq13SuccessOv');
  const banner = document.getElementById('seq13SuccessBanner');
  if (fireOv) fireOv.style.opacity  = '1';
  if (succOv) succOv.style.opacity  = '0';
  if (banner) banner.style.display  = 'none';
  // 진행 바
  const bar = document.getElementById('seq13ProgressBar');
  const txt = document.getElementById('seq13ProgressText');
  if (bar) bar.style.width    = '0%';
  if (txt) txt.textContent    = '0 / 5';
}

/* PATCH · SEQ.02 자유 타이핑 · ENTER 자동 진행 */
(function setupSeq02Input(){
  function bind(){
    var inp = document.getElementById('seq02CodeInput');
    var wrap = document.getElementById('seq02CodeInputWrap');
    if (!inp || inp.dataset.bound) return;
    inp.dataset.bound = '1';
    var firedAt = 0;
    function tryAdvance(){
      var v = (inp.value || '').replace(/\s+/g, '').toUpperCase();
      if (v === 'ENTER'){
        var now = Date.now();
        if (now - firedAt < 1500) return;
        firedAt = now;
        if (wrap) wrap.classList.add('done');
        inp.blur();
        // 1-C: 체크인 직후 이상 징후 — 조명 깜빡 + 솔방울 굴러떨어짐
        var s3 = document.getElementById('s3');
        if (s3) { s3.classList.add('seq02-omen'); setTimeout(function(){ s3.classList.remove('seq02-omen'); }, 1100); }
        setTimeout(function(){ if (typeof goTo === 'function') goTo(4); }, 1300);
      }
    }
    inp.addEventListener('input', tryAdvance);
    inp.addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ e.preventDefault(); tryAdvance(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();


/* PATCH v2 · renderSolNotes + initEpilogue */
const Q3_TO_SOL_NOTE = {
  0: {
    '자연이 좋아서': '"숲을 좋아한대.\n진짜인지는 — 모르겠다."',
    '재미있어 보여서': '"재미를 찾으러 왔대.\n숲은 재미 같은 거 아닌데."',
    '숲에 대해 알고싶어서': '"알고 싶대.\n그래서 와본 거래.\n그것만으로 충분한 것 같기도 하고."'
  },
  1: {
    '나무 냄새': '"냄새가 좋대.\n숲은 비 오기 전이 제일 깊은 냄새인데,\n그걸 맡을 수 있을지 모르겠다."',
    '바람 소리': '"바람 소리가 좋대.\n잘 들어주면 좋겠다, 진짜로."',
    '햇빛': '"햇빛이 좋대.\n그늘은 어떻게 생각하는지는 안 적혀 있다."',
    '작은 생물': '"작은 것들이 좋대.\n... 나도 작은데. 그건 모르겠지."'
  },
  2: {
    '가만히 다가간다': '"다가올 거래. 가만히.\n무섭지 않게 와줬으면."',
    '조용히 지켜본다': '"지켜만 본대.\n그것도 좋아. 보는 것도 만나는 거니까."',
    '자리를 피한다': '"피한대.\n괜찮아. 작은 것들도 그게 더 편할 때 있어."'
  }
};

function renderSolNotes() {
  var body = document.getElementById('solNotesBody');
  if (!body) return;
  if (typeof q3Responses === 'undefined') return;
  var html = '';
  for (var i = 0; i < 3; i++) {
    var r = q3Responses[i];
    if (!r) continue;
    var note = '';
    if (r.type === 'text') {
      note = '"직접 적은 답이 있다.\n글씨가 너무 작아서 못 읽었다.\n다음엔 — 큰 글씨로 부탁."';
    } else {
      var map = Q3_TO_SOL_NOTE[i] || {};
      note = map[r.value] || ('"' + r.value + '... 이게 무슨 뜻이지?"');
    }
    html += '<div class="sol-note">' + note.replace(/\n/g, '<br>') + '</div>';
  }
  if (!html) html = '<div class="sol-note-empty">설문을 아직 안 적었는지, 여기는 비어 있다.</div>';
  body.innerHTML = html;
}

function initEpilogue() {
  var dst = document.getElementById('s16BgImg');
  var src = document.querySelector('#s1 .sb-bg-img');
  if (dst && src && src.src && !dst.src) {
    dst.src = src.src;
  }
}
