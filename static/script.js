// ============ FARMORA - AI : APP SCRIPT ============

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- NAVIGATION ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');

  function goToPage(pageId) {
    pages.forEach(page => page.classList.toggle('active', page.id === pageId));
    navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
    history.replaceState(null, '', `#${pageId}`);
    if (pageId === 'home') {
      playHomeAnimation();
    } else {
      playPageAnimation(pageId);
    }
  }

  function playHomeAnimation() {
    const grid = document.querySelector('.home-grid');
    if (!grid) return;
    grid.classList.remove('play');
    void grid.offsetWidth; // force reflow so the animation can replay
    grid.classList.add('play');
  }

  /* ---------- GENERIC SLIDE-IN / POP-UP / FADE-IN PAGE ANIMATION ---------- */
  function playPageAnimation(pageId) {
    const page = document.getElementById(pageId);
    if (!page) return;
    const items = page.querySelectorAll('.reveal');
    items.forEach((el, i) => {
      el.classList.remove('reveal-play');
      el.style.animationDelay = (i * 0.07) + 's';
    });
    void page.offsetWidth; // force reflow so the animation can replay
    requestAnimationFrame(() => {
      items.forEach(el => el.classList.add('reveal-play'));
    });
  }

  navLinks.forEach(link => link.addEventListener('click', () => goToPage(link.dataset.page)));

  const initialPage = window.location.hash.replace('#', '');
  if (document.getElementById(initialPage)) {
    goToPage(initialPage);
  } else {
    playHomeAnimation();
  }

  const pageOrder = Array.from(pages).map(p => p.id);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (document.getElementById('modalOverlay').classList.contains('open')) return;
    const current = document.querySelector('.page.active').id;
    let idx = pageOrder.indexOf(current);
    idx = e.key === 'ArrowRight' ? (idx + 1) % pageOrder.length : (idx - 1 + pageOrder.length) % pageOrder.length;
    goToPage(pageOrder[idx]);
  });

  /* ---------- MODAL ---------- */
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.getElementById('modalClose');

  function openModal(html) {
    modalContent.innerHTML = html;
    modalOverlay.classList.add('open');
  }
  function closeModal() {
    modalOverlay.classList.remove('open');
  }
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- TOAST ---------- */
  const toastStack = document.getElementById('toastStack');
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastStack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* ---------- GET STARTED ---------- */
  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) getStartedBtn.addEventListener('click', () => {
    goToPage('sensors');
    showToast('Welcome! Here\u2019s your live field dashboard.');
  });

  /* ---------- WATCH DEMO ---------- */
  const watchDemoBtn = document.getElementById('watchDemoBtn');
  const demoVideoUrl = 'https://youtu.be/w_uo3FyGN3k?si=2C-eQBugHiC2i17i';
  if (watchDemoBtn) watchDemoBtn.addEventListener('click', () => {
    openModal(`
      <h3>\u25B6 Farmora AI \u2014 Demo</h3>
      <p>Scan the QR code with your phone camera to watch the full demo on YouTube.</p>
      <img class="modal-preview-img" style="max-width:220px; margin:0 auto 14px; display:block; background:#fff; padding:12px; border-radius:12px;" src="data:image/png;base64,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" alt="QR code linking to the Farmora AI demo video">
      <p style="text-align:center; margin-bottom:0;">
        <a href="${demoVideoUrl}" target="_blank" rel="noopener" style="color:var(--green); font-weight:600; text-decoration:underline;">If The Code Doesn\'t Work Click here</a>
      </p>
    `);
  });

  /* ---------- LOGIN ---------- */
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnLabel = document.getElementById('loginBtnLabel');
  let loggedIn = false;

  if (loginBtn) loginBtn.addEventListener('click', () => {
    if (loggedIn) {
      loggedIn = false;
      loginBtnLabel.textContent = 'Login';
      showToast('Logged out.');
      return;
    }
    openModal(`
      <h3>Login to Farmora</h3>
      <p>Enter any details to preview the dashboard \u2014 this is a demo login for the hackathon build.</p>
      <div class="modal-field"><label>Email</label><input type="email" id="loginEmail" placeholder="you@farm.com"></div>
      <div class="modal-field"><label>Password</label><input type="password" id="loginPass" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"></div>
      <button class="btn btn-primary" id="loginSubmit" style="width:100%; justify-content:center;">Sign In</button>
    `);
    document.getElementById('loginSubmit').addEventListener('click', () => {
      loggedIn = true;
      loginBtnLabel.textContent = 'Account';
      closeModal();
      showToast('Logged in successfully.');
    });
  });

  /* ---------- VIEW ALL ALERTS ---------- */
  const viewAlertsBtn = document.getElementById('viewAlertsBtn');
  if (viewAlertsBtn) viewAlertsBtn.addEventListener('click', () => {
    openModal(`
      <h3>All Alerts</h3>
      <p>Every alert flagged across your fields in the last 7 days.</p>
      <ul class="modal-list">
        <li><span>\u26A0</span><div><b>Leaf Spot Detected</b><small>Cotton Field \u00B7 Block A \u00B7 2h ago</small></div></li>
        <li><span>\u25B3</span><div><b>High Humidity</b><small>Sugarcane Field \u00B7 Block B \u00B7 5h ago</small></div></li>
        <li><span>\u24D8</span><div><b>Low Soil Moisture</b><small>Paddy Field \u00B7 Block C \u00B7 1d ago</small></div></li>
        <li><span>\u26A0</span><div><b>Pest Activity Rising</b><small>Cotton Field \u00B7 Block A \u00B7 2d ago</small></div></li>
        <li><span>\u2713</span><div><b>Irrigation Completed</b><small>Paddy Field \u00B7 Block C \u00B7 3d ago</small></div></li>
      </ul>
    `);
  });

  /* ---------- WEATHER: CLICKABLE FORECAST DAYS ---------- */
  const forecastStrip = document.getElementById('forecastStrip');
  if (forecastStrip) {
    const wIcon = document.getElementById('wIcon');
    const wTemp = document.getElementById('wTemp');
    const wCondition = document.getElementById('wCondition');
    const wRange = document.getElementById('wRange');

    forecastStrip.querySelectorAll('.fc-day').forEach(day => {
      day.addEventListener('click', () => {
        forecastStrip.querySelectorAll('.fc-day').forEach(d => d.classList.remove('active'));
        day.classList.add('active');
        wIcon.textContent = day.dataset.icon;
        wTemp.textContent = day.dataset.temp;
        wCondition.textContent = day.dataset.condition;
        wRange.textContent = day.dataset.range;
      });
    });
  }

  /* ---------- DISEASE DETECTION: REAL UPLOAD + SIMULATED ANALYSIS ---------- */
  const uploadImageBtn = document.getElementById('uploadImageBtn');
  const fileInput = document.getElementById('fileInput');
  const scanRing = document.getElementById('scanRing');
  const scanRingContent = document.getElementById('scanRingContent');
  const scanStatus = document.getElementById('scanStatus');
  const scanHint = document.getElementById('scanHint');
  const scanThumbs = document.getElementById('scanThumbs');

  const diagnoses = [
    { name: 'Leaf Spot', severity: 'Moderate', area: '23%', confidence: 92, level: 'High', action: 'Remove affected leaves and apply recommended fungicide.' },
    { name: 'Healthy Leaf', severity: 'None', area: '0%', confidence: 97, level: 'High', action: 'No action needed \u2014 keep up current watering schedule.' },
    { name: 'Powdery Mildew', severity: 'Mild', area: '12%', confidence: 85, level: 'Moderate', action: 'Improve airflow and apply sulfur-based spray.' },
    { name: 'Blight', severity: 'Severe', area: '41%', confidence: 89, level: 'High', action: 'Isolate affected plants and apply copper-based fungicide immediately.' }
  ];

  if (uploadImageBtn && fileInput) {
    uploadImageBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        scanRingContent.innerHTML = `<img src="${e.target.result}" alt="Uploaded leaf">`;
        scanRing.classList.add('scanning');
        scanStatus.textContent = 'Analyzing\u2026';
        scanHint.textContent = 'Farmora AI is scanning your image';
        uploadImageBtn.disabled = true;

        setTimeout(() => {
          scanRing.classList.remove('scanning');
          scanStatus.textContent = 'Scan Complete';
          scanHint.textContent = 'Upload another image to scan again';
          uploadImageBtn.disabled = false;

          const result = diagnoses[Math.floor(Math.random() * diagnoses.length)];
          document.getElementById('resultName').textContent = result.name;
          document.getElementById('resultSeverity').textContent = result.severity;
          document.getElementById('resultArea').textContent = result.area;
          document.getElementById('confValue').textContent = result.confidence + '%';
          document.getElementById('confLabel').textContent = result.level;
          document.getElementById('resultAction').textContent = result.action;

          const circumference = 264;
          const offset = circumference - (circumference * result.confidence) / 100;
          document.getElementById('confArc').setAttribute('stroke-dashoffset', offset);

          const thumb = document.createElement('span');
          thumb.className = 'thumb ' + (result.severity === 'None' ? 'healthy' : result.severity === 'Severe' ? 'critical' : 'warn');
          thumb.textContent = result.severity === 'None' ? '\uD83C\uDF43' : '\uD83C\uDF42';
          scanThumbs.prepend(thumb);

          showToast(`Detection complete: ${result.name} (${result.confidence}% confidence)`);
        }, 1800);
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- MARKET: VIEW FULL REPORT ---------- */
  const viewMarketReportBtn = document.getElementById('viewMarketReportBtn');
  if (viewMarketReportBtn) viewMarketReportBtn.addEventListener('click', () => {
    openModal(`
      <h3>Market Report \u2014 Kerala</h3>
      <p>Weekly summary across your tracked crops.</p>
      <ul class="modal-list">
        <li><span>\uD83C\uDF3E</span><div><b>Paddy \u2014 \u20B92,180/qtl</b><small>Up 2.4% \u2014 demand rising ahead of festival season</small></div></li>
        <li><span>\uD83C\uDF45</span><div><b>Tomato \u2014 \u20B91,320/qtl</b><small>Down 1.2% \u2014 oversupply from neighboring districts</small></div></li>
        <li><span>\uD83E\uDD54</span><div><b>Potato \u2014 \u20B91,080/qtl</b><small>Up 3.6% \u2014 strong wholesale demand</small></div></li>
        <li><span>\uD83E\uDDC5</span><div><b>Onion \u2014 \u20B92,450/qtl</b><small>Down 0.8% \u2014 minor price correction</small></div></li>
        <li><span>\uD83C\uDF4C</span><div><b>Banana \u2014 \u20B91,150/qtl</b><small>Up 1.7% \u2014 steady local demand</small></div></li>
      </ul>
    `);
  });

  /* ---------- REPORTS: DOWNLOAD ---------- */
  const reportContent = {
    weekly: {
      filename: 'farmora-weekly-field-summary.txt',
      body: `FARMORA AI \u2014 Weekly Field Summary\n====================================\n\nSoil Moisture: 62% (Optimal)\nTemperature: 26\u00B0C (Normal)\nHumidity: 70% (Normal)\npH Level: 6.4 (Ideal)\n\nAlerts this week:\n- Leaf Spot Detected \u2014 Cotton Field, Block A\n- High Humidity \u2014 Sugarcane Field, Block B\n- Low Soil Moisture \u2014 Paddy Field, Block C\n\nGenerated by Farmora AI.`
    },
    disease: {
      filename: 'farmora-disease-history-report.txt',
      body: `FARMORA AI \u2014 Disease History Report\n=====================================\n\nLatest Detection: Leaf Spot\nConfidence: 92% (High)\nSeverity: Moderate\nAffected Area: 23%\nRecommended Action: Remove affected leaves and apply recommended fungicide.\n\nGenerated by Farmora AI.`
    },
    market: {
      filename: 'farmora-market-price-trends.txt',
      body: `FARMORA AI \u2014 Market Price Trends\n===================================\n\nPaddy: \u20B92,180/qtl (+2.4%)\nTomato: \u20B91,320/qtl (-1.2%)\nPotato: \u20B91,080/qtl (+3.6%)\nOnion: \u20B92,450/qtl (-0.8%)\nBanana: \u20B91,150/qtl (+1.7%)\n\nMarket trend: Bullish this week.\n\nGenerated by Farmora AI.`
    }
  };

  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.report;
      const report = reportContent[key];
      if (!report) return;
      const blob = new Blob([report.body], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${report.filename}`);
    });
  });

  /* ---------- WEATHER: AI FARMING TIPS (REFRESHABLE) ---------- */
  const aiTipText = document.getElementById('aiTipText');
  const refreshTipBtn = document.getElementById('refreshTipBtn');

  const farmingTips = [
    'Light rain expected on Wednesday. Ideal for irrigation planning!',
    'Early morning watering reduces evaporation loss \u2014 aim for before 8 AM.',
    'High humidity today raises fungal risk \u2014 inspect leaves for early leaf spot signs.',
    'Wind speeds are picking up \u2014 hold off on any pesticide spraying until it settles.',
    'UV index is moderate \u2014 a good window for transplanting seedlings this afternoon.',
    'Soil moisture is optimal \u2014 skip today\u2019s irrigation cycle to avoid waterlogging.',
    'Cooler nights this week are ideal for root development \u2014 consider light mulching.'
  ];
  let lastTipIndex = -1;

  function showRandomTip() {
    if (!aiTipText) return;
    let idx;
    do {
      idx = Math.floor(Math.random() * farmingTips.length);
    } while (idx === lastTipIndex && farmingTips.length > 1);
    lastTipIndex = idx;

    aiTipText.classList.add('fading');
    setTimeout(() => {
      aiTipText.textContent = farmingTips[idx];
      aiTipText.classList.remove('fading');
    }, 200);
  }

  if (refreshTipBtn) {
    refreshTipBtn.addEventListener('click', () => {
      refreshTipBtn.classList.add('spinning');
      showRandomTip();
      showToast('Here\u2019s a fresh farming tip.');
      setTimeout(() => refreshTipBtn.classList.remove('spinning'), 400);
    });
  }

  /* ---------- LOCATION SELECTOR: ALL INDIAN STATES & DISTRICTS ---------- */
  const locPills = document.querySelectorAll('.loc-pill');

  function updateLocationPills(district, state) {
    document.querySelectorAll('.loc-pill .loc-text').forEach(el => {
      el.textContent = `${district}, ${state}`;
    });
  }

  function buildDistrictOptions(state, selectedDistrict) {
    const districts = (typeof INDIA_LOCATIONS !== 'undefined' && INDIA_LOCATIONS[state]) ? INDIA_LOCATIONS[state] : [];
    return districts.map(d => `<option value="${d}"${d === selectedDistrict ? ' selected' : ''}>${d}</option>`).join('');
  }

  function openLocationModal() {
    if (typeof INDIA_STATE_LIST === 'undefined') return;

    const currentText = document.querySelector('.loc-pill .loc-text');
    const [currentDistrict, currentState] = currentText
      ? currentText.textContent.split(',').map(s => s.trim())
      : ['Malappuram', 'Kerala'];
    const defaultState = INDIA_LOCATIONS[currentState] ? currentState : 'Kerala';

    const stateOptions = INDIA_STATE_LIST
      .map(s => `<option value="${s}"${s === defaultState ? ' selected' : ''}>${s}</option>`)
      .join('');

    openModal(`
      <h3>\uD83D\uDCCD Change Location</h3>
      <p>Select your state and district for more accurate weather, sensor and market insights.</p>
      <div class="modal-field">
        <label>State</label>
        <select id="stateSelect">${stateOptions}</select>
      </div>
      <div class="modal-field">
        <label>District</label>
        <select id="districtSelect">${buildDistrictOptions(defaultState, currentDistrict)}</select>
        <small class="hint">All states &amp; union territories of India are supported.</small>
      </div>
      <button class="btn btn-primary" id="applyLocationBtn" style="width:100%; justify-content:center;">Apply Location</button>
    `);

    const stateSelect = document.getElementById('stateSelect');
    const districtSelect = document.getElementById('districtSelect');
    const applyLocationBtn = document.getElementById('applyLocationBtn');

    stateSelect.addEventListener('change', () => {
      districtSelect.innerHTML = buildDistrictOptions(stateSelect.value, null);
    });

    applyLocationBtn.addEventListener('click', () => {
      const state = stateSelect.value;
      const district = districtSelect.value;
      updateLocationPills(district, state);
      closeModal();
      showToast(`Location updated to ${district}, ${state}.`);
    });
  }

  locPills.forEach(pill => pill.addEventListener('click', openLocationModal));

  /* ---------- LIVE ESP SENSOR CARDS ---------- */
  const sensorCardsGrid = document.getElementById('sensorCardsGrid');

  function renderSensorMessage(message) {
    if (!sensorCardsGrid) return;
    sensorCardsGrid.innerHTML = `<p class="sensor-empty-msg">${message}</p>`;
  }

  function formatReading(value, unit) {
    return (value === null || value === undefined) ? '—' : `${value}${unit}`;
  }

  function wateringBadge(needsWatering) {
    if (needsWatering === true) return '<span class="tag needs-water">💧 Needs Watering</span>';
    if (needsWatering === false) return '<span class="tag optimal">✅ No Watering Needed</span>';
    return '<span class="tag unknown-water">Awaiting data</span>';
  }

  function buildSensorCard(sensor) {
    const reading = sensor.reading || {};
    return `
      <div class="panel sensor-card reveal">
        <div class="sensor-card-head">
          <h3>${sensor.esp_id}</h3>
          ${wateringBadge(sensor.needs_watering)}
        </div>
        <div class="sensor-readings">
          <div class="sensor-reading-item"><small>Soil Moisture</small><b>${formatReading(reading.soil_moisture, '%')}</b></div>
          <div class="sensor-reading-item"><small>Temperature</small><b>${formatReading(reading.temperature, '\u00B0C')}</b></div>
          <div class="sensor-reading-item"><small>Humidity</small><b>${formatReading(reading.humidity, '%')}</b></div>
        </div>
        <span class="sensor-last-seen">Last update: ${reading.time || sensor.last_seen || 'N/A'}</span>
      </div>
    `;
  }

  async function loadSensorData() {
    if (!sensorCardsGrid) return;
    try {
      const res = await fetch('/api/sensors');
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      const data = await res.json();
      const sensors = data.sensors || [];

      if (sensors.length === 0) {
        renderSensorMessage('No ESP sensors connected yet.');
        return;
      }

      sensorCardsGrid.innerHTML = sensors.map(buildSensorCard).join('');
    } catch (err) {
      console.error('Failed to load sensor data:', err);
      renderSensorMessage('Unable to reach sensor server. Retrying\u2026');
    }
  }

  if (sensorCardsGrid) {
    loadSensorData();
    setInterval(loadSensorData, 10000);
  }

  /* ---------- UPGRADE TO PRO ---------- */
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (upgradeBtn) upgradeBtn.addEventListener('click', () => {
    openModal(`
      <h3>\u2728 Farmora Pro</h3>
      <p>Unlock advanced insights and custom reports for your fields:</p>
      <ul class="modal-list">
        <li><span>\uD83D\uDCCA</span><div><b>Custom Reports</b><small>Build reports tailored to your crops</small></div></li>
        <li><span>\uD83E\uDD16</span><div><b>Advanced AI Models</b><small>Higher-accuracy disease detection</small></div></li>
        <li><span>\uD83D\uDCE1</span><div><b>Unlimited Sensors</b><small>Connect as many field devices as you need</small></div></li>
      </ul>
      <p style="margin-bottom:0;">This is a demo build \u2014 Pro upgrades aren\u2019t processed here.</p>
    `);
  });

});
