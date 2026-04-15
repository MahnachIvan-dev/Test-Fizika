const JSONBIN_MASTER_KEY = '$2a$10$xOPuIrqTd9DYAZmH08AVheX68HX2rdQjP99fTXjr2IEzOp/YKBMtW';

const BIN_KINEMATIKA_ID = '6947e7e3ae596e708fa87174';
const BIN_DINAMIKA_ID = '6947e801d0ea881f4037ca43';
const BIN_STATIKA_ID = '6947e826d0ea881f4037ca6f';
const BIN_SOKHRANENIE_ID = '6947e84cae596e708fa871f7';

const BIN_PASSWORD_ID = '6947bf3a43b1c97be9fc774c';
const BIN_NORMAL_RESULTS_ID = '6947c94743b1c97be9fc85ff';
const BIN_ACCOUNT_RESULTS_ID = '6947c90bd0ea881f40379ed3';
const BIN_SETTINGS_ID = '6947d65443b1c97be9fc999c';

const JSONBIN_HEADERS = {
  'Content-Type': 'application/json',
  'X-Master-Key': JSONBIN_MASTER_KEY
};

let allQuestions = {
  kinematika: [],
  dinamika: [],
  statika: [],
  sokhranenie: []
};

let currentSettings = {
  selectedTopics: ['all'],
  questionCount: 10,
  lastUsed: null
};

async function loadAllQuestions() {
  try {
    console.log('🔄 Загрузка вопросов из всех тем...');
    
    const [kinematikaData, dinamikaData, statikaData, sokhranenieData] = await Promise.all([
      loadFromBin(BIN_KINEMATIKA_ID),
      loadFromBin(BIN_DINAMIKA_ID),
      loadFromBin(BIN_STATIKA_ID),
      loadFromBin(BIN_SOKHRANENIE_ID)
    ]);
    
    allQuestions = {
      kinematika: kinematikaData?.kinematika || [],
      dinamika: dinamikaData?.dinamika || [],
      statika: statikaData?.statika || [],
      sokhranenie: sokhranenieData?.sokhranenie || []
    };
    
    console.log('✅ Вопросы загружены:');
    console.log(`   Кинематика: ${allQuestions.kinematika.length} вопросов`);
    console.log(`   Динамика: ${allQuestions.dinamika.length} вопросов`);
    console.log(`   Статика: ${allQuestions.statika.length} вопросов`);
    console.log(`   Законы сохранения: ${allQuestions.sokhranenie.length} вопросов`);
    
    const totalQuestions = Object.values(allQuestions).reduce((sum, topic) => sum + topic.length, 0);
    if (totalQuestions === 0) {
      console.warn('⚠️ Внимание: вопросы не загружены!');
    }
    
    return allQuestions;
  } catch (error) {
    console.error('❌ Ошибка загрузки вопросов:', error);
    return allQuestions;
  }
}

async function loadFromBin(binId) {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: JSONBIN_HEADERS
    });
    
    if (!response.ok) {
      console.error(`HTTP ${response.status} для bin ${binId}`);
      return null;
    }
    
    const data = await response.json();
    return data.record || null;
  } catch (error) {
    console.error(`JSONBin load error для ${binId}:`, error);
    return null;
  }
}

async function saveToBin(binId, data) {
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: JSONBIN_HEADERS,
      body: JSON.stringify(data)
    });
    
    return response.ok;
  } catch (error) {
    console.error('JSONBin save error:', error);
    return false;
  }
}

async function loadSettings() {
  const settings = await loadFromBin(BIN_SETTINGS_ID);
  if (settings) {
    currentSettings = { ...currentSettings, ...settings };
  }
  return currentSettings;
}

async function saveSettings() {
  currentSettings.lastUsed = new Date().toISOString();
  return await saveToBin(BIN_SETTINGS_ID, currentSettings);
}

function getRandomQuestions(selectedTopics, count) {
  let allSelectedQuestions = [];
  
  if (selectedTopics.includes('all')) {
    Object.values(allQuestions).forEach(topicQuestions => {
      if (Array.isArray(topicQuestions) && topicQuestions.length > 0) {
        allSelectedQuestions = allSelectedQuestions.concat(topicQuestions);
      }
    });
  } else {
    selectedTopics.forEach(topic => {
      if (allQuestions[topic] && Array.isArray(allQuestions[topic]) && allQuestions[topic].length > 0) {
        allSelectedQuestions = allSelectedQuestions.concat(allQuestions[topic]);
      }
    });
  }
  
  console.log(`📊 Доступно вопросов: ${allSelectedQuestions.length}`);
  console.log(`🎯 Требуется вопросов: ${count}`);
  
  if (allSelectedQuestions.length === 0) {
    console.error('❌ Нет доступных вопросов по выбранным темам');
    return [];
  }
  
  const shuffledQuestions = shuffleArray(allSelectedQuestions);
  
  if (shuffledQuestions.length <= count) {
    console.log(`📝 Возвращаем все доступные вопросы (${shuffledQuestions.length})`);
    return shuffledQuestions;
  }
  
  console.log(`🎲 Выбираем ${count} случайных вопросов из ${shuffledQuestions.length}`);
  return shuffledQuestions.slice(0, count);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function showBeautifulQuizResults(correct, total, accountInfo = null) {
  const quizCard = document.getElementById('quizCard');
  const resultCard = document.getElementById('resultCard');
  
  if (quizCard) quizCard.style.display = 'none';
  
  if (resultCard) {
    resultCard.style.display = 'block';
    resultCard.hidden = false;
    
    const wrong = total - correct;
    const accuracy = Math.round((correct / total) * 100);
    const grade = Math.round((correct / total) * 10);
    const timestamp = new Date().toLocaleString('ru-RU');
    
    const circleProgress = document.querySelector('.circle-progress');
    if (circleProgress) {
      const circumference = 2 * Math.PI * 60;
      const offset = circumference - (accuracy / 100) * circumference;
      
      circleProgress.style.strokeDasharray = `${circumference} ${circumference}`;
      circleProgress.style.strokeDashoffset = circumference;
      
      setTimeout(() => {
        circleProgress.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
        circleProgress.style.strokeDashoffset = offset;
      }, 300);
    }
    
    const correctCountEl = document.getElementById('correctCount');
    const wrongCountEl = document.getElementById('wrongCount');
    const accuracyTextEl = document.getElementById('accuracyText');
    const percentTextEl = document.getElementById('percentText');
    const gradeTextEl = document.getElementById('gradeText');
    const totalQuestionsEl = document.getElementById('totalQuestions');
    
    if (correctCountEl) correctCountEl.textContent = correct;
    if (wrongCountEl) wrongCountEl.textContent = wrong;
    if (accuracyTextEl) accuracyTextEl.textContent = accuracy + '%';
    if (percentTextEl) percentTextEl.textContent = accuracy + '%';
    if (gradeTextEl) gradeTextEl.textContent = grade + '/10';
    if (totalQuestionsEl) totalQuestionsEl.textContent = total;
    
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.textContent = '← Вернуться назад';
      restartBtn.onclick = () => {
        window.location.href = 'index.html';
      };
      
      restartBtn.style.cssText = `
        background: linear-gradient(135deg, #0078d4, #106ebe);
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 4px 15px rgba(0, 120, 212, 0.2);
      `;
      
      restartBtn.innerHTML = '← Вернуться на главную';
      
      restartBtn.addEventListener('mouseenter', () => {
        restartBtn.style.transform = 'translateY(-2px)';
        restartBtn.style.boxShadow = '0 6px 20px rgba(0, 120, 212, 0.3)';
      });
      
      restartBtn.addEventListener('mouseleave', () => {
        restartBtn.style.transform = 'translateY(0)';
        restartBtn.style.boxShadow = '0 4px 15px rgba(0, 120, 212, 0.2)';
      });
    }
    
    if (accountInfo) {
      const resultStats = document.querySelector('.result-stats');
      if (resultStats) {
        const accountDiv = document.createElement('div');
        accountDiv.className = 'account-results-info';
        accountDiv.innerHTML = `
          <div class="account-results-header">
            <h3>📋 Учётные данные</h3>
          </div>
          <div class="account-results-details">
            <div class="account-detail">
              <span class="account-label">ФИО:</span>
              <span class="account-value">${accountInfo.fio}</span>
            </div>
            <div class="account-detail">
              <span class="account-label">Класс:</span>
              <span class="account-value">${accountInfo.classNum}${accountInfo.classLetter}</span>
            </div>
            <div class="account-detail">
              <span class="account-label">Дата и время:</span>
              <span class="account-value">${timestamp}</span>
            </div>
          </div>
        `;
        
        resultStats.insertBefore(accountDiv, restartBtn);
      }
    }
    
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .result-card {
        animation: fadeInUp 0.6s ease-out;
      }
      
      .circle-progress {
        animation: pulse 2s ease-in-out infinite;
      }
      
      .account-results-info {
        background: linear-gradient(135deg, rgba(11, 99, 246, 0.08), rgba(11, 99, 246, 0.03));
        border-radius: 16px;
        padding: 20px;
        margin: 24px 0;
        border: 1px solid rgba(11, 99, 246, 0.15);
        backdrop-filter: blur(10px);
        animation: fadeInUp 0.8s ease-out;
      }
      
      .account-results-header h3 {
        color: #0B63F6;
        margin-bottom: 16px;
        font-size: 1.2rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .account-results-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .account-detail {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }
      
      .account-detail:last-child {
        border-bottom: none;
      }
      
      .account-label {
        color: #666;
        font-weight: 500;
        font-size: 0.95rem;
      }
      
      .account-value {
        color: #111827;
        font-weight: 600;
        font-size: 1rem;
      }
    `;
    document.head.appendChild(animationStyle);
  }
}

function showSavedNotification(mode) {
  const savedMsg = document.createElement('div');
  savedMsg.className = 'saved-notification';
  savedMsg.innerHTML = `
    <div class="saved-content">
      <div class="saved-icon">✅</div>
      <div class="saved-text">
        <strong>Результаты сохранены!</strong>
        <small>Данные сохранены в ${mode} журнал</small>
      </div>
      <button class="saved-close">✕</button>
    </div>
  `;
  
  document.body.appendChild(savedMsg);
  
  const style = document.createElement('style');
  style.textContent = `
    .saved-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4CAF50, #45a049);
      color: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.5s ease-out;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      min-width: 300px;
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .saved-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .saved-icon {
      font-size: 24px;
    }
    
    .saved-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .saved-text strong {
      font-size: 1rem;
      font-weight: 600;
    }
    
    .saved-text small {
      font-size: 0.85rem;
      opacity: 0.9;
    }
    
    .saved-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    .saved-close:hover {
      background: rgba(255,255,255,0.3);
    }
  `;
  document.head.appendChild(style);
  
  savedMsg.querySelector('.saved-close').addEventListener('click', () => {
    savedMsg.style.animation = 'slideOutRight 0.3s ease-out';
    savedMsg.style.transform = 'translateX(100%)';
    savedMsg.style.opacity = '0';
    setTimeout(() => savedMsg.remove(), 300);
  });
  
  setTimeout(() => {
    if (savedMsg.parentNode) {
      savedMsg.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => savedMsg.remove(), 300);
    }
  }, 5000);
}

function showAdminResultsModal() {
  const oldModal = document.getElementById('adminResultsModal');
  if (oldModal) oldModal.remove();
  
  const modal = document.createElement('div');
  modal.id = 'adminResultsModal';
  modal.className = 'admin-results-modal';
  
  modal.innerHTML = `
    <div class="admin-results-overlay">
      <div class="admin-results-window">
        <div class="admin-results-header">
          <div class="admin-results-title">
            <span class="results-icon">📊</span>
            <span>Результаты тестов</span>
          </div>
          <button class="admin-results-close" id="adminResultsClose">✕</button>
        </div>
        
        <div class="admin-results-content">
          <div class="results-loading" id="resultsLoading">
            <div class="loading-spinner"></div>
            <div class="loading-text">Загрузка результатов...</div>
          </div>
          
          <div class="results-tabs-container" id="resultsTabs" style="display: none;">
            <div class="results-tabs-header">
              <button class="results-tab-btn active" data-tab="normal">
                <span class="tab-icon">👤</span>
                <span class="tab-text">Обычные</span>
                <span class="tab-counter" id="normalCount">0</span>
              </button>
              <button class="results-tab-btn" data-tab="account">
                <span class="tab-icon">📋</span>
                <span class="tab-text">Учётные</span>
                <span class="tab-counter" id="accountCount">0</span>
              </button>
            </div>
            
            <div class="results-tab-content active" id="normalResultsTab">
              <div class="results-list" id="normalResultsList"></div>
            </div>
            
            <div class="results-tab-content" id="accountResultsTab">
              <div class="results-list" id="accountResultsList"></div>
            </div>
          </div>
          
          <div class="results-empty" id="resultsEmpty" style="display: none;">
            <div class="empty-icon">📭</div>
            <div class="empty-title">Нет результатов</div>
            <div class="empty-text">Пока никто не проходил тесты</div>
          </div>
        </div>
        
        <div class="admin-results-footer">
          <div class="results-stats">
            <div class="stat-item">
              <span class="stat-label">Всего тестов:</span>
              <span class="stat-value" id="totalTests">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Обычные:</span>
              <span class="stat-value" id="normalTests">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Учётные:</span>
              <span class="stat-value" id="accountTests">0</span>
            </div>
          </div>
          <button class="results-close-btn" id="resultsCloseBtn">Закрыть</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const style = document.createElement('style');
  style.textContent = `
    .admin-results-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
    }
    
    .admin-results-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .admin-results-window {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.2);
      width: 100%;
      max-width: 900px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    .admin-results-header {
      background: linear-gradient(90deg, #0078d4, #106ebe);
      color: white;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 16px 16px 0 0;
    }
    
    .admin-results-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 18px;
    }
    
    .results-icon { font-size: 20px; }
    
    .admin-results-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    
    .admin-results-close:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
    
    .admin-results-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
    
    .results-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 16px;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #0078d4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .loading-text {
      color: #666;
      font-size: 14px;
    }
    
    .results-tabs-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .results-tabs-header {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    
    .results-tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      border-radius: 8px 8px 0 0;
      transition: all 0.2s;
      position: relative;
    }
    
    .results-tab-btn:hover {
      background: rgba(0, 120, 212, 0.05);
      color: #0078d4;
    }
    
    .results-tab-btn.active {
      color: #0078d4;
      background: rgba(0, 120, 212, 0.1);
    }
    
    .results-tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      right: 0;
      height: 2px;
      background: #0078d4;
    }
    
    .tab-icon { font-size: 16px; }
    
    .tab-counter {
      background: rgba(0, 120, 212, 0.1);
      color: #0078d4;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .results-tab-content { display: none; }
    .results-tab-content.active { display: block; }
    
    .results-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 8px;
    }
    
    .result-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s;
    }
    
    .result-card:hover {
      border-color: #0078d4;
      box-shadow: 0 4px 12px rgba(0, 120, 212, 0.1);
    }
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .result-date {
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
    
    .result-score {
      background: linear-gradient(135deg, #0078d4, #106ebe);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .result-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .result-detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      border-bottom: 1px solid #f3f2f1;
    }
    
    .result-detail-item:last-child { border-bottom: none; }
    
    .result-label {
      color: #666;
      font-size: 13px;
    }
    
    .result-value {
      color: #111827;
      font-weight: 500;
      font-size: 13px;
    }
    
    .result-fio {
      font-weight: 600;
      color: #111827;
      font-size: 15px;
    }
    
    .result-class {
      color: #666;
      font-size: 13px;
    }
    
    .results-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 16px;
      text-align: center;
    }
    
    .empty-icon {
      font-size: 48px;
      color: #d1d5db;
    }
    
    .empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #666;
    }
    
    .empty-text {
      font-size: 14px;
      color: #9ca3af;
    }
    
    .admin-results-footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(249, 250, 251, 0.5);
      border-radius: 0 0 16px 16px;
    }
    
    .results-stats {
      display: flex;
      gap: 20px;
    }
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    
    .stat-value {
      color: #111827;
      font-weight: 600;
      font-size: 14px;
    }
    
    .results-close-btn {
      background: #0078d4;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .results-close-btn:hover {
      background: #106ebe;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
    }
  `;
  document.head.appendChild(style);
  
  loadResults();
  
  function setupEventListeners() {
    modal.querySelector('#adminResultsClose').addEventListener('click', closeModal);
    modal.querySelector('#resultsCloseBtn').addEventListener('click', closeModal);
    
    modal.querySelector('.admin-results-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('admin-results-overlay')) {
        closeModal();
      }
    });
    
    modal.querySelectorAll('.results-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.results-tab-btn').forEach(b => b.classList.remove('active'));
        modal.querySelectorAll('.results-tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.dataset.tab + 'ResultsTab';
        modal.querySelector(`#${tabId}`).classList.add('active');
      });
    });
  }
  
  async function loadResults() {
    try {
      const [normalResults, accountResults] = await Promise.all([
        loadFromBin(BIN_NORMAL_RESULTS_ID),
        loadFromBin(BIN_ACCOUNT_RESULTS_ID)
      ]);
      
      const normalResultsArray = Array.isArray(normalResults) ? normalResults : [];
      const accountResultsArray = Array.isArray(accountResults) ? accountResults : [];
      
      updateStats(normalResultsArray, accountResultsArray);
      updateResultsList('normal', normalResultsArray);
      updateResultsList('account', accountResultsArray);
      
      setTimeout(() => {
        const loading = modal.querySelector('#resultsLoading');
        const tabs = modal.querySelector('#resultsTabs');
        const empty = modal.querySelector('#resultsEmpty');
        
        if (normalResultsArray.length === 0 && accountResultsArray.length === 0) {
          loading.style.display = 'none';
          empty.style.display = 'flex';
        } else {
          loading.style.display = 'none';
          tabs.style.display = 'block';
        }
      }, 500);
      
    } catch (error) {
      console.error('Ошибка загрузки результатов:', error);
      const loading = modal.querySelector('#resultsLoading');
      loading.innerHTML = `
        <div class="empty-icon">❌</div>
        <div class="empty-title">Ошибка загрузки</div>
        <div class="empty-text">Не удалось загрузить результаты</div>
      `;
    }
  }
  
  function updateStats(normalResults, accountResults) {
    const total = normalResults.length + accountResults.length;
    modal.querySelector('#totalTests').textContent = total;
    modal.querySelector('#normalTests').textContent = normalResults.length;
    modal.querySelector('#accountTests').textContent = accountResults.length;
    modal.querySelector('#normalCount').textContent = normalResults.length;
    modal.querySelector('#accountCount').textContent = accountResults.length;
  }
  
  function updateResultsList(type, results) {
    const listElement = modal.querySelector(`#${type}ResultsList`);
    if (!listElement || !Array.isArray(results)) return;
    
    if (results.length === 0) {
      listElement.innerHTML = `
        <div class="results-empty">
          <div class="empty-icon">📭</div>
          <div class="empty-title">Нет ${type === 'normal' ? 'обычных' : 'учётных'} результатов</div>
          <div class="empty-text">Пока никто не проходил тесты в этом режиме</div>
        </div>
      `;
      return;
    }
    
    const recentResults = results.slice(0, 20);
    listElement.innerHTML = recentResults.map((result, index) => {
      const date = result.timestamp || result.date || 'Нет даты';
      const accuracy = result.accuracy || 0;
      const grade = result.grade || 0;
      const correct = result.correct || 0;
      const total = result.total || 1;
      const wrong = total - correct;
      
      if (type === 'normal') {
        return `
          <div class="result-card">
            <div class="result-header">
              <div class="result-date">${date}</div>
              <div class="result-score">${correct}/${total} (${accuracy}%)</div>
            </div>
            <div class="result-details">
              <div class="result-detail-item">
                <span class="result-label">Правильных ответов:</span>
                <span class="result-value">${correct}</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Неправильных ответов:</span>
                <span class="result-value">${wrong}</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Точность:</span>
                <span class="result-value">${accuracy}%</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Оценка (10-балльная):</span>
                <span class="result-value">${grade}/10</span>
              </div>
            </div>
          </div>
        `;
      } else {
        const fio = result.account?.fio || 'Не указано';
        const classNum = result.account?.classNum || '?';
        const classLetter = result.account?.classLetter || '';
        
        return `
          <div class="result-card">
            <div class="result-header">
              <div class="result-date">${date}</div>
              <div class="result-score">${correct}/${total} (${accuracy}%)</div>
            </div>
            <div class="result-details">
              <div class="result-detail-item">
                <span class="result-label">ФИО:</span>
                <span class="result-fio">${fio}</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Класс:</span>
                <span class="result-class">${classNum}${classLetter}</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Правильных ответов:</span>
                <span class="result-value">${correct}</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Неправильных ответов:</span>
                <span class="result-value">${wrong}</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Точность:</span>
                <span class="result-value">${accuracy}%</span>
              </div>
              <div class="result-detail-item">
                <span class="result-label">Оценка:</span>
                <span class="result-value">${grade}/10</span>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');
  }
  
  function closeModal() {
    modal.style.animation = 'fadeOut 0.3s ease';
    modal.style.opacity = '0';
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }
  
  setTimeout(setupEventListeners, 100);
}

function initMainPage() {
  const startTestBtn = document.getElementById('startTestBtn');
  const modeModal = document.getElementById('modeModal');
  const accountModal = document.getElementById('accountModal');
  const adminModal = document.getElementById('adminModal');
  
  const normalModeBtn = document.getElementById('normalModeBtn');
  const accountModeBtn = document.getElementById('accountModeBtn');
  const accountSubmitBtn = document.getElementById('accountSubmitBtn');
  
  const adminPassInput = document.getElementById('adminPassInput');
  const adminPassSubmit = document.getElementById('adminPassSubmit');
  const adminError = document.getElementById('adminError');
  const adminStage1 = document.getElementById('adminStage1');
  const adminStage2 = document.getElementById('adminStage2');
  
  const adminButton = document.getElementById('adminButton');
  const adminResultsBtn = document.getElementById('adminResultsBtn');
  const adminSaveBtn = document.getElementById('adminSaveBtn');
  
  const topicButtons = document.querySelectorAll('.topic-btn');
  const questionCountSlider = document.getElementById('questionCountSlider');
  const questionCountValue = document.getElementById('questionCountValue');

  loadSettings().then(settings => {
    if (questionCountSlider) {
      questionCountSlider.value = settings.questionCount;
      questionCountValue.textContent = settings.questionCount;
    }
    
    if (topicButtons) {
      topicButtons.forEach(btn => {
        const topic = btn.dataset.topic;
        btn.classList.toggle('active', settings.selectedTopics.includes(topic));
      });
    }
  });

  function showModal(modal) { 
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }
  
  function hideModal(modal) { 
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  if (startTestBtn) {
    startTestBtn.addEventListener('click', () => showModal(modeModal));
  }

  if (normalModeBtn) {
    normalModeBtn.addEventListener('click', () => {
      localStorage.setItem('quizMode', 'normal');
      hideModal(modeModal);
      
      loadSettings().then(async () => {
        const questions = getRandomQuestions(currentSettings.selectedTopics, currentSettings.questionCount);
        
        console.log(`🎲 Сгенерировано ${questions.length} вопросов`);
        
        if (questions.length === 0) {
          alert('❌ Нет вопросов по выбранным темам! Попробуйте выбрать другие темы.');
          return;
        }
        
        if (questions.length < currentSettings.questionCount) {
          console.warn(`⚠️ Внимание: запрошено ${currentSettings.questionCount} вопросов, но доступно только ${questions.length}`);
        }
        
        sessionStorage.setItem('testQuestions', JSON.stringify(questions));
        console.log('✅ Вопросы сохранены в sessionStorage');
        window.location.href = 'quiz.html';
      });
    });
  }

  if (accountModeBtn) {
    accountModeBtn.addEventListener('click', () => {
      hideModal(modeModal);
      showModal(accountModal);
    });
  }

  if (accountSubmitBtn) {
    accountSubmitBtn.addEventListener('click', () => {
      const fio = document.getElementById('fioInput')?.value?.trim() || '';
      const classNum = parseInt(document.getElementById('classNumInput')?.value || '9');
      const classLetter = document.getElementById('classLetterInput')?.value?.trim().toUpperCase() || 'А';
      
      if (fio && classNum >= 8 && classNum <= 11 && classLetter) {
        localStorage.setItem('quizMode', 'account');
        localStorage.setItem('quizAccount', JSON.stringify({ fio, classNum, classLetter }));
        hideModal(accountModal);
        
        loadSettings().then(async () => {
          const questions = getRandomQuestions(currentSettings.selectedTopics, currentSettings.questionCount);
          
          console.log(`🎲 Сгенерировано ${questions.length} вопросов`);
          
          if (questions.length === 0) {
            alert('❌ Нет вопросов по выбранным темам! Попробуйте выбрать другие темы.');
            return;
          }
          
          if (questions.length < currentSettings.questionCount) {
            console.warn(`⚠️ Внимание: запрошено ${currentSettings.questionCount} вопросов, но доступно только ${questions.length}`);
          }
          
          sessionStorage.setItem('testQuestions', JSON.stringify(questions));
          console.log('✅ Вопросы сохранены в sessionStorage');
          window.location.href = 'quiz.html';
        });
      } else {
        alert('❌ Заполните все поля правильно! ФИО, класс (8-11) и буква класса.');
      }
    });
  }

  if (adminButton) {
    adminButton.addEventListener('click', () => {
      console.log('🔧 Админ панель открывается...');
      if (adminPassInput) adminPassInput.value = '';
      if (adminError) adminError.textContent = '';
      if (adminStage1) adminStage1.style.display = 'block';
      if (adminStage2) adminStage2.style.display = 'none';
      showModal(adminModal);
    });
  }

  if (adminPassSubmit) {
    adminPassSubmit.addEventListener('click', async () => {
      const inputPassword = adminPassInput?.value?.trim() || '';
      if (!inputPassword) {
        if (adminError) adminError.textContent = 'Введите пароль';
        return;
      }

      adminError.textContent = '🔄 Проверка...';
      
      const passwordData = await loadFromBin(BIN_PASSWORD_ID);
      
      if (passwordData && inputPassword === passwordData.password) {
        adminError.textContent = '✅ Успешный вход!';
        setTimeout(() => {
          adminStage1.style.display = 'none';
          adminStage2.style.display = 'block';
          localStorage.setItem('adminAuthenticated', 'true');
        }, 500);
      } else {
        adminError.textContent = '❌ Неверный пароль';
      }
    });
  }

  if (adminResultsBtn) {
    adminResultsBtn.addEventListener('click', () => {
      console.log('📊 Кнопка "Результаты" нажата');
      showAdminResultsModal();
      hideModal(adminModal);
    });
  }

  if (topicButtons) {
    topicButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const topic = btn.dataset.topic;
        
        if (topic === 'all') {
          topicButtons.forEach(b => {
            if (b.dataset.topic !== 'all') {
              b.classList.remove('active');
            }
          });
          btn.classList.toggle('active');
        } else {
          document.querySelector('[data-topic="all"]').classList.remove('active');
          btn.classList.toggle('active');
        }
        
        const selectedTopics = [];
        document.querySelectorAll('.topic-btn.active').forEach(activeBtn => {
          selectedTopics.push(activeBtn.dataset.topic);
        });
        
        currentSettings.selectedTopics = selectedTopics;
        console.log(`🎯 Выбраны темы: ${selectedTopics.join(', ')}`);
      });
    });
  }

  if (questionCountSlider && questionCountValue) {
    questionCountSlider.addEventListener('input', () => {
      const value = questionCountSlider.value;
      questionCountValue.textContent = value;
      currentSettings.questionCount = parseInt(value);
    });
  }

  if (adminSaveBtn) {
    adminSaveBtn.addEventListener('click', async () => {
      adminSaveBtn.textContent = '🔄 Сохранение...';
      const saved = await saveSettings();
      
      if (saved) {
        adminSaveBtn.textContent = '✅ Сохранено!';
        setTimeout(() => {
          adminSaveBtn.textContent = 'Сохранить';
          hideModal(adminModal);
        }, 1000);
      } else {
        adminSaveBtn.textContent = '❌ Ошибка';
        setTimeout(() => adminSaveBtn.textContent = 'Сохранить', 2000);
      }
    });
  }

  [modeModal, accountModal, adminModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal(modal);
      });
    }
  });
}

async function initQuiz() {
  const questions = JSON.parse(sessionStorage.getItem('testQuestions') || '[]');
  
  console.log(`📝 Загружено ${questions.length} вопросов из sessionStorage`);
  
  if (questions.length === 0) {
    alert('❌ Вопросы не загружены. Возвращаемся на главную.');
    window.location.href = 'index.html';
    return;
  }

  const totalQuestions = questions.length;
  const els = {
    quizCard: document.getElementById('quizCard'),
    resultCard: document.getElementById('resultCard'),
    questionIndex: document.getElementById('questionIndex'),
    currentQuestion: document.getElementById('currentQuestion'),
    totalQuestionsEl: document.getElementById('totalQuestions'),
    questionText: document.getElementById('questionText'),
    optionsContainer: document.getElementById('optionsContainer'),
    correctCount: document.getElementById('correctCount'),
    wrongCount: document.getElementById('wrongCount'),
    accuracyText: document.getElementById('accuracyText'),
    percentText: document.getElementById('percentText'),
    gradeText: document.getElementById('gradeText'),
    restartBtn: document.getElementById('restartBtn'),
    circleProgress: document.querySelector('.circle-progress'),
    answerIndicator: document.getElementById('answerIndicator'),
    answerIcon: document.getElementById('answerIcon'),
    answerText: document.getElementById('answerText')
  };

  if (els.totalQuestionsEl) els.totalQuestionsEl.textContent = totalQuestions;

  let index = 0;
  let correct = 0;
  let userAnswers = [];

  async function saveResults() {
    const quizMode = localStorage.getItem('quizMode') || 'normal';
    const total = questions.length;
    const accuracy = Math.round((correct / total) * 100);
    const grade = Math.round((correct / total) * 10);
    
    const results = {
      timestamp: new Date().toLocaleString('ru-RU'),
      correct: correct,
      wrong: total - correct,
      total: total,
      accuracy: accuracy,
      grade: grade,
      mode: quizMode,
      account: quizMode === 'account' ? JSON.parse(localStorage.getItem('quizAccount') || 'null') : null,
      questions: userAnswers,
      date: new Date().toISOString()
    };

    const binId = results.mode === 'account' ? BIN_ACCOUNT_RESULTS_ID : BIN_NORMAL_RESULTS_ID;
    let allResults = await loadFromBin(binId) || [];
    if (!Array.isArray(allResults)) allResults = [];
    
    allResults.unshift(results);
    if (allResults.length > 100) allResults = allResults.slice(0, 100);

    const saved = await saveToBin(binId, allResults);
    console.log(`✅ ${results.mode} результаты сохранены в ${binId}:`, results);
    
    // Hide quiz card
    if (els.quizCard) {
      els.quizCard.style.display = 'none';
    }
    
    // Show notification and redirect to main page
    showSavedNotification(quizMode === 'account' ? 'учётный' : 'обычный');
    
    // Redirect to main page after showing notification
    setTimeout(() => {
      window.location.href = 'glav.html';
    }, 2000);
    
    return saved;
  }

  function renderQuestion() {
    const q = questions[index];
    
    if (els.questionIndex) els.questionIndex.textContent = index + 1;
    if (els.currentQuestion) els.currentQuestion.textContent = index + 1;
    
    els.questionText.textContent = q.text || q.question || 'Вопрос';
    els.optionsContainer.innerHTML = '';
    
    if (els.answerIndicator) {
      els.answerIndicator.classList.remove('show', 'correct', 'wrong');
    }
    
    const options = q.options || q.answers || [];
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.type = 'button';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleAnswer(i));
      els.optionsContainer.appendChild(btn);
    });
  }

  function handleAnswer(selectedIndex) {
    const q = questions[index];
    const correctIndex = q.correctIndex || q.correct || 0;
    
    userAnswers.push({
      question: q.text || q.question,
      userAnswer: selectedIndex,
      correctAnswer: correctIndex,
      isCorrect: selectedIndex === correctIndex
    });
    
    if (els.answerIndicator) {
      if (selectedIndex === correctIndex) {
        correct++;
        els.answerIcon.textContent = '✓';
        els.answerText.textContent = 'Верно!';
        els.answerIndicator.className = 'answer-indicator show correct';
      } else {
        els.answerIcon.textContent = '✗';
        els.answerText.textContent = 'Неверно!';
        els.answerIndicator.className = 'answer-indicator show wrong';
      }
    }
    
    const optionButtons = els.optionsContainer.querySelectorAll('.quiz-option');
    optionButtons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === correctIndex) {
        btn.classList.add('correct');
      } else if (i === selectedIndex && i !== correctIndex) {
        btn.classList.add('wrong');
      }
    });
    
    setTimeout(() => {
      index++;
      if (index < totalQuestions) {
        renderQuestion();
      } else {
        saveResults();
      }
    }, 1500);
  }

  if (els.restartBtn) {
    els.restartBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  renderQuestion();
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Приложение запускается...');
  
  const adminCanvas = document.getElementById('adminIcon');
  if (adminCanvas) {
    const ctx = adminCanvas.getContext('2d');
    const cx = adminCanvas.width / 2;
    const cy = adminCanvas.height / 2;
    const r = 26;

    ctx.beginPath(); 
    ctx.arc(cx, cy, r, 0, 2 * Math.PI); 
    ctx.fillStyle = '#ffffff'; 
    ctx.fill();
    
    ctx.lineWidth = 3; 
    ctx.strokeStyle = '#000000'; 
    ctx.stroke();

    ctx.beginPath(); 
    ctx.arc(cx, cy - 8, 8, 0, 2 * Math.PI); 
    ctx.fillStyle = '#000000'; 
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 10); 
    ctx.quadraticCurveTo(cx, cy + 22, cx + 14, cy + 10);
    ctx.lineTo(cx + 14, cy + 4); 
    ctx.quadraticCurveTo(cx, cy + 14, cx - 14, cy + 4);
    ctx.closePath(); 
    ctx.fill();
  }

  (function () {
    const canvas = document.getElementById('bg-network');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let w, h, particles;
    const COUNT = 80; 
    const MAX_DIST = 180;

    function resize() { 
      w = canvas.width = window.innerWidth; 
      h = canvas.height = window.innerHeight; 
    }
    
    window.addEventListener('resize', resize); 
    resize();

    function createParticles() {
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({ 
          x: Math.random() * w, 
          y: Math.random() * h, 
          vx: (Math.random() - 0.5) * 0.6, 
          vy: (Math.random() - 0.5) * 0.6 
        });
      }
    }
    
    createParticles();

    function update() {
      for (let p of particles) {
        p.x += p.vx; 
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(11, 132, 246, 1)';
      
      for (let p of particles) { 
        ctx.beginPath(); 
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); 
        ctx.fill(); 
      }
      
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.strokeStyle = `rgba(11, 132, 246, ${(1 - dist / MAX_DIST) * 0.4})`;
            ctx.lineWidth = 1; 
            ctx.beginPath(); 
            ctx.moveTo(a.x, a.y); 
            ctx.lineTo(b.x, b.y); 
            ctx.stroke();
          }
        }
      }
    }

    function loop() { 
      update(); 
      draw(); 
      requestAnimationFrame(loop); 
    }
    
    loop();
  })();

  console.log('📥 Загружаем все вопросы...');
  await loadAllQuestions();
  
  if (document.getElementById('quizCard')) {
    console.log('🎯 Страница: Тест (quiz.html)');
    initQuiz();
  } else if (document.getElementById('startTestBtn')) {
    console.log('🎯 Страница: Главная (glav.html)');
    initMainPage();
  }
  
  console.log('✅ Приложение готово!');
});
