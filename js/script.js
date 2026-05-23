// ============================================================
// script.js — Site Romântico com Firebase
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC1A5ZcsQRrMaofkHvh5A729PY4G2kbwxE",
  authDomain: "site-presente.firebaseapp.com",
  databaseURL: "https://site-presente-default-rtdb.firebaseio.com",
  projectId: "site-presente",
  storageBucket: "site-presente.firebasestorage.app",
  messagingSenderId: "285331917727",
  appId: "1:285331917727:web:aac248a803bf2516c3cbaa"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===================== MODO DO SITE =====================
const urlParams = new URLSearchParams(window.location.search);
const SITE_ID = urlParams.get('id');
const MODO_VISUALIZACAO = !!SITE_ID;

// ===================== DADOS DO SITE =====================
let siteData = {
  color: '#c2185b',
  name1: 'Nome 1',
  name2: 'Nome 2',
  coverLabel: 'Sobre o casal',
  startDate: '2001-01-01T00:00',
  mensagem: `Prévia de sua mensagem especial...\nAqui sua mensagem especial.\nDigite aqui sua mensagem especial...\nEsse é o lugar para expressar\nO que você sente de verdade.\nTe amo hoje e para sempre.`,
  songTitle: 'Sua Música',
  songArtist: 'Artista',
  songUrl: 'arquivosparaosite/mp3/musicatribalhistaevoce.mp3',
  songArtImg: null,
  heroImg: null,
  skyQuote: '"O céu que estava com a gente"',
  skyDate: '2001-01-01',
  skyTime: '00:00',
  skyCity: 'Cidade Exemplo',
  skyState: 'Estado Exemplo',
  skyCountry: 'Brasil',
  skyLat: '-12.0000',
  skyLng: '-49.0000',
  moments: [
    { date: '01 de Janeiro de 2001', desc: 'Onde tudo começou — nosso primeiro encontro especial.', img: null },
    { date: '12 de Março de 2007', desc: 'Um momento inesquecível que mudou tudo entre nós.', img: null }
  ],
  places: [
    { name: 'Lugar Especial 1', date: '01/01/2001', city: 'Cidade Exemplo', state: 'Estado Exemplo', country: 'Brasil', quote: 'Quando nossos caminhos se cruzaram definitivamente', lat: '-12.00', lng: '-49.00', img: null },
    { name: 'Lugar Especial 2', date: '12/03/2007', city: 'Cidade Exemplo', state: 'Estado Exemplo', country: 'Brasil', quote: 'Mais um momento especial que ficou na memória', lat: '-12.05', lng: '-49.05', img: null }
  ]
};

// ===================== ESTADO GLOBAL =====================
let pageHistory = [];
let currentPage = 'p1';
let counterInterval = null;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let fakeMapAnimFrame = null;
let selectedPlaceIdx = 0;
let audio;

// ===================== ESTRELAS DE FUNDO =====================
function createStars() {
  const bg = document.getElementById('starsBg');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2 + 0.5;
    s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${(Math.random()*3+2).toFixed(1)}s;animation-delay:${(Math.random()*3).toFixed(1)}s;`;
    bg.appendChild(s);
  }
}

// ===================== NAVEGAÇÃO =====================
function goPage(pg) {
  if (pg === 'p1') pg = 'page1';
  const map = {
    historia: 'page2', lugares: 'page3', ceu: 'page4',
    admin: 'pageAdmin', page1: 'page1', page2: 'page2',
    page3: 'page3', page4: 'page4', pageAdmin: 'pageAdmin'
  };
  const targetId = map[pg] || pg;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');

  const fabAdmin = document.getElementById('fabAdmin');
  const backFloat = document.getElementById('backFloat');

  if (targetId === 'pageAdmin') {
    fabAdmin.style.display = 'none';
    backFloat.style.display = 'block';
    pageHistory.push(targetId);
  } else if (targetId === 'page1') {
    fabAdmin.style.display = MODO_VISUALIZACAO ? 'none' : 'block';
    backFloat.style.display = 'none';
    pageHistory = [targetId];
  } else {
    fabAdmin.style.display = 'none';
    backFloat.style.display = 'block';
    pageHistory.push(targetId);
  }

  currentPage = targetId;
  window.scrollTo(0, 0);

  if (targetId === 'page2') renderTimeline();
  if (targetId === 'page3') { renderPlaces(); initFakeMap(); }
  if (targetId === 'page4') renderSky();
  if (targetId === 'pageAdmin') renderAdmin();

  if (targetId !== 'page3' && fakeMapAnimFrame) {
    cancelAnimationFrame(fakeMapAnimFrame);
    fakeMapAnimFrame = null;
  }

  setTimeout(observeTimeline, 300);
}

function goBack() {
  pageHistory.pop();
  const prev = pageHistory[pageHistory.length - 1] || 'page1';
  if (prev === 'page1') {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page1').classList.add('active');
    document.getElementById('fabAdmin').style.display = MODO_VISUALIZACAO ? 'none' : 'block';
    document.getElementById('backFloat').style.display = 'none';
    currentPage = 'page1';
    if (fakeMapAnimFrame) { cancelAnimationFrame(fakeMapAnimFrame); fakeMapAnimFrame = null; }
  } else {
    goPage(prev);
  }
}

function endExperience() {
  showToast('Obrigado por viver essa história! ♥');
  setTimeout(() => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page1').classList.add('active');
    document.getElementById('fabAdmin').style.display = MODO_VISUALIZACAO ? 'none' : 'block';
    document.getElementById('backFloat').style.display = 'none';
    pageHistory = ['page1'];
    if (fakeMapAnimFrame) { cancelAnimationFrame(fakeMapAnimFrame); fakeMapAnimFrame = null; }
  }, 1800);
}

// ===================== CONTADOR =====================
function startCounter() {
  if (counterInterval) clearInterval(counterInterval);
  counterInterval = setInterval(updateCounter, 1000);
  updateCounter();
}

function updateCounter() {
  const start = new Date(siteData.startDate);
  const now = new Date();
  let diff = now - start;
  if (diff < 0) diff = 0;

  const totalSec = Math.floor(diff / 1000);
  const seconds = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const minutes = totalMin % 60;
  const totalHours = Math.floor(totalMin / 60);
  const hours = totalHours % 24;

  const startD = new Date(siteData.startDate);
  const nowD = new Date();
  let years = nowD.getFullYear() - startD.getFullYear();
  let months = nowD.getMonth() - startD.getMonth();
  if (months < 0) { years--; months += 12; }
  let days = nowD.getDate() - startD.getDate();
  if (days < 0) { months--; if (months < 0) { years--; months += 12; } }
  const tempDate = new Date(startD.getFullYear() + years, startD.getMonth() + months, startD.getDate());
  days = Math.floor((nowD - tempDate) / (1000 * 60 * 60 * 24));

  document.getElementById('cnt-years').textContent = years;
  document.getElementById('cnt-months').textContent = months;
  document.getElementById('cnt-days').textContent = days;
  document.getElementById('cnt-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cnt-minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('cnt-seconds').textContent = String(seconds).padStart(2, '0');
}

// ===================== PLAYER =====================
function togglePlay() {
  if (!audio) return;
  if (audio.src) {
    if (isPlaying) { audio.pause(); } else { audio.play(); }
  } else {
    showToast('Adicione uma música no painel de edição');
  }
}

function audioSeek(sec) {
  if (!audio) return;
  audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + sec));
}

function shuffleToggle() {
  isShuffle = !isShuffle;
  document.getElementById('btnShuffle').style.color = isShuffle ? 'var(--color-pink)' : '';
}

function repeatToggle() {
  isRepeat = !isRepeat;
  document.getElementById('btnRepeat').style.color = isRepeat ? 'var(--color-pink)' : '';
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2,'0')}`;
}

function initAudio() {
  audio = document.getElementById('audioPlayer');

  audio.addEventListener('play', () => {
    isPlaying = true;
    document.getElementById('playBtn').textContent = '⏸';
  });
  audio.addEventListener('pause', () => {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶';
  });
  audio.addEventListener('ended', () => {
    if (isRepeat) { audio.currentTime = 0; audio.play(); }
    else { isPlaying = false; document.getElementById('playBtn').textContent = '▶'; }
  });
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('timeNow').textContent = formatTime(audio.currentTime);
    document.getElementById('timeDuration').textContent = '-' + formatTime(audio.duration - audio.currentTime);
  });
  audio.addEventListener('loadedmetadata', () => {
    document.getElementById('timeDuration').textContent = formatTime(audio.duration);
  });

  document.getElementById('progressBar').addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  });
}

// ===================== MENSAGEM =====================
function toggleMensagem() {
  document.getElementById('mensagemCard').classList.toggle('expanded');
}

// ===================== TIMELINE =====================
function renderTimeline() {
  const container = document.getElementById('timelineContainer');
  container.innerHTML = '';
  siteData.moments.forEach((m, i) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    const imgSrc = m.img || `https://picsum.photos/seed/${i+10}/200/200`;
    item.innerHTML = `
      <div class="timeline-photo"><div class="polaroid">
        <img src="${imgSrc}" alt="Momento">
        <div class="polaroid-caption">${m.date}</div>
      </div></div>
      <div class="timeline-info">
        <div class="timeline-date">${m.date} <span class="timeline-heart">♥</span></div>
        <div class="timeline-desc">${m.desc}</div>
      </div>`;
    container.appendChild(item);
  });
}

function observeTimeline() {
  const items = document.querySelectorAll('.timeline-item');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    items.forEach(i => obs.observe(i));
  } else {
    items.forEach(i => i.classList.add('visible'));
  }
}

// ===================== LUGARES / MAPA =====================
function renderPlaces() {
  const list = document.getElementById('placesList');
  list.innerHTML = '';
  siteData.places.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'place-card' + (i === selectedPlaceIdx ? ' active' : '');
    const imgSrc = p.img || `https://picsum.photos/seed/${i+20}/80/80`;
    card.innerHTML = `
      <img class="place-photo" src="${imgSrc}" alt="${p.name}">
      <div class="place-info">
        <div class="place-name">${p.name}</div>
        <div class="place-date">📅 ${p.date}</div>
        <div class="place-quote">"${p.quote}"</div>
      </div>
      <div class="place-loc-icon">📍</div>`;
    card.addEventListener('click', () => selectPlace(i));
    list.appendChild(card);
  });
  updateMapOpenBtn();
}

function selectPlace(idx) {
  selectedPlaceIdx = idx;
  document.querySelectorAll('.place-card').forEach((c, i) => c.classList.toggle('active', i === idx));
  updateMapOpenBtn();
  if (fakeMapAnimFrame) { cancelAnimationFrame(fakeMapAnimFrame); fakeMapAnimFrame = null; }
  initFakeMap();
}

function updateMapOpenBtn() {
  const btn = document.getElementById('mapOpenBtn');
  const badge = document.getElementById('mapCoordsBadge');
  if (!btn || !badge) return;
  const p = siteData.places[selectedPlaceIdx];
  if (!p) return;
  const lat = parseFloat(p.lat) || 0;
  const lng = parseFloat(p.lng) || 0;
  btn.href = `https://www.google.com/maps?q=${lat},${lng}`;
  const latStr = lat < 0 ? `${Math.abs(lat).toFixed(4)}°S` : `${lat.toFixed(4)}°N`;
  const lngStr = lng < 0 ? `${Math.abs(lng).toFixed(4)}°W` : `${lng.toFixed(4)}°E`;
  badge.textContent = `${latStr}  ${lngStr}`;
}

function initFakeMap() {
  const container = document.getElementById('map-container');
  let canvas = document.getElementById('fakeMapCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'fakeMapCanvas';
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.innerHTML = '';
    container.appendChild(canvas);
    const grad = document.createElement('div'); grad.className = 'map-overlay-gradient'; container.appendChild(grad);
    const badge = document.createElement('div'); badge.className = 'map-coords-badge'; badge.id = 'mapCoordsBadge'; container.appendChild(badge);
    const btn = document.createElement('a'); btn.id = 'mapOpenBtn'; btn.className = 'map-open-btn'; btn.target = '_blank'; btn.rel = 'noopener noreferrer'; btn.innerHTML = '🗺️ Abrir no Google Maps'; container.appendChild(btn);
  }
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width || 600;
  canvas.height = rect.height || 300;
  updateMapOpenBtn();

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  let offsetX = 0, offsetY = 0, targetX = 0, targetY = 0, panTimer = 0, panDX = 0.3, panDY = 0.15;
  const TILE = 60; let t = 0;
  const pinSeed = siteData.places.reduce((a, p) => a + parseFloat(p.lat||0) + parseFloat(p.lng||0), 0) || 42;
  const rand = makeRand(Math.abs(Math.round(pinSeed * 1000)));
  const blocks = [];
  for (let i = 0; i < 24; i++) blocks.push({ x: rand()*W*2-W*0.5, y: rand()*H*2-H*0.5, w: rand()*80+30, h: rand()*60+20, color: rand()>0.5?'#1e2a1e':'#182218' });
  const roads = [];
  for (let i = 0; i < 6; i++) { roads.push({type:'h',y:rand()*H}); roads.push({type:'v',x:rand()*W}); }

  function drawFakeMap() {
    fakeMapAnimFrame = requestAnimationFrame(drawFakeMap); t++;
    offsetX += (targetX-offsetX)*0.03; offsetY += (targetY-offsetY)*0.03;
    panTimer++;
    if (panTimer > 200) { panTimer=0; panDX=(rand()-0.5)*0.6; panDY=(rand()-0.5)*0.4; }
    targetX += panDX; targetY += panDY;
    if (Math.abs(targetX)>120) panDX*=-1; if (Math.abs(targetY)>80) panDY*=-1;
    const ox=offsetX, oy=offsetY;
    ctx.fillStyle='#111a11'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(60,90,60,0.35)'; ctx.lineWidth=1;
    const gx=((ox%TILE)+TILE)%TILE, gy=((oy%TILE)+TILE)%TILE;
    for (let x=-gx;x<W+TILE;x+=TILE){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for (let y=-gy;y<H+TILE;y+=TILE){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle='rgba(80,120,80,0.5)'; ctx.lineWidth=2.5;
    roads.forEach(r=>{ctx.beginPath();if(r.type==='h'){ctx.moveTo(0,r.y+oy*0.5);ctx.lineTo(W,r.y+oy*0.5);}else{ctx.moveTo(r.x+ox*0.5,0);ctx.lineTo(r.x+ox*0.5,H);}ctx.stroke();});
    blocks.forEach(b=>{ctx.fillStyle=b.color;ctx.beginPath();ctx.roundRect(b.x+ox*0.7,b.y+oy*0.7,b.w,b.h,3);ctx.fill();});
    const pinX=W/2,pinY=H/2,pulse=0.5+0.5*Math.sin(t*0.07);
    ctx.beginPath();ctx.arc(pinX,pinY,18+pulse*8,0,Math.PI*2);ctx.fillStyle=`rgba(194,24,91,${0.15+pulse*0.1})`;ctx.fill();
    ctx.beginPath();ctx.arc(pinX,pinY,10,0,Math.PI*2);ctx.fillStyle='var(--color-primary,#c2185b)';ctx.shadowColor='#c2185b';ctx.shadowBlur=12;ctx.fill();ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(pinX,pinY,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    const p=siteData.places[selectedPlaceIdx];
    if(p&&p.name){ctx.font='bold 12px Nunito,sans-serif';ctx.textAlign='center';const textW=ctx.measureText(p.name).width+20;ctx.fillStyle='rgba(0,0,0,0.7)';ctx.beginPath();ctx.roundRect(pinX-textW/2,pinY-42,textW,22,6);ctx.fill();ctx.fillStyle='#fff';ctx.fillText(p.name,pinX,pinY-26);ctx.textAlign='left';}
  }
  drawFakeMap();
}

// ===================== CÉU =====================
function renderSky() {
  document.getElementById('skyCupleName').textContent = `${siteData.name1} e ${siteData.name2}`;
  document.getElementById('skyQuote').textContent = siteData.skyQuote;
  const dateStr = formatSkyDate(siteData.skyDate);
  const lat = parseFloat(siteData.skyLat);
  const lng = parseFloat(siteData.skyLng);
  const latStr = lat<0?`${Math.abs(lat).toFixed(4)}°S`:`${lat.toFixed(4)}°N`;
  const lngStr = lng<0?`${Math.abs(lng).toFixed(4)}°W`:`${lng.toFixed(4)}°E`;
  document.getElementById('skyMeta').innerHTML = `${siteData.skyCity}, ${siteData.skyState}, ${siteData.skyCountry}<br>${dateStr} - ${siteData.skyTime}<br>${latStr} ${lngStr}`;
  drawSkyCanvas();
}

function formatSkyDate(dateStr) {
  const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const [y,m,d] = dateStr.split('-');
  return `${parseInt(d)} de ${months[parseInt(m)-1]} de ${y}`;
}

function drawSkyCanvas() {
  const canvas = document.getElementById('skyCanvas');
  const ctx = canvas.getContext('2d');
  const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2,r=W/2-10;
  const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
  grad.addColorStop(0,'#0d1a2e'); grad.addColorStop(1,'#000510');
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=grad;ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
  [0.3,0.6,0.9].forEach(f=>{ctx.beginPath();ctx.arc(cx,cy,r*f,0,Math.PI*2);ctx.stroke();});
  for(let a=0;a<360;a+=30){const rad=a*Math.PI/180;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(rad)*r,cy+Math.sin(rad)*r);ctx.stroke();}
  const seed=seedFromDate(siteData.skyDate+siteData.skyTime);
  const rand=makeRand(seed);
  const stars=[];
  for(let i=0;i<120;i++){const angle=rand()*Math.PI*2,dist=rand()*r*0.92,x=cx+Math.cos(angle)*dist,y=cy+Math.sin(angle)*dist,size=rand()*2+0.3;stars.push({x,y,size});ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${rand()*0.6+0.4})`;ctx.fill();}
  const cs=stars.slice(0,20),groups=[[0,3,7],[3,8,12],[12,15,18],[7,10,14,19]];
  ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=0.8;
  groups.forEach(g=>{for(let i=0;i<g.length-1;i++){const s1=cs[g[i]],s2=cs[g[i+1]];ctx.beginPath();ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);ctx.stroke();}g.forEach(idx=>{const s=cs[idx];ctx.beginPath();ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();});});
  ctx.save();ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.restore();
}

function seedFromDate(str){let h=0;for(let i=0;i<str.length;i++)h=Math.imul(31,h)+str.charCodeAt(i)|0;return Math.abs(h);}
function makeRand(seed){let s=seed;return()=>{s=(s*1664525+1013904223)&0xffffffff;return(s>>>0)/0xffffffff;};}

// ===================== ADMIN =====================
function renderAdmin() {
  document.getElementById('a-name1').value = siteData.name1;
  document.getElementById('a-name2').value = siteData.name2;
  document.getElementById('a-cover-label').value = siteData.coverLabel;
  document.getElementById('a-start-date').value = siteData.startDate;
  document.getElementById('a-mensagem').value = siteData.mensagem;
  document.getElementById('a-song-title').value = siteData.songTitle;
  document.getElementById('a-song-artist').value = siteData.songArtist;
  document.getElementById('a-sky-quote').value = siteData.skyQuote;
  document.getElementById('a-sky-date').value = siteData.skyDate;
  document.getElementById('a-sky-time').value = siteData.skyTime;
  document.getElementById('a-sky-city').value = siteData.skyCity;
  document.getElementById('a-sky-state').value = siteData.skyState;
  document.getElementById('a-sky-country').value = siteData.skyCountry;
  document.getElementById('a-sky-lat').value = siteData.skyLat;
  document.getElementById('a-sky-lng').value = siteData.skyLng;
  renderMomentsAdmin();
  renderPlacesAdmin();
}

function renderMomentsAdmin() {
  const c = document.getElementById('momentsAdmin');
  c.innerHTML = '';
  siteData.moments.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'moment-card';
    div.innerHTML = `
      <button class="moment-remove" id="rm-mom-${i}">×</button>
      <div class="form-group"><label class="form-label">Data / Período</label>
        <input class="form-input" value="${m.date}" data-mom="${i}" data-field="date" placeholder="Ex: 12 de Março de 2007">
      </div>
      <div class="form-group"><label class="form-label">Descrição</label>
        <input class="form-input" value="${m.desc}" data-mom="${i}" data-field="desc" placeholder="O que aconteceu?">
      </div>
      <div class="form-group"><label class="form-label">Foto</label>
        <div class="upload-area" id="mom-upload-area-${i}">
          <input type="file" id="mom-img-${i}" accept="image/*" data-idx="${i}" style="display:none">
          <div class="upload-icon">${m.img ? '✅' : '📷'}</div>
          <div class="upload-text">${m.img ? 'Foto carregada' : 'Clique para enviar foto'}</div>
          ${m.img ? `<img class="upload-preview" src="${m.img}" style="display:block">` : ''}
        </div>
      </div>`;
    c.appendChild(div);
    div.querySelector(`#rm-mom-${i}`).addEventListener('click', () => removeMoment(i));
    div.querySelector(`[data-mom="${i}"][data-field="date"]`).addEventListener('change', e => { siteData.moments[i].date = e.target.value; });
    div.querySelector(`[data-mom="${i}"][data-field="desc"]`).addEventListener('change', e => { siteData.moments[i].desc = e.target.value; });
    div.querySelector(`#mom-upload-area-${i}`).addEventListener('click', () => document.getElementById(`mom-img-${i}`).click());
    div.querySelector(`#mom-img-${i}`).addEventListener('change', e => loadMomentImg(e.target, i));
  });
}

function renderPlacesAdmin() {
  const c = document.getElementById('placesAdmin');
  c.innerHTML = '';
  siteData.places.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'place-admin-card';
    div.innerHTML = `
      <button class="moment-remove" id="rm-place-${i}">×</button>
      <div class="form-grid2">
        <div class="form-group"><label class="form-label">Nome do local</label><input class="form-input" value="${p.name}" data-place="${i}" data-field="name"></div>
        <div class="form-group"><label class="form-label">Data</label><input class="form-input" value="${p.date}" data-place="${i}" data-field="date"></div>
      </div>
      <div class="form-grid3">
        <div class="form-group"><label class="form-label">Cidade</label><input class="form-input" value="${p.city}" data-place="${i}" data-field="city"></div>
        <div class="form-group"><label class="form-label">Estado</label><input class="form-input" value="${p.state}" data-place="${i}" data-field="state"></div>
        <div class="form-group"><label class="form-label">País</label><input class="form-input" value="${p.country}" data-place="${i}" data-field="country"></div>
      </div>
      <div class="form-group"><label class="form-label">Texto / Memória</label><input class="form-input" value="${p.quote}" data-place="${i}" data-field="quote"></div>
      <div class="form-grid2">
        <div class="form-group"><label class="form-label">Latitude</label><input class="form-input" value="${p.lat}" data-place="${i}" data-field="lat" placeholder="-12.0000"></div>
        <div class="form-group"><label class="form-label">Longitude</label><input class="form-input" value="${p.lng}" data-place="${i}" data-field="lng" placeholder="-49.0000"></div>
      </div>
      <div class="form-group"><label class="form-label">Foto</label>
        <div class="upload-area" id="place-upload-area-${i}">
          <input type="file" id="place-img-${i}" accept="image/*" style="display:none">
          <div class="upload-icon">${p.img ? '✅' : '📷'}</div>
          <div class="upload-text">${p.img ? 'Foto carregada' : 'Clique para enviar foto'}</div>
          ${p.img ? `<img class="upload-preview" src="${p.img}" style="display:block">` : ''}
        </div>
      </div>`;
    c.appendChild(div);
    div.querySelector(`#rm-place-${i}`).addEventListener('click', () => removePlace(i));
    div.querySelectorAll(`[data-place="${i}"]`).forEach(input => {
      input.addEventListener('change', e => { siteData.places[i][e.target.dataset.field] = e.target.value; });
    });
    div.querySelector(`#place-upload-area-${i}`).addEventListener('click', () => document.getElementById(`place-img-${i}`).click());
    div.querySelector(`#place-img-${i}`).addEventListener('change', e => loadPlaceImg(e.target, i));
  });
}

function addMomentAdmin() { siteData.moments.push({date:'',desc:'',img:null}); renderMomentsAdmin(); }
function removeMoment(i) { if(siteData.moments.length<=1){showToast('Mínimo de 1 momento');return;} siteData.moments.splice(i,1); renderMomentsAdmin(); }
function addPlaceAdmin() { siteData.places.push({name:'',date:'',city:'',state:'',country:'',quote:'',lat:'',lng:'',img:null}); renderPlacesAdmin(); }
function removePlace(i) { if(siteData.places.length<=2){showToast('Mínimo de 2 lugares');return;} siteData.places.splice(i,1); renderPlacesAdmin(); }

function loadMomentImg(input, idx) {
  const file = input.files[0]; if(!file)return;
  const reader = new FileReader();
  reader.onload = e => { siteData.moments[idx].img = e.target.result; renderMomentsAdmin(); };
  reader.readAsDataURL(file);
}
function loadPlaceImg(input, idx) {
  const file = input.files[0]; if(!file)return;
  const reader = new FileReader();
  reader.onload = e => { siteData.places[idx].img = e.target.result; renderPlacesAdmin(); };
  reader.readAsDataURL(file);
}
function previewImage(input, previewId) {
  const file = input.files[0]; if(!file)return;
  const reader = new FileReader();
  reader.onload = e => {
    siteData.heroImg = e.target.result;
    const prev = document.getElementById(previewId);
    if(prev){prev.src=e.target.result;prev.style.display='block';}
    document.getElementById('p1-hero-img').src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function loadMusic(input) {
  const file = input.files[0]; if(!file)return;
  const reader = new FileReader();
  reader.onload = e => { siteData.songUrl=e.target.result; audio.src=siteData.songUrl; showToast('🎵 Música carregada!'); };
  reader.readAsDataURL(file);
}
function loadSongArt(input) {
  const file = input.files[0]; if(!file)return;
  const reader = new FileReader();
  reader.onload = e => { siteData.songArtImg=e.target.result; updateSongArtDisplay(); };
  reader.readAsDataURL(file);
}
function updateSongArtDisplay() {
  const art = document.getElementById('playerArt'); if(!art)return;
  const imgEl = art.querySelector('img');
  if(siteData.songArtImg){
    if(imgEl){imgEl.src=siteData.songArtImg;}
    else{const img=document.createElement('img');img.src=siteData.songArtImg;img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:0.6rem;';art.childNodes.forEach(n=>{if(n.nodeType===3)n.remove();});const overlay=art.querySelector('.player-art-overlay');art.insertBefore(img,overlay);}
  }
}

// ===================== CORES =====================
function selectColor(el) {
  document.querySelectorAll('.color-preset').forEach(p=>p.classList.remove('selected'));
  el.classList.add('selected');
  const color=el.dataset.color;
  document.getElementById('colorHex').value=color;
  document.getElementById('colorPicker').value=color;
  applyColor(color);
}
function applyColorHex() {
  const val=document.getElementById('colorHex').value;
  if(/^#[0-9a-fA-F]{6}$/.test(val)){document.getElementById('colorPicker').value=val;applyColor(val);}
}
function applyColorFromPicker() {
  const val=document.getElementById('colorPicker').value;
  document.getElementById('colorHex').value=val;
  applyColor(val);
}
function applyColor(hex) {
  siteData.color=hex;
  document.documentElement.style.setProperty('--color-primary',hex);
  document.documentElement.style.setProperty('--color-secondary',darken(hex,30));
}
function darken(hex,amount){let r=parseInt(hex.slice(1,3),16)-amount,g=parseInt(hex.slice(3,5),16)-amount,b=parseInt(hex.slice(5,7),16)-amount;r=Math.max(0,r);g=Math.max(0,g);b=Math.max(0,b);return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;}

// ===================== SALVAR =====================
function saveAll() {
  siteData.name1 = document.getElementById('a-name1').value.trim();
  siteData.name2 = document.getElementById('a-name2').value.trim();
  siteData.coverLabel = document.getElementById('a-cover-label').value;
  siteData.startDate = document.getElementById('a-start-date').value;
  siteData.mensagem = document.getElementById('a-mensagem').value;
  siteData.songTitle = document.getElementById('a-song-title').value;
  siteData.songArtist = document.getElementById('a-song-artist').value;
  siteData.skyQuote = document.getElementById('a-sky-quote').value;
  siteData.skyDate = document.getElementById('a-sky-date').value;
  siteData.skyTime = document.getElementById('a-sky-time').value;
  siteData.skyCity = document.getElementById('a-sky-city').value;
  siteData.skyState = document.getElementById('a-sky-state').value;
  siteData.skyCountry = document.getElementById('a-sky-country').value;
  siteData.skyLat = document.getElementById('a-sky-lat').value;
  siteData.skyLng = document.getElementById('a-sky-lng').value;
  applyDataToPage1();
  try { const toSave={...siteData}; localStorage.setItem('siteRomantico',JSON.stringify(toSave)); } catch(e){}
  showToast('✅ Salvo! Clique em "Gerar Link" para criar o link.');
}

// ===================== GERAR LINK =====================
async function gerarLink() {
  saveAll();
  showToast('⏳ Salvando no servidor...');
  const id = Math.random().toString(36).substr(2,9) + Date.now().toString(36);
  try {
    await set(ref(db,'sites/'+id), siteData);
    const link = `${window.location.origin}${window.location.pathname}?id=${id}`;
    const linkBox = document.getElementById('linkGerado');
    const linkInput = document.getElementById('linkUrl');
    linkBox.style.display = 'block';
    linkInput.value = link;
    showToast('✅ Link gerado!');
  } catch(err) {
    showToast('❌ Erro ao salvar. Verifique o Firebase.');
    console.error(err);
  }
}

function copiarLink() {
  const linkInput = document.getElementById('linkUrl');
  navigator.clipboard.writeText(linkInput.value).then(()=>showToast('📋 Link copiado!'));
}

// ===================== CARREGAR DO FIREBASE =====================
async function carregarDoFirebase(id) {
  showToast('⏳ Carregando...');
  try {
    const snapshot = await get(ref(db,'sites/'+id));
    if(snapshot.exists()){
      Object.assign(siteData, snapshot.val());
      applyColor(siteData.color||'#c2185b');
      applyDataToPage1();
      showToast('💌 Abrindo seu presente...');
    } else {
      showToast('❌ Link inválido ou expirado.');
    }
  } catch(err) {
    showToast('❌ Erro ao carregar.');
    console.error(err);
  }
}

// ===================== APLICAR DADOS =====================
function applyDataToPage1() {
  document.getElementById('p1-couple-name').textContent = `${siteData.name1} e ${siteData.name2}`;
  document.getElementById('p1-cover-label').textContent = siteData.coverLabel;
  const year = siteData.startDate ? siteData.startDate.split('-')[0] : '2001';
  document.getElementById('p1-together-since').textContent = `Juntos desde ${year}`;
  if(siteData.heroImg) document.getElementById('p1-hero-img').src = siteData.heroImg;
  const lines = siteData.mensagem.split('\n');
  document.getElementById('mensagemPreview').innerHTML = lines.slice(0,2).join('<br>')+(lines.length>2?'...':'');
  document.getElementById('mensagemFull').innerHTML = siteData.mensagem.replace(/\n/g,'<br>');
  document.getElementById('playerTitle').textContent = siteData.songTitle;
  document.getElementById('playerArtist').textContent = siteData.songArtist;
  if(siteData.songArtImg) updateSongArtDisplay();
  if(siteData.songUrl && audio) audio.src = siteData.songUrl;
  startCounter();
}

// ===================== TOAST =====================
function showToast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2800);
}

// ===================== EXPOR FUNÇÕES GLOBALMENTE =====================
// Necessário porque o script usa type="module" e as funções ficam isoladas
window.goPage = goPage;
window.goBack = goBack;
window.endExperience = endExperience;
window.togglePlay = togglePlay;
window.audioSeek = audioSeek;
window.shuffleToggle = shuffleToggle;
window.repeatToggle = repeatToggle;
window.toggleMensagem = toggleMensagem;
window.selectPlace = selectPlace;
window.selectColor = selectColor;
window.applyColorHex = applyColorHex;
window.applyColorFromPicker = applyColorFromPicker;
window.saveAll = saveAll;
window.gerarLink = gerarLink;
window.copiarLink = copiarLink;
window.addMomentAdmin = addMomentAdmin;
window.removeMoment = removeMoment;
window.addPlaceAdmin = addPlaceAdmin;
window.removePlace = removePlace;
window.previewImage = previewImage;
window.loadMusic = loadMusic;
window.loadSongArt = loadSongArt;

// ===================== INICIALIZAÇÃO =====================
document.addEventListener('DOMContentLoaded', async () => {
  createStars();
  initAudio();
  applyColor('#c2185b');
  pageHistory = ['page1'];

  if(MODO_VISUALIZACAO) {
    await carregarDoFirebase(SITE_ID);
  } else {
    try {
      const saved = localStorage.getItem('siteRomantico');
      if(saved) Object.assign(siteData, JSON.parse(saved));
      siteData.songUrl = siteData.songUrl || 'arquivosparaosite/mp3/musicatribalhistaevoce.mp3';
      applyColor(siteData.color||'#c2185b');
    } catch(e) {}
    applyDataToPage1();
  }
});
