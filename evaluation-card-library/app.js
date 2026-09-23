const SUPABASE_URL = 'https://mpduoubbicoxoulhkfen.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZHVvdWJiaWNveG91bGhrZmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NTUyMDMsImV4cCI6MjEwNTEzMTIwM30.M5o_lTEvSFXzv1y9s3hsAIOuVsjM76RuTPsvAbeKpXw';
const ADMIN_EMAIL = 'cgao@stu.ecnu.edu.cn';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const evaluationLabels = { quantitative: 'Quantitative', qualitative: 'Qualitative', mixed: 'Mixed methods' };
const statisticalLabels = { concept: 'Study design concept', 'two-group': 'Two-group comparison', 'multi-group': 'Multi-group comparison' };
const stageLabels = { formative: 'Formative', comparative: 'Comparative', validation: 'Validation', deployment: 'Deployment' };
const PAGE_SIZE = 6;
const SYSTEM_CHANGELOG = [
  {
    version: '2.1.0', date: '2026-09-23', title: 'Focused method cards',
    changes: ['Refocused cards on classification, key characteristics, when to use, assumptions, limitations, and sources.', 'Removed the Study Plan module.', 'Separated the system release log from method-level edit history.']
  },
  {
    version: '2.0.0', date: '2026-09-23', title: 'Evaluation & Analysis expansion',
    changes: ['Renamed the library to Evaluation & Analysis Method Library.', 'Added nine statistical methods and three decision guides.', 'Added the Statistical Test Selector.']
  },
  {
    version: '1.3.0', date: '2026-09-18', title: 'Browsing improvements',
    changes: ['Added six-card pagination.', 'Improved search and form alignment.', 'Simplified category labels on cards.']
  },
  {
    version: '1.2.0', date: '2026-09-18', title: 'Collaborative library workflow',
    changes: ['Added email sign-in, administrator editing, favorites, and card comparison.', 'Added CSV import, library export, soft deletion, and method-level version recovery.']
  },
  {
    version: '1.0.0', date: '2026-09-17', title: 'Initial evaluation library',
    changes: ['Published the first 13 evaluation cards with search and category filters.']
  }
];
const versionFields = [
  'id', 'method_type', 'category', 'stat_category', 'analysis_modes', 'name', 'stage', 'evidence',
  'summary', 'claim', 'suitable', 'design', 'analysis', 'misuse', 'alternative',
  'reference_paper', 'method_source', 'stat_details'
];

let methods = [];
let session = null;
let isAdmin = false;
let favorites = new Set();
let selected = new Set();
let activeModule = 'evaluation';
let activeCategory = 'all';
let favoriteOnly = false;
let wizardScores = null;
let currentPage = 1;

const els = {
  grid: $('#cardGrid'), guides: $('#guidesGrid'), count: $('#resultCount'), resultLabel: $('#resultLabel'),
  empty: $('#emptyState'), filters: $('#categoryFilters'), search: $('#searchInput'), stage: $('#stageFilter'),
  relationship: $('#relationshipFilter'), sync: $('#syncStatus'), auth: $('#authButton'), add: $('#addButton'),
  tools: $('#adminToolsButton'), detail: $('#detailModal'), panel: $('#detailPanel'), tray: $('#compareTray'),
  pagination: $('#pagination')
};

function openModal(id) {
  $('#' + id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(target) {
  (typeof target === 'string' ? $('#' + target) : target).classList.remove('open');
  document.body.style.overflow = '';
}

function toast(text) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = text;
  document.body.append(node);
  setTimeout(() => node.remove(), 2600);
}

function linkify(text) {
  return escapeHtml(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function download(name, text, type = 'text/plain') {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function slug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54) || 'research-method';
}

function normalizeMethod(method) {
  const type = method.method_type || 'evaluation';
  return {
    ...method,
    method_type: type,
    category: method.category || (type === 'statistical' ? 'statistical' : 'mixed'),
    stat_category: method.stat_category || null,
    analysis_modes: method.analysis_modes || [],
    stage: method.stage || [],
    evidence: method.evidence || [],
    stat_details: method.stat_details || {},
    reference_paper: method.reference_paper || 'Reference will appear after the database upgrade.',
    method_source: method.method_source || 'Method source will appear after the database upgrade.'
  };
}

function moduleMethods(module = activeModule) {
  if (module === 'guides') return [];
  return methods.filter(method => method.method_type === module);
}

function moduleName(type) {
  return type === 'statistical' ? 'Statistical Method' : 'Evaluation Method';
}

async function initialize() {
  bindEvents();
  const { data } = await db.auth.getSession();
  await setSession(data.session);
  db.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
  await loadMethods();
  openFromHash();
}

async function setSession(nextSession) {
  session = nextSession;
  isAdmin = session?.user?.email?.toLowerCase() === ADMIN_EMAIL;
  els.auth.textContent = session ? `Sign out · ${session.user.email.split('@')[0]}` : 'Sign in';
  $$('.admin-only').forEach(node => { node.hidden = !isAdmin; });
  await loadFavorites();
  if (methods.length) render();
}

async function loadMethods() {
  els.sync.textContent = 'Syncing…';
  let { data, error } = await db.from('cards').select('*').is('deleted_at', null).order('name');
  if (error?.message?.includes('deleted_at')) ({ data, error } = await db.from('cards').select('*').order('name'));
  const cloudMethods = (data || []).map(normalizeMethod);
  const fallbackStatistical = (window.STATISTICAL_METHODS || []).map(normalizeMethod);
  const cloudIds = new Set(cloudMethods.map(method => method.id));
  methods = [...cloudMethods, ...fallbackStatistical.filter(method => !cloudIds.has(method.id))];
  if (error && !cloudMethods.length) {
    els.sync.textContent = 'Using built-in methods';
    methods = fallbackStatistical;
  } else {
    els.sync.textContent = error ? 'Partially synced' : 'Cloud synced';
  }
  buildFilters();
  render();
}

async function loadFavorites() {
  favorites.clear();
  if (session) {
    const { data } = await db.from('favorites').select('card_id').eq('user_id', session.user.id);
    (data || []).forEach(row => favorites.add(row.card_id));
  }
  $('#favoriteCount').textContent = favorites.size;
}

function setModule(module) {
  activeModule = module;
  activeCategory = 'all';
  favoriteOnly = false;
  wizardScores = null;
  selected.clear();
  currentPage = 1;
  els.search.value = '';
  els.stage.value = 'all';
  els.relationship.value = 'all';
  $('#clearWizardButton').hidden = true;
  $('#favoritesFilter').classList.remove('active');
  $$('.module-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.module === module));
  $('#sidebar').hidden = module === 'guides';
  $('#discoveryBar').hidden = module === 'guides';
  els.grid.hidden = module === 'guides';
  els.guides.hidden = module !== 'guides';
  els.tray.hidden = true;
  buildFilters();
  render();
}

function buildFilters() {
  if (activeModule === 'guides') return;
  const source = moduleMethods();
  const definitions = activeModule === 'evaluation'
    ? [['all', 'All evaluation methods'], ['quantitative', 'Quantitative'], ['qualitative', 'Qualitative'], ['mixed', 'Mixed methods']]
    : [['all', 'All statistical methods'], ['concept', 'Study design concepts'], ['two-group', 'Two-group comparisons'], ['multi-group', 'Multi-group comparisons']];
  $('#categoryTitle').textContent = activeModule === 'evaluation' ? 'Primary category' : 'Method family';
  $('#evaluationFilters').hidden = activeModule !== 'evaluation';
  $('#statisticalFilters').hidden = activeModule !== 'statistical';
  els.filters.innerHTML = definitions.map(([key, label]) => {
    const count = key === 'all' ? source.length : source.filter(method => (activeModule === 'evaluation' ? method.category : method.stat_category) === key).length;
    return `<button class="filter-button ${activeCategory === key ? 'active' : ''}" data-cat="${key}"><i class="dot ${key === 'all' ? '' : key}"></i><span>${label}</span><span class="count">${count}</span></button>`;
  }).join('');
}

function filteredMethods() {
  const query = els.search.value.trim().toLowerCase();
  const stage = els.stage.value;
  const relationship = els.relationship.value;
  let list = moduleMethods().filter(method => {
    const category = activeModule === 'evaluation' ? method.category : method.stat_category;
    const detail = method.stat_details || {};
    const categoryMatch = activeCategory === 'all' || category === activeCategory;
    const stageMatch = activeModule !== 'evaluation' || stage === 'all' || method.stage.includes(stage);
    const relationshipMatch = activeModule !== 'statistical' || relationship === 'all' || String(detail.sample_relationship || '').toLowerCase().includes(relationship);
    const favoriteMatch = !favoriteOnly || favorites.has(method.id);
    const haystack = [method.name, method.summary, method.claim, method.suitable, method.analysis, method.misuse,
      method.reference_paper, method.method_source, ...method.evidence, ...Object.values(detail)].join(' ').toLowerCase();
    return categoryMatch && stageMatch && relationshipMatch && favoriteMatch && (!query || haystack.includes(query));
  });
  if (wizardScores) {
    list = list.filter(method => wizardScores[method.id] > 0).sort((a, b) => wizardScores[b.id] - wizardScores[a.id]);
  }
  return list;
}

function render() {
  if (activeModule === 'guides') {
    renderGuides();
    return;
  }
  const list = filteredMethods();
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(1, currentPage), pageCount);
  const visible = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  els.count.textContent = list.length;
  els.resultLabel.innerHTML = `<strong id="resultCount">${list.length}</strong> ${activeModule === 'evaluation' ? 'evaluation' : 'statistical'} methods`;
  els.empty.hidden = Boolean(list.length);
  els.grid.innerHTML = visible.map(renderCard).join('');
  renderPagination(list.length, pageCount);
  bindCardEvents();
  $('#favoriteCount').textContent = favorites.size;
}

function renderCard(method) {
  const isStatistical = method.method_type === 'statistical';
  const family = isStatistical ? statisticalLabels[method.stat_category] : 'Evaluation method';
  const details = method.stat_details || {};
  const chips = isStatistical
    ? [details.sample_relationship, details.outcome_type, details.group_count].filter(Boolean)
    : [...method.evidence.slice(0, 2), ...method.stage.slice(0, 1).map(value => stageLabels[value])];
  const analysisMode = isStatistical ? 'Quantitative' : evaluationLabels[method.category];
  return `<article class="method-card ${isStatistical ? `statistical ${method.stat_category}` : method.category}" data-id="${escapeHtml(method.id)}" tabindex="0">
    ${wizardScores ? `<span class="recommend">${wizardScores[method.id]} match points</span>` : ''}
    <div class="card-classification"><span class="mode primary">${escapeHtml(analysisMode)}</span><span>${escapeHtml(family || moduleName(method.method_type))}</span></div>
    <div class="card-head"><h3>${escapeHtml(method.name)}</h3></div>
    <p class="mini">KEY CHARACTERISTICS</p><p class="summary">${escapeHtml(method.summary)}</p>
    <p class="mini">WHEN TO USE</p><p class="claim">${escapeHtml(method.suitable)}</p>
    <div class="tags">${chips.slice(0, 3).map(value => `<span class="tag">${escapeHtml(value)}</span>`).join('')}</div>
    <div class="card-actions"><label><input class="compare-check" type="checkbox" ${selected.has(method.id) ? 'checked' : ''}> Compare</label><button class="star ${favorites.has(method.id) ? 'active' : ''}" aria-label="Favorite">${favorites.has(method.id) ? '★' : '☆'}</button></div>
  </article>`;
}

function renderPagination(total, pageCount) {
  els.pagination.hidden = total <= PAGE_SIZE;
  els.pagination.innerHTML = total > PAGE_SIZE ? `
    <button class="page-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>
    ${Array.from({ length: pageCount }, (_, index) => `<button class="page-button ${currentPage === index + 1 ? 'active' : ''}" data-page="${index + 1}" ${currentPage === index + 1 ? 'aria-current="page"' : ''}>${index + 1}</button>`).join('')}
    <span class="page-status">Page ${currentPage} of ${pageCount}</span>
    <button class="page-button" data-page="${currentPage + 1}" ${currentPage === pageCount ? 'disabled' : ''}>Next ›</button>` : '';
}

function bindCardEvents() {
  $$('.method-card', els.grid).forEach(card => {
    card.onclick = event => {
      if (!event.target.closest('.compare-check') && !event.target.closest('.star')) openDetail(card.dataset.id);
    };
    card.onkeydown = event => { if (event.key === 'Enter') openDetail(card.dataset.id); };
    $('.compare-check', card).onchange = event => toggleCompare(card.dataset.id, event.target.checked);
    $('.star', card).onclick = () => toggleFavorite(card.dataset.id);
  });
}

function renderGuides() {
  els.resultLabel.innerHTML = '<strong>3</strong> decision guides';
  els.empty.hidden = true;
  els.pagination.hidden = true;
  els.guides.innerHTML = `
    <article class="guide-card"><span>01 · EVALUATION DESIGN</span><h3>Evaluation Method Wizard</h3><p>Start from your research goal, evidence, setting, and resources.</p><button class="button guide-launch" data-guide="evaluation">Start evaluation guide →</button></article>
    <article class="guide-card"><span>02 · STATISTICAL ANALYSIS</span><h3>Statistical Test Selector</h3><p>Match sample relationship, number of conditions, outcome type, and estimand.</p><button class="button guide-launch" data-guide="statistical">Select a statistical method →</button></article>
    <article class="guide-card featured"><span>03 · FOUNDATIONAL CONCEPT</span><h3>Independent or Paired?</h3><p>Resolve the design decision that determines the correct family of tests.</p><button class="button guide-detail" data-id="independent-vs-paired-samples">Open guide →</button></article>`;
  $$('.guide-launch', els.guides).forEach(button => { button.onclick = () => openWizard(button.dataset.guide); });
  $$('.guide-detail', els.guides).forEach(button => { button.onclick = () => openDetail(button.dataset.id); });
}

async function toggleFavorite(id) {
  if (!session) {
    openModal('authModal');
    return;
  }
  if (favorites.has(id)) {
    await db.from('favorites').delete().eq('user_id', session.user.id).eq('card_id', id);
    favorites.delete(id);
  } else {
    const { error } = await db.from('favorites').insert({ user_id: session.user.id, card_id: id });
    if (error) return toast(error.message);
    favorites.add(id);
  }
  render();
}

function toggleCompare(id, checked) {
  const method = methods.find(item => item.id === id);
  const selectedMethods = [...selected].map(value => methods.find(item => item.id === value)).filter(Boolean);
  if (checked && selectedMethods.some(item => item.method_type !== method.method_type)) {
    toast('Compare methods from the same library section.');
    render();
    return;
  }
  if (checked && selected.size >= 3) {
    toast('Select no more than 3 methods.');
    render();
    return;
  }
  checked ? selected.add(id) : selected.delete(id);
  $('#compareCount').textContent = selected.size;
  els.tray.hidden = selected.size < 1;
  render();
}

function compareMethods() {
  if (selected.size < 2) return toast('Select 2–3 methods to compare.');
  const chosen = [...selected].map(id => methods.find(method => method.id === id)).filter(Boolean);
  const statistical = chosen[0].method_type === 'statistical';
  const rows = statistical ? [
    ['Analysis mode', () => 'Quantitative'],
    ['Method family', method => statisticalLabels[method.stat_category]],
    ['What it compares or estimates', method => method.claim],
    ['When to use', method => method.suitable],
    ['Outcome type', method => method.stat_details?.outcome_type],
    ['Groups / conditions', method => method.stat_details?.group_count],
    ['Sample relationship', method => method.stat_details?.sample_relationship],
    ['Key assumptions', method => method.stat_details?.assumptions],
    ['Common misuse', method => method.misuse],
    ['Reference', method => method.reference_paper]
  ] : [
    ['Analysis mode', method => method.analysis_modes.map(value => evaluationLabels[value] || value).join(', ') || evaluationLabels[method.category]],
    ['Primary classification', method => evaluationLabels[method.category]],
    ['When to use', method => method.suitable],
    ['Study design', method => method.design],
    ['Data & analysis', method => method.analysis],
    ['Common misuse', method => method.misuse],
    ['Research stages', method => method.stage.map(value => stageLabels[value]).join(', ')],
    ['Reference', method => method.reference_paper]
  ];
  $('#compareContent').innerHTML = `<table class="compare-table"><thead><tr><th>Dimension</th>${chosen.map(method => `<th>${escapeHtml(method.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([label, value]) => `<tr><th>${label}</th>${chosen.map(method => `<td>${escapeHtml(value(method) || '—')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  openModal('compareModal');
}

function openDetail(id) {
  const method = methods.find(item => item.id === id);
  if (!method) return;
  const statistical = method.method_type === 'statistical';
  const detail = method.stat_details || {};
  const kicker = statistical ? `Quantitative · ${statisticalLabels[method.stat_category] || 'Statistical method'}` : `${evaluationLabels[method.category]} · Evaluation method`;
  const body = statistical ? `
    <section class="detail-block"><h3>Analysis mode</h3><p>Quantitative</p></section>
    <section class="detail-block"><h3>Method family</h3><p>${escapeHtml(statisticalLabels[method.stat_category])}</p></section>
    <section class="detail-block wide"><h3>When to use</h3><p>${escapeHtml(method.suitable)}</p></section>
    <section class="detail-block"><h3>Outcome type</h3><p>${escapeHtml(detail.outcome_type)}</p></section>
    <section class="detail-block"><h3>Groups / conditions</h3><p>${escapeHtml(detail.group_count)}</p></section>
    <section class="detail-block"><h3>Sample relationship</h3><p>${escapeHtml(detail.sample_relationship)}</p></section>
    <section class="detail-block"><h3>What it compares or estimates</h3><p>${escapeHtml(method.claim)}</p></section>
    <section class="detail-block wide"><h3>Key assumptions</h3><p>${escapeHtml(detail.assumptions)}</p></section>
    <section class="detail-block warning wide"><h3>Common misuse / limitations</h3><p>${escapeHtml(method.misuse)}</p></section>` : `
    <section class="detail-block"><h3>Analysis mode</h3><p>${escapeHtml(method.analysis_modes.map(value => evaluationLabels[value] || value).join(', ') || evaluationLabels[method.category])}</p></section>
    <section class="detail-block"><h3>Primary classification</h3><p>${escapeHtml(evaluationLabels[method.category])}</p></section>
    <section class="detail-block wide"><h3>When to use</h3><p>${escapeHtml(method.suitable)}</p></section>
    <section class="detail-block"><h3>Research stages</h3><p>${escapeHtml(method.stage.map(value => stageLabels[value] || value).join(', '))}</p></section>
    <section class="detail-block"><h3>Evidence produced</h3><p>${escapeHtml(method.evidence.join(', '))}</p></section>
    <section class="detail-block"><h3>Study design</h3><p>${escapeHtml(method.design)}</p></section>
    <section class="detail-block"><h3>Typical data & analysis</h3><p>${escapeHtml(method.analysis)}</p></section>
    <section class="detail-block warning wide"><h3>Common misuse / limitations</h3><p>${escapeHtml(method.misuse)}</p></section>`;
  const color = statistical ? '#4056a1' : method.category === 'quantitative' ? '#176b87' : method.category === 'qualitative' ? '#c84600' : '#7557a6';
  els.panel.style.setProperty('--cat', color);
  els.panel.innerHTML = `<button class="icon-button close-detail">×</button><p class="detail-kicker">${escapeHtml(kicker)}</p><h2>${escapeHtml(method.name)}</h2><p class="detail-summary"><b>Key characteristics:</b> ${escapeHtml(method.summary)}</p><div class="detail-grid">${body}<section class="detail-block wide"><h3>Reference paper</h3><p>${linkify(method.reference_paper)}</p></section><section class="detail-block wide"><h3>Method source</h3><p>${linkify(method.method_source)}</p></section></div><div class="detail-actions"><button class="button favorite-detail">${favorites.has(method.id) ? '★ Favorited' : '☆ Favorite'}</button><button class="button share-card">Copy method link</button>${isAdmin ? '<button class="button edit-card">Edit</button><button class="button history-card">History</button><button class="button danger delete-card">Move to recycle bin</button>' : ''}</div>`;
  $('.close-detail', els.panel).onclick = closeDetail;
  $('.favorite-detail', els.panel).onclick = async () => { await toggleFavorite(method.id); openDetail(method.id); };
  $('.share-card', els.panel).onclick = () => navigator.clipboard.writeText(`${location.origin}${location.pathname}#card=${encodeURIComponent(method.id)}`).then(() => toast('Method link copied.'));
  if (isAdmin) {
    $('.edit-card', els.panel).onclick = () => openCardForm(method);
    $('.history-card', els.panel).onclick = () => openHistory(method.id);
    $('.delete-card', els.panel).onclick = () => softDelete(method);
  }
  location.hash = 'card=' + encodeURIComponent(id);
  els.detail.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  els.detail.classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search);
}

function openFromHash() {
  const id = new URLSearchParams(location.hash.slice(1)).get('card');
  if (id) openDetail(id);
}

function updateFormType(type) {
  $('#evaluationFormFields').hidden = type !== 'evaluation';
  $('#statisticalFormFields').hidden = type !== 'statistical';
}

function openCardForm(method = null) {
  const form = $('#cardForm');
  form.reset();
  const type = method?.method_type || (activeModule === 'statistical' ? 'statistical' : 'evaluation');
  form.elements.editingId.value = method?.id || '';
  form.elements.methodType.value = type;
  form.elements.preservedClaim.value = method?.claim || '';
  form.elements.preservedAlternative.value = method?.alternative || '';
  form.elements.preservedStatDetails.value = JSON.stringify(method?.stat_details || {});
  $('#cardFormTitle').textContent = method ? `Edit ${moduleName(type).toLowerCase()}` : `Add ${moduleName(type).toLowerCase()}`;
  updateFormType(type);
  if (method) {
    for (const name of ['name', 'summary', 'suitable', 'misuse']) form.elements[name].value = method[name] || '';
    form.elements.referencePaper.value = method.reference_paper || '';
    form.elements.methodSource.value = method.method_source || '';
    if (type === 'evaluation') {
      for (const name of ['category', 'design', 'analysis']) form.elements[name].value = method[name] || '';
      form.elements.evidence.value = method.evidence.join(', ');
      $$('[name="analysisModes"]', form).forEach(input => { input.checked = method.analysis_modes.includes(input.value); });
      $$('[name="stages"]', form).forEach(input => { input.checked = method.stage.includes(input.value); });
    } else {
      const detail = method.stat_details || {};
      form.elements.statCategory.value = method.stat_category || 'two-group';
      form.elements.statTarget.value = method.claim || '';
      form.elements.outcomeType.value = detail.outcome_type || '';
      form.elements.groupCount.value = detail.group_count || '';
      form.elements.sampleRelationship.value = detail.sample_relationship || '';
      form.elements.assumptions.value = detail.assumptions || '';
    }
  }
  $('#cardMessage').textContent = '';
  openModal('cardModal');
}

function formRecord(form) {
  const data = new FormData(form);
  const type = String(data.get('methodType'));
  const preservedClaim = String(data.get('preservedClaim') || '').trim();
  const preservedAlternative = String(data.get('preservedAlternative') || '').trim();
  const base = {
    method_type: type,
    name: String(data.get('name')).trim(),
    summary: String(data.get('summary')).trim(),
    claim: type === 'statistical' ? String(data.get('statTarget') || '').trim() : preservedClaim || String(data.get('suitable') || '').trim(),
    suitable: String(data.get('suitable')).trim(),
    misuse: String(data.get('misuse')).trim(),
    alternative: preservedAlternative || 'Not specified.',
    reference_paper: String(data.get('referencePaper')).trim(),
    method_source: String(data.get('methodSource')).trim(),
    updated_at: new Date().toISOString(),
    updated_by: session.user.id
  };
  if (type === 'evaluation') {
    const category = String(data.get('category'));
    const stage = data.getAll('stages');
    const evidence = String(data.get('evidence')).split(',').map(value => value.trim()).filter(Boolean);
    if (!stage.length) throw Error('Select at least one research stage.');
    if (!evidence.length) throw Error('Enter at least one evidence tag.');
    return { ...base, category, stat_category: null, analysis_modes: [...new Set([category, ...data.getAll('analysisModes')])], stage, evidence, design: String(data.get('design')).trim(), analysis: String(data.get('analysis')).trim(), stat_details: {} };
  }
  const detailNames = ['statTarget', 'outcomeType', 'groupCount', 'sampleRelationship', 'assumptions'];
  if (detailNames.some(name => !String(data.get(name) || '').trim())) throw Error('Complete every statistical method field.');
  let preservedDetails = {};
  try { preservedDetails = JSON.parse(String(data.get('preservedStatDetails') || '{}')); } catch (_) { preservedDetails = {}; }
  return {
    ...base,
    category: 'mixed', stat_category: String(data.get('statCategory')), analysis_modes: [], stage: [],
    evidence: [String(data.get('outcomeType')), String(data.get('sampleRelationship')), String(data.get('groupCount'))],
    design: '', analysis: '',
    stat_details: {
      ...preservedDetails,
      purpose: preservedDetails.purpose || String(data.get('statTarget')).trim(), outcome_type: String(data.get('outcomeType')).trim(),
      group_count: String(data.get('groupCount')).trim(), sample_relationship: String(data.get('sampleRelationship')).trim(),
      assumptions: String(data.get('assumptions')).trim()
    }
  };
}

async function saveVersion(card, action) {
  return db.from('card_versions').insert({ card_id: card.id, snapshot: card, action, changed_by: session.user.id, changed_by_email: session.user.email });
}

async function saveCard(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $('#cardMessage');
  let record;
  try { record = formRecord(form); } catch (error) {
    message.className = 'message error';
    message.textContent = error.message;
    return;
  }
  let id = form.elements.editingId.value;
  const button = $('#saveCardButton');
  button.disabled = true;
  let error;
  if (id) {
    const old = methods.find(method => method.id === id);
    if (old) await saveVersion(old, 'update');
    ({ error } = await db.from('cards').update(record).eq('id', id));
  } else {
    id = `${slug(record.name)}-${Date.now().toString(36)}`;
    record.id = id;
    ({ error } = await db.from('cards').insert(record));
    if (!error) await saveVersion(record, 'create');
  }
  button.disabled = false;
  if (error) {
    message.className = 'message error';
    message.textContent = error.message;
    return;
  }
  closeModal('cardModal');
  closeDetail();
  await loadMethods();
  toast('Method saved.');
}

async function softDelete(method) {
  if (!confirm(`Move “${method.name}” to the recycle bin? It can be restored.`)) return;
  await saveVersion(method, 'delete');
  const { error } = await db.from('cards').update({ deleted_at: new Date().toISOString(), deleted_by: session.user.id, updated_by: session.user.id }).eq('id', method.id);
  if (error) return toast(error.message);
  closeDetail();
  await loadMethods();
  toast('Method moved to the recycle bin.');
}

const evaluationWizardMap = {
  'controlled-experiment': { goal: ['compare'], evidence: ['performance', 'behavior'], setting: ['lab'], resources: ['medium', 'high'] },
  'ab-test': { goal: ['compare', 'validate'], evidence: ['behavior'], setting: ['remote', 'field'], resources: ['high'] },
  'eye-tracking': { goal: ['compare', 'explain'], evidence: ['behavior'], setting: ['lab'], resources: ['high'] },
  survey: { goal: ['explore', 'validate'], evidence: ['experience'], setting: ['remote', 'field'], resources: ['low', 'medium'] },
  'log-analysis': { goal: ['explain', 'validate'], evidence: ['behavior'], setting: ['remote', 'field'], resources: ['medium', 'high'] },
  interview: { goal: ['explore', 'explain'], evidence: ['experience'], setting: ['remote', 'field'], resources: ['low', 'medium'] },
  'think-aloud': { goal: ['explore', 'explain'], evidence: ['experience'], setting: ['lab', 'remote'], resources: ['low', 'medium'] },
  'contextual-inquiry': { goal: ['explore', 'explain'], evidence: ['context'], setting: ['field'], resources: ['medium'] },
  'heuristic-review': { goal: ['explore'], evidence: ['performance'], setting: ['lab', 'remote'], resources: ['low'] },
  'usability-test': { goal: ['explore', 'compare'], evidence: ['performance', 'behavior', 'experience'], setting: ['lab', 'remote'], resources: ['medium'] },
  'field-study': { goal: ['explore', 'explain', 'validate'], evidence: ['context', 'behavior', 'experience'], setting: ['field'], resources: ['high'] },
  'diary-study': { goal: ['explore', 'explain'], evidence: ['context', 'experience'], setting: ['field', 'remote'], resources: ['medium'] },
  'mixed-sequential': { goal: ['explore', 'compare', 'explain', 'validate'], evidence: ['performance', 'behavior', 'experience', 'context'], setting: ['lab', 'remote', 'field'], resources: ['high'] }
};

function openWizard(type = activeModule === 'statistical' ? 'statistical' : 'evaluation') {
  $('#wizardTitle').textContent = type === 'statistical' ? 'Statistical Test Selector' : 'Evaluation Method Wizard';
  $('#wizardIntro').textContent = type === 'statistical'
    ? 'Answer four questions. The result is a starting point—not a substitute for checking assumptions and your estimand.'
    : 'Answer four questions to rank evaluation methods by fit.';
  const form = $('#wizardForm');
  form.dataset.type = type;
  form.innerHTML = type === 'statistical' ? `
    <label class="field"><span>1. What is your immediate decision?</span><select name="goal"><option value="design">Determine independent vs. paired samples</option><option value="two">Compare two groups or conditions</option><option value="multi">Compare three or more groups or conditions</option></select></label>
    <label class="field"><span>2. How are observations related?</span><select name="relationship"><option value="independent">Different, independent units</option><option value="paired">Same or explicitly matched units</option><option value="repeated">Repeated measures across 3+ conditions</option></select></label>
    <label class="field"><span>3. What is the outcome?</span><select name="outcome"><option value="continuous">Continuous; a mean is meaningful</option><option value="ordinal">Ordinal or rank-based</option></select></label>
    <label class="field"><span>4. Which estimand is defensible?</span><select name="approach"><option value="parametric">Mean difference under model assumptions</option><option value="rank">Distributional / rank-based comparison</option></select></label>
    <footer><button class="button cancel" type="button">Cancel</button><button class="button primary">Show recommendation</button></footer>` : `
    <label class="field"><span>1. Main research goal</span><select name="goal"><option value="explore">Explore needs or problems</option><option value="compare">Compare alternatives</option><option value="explain">Explain behavior or experience</option><option value="validate">Validate in use</option></select></label>
    <label class="field"><span>2. Evidence you need</span><select name="evidence"><option value="performance">Performance</option><option value="behavior">Behavior</option><option value="experience">Experience or perception</option><option value="context">Context and practice</option></select></label>
    <label class="field"><span>3. Study setting</span><select name="setting"><option value="lab">Controlled lab</option><option value="remote">Remote</option><option value="field">Real-world field</option></select></label>
    <label class="field"><span>4. Available resources</span><select name="resources"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
    <footer><button class="button cancel" type="button">Cancel</button><button class="button primary">Rank methods</button></footer>`;
  $('.cancel', form).onclick = () => closeModal('wizardModal');
  openModal('wizardModal');
}

function runWizard(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  wizardScores = {};
  if (form.dataset.type === 'statistical') {
    let recommendation;
    if (data.goal === 'design') recommendation = 'independent-vs-paired-samples';
    else if (data.goal === 'two' && data.relationship === 'independent' && data.approach === 'parametric') recommendation = 'independent-samples-t-test';
    else if (data.goal === 'two' && data.relationship !== 'independent' && data.approach === 'parametric') recommendation = 'paired-samples-t-test';
    else if (data.goal === 'two' && data.relationship === 'independent') recommendation = 'mann-whitney-u-test';
    else if (data.goal === 'two') recommendation = 'wilcoxon-signed-rank-test';
    else if (data.goal === 'multi' && data.relationship === 'independent' && data.approach === 'parametric') recommendation = 'one-way-anova';
    else if (data.goal === 'multi' && data.relationship !== 'independent' && data.approach === 'parametric') recommendation = 'repeated-measures-anova';
    else if (data.goal === 'multi' && data.relationship === 'independent') recommendation = 'kruskal-wallis-test';
    else recommendation = 'friedman-test';
    moduleMethods('statistical').forEach(method => { wizardScores[method.id] = method.id === recommendation ? 10 : 0; });
    setModuleForWizard('statistical');
  } else {
    moduleMethods('evaluation').forEach(method => {
      const map = evaluationWizardMap[method.id] || { goal: [], evidence: [], setting: [], resources: [] };
      wizardScores[method.id] = (map.goal.includes(data.goal) ? 4 : 0) + (map.evidence.includes(data.evidence) ? 4 : 0) + (map.setting.includes(data.setting) ? 2 : 0) + (map.resources.includes(data.resources) ? 1 : 0);
    });
    setModuleForWizard('evaluation');
  }
  favoriteOnly = false;
  activeCategory = 'all';
  currentPage = 1;
  els.search.value = '';
  els.stage.value = 'all';
  els.relationship.value = 'all';
  $('#clearWizardButton').hidden = false;
  closeModal('wizardModal');
  buildFilters();
  render();
  toast('Recommendation ready. Review assumptions before deciding.');
}

function setModuleForWizard(module) {
  activeModule = module;
  $$('.module-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.module === module));
  $('#sidebar').hidden = false;
  $('#discoveryBar').hidden = false;
  els.grid.hidden = false;
  els.guides.hidden = true;
}

function methodMarkdown(method) {
  if (method.method_type === 'statistical') {
    const detail = method.stat_details || {};
    return `### ${method.name}\n\n- **Analysis mode:** Quantitative\n- **Method family:** ${statisticalLabels[method.stat_category]}\n- **Key characteristics:** ${method.summary}\n- **When to use:** ${method.suitable}\n- **What it compares or estimates:** ${method.claim}\n- **Outcome:** ${detail.outcome_type}\n- **Groups / conditions:** ${detail.group_count}\n- **Sample relationship:** ${detail.sample_relationship}\n- **Key assumptions:** ${detail.assumptions}\n- **Common misuse / limitations:** ${method.misuse}\n- **Reference:** ${method.reference_paper}\n- **Method source:** ${method.method_source}`;
  }
  return `### ${method.name}\n\n- **Analysis mode:** ${method.analysis_modes.map(value => evaluationLabels[value] || value).join(', ') || evaluationLabels[method.category]}\n- **Primary classification:** ${evaluationLabels[method.category]}\n- **Key characteristics:** ${method.summary}\n- **When to use:** ${method.suitable}\n- **Research stages:** ${method.stage.map(value => stageLabels[value] || value).join(', ')}\n- **Evidence produced:** ${method.evidence.join(', ')}\n- **Study design:** ${method.design}\n- **Typical data & analysis:** ${method.analysis}\n- **Common misuse / limitations:** ${method.misuse}\n- **Reference:** ${method.reference_paper}\n- **Method source:** ${method.method_source}`;
}

function libraryMarkdown() {
  const list = moduleMethods();
  const title = activeModule === 'statistical' ? 'Statistical Methods' : 'Evaluation Methods';
  return `# Evaluation & Analysis Method Library: ${title}\n\n${list.map(methodMarkdown).join('\n\n')}\n`;
}

function libraryPdf() {
  const list = moduleMethods();
  const title = activeModule === 'statistical' ? 'Statistical Methods' : 'Evaluation Methods';
  const pdf = new jspdf.jsPDF();
  let y = 16;
  pdf.setFontSize(16);
  pdf.text(`Evaluation & Analysis Method Library — ${title}`, 14, y);
  y += 10;
  pdf.setFontSize(9);
  list.forEach(method => {
    const family = method.method_type === 'statistical' ? statisticalLabels[method.stat_category] : evaluationLabels[method.category];
    const lines = pdf.splitTextToSize(`${method.name} — ${family}\nKey characteristics: ${method.summary}\nWhen to use: ${method.suitable}\nReference: ${method.reference_paper}`, 180);
    if (y + lines.length * 4.5 > 282) { pdf.addPage(); y = 16; }
    pdf.setFont(undefined, 'bold');
    pdf.text(lines[0], 14, y);
    pdf.setFont(undefined, 'normal');
    pdf.text(lines.slice(1), 14, y + 5);
    y += lines.length * 4.5 + 8;
  });
  pdf.save(`${activeModule}-methods.pdf`);
}

async function loadAdmin() {
  const { data: deleted } = await db.from('cards').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
  $('#deletedCards').innerHTML = deleted?.length ? deleted.map(method => `<div class="admin-row"><span><b>${escapeHtml(method.name)}</b><small>Deleted ${new Date(method.deleted_at).toLocaleString()}</small></span><button class="button restore-deleted" data-id="${escapeHtml(method.id)}">Restore</button></div>`).join('') : '<p>No deleted methods.</p>';
  $('#systemChangelog').innerHTML = SYSTEM_CHANGELOG.map(release => `<article class="release-entry"><div class="release-heading"><span class="release-version">v${escapeHtml(release.version)}</span><span>${escapeHtml(release.date)}</span></div><h4>${escapeHtml(release.title)}</h4><ul>${release.changes.map(change => `<li>${escapeHtml(change)}</li>`).join('')}</ul></article>`).join('');
  $$('.restore-deleted').forEach(button => { button.onclick = () => restoreDeleted(button.dataset.id); });
  openModal('adminModal');
}

async function restoreDeleted(id) {
  const { data: card } = await db.from('cards').select('*').eq('id', id).single();
  await saveVersion(card, 'restore_deleted');
  const { error } = await db.from('cards').update({ deleted_at: null, deleted_by: null, updated_at: new Date().toISOString(), updated_by: session.user.id }).eq('id', id);
  if (error) return toast(error.message);
  await loadMethods();
  await loadAdmin();
  toast('Method restored.');
}

async function openHistory(id) {
  closeDetail();
  const method = methods.find(item => item.id === id);
  const { data: historyData, error } = await db.from('card_versions').select('*').eq('card_id', id).order('changed_at', { ascending: false });
  $('#cardHistoryTitle').textContent = `${method?.name || 'Method'} history`;
  $('#cardHistoryList').innerHTML = error ? `<p>${escapeHtml(error.message)}</p>` : historyData?.length ? historyData.map(version => `<div class="admin-row"><span><b>${escapeHtml(version.action.replaceAll('_', ' '))}</b><small>${escapeHtml(version.changed_by_email || 'Unknown editor')} · ${new Date(version.changed_at).toLocaleString()}</small></span><button class="button restore-version" data-version="${version.id}">Restore this version</button></div>`).join('') : '<p>No changes recorded for this method.</p>';
  $$('.restore-version', $('#cardHistoryList')).forEach(button => { button.onclick = () => restoreVersion(button.dataset.version); });
  openModal('historyModal');
}

async function restoreVersion(versionId) {
  if (!confirm('Restore this historical version? The current version will also be preserved.')) return;
  const { data: version } = await db.from('card_versions').select('*').eq('id', versionId).single();
  const { data: current } = await db.from('cards').select('*').eq('id', version.card_id).single();
  await saveVersion(current, 'before_restore');
  const record = {};
  versionFields.filter(field => field !== 'id').forEach(field => { if (field in version.snapshot) record[field] = version.snapshot[field]; });
  Object.assign(record, { deleted_at: null, deleted_by: null, updated_at: new Date().toISOString(), updated_by: session.user.id });
  const { error } = await db.from('cards').update(record).eq('id', version.card_id);
  if (error) return toast(error.message);
  await loadMethods();
  closeModal('historyModal');
  await openHistory(version.card_id);
  toast('Historical version restored.');
}

const csvColumns = ['method_type', 'name', 'category', 'stat_category', 'analysis_modes', 'stage', 'evidence', 'summary', 'claim', 'suitable', 'design', 'analysis', 'misuse', 'alternative', 'reference_paper', 'method_source', 'stat_details_json'];

function csvTemplate() {
  const example = Object.fromEntries(csvColumns.map(column => [column, '']));
  Object.assign(example, {
    method_type: 'evaluation', name: 'Example method', category: 'mixed', analysis_modes: 'quantitative|qualitative|mixed',
    stage: 'formative|validation', evidence: 'Behavior|Experience', summary: 'Short summary', claim: 'Research question supported',
    suitable: 'When this method fits', design: 'Study design', analysis: 'Data and analysis', misuse: 'Common misuse',
    alternative: 'Alternative method', reference_paper: 'Citation and URL', method_source: 'Authoritative source and URL', stat_details_json: '{}'
  });
  return Papa.unparse([example]);
}

async function importCsv(file) {
  const message = $('#importMessage');
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async result => {
      try {
        const records = result.data.map((row, index) => {
          const type = (row.method_type || 'evaluation').trim();
          const required = ['name', 'summary', 'claim', 'suitable', 'misuse', 'alternative', 'reference_paper', 'method_source'];
          if (required.some(column => !String(row[column] || '').trim())) throw Error(`Row ${index + 2} has a missing required value.`);
          let statDetails = {};
          if (type === 'statistical') statDetails = JSON.parse(row.stat_details_json || '{}');
          return {
            id: `${slug(row.name)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            method_type: type, name: row.name.trim(), category: (row.category || (type === 'statistical' ? 'statistical' : 'mixed')).trim(),
            stat_category: (row.stat_category || '').trim() || null,
            analysis_modes: String(row.analysis_modes || '').split('|').map(value => value.trim()).filter(Boolean),
            stage: String(row.stage || '').split('|').map(value => value.trim()).filter(Boolean),
            evidence: String(row.evidence || '').split('|').map(value => value.trim()).filter(Boolean),
            summary: row.summary.trim(), claim: row.claim.trim(), suitable: row.suitable.trim(), design: String(row.design || '').trim(),
            analysis: String(row.analysis || '').trim(), misuse: row.misuse.trim(), alternative: row.alternative.trim(),
            reference_paper: row.reference_paper.trim(), method_source: row.method_source.trim(), stat_details: statDetails,
            updated_by: session.user.id
          };
        });
        const { error } = await db.from('cards').insert(records);
        if (error) throw error;
        for (const record of records) await saveVersion(record, 'import');
        message.className = 'message success';
        message.textContent = `Imported ${records.length} methods.`;
        await loadMethods();
        await loadAdmin();
      } catch (error) {
        message.className = 'message error';
        message.textContent = error.message;
      }
    }
  });
}

function bindEvents() {
  $$('.module-tab').forEach(tab => { tab.onclick = () => setModule(tab.dataset.module); });
  els.search.oninput = () => { wizardScores = null; currentPage = 1; $('#clearWizardButton').hidden = true; render(); };
  els.stage.onchange = () => { currentPage = 1; render(); };
  els.relationship.onchange = () => { currentPage = 1; render(); };
  els.filters.onclick = event => {
    const button = event.target.closest('[data-cat]');
    if (!button) return;
    activeCategory = button.dataset.cat;
    favoriteOnly = false;
    currentPage = 1;
    buildFilters();
    render();
  };
  $('#favoritesFilter').onclick = () => {
    if (!session) return openModal('authModal');
    favoriteOnly = !favoriteOnly;
    currentPage = 1;
    $('#favoritesFilter').classList.toggle('active', favoriteOnly);
    render();
  };
  els.auth.onclick = () => session ? db.auth.signOut() : openModal('authModal');
  els.add.onclick = () => openCardForm();
  els.tools.onclick = loadAdmin;
  $('#wizardButton').onclick = () => openWizard();
  $('#compareButton').onclick = compareMethods;
  $('#clearCompareButton').onclick = () => { selected.clear(); els.tray.hidden = true; render(); };
  $('#clearWizardButton').onclick = () => { wizardScores = null; currentPage = 1; $('#clearWizardButton').hidden = true; render(); };
  els.detail.onclick = event => { if (event.target === els.detail) closeDetail(); };
  $$('.modal .close,.modal .cancel').forEach(button => { button.onclick = () => closeModal(button.closest('.modal')); });
  $$('.modal').forEach(modal => { modal.onclick = event => { if (event.target === modal) closeModal(modal); }; });
  $('#authForm').onsubmit = async event => {
    event.preventDefault();
    const email = $('#loginEmail').value.trim();
    const button = $('#sendLinkButton');
    button.disabled = true;
    const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
    button.disabled = false;
    $('#authMessage').className = 'message ' + (error ? 'error' : 'success');
    $('#authMessage').textContent = error ? error.message : 'Sign-in link sent. Check your inbox.';
  };
  $('#methodTypeSelect').onchange = event => updateFormType(event.target.value);
  $('#cardForm').onsubmit = saveCard;
  $('#wizardForm').onsubmit = runWizard;
  $('#exportLibraryButton').onclick = () => download(`${activeModule}-methods.md`, libraryMarkdown(), 'text/markdown');
  const pdfButton = document.createElement('button');
  pdfButton.className = 'side-link';
  pdfButton.textContent = '↓ Export current library PDF';
  pdfButton.onclick = libraryPdf;
  $('#exportLibraryButton').after(pdfButton);
  $('#templateButton').onclick = () => download('method-library-template.csv', '\ufeff' + csvTemplate(), 'text/csv');
  $('#csvInput').onchange = event => event.target.files[0] && importCsv(event.target.files[0]);
  els.pagination.onclick = event => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page);
    render();
    $('.catalog-head').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  window.onhashchange = openFromHash;
}

initialize();
