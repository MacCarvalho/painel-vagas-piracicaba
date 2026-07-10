// Estado global da aplicação
let jobsData = [];
let activeFilters = {
  search: '',
  education: 'all',
  experience: 'all',
  city: 'all'
};
let sortBy = 'default';

// Elementos do DOM
const updateBadge = document.getElementById('update-badge');
const themeToggle = document.getElementById('theme-toggle');

const valTotalJobs = document.getElementById('val-total-jobs');
const valNoExperience = document.getElementById('val-no-experience');
const valCities = document.getElementById('val-cities');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');

const filterEducation = document.getElementById('filter-education');
const filterExperience = document.getElementById('filter-experience');
const filterCity = document.getElementById('filter-city');
const sortSelect = document.getElementById('sort-select');

const activeFiltersRow = document.getElementById('active-filters-row');
const activeFiltersTags = document.getElementById('active-filters-tags');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const resetEmptyBtn = document.getElementById('reset-empty-btn');

const resultsCount = document.getElementById('results-count');
const jobsGrid = document.getElementById('jobs-grid');
const emptyState = document.getElementById('empty-state');

// Modal
const jobModal = document.getElementById('job-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnApply = document.getElementById('btn-apply');
const modalJobTitle = document.getElementById('modal-job-title');
const modalJobSalary = document.getElementById('modal-job-salary');
const modalJobExperience = document.getElementById('modal-job-experience');
const modalJobEducation = document.getElementById('modal-job-education');
const modalJobLocation = document.getElementById('modal-job-location');
const modalJobDescription = document.getElementById('modal-job-description');
const modalJobDeadline = document.getElementById('modal-job-deadline');

/* ==========================================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  fetchJobs();
  setupEventListeners();
});

// Buscar vagas do JSON
async function fetchJobs() {
  let loadedData = null;
  
  // 1. Tentar ler do localStorage (Cache local do navegador para carregamento instantâneo)
  try {
    const cachedString = localStorage.getItem('vagas_data_cache');
    if (cachedString) {
      const cachedData = JSON.parse(cachedString);
      if (cachedData && cachedData.jobs) {
        loadedData = cachedData;
        jobsData = loadedData.jobs;
        
        if (loadedData.last_updated) {
          updateBadge.innerHTML = `<i class="fa-regular fa-clock"></i> <span>Atualizado (Cache): ${loadedData.last_updated}</span>`;
        }
        
        populateFilterDropdowns();
        calculateStats();
        filterAndRenderJobs();
      }
    }
  } catch (cacheError) {
    console.warn('Erro ao ler cache do localStorage:', cacheError);
  }
  
  // 2. Tentar usar VAGAS_DATA injetado pelo script vagas.js (Evita CORS em execução local por file://)
  if (typeof VAGAS_DATA !== 'undefined') {
    const scriptData = VAGAS_DATA;
    // Se o dado do script for mais novo/diferente do cache ou não houver cache
    if (!loadedData || loadedData.last_updated !== scriptData.last_updated) {
      loadedData = scriptData;
      jobsData = loadedData.jobs;
      
      try {
        localStorage.setItem('vagas_data_cache', JSON.stringify(scriptData));
      } catch (saveError) {
        console.warn('Erro ao salvar no localStorage:', saveError);
      }
      
      if (loadedData.last_updated) {
        updateBadge.innerHTML = `<i class="fa-regular fa-clock"></i> <span>Atualizado em: ${loadedData.last_updated}</span>`;
      }
      
      // Limpa dropdowns e recarrega para evitar duplicatas ao atualizar após o cache
      clearDynamicDropdowns();
      populateFilterDropdowns();
      calculateStats();
      filterAndRenderJobs();
    }
    return;
  }
  
  // 3. Fallback: buscar via HTTP fetch (caso o script não esteja presente)
  try {
    const response = await fetch('vagas.json');
    if (!response.ok) {
      throw new Error(`Falha ao carregar vagas.json: ${response.statusText}`);
    }
    
    const fetchedData = await response.json();
    if (!loadedData || loadedData.last_updated !== fetchedData.last_updated) {
      loadedData = fetchedData;
      jobsData = loadedData.jobs;
      
      try {
        localStorage.setItem('vagas_data_cache', JSON.stringify(fetchedData));
      } catch (saveError) {
        console.warn('Erro ao salvar no localStorage:', saveError);
      }
      
      if (loadedData.last_updated) {
        updateBadge.innerHTML = `<i class="fa-regular fa-clock"></i> <span>Atualizado em: ${loadedData.last_updated}</span>`;
      }
      
      clearDynamicDropdowns();
      populateFilterDropdowns();
      calculateStats();
      filterAndRenderJobs();
    }
  } catch (fetchError) {
    console.error('Erro ao buscar JSON via fetch:', fetchError);
    if (!loadedData) {
      resultsCount.textContent = 'Erro ao carregar dados.';
      updateBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Erro ao sincronizar</span>`;
    } else {
      // Se já carregamos do cache, avisa que estamos em modo offline
      updateBadge.innerHTML = `<i class="fa-solid fa-wifi-slash"></i> <span>Modo Offline: ${loadedData.last_updated}</span>`;
    }
  }
}

// Auxiliar para limpar os dropdowns dinâmicos ao atualizar dados
function clearDynamicDropdowns() {
  // Limpa opções de escolaridade, mantendo apenas a opção "Todas"
  while (filterEducation.options.length > 1) {
    filterEducation.remove(1);
  }
  // Limpa opções de cidades, mantendo apenas a opção "Todas"
  while (filterCity.options.length > 1) {
    filterCity.remove(1);
  }
}

/* ==========================================================================
   TEMA (DARK / LIGHT MODE)
   ========================================================================== */

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  let theme = 'dark';
  
  if (savedTheme) {
    theme = savedTheme;
  } else {
    // Detecta preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!prefersDark) {
      theme = 'light';
    }
  }
  
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  let newTheme = 'dark';
  
  if (currentTheme === 'dark') {
    newTheme = 'light';
  }
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

/* ==========================================================================
   ESTATÍSTICAS
   ========================================================================== */

function calculateStats() {
  valTotalJobs.textContent = jobsData.length;
  
  // Vagas sem experiência exigida
  const noExpJobs = jobsData.filter(job => {
    const expLower = job.experience.toLowerCase();
    if (expLower.includes('sem exigência') || expLower.includes('sem exigencia')) {
      return true;
    }
    return false;
  });
  valNoExperience.textContent = noExpJobs.length;
  
  // Cidades únicas atendidas nas restrições de localidade
  const cities = new Set();
  jobsData.forEach(job => {
    if (job.location_restriction && job.location_restriction !== 'Não informado') {
      // Divide por vírgula, " e " ou " e/ou "
      const parts = job.location_restriction.split(/,|\s+e\s+/i);
      parts.forEach(part => {
        const cleaned = part.trim()
                            .replace(/\.$/, '')
                            .replace(/^da\(s\)\s+cidade\(s\):\s*/i, '');
        if (cleaned.length > 2 && !cleaned.toLowerCase().includes('região') && !cleaned.toLowerCase().includes('regiao')) {
          cities.add(cleaned);
        }
      });
    }
  });
  
  // Se não achar nada, coloca pelo menos Piracicaba
  if (cities.size === 0) {
    cities.add('Piracicaba');
  }
  
  valCities.textContent = cities.size;
}

/* ==========================================================================
   FILTROS DINÂMICOS
   ========================================================================== */

function populateFilterDropdowns() {
  const educations = new Set();
  const cities = new Set();
  
  jobsData.forEach(job => {
    if (job.education && job.education !== 'Não informado') {
      educations.add(job.education);
    }
    
    if (job.location_restriction && job.location_restriction !== 'Não informado') {
      const parts = job.location_restriction.split(/,|\s+e\s+/i);
      parts.forEach(part => {
        const cleaned = part.trim()
                            .replace(/\.$/, '')
                            .replace(/^da\(s\)\s+cidade\(s\):\s*/i, '');
        if (cleaned.length > 2 && !cleaned.toLowerCase().includes('região') && !cleaned.toLowerCase().includes('regiao')) {
          // Padronizar capitalização de cidades comuns
          let cityName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
          if (cityName.toLowerCase() === 'rio das pedras') {
            cityName = 'Rio das Pedras';
          }
          if (cityName.toLowerCase() === 'santa bárbara d\'oeste' || cityName.toLowerCase() === "santa barbara d'oeste") {
            cityName = "Santa Bárbara D'oeste";
          }
          cities.add(cityName);
        }
      });
    }
  });
  
  // Preencher Escolaridade
  const sortedEducations = Array.from(educations).sort();
  sortedEducations.forEach(edu => {
    const opt = document.createElement('option');
    opt.value = edu;
    opt.textContent = edu;
    filterEducation.appendChild(opt);
  });
  
  // Preencher Cidades
  const sortedCities = Array.from(cities).sort();
  sortedCities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    filterCity.appendChild(opt);
  });
}

/* ==========================================================================
   LÓGICA DE FILTRAGEM & ORDENAÇÃO
   ========================================================================== */

function filterAndRenderJobs() {
  let filtered = [...jobsData];
  
  // 1. Filtro de Busca Textual (com suporte a acentuação simplificada)
  if (activeFilters.search.trim().length > 0) {
    const searchVal = normalizeString(activeFilters.search);
    filtered = filtered.filter(job => {
      const title = normalizeString(job.title);
      const desc = normalizeString(job.description);
      const loc = normalizeString(job.location_restriction);
      const exp = normalizeString(job.experience);
      const edu = normalizeString(job.education);
      
      if (title.includes(searchVal) || desc.includes(searchVal) || loc.includes(searchVal) || exp.includes(searchVal) || edu.includes(searchVal)) {
        return true;
      }
      return false;
    });
    clearSearchBtn.style.display = 'flex';
  } else {
    clearSearchBtn.style.display = 'none';
  }
  
  // 2. Filtro de Escolaridade
  if (activeFilters.education !== 'all') {
    filtered = filtered.filter(job => {
      if (job.education === activeFilters.education) {
        return true;
      }
      return false;
    });
  }
  
  // 3. Filtro de Experiência
  if (activeFilters.experience !== 'all') {
    filtered = filtered.filter(job => {
      const expLower = job.experience.toLowerCase();
      const isNoExp = expLower.includes('sem exigência') || expLower.includes('sem exigencia');
      
      if (activeFilters.experience === 'none') {
        if (isNoExp) {
          return true;
        }
      } else if (activeFilters.experience === 'required') {
        if (!isNoExp && job.experience !== 'Não informado') {
          return true;
        }
      }
      return false;
    });
  }
  
  // 4. Filtro de Cidade do Candidato
  if (activeFilters.city !== 'all') {
    const selCity = activeFilters.city.toLowerCase();
    filtered = filtered.filter(job => {
      // Se não há restrições de cidade, qualquer morador pode se candidatar
      if (!job.location_restriction || job.location_restriction === 'Não informado') {
        return true;
      }
      
      const locLower = job.location_restriction.toLowerCase();
      // Se a cidade está listada explicitamente
      if (locLower.includes(selCity)) {
        return true;
      }
      // Se aceita região geral
      if (locLower.includes('região') || locLower.includes('regiao') || locLower.includes('regio')) {
        return true;
      }
      return false;
    });
  }
  
  // 5. Ordenação
  sortJobs(filtered);
  
  // Renderizar na tela
  renderJobs(filtered);
  updateActiveFilterTags();
}

// Auxiliar para normalizar strings (remover acentos)
function normalizeString(str) {
  if (!str) {
    return '';
  }
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
}

// Auxiliar para converter salário string em número
function parseSalary(salaryStr) {
  if (!salaryStr) {
    return 0;
  }
  
  const lower = salaryStr.toLowerCase();
  if (lower.includes('não informado') || lower.includes('nao informado') || lower.includes('a combinar')) {
    return 0;
  }
  
  // Exemplo: "R$ 1.910,06" ou "R$ 10,00 por hora" ou "R$ 23,48 por hora"
  let clean = salaryStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  
  // Regex para achar o primeiro número decimal ou inteiro
  const match = clean.match(/[\d.]+/);
  if (match) {
    let val = parseFloat(match[0]);
    // Se o salário for menor que 100 reais, provavelmente é por hora.
    // Multiplicamos por 180h para podermos ordenar proporcionalmente com vagas mensais.
    if (val < 100) {
      if (lower.includes('hora')) {
        val = val * 180;
      }
    }
    return val;
  }
  
  return 0;
}

// Ordenação
function sortJobs(jobs) {
  if (sortBy === 'title-asc') {
    jobs.sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  } else if (sortBy === 'title-desc') {
    jobs.sort((a, b) => {
      return b.title.localeCompare(a.title);
    });
  } else if (sortBy === 'salary-desc') {
    jobs.sort((a, b) => {
      return parseSalary(b.salary) - parseSalary(a.salary);
    });
  } else if (sortBy === 'salary-asc') {
    // Vagas com salário 0 (não informado) vão para o fim da fila de forma amigável
    jobs.sort((a, b) => {
      const salA = parseSalary(a.salary);
      const salB = parseSalary(b.salary);
      if (salA === 0) {
        return 1;
      }
      if (salB === 0) {
        return -1;
      }
      return salA - salB;
    });
  }
}

/* ==========================================================================
   RENDERIZAÇÃO DOS CARDS
   ========================================================================== */

function renderJobs(jobs) {
  jobsGrid.innerHTML = '';
  
  if (jobs.length === 0) {
    resultsCount.textContent = 'Nenhuma vaga';
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  resultsCount.textContent = `${jobs.length} ${jobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}`;
  
  jobs.forEach(job => {
    const card = document.createElement('article');
    card.className = 'job-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Vaga para ${job.title}`);
    
    // Verificações de Badges
    const isSalaryDisclosed = !job.salary.toLowerCase().includes('não informado') && !job.salary.toLowerCase().includes('nao informado');
    const salaryBadge = isSalaryDisclosed ? 
      `<span class="badge badge-salary"><i class="fa-solid fa-money-bill-wave"></i> ${job.salary}</span>` :
      `<span class="badge badge-no-salary">Salário não informado</span>`;
      
    const isNoExp = job.experience.toLowerCase().includes('sem exigência') || job.experience.toLowerCase().includes('sem exigencia');
    const expBadge = isNoExp ? 
      `<span class="badge badge-no-exp"><i class="fa-solid fa-user-check"></i> Sem Experiência</span>` : '';
      
    // Tratar prazo curto (alerta se menor que 4 dias)
    let deadlineWarning = '';
    if (job.deadline && job.deadline !== 'Não informado') {
      deadlineWarning = `<span class="deadline-warning"><i class="fa-regular fa-clock"></i> Prazo: ${job.deadline}</span>`;
    }
    
    card.innerHTML = `
      <div class="job-card-header">
        <h3 class="job-card-title">${job.title}</h3>
        <div class="job-card-meta-top">
          ${salaryBadge}
          ${expBadge}
        </div>
      </div>
      <div class="job-card-body">
        <p class="job-card-description">${job.description || 'Clique em Ver Detalhes para ver as atividades da vaga.'}</p>
        <div class="job-card-tags">
          <div class="tag-item">
            <i class="fa-solid fa-graduation-cap"></i>
            <span>${job.education}</span>
          </div>
          <div class="tag-item">
            <i class="fa-solid fa-suitcase"></i>
            <span>${job.experience}</span>
          </div>
          <div class="tag-item">
            <i class="fa-solid fa-location-dot"></i>
            <span>Restrição: ${job.location_restriction}</span>
          </div>
        </div>
      </div>
      <div class="job-card-footer">
        ${deadlineWarning}
        <button class="btn-details">Ver Detalhes <i class="fa-solid fa-arrow-right"></i></button>
      </div>
    `;
    
    // Evento de clique no Card para abrir Modal
    card.addEventListener('click', () => {
      openJobModal(job);
    });
    
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openJobModal(job);
      }
    });
    
    jobsGrid.appendChild(card);
  });
}

/* ==========================================================================
   GERENCIAMENTO DE TAGS DE FILTRO
   ========================================================================== */

function updateActiveFilterTags() {
  activeFiltersTags.innerHTML = '';
  let count = 0;
  
  if (activeFilters.search.trim().length > 0) {
    addFilterTag(`Busca: "${activeFilters.search}"`, () => {
      activeFilters.search = '';
      searchInput.value = '';
      filterAndRenderJobs();
    });
    count++;
  }
  
  if (activeFilters.education !== 'all') {
    addFilterTag(activeFilters.education, () => {
      activeFilters.education = 'all';
      filterEducation.value = 'all';
      filterAndRenderJobs();
    });
    count++;
  }
  
  if (activeFilters.experience !== 'all') {
    const label = activeFilters.experience === 'none' ? 'Sem Experiência' : 'Com Experiência';
    addFilterTag(label, () => {
      activeFilters.experience = 'all';
      filterExperience.value = 'all';
      filterAndRenderJobs();
    });
    count++;
  }
  
  if (activeFilters.city !== 'all') {
    addFilterTag(`Reside em: ${activeFilters.city}`, () => {
      activeFilters.city = 'all';
      filterCity.value = 'all';
      filterAndRenderJobs();
    });
    count++;
  }
  
  if (count > 0) {
    activeFiltersRow.style.display = 'flex';
  } else {
    activeFiltersRow.style.display = 'none';
  }
}

function addFilterTag(text, onRemove) {
  const tag = document.createElement('div');
  tag.className = 'filter-tag';
  tag.innerHTML = `
    <span>${text}</span>
    <button aria-label="Remover filtro ${text}"><i class="fa-solid fa-xmark"></i></button>
  `;
  tag.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation();
    onRemove();
  });
  activeFiltersTags.appendChild(tag);
}

function resetAllFilters() {
  activeFilters.search = '';
  activeFilters.education = 'all';
  activeFilters.experience = 'all';
  activeFilters.city = 'all';
  sortBy = 'default';
  
  searchInput.value = '';
  filterEducation.value = 'all';
  filterExperience.value = 'all';
  filterCity.value = 'all';
  sortSelect.value = 'default';
  
  filterAndRenderJobs();
}

/* ==========================================================================
   MODAL DE DETALHES
   ========================================================================== */

function openJobModal(job) {
  modalJobTitle.textContent = job.title;
  modalJobSalary.textContent = job.salary;
  modalJobExperience.textContent = job.experience;
  modalJobEducation.textContent = job.education;
  modalJobLocation.textContent = job.location_restriction;
  modalJobDescription.textContent = job.description || 'Descrição detalhada não informada pela prefeitura.';
  
  if (job.deadline && job.deadline !== 'Não informado') {
    modalJobDeadline.textContent = `A vaga ficará disponível no CAT até ${job.deadline} (ou até atingir o limite de encaminhamentos).`;
  } else {
    modalJobDeadline.textContent = 'A vaga pode expirar ou ser suspensa a qualquer momento pela prefeitura.';
  }
  
  // Link dinâmico com título da vaga pré-preenchido no formulário de candidatura do CAT
  btnApply.href = `https://docs.google.com/forms/d/e/1FAIpQLSdKx8Dbk8PSt2RLAUbcscVjmLd6A0XxxAfWOVYcMH_wQ5CKiA/viewform?entry.1322084709=${encodeURIComponent(job.title)}`;
  
  // Abrir o modal
  jobModal.style.display = 'flex';
  setTimeout(() => {
    jobModal.classList.add('open');
  }, 10);
  document.body.style.overflow = 'hidden';
  
  // Foca no botão fechar por acessibilidade
  closeModalBtn.focus();
}

function closeJobModal() {
  jobModal.classList.remove('open');
  setTimeout(() => {
    jobModal.style.display = 'none';
  }, 300);
  document.body.style.overflow = '';
}

/* ==========================================================================
   EVENT LISTENERS
   ========================================================================== */

function setupEventListeners() {
  // Tema
  themeToggle.addEventListener('click', toggleTheme);
  
  // Digitação de busca (com Debounce simples)
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      activeFilters.search = e.target.value;
      filterAndRenderJobs();
    }, 250);
  });
  
  // Botão de limpar busca
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    activeFilters.search = '';
    filterAndRenderJobs();
  });
  
  // Filtros selects
  filterEducation.addEventListener('change', (e) => {
    activeFilters.education = e.target.value;
    filterAndRenderJobs();
  });
  
  filterExperience.addEventListener('change', (e) => {
    activeFilters.experience = e.target.value;
    filterAndRenderJobs();
  });
  
  filterCity.addEventListener('change', (e) => {
    activeFilters.city = e.target.value;
    filterAndRenderJobs();
  });
  
  // Ordenação
  sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    filterAndRenderJobs();
  });
  
  // Resets
  resetFiltersBtn.addEventListener('click', resetAllFilters);
  resetEmptyBtn.addEventListener('click', resetAllFilters);
  
  // Modal fechar
  closeModalBtn.addEventListener('click', closeJobModal);
  btnCancelModal.addEventListener('click', closeJobModal);
  
  // Fechar modal clicando fora
  jobModal.addEventListener('click', (e) => {
    if (e.target === jobModal) {
      closeJobModal();
    }
  });
  
  // Fechar com tecla Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && jobModal.classList.contains('open')) {
      closeJobModal();
    }
  });
}
