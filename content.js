// AutoApply – Content Script v2
(function () {
  'use strict';

  let profileData = null;
  let observer = null;
  let fillDebounceTimer = null;

  // ─── Autocomplete map ──────────────────────────────────────────────────────
  const AUTOCOMPLETE_MAP = {
    'given-name':         () => profileData.firstName,
    'first-name':         () => profileData.firstName,
    'family-name':        () => profileData.lastName,
    'last-name':          () => profileData.lastName,
    'name':               () => full(),
    'email':              () => profileData.email,
    'tel':                () => profileData.phone,
    'tel-national':       () => profileData.phone,
    'street-address':     () => profileData.street,
    'address-line1':      () => profileData.street,
    'address-line2':      () => profileData.apt,
    'address-level1':     () => profileData.state,
    'address-level2':     () => profileData.city,
    'postal-code':        () => profileData.zip,
    'country':            () => profileData.country,
    'country-name':       () => profileData.country,
    'organization':       () => profileData.workEntries?.[0]?.company,
    'organization-title': () => profileData.workEntries?.[0]?.title,
    'url':                () => profileData.linkedin || profileData.portfolio,
    'bday':               () => profileData.dob,
    'sex':                () => profileData.gender,
  };

  function full() { return `${profileData.firstName||''} ${profileData.lastName||''}`.trim(); }

  // ─── Site-specific rules (highest priority) ────────────────────────────────
  const SITE_RULES = [
    // iCIMS
    { pattern: /PersonProfileFields\.FirstName/,  value: () => profileData.firstName },
    { pattern: /PersonProfileFields\.LastName/,   value: () => profileData.lastName },
    { pattern: /PersonProfileFields\.Email/,      value: () => profileData.email },
    { pattern: /PersonProfileFields\.Phones/,     value: () => profileData.phone },
    { pattern: /PersonProfileFields\.Address/,    value: () => profileData.street },
    // Workday
    { pattern: /legal.name.fname|legalName.*first/i, value: () => profileData.firstName },
    { pattern: /legal.name.lname|legalName.*last/i,  value: () => profileData.lastName },
    { pattern: /addressLine1/i,                   value: () => profileData.street },
    { pattern: /addressLine2/i,                   value: () => profileData.apt },
    { pattern: /city.name|cityName/i,             value: () => profileData.city },
    { pattern: /countryRegion|state.name/i,       value: () => profileData.state },
    { pattern: /postalCode/i,                     value: () => profileData.zip },
    // Lever
    { pattern: /^name$/i,                         value: () => full() },
    { pattern: /urls\[LinkedIn\]/i,               value: () => profileData.linkedin },
    { pattern: /urls\[GitHub\]/i,                 value: () => profileData.github },
    { pattern: /urls\[Portfolio\]|urls\[Other\]/i,value: () => profileData.portfolio },
    { pattern: /^org$/i,                          value: () => profileData.workEntries?.[0]?.company },
    // Taleo
    { pattern: /^firstName$/i,                    value: () => profileData.firstName },
    { pattern: /^lastName$/i,                     value: () => profileData.lastName },
    { pattern: /eMailAddress/i,                   value: () => profileData.email },
  ];

  // ─── name/id fragment map ──────────────────────────────────────────────────
  const NAME_FRAGMENT_MAP = [
    { pattern: /first.*name|firstname|fname|given.*name/i,        value: () => profileData.firstName },
    { pattern: /last.*name|lastname|lname|family.*name|surname/i,  value: () => profileData.lastName },
    { pattern: /^name$|fullname|full.*name|applicant.*name/i,      value: () => full() },
    { pattern: /email/i,                                           value: () => profileData.email },
    { pattern: /phone|mobile|telephone|cell/i,                     value: () => profileData.phone },
    { pattern: /street|address.*1|addr1|addressline1/i,            value: () => profileData.street },
    { pattern: /address.*2|addr2|addressline2|apt|suite/i,         value: () => profileData.apt },
    { pattern: /\bcity\b/i,                                        value: () => profileData.city },
    { pattern: /\bstate\b|province/i,                              value: () => profileData.state },
    { pattern: /zip|postal/i,                                      value: () => profileData.zip },
    { pattern: /\bcountry\b/i,                                     value: () => profileData.country },
    { pattern: /linkedin/i,                                        value: () => profileData.linkedin },
    { pattern: /github/i,                                          value: () => profileData.github },
    { pattern: /portfolio|website|personalsite/i,                  value: () => profileData.portfolio },
    { pattern: /company|employer|organization/i,                   value: () => profileData.workEntries?.[0]?.company },
    { pattern: /jobtitle|job.*title|title|position|role/i,         value: () => profileData.workEntries?.[0]?.title },
    { pattern: /salary|compensation/i,                             value: () => profileData.salary },
    { pattern: /school|university|college|institution/i,           value: () => profileData.eduEntries?.[0]?.school },
    { pattern: /degree/i,                                          value: () => profileData.eduEntries?.[0]?.degree },
    { pattern: /major|fieldofstudy|discipline/i,                   value: () => profileData.eduEntries?.[0]?.field },
    { pattern: /summary|coverletter|aboutyou|bio/i,                value: () => profileData.summary },
    { pattern: /gender|sex/i,                                      value: () => profileData.gender },
    { pattern: /hispanic|latino/i,                                 value: () => profileData.hispanic },
    { pattern: /\brace\b|ethnicity/i,                              value: () => profileData.race },
    { pattern: /veteran|military/i,                                value: () => profileData.veteran },
    { pattern: /disability|disabled/i,                             value: () => profileData.disability },
    { pattern: /sponsor/i,                                         value: () => profileData.sponsorship },
    { pattern: /workauth|authorization|visastatus/i,               value: () => profileData.workAuth },
    { pattern: /startdate|availabletostart|noticeperiod/i,         value: () => profileData.startDate },
    { pattern: /pronoun/i,                                         value: () => profileData.pronouns },
    { pattern: /preferred.*name|nickname/i,                        value: () => profileData.firstName },
    { pattern: /gpa|gradepoint/i,                                  value: () => profileData.eduEntries?.[0]?.gpa },
    { pattern: /gradyear|graduation.*year/i,                       value: () => profileData.eduEntries?.[0]?.grad },
  ];

  // ─── Label text rules ──────────────────────────────────────────────────────
  function buildLabelRules(p) {
    const work0 = p.workEntries?.[0] || {};
    const edu0  = p.eduEntries?.[0]  || {};
    const cityState = [p.city, p.state].filter(Boolean).join(', ');

    return [
      // ── Core identity ──
      { patterns: [/first\s*name/i, /given\s*name/i],                                        value: p.firstName },
      { patterns: [/last\s*name/i, /family\s*name/i, /surname/i],                            value: p.lastName },
      { patterns: [/full\s*name/i, /your\s*name/i, /^name$/i, /legal\s*name/i],              value: full() },
      { patterns: [/preferred\s*name/i, /nickname/i],                                         value: p.firstName },
      { patterns: [/\bemail\b/i],                                                             value: p.email },
      { patterns: [/\bphone\b/i, /\bmobile\b/i, /telephone/i, /\bcell\b/i],                  value: p.phone },
      { patterns: [/\bpronoun/i],                                                             value: p.pronouns },
      { patterns: [/date\s*of\s*birth/i, /\bdob\b/i, /birthday/i],                           value: p.dob },

      // ── Address ──
      { patterns: [/city.*and.*state/i, /city.*state/i, /city.*reside/i, /location.*city/i], value: cityState },
      { patterns: [/street\s*address/i, /address\s*line\s*1/i, /mailing\s*address/i],        value: p.street },
      { patterns: [/address\s*line\s*2/i, /\bapt\b/i, /apartment/i, /suite/i],               value: p.apt },
      { patterns: [/\bcity\b/i, /\btown\b/i, /location.*city/i],                             value: p.city },
      { patterns: [/\bstate\b/i, /province/i],                                               value: p.state },
      { patterns: [/\bzip\b/i, /postal\s*code/i, /postcode/i],                               value: p.zip },
      { patterns: [/\bcountry\b/i],                                                           value: p.country },

      // ── Work ──
      { patterns: [/current.*employer/i, /\bemployer\b/i, /company\s*name/i, /\bcompany\b/i,
                   /organization/i, /current.*previous.*employer/i, /who is your.*employer/i], value: work0.company },
      { patterns: [/job\s*title/i, /current.*title/i, /\btitle\b/i, /\bposition\b/i,
                   /current.*previous.*job\s*title/i],                                         value: work0.title },
      { patterns: [/years.*experience/i, /total.*experience/i],                               value: calcYearsExp(p.workEntries) },

      // ── Education ──
      { patterns: [/\bschool\b/i, /university/i, /\bcollege\b/i, /institution/i],             value: edu0.school },
      { patterns: [/\bdegree\b/i, /highest.*education/i, /education.*level/i],                value: edu0.degree },
      { patterns: [/field.*of.*study/i, /\bmajor\b/i, /\bdiscipline\b/i, /concentration/i],  value: edu0.field },
      { patterns: [/graduation.*year/i, /grad.*year/i, /start\s*date\s*year/i,
                   /year.*graduated/i, /class\s*of/i],                                        value: edu0.grad },
      { patterns: [/\bgpa\b/i, /grade\s*point/i],                                             value: edu0.gpa },

      // ── Links (Greenhouse groups these in one field) ──
      { patterns: [/linkedin.*github.*portfolio/i, /linkedin.*portfolio/i,
                   /github.*portfolio/i, /portfolio.*website/i,
                   /linkedin\s*profile.*github/i, /personal\s*website/i,
                   /linkedin\s*profile/i],                                                     value: p.linkedin || p.portfolio },
      { patterns: [/\blinkedin\b/i],                                                          value: p.linkedin },
      { patterns: [/\bgithub\b/i],                                                            value: p.github },
      { patterns: [/portfolio/i, /\bwebsite\b/i],                                             value: p.portfolio },

      // ── Job preferences ──
      { patterns: [/desired.*salary/i, /expected.*salary/i, /\bsalary\b/i, /compensation/i], value: p.salary },
      { patterns: [/work.*auth/i, /authorized.*to.*work/i, /eligible.*to.*work/i,
                   /currently.*eligible.*work/i, /legally.*authorized/i],                     value: p.workAuth },
      { patterns: [/\bsponsorship\b/i, /require.*sponsor/i, /visa.*sponsor/i],               value: p.sponsorship },
      { patterns: [/remote.*preference/i, /work.*arrangement/i],                              value: p.remote },
      { patterns: [/available.*to.*start/i, /notice.*period/i, /when.*can.*you.*start/i],     value: p.startDate },

      // ── EEO / self-identification ──
      { patterns: [/\bgender\b/i],                                                            value: p.gender },
      { patterns: [/hispanic/i, /latino/i],                                                   value: p.hispanic },
      { patterns: [/\brace\b/i, /ethnicity/i],                                                value: p.race },
      { patterns: [/veteran\s*status/i, /\bveteran\b/i, /military/i],                        value: p.veteran },
      { patterns: [/disability\s*status/i, /\bdisability\b/i, /\bdisabled\b/i],              value: p.disability },
      // Greenhouse "acknowledge voluntary" checkbox-like dropdown
      { patterns: [/self.identification.*voluntary/i, /acknowledge.*voluntary/i,
                   /voluntary.*self/i],                                                        value: 'Yes' },

      // ── Name extras ──
      { patterns: [/\bprefix\b/i, /\btitle\b.*name/i, /salutation/i],                         value: p.prefix },
      { patterns: [/middle\s*name/i],                                                            value: p.middleName },
      { patterns: [/\bsuffix\b/i],                                                              value: p.suffix },
      { patterns: [/preferred\s*name/i, /\bnickname\b/i, /goes\s*by/i],                       value: p.preferredName || p.firstName },

      // ── Phone extras ──
      { patterns: [/phone\s*device\s*type/i, /device\s*type/i, /phone\s*type/i],              value: p.phoneType },
      { patterns: [/phone\s*extension/i, /ext\b/i],                                             value: '' },

      // ── Education extras ──
      { patterns: [/highest.*education/i, /highest.*degree/i, /education.*level/i,
                   /highest.*level.*education/i],                                                  value: p.highestEdu },
      { patterns: [/\bsat\b.*score/i, /sat\s*score/i],                                         value: p.eduEntries?.[0]?.sat },
      { patterns: [/\bact\b.*score/i, /act\s*score/i],                                         value: p.eduEntries?.[0]?.act },
      { patterns: [/start\s*date.*year/i, /year.*started/i, /enrollment\s*year/i],              value: p.eduEntries?.[0]?.startYear },
      { patterns: [/languages.*speak/i, /languages.*fluent/i, /language.*proficiency/i,
                   /other.*languages/i, /\blanguages\b/i],                                       value: p.languagesText },

      // ── Compensation ──
      { patterns: [/base\s*salary/i, /base\s*comp/i, /salary\s*expect/i,
                   /desired.*salary/i, /expected.*salary/i, /\bsalary\b/i],                     value: p.salary },
      { patterns: [/total\s*comp/i, /total\s*salary/i, /overall\s*comp/i],                     value: p.totalComp },
      { patterns: [/\bcurrency\b/i, /currency\s*type/i],                                       value: p.currency },

      // ── Work situation ──
      { patterns: [/willing.*travel/i, /able.*travel/i, /travel.*required/i,
                   /business.*travel/i],                                                           value: p.travel },
      { patterns: [/work.*on.?site/i, /willing.*on.?site/i, /hybrid.*on.?site/i,
                   /able.*work.*on.?site/i],                                                       value: p.onsite },
      { patterns: [/essential\s*function/i, /perform.*essential/i, /reasonable\s*accommodation/i], value: p.essentialFunctions },
      { patterns: [/non.?compete/i, /patent.*agreement/i, /confidential.*agreement/i,
                   /proprietary.*agreement/i, /signed.*agreement.*prior/i],                       value: p.nonCompete },

      // ── Former employee ──
      { patterns: [/former.*employee/i, /previously.*employed/i, /ever.*been.*employed/i,
                   /worked.*here.*before/i, /prior.*employee/i, /previous.*employee/i],           value: p.prevEmployed || 'No' },

      // ── Additional comments ──
      { patterns: [/additional\s*comments/i, /additional\s*information/i,
                   /anything\s*else/i, /other\s*comments/i],                                    value: p.additionalComments },
      { patterns: [/conference/i, /event.*attend/i, /attend.*conference/i],                      value: p.conferences },

      // ── Name extras ──
      { patterns: [/\bprefix\b/i, /salutation/i],                                               value: p.prefix },
      { patterns: [/middle\s*name/i],                                                            value: p.middleName },
      { patterns: [/\bsuffix\b/i],                                                              value: p.suffix },
      { patterns: [/preferred\s*name/i, /\bnickname\b/i, /goes\s*by/i],                       value: p.preferredName || p.firstName },
      // ── Phone extras ──
      { patterns: [/phone\s*device\s*type/i, /device\s*type/i, /phone\s*type/i],              value: p.phoneType },
      // ── Education extras ──
      { patterns: [/highest.*education/i, /highest.*degree/i, /education.*level/i,
                   /highest.*level.*education/i],                                                  value: p.highestEdu },
      { patterns: [/\bsat\b/i],                                                                 value: p.eduEntries?.[0]?.sat },
      { patterns: [/\bact\b/i],                                                                 value: p.eduEntries?.[0]?.act },
      { patterns: [/start\s*date.*year/i, /enrollment\s*year/i],                               value: p.eduEntries?.[0]?.startYear },
      { patterns: [/languages.*speak/i, /languages.*fluent/i, /language.*proficiency/i,
                   /other.*languages/i],                                                           value: p.languagesText },
      // ── Compensation ──
      { patterns: [/total\s*comp/i, /total\s*salary/i],                                        value: p.totalComp },
      { patterns: [/\bcurrency\b/i, /currency\s*type/i],                                      value: p.currency },
      // ── Work situation ──
      { patterns: [/willing.*travel/i, /able.*travel/i, /business.*travel/i],                    value: p.travel },
      { patterns: [/work.*on.?site/i, /willing.*on.?site/i, /hybrid.*on.?site/i],                value: p.onsite },
      { patterns: [/essential\s*function/i, /reasonable\s*accommodation/i],                    value: p.essentialFunctions },
      { patterns: [/non.?compete/i, /patent.*agreement/i, /signed.*agreement.*prior/i],          value: p.nonCompete },

      // ── Cover letter / summary ──
      { patterns: [/cover\s*letter/i, /about.*yourself/i, /tell.*us.*about/i,
                   /why.*good.*fit/i, /why.*interested/i, /\bsummary\b/i, /\bbio\b/i,
                   /personal\s*statement/i, /little\s*bit\s*about\s*you/i],                   value: p.coverLetter || p.summary },
      { patterns: [/conference/i, /event.*attend/i, /attend.*conference/i],                    value: p.conferences },

      // ── Greenhouse-specific extras ──
      // "Have you ever been employed by Stripe or a Stripe affiliate?"
      { patterns: [/employed.*by.*stripe/i, /previously.*employed/i,
                   /ever.*been.*employed/i, /worked.*here.*before/i],                         value: 'No' },
      // "What is your first/second/third location preference?"
      { patterns: [/first\s*location\s*preference/i, /location\s*preference.*1/i,
                   /preferred.*location/i, /location.*preference/i],                          value: p.city || p.state },

      // ── Custom fields ──
      ...(p.customFields||[]).filter(cf=>cf.key&&cf.value).map(cf=>({
        patterns: [new RegExp(escapeRegex(cf.key), 'i')],
        value: cf.value
      }))
    ];
  }

  function calcYearsExp(entries) {
    if (!entries?.length) return '';
    const starts = entries.map(w=>{const m=(w.start||'').match(/\d{4}/);return m?parseInt(m[0]):null;}).filter(Boolean);
    if (!starts.length) return '';
    return String(new Date().getFullYear() - Math.min(...starts));
  }

  function escapeRegex(str) {
    return (str||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }

  // ─── 4-tier value lookup ───────────────────────────────────────────────────
  function getValueForField(el, labelRules) {
    const rawName = el.getAttribute('name') || '';
    const rawId   = el.getAttribute('id')   || '';

    // Tier 1: site-specific (exact platform patterns)
    for (const rule of SITE_RULES) {
      if (rule.pattern.test(rawName) || rule.pattern.test(rawId)) {
        const v = rule.value(); if (v) return v;
      }
    }

    // Tier 2: autocomplete attribute
    const ac = (el.getAttribute('autocomplete')||'').toLowerCase().trim();
    if (ac && AUTOCOMPLETE_MAP[ac]) { const v = AUTOCOMPLETE_MAP[ac](); if (v) return v; }

    // Tier 3: name/id fragments
    const nameClean = rawName.replace(/[.\[\]]/g,' ');
    const idClean   = rawId.replace(/[.\[\]]/g,' ');
    for (const rule of NAME_FRAGMENT_MAP) {
      if (rule.pattern.test(`${nameClean} ${idClean}`)) { const v = rule.value(); if (v) return v; }
    }

    // Tier 4: visible label + surrounding text
    const labelText = getLabelText(el);
    for (const rule of labelRules) {
      for (const pat of rule.patterns) {
        if (pat.test(labelText) && rule.value) return rule.value;
      }
    }
    return null;
  }

  // ─── Gather all text around an element ────────────────────────────────────
  function getLabelText(el) {
    const parts = [];
    parts.push(
      el.getAttribute('placeholder')||'',
      el.getAttribute('aria-label')||'',
      el.getAttribute('title')||'',
      el.getAttribute('data-label')||'',
      el.getAttribute('data-field')||'',
    );
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      labelledBy.split(' ').forEach(id=>{
        const ref=document.getElementById(id); if(ref) parts.push(ref.textContent);
      });
    }
    if (el.id) {
      try { document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach(l=>parts.push(l.textContent)); } catch(e){}
    }
    let node = el.parentElement;
    for (let i=0; i<8; i++) {
      if (!node) break;
      if (['LABEL','LEGEND'].includes(node.tagName)) parts.push(node.textContent);
      node.querySelectorAll('label,legend,span,p,div,h1,h2,h3,h4,[class*="label"],[class*="Label"],[class*="question"],[class*="Question"]').forEach(child=>{
        const t=(child.textContent||'').trim();
        if (t && t.length < 120) parts.push(t);
      });
      node = node.parentElement;
    }
    let sib = el.previousElementSibling;
    for (let i=0;i<3;i++) {
      if (!sib) break;
      parts.push(sib.textContent||'');
      sib = sib.previousElementSibling;
    }
    return parts.join(' ').toLowerCase().replace(/[*:\(\)]/g,' ').replace(/\s+/g,' ').trim();
  }

  // ─── Fill native input/textarea ───────────────────────────────────────────
  function fillNative(el, value) {
    if (!value) return false;
    if (el.value && el.value.trim()) return false;
    const tag = el.tagName.toLowerCase();
    const proto = tag==='textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto,'value')?.set;

    el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const safeVal = String(value).substring(0, 5000);
    if (setter) setter.call(el, safeVal); else el.value = safeVal;

    el.dispatchEvent(new Event('input',            { bubbles: true }));
    el.dispatchEvent(new Event('change',           { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown',  { bubbles: true, key: 'a' }));
    el.dispatchEvent(new KeyboardEvent('keypress', { bubbles: true, key: 'a' }));
    el.dispatchEvent(new KeyboardEvent('keyup',    { bubbles: true, key: 'a' }));
    el.dispatchEvent(new FocusEvent('blur',        { bubbles: true }));

    // Verify it stuck (some React forms wipe on blur)
    setTimeout(() => {
      if (!el.value || !el.value.trim()) {
        if (setter) setter.call(el, value); else el.value = value;
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 50);

    return true;
  }

  // ─── Fill native <select> with fuzzy matching ──────────────────────────────
  function fillSelect(el, value) {
    if (!value || el.value) return false;
    const lower = value.toLowerCase();
    let bestOpt = null, bestScore = 0;
    for (const opt of el.options) {
      if (!opt.value) continue;
      const ov = opt.value.toLowerCase();
      const ot = opt.text.toLowerCase();
      if (ov === lower || ot === lower) { bestOpt = opt; bestScore = 1; break; }
      if (ot.includes(lower) || lower.includes(ot)) {
        const score = Math.min(ot.length, lower.length) / Math.max(ot.length, lower.length);
        if (score > bestScore) { bestScore = score; bestOpt = opt; }
      }
    }
    if (bestOpt && bestScore > 0.3) {
      el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      el.value = bestOpt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      return true;
    }
    return false;
  }

  // ─── Custom dropdown widgets (Greenhouse uses these for selects) ───────────
  function tryCustomDropdown(container, value) {
    if (!value) return false;
    const trigger = container.querySelector('button,[role="button"],[tabindex="0"],.select__control,.custom-select') || container;
    trigger.click();
    setTimeout(() => {
      const lower = value.toLowerCase();
      // Look for options anywhere in the document (they often render in a portal)
      const options = document.querySelectorAll('[role="option"],[role="listitem"],[class*="option"],[class*="Option"],[class*="select__option"]');
      let matched = false;
      for (const opt of options) {
        const t = (opt.textContent||'').trim().toLowerCase();
        if (t === lower || t.includes(lower) || lower.includes(t)) {
          opt.click(); matched = true; break;
        }
      }
      if (!matched) document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    }, humanDelay(150, 300));
    return true;
  }

  // ─── Resume upload helper ──────────────────────────────────────────────────
  function handleResumeFields() {
    document.querySelectorAll('input[type="file"]').forEach(el => {
      if (el.dataset.autoapplyResume) return;
      el.dataset.autoapplyResume = '1';
      const wrap = el.closest('label,div,section') || el.parentElement;
      if (wrap) { wrap.style.outline = '2px dashed #e8c97a'; wrap.style.outlineOffset = '4px'; }
      const badge = document.createElement('div');
      badge.textContent = '⬆ Click to upload your resume';
      badge.style.cssText = 'display:inline-block;margin:6px 0;padding:5px 12px;background:#e8c97a;color:#0f0e0d;border-radius:6px;font-size:12px;font-weight:700;font-family:sans-serif;cursor:pointer;z-index:9999;';
      badge.addEventListener('click', () => el.click());
      el.insertAdjacentElement('afterend', badge);
    });
  }

  // ─── Human-like timing ────────────────────────────────────────────────────
  function humanDelay(min=80, max=200) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ─── Main fill ────────────────────────────────────────────────────────────
  async function fillPage() {
    if (!profileData) return 0;
    const labelRules = buildLabelRules(profileData);

    const inputs = [...document.querySelectorAll(
      'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]):not([type=checkbox]):not([type=radio]):not([type=image]), textarea, select'
    )].filter(el => !el.disabled && !el.readOnly);

    // Build fill queue
    const queue = [];
    inputs.forEach(el => {
      const value = getValueForField(el, labelRules);
      if (value) queue.push({ el, value });
    });

    // Custom dropdown widgets
    document.querySelectorAll('[role="combobox"]:not([data-autoapply-tried]),[class*="select__control"]:not([data-autoapply-tried])').forEach(el => {
      el.setAttribute('data-autoapply-tried','1');
      const value = getValueForField(el, labelRules);
      if (value) queue.push({ el, value, isCombobox: true });
    });

    // Fill sequentially with human delays
    let filled = 0;
    for (const { el, value, isCombobox } of queue) {
      await new Promise(resolve => {
        setTimeout(() => {
          let ok = false;
          if (isCombobox)               ok = tryCustomDropdown(el, value);
          else if (el.tagName === 'SELECT') ok = fillSelect(el, value);
          else                           ok = fillNative(el, value);
          if (ok) filled++;
          resolve();
        }, humanDelay(60, 160));
      });
    }

    handleResumeFields();
    return filled;
  }

  // ─── MutationObserver ─────────────────────────────────────────────────────
  function startObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      const hasNew = mutations.some(m =>
        [...m.addedNodes].some(n =>
          n.nodeType===1 && (n.matches?.('input,select,textarea') || n.querySelector?.('input,select,textarea'))
        )
      );
      if (!hasNew) return;
      clearTimeout(fillDebounceTimer);
      fillDebounceTimer = setTimeout(() => { if (profileData) fillPage(); }, 800);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Expose for popup injection ───────────────────────────────────────────
  window.__autoapplyFill = () => {
    if (window.__autoapplyProfile && !profileData) profileData = window.__autoapplyProfile;
    if (!profileData) return Promise.resolve(0);
    return fillPage();
  };

  window.addEventListener('autoapply-setprofile', (e) => {
    profileData = e.detail;
    startObserver();
  });

  // ─── Message listener ─────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'setProfile') { profileData = msg.profile; sendResponse({ ok: true }); return true; }
    if (msg.action === 'fill') { fillPage().then(n => sendResponse({ filled: n })); return true; }
    if (msg.action === 'ping') sendResponse({ ok: true });
  });

  // ─── Load profile ─────────────────────────────────────────────────────────
  if (window.__autoapplyProfile) {
    profileData = window.__autoapplyProfile;
    startObserver();
  } else {
    chrome.storage.sync.get('profileData', ({ profileData: data }) => {
      if (data) { profileData = data; startObserver(); }
      else chrome.storage.local.get('profileData', ({ profileData: d }) => {
        profileData = d || null;
        if (profileData) startObserver();
      });
    });
  }

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.profileData) { profileData = changes.profileData.newValue; if (profileData && !observer) startObserver(); }
  });

})();
