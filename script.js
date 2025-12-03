/* Robust script.js for SQL eBook playground, drag/drop, exercises and progress.
   Replace your current script.js with this file. It is defensive: checks matches,
   checks DOM nodes exist before using, no unsafe destructuring of match results.
*/

/* ----------------------
   Simple demo datasets
   ---------------------- */
const DATASETS = {
  staff: [
    { StaffID: 101, StaffName: "Aisyah", Department: "IT", Position: "Executive", Salary: 3500, Status: "Active" },
    { StaffID: 102, StaffName: "Farhan", Department: "IT", Position: "Manager", Salary: 5200, Status: "Active" },
    { StaffID: 103, StaffName: "Daniel", Department: "HR", Position: "Assistant", Salary: 2700, Status: "Active" },
    { StaffID: 104, StaffName: "Nurul", Department: "HR", Position: "Executive", Salary: 3300, Status: "Active" },
    { StaffID: 105, StaffName: "Hafiz", Department: "Marketing", Position: "Executive", Salary: 3600, Status: "Active" },
    { StaffID: 106, StaffName: "Sarah", Department: "Marketing", Position: "Manager", Salary: 5400, Status: "Resigned" },
    { StaffID: 107, StaffName: "Adam", Department: "IT", Position: "Assistant", Salary: 2600, Status: "Active" }
  ],
  project: [
    { ProjectID: "P01", ProjectName: "Website", StaffID: 101 },
    { ProjectID: "P02", ProjectName: "Database", StaffID: 102 },
    { ProjectID: "P03", ProjectName: "App", StaffID: 101 },
    { ProjectID: "P04", ProjectName: "Marketing Campaign", StaffID: 105 }
  ]
};

let currentDataset = 'staff';

/* ----------------------
   DOM helpers
   ---------------------- */
function getEl(id) {
  return document.getElementById(id) || null;
}
function setMsg(id, text) {
  const el = getEl(id);
  if (el) el.innerText = text;
}

/* ----------------------
   Simple tolerant SQL parser (classroom demo)
   - Not a full SQL parser, but handles common classroom patterns.
   ---------------------- */
function sanitize(sql) {
  if (!sql || typeof sql !== 'string') return '';
  return sql.replace(/\s+/g, ' ').trim();
}

// very tolerant parse to extract basic clauses
function splitClauses(sql) {
  const s = sanitize(sql);
  // lower for keyword detection but keep original for values
  const lower = s.toLowerCase();

  // find positions
  const pos = {
    select: lower.indexOf('select '),
    from: lower.indexOf(' from '),
    where: lower.indexOf(' where '),
    group: lower.indexOf(' group by '),
    having: lower.indexOf(' having '),
    order: lower.indexOf(' order by ')
  };

  // extract between tokens carefully
  function between(startIdx, endIdx) {
    if (startIdx === -1) return null;
    if (endIdx === -1) return s.substring(startIdx).trim();
    return s.substring(startIdx, endIdx).trim();
  }

  const select = pos.select !== -1 && pos.from !== -1 ? s.substring(pos.select + 6, pos.from).trim() : null;
  const from = pos.from !== -1 ? (() => {
    // from .. (where/group/having/order or end)
    const ends = [pos.where, pos.group, pos.having, pos.order].filter(i => i > pos.from).sort((a,b)=>a-b);
    const end = ends.length ? ends[0] : s.length;
    return s.substring(pos.from + 6, end).trim();
  })() : null;

  const where = pos.where !== -1 ? (() => {
    const start = pos.where + 7;
    const ends = [pos.group, pos.having, pos.order].filter(i => i > pos.where).sort((a,b)=>a-b);
    const end = ends.length ? ends[0] : s.length;
    return s.substring(start, end).trim();
  })() : null;

  const group = pos.group !== -1 ? (() => {
    const start = pos.group + 9;
    const ends = [pos.having, pos.order].filter(i => i > pos.group).sort((a,b)=>a-b);
    const end = ends.length ? ends[0] : s.length;
    return s.substring(start, end).trim();
  })() : null;

  const having = pos.having !== -1 ? (() => {
    const start = pos.having + 7;
    const end = pos.order !== -1 && pos.order > pos.having ? pos.order : s.length;
    return s.substring(start, end).trim();
  })() : null;

  const order = pos.order !== -1 ? s.substring(pos.order + 9).trim() : null;

  return { select, from, where, group, having, order };
}

/* ----------------------
   Very small evaluator
   - Only supports SELECT * or SELECT col1,col2
   - FROM single table (staff/project)
   - WHERE simple equality AND combined with AND/OR (basic)
   - ORDER BY single column ASC/DESC
   - GROUP BY with COUNT/SUM/AVG for demo
   ---------------------- */

function evaluate(sql) {
  try {
    const clauses = splitClauses(sql);
    if (!clauses.from) throw new Error('Missing FROM clause');

    // pick dataset
    const tableName = clauses.from.split(/\s+/)[0].replace(/;$/,'').toLowerCase();
    const rows = (DATASETS[tableName] || []).map(r => ({ ...r })); // clone

    // WHERE: naive evaluation by replacing column names with row values
    let filtered = rows;
    if (clauses.where) {
      const cond = clauses.where;
      filtered = rows.filter(row => {
        try {
          // replace column tokens with quoted values
          let expr = cond;
          Object.keys(row).forEach(col => {
            const re = new RegExp('\\b' + col + '\\b', 'g');
            const v = row[col];
            if (typeof v === 'string') expr = expr.replace(re, '`' + v.replace(/`/g,'\\`') + '`');
            else expr = expr.replace(re, String(v));
          });
          // replace = with == when it's a comparison (avoid changing >= <=)
          expr = expr.replace(/([^><!=])=([^=])/g, '$1==$2');
          // boolean operators
          expr = expr.replace(/\band\b/gi, '&&').replace(/\bor\b/gi, '||');
          // convert backticks to string literals
          expr = expr.replace(/`([^`]+)`/g, function(m,p){return JSON.stringify(p);});
          // eslint-disable-next-line no-new-func
          return Function('"use strict"; return (' + expr + ')')();
        } catch (e) {
          return false;
        }
      });
    }

    // GROUP BY (simple) — only support single column + COUNT/SUM/AVG on Salary for demo
    if (clauses.group) {
      const gcol = clauses.group.split(',')[0].trim();
      const groups = {};
      filtered.forEach(r => {
        const key = (r[gcol] === undefined ? 'NULL' : String(r[gcol]));
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });
      const out = [];
      Object.entries(groups).forEach(([k, arr]) => {
        const obj = {};
        obj[gcol] = k;
        obj.COUNT = arr.length;
        obj.SUM_SALARY = arr.reduce((s, a) => s + (Number(a.Salary) || 0), 0);
        obj.AVG_SALARY = arr.length ? obj.SUM_SALARY / arr.length : 0;
        out.push(obj);
      });
      // HAVING filter - simple form like SUM_SALARY > 8000 or COUNT > 1
      if (clauses.having) {
        const hv = clauses.having.replace(/SUM\(/ig,'SUM_').replace(/AVG\(/ig,'AVG_').replace(/\)/g,'');
        const hvExpr = hv.replace(/=/g,'==').replace(/\band\b/gi,'&&').replace(/\bor\b/gi,'||');
        return out.filter(r => {
          try {
            let expr = hvExpr;
            Object.keys(r).forEach(k => {
              const re = new RegExp('\\b' + k + '\\b','g');
              expr = expr.replace(re, JSON.stringify(r[k]));
            });
            // eslint-disable-next-line no-new-func
            return Function('"use strict"; return (' + expr + ')')();
          } catch(e) { return false; }
        });
      }
      return out;
    }

    // projection SELECT
    let projected = filtered;
    if (clauses.select && clauses.select.trim() !== '*' && clauses.select.trim().length > 0) {
      const items = clauses.select.split(',').map(s => s.trim());
      projected = filtered.map(r => {
        const o = {};
        items.forEach(it => {
          const clean = it.split(/\s+as\s+/i)[0].trim(); // ignore alias for now
          const col = clean.split('.').pop();
          o[col] = (r[col] === undefined ? null : r[col]);
        });
        return o;
      });
    }

    // ORDER BY (single col)
    if (clauses.order) {
      const [c, d] = clauses.order.split(/\s+/).map(s => s.trim());
      const col = c;
      const dir = (d && d.toUpperCase()==='DESC') ? -1 : 1;
      projected.sort((a,b) => {
        const av = a[col], bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return -1 * dir;
        if (bv == null) return 1 * dir;
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
        return 0;
      });
    }

    return projected;

  } catch (err) {
    return { __error: String(err) };
  }
}

/* ----------------------
   Renderer for resultTable and outputMsg
   ---------------------- */
function renderResult(rows) {
  const container = getEl('resultTable');
  const msg = getEl('outputMsg');
  if (!container) return;
  container.innerHTML = '';
  if (!rows) {
    if (msg) msg.innerText = 'No result.';
    return;
  }
  if (rows.__error) {
    if (msg) msg.innerText = 'Error: ' + rows.__error;
    return;
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    if (msg) msg.innerText = 'No rows.';
    return;
  }
  // build table
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  const head = document.createElement('tr');
  Object.keys(rows[0]).forEach(h => {
    const th = document.createElement('th');
    th.innerText = h;
    th.style.border = '1px solid white';
    th.style.padding = '6px';
    head.appendChild(th);
  });
  table.appendChild(head);
  rows.forEach(r => {
    const tr = document.createElement('tr');
    Object.keys(rows[0]).forEach(k => {
      const td = document.createElement('td');
      td.innerText = r[k] == null ? '' : r[k];
      td.style.border = '1px solid white';
      td.style.padding = '4px';
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  container.appendChild(table);
  if (msg) msg.innerText = 'Query executed';
}

/* ----------------------
   Public functions used on pages
   ---------------------- */
function loadSample(name) {
  if (!name) return;
  if (!getEl('editor')) return;
  currentDataset = name;
  if (name.toLowerCase() === 'staff') {
    getEl('editor').value = "SELECT * FROM Staff;";
  } else if (name.toLowerCase() === 'project') {
    getEl('editor').value = "SELECT * FROM Project;";
  } else {
    getEl('editor').value = "SELECT * FROM " + name + ";";
  }
  if (getEl('outputMsg')) getEl('outputMsg').innerText = 'Dataset: ' + name;
  if (getEl('resultTable')) getEl('resultTable').innerHTML = '';
}

function run() {
  const ed = getEl('editor');
  if (!ed) return;
  const sql = ed.value;
  const rows = evaluate(sql);
  renderResult(rows);
}

/* ----------------------
   Drag & drop helpers
   ---------------------- */
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) {
  try {
    const txt = ev.target.getAttribute('data-word') || ev.target.innerText;
    ev.dataTransfer.setData('text/plain', txt);
  } catch(e) {}
}
function drop(ev) {
  ev.preventDefault();
  const data = ev.dataTransfer.getData('text/plain');
  const dz = ev.target;
  if (!dz) return;
  dz.innerText = (dz.innerText ? dz.innerText + ' ' : '') + data;
}
function appendFromDrop(exNum) {
  const dz = getEl('dropZone');
  if (!dz) return;
  const txt = dz.innerText.trim();
  if (!txt) return;
  if (exNum) {
    const ed = getEl('exercise' + exNum + '_editor');
    if (ed) ed.value = (ed.value ? ed.value + ' ' : '') + txt;
  } else {
    const ed = getEl('editor');
    if (ed) ed.value = (ed.value ? ed.value + ' ' : '') + txt;
  }
  dz.innerText = '';
}

/* ----------------------
   Exercises: runExercise + checkExercise (loose matching)
   ---------------------- */
const EXPECT = {
  1: { sql: "SELECT StaffName, Department FROM Staff WHERE Department = 'IT';", points: 10 },
  2: { sql: "SELECT * FROM Project;", points: 8 }
};

function runExercise(num) {
  const ed = getEl('exercise' + num + '_editor');
  if (!ed) {
    setMsg('exerciseResult', 'No exercise editor found.');
    return null;
  }
  try {
    const rows = evaluate(ed.value);
    // render to common resultTable if present, else create small rendering area
    if (getEl('resultTable')) renderResult(rows);
    return rows;
  } catch (e) {
    setMsg('exerciseResult', 'Error: ' + e);
    return null;
  }
}

function looseCompare(aRows, bRows) {
  if (!Array.isArray(aRows) || !Array.isArray(bRows)) return false;
  if (aRows.length !== bRows.length) return false;
  // compare lowercase joined rows ignoring column order by mapping headers
  const aNorm = aRows.map(r => Object.values(r).map(v => String(v).trim().toLowerCase()).join('|')).sort();
  const bNorm = bRows.map(r => Object.values(r).map(v => String(v).trim().toLowerCase()).join('|')).sort();
  for (let i=0; i<aNorm.length; i++) if (aNorm[i] !== bNorm[i]) return false;
  return true;
}

function checkExercise(num) {
  const ed = getEl('exercise' + num + '_editor');
  const resEl = getEl('exerciseResult') || getEl('outputMsg');
  if (!ed || !resEl) return;
  const studentRows = runExercise(num);
  if (!studentRows) { resEl.innerText = 'No result to check.'; return false; }
  const expect = EXPECT[num];
  if (!expect) { resEl.innerText = 'No expectation set for this exercise.'; return false; }
  const expectedRows = evaluate(expect.sql);
  const ok = looseCompare(studentRows, expectedRows);
  if (ok) {
    resEl.innerHTML = "<span style='color:green'>✔ Correct</span>";
    // update progress
    const completed = Number(localStorage.getItem('completed') || 0) + 1;
    const points = Number(localStorage.getItem('points') || 0) + (expect.points || 10);
    localStorage.setItem('completed', completed);
    localStorage.setItem('points', points);
    if (getEl('completed')) getEl('completed').innerText = completed;
    if (getEl('points')) getEl('points').innerText = points;
    return true;
  } else {
    resEl.innerHTML = "<span style='color:red'>✖ Not correct yet</span>";
    return false;
  }
}

/* ----------------------
   Save/Load/Export helpers
   ---------------------- */
function saveProgress() {
  // currently no complex storage; we just inform user
  alert('Progress saved (browser LocalStorage).');
}
function loadProgress() {
  if (getEl('completed')) getEl('completed').innerText = localStorage.getItem('completed') || 0;
  if (getEl('points')) getEl('points').innerText = localStorage.getItem('points') || 0;
  alert('Progress loaded.');
}
function exportCSV() {
  const rows = document.querySelectorAll('#resultTable table tr');
  if (!rows.length) { alert('No result table to export'); return; }
  let csv = '';
  rows.forEach(r => {
    const cols = Array.from(r.children).map(c => '"' + c.innerText.replace(/"/g,'""') + '"');
    csv += cols.join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'result.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ----------------------
   Init bindings on DOMContentLoaded
   ---------------------- */
function initScript() {
  // populate dataset select if present
  const ds = getEl('datasetSelect') || getEl('tableSelect');
  if (ds) {
    ds.innerHTML = '';
    Object.keys(DATASETS).forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.innerText = k;
      ds.appendChild(opt);
    });
    ds.value = currentDataset;
    ds.onchange = () => loadSample(ds.value);
  }
  // set default editor content if empty
  const ed = getEl('editor');
  if (ed && !ed.value.trim()) loadSample(currentDataset);
  // update dashboard numbers
  if (getEl('completed')) getEl('completed').innerText = localStorage.getItem('completed') || 0;
  if (getEl('points')) getEl('points').innerText = localStorage.getItem('points') || 0;
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initScript);
else initScript();
