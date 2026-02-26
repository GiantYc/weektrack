/* ============================================================
   CONSTANTS
   ============================================================ */
var RING_CIRC = 213.63;

var PRESET_ICONS = [
  'fa-book','fa-headphones','fa-person-running','fa-basketball','fa-dumbbell',
  'fa-brain','fa-pen-nib','fa-music','fa-language','fa-utensils',
  'fa-sun','fa-moon','fa-heart-pulse','fa-droplet','fa-leaf',
  'fa-laptop-code','fa-terminal','fa-gamepad','fa-camera','fa-bicycle'
];

var PRESET_COLORS = [
  { name: 'mint',   color: '#34D399', gradFrom: '#86EFAC', gradTo: '#34D399' },
  { name: 'orange', color: '#F97316', gradFrom: '#FED7AA', gradTo: '#FB923C' },
  { name: 'blue',   color: '#60A5FA', gradFrom: '#BAE6FD', gradTo: '#3B82F6' },
  { name: 'purple', color: '#A78BFA', gradFrom: '#DDD6FE', gradTo: '#8B5CF6' },
  { name: 'pink',   color: '#F472B6', gradFrom: '#FBCFE8', gradTo: '#EC4899' },
  { name: 'yellow', color: '#FBBF24', gradFrom: '#FDE68A', gradTo: '#F59E0B' },
  { name: 'red',    color: '#F87171', gradFrom: '#FECACA', gradTo: '#EF4444' },
  { name: 'teal',   color: '#2DD4BF', gradFrom: '#99F6E4', gradTo: '#14B8A6' }
];

var WEEKDAYS = ['日','一','二','三','四','五','六'];

/* ============================================================
   DEFAULT HABITS CONFIG
   ============================================================ */
var DEFAULT_HABITS = [
  {
    id: 'fitness',
    name: '健身',
    icon: 'fa-dumbbell',
    color: '#34D399',
    gradFrom: '#86EFAC',
    gradTo: '#34D399',
    type: 'duration',
    weekGoalMinutes: 300,
    subTypes: [
      { id: 'basketball', name: '篮球', icon: 'fa-basketball' },
      { id: 'gym',        name: '健身房', icon: 'fa-dumbbell' }
    ],
    builtIn: true
  },
  {
    id: 'vibe_coding',
    name: 'Vibe Coding',
    icon: 'fa-terminal',
    color: '#F97316',
    gradFrom: '#FED7AA',
    gradTo: '#FB923C',
    type: 'duration',
    weekGoalMinutes: 600,
    subTypes: [],
    builtIn: true
  }
];

/* ============================================================
   HABITS CONFIG — CRUD
   ============================================================ */
function loadHabits() {
  try {
    var raw = localStorage.getItem('habits_config');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  localStorage.setItem('habits_config', JSON.stringify(DEFAULT_HABITS));
  return JSON.parse(JSON.stringify(DEFAULT_HABITS));
}

function saveHabits(habits) {
  localStorage.setItem('habits_config', JSON.stringify(habits));
}

function getHabitById(id) {
  return loadHabits().find(function(h) { return h.id === id; });
}

/* ============================================================
   WEEK / DATE UTILITIES
   ============================================================ */
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

function getWeekMonday(date) {
  var d = new Date(date || new Date());
  var day = d.getDay();
  var diff = day === 0 ? -6 : 1 - day;
  var monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekRange(date) {
  var monday = getWeekMonday(date);
  var sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  var fmt = function(dt) { return (dt.getMonth() + 1) + '月' + dt.getDate() + '日'; };
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
    '周' + WEEKDAYS[d.getDay()] + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getTodayDateStr() {
  var now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
}

/* ============================================================
   DATA LAYER — ALL RECORDS
   ============================================================ */
function getAllRecordsKeys() {
  var keys = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.indexOf('records_') === 0) keys.push(k);
  }
  return keys;
}

function loadRecords(weekKey) {
  weekKey = weekKey || getWeekKey();
  try { return JSON.parse(localStorage.getItem(weekKey) || '[]'); }
  catch(e) { return []; }
}

function loadAllRecords() {
  var all = [];
  getAllRecordsKeys().forEach(function(k) {
    try {
      var arr = JSON.parse(localStorage.getItem(k) || '[]');
      all = all.concat(arr);
    } catch(e) {}
  });
  all.sort(function(a, b) { return new Date(b.datetime) - new Date(a.datetime); });
  return all;
}

function loadMonthRecords(year, month) {
  var all = loadAllRecords();
  return all.filter(function(r) {
    var d = new Date(r.datetime);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

function saveRecord(record, weekKey) {
  weekKey = weekKey || getWeekKey(new Date(record.datetime));
  var records = loadRecords(weekKey);
  records.push(record);
  localStorage.setItem(weekKey, JSON.stringify(records));
}

function deleteRecord(id) {
  getAllRecordsKeys().forEach(function(k) {
    try {
      var arr = JSON.parse(localStorage.getItem(k) || '[]');
      var filtered = arr.filter(function(r) { return r.id !== id; });
      if (filtered.length !== arr.length) {
        localStorage.setItem(k, JSON.stringify(filtered));
      }
    } catch(e) {}
  });
}

/* ============================================================
   STATS
   ============================================================ */
function getStatsForRecords(records) {
  var stats = {};
  var habits = loadHabits();
  habits.forEach(function(h) {
    stats[h.id] = { total: 0, subTypes: {}, checkinDays: [] };
    if (h.subTypes) {
      h.subTypes.forEach(function(s) { stats[h.id].subTypes[s.id] = 0; });
    }
  });
  records.forEach(function(r) {
    var hid = r.habitId || r.type;
    if (!stats[hid]) stats[hid] = { total: 0, subTypes: {}, checkinDays: [] };
    if (r.type === 'checkin') {
      var day = r.datetime ? r.datetime.slice(0, 10) : '';
      if (day && stats[hid].checkinDays.indexOf(day) === -1) {
        stats[hid].checkinDays.push(day);
      }
    } else {
      stats[hid].total += (r.minutes || 0);
      if (r.subType) {
        stats[hid].subTypes[r.subType] = (stats[hid].subTypes[r.subType] || 0) + (r.minutes || 0);
      }
    }
  });
  return stats;
}

/* ============================================================
   STEPPER STATE (generic)
   ============================================================ */
var stepperValues = {};

function getStepperVal(key) { return stepperValues[key] || 0; }

function setStepperVal(key, val) {
  stepperValues[key] = val;
  var el = document.getElementById('sv-' + key);
  if (el) el.textContent = val;
}

function initStepper(key, val) {
  stepperValues[key] = val || 0;
  var el = document.getElementById('sv-' + key);
  if (el) el.textContent = stepperValues[key];
}

/* ============================================================
   DOM HELPERS
   ============================================================ */
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setRingProgress(el, pct) {
  if (!el) return;
  el.style.strokeDashoffset = RING_CIRC * (1 - pct / 100);
}

/* ============================================================
   RENDER: HOME
   ============================================================ */
function renderHome() {
  var habits = loadHabits();
  var records = loadRecords();
  var stats   = getStatsForRecords(records);
  var now     = new Date();
  var info    = getISOWeekInfo(now);

  setText('week-range', getWeekRange(now));
  setText('week-label', '第 ' + info.week + ' 周');

  var container = document.getElementById('cards-container');
  if (!container) return;

  var html = '';
  habits.forEach(function(h) {
    var st = stats[h.id] || { total: 0, subTypes: {}, checkinDays: [] };
    var colorRgba = hexToRgba(h.color, 0.12);
    var glowRgba  = hexToRgba(h.color, 0.22);
    var glowRgba2 = hexToRgba(h.color, 0.55);

    if (h.type === 'duration') {
      var goal = h.weekGoalMinutes || 300;
      var pct  = Math.min(100, Math.round(st.total / goal * 100));
      var hrs  = toHoursDisplay(st.total);
      var goalH = (goal / 60) % 1 === 0 ? String(goal / 60) : (goal / 60).toFixed(1);
      var gradId = 'grad_' + h.id;

      html += '<div class="goal-card glass-card" id="card-' + h.id + '">' +
        '<div class="card-header">' +
          '<div class="card-header-left">' +
            '<div class="card-icon" style="background:' + colorRgba + ';color:' + h.color + ';border:1px solid ' + hexToRgba(h.color, 0.22) + '">' +
              '<i class="fa-solid ' + h.icon + '"></i>' +
            '</div>' +
            '<span class="card-label">' + h.name.toUpperCase() + '</span>' +
          '</div>' +
          '<button class="btn-add" style="border-color:' + hexToRgba(h.color, 0.30) + '" ' +
            'data-habit-id="' + h.id + '" onclick="openRecordSheet(\'' + h.id + '\')">' +
            '<i class="fa-solid fa-plus"></i><span>记录</span>' +
          '</button>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="ring-wrap">' +
            '<svg class="ring-svg" viewBox="0 0 80 80">' +
              '<defs>' +
                '<linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
                  '<stop offset="0%" stop-color="' + h.gradFrom + '" />' +
                  '<stop offset="100%" stop-color="' + h.gradTo + '" />' +
                '</linearGradient>' +
              '</defs>' +
              '<circle class="ring-track" cx="40" cy="40" r="34" />' +
              '<circle class="ring-fill" id="ring-' + h.id + '" ' +
                'cx="40" cy="40" r="34" stroke="url(#' + gradId + ')" ' +
                'stroke-dasharray="213.63" stroke-dashoffset="213.63" ' +
                'style="filter:drop-shadow(0 0 5px ' + glowRgba2 + ')" />' +
            '</svg>' +
            '<div class="ring-center">' +
              '<span class="ring-val" style="color:' + h.color + '" id="ring-val-' + h.id + '">' + hrs + '</span>' +
              '<span class="ring-unit">h</span>' +
            '</div>' +
          '</div>' +
          '<div class="card-stats">' +
            '<div class="stat-row">' +
              '<span class="stat-label">本周进度</span>' +
              '<span class="stat-val" style="color:' + h.color + '" id="stat-text-' + h.id + '">' + hrs + 'h / ' + goalH + 'h</span>' +
            '</div>' +
            '<div class="progress-wrap">' +
              '<div class="progress-track">' +
                '<div class="progress-fill" id="bar-' + h.id + '" style="width:' + pct + '%;background:linear-gradient(135deg,' + h.gradFrom + ',' + h.gradTo + ');box-shadow:0 0 10px ' + glowRgba + '"></div>' +
              '</div>' +
              '<span class="progress-pct" style="color:' + h.color + '" id="pct-' + h.id + '">' + pct + '%</span>' +
            '</div>' +
            '<div class="stat-row">' +
              '<span class="stat-meta">周目标</span>' +
              '<span class="stat-meta">' + goalH + 'h / 周</span>' +
            '</div>' +
          '</div>' +
        '</div>';

      /* sub items */
      if (h.subTypes && h.subTypes.length > 0) {
        html += '<div class="card-divider"></div><div class="sub-items">';
        h.subTypes.forEach(function(s, idx) {
          if (idx > 0) html += '<div class="sub-sep"></div>';
          html += '<div class="sub-item">' +
            '<i class="fa-solid ' + s.icon + ' sub-icon" style="color:' + h.color + '"></i>' +
            '<span class="sub-label">' + s.name + '</span>' +
            '<span class="sub-time">' + formatMinutes(st.subTypes[s.id] || 0) + '</span>' +
            '</div>';
        });
        html += '</div>';
      }

      html += '</div>';

    } else {
      /* CHECKIN CARD */
      var today = getTodayDateStr();
      var checkedToday = st.checkinDays.indexOf(today) !== -1;
      var streak = calcStreak(st.checkinDays);

      /* build 7-day grid */
      var monday = getWeekMonday(now);
      var dayBoxes = '';
      for (var d = 0; d < 7; d++) {
        var dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + d);
        var ds = dayDate.getFullYear() + '-' +
          String(dayDate.getMonth()+1).padStart(2,'0') + '-' +
          String(dayDate.getDate()).padStart(2,'0');
        var isDone = st.checkinDays.indexOf(ds) !== -1;
        var isToday = ds === today;
        var isFuture = dayDate > new Date();
        dayBoxes += '<div class="day-box' +
          (isDone ? ' done' : '') +
          (isToday ? ' today' : '') +
          (isFuture ? ' future' : '') +
          '" style="' + (isDone ? 'background:linear-gradient(135deg,' + h.gradFrom + ',' + h.gradTo + ');border-color:' + h.color + ';color:#fff' : '') + '">' +
          WEEKDAYS[dayDate.getDay()] +
          '</div>';
      }

      html += '<div class="goal-card glass-card checkin-card" id="card-' + h.id + '">' +
        '<div class="card-header">' +
          '<div class="card-header-left">' +
            '<div class="card-icon" style="background:' + colorRgba + ';color:' + h.color + ';border:1px solid ' + hexToRgba(h.color, 0.22) + '">' +
              '<i class="fa-solid ' + h.icon + '"></i>' +
            '</div>' +
            '<div>' +
              '<span class="card-label">' + h.name.toUpperCase() + '</span>' +
              (h.desc ? '<div class="card-sub-desc">' + h.desc + '</div>' : '') +
            '</div>' +
          '</div>' +
          '<div class="streak-badge" style="background:' + colorRgba + ';color:' + h.color + ';border:1px solid ' + hexToRgba(h.color, 0.22) + '">' +
            '<i class="fa-solid fa-fire-flame-curved"></i>' +
            '<span>' + streak + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="week-grid">' + dayBoxes + '</div>' +
        '<button class="btn-checkin' + (checkedToday ? ' done' : '') + '" ' +
          'style="' + (checkedToday ? 'background:linear-gradient(135deg,' + h.gradFrom + ',' + h.gradTo + ');color:#fff;border-color:' + h.color : 'border-color:' + hexToRgba(h.color, 0.35) + ';color:' + h.color) + '" ' +
          (checkedToday ? 'disabled' : 'onclick="doCheckin(\'' + h.id + '\')"') + '>' +
          (checkedToday ? '<i class="fa-solid fa-check"></i> 今日已打卡' : '<i class="fa-solid fa-plus"></i> 今日打卡') +
        '</button>' +
        '</div>';
    }
  });

  container.innerHTML = html;

  /* set ring progress after DOM update */
  habits.forEach(function(h) {
    if (h.type === 'duration') {
      var st = stats[h.id] || { total: 0 };
      var goal = h.weekGoalMinutes || 300;
      var pct  = Math.min(100, Math.round(st.total / goal * 100));
      var ring = document.getElementById('ring-' + h.id);
      if (ring) ring.style.strokeDashoffset = RING_CIRC * (1 - pct / 100);
    }
  });
}

function calcStreak(days) {
  if (!days || days.length === 0) return 0;
  var sorted = days.slice().sort();
  var today = getTodayDateStr();
  var streak = 0;
  var check = today;
  while (sorted.indexOf(check) !== -1) {
    streak++;
    var d = new Date(check);
    d.setDate(d.getDate() - 1);
    check = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  return streak;
}

function doCheckin(habitId) {
  var record = {
    id:       generateId(),
    habitId:  habitId,
    type:     'checkin',
    minutes:  0,
    datetime: new Date().toISOString(),
    note:     ''
  };
  saveRecord(record);
  renderHome();
  var h = getHabitById(habitId);
  showToast('✓ ' + (h ? h.name : '') + ' 已打卡！');
}

/* ============================================================
   RENDER: RECORDS
   ============================================================ */
var recordsView   = 'week';   /* week | month | all */
var recordsOffset = 0;        /* week/month offset from now */
var recordsFilter = 'all';    /* habitId | 'all' */

function renderRecords() {
  var records = getRecordsForView();
  renderRecordsSummary(records);
  renderFilterBar();
  renderRecordsList(records);
  renderTimeNav();
}

function getRecordsForView() {
  var now = new Date();
  if (recordsView === 'all') {
    return loadAllRecords();
  } else if (recordsView === 'week') {
    var target = new Date(now);
    target.setDate(now.getDate() + recordsOffset * 7);
    return loadRecords(getWeekKey(target));
  } else {
    var y = now.getFullYear();
    var m = now.getMonth() + 1 + recordsOffset;
    while (m > 12) { m -= 12; y++; }
    while (m < 1)  { m += 12; y--; }
    return loadMonthRecords(y, m);
  }
}

function renderTimeNav() {
  var nav = document.getElementById('time-nav');
  if (!nav) return;
  nav.style.display = recordsView === 'all' ? 'none' : 'flex';

  var label = '';
  var now = new Date();
  if (recordsView === 'week') {
    var target = new Date(now);
    target.setDate(now.getDate() + recordsOffset * 7);
    label = getWeekRange(target);
    if (recordsOffset === 0) label = '本周';
    else if (recordsOffset === -1) label = '上周';
  } else {
    var y = now.getFullYear();
    var m = now.getMonth() + 1 + recordsOffset;
    while (m > 12) { m -= 12; y++; }
    while (m < 1)  { m += 12; y--; }
    label = y + '年' + m + '月';
    if (recordsOffset === 0) label = '本月';
  }
  setText('time-nav-label', label);

  var nextBtn = document.getElementById('time-next');
  if (nextBtn) nextBtn.disabled = recordsOffset >= 0;
}

function renderRecordsSummary(records) {
  var el = document.getElementById('records-summary');
  if (!el) return;
  var habits = loadHabits();
  var stats  = getStatsForRecords(records);
  var html   = '';
  habits.forEach(function(h) {
    var st = stats[h.id] || { total: 0, checkinDays: [] };
    if (h.type === 'duration') {
      html += '<div class="summary-item">' +
        '<i class="fa-solid ' + h.icon + '" style="color:' + h.color + '"></i>' +
        '<span class="summary-name">' + h.name + '</span>' +
        '<span class="summary-val" style="color:' + h.color + '">' + formatMinutes(st.total) + '</span>' +
        '</div>';
    } else {
      html += '<div class="summary-item">' +
        '<i class="fa-solid ' + h.icon + '" style="color:' + h.color + '"></i>' +
        '<span class="summary-name">' + h.name + '</span>' +
        '<span class="summary-val" style="color:' + h.color + '">' + st.checkinDays.length + ' 次打卡</span>' +
        '</div>';
    }
  });
  el.innerHTML = html || '<div class="summary-empty">暂无数据</div>';
}

function renderFilterBar() {
  var bar = document.getElementById('filter-bar');
  if (!bar) return;
  var habits = loadHabits();
  var html = '<button class="filter-tab' + (recordsFilter === 'all' ? ' active' : '') +
    '" data-filter="all">全部</button>';
  habits.forEach(function(h) {
    html += '<button class="filter-tab' + (recordsFilter === h.id ? ' active' : '') +
      '" data-filter="' + h.id + '" style="' + (recordsFilter === h.id ? '--ftab-color:' + h.color : '') + '">' +
      h.name + '</button>';
  });
  bar.innerHTML = html;
  bar.querySelectorAll('.filter-tab').forEach(function(btn) {
    btn.addEventListener('click', function() {
      recordsFilter = btn.getAttribute('data-filter');
      renderRecords();
    });
  });
}

function renderRecordsList(records) {
  var container = document.getElementById('records-list');
  if (!container) return;

  var filtered = recordsFilter === 'all' ? records :
    records.filter(function(r) { return (r.habitId || r.type) === recordsFilter; });

  filtered = filtered.slice().sort(function(a, b) {
    return new Date(b.datetime) - new Date(a.datetime);
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">' +
      '<i class="fa-solid fa-inbox"></i>' +
      '<p>暂无记录<br>去首页添加吧</p></div>';
    return;
  }

  var habits = loadHabits();
  var habitMap = {};
  habits.forEach(function(h) { habitMap[h.id] = h; });

  var html = '';
  filtered.forEach(function(r) {
    var hid  = r.habitId || r.type;
    var h    = habitMap[hid] || { name: hid, icon: 'fa-circle', color: '#888', gradFrom: '#ccc', gradTo: '#999' };
    var sub  = '';
    if (r.subType && h.subTypes) {
      var s = h.subTypes.find(function(x) { return x.id === r.subType; });
      if (s) sub = ' · ' + s.name;
    }
    var note = r.note ? ' · ' + r.note : '';
    var colorRgba = hexToRgba(h.color, 0.12);
    var dur  = r.type === 'checkin' ?
      '<span class="checkin-badge" style="background:' + hexToRgba(h.color, 0.12) + ';color:' + h.color + '"><i class="fa-solid fa-check"></i></span>' :
      '<span class="record-duration" style="color:' + h.color + '">' + formatMinutes(r.minutes) + '</span>';

    html += '<div class="record-item" data-id="' + r.id + '">' +
      '<div class="record-left-bar" style="background:linear-gradient(180deg,' + h.gradFrom + ',' + h.gradTo + ')"></div>' +
      '<div class="record-icon" style="background:' + colorRgba + ';color:' + h.color + '">' +
        '<i class="fa-solid ' + h.icon + '"></i>' +
      '</div>' +
      '<div class="record-info">' +
        '<div class="record-title">' + h.name + sub + note + '</div>' +
        '<div class="record-meta">' + formatDateTimeDisplay(r.datetime) + '</div>' +
      '</div>' +
      dur +
      '<button class="record-del" data-id="' + r.id + '" aria-label="删除">' +
        '<i class="fa-solid fa-trash-can"></i>' +
      '</button>' +
    '</div>';
  });

  container.innerHTML = html;
  container.querySelectorAll('.record-del').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      showDeleteDialog(btn.getAttribute('data-id'), 'record');
    });
  });
}

/* ============================================================
   RENDER: SETTINGS
   ============================================================ */
function renderSettings() {
  var habits = loadHabits();
  var list = document.getElementById('habits-list');
  if (!list) return;

  var html = '';
  habits.forEach(function(h) {
    var colorRgba = hexToRgba(h.color, 0.12);
    var goalText = h.type === 'duration' ?
      formatMinutes(h.weekGoalMinutes) + ' / 周' : '每日打卡';
    html += '<div class="habit-row glass-card">' +
      '<div class="habit-row-icon" style="background:' + colorRgba + ';color:' + h.color + ';border:1px solid ' + hexToRgba(h.color, 0.20) + '">' +
        '<i class="fa-solid ' + h.icon + '"></i>' +
      '</div>' +
      '<div class="habit-row-info">' +
        '<div class="habit-row-name">' + h.name + '</div>' +
        '<div class="habit-row-meta">' +
          (h.type === 'duration' ? '<i class="fa-regular fa-clock"></i> 时长型' : '<i class="fa-solid fa-check-circle"></i> 打卡型') +
          ' · ' + goalText +
        '</div>' +
      '</div>' +
      '<button class="habit-edit-btn" data-id="' + h.id + '" aria-label="编辑">' +
        '<i class="fa-solid fa-pen"></i>' +
      '</button>' +
      (!h.builtIn ? '<button class="habit-del-btn" data-id="' + h.id + '" aria-label="删除">' +
        '<i class="fa-solid fa-trash-can"></i>' +
      '</button>' : '') +
    '</div>';
  });

  list.innerHTML = html;

  list.querySelectorAll('.habit-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openHabitSheet(btn.getAttribute('data-id'));
    });
  });

  list.querySelectorAll('.habit-del-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      showDeleteDialog(btn.getAttribute('data-id'), 'habit');
    });
  });
}

/* ============================================================
   RECORD SHEET — dynamic
   ============================================================ */
var currentRecordHabitId = null;

function openRecordSheet(habitId) {
  var h = getHabitById(habitId);
  if (!h) return;
  currentRecordHabitId = habitId;

  var titleEl = document.getElementById('sheet-record-title');
  var iconEl  = document.getElementById('sheet-record-icon');
  var nameEl  = document.getElementById('sheet-record-name');

  if (iconEl) { iconEl.className = 'fa-solid ' + h.icon; iconEl.style.color = h.color; }
  if (nameEl) nameEl.textContent = '记录 ' + h.name;
  if (titleEl) titleEl.style.color = h.color;

  var body = document.getElementById('sheet-record-body');
  if (!body) return;

  var html = '';

  /* sub types */
  if (h.subTypes && h.subTypes.length > 0) {
    html += '<div class="field-group"><label class="field-label">类型</label>' +
      '<div class="type-tabs" id="record-subtypes">';
    h.subTypes.forEach(function(s) {
      html += '<button class="type-tab" data-subtype="' + s.id + '">' +
        '<i class="fa-solid ' + s.icon + '"></i>' + s.name + '</button>';
    });
    html += '</div></div>';
  }

  /* stepper */
  html += '<div class="field-group"><label class="field-label">时长</label>' +
    '<div class="time-stepper">' +
      '<div class="stepper-col">' +
        '<button class="stepper-btn" data-target="rec-hours" data-dir="-1"><i class="fa-solid fa-minus"></i></button>' +
        '<div class="stepper-display"><span class="stepper-num" id="sv-rec-hours">0</span><span class="stepper-unit">小时</span></div>' +
        '<button class="stepper-btn" data-target="rec-hours" data-dir="1"><i class="fa-solid fa-plus"></i></button>' +
      '</div>' +
      '<div class="stepper-sep">:</div>' +
      '<div class="stepper-col">' +
        '<button class="stepper-btn" data-target="rec-minutes" data-dir="-1"><i class="fa-solid fa-minus"></i></button>' +
        '<div class="stepper-display"><span class="stepper-num" id="sv-rec-minutes">0</span><span class="stepper-unit">分钟</span></div>' +
        '<button class="stepper-btn" data-target="rec-minutes" data-dir="1"><i class="fa-solid fa-plus"></i></button>' +
      '</div>' +
    '</div></div>';

  html += '<div class="field-group"><label class="field-label">时间 <span class="field-hint">默认为现在</span></label>' +
    '<input type="datetime-local" id="rec-datetime" class="field-input" /></div>';

  html += '<div class="field-group"><label class="field-label">备注 <span class="field-hint">可选</span></label>' +
    '<input type="text" id="rec-note" class="field-input" placeholder="可选备注..." /></div>';

  var grad = 'linear-gradient(135deg,' + h.gradFrom + ',' + h.gradTo + ')';
  var glow = hexToRgba(h.color, 0.35);
  html += '<button class="btn-save" id="save-record" style="background:' + grad + ';box-shadow:0 4px 16px ' + glow + '">' +
    '<i class="fa-solid fa-check"></i>保存记录</button>';

  body.innerHTML = html;

  /* init stepper */
  initStepper('rec-hours', 0);
  initStepper('rec-minutes', 0);

  /* datetime default */
  var dtEl = document.getElementById('rec-datetime');
  if (dtEl) dtEl.value = getNowLocalString();

  /* stepper listeners */
  body.querySelectorAll('.stepper-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = btn.getAttribute('data-target');
      var dir    = parseInt(btn.getAttribute('data-dir'), 10);
      var isMin  = target === 'rec-minutes';
      var cur    = getStepperVal(target);
      var next   = isMin ? Math.max(0, Math.min(55, cur + dir * 5)) :
                           Math.max(0, Math.min(12, cur + dir));
      setStepperVal(target, next);
    });
  });

  /* sub type listeners */
  body.querySelectorAll('.type-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      body.querySelectorAll('.type-tab').forEach(function(t) { t.classList.remove('selected'); });
      tab.classList.add('selected');
    });
  });

  /* save listener */
  var saveBtn = document.getElementById('save-record');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      var hasSub = h.subTypes && h.subTypes.length > 0;
      var selTab = body.querySelector('.type-tab.selected');
      if (hasSub && !selTab) { showToast('请先选择类型'); return; }
      var totalMin = getStepperVal('rec-hours') * 60 + getStepperVal('rec-minutes');
      if (totalMin <= 0) { showToast('请输入时长'); return; }
      var dtVal = document.getElementById('rec-datetime');
      var record = {
        id:       generateId(),
        habitId:  habitId,
        type:     'duration',
        subType:  selTab ? selTab.getAttribute('data-subtype') : undefined,
        minutes:  totalMin,
        datetime: (dtVal && dtVal.value) ? new Date(dtVal.value).toISOString() : new Date().toISOString(),
        note:     ((document.getElementById('rec-note') || {}).value || '').trim()
      };
      saveRecord(record);
      closeSheet();
      renderHome();
      showToast('已记录 ' + h.name + ' ' + formatMinutes(totalMin));
    });
  }

  openSheet('sheet-record');
}

/* ============================================================
   HABIT SHEET — add / edit
   ============================================================ */
var editingHabitId   = null;
var selectedIcon     = PRESET_ICONS[0];
var selectedColorIdx = 0;
var habitGoalHours   = 3;
var habitType        = 'duration';

function openHabitSheet(habitId) {
  editingHabitId = habitId || null;
  var h = habitId ? getHabitById(habitId) : null;

  var titleSpan = document.querySelector('#sheet-habit-title span');
  if (titleSpan) titleSpan.textContent = h ? '编辑习惯' : '新增习惯';

  /* set defaults */
  habitType      = h ? h.type : 'duration';
  habitGoalHours = h ? Math.round(h.weekGoalMinutes / 60) : 3;
  selectedIcon   = h ? h.icon : PRESET_ICONS[0];
  selectedColorIdx = h ? (PRESET_COLORS.findIndex(function(c) { return c.color === h.color; }) || 0) : 0;
  if (selectedColorIdx < 0) selectedColorIdx = 0;

  /* type toggle */
  document.querySelectorAll('.type-tab[data-htype]').forEach(function(tab) {
    tab.classList.toggle('selected', tab.getAttribute('data-htype') === habitType);
  });
  updateHabitTypeUI();

  /* name */
  var nameEl = document.getElementById('habit-name');
  if (nameEl) nameEl.value = h ? h.name : '';

  /* desc */
  var descEl = document.getElementById('habit-desc');
  if (descEl) descEl.value = h ? (h.desc || '') : '';

  /* goal */
  setText('goal-hours', habitGoalHours);

  /* icon picker */
  renderIconPicker();

  /* color picker */
  renderColorPicker();

  /* hide type toggle for built-in */
  var typeGroup = document.getElementById('habit-type-group');
  if (typeGroup) typeGroup.style.display = (h && h.builtIn) ? 'none' : '';

  openSheet('sheet-habit');
}

function updateHabitTypeUI() {
  var goalGroup = document.getElementById('habit-goal-group');
  var descGroup = document.getElementById('habit-desc-group');
  if (goalGroup) goalGroup.style.display = habitType === 'duration' ? '' : 'none';
  if (descGroup) descGroup.style.display = habitType === 'checkin'  ? '' : 'none';
}

function renderIconPicker() {
  var picker = document.getElementById('icon-picker');
  if (!picker) return;
  var html = '';
  PRESET_ICONS.forEach(function(ico) {
    html += '<button class="icon-opt' + (selectedIcon === ico ? ' selected' : '') + '" data-icon="' + ico + '">' +
      '<i class="fa-solid ' + ico + '"></i></button>';
  });
  picker.innerHTML = html;
  picker.querySelectorAll('.icon-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedIcon = btn.getAttribute('data-icon');
      picker.querySelectorAll('.icon-opt').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    });
  });
}

function renderColorPicker() {
  var picker = document.getElementById('color-picker');
  if (!picker) return;
  var html = '';
  PRESET_COLORS.forEach(function(c, idx) {
    html += '<button class="color-opt' + (selectedColorIdx === idx ? ' selected' : '') + '" data-idx="' + idx + '" ' +
      'style="background:linear-gradient(135deg,' + c.gradFrom + ',' + c.gradTo + ')"></button>';
  });
  picker.innerHTML = html;
  picker.querySelectorAll('.color-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      selectedColorIdx = parseInt(btn.getAttribute('data-idx'), 10);
      picker.querySelectorAll('.color-opt').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
    });
  });
}

function saveHabitFromSheet() {
  var nameEl = document.getElementById('habit-name');
  var name   = (nameEl ? nameEl.value : '').trim();
  if (!name) { showToast('请输入习惯名称'); return; }

  var c    = PRESET_COLORS[selectedColorIdx] || PRESET_COLORS[0];
  var desc = (document.getElementById('habit-desc') || {}).value || '';
  var habits = loadHabits();

  if (editingHabitId) {
    habits = habits.map(function(h) {
      if (h.id !== editingHabitId) return h;
      return Object.assign({}, h, {
        name:            name,
        icon:            selectedIcon,
        color:           c.color,
        gradFrom:        c.gradFrom,
        gradTo:          c.gradTo,
        weekGoalMinutes: habitType === 'duration' ? habitGoalHours * 60 : 0,
        desc:            habitType === 'checkin' ? desc : '',
        type:            h.builtIn ? h.type : habitType
      });
    });
    showToast('习惯已更新');
  } else {
    var newId = 'custom_' + Date.now().toString(36);
    habits.push({
      id:              newId,
      name:            name,
      icon:            selectedIcon,
      color:           c.color,
      gradFrom:        c.gradFrom,
      gradTo:          c.gradTo,
      type:            habitType,
      weekGoalMinutes: habitType === 'duration' ? habitGoalHours * 60 : 0,
      subTypes:        [],
      desc:            habitType === 'checkin' ? desc : '',
      builtIn:         false
    });
    showToast('已新增习惯：' + name);
  }

  saveHabits(habits);
  closeSheet();
  renderHome();
  renderSettings();
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
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2200);
}

/* ============================================================
   DELETE DIALOG
   ============================================================ */
var pendingDeleteId   = null;
var pendingDeleteType = null;

function showDeleteDialog(id, type) {
  pendingDeleteId   = id;
  pendingDeleteType = type;
  var titleEl = document.getElementById('dialog-title');
  var descEl  = document.getElementById('dialog-desc');
  if (type === 'habit') {
    var h = getHabitById(id);
    if (titleEl) titleEl.textContent = '删除习惯「' + (h ? h.name : '') + '」？';
    if (descEl)  descEl.textContent  = '该习惯的所有历史记录将一并清空，不可恢复。';
  } else {
    if (titleEl) titleEl.textContent = '删除这条记录？';
    if (descEl)  descEl.textContent  = '此操作不可撤销，进度将同步更新。';
  }
  var el = document.getElementById('dialog-overlay');
  if (el) el.classList.add('active');
}

function hideDeleteDialog() {
  pendingDeleteId = null;
  pendingDeleteType = null;
  var el = document.getElementById('dialog-overlay');
  if (el) el.classList.remove('active');
}

/* ============================================================
   SHEET CONTROL
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
   PAGE NAVIGATION
   ============================================================ */
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var page    = document.getElementById('page-' + pageId);
  var navItem = document.querySelector('.nav-item[data-page="' + pageId + '"]');
  if (page)    page.classList.add('active');
  if (navItem) navItem.classList.add('active');
  if (pageId === 'records')  { recordsOffset = 0; renderRecords(); }
  if (pageId === 'settings') renderSettings();
}

/* ============================================================
   COLOR UTILS
   ============================================================ */
function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  var r = parseInt(hex.substring(0,2),16);
  var g = parseInt(hex.substring(2,4),16);
  var b = parseInt(hex.substring(4,6),16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  renderHome();

  /* Bottom Nav */
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      switchPage(item.getAttribute('data-page'));
    });
  });

  /* Overlay close */
  document.getElementById('overlay').addEventListener('click', closeSheet);

  /* Close buttons */
  document.getElementById('close-record').addEventListener('click', closeSheet);
  document.getElementById('close-habit').addEventListener('click', closeSheet);

  /* Add habit */
  document.getElementById('btn-add-habit').addEventListener('click', function() {
    openHabitSheet(null);
  });

  /* Save habit */
  document.getElementById('save-habit').addEventListener('click', saveHabitFromSheet);

  /* Habit type tabs */
  document.querySelectorAll('.type-tab[data-htype]').forEach(function(tab) {
    tab.addEventListener('click', function() {
      habitType = tab.getAttribute('data-htype');
      document.querySelectorAll('.type-tab[data-htype]').forEach(function(t) {
        t.classList.remove('selected');
      });
      tab.classList.add('selected');
      updateHabitTypeUI();
    });
  });

  /* Goal stepper */
  document.getElementById('goal-minus').addEventListener('click', function() {
    habitGoalHours = Math.max(1, habitGoalHours - 1);
    setText('goal-hours', habitGoalHours);
  });
  document.getElementById('goal-plus').addEventListener('click', function() {
    habitGoalHours = Math.min(40, habitGoalHours + 1);
    setText('goal-hours', habitGoalHours);
  });

  /* Records: time tabs */
  document.querySelectorAll('.time-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.time-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      recordsView   = tab.getAttribute('data-view');
      recordsOffset = 0;
      renderRecords();
    });
  });

  /* Records: time nav prev/next */
  document.getElementById('time-prev').addEventListener('click', function() {
    recordsOffset--;
    renderRecords();
  });
  document.getElementById('time-next').addEventListener('click', function() {
    if (recordsOffset < 0) { recordsOffset++; renderRecords(); }
  });

  /* Delete dialog */
  document.getElementById('dialog-cancel').addEventListener('click', hideDeleteDialog);
  document.getElementById('dialog-confirm').addEventListener('click', function() {
    if (!pendingDeleteId) return;
    if (pendingDeleteType === 'habit') {
      var habits = loadHabits().filter(function(h) { return h.id !== pendingDeleteId; });
      saveHabits(habits);
      /* delete all records for this habit */
      getAllRecordsKeys().forEach(function(k) {
        try {
          var arr = JSON.parse(localStorage.getItem(k) || '[]');
          var filtered = arr.filter(function(r) { return (r.habitId || r.type) !== pendingDeleteId; });
          localStorage.setItem(k, JSON.stringify(filtered));
        } catch(e) {}
      });
      hideDeleteDialog();
      renderHome();
      renderSettings();
      showToast('习惯已删除');
    } else {
      deleteRecord(pendingDeleteId);
      hideDeleteDialog();
      renderRecords();
      renderHome();
      showToast('记录已删除');
    }
  });

  document.getElementById('dialog-overlay').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) hideDeleteDialog();
  });
});
