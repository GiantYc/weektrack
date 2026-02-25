/* ============================================================
   WEEK UTILITIES
   ============================================================ */

var RING_CIRC = 213.63; // 2 * π * 34

function getISOWeekInfo(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  var day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: week };
}

function getWeekKey(date) {
  date = date || new Date();
  var info = getISOWeekInfo(date);
  return 'records_' + info.year + '_W' + String(info.week).padStart(2, '0');
}

function getWeekRange(date) {
  date = date || new Date();
  var d = new Date(date);
  var day = d.getDay();
  var diff = day === 0 ? -6 : 1 - day;
  var monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  var sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  var fmt = function(dt) {
    return (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
  };
  return fmt(monday) + ' – ' + fmt(sunday);
}

function getNowLocalString() {
  var now = new Date();
  var offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function formatMinutes(min) {
  min = min || 0;
  if (min < 60) return min + ' 分钟';
  var h = Math.floor(min / 60);
  var m = min % 60;
  return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
}

function toHoursDisplay(min) {
  if (!min) return '0';
  var h = min / 60;
  return h % 1 === 0 ? String(h) : h.toFixed(1);
}

function formatDateTimeDisplay(isoString) {
  var d = new Date(isoString);
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ============================================================
   DATA LAYER
   ============================================================ */

function loadRecords(weekKey) {
  weekKey = weekKey || getWeekKey();
  try {
    return JSON.parse(localStorage.getItem(weekKey) || '[]');
  } catch (e) {
    return [];
  }
}

function saveRecord(record, weekKey) {
  weekKey = weekKey || getWeekKey();
  var records = loadRecords(weekKey);
  records.push(record);
  localStorage.setItem(weekKey, JSON.stringify(records));
}

function deleteRecord(id, weekKey) {
  weekKey = weekKey || getWeekKey();
  var records = loadRecords(weekKey).filter(function(r) { return r.id !== id; });
  localStorage.setItem(weekKey, JSON.stringify(records));
}

function getStats(weekKey) {
  var records = loadRecords(weekKey);
  var stats = { fitnessTotal: 0, basketball: 0, gym: 0, vibeTotal: 0 };
  records.forEach(function(r) {
    if (r.type === 'fitness') {
      stats.fitnessTotal += r.minutes;
      if (r.subType === 'basketball') stats.basketball += r.minutes;
      if (r.subType === 'gym')        stats.gym        += r.minutes;
    } else if (r.type === 'vibe_coding') {
      stats.vibeTotal += r.minutes;
    }
  });
  return stats;
}

/* ============================================================
   STEPPER STATE
   ============================================================ */

var stepperState = {
  'fitness-hours':   0,
  'fitness-minutes': 0,
  'vibe-hours':      0,
  'vibe-minutes':    0
};

function updateStepper(id, dir) {
  var isMinutes = id.indexOf('minutes') !== -1;
  if (isMinutes) {
    stepperState[id] = Math.max(0, Math.min(55, stepperState[id] + dir * 5));
  } else {
    stepperState[id] = Math.max(0, Math.min(8, stepperState[id] + dir));
  }
  var el = document.getElementById(id);
  if (el) el.textContent = stepperState[id];
}

function resetStepper(prefix) {
  ['hours', 'minutes'].forEach(function(unit) {
    var key = prefix + '-' + unit;
    stepperState[key] = 0;
    var el = document.getElementById(key);
    if (el) el.textContent = '0';
  });
}

function getTotalMinutes(prefix) {
  return stepperState[prefix + '-hours'] * 60 + stepperState[prefix + '-minutes'];
}

/* ============================================================
   RENDER: HOME
   ============================================================ */

function renderHome() {
  var stats = getStats();
  var now   = new Date();
  var info  = getISOWeekInfo(now);

  /* Header */
  setText('week-range', getWeekRange(now));
  setText('week-label', '第 ' + info.week + ' 周');

  /* ── Fitness ── */
  var fitnessGoal = 300; // 5h in minutes
  var fitnessPct  = Math.min(100, Math.round(stats.fitnessTotal / fitnessGoal * 100));
  var fitnessHrs  = toHoursDisplay(stats.fitnessTotal);

  setText('fitness-done', fitnessHrs);
  setText('fitness-stat-text', fitnessHrs + 'h / 5h');
  setText('fitness-pct', fitnessPct + '%');
  setText('basketball-done', formatMinutes(stats.basketball));
  setText('gym-done', formatMinutes(stats.gym));

  setBarWidth('fitness-bar', fitnessPct);
  setRingProgress('fitness-ring', fitnessPct);

  toggleClass('card-fitness', 'goal-done', stats.fitnessTotal >= fitnessGoal);

  /* ── Vibe Coding ── */
  var vibeGoal = 600; // 10h in minutes
  var vibePct  = Math.min(100, Math.round(stats.vibeTotal / vibeGoal * 100));
  var vibeHrs  = toHoursDisplay(stats.vibeTotal);

  setText('vibe-done', vibeHrs);
  setText('vibe-stat-text', vibeHrs + 'h / 10h');
  setText('vibe-pct', vibePct + '%');

  setBarWidth('vibe-bar', vibePct);
  setRingProgress('vibe-ring', vibePct);

  toggleClass('card-vibe', 'goal-done', stats.vibeTotal >= vibeGoal);
}

/* DOM helpers */
function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setBarWidth(id, pct) {
  var el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}

function setRingProgress(id, pct) {
  var el = document.getElementById(id);
  if (!el) return;
  var offset = RING_CIRC * (1 - pct / 100);
  el.style.strokeDashoffset = offset;
}

function toggleClass(id, cls, force) {
  var el = document.getElementById(id);
  if (!el) return;
  if (force) el.classList.add(cls);
  else       el.classList.remove(cls);
}

/* ============================================================
   RENDER: RECORDS
   ============================================================ */

function renderRecords() {
  var records   = loadRecords().slice().reverse();
  var container = document.getElementById('records-list');
  if (!container) return;

  /* Header */
  var now  = new Date();
  var info = getISOWeekInfo(now);
  setText('records-week-range', getWeekRange(now));
  setText('records-week-label', '第 ' + info.week + ' 周');

  if (records.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
      '<i class="fa-solid fa-inbox"></i>' +
      '<p>本周还没有记录<br>去首页添加吧</p>' +
      '</div>';
    return;
  }

  var html = '';
  records.forEach(function(r) {
    var isVibe  = r.type === 'vibe_coding';
    var isBball = r.subType === 'basketball';
    var cls     = isVibe ? 'vibe' : 'fitness';
    var icon    = isVibe ? 'fa-terminal' : (isBball ? 'fa-basketball' : 'fa-dumbbell');
    var title   = isVibe ? 'Vibe Coding' : (isBball ? '篮球' : '健身房');
    var note    = r.note ? ' · ' + r.note : '';

    html +=
      '<div class="record-item ' + cls + '" data-id="' + r.id + '">' +
        '<div class="record-icon"><i class="fa-solid ' + icon + '"></i></div>' +
        '<div class="record-info">' +
          '<div class="record-title">' + title + note + '</div>' +
          '<div class="record-meta">' + formatDateTimeDisplay(r.datetime) + '</div>' +
        '</div>' +
        '<div class="record-duration">' + formatMinutes(r.minutes) + '</div>' +
        '<button class="record-del" data-id="' + r.id + '" aria-label="删除">' +
          '<i class="fa-solid fa-trash-can"></i>' +
        '</button>' +
      '</div>';
  });

  container.innerHTML = html;

  container.querySelectorAll('.record-del').forEach(function(btn) {
    btn.addEventListener('click', function() {
      showDeleteDialog(btn.getAttribute('data-id'));
    });
  });
}

/* ============================================================
   TOAST
   ============================================================ */

var toastTimer = null;

function showToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove('show');
  }, 2200);
}

/* ============================================================
   DELETE DIALOG
   ============================================================ */

var pendingDeleteId = null;

function showDeleteDialog(id) {
  pendingDeleteId = id;
  var el = document.getElementById('dialog-overlay');
  if (el) el.classList.add('active');
}

function hideDeleteDialog() {
  pendingDeleteId = null;
  var el = document.getElementById('dialog-overlay');
  if (el) el.classList.remove('active');
}

/* ============================================================
   BOTTOM SHEET
   ============================================================ */

var activeSheetId = null;

function openSheet(id) {
  closeSheet();
  var sheet   = document.getElementById(id);
  var overlay = document.getElementById('overlay');
  if (!sheet || !overlay) return;
  sheet.classList.add('open');
  overlay.classList.add('active');
  activeSheetId = id;
  var dtInput = sheet.querySelector('input[type="datetime-local"]');
  if (dtInput) dtInput.value = getNowLocalString();
}

function closeSheet() {
  if (!activeSheetId) return;
  var sheet   = document.getElementById(activeSheetId);
  var overlay = document.getElementById('overlay');
  if (sheet)   sheet.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
  activeSheetId = null;
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(function(n) {
    n.classList.remove('active');
  });
  var page    = document.getElementById('page-' + pageId);
  var navItem = document.querySelector('[data-page="' + pageId + '"]');
  if (page)    page.classList.add('active');
  if (navItem) navItem.classList.add('active');
  if (pageId === 'records') renderRecords();
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
  renderHome();

  /* Navigation */
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      switchPage(item.getAttribute('data-page'));
    });
  });

  /* Open Sheets */
  document.getElementById('btn-add-fitness').addEventListener('click', function() {
    resetStepper('fitness');
    document.querySelectorAll('#fitness-type-tabs .type-tab').forEach(function(t) {
      t.classList.remove('selected');
    });
    var noteEl = document.getElementById('fitness-note');
    if (noteEl) noteEl.value = '';
    openSheet('sheet-fitness');
  });

  document.getElementById('btn-add-vibe').addEventListener('click', function() {
    resetStepper('vibe');
    var noteEl = document.getElementById('vibe-note');
    if (noteEl) noteEl.value = '';
    openSheet('sheet-vibe');
  });

  /* Close Sheets */
  document.getElementById('close-fitness').addEventListener('click', closeSheet);
  document.getElementById('close-vibe').addEventListener('click', closeSheet);
  document.getElementById('overlay').addEventListener('click', closeSheet);

  /* Fitness Type Tabs */
  document.querySelectorAll('#fitness-type-tabs .type-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('#fitness-type-tabs .type-tab').forEach(function(t) {
        t.classList.remove('selected');
      });
      tab.classList.add('selected');
    });
  });

  /* Stepper Buttons */
  document.querySelectorAll('.stepper-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.getAttribute('data-target');
      var dir    = parseInt(btn.getAttribute('data-dir'), 10);
      updateStepper(target, dir);
    });
  });

  /* Save Fitness */
  document.getElementById('save-fitness').addEventListener('click', function() {
    var selectedTab = document.querySelector('#fitness-type-tabs .type-tab.selected');
    if (!selectedTab) { showToast('请先选择运动类型'); return; }
    var totalMin = getTotalMinutes('fitness');
    if (totalMin <= 0) { showToast('请输入时长'); return; }
    var dtVal = document.getElementById('fitness-datetime').value;
    var record = {
      id:       generateId(),
      type:     'fitness',
      subType:  selectedTab.getAttribute('data-type'),
      minutes:  totalMin,
      datetime: dtVal ? new Date(dtVal).toISOString() : new Date().toISOString(),
      note:     (document.getElementById('fitness-note').value || '').trim()
    };
    saveRecord(record);
    closeSheet();
    renderHome();
    showToast('已记录  健身 ' + formatMinutes(totalMin));
  });

  /* Save Vibe Coding */
  document.getElementById('save-vibe').addEventListener('click', function() {
    var totalMin = getTotalMinutes('vibe');
    if (totalMin <= 0) { showToast('请输入时长'); return; }
    var dtVal = document.getElementById('vibe-datetime').value;
    var record = {
      id:       generateId(),
      type:     'vibe_coding',
      minutes:  totalMin,
      datetime: dtVal ? new Date(dtVal).toISOString() : new Date().toISOString(),
      note:     (document.getElementById('vibe-note').value || '').trim()
    };
    saveRecord(record);
    closeSheet();
    renderHome();
    showToast('已记录  Coding ' + formatMinutes(totalMin));
  });

  /* Delete Dialog */
  document.getElementById('dialog-cancel').addEventListener('click', hideDeleteDialog);

  document.getElementById('dialog-confirm').addEventListener('click', function() {
    if (!pendingDeleteId) return;
    deleteRecord(pendingDeleteId);
    hideDeleteDialog();
    renderRecords();
    renderHome();
    showToast('记录已删除');
  });

  document.getElementById('dialog-overlay').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) hideDeleteDialog();
  });
});
