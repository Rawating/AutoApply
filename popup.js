const fillBtn     = document.getElementById('fill-btn');
const settingsBtn = document.getElementById('settings-btn');
const statusEl    = document.getElementById('profile-status');
const resultEl    = document.getElementById('result');
const debugBox    = document.getElementById('debug-box');
const debugToggle = document.getElementById('debug-toggle');

let savedProfile = null;

// ─── Load best profile from sync + local ──────────────────────────────────────
function loadBestProfile(cb) {
  chrome.storage.sync.get('profileData', ({ profileData: s }) => {
    chrome.storage.local.get('profileData', ({ profileData: l }) => {
      cb(countFields(s) >= countFields(l) ? s : l);
    });
  });
}
function countFields(p) {
  if (!p) return 0;
  return Object.values(p).filter(v => v && (typeof v === 'string' ? v.trim() : true)).length;
}

loadBestProfile((profile) => {
  savedProfile = profile;
  if (!profile) {
    statusEl.textContent = 'No profile saved yet';
    statusEl.className = 'status-val empty';
    fillBtn.disabled = true;
    showDebug(null);
    return;
  }
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  statusEl.textContent = '✓ ' + (name || profile.email || 'Profile loaded');
  statusEl.className = 'status-val ok';
  fillBtn.disabled = false;
  showDebug(profile);
});

// ─── Debug panel ──────────────────────────────────────────────────────────────
function showDebug(profile) {
  const fields = [
    ['firstName','First Name'],['lastName','Last Name'],['email','Email'],
    ['phone','Phone'],['street','Street'],['city','City'],
    ['state','State'],['zip','ZIP'],['linkedin','LinkedIn'],['salary','Salary'],
  ];
  debugBox.innerHTML = fields.map(([key, label]) => {
    const val = profile?.[key];
    const filled = val && String(val).trim();
    return `<div class="debug-row ${filled ? '' : 'missing'}">
      <span>${label}</span>
      <span>${filled ? String(val).substring(0,28) : '—'}</span>
    </div>`;
  }).join('');
}

debugToggle.addEventListener('click', () => {
  debugBox.classList.toggle('show');
  debugToggle.textContent = debugBox.classList.contains('show')
    ? '▴ hide profile data' : '▾ show profile data';
});

// ─── Fill button ──────────────────────────────────────────────────────────────
fillBtn.addEventListener('click', async () => {
  fillBtn.disabled = true;
  fillBtn.textContent = 'Filling…';
  resultEl.textContent = '';
  resultEl.className = 'result';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    // Inject profile into ALL frames (including iframes like Greenhouse)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: (profile) => {
        // Set profile on the window so content.js can pick it up
        window.__autoapplyProfile = profile;
        // Also fire a custom event in case content script is already listening
        window.dispatchEvent(new CustomEvent('autoapply-setprofile', { detail: profile }));
      },
      args: [savedProfile]
    });

    // Small delay to let the profile set
    await new Promise(r => setTimeout(r, 100));

    // Now trigger fill in ALL frames
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => {
        // Trigger fill if content script is loaded
        if (window.__autoapplyFill) return window.__autoapplyFill();
        return 0;
      }
    });

    const totalFilled = results.reduce((sum, r) => sum + (r.result || 0), 0);

    if (totalFilled > 0) {
      resultEl.textContent = `✓ Filled ${totalFilled} field${totalFilled === 1 ? '' : 's'}`;
      resultEl.className = 'result ok';
    } else {
      resultEl.textContent = 'No matching fields found.';
      resultEl.className = 'result warn';
    }
  } catch (e) {
    console.error('[AutoApply]', e);
    resultEl.textContent = 'Error: ' + e.message;
    resultEl.className = 'result err';
  }

  fillBtn.disabled = false;
  fillBtn.textContent = '⚡ Fill This Page';
});

settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
