'use strict';

// ─── Security: sanitize ALL user input before inserting into DOM ──────────────
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// Validate URLs — only allow http/https, reject javascript: data: etc.
function safeUrl(str) {
  try {
    const u = new URL(str || '');
    return (u.protocol === 'https:' || u.protocol === 'http:') ? str : '';
  } catch { return ''; }
}

// ─── Navigation ───────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-current', 'page');
    const sec = document.getElementById('sec-' + btn.dataset.sec);
    if (sec) sec.classList.add('active');
  });
});

// ─── State ────────────────────────────────────────────────────────────────────
let workEntries  = [];
let eduEntries   = [];
let techSkills   = [];
let softSkills   = [];
let languages    = [];
let customFields = [];

// ─── Work entries ─────────────────────────────────────────────────────────────
function renderWorkEntries() {
  const list = document.getElementById('work-entries');
  list.innerHTML = '';
  workEntries.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'entry';
    // Use textContent/setAttribute instead of innerHTML where possible
    div.innerHTML = `
      <div class="entry-hdr">
        <span class="entry-num">Position ${i + 1}</span>
        <button class="btn-rm" data-index="${i}" type="button">Remove</button>
      </div>
      <div class="g2">
        <div class="field"><label>Job Title</label>
          <input type="text" value="${esc(e.title)}" placeholder="Software Engineer" data-i="${i}" data-field="title" autocomplete="off" spellcheck="false"/></div>
        <div class="field"><label>Company</label>
          <input type="text" value="${esc(e.company)}" placeholder="Acme Corp" data-i="${i}" data-field="company" autocomplete="off" spellcheck="false"/></div>
        <div class="field"><label>Start Date</label>
          <input type="text" value="${esc(e.start)}" placeholder="Jan 2021" data-i="${i}" data-field="start" autocomplete="off"/></div>
        <div class="field"><label>End Date</label>
          <input type="text" value="${esc(e.end)}" placeholder="Present" data-i="${i}" data-field="end" autocomplete="off"/></div>
        <div class="field"><label>City / State</label>
          <input type="text" value="${esc(e.location)}" placeholder="New York, NY" data-i="${i}" data-field="location" autocomplete="off" spellcheck="false"/></div>
        <div class="field"><label>Employment Type</label>
          <input type="text" value="${esc(e.type)}" placeholder="Full-time" data-i="${i}" data-field="type" autocomplete="off"/></div>
        <div class="field s2"><label>Description</label>
          <textarea data-i="${i}" data-field="description" placeholder="Key responsibilities and achievements..." rows="3">${esc(e.description)}</textarea></div>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', ev => {
      workEntries[+ev.target.dataset.i][ev.target.dataset.field] = ev.target.value;
    });
  });
  list.querySelectorAll('.btn-rm').forEach(btn => {
    btn.addEventListener('click', ev => {
      workEntries.splice(+ev.target.dataset.index, 1);
      renderWorkEntries();
    });
  });
}
document.getElementById('add-work').addEventListener('click', () => { workEntries.push({}); renderWorkEntries(); });

// ─── Education entries ────────────────────────────────────────────────────────
function renderEduEntries() {
  const list = document.getElementById('edu-entries');
  list.innerHTML = '';
  eduEntries.forEach((e, i) => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
      <div class="entry-hdr">
        <span class="entry-num">Education ${i + 1}</span>
        <button class="btn-rm" data-index="${i}" type="button">Remove</button>
      </div>
      <div class="g2">
        <div class="field"><label>School / University</label>
          <input type="text" value="${esc(e.school)}" placeholder="State University" data-i="${i}" data-field="school" autocomplete="off" spellcheck="false"/></div>
        <div class="field"><label>Degree</label>
          <input type="text" value="${esc(e.degree)}" placeholder="Bachelor of Science" data-i="${i}" data-field="degree" autocomplete="off"/></div>
        <div class="field"><label>Field of Study / Discipline</label>
          <input type="text" value="${esc(e.field)}" placeholder="Computer Science" data-i="${i}" data-field="field" autocomplete="off" spellcheck="false"/></div>
        <div class="field"><label>Start Year</label>
          <input type="text" value="${esc(e.startYear)}" placeholder="2018" data-i="${i}" data-field="startYear" autocomplete="off"/></div>
        <div class="field"><label>Graduation Year</label>
          <input type="text" value="${esc(e.grad)}" placeholder="2022" data-i="${i}" data-field="grad" autocomplete="off"/></div>
        <div class="field"><label>GPA</label>
          <input type="text" value="${esc(e.gpa)}" placeholder="3.8" data-i="${i}" data-field="gpa" autocomplete="off"/></div>
        <div class="field"><label>City / State</label>
          <input type="text" value="${esc(e.location)}" placeholder="Boston, MA" data-i="${i}" data-field="location" autocomplete="off" spellcheck="false"/></div>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('input', ev => {
      eduEntries[+ev.target.dataset.i][ev.target.dataset.field] = ev.target.value;
    });
  });
  list.querySelectorAll('.btn-rm').forEach(btn => {
    btn.addEventListener('click', ev => {
      eduEntries.splice(+ev.target.dataset.index, 1);
      renderEduEntries();
    });
  });
}
document.getElementById('add-edu').addEventListener('click', () => { eduEntries.push({}); renderEduEntries(); });

// ─── Tag inputs ───────────────────────────────────────────────────────────────
function makeTagInput(inputId, wrapId, arr) {
  const input = document.getElementById(inputId);
  const wrap  = document.getElementById(wrapId);
  function render() {
    wrap.querySelectorAll('.tag').forEach(t => t.remove());
    arr.forEach((tag, i) => {
      const el = document.createElement('div');
      el.className = 'tag';
      // textContent is XSS-safe
      const txt = document.createTextNode(tag);
      const x = document.createElement('span');
      x.className = 'tag-x';
      x.dataset.i = i;
      x.textContent = '×';
      x.title = 'Remove';
      el.appendChild(txt);
      el.appendChild(x);
      wrap.insertBefore(el, input);
    });
    wrap.querySelectorAll('.tag-x').forEach(x => {
      x.addEventListener('click', ev => { arr.splice(+ev.target.dataset.i, 1); render(); });
    });
  }
  input.addEventListener('keydown', ev => {
    if ((ev.key === 'Enter' || ev.key === ',') && input.value.trim()) {
      ev.preventDefault();
      const val = input.value.replace(/,$/, '').trim().substring(0, 100); // max 100 chars per tag
      if (val && !arr.includes(val) && arr.length < 50) arr.push(val); // max 50 tags
      input.value = ''; render();
    } else if (ev.key === 'Backspace' && !input.value && arr.length) {
      arr.pop(); render();
    }
  });
  render();
  return render;
}
const renderTechTags = makeTagInput('tech-skill-input', 'tech-skills-wrap', techSkills);
const renderSoftTags = makeTagInput('soft-skill-input', 'soft-skills-wrap', softSkills);
const renderLangTags = makeTagInput('lang-input',       'lang-wrap',        languages);

// ─── Custom fields ────────────────────────────────────────────────────────────
function renderCustomFields() {
  const list = document.getElementById('custom-fields-list');
  list.innerHTML = '';
  customFields.forEach((field, i) => {
    const row = document.createElement('div');
    row.className = 'cfield-row';
    row.innerHTML = `
      <input type="text" value="${esc(field.key)}"   placeholder="Field name"  data-i="${i}" data-part="key"   autocomplete="off" maxlength="100"/>
      <input type="text" value="${esc(field.value)}" placeholder="Your answer" data-i="${i}" data-part="value" autocomplete="off" maxlength="500"/>
      <button class="btn-del" data-index="${i}" type="button" title="Remove field">🗑</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll('[data-part]').forEach(el => {
    el.addEventListener('input', ev => {
      customFields[+ev.target.dataset.i][ev.target.dataset.part] = ev.target.value;
    });
  });
  list.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', ev => {
      customFields.splice(+ev.target.dataset.index, 1);
      renderCustomFields();
    });
  });
}
document.getElementById('add-custom').addEventListener('click', () => {
  if (customFields.length >= 30) return; // reasonable limit
  customFields.push({ key: '', value: '' });
  renderCustomFields();
});

// ─── All simple field IDs ─────────────────────────────────────────────────────
const simpleFields = [
  'prefix','firstName','middleName','lastName','suffix','preferredName',
  'email','phone','phoneType','pronouns','dob','summary',
  'street','apt','city','state','zip','country',
  'linkedin','github','portfolio','otherLink',
  'highestEdu',
  'salary','workAuth','sponsorship','remote','empType','startDate',
  'nonCompete','prevEmployed',
  'gender','race','veteran','disability',
  'coverLetter'
];

// URL fields — validated before saving
const urlFields = ['linkedin','github','portfolio','otherLink'];

// ─── Save ─────────────────────────────────────────────────────────────────────
document.getElementById('save-btn').addEventListener('click', () => {
  const data = { workEntries, eduEntries, techSkills, softSkills, languages, customFields };

  simpleFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    let val = el.value;
    // Validate URLs
    if (urlFields.includes(id) && val) val = safeUrl(val);
    // Trim and cap length
    data[id] = val.trim().substring(0, 2000);
  });

  // Save to both sync and local for redundancy
  chrome.storage.sync.set({ profileData: data }, () => {
    if (chrome.runtime.lastError) {
      // Sync has 8KB limit per item — fall back to local only
      chrome.storage.local.set({ profileData: data });
    } else {
      chrome.storage.local.set({ profileData: data });
    }
    const ok = document.getElementById('save-ok');
    ok.classList.add('show');
    setTimeout(() => ok.classList.remove('show'), 2500);
  });
});

// ─── Load ─────────────────────────────────────────────────────────────────────
function loadProfile(p) {
  if (!p || typeof p !== 'object') return;
  simpleFields.forEach(id => {
    const el = document.getElementById(id);
    if (el && p[id] != null) el.value = String(p[id]).substring(0, 2000);
  });
  if (Array.isArray(p.workEntries))  { workEntries.push(...p.workEntries);   renderWorkEntries();  }
  if (Array.isArray(p.eduEntries))   { eduEntries.push(...p.eduEntries);     renderEduEntries();   }
  if (Array.isArray(p.techSkills))   { techSkills.push(...p.techSkills);     renderTechTags();     }
  if (Array.isArray(p.softSkills))   { softSkills.push(...p.softSkills);     renderSoftTags();     }
  if (Array.isArray(p.languages))    { languages.push(...p.languages);       renderLangTags();     }
  if (Array.isArray(p.customFields)) { customFields.push(...p.customFields); renderCustomFields(); }
}

chrome.storage.sync.get('profileData', ({ profileData }) => {
  if (profileData) { loadProfile(profileData); return; }
  chrome.storage.local.get('profileData', ({ profileData: local }) => loadProfile(local));
});
