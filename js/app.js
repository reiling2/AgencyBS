'use strict';

const STORAGE_KEY = 'abs_v2_preview_state';
const THEME_KEY = 'abs_v2_preview_theme';
const DEMO_EMAIL = 'client@example.ru';

const PROJECT_STATUSES = [
  'Подготовка к запуску',
  'Запуск',
  'В работе',
  'Бриф',
  'Продление',
  'Условный отказник',
  'Отказник',
  'Архив'
];

const DEFAULT_STAGES = [
  {
    id: 'fill-card',
    title: 'Заполнить карточку проекта',
  },
  {
    id: 'create-chat',
    title: 'Создать чат коммуникаций',
  },
  {
    id: 'brief',
    title: 'Провести бриф',
  },
  {
    id: 'welcome-message',
    title: 'Отправить приветственное сообщение',
    text: 'Указать график работы и предупредить, что еженедельно проводится созвон для среза результатов.'
  },
  {
    id: 'request-info',
    title: 'Запросить информацию у клиента',
    text: 'Логин/пароль Авито, номер в объявлениях, email, карточка предприятия при юр. лице, название профиля и дополнительные материалы.'
  },
  {
    id: 'account-entry',
    title: 'Войти в аккаунт и проверить профиль',
  },
  {
    id: 'analytics',
    title: 'Собрать аналитику',
  },
  {
    id: 'client-call',
    title: 'Направить файл клиенту и провести созвон',
  },
  {
    id: 'content',
    title: 'Разработать контент',
  },
  {
    id: 'approval',
    title: 'Направить контент на согласование',
  },
  {
    id: 'unique',
    title: 'Уникализировать объявления',
  },
  {
    id: 'publish',
    title: 'Выложить объявления',
  },
  {
    id: 'campaign-30-days',
    title: 'Ведение РК 30 календарных дней',
  },
  {
    id: 'final-report',
    title: 'Большой итоговый отчёт и продление',
  },
  {
    id: 'repeat-work',
    title: 'Повторить цикл ведения',
  }
];


const MATERIAL_ITEMS = [
  { key: 'workPhotos', label: 'Фото работ', placeholder: 'Например: есть/ожидаем, ссылка, комментарий' },
  { key: 'video', label: 'Видео', placeholder: 'Если клиент прислал видео — отмечаем галочкой и пишем комментарий' },
  { key: 'reviews', label: 'Отзывы', placeholder: 'Если отзывы есть — отмечаем галочкой и пишем где лежат' },
  { key: 'logo', label: 'Логотип', placeholder: 'Файл/ссылка/ожидаем' },
  { key: 'brandbook', label: 'Брендбук / цвета', placeholder: 'Цвета, стиль, брендбук, ограничения' },
  { key: 'price', label: 'Прайс / диапазоны цен', placeholder: 'Прайс, вилки цен, комментарии по ценам' },
  { key: 'portfolio', label: 'Портфолио / кейсы', placeholder: 'Работы, примеры, ссылки, папки' },
  { key: 'creatives', label: 'Креативы / баннеры', placeholder: 'Что есть, что нужно подготовить' },
  { key: 'texts', label: 'Тексты / УТП', placeholder: 'Готовые тексты, УТП, офферы, ограничения' },
  { key: 'accesses', label: 'Доступы / данные Авито', placeholder: 'Что получили, что ещё нужно запросить' },
  { key: 'other', label: 'Другие материалы', placeholder: 'Любые дополнительные материалы, ссылки, папки или комментарии' }
];

const MATERIAL_STATUSES = [
  { value: 'unspecified', label: 'не указано' },
  { value: 'waiting', label: 'ожидаем' },
  { value: 'received', label: 'есть' }
];

const BRIEF_SECTIONS = [
  'Квалификация клиента',
  'Опыт сотрудничества с маркетологами, запуска рекламы',
  'Ожидания от сотрудничества',
  'Маркетинг и воронка продаж в компании',
  'Целевая аудитория',
  'Технические вопросы'
];

const AVITO_METRICS = [
  { key: 'budget', label: 'Бюджет' },
  { key: 'views', label: 'Количество просмотров' },
  { key: 'favorites', label: 'Избранное' },
  { key: 'cpc', label: 'CPC' },
  { key: 'chats', label: 'Чаты' },
  { key: 'calls', label: 'Звонки' },
  { key: 'leads', label: 'Лидов всего' },
  { key: 'conversion', label: 'Конверсия из просмотра в лид, %' },
  { key: 'cpl', label: 'CPL' },
  { key: 'ads', label: 'Количество объявлений' },
  { key: 'currentAds', label: 'Текущее количество' },
  { key: 'usPercent', label: 'УС, %' },
  { key: 'wallet', label: 'Кошелёк' },
  { key: 'advance', label: 'Аванс' }
];

const state = loadState();
let activeProjectId = state.projects[0]?.id || null;
let currentView = 'projects';
let showAllStages = false;
let calculatorResults = null;

function loadState() {
  try {
    const raw = window.localStorageAdapter?.get?.(STORAGE_KEY, null);
    if (raw) {
      const normalized = normalizeState(raw);
      window.localStorageAdapter?.set?.(STORAGE_KEY, normalized);
      return normalized;
    }
  } catch (err) {
    console.warn('Cannot parse state', err);
  }
  return normalizeState(window.localStorageAdapter?.migrateState?.(null, createDemoState()) || createDemoState());
}

function normalizeState(next) {
  return {
    schemaVersion: window.ABS_CONSTANTS?.schemaVersion || 2,
    projects: Array.isArray(next.projects) ? next.projects.map(normalizeProject) : [],
    selectedMetrics: Array.isArray(next.selectedMetrics) ? next.selectedMetrics : AVITO_METRICS.map(m => m.key),
    statsRows: Array.isArray(next.statsRows) ? next.statsRows : createDemoStatsRows(),
    knowledge: Array.isArray(next.knowledge) ? next.knowledge : createDemoKnowledge()
  };
}

function normalizeProject(project) {
  const isDemoProject = project.id === 'demo-project';
  const email = isDemoProject && project.email === DEMO_EMAIL ? '' : (project.email || '');
  const normalized = {
    id: project.id || uid('project'),
    title: project.title || 'Новый проект',
    niche: project.niche || '',
    status: PROJECT_STATUSES.includes(project.status) ? project.status : 'Подготовка к запуску',
    clientName: project.clientName || '',
    phone: project.phone || '',
    email,
    paymentType: project.paymentType || '',
    paymentDate: project.paymentDate || '',
    paymentAmount: Number(project.paymentAmount || 0),
    dealType: project.dealType || 'Запуск',
    comment: project.comment || '',
    stages: Array.isArray(project.stages) ? project.stages : DEFAULT_STAGES.map(s => ({ ...s, completed: false })),
    materials: Array.isArray(project.materials) ? project.materials : MATERIAL_ITEMS.map(item => ({ ...item, status: 'unspecified', note: '' })),
    files: Array.isArray(project.files) ? project.files : [],
    avitoApi: project.avitoApi || {},
    brief: project.brief || {},
    calculations: Array.isArray(project.calculations) ? project.calculations : [],
    reminder: project.reminder || null,
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString()
  };
  normalized.stages = DEFAULT_STAGES.map(stage => {
    const saved = normalized.stages.find(item => item.id === stage.id);
    return { ...stage, completed: Boolean(saved?.completed) };
  });
  normalized.materials = MATERIAL_ITEMS.map(item => {
    const saved = normalized.materials.find(row => row.key === item.key);
    const status = saved?.status || (saved?.received ? 'received' : 'unspecified');
    return { ...item, status: MATERIAL_STATUSES.some(row => row.value === status) ? status : 'unspecified', note: saved?.note || '' };
  });
  return normalized;
}

function createDemoState() {
  const project = normalizeProject({
    id: 'demo-project',
    title: 'Пять решений — септики и скважины',
    niche: 'Инженерные системы для частных домов',
    status: 'Подготовка к запуску',
    clientName: 'Иван Петров',
    phone: '+7 999 000-00-00',
    email: '',
    paymentType: 'Аванс',
    paymentDate: '2026-06-11',
    paymentAmount: 50000,
    dealType: 'Запуск',
    comment: 'Клиент хочет стартовать быстро. Нужно отдельно уточнить доступы Авито, номер для объявлений и материалы по объектам.'
  });
  return {
    schemaVersion: window.ABS_CONSTANTS?.schemaVersion || 2,
    projects: [project],
    selectedMetrics: AVITO_METRICS.map(m => m.key),
    statsRows: createDemoStatsRows(),
    knowledge: createDemoKnowledge()
  };
}

function createDemoStatsRows() {
  return [
    { date: '2026-06-01', projectId: 'demo-project', projectName: 'Пять решений — септики и скважины', budget: 8200, views: 3339, favorites: 32, cpc: 2.45, chats: 14, calls: 8, leads: 22, conversion: 0.66, cpl: 372.7, ads: 12, currentAds: 10, usPercent: 80, wallet: 12400, advance: 50000 },
    { date: '2026-06-02', projectId: 'demo-project', projectName: 'Пять решений — септики и скважины', budget: 7600, views: 2980, favorites: 28, cpc: 2.55, chats: 11, calls: 6, leads: 17, conversion: 0.57, cpl: 447.1, ads: 12, currentAds: 10, usPercent: 83, wallet: 9800, advance: 50000 },
    { date: '2026-06-03', projectId: 'demo-project', projectName: 'Пять решений — септики и скважины', budget: 9100, views: 3689, favorites: 37, cpc: 2.47, chats: 16, calls: 10, leads: 26, conversion: 0.70, cpl: 350.0, ads: 12, currentAds: 11, usPercent: 91, wallet: 10300, advance: 50000 }
  ];
}

function createDemoKnowledge() {
  return [
    { id: uid('kb'), title: 'Шаблон первого сообщения клиенту', type: 'Шаблон', url: '#' },
    { id: uid('kb'), title: 'Чек-лист запуска проекта на Авито', type: 'Регламент', url: '#' },
    { id: uid('kb'), title: 'Список материалов для клиента', type: 'Документ', url: '#' }
  ];
}

function saveState() {
  window.localStorageAdapter?.set?.(STORAGE_KEY, state);
}

function getUiTheme() {
  return window.settingsApi?.getTheme?.() || (window.absStorage?.getString?.(THEME_KEY, 'light') === 'dark' ? 'dark' : 'light');
}

function applyUiTheme(theme = getUiTheme()) {
  document.documentElement.dataset.theme = theme;
}

function setUiTheme(theme) {
  window.settingsApi?.setTheme?.(theme);
  applyUiTheme(theme);
}

function getWebsiteNotificationSettings() {
  return window.websiteService?.getNotificationSettings?.() || { showNewLeadBadge: true };
}

function saveWebsiteNotificationSettings(patch) {
  return window.websiteService?.saveNotificationSettings?.(patch) || { showNewLeadBadge: true, ...(patch || {}) };
}

function updateWebsiteNewLeadBadge() {
  const badge = document.getElementById('websiteNewLeadBadge');
  if (!badge) return;
  const notifications = getWebsiteNotificationSettings();
  const count = notifications.showNewLeadBadge ? Number(window.websiteService?.getNewLeadCount?.() || 0) : 0;
  badge.hidden = count <= 0;
  badge.textContent = count > 0 ? `+${count}` : '';
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function formatMoney(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(number) + ' ₽';
}

function getActiveProject() {
  return state.projects.find(project => project.id === activeProjectId) || state.projects[0] || null;
}

function badgeClass(status) {
  if (['Запуск', 'В работе'].includes(status)) return 'blue';
  if (status === 'Продление') return 'green';
  if (status === 'Условный отказник') return 'gray';
  if (status === 'Отказник') return 'red';
  if (status === 'Архив') return 'gray';
  if (status === 'Бриф') return 'purple';
  return 'blue';
}

function setView(view, options = {}) {
  currentView = view;
  window.absState?.set?.({ currentView: view, selectedProjectId: options.projectId || activeProjectId });
  document.querySelectorAll('.view').forEach(node => node.classList.remove('active'));
  const target = document.getElementById(`view-${view}`) || document.getElementById('view-projects');
  target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  const titles = { projects: 'Проекты', 'project-card': 'Карточка проекта', brief: 'Бриф', stats: 'Статистика', reports: 'Отчёты', site: 'Сайт', calculator: 'Калькулятор', settings: 'Настройки', knowledge: 'База знаний' };
  document.getElementById('mobileTitle').textContent = titles[view] || 'ABS';
  closeMobileMenu();
  if (!options.noRender) render();
}

function render() {
  renderProjects();
  renderProjectCard();
  renderBrief();
  renderStats();
  renderReports();
  renderSite();
  renderCalculator();
  renderSettings();
  renderKnowledge();
  updateWebsiteNewLeadBadge();
}

function renderProjects() {
  const root = document.getElementById('view-projects');
  renderProjectsPage(root);
}

function getProjectFilters() {
  return {
    query: document.getElementById('projectSearch')?.value || '',
    status: document.getElementById('projectStatusFilter')?.value || '',
    niche: document.getElementById('projectNicheFilter')?.value || ''
  };
}

function getFilteredProjects(filters = getProjectFilters()) {
  const query = filters.query.toLowerCase();
  return state.projects.filter(project => {
    const matchesQuery = !query || [project.title, project.niche, project.clientName].join(' ').toLowerCase().includes(query);
    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesNiche = !filters.niche || project.niche === filters.niche;
    return matchesQuery && matchesStatus && matchesNiche;
  });
}

function renderProjectsPage(root = document.getElementById('view-projects')) {
  if (!root) return;
  const filters = getProjectFilters();
  const status = filters.status;
  const niche = filters.niche;
  const niches = [...new Set(state.projects.map(p => p.niche).filter(Boolean))];

  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Проекты</h1>
      </div>
      <div class="actions">
        <button class="btn primary" id="openProjectModalBtn">+ Новый проект</button>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h3>База проектов</h3>
          <div class="card-subtitle">${state.projects.length} проектов</div>
        </div>
      </div>
      <div class="filters">
        <input class="input" id="projectSearch" placeholder="Поиск по проекту, нише, клиенту" value="${esc(filters.query)}" autocomplete="off" />
        <select class="input" id="projectStatusFilter">
          <option value="">Все статусы</option>
          ${PROJECT_STATUSES.map(item => `<option ${item === status ? 'selected' : ''}>${esc(item)}</option>`).join('')}
        </select>
        <select class="input" id="projectNicheFilter">
          <option value="">Все ниши</option>
          ${niches.map(item => `<option ${item === niche ? 'selected' : ''}>${esc(item)}</option>`).join('')}
        </select>
        <button class="btn ghost" id="resetProjectFilters">Сброс</button>
      </div>
    </div>

    <div class="card" id="projectsList"></div>
  `;

  bindProjectPageEvents();
  renderProjectsList();
}

function renderProjectsList() {
  const list = document.getElementById('projectsList');
  if (!list) return;
  const projects = getFilteredProjects();
  list.innerHTML = projects.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Проект</th>
            <th>Ниша</th>
            <th>Статус</th>
            <th>Клиент</th>
            <th>Сделка</th>
            <th>Оплата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(project => `
            <tr class="project-row" data-open-project="${project.id}">
              <td>
                <div class="row-title">${esc(project.title)}</div>
                <div class="row-sub">ID: ${esc(project.id)}</div>
              </td>
              <td>${esc(project.niche || 'Не указано')}</td>
              <td><span class="badge ${badgeClass(project.status)}">${esc(project.status)}</span></td>
              <td>
                <div>${esc(project.clientName || 'Не указан')}</div>
                <div class="row-sub">${esc(project.phone || '')}</div>
              </td>
              <td>${esc(project.dealType || 'Не указано')}</td>
              <td>${formatMoney(project.paymentAmount)}</td>
              <td class="actions">
                <button class="btn small danger" data-delete-project="${project.id}">Удалить</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : `<div class="empty"><strong>Проектов пока нет</strong>Создай первый проект, чтобы открыть карточку и этапы.</div>`;

  bindProjectRowsEvents();
}

function bindProjectPageEvents() {
  document.getElementById('openProjectModalBtn')?.addEventListener('click', openProjectModal);
  document.getElementById('projectSearch')?.addEventListener('input', renderProjectsList);
  ['projectStatusFilter', 'projectNicheFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', renderProjectsList);
  });
  document.getElementById('resetProjectFilters')?.addEventListener('click', () => {
    ['projectSearch', 'projectStatusFilter', 'projectNicheFilter'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    renderProjectsList();
  });
}

function bindProjectRowsEvents() {
  document.querySelectorAll('[data-open-project]').forEach(btn => btn.addEventListener('click', () => {
    activeProjectId = btn.dataset.openProject;
    showAllStages = false;
    setView('project-card');
  }));
  document.querySelectorAll('[data-delete-project]').forEach(btn => btn.addEventListener('click', event => {
    event.stopPropagation();
    if (!confirm('Удалить проект?')) return;
    state.projects = state.projects.filter(project => project.id !== btn.dataset.deleteProject);
    window.projectsApi?.delete?.(btn.dataset.deleteProject);
    if (activeProjectId === btn.dataset.deleteProject) activeProjectId = state.projects[0]?.id || null;
    saveState();
    render();
  }));
}

function renderProjectCard() {
  const root = document.getElementById('view-project-card');
  const project = getActiveProject();
  if (!project) {
    root.innerHTML = `<div class="empty"><strong>Проект не выбран</strong>Вернись в раздел “Проекты” и выбери или создай проект.</div>`;
    return;
  }
  const activeStages = showAllStages ? project.stages : project.stages.filter(stage => !stage.completed);
  const completedCount = project.stages.filter(stage => stage.completed).length;
  const totalStages = project.stages.length || 1;
  const stageProgress = Math.round(completedCount / totalStages * 100);
  const materialReady = project.materials.filter(item => item.status === 'received').length;
  const materialWaiting = project.materials.filter(item => item.status === 'waiting').length;
  const moneyLabel = formatMoney(project.paymentAmount);

  root.innerHTML = `
    <div class="page-head project-page-head">
      <div>
        <h1>${esc(project.title)}</h1>
        <p>${esc(project.clientName || 'Клиент не указан')} - ${esc(project.niche || 'Ниша не указана')}</p>
      </div>
      <div class="actions">
        <button class="btn soft" id="backToProjects">Проекты</button>
        <button class="btn primary" id="openBriefBtn">Бриф</button>
      </div>
    </div>

    ${project.status === PROJECT_STATUSES[5] ? `
      <div class="reminder card">
        <strong>Напоминание активно:</strong> позвонить клиенту через месяц и повторять каждый месяц, пока статус не изменится.
        <div>Следующий звонок: <strong>${esc(project.reminder?.nextCallDate || 'будет создан после сохранения статуса')}</strong></div>
      </div>` : ''}

    <div class="project-command-grid">
      <div class="command-card accent"><span>Статус</span><strong>${esc(project.status)}</strong><small>${project.reminder?.active ? `Звонок: ${esc(project.reminder.nextCallDate)}` : 'Без напоминания'}</small></div>
      <div class="command-card"><span>Этапы</span><strong>${completedCount}/${project.stages.length}</strong><small>${stageProgress}% выполнено</small></div>
      <div class="command-card"><span>Материалы</span><strong>${materialReady}/${project.materials.length}</strong><small>${materialWaiting ? `Ожидаем: ${materialWaiting}` : 'Нет ожидающих'}</small></div>
      <div class="command-card"><span>Оплата</span><strong>${esc(moneyLabel)}</strong><small>${esc(project.paymentType || 'Тип оплаты не указан')}</small></div>
    </div>

    <div class="project-workspace-grid">
      <div class="card project-info-card">
        <div class="card-head"><div><h2>Данные проекта</h2><div class="card-subtitle">Редактируй основные поля прямо здесь. Изменения сохраняются автоматически.</div></div><span class="badge ${badgeClass(project.status)}">${esc(project.status)}</span></div>
        <div class="details-grid" id="projectDetailsForm">
          ${projectField('title', 'Название проекта', project.title)}
          ${projectField('niche', 'Ниша', project.niche)}
          ${projectSelect('status', 'Статус', project.status, PROJECT_STATUSES)}
          ${projectField('clientName', 'ФИО клиента', project.clientName)}
          ${projectField('phone', 'Номер для связи', project.phone)}
          ${projectField('email', 'Электронная почта', project.email, 'email')}
          ${projectSelect('paymentType', 'Вид оплаты', project.paymentType, ['Полная оплата', 'Аванс', 'Постоплата', 'Рассрочка', 'Другое'])}
          ${projectField('paymentDate', 'Дата оплаты', project.paymentDate, 'date')}
          ${projectField('paymentAmount', 'Сумма оплаты', project.paymentAmount, 'number')}
          ${projectSelect('dealType', 'Вид сделки', project.dealType, ['Запуск', 'Ведение', 'Другое'])}
          <label class="field wide"><span>Комментарий менеджера</span><textarea class="comment-box" id="projectComment" rows="5" placeholder="Комментарий по проекту">${esc(project.comment)}</textarea></label>
        </div>
      </div>

      <div class="card project-stages-card">
        <div class="card-head"><div><h2>Этапы проекта</h2><div class="card-subtitle">Фокус на ближайших активных шагах. Выполненные этапы можно показать снова.</div></div><button class="btn small" id="toggleAllStages">${showAllStages ? 'Скрыть выполненные' : 'Показать все этапы'}</button></div>
        <div class="stage-progress"><div><span style="width:${stageProgress}%"></span></div><strong>${stageProgress}%</strong></div>
        <div class="stage-list">
          ${activeStages.length ? activeStages.map(stage => {
            const stageNumber = project.stages.findIndex(item => item.id === stage.id) + 1;
            return `<label class="stage-item ${stage.completed ? 'completed' : ''}"><input type="checkbox" data-stage="${esc(stage.id)}" ${stage.completed ? 'checked' : ''} /><span><strong>${stageNumber}. ${esc(stage.title)}</strong><small>${esc(stage.text)}</small></span></label>`;
          }).join('') : `<div class="empty compact"><strong>Активных этапов нет</strong>Все этапы выполнены. Нажми “Показать все этапы”, чтобы вернуть этап.</div>`}
        </div>
      </div>

      <div class="card project-materials-card">
        <div class="card-head"><div><h2>Материалы</h2><div class="card-subtitle">Компактный чек-лист: что есть, что ожидаем, что не указано.</div></div></div>
        <div class="materials-grid">
          ${project.materials.map(item => `<div class="material-card ${esc(item.status)}"><label class="material-check"><span>${esc(item.label)}</span><select class="material-status" data-material-status="${esc(item.key)}">${MATERIAL_STATUSES.map(status => `<option value="${esc(status.value)}" ${status.value === item.status ? 'selected' : ''}>${esc(status.label)}</option>`).join('')}</select></label></div>`).join('')}
        </div>
      </div>

      <div class="card project-files-card">
        <div class="card-head"><div><h2>Файлы</h2><div class="card-subtitle">Брифы, таблицы, фото, видео, архивы и рабочие документы проекта.</div></div><button class="btn primary" id="addProjectFiles">Добавить</button></div>
        <div id="dynamicFileInput"></div>
        <div class="files-dropzone ${project.files.length ? 'has-files' : ''}">
          ${project.files.length ? `<div class="files-list">${project.files.map(file => `<div class="file-row"><div><strong>${esc(file.name)}</strong><span>${esc(file.type || 'Файл')} - ${esc(file.createdAt?.slice(0, 10) || '')}</span></div><div class="actions">${file.dataUrl ? `<button class="btn small" data-download-file="${esc(file.id)}">Скачать</button>` : ''}<button class="btn small danger" data-delete-file="${esc(file.id)}">Удалить</button></div></div>`).join('')}</div>` : `Файлы ещё не загружены. Можно добавить запись встречи, бриф, презентацию, фото, документы или таблицы.`}
        </div>
      </div>

      <div class="card accordion project-api-card" id="apiAccordion">
        <div class="card-head"><div><h2>API / Авито</h2><div class="card-subtitle">Заготовка подключения под backend. Секреты в production нельзя хранить во frontend.</div></div><button class="btn small" id="toggleApi">Открыть</button></div>
        <div class="accordion-body">
          <div class="details-grid">
            ${apiField('accountName', 'Название аккаунта Авито', project.avitoApi.accountName || '')}
            ${apiField('profileId', 'ID профиля / аккаунта', project.avitoApi.profileId || '')}
            ${apiField('clientId', 'client_id', project.avitoApi.clientId || '')}
            ${apiField('clientSecret', 'client_secret', project.avitoApi.clientSecret || '', 'password')}
            ${apiField('accessToken', 'access token', project.avitoApi.accessToken || '', 'password')}
            ${apiField('refreshToken', 'refresh token', project.avitoApi.refreshToken || '', 'password')}
            <label class="field wide"><span>Комментарий по подключению</span><textarea data-api-field="apiComment" rows="3">${esc(project.avitoApi.apiComment || '')}</textarea></label>
          </div>
          <div class="actions" style="margin-top:14px;"><button class="btn primary" id="saveApiBtn">Сохранить подключение</button><button class="btn soft" id="mockCheckApiBtn">Проверить подключение</button></div>
          <p class="muted">В боевой версии секреты Авито должны храниться на backend и защищённо сохраняться в БД.</p>
        </div>
      </div>

      <div class="card saved-calculations-card">
        <div class="card-head"><div><h2>Сохранённые расчёты</h2><div class="card-subtitle">Ключевые KPI из калькулятора, сохранённые в проект.</div></div><span class="badge blue">${project.calculations.length} расч.</span></div>
        <div class="saved-calc-grid">${project.calculations.length ? project.calculations.slice().reverse().map(calc => savedCalcCard(calc)).join('') : `<div class="empty"><strong>Расчётов пока нет</strong>Открой калькулятор и сохрани результат в проект.</div>`}</div>
      </div>
    </div>
  `;

  bindProjectCardEvents(project);
}

function savedCalcCard(calc) {
  return `
    <div class="saved-calc-card">
      <div class="saved-calc-head">
        <strong>${esc(calc.title)}</strong>
        <span>${esc(calc.createdAt.slice(0,10))}</span>
      </div>
      <div class="saved-calc-metrics">
        <div><span>Бюджет</span><strong>${formatMoney(calc.budget)}</strong></div>
        <div><span>Лиды</span><strong>${esc(calc.leads)}</strong></div>
        <div><span>Лиды/нед</span><strong>${esc(calc.weeklyLeadsGoal)}</strong></div>
        <div><span>CPC</span><strong>${formatMoney(calc.cpc)}</strong></div>
        <div><span>Жел. CPC</span><strong>${formatMoney(calc.desiredCpc)}</strong></div>
        <div><span>CPL</span><strong>${formatMoney(calc.cpl)}</strong></div>
      </div>
    </div>
  `;
}

function projectField(key, label, value, type = 'text') {
  return `<label class="field"><span>${esc(label)}</span><input data-project-field="${esc(key)}" type="${esc(type)}" value="${esc(value)}" /></label>`;
}

function projectSelect(key, label, value, options) {
  return `<label class="field"><span>${esc(label)}</span><select data-project-field="${esc(key)}">${options.map(option => `<option ${option === value ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></label>`;
}

function apiField(key, label, value, type = 'text') {
  return `<label class="field"><span>${esc(label)}</span><input data-api-field="${esc(key)}" type="${esc(type)}" value="${esc(value)}" autocomplete="off" /></label>`;
}

function bindProjectCardEvents(project) {
  document.getElementById('backToProjects')?.addEventListener('click', () => setView('projects'));
  document.getElementById('openBriefBtn')?.addEventListener('click', () => setView('brief'));
  document.querySelectorAll('[data-project-field]').forEach(input => {
    input.addEventListener('change', () => updateProjectField(project.id, input.dataset.projectField, input.value));
    input.addEventListener('input', () => {
      if (!['status'].includes(input.dataset.projectField)) updateProjectField(project.id, input.dataset.projectField, input.value, true);
    });
  });
  document.getElementById('projectComment')?.addEventListener('input', event => updateProjectField(project.id, 'comment', event.target.value, true));
  document.querySelectorAll('[data-material-status]').forEach(input => input.addEventListener('change', () => {
    const material = project.materials.find(item => item.key === input.dataset.materialStatus);
    if (material) material.status = input.value;
    project.updatedAt = new Date().toISOString();
    saveState();
    renderProjectCard();
  }));
  document.querySelectorAll('[data-material-note]').forEach(input => input.addEventListener('input', () => {
    const material = project.materials.find(item => item.key === input.dataset.materialNote);
    if (material) material.note = input.value;
    project.updatedAt = new Date().toISOString();
    saveState();
  }));
  document.getElementById('toggleAllStages')?.addEventListener('click', () => { showAllStages = !showAllStages; renderProjectCard(); });
  document.querySelectorAll('[data-stage]').forEach(input => input.addEventListener('change', () => {
    const stage = project.stages.find(item => item.id === input.dataset.stage);
    if (stage) stage.completed = input.checked;
    project.updatedAt = new Date().toISOString();
    saveState();
    renderProjectCard();
  }));
  document.getElementById('toggleApi')?.addEventListener('click', () => document.getElementById('apiAccordion')?.classList.toggle('open'));
  document.getElementById('saveApiBtn')?.addEventListener('click', () => {
    document.querySelectorAll('[data-api-field]').forEach(input => { project.avitoApi[input.dataset.apiField] = input.value; });
    project.avitoApi.updatedAt = new Date().toISOString();
    saveState();
    alert('Данные подключения сохранены в демо-режиме. В боевой версии это уйдёт на backend.');
  });
  document.getElementById('mockCheckApiBtn')?.addEventListener('click', () => alert('Демо-проверка: в боевой версии backend проверит подключение к Авито API.'));
  document.getElementById('addProjectFiles')?.addEventListener('click', () => createProjectFileInput(project.id));
  document.querySelectorAll('[data-delete-file]').forEach(btn => btn.addEventListener('click', () => {
    project.files = project.files.filter(file => file.id !== btn.dataset.deleteFile);
    window.fileService?.removeFile?.(btn.dataset.deleteFile);
    saveState();
    renderProjectCard();
  }));
  document.querySelectorAll('[data-download-file]').forEach(btn => btn.addEventListener('click', () => {
    const file = project.files.find(item => item.id === btn.dataset.downloadFile);
    if (file?.dataUrl) downloadDataUrl(file.dataUrl, file.name);
  }));
}

function updateProjectField(projectId, key, value, silent = false) {
  const project = state.projects.find(item => item.id === projectId);
  if (!project) return;
  project[key] = key === 'paymentAmount' ? Number(value || 0) : value;
  project.updatedAt = new Date().toISOString();
  if (key === 'status') handleStatusChange(project);
  window.projectService?.updateProject?.(projectId, { [key]: project[key] });
  saveState();
  if (!silent) render();
}

function handleStatusChange(project) {
  if (project.status === 'Условный отказник') {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    project.reminder = {
      type: 'call-client-monthly',
      active: true,
      nextCallDate: nextDate.toISOString().slice(0, 10),
      repeat: 'monthly',
      text: 'Позвонить клиенту через месяц и повторять каждый месяц, пока статус не изменится.'
    };
  } else if (project.reminder?.type === 'call-client-monthly') {
    project.reminder.active = false;
  }
  window.reminderService?.syncConditionalRefusal?.(project);
}

function createProjectFileInput(projectId) {
  const holder = document.getElementById('dynamicFileInput');
  holder.innerHTML = document.getElementById('fileInputTemplate').innerHTML;
  const input = document.getElementById('projectFileInput');
  input.addEventListener('change', event => addFilesToProject(projectId, [...event.target.files]));
  input.click();
}

function addFilesToProject(projectId, files) {
  const project = state.projects.find(item => item.id === projectId);
  if (!project || !files.length) return;
  let pending = files.length;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = () => {
      const nextFile = { id: uid('file'), name: file.name, type: file.type || 'file', size: file.size, dataUrl: reader.result, storageKey: reader.result, createdAt: new Date().toISOString() };
      project.files.push(nextFile);
      window.fileService?.addFile?.(projectId, nextFile);
      pending -= 1;
      if (!pending) { saveState(); renderProjectCard(); }
    };
    reader.onerror = () => {
      const nextFile = { id: uid('file'), name: file.name, type: file.type || 'file', size: file.size, createdAt: new Date().toISOString() };
      project.files.push(nextFile);
      window.fileService?.addFile?.(projectId, nextFile);
      pending -= 1;
      if (!pending) { saveState(); renderProjectCard(); }
    };
    reader.readAsDataURL(file);
  });
}

function renderBrief() {
  const root = document.getElementById('view-brief');
  const project = getActiveProject();
  if (!project) {
    root.innerHTML = `<div class="empty"><strong>Проект не выбран</strong></div>`;
    return;
  }
  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Бриф</h1>
        <p>Бриф находится внутри карточки проекта. При сохранении формируется Word-файл и попадает в файлы проекта.</p>
      </div>
      <div class="actions">
        <button class="btn soft" id="backToProjectCard">← Карточка проекта</button>
        <button class="btn primary" id="saveBriefAsDoc">Сохранить бриф в Word</button>
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <div>
          <h2>${esc(project.title)}</h2>
          <div class="card-subtitle">Функционал брифа оставлен как рабочий документ. С проектом, отчётами и калькулятором не связан.</div>
        </div>
        <span class="badge ${badgeClass(project.status)}">${esc(project.status)}</span>
      </div>
      <div class="form-grid">
        ${BRIEF_SECTIONS.map(section => `
          <label class="field field-wide">
            <span>${esc(section)}</span>
            <textarea rows="5" data-brief-section="${esc(section)}" placeholder="Ответы по разделу">${esc(project.brief[section] || '')}</textarea>
          </label>
        `).join('')}
      </div>
    </div>
  `;
  document.getElementById('backToProjectCard')?.addEventListener('click', () => setView('project-card'));
  document.querySelectorAll('[data-brief-section]').forEach(area => area.addEventListener('input', () => {
    project.brief[area.dataset.briefSection] = area.value;
    window.briefService?.save?.(project.id, project.brief);
    saveState();
  }));
  document.getElementById('saveBriefAsDoc')?.addEventListener('click', () => saveBriefWord(project));
}

function saveBriefWord(project) {
  const html = `
    <html><head><meta charset="utf-8"><title>Бриф — ${esc(project.title)}</title></head><body>
      <h1>Бриф проекта: ${esc(project.title)}</h1>
      <p><strong>Клиент:</strong> ${esc(project.clientName)}</p>
      <p><strong>Ниша:</strong> ${esc(project.niche)}</p>
      ${BRIEF_SECTIONS.map(section => `<h2>${esc(section)}</h2><p>${esc(project.brief[section] || 'Не заполнено').replace(/\n/g, '<br>')}</p>`).join('')}
    </body></html>`;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const reader = new FileReader();
  reader.onload = () => {
    const file = { id: uid('file'), name: `Бриф — ${project.title}.doc`, type: 'application/msword', dataUrl: reader.result, storageKey: reader.result, createdAt: new Date().toISOString() };
    project.files.push(file);
    window.briefService?.save?.(project.id, project.brief);
    window.briefService?.addWordFile?.(project.id, file);
    saveState();
    alert('Бриф сохранён в файлы проекта.');
    renderBrief();
  };
  reader.readAsDataURL(blob);
}

function renderStats() {
  const root = document.getElementById('view-stats');
  if (window.statisticsView) {
    window.statisticsView.render({ root });
    return;
  }

  if (root) {
    root.innerHTML = '<div class="card empty"><strong>Статистика не загружена</strong>Проверь подключение модулей статистики.</div>';
  }
  return;
}

function renderReports() {
  const projectOptions = state.projects.map(project => `<option value="${esc(project.id)}">${esc(project.title)}</option>`).join('');
  document.getElementById('view-reports').innerHTML = `
    <div class="page-head"><div><h1>Отчёты</h1><p>Рабочий центр подготовки отчётов по проектам, периодам и ключевым показателям.</p></div></div>
    <div class="reports-grid">
      <div class="card">
        <div class="card-head"><div><h2>Состав отчёта</h2><div class="card-subtitle">Выбери проект, период и тип документа для подготовки.</div></div></div>
        <div class="form-grid">
          <label class="field"><span>Проект</span><select><option value="all">Все проекты</option>${projectOptions}</select></label>
          <label class="field"><span>Тип отчёта</span><select><option>Еженедельный отчёт</option><option>Итоговый отчёт</option><option>Отчёт по лидам</option><option>Финансовая сводка</option></select></label>
          <label class="field"><span>Дата от</span><input type="date" /></label>
          <label class="field"><span>Дата до</span><input type="date" /></label>
          <label class="field field-wide"><span>Комментарий</span><textarea rows="4" placeholder="Короткая заметка для отчёта"></textarea></label>
        </div>
        <div class="actions" style="margin-top:16px;">
          <button class="btn primary" type="button">Сформировать</button>
          <button class="btn soft" type="button">Сохранить шаблон</button>
        </div>
      </div>
      <div class="card">
        <div class="card-head"><div><h2>Быстрые шаблоны</h2><div class="card-subtitle">Частые форматы для регулярной работы.</div></div></div>
        <div class="knowledge-list">
          <div class="knowledge-item"><div><strong>Еженедельный срез</strong><div class="row-sub">Лиды, CPL, бюджет, динамика</div></div><span class="badge blue">CRM</span></div>
          <div class="knowledge-item"><div><strong>Продление проекта</strong><div class="row-sub">Результаты, план, следующие шаги</div></div><span class="badge green">Клиент</span></div>
          <div class="knowledge-item"><div><strong>Финансы</strong><div class="row-sub">Расход, аванс, остаток, прогноз</div></div><span class="badge purple">Финансы</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderSite() {
  const root = document.getElementById('view-site');
  if (window.websiteView?.render) {
    window.websiteView.render({ root });
    return;
  }
  root.innerHTML = `<div class="empty"><strong>Раздел сайта не загружен</strong></div>`;
}

function renderCalculator() {
  const projectOptions = state.projects.map(project => `<option value="${project.id}">${esc(project.title)}</option>`).join('');
  document.getElementById('view-calculator').innerHTML = `
    <div class="page-head">
      <div><h1>Калькулятор</h1><p>Отдельный комбинированный инструмент: можно считать без проекта или сохранить расчёт в проект.</p></div>
    </div>
    <div class="calculator-grid">
      <div class="card">
        <h2>Исходные данные</h2>
        <div class="form-grid" id="calcForm">
          <label class="field"><span>Название расчёта</span><input id="calcTitle" value="KPI проекта" /></label>
          <label class="field"><span>Проект для сохранения</span><select id="calcProject"><option value="">Без проекта</option>${projectOptions}</select></label>
          <label class="field"><span>Бюджет</span><input id="calcBudget" type="number" value="50000" /></label>
          <label class="field"><span>Количество просмотров</span><input id="calcViews" type="number" value="10000" /></label>
          <label class="field"><span>Лиды всего</span><input id="calcLeads" type="number" value="100" /></label>
          <label class="field"><span>Цель — лидов в неделю</span><input id="calcWeeklyLeadsGoal" type="number" value="25" /></label>
          <label class="field"><span>Желаемый CPC, ₽</span><input id="calcDesiredCpc" type="number" value="5" /></label>
          <label class="field"><span>Конверсия в продажу, %</span><input id="calcSaleConversion" type="number" value="20" /></label>
          <label class="field"><span>Средний чек</span><input id="calcAvgCheck" type="number" value="70000" /></label>
          <label class="field"><span>Маржа, %</span><input id="calcMargin" type="number" value="30" /></label>
        </div>
        <div class="actions" style="margin-top:16px;">
          <button class="btn soft" id="saveCalcBtn">Сохранить в проект</button>
        </div>
      </div>
      <div class="card">
        <h2>Результат</h2>
        <div class="result-grid" id="calcResults"></div>
      </div>
    </div>
  `;
  document.querySelectorAll('#calcForm input, #calcForm select').forEach(input => {
    input.addEventListener('input', calculateKpi);
    input.addEventListener('change', calculateKpi);
  });
  document.getElementById('saveCalcBtn')?.addEventListener('click', saveCalculationToProject);
  calculateKpi();
}

function calculateKpi() {
  const budget = Number(document.getElementById('calcBudget')?.value || 0);
  const views = Number(document.getElementById('calcViews')?.value || 0);
  const leads = Number(document.getElementById('calcLeads')?.value || 0);
  const saleConversion = Number(document.getElementById('calcSaleConversion')?.value || 0);
  const avgCheck = Number(document.getElementById('calcAvgCheck')?.value || 0);
  const margin = Number(document.getElementById('calcMargin')?.value || 0);
  const result = window.calculatorService?.calculate?.({ budget, views, leads, saleConversion, avgCheck, margin }) || {};
  const sales = Number(result.sales || 0);
  const revenue = Number(result.revenue || 0);
  const profit = Number(result.profit || 0);
  const cpc = Number(result.cpc || 0);
  const cpl = Number(result.cpl || 0);
  const conversion = Number(result.conversion || 0);
  calculatorResults = {
    id: uid('calc'),
    title: document.getElementById('calcTitle')?.value || 'KPI проекта',
    projectId: document.getElementById('calcProject')?.value || '',
    budget,
    views,
    leads,
    weeklyLeadsGoal: Number(document.getElementById('calcWeeklyLeadsGoal')?.value || 0),
    desiredCpc: Number(document.getElementById('calcDesiredCpc')?.value || 0),
    saleConversion,
    avgCheck,
    margin,
    cpc,
    cpl,
    conversion,
    sales,
    revenue,
    profit,
    createdAt: new Date().toISOString()
  };
  const holder = document.getElementById('calcResults');
  if (!holder) return;
  holder.innerHTML = `
    ${resultBox(formatMoney(cpc), 'CPC')}
    ${resultBox(formatMoney(cpl), 'CPL')}
    ${resultBox(`${conversion.toFixed(2)}%`, 'Конверсия просмотр → лид')}
    ${resultBox(sales.toFixed(1), 'Продаж')}
    ${resultBox(formatMoney(revenue), 'Выручка')}
    ${resultBox(formatMoney(profit), 'Ориентир прибыли')}
  `;
}

function resultBox(value, label) {
  return `<div class="result-box"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
}

function saveCalculationToProject() {
  calculateKpi();
  if (!calculatorResults.projectId) {
    alert('Выбери проект, чтобы сохранить расчёт. Быстрый расчёт без проекта не сохраняется.');
    return;
  }
  const project = state.projects.find(item => item.id === calculatorResults.projectId);
  if (!project) return;
  project.calculations.push(calculatorResults);
  window.calculatorService?.saveResult?.(calculatorResults.projectId, calculatorResults);
  saveState();
  alert('Расчёт сохранён в проект. Он появится внизу карточки проекта.');
}

function renderSettings() {
  const theme = getUiTheme();
  const websiteNotifications = getWebsiteNotificationSettings();
  document.getElementById('view-settings').innerHTML = `
    <div class="page-head"><div><h1>Настройки</h1><p>Оформление интерфейса и базовые настройки ABS.</p></div></div>
    <div class="card">
      <div class="card-head">
        <div>
          <h2>Тема интерфейса</h2>
          <div class="card-subtitle">Светлая тема сохраняет тёмное боковое меню, тёмная переводит всю рабочую область в glass dashboard.</div>
        </div>
      </div>
      <div class="theme-switch" role="group" aria-label="Тема интерфейса">
        <button class="theme-option ${theme === 'dark' ? 'active' : ''}" type="button" data-theme-choice="dark">Тёмная тема</button>
        <button class="theme-option ${theme === 'light' ? 'active' : ''}" type="button" data-theme-choice="light">Светлая тема</button>
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <div>
          <h2>Сайт / Уведомления</h2>
          <div class="card-subtitle">Счётчик показывает только заявки сайта со статусом “новая”. Открытие раздела “Сайт” его не сбрасывает.</div>
        </div>
      </div>
      <label class="settings-toggle">
        <input id="websiteLeadBadgeToggle" type="checkbox" ${websiteNotifications.showNewLeadBadge ? 'checked' : ''}>
        <span>Показывать счётчик новых заявок в меню</span>
      </label>
    </div>
    <div class="card">
      <h2>Настройки системы</h2>
      <p class="muted">В будущем: пользователи, доступы, интеграции, безопасность, резервные копии, системные параметры.</p>
      <button class="btn danger" id="resetDemoState">Сбросить демо-данные</button>
    </div>
  `;
  document.querySelectorAll('[data-theme-choice]').forEach(btn => btn.addEventListener('click', () => {
    setUiTheme(btn.dataset.themeChoice);
    renderSettings();
  }));
  document.getElementById('websiteLeadBadgeToggle')?.addEventListener('change', event => {
    saveWebsiteNotificationSettings({ showNewLeadBadge: event.currentTarget.checked });
    updateWebsiteNewLeadBadge();
  });
  document.getElementById('resetDemoState')?.addEventListener('click', () => {
    if (!confirm('Сбросить локальные демо-данные?')) return;
    window.localStorageAdapter?.remove?.(STORAGE_KEY);
    window.localStorageAdapter?.remove?.(window.ABS_CONSTANTS?.entityStoreKey);
    window.localStorageAdapter?.remove?.(window.ABS_CONSTANTS?.uiStateKey);
    location.reload();
  });
}

function renderKnowledge() {
  const items = window.knowledgeBaseApi?.list?.() || state.knowledge;
  const categories = [...new Set(items.map(item => item.category || item.type).filter(Boolean))];
  const renderRows = (query = '', category = 'all') => {
    const normalizedQuery = query.toLowerCase();
    return items
      .filter(item => category === 'all' || (item.category || item.type) === category)
      .filter(item => !normalizedQuery || [item.title, item.type, item.category, item.content].join(' ').toLowerCase().includes(normalizedQuery))
      .map(item => `
        <div class="knowledge-item">
          <div><strong>${esc(item.title)}</strong><div class="row-sub">${esc(item.category || item.type || 'Материал')}</div></div>
          <button class="btn small" type="button">Открыть</button>
        </div>
      `).join('') || '<div class="empty compact"><strong>Ничего не найдено</strong>Попробуй изменить запрос или категорию.</div>';
  };
  document.getElementById('view-knowledge').innerHTML = `
    <div class="page-head"><div><h1>База знаний</h1><p>Рабочие файлы, ссылки, шаблоны, инструкции и регламенты.</p></div></div>
    <div class="card">
      <div class="stat-toolbar">
        <label class="field"><span>Поиск</span><input id="knowledgeSearch" type="search" placeholder="Название, тип или текст" /></label>
        <label class="field"><span>Категория</span><select id="knowledgeCategory"><option value="all">Все категории</option>${categories.map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('')}</select></label>
      </div>
      <div class="knowledge-list" id="knowledgeRows">${renderRows()}</div>
    </div>
  `;
  const search = document.getElementById('knowledgeSearch');
  const category = document.getElementById('knowledgeCategory');
  const update = () => {
    document.getElementById('knowledgeRows').innerHTML = renderRows(search?.value || '', category?.value || 'all');
  };
  search?.addEventListener('input', update);
  category?.addEventListener('change', update);
}

function bindTabs() {
  document.querySelectorAll('[data-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  }));
}

function openProjectModal() {
  const modal = document.getElementById('projectModal');
  document.querySelector('[name="status"]').innerHTML = PROJECT_STATUSES.map(status => `<option>${esc(status)}</option>`).join('');
  document.querySelector('[name="paymentDate"]').value = new Date().toISOString().slice(0, 10);
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeProjectModal() {
  const modal = document.getElementById('projectModal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('projectForm').reset();
}

function createProjectFromForm(event) {
  event.preventDefault();
  const formNode = event.currentTarget;
  const validation = window.validationService?.validateProjectCreateForm?.(formNode);
  if (validation && !validation.valid) return;
  const form = new FormData(formNode);
  const projectId = uid('project');
  const project = normalizeProject({
    id: projectId,
    comment: form.get('comment'),
    paymentType: form.get('paymentType'),
    paymentDate: form.get('paymentDate'),
    paymentAmount: Number(form.get('paymentAmount') || 0),
    clientName: form.get('clientName'),
    dealType: form.get('dealType'),
    phone: form.get('phone'),
    email: form.get('email'),
    title: form.get('title'),
    niche: form.get('niche'),
    status: form.get('status')
  });
  window.projectService?.createProject?.({
    id: projectId,
    comment: form.get('comment'),
    paymentType: form.get('paymentType'),
    paymentDate: form.get('paymentDate'),
    paymentAmount: Number(form.get('paymentAmount') || 0),
    clientName: form.get('clientName'),
    dealType: form.get('dealType'),
    phone: form.get('phone'),
    email: form.get('email'),
    title: form.get('title'),
    niche: form.get('niche'),
    status: form.get('status')
  });
  handleStatusChange(project);
  state.projects.unshift(project);
  activeProjectId = project.id;
  saveState();
  closeProjectModal();
  setView('project-card');
}

function downloadProjectTemplate() {
  const headers = ['Комментарий','Вид оплаты','Дата оплаты','Сумма оплаты','ФИО клиента','Вид сделки','Номер для связи','Электронная почта','Название проекта','Ниша','Статус'];
  downloadCsv('ABS_project_template.csv', [headers]);
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function openMobileMenu() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarBackdrop').classList.add('active');
  document.body.classList.add('menu-open');
}
function closeMobileMenu() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('active');
  document.body.classList.remove('menu-open');
}

function init() {
  applyUiTheme();
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => window.router?.go ? window.router.go(btn.dataset.view) : setView(btn.dataset.view)));
  document.getElementById('mobileMenuBtn')?.addEventListener('click', openMobileMenu);
  document.getElementById('sidebarBackdrop')?.addEventListener('click', closeMobileMenu);
  document.getElementById('closeProjectModal')?.addEventListener('click', closeProjectModal);
  document.getElementById('cancelProjectModal')?.addEventListener('click', closeProjectModal);
  document.getElementById('projectForm')?.addEventListener('submit', createProjectFromForm);
  render();
}

window.absApp = {
  renderBrief,
  renderCalculator,
  renderKnowledge,
  renderProjectCard,
  renderProjects,
  renderReports,
  renderSettings,
  renderSite,
  updateWebsiteNewLeadBadge,
  setView
};

init();
