/* script.js */

/* Datasets */
let datasets = {
  staff: {
    Staff: [
      {StaffID:101,StaffName:"Aisyah",Department:"IT",Position:"Executive",Salary:3500,Status:"Active"},
      {StaffID:102,StaffName:"Farhan",Department:"IT",Position:"Manager",Salary:5200,Status:"Active"},
      {StaffID:103,StaffName:"Daniel",Department:"HR",Position:"Assistant",Salary:2700,Status:"Active"},
      {StaffID:104,StaffName:"Nurul",Department:"HR",Position:"Executive",Salary:3300,Status:"Active"},
      {StaffID:105,StaffName:"Hafiz",Department:"Marketing",Position:"Executive",Salary:3600,Status:"Active"},
      {StaffID:106,StaffName:"Sarah",Department:"Marketing",Position:"Manager",Salary:5400,Status:"Resigned"},
      {StaffID:107,StaffName:"Adam",Department:"IT",Position:"Assistant",Salary:2600,Status:"Active"}
    ],
    Project: [
      {ProjectID:"P01",ProjectName:"Website Upgrade",StaffID:101},
      {ProjectID:"P02",ProjectName:"Mobile App Design",StaffID:102},
      {ProjectID:"P03",ProjectName:"HR Onboarding Form",StaffID:103},
      {ProjectID:"P04",ProjectName:"Marketing Campaign",StaffID:105},
      {ProjectID:"P05",ProjectName:"Database Security",StaffID:null}
    ]
  },
  student: {
    Student:[
      {StudentID:1,Name:"Ali",Program:"Diploma IT"},
      {StudentID:2,Name:"Siti",Program:"Diploma CS"},
      {StudentID:3,Name:"Lina",Program:"Diploma IT"}
    ],
    Course:[
      {CourseCode:"C01",CourseName:"Database"},
      {CourseCode:"C02",CourseName:"Programming"}
    ],
    Enrollment:[
      {StudentID:1,CourseCode:"C01"},
      {StudentID:1,CourseCode:"C02"},
      {StudentID:2,CourseCode:"C02"},
      {StudentID:3,CourseCode:"C01"}
    ]
  }
};

/* Utilities */
function escapeHtml(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function renderTable(rows){
  if(!rows || rows.length===0) return '<div class="small">No rows</div>';
  let cols = Object.keys(rows[0]);
  let html = '<table class="table-view"><thead><tr>';
  cols.forEach(c=>html+=`<th>${c}</th>`); html+='</tr></thead><tbody>';
  rows.forEach(r=>{
    html+='<tr>';
    cols.forEach(c=>html+=`<td>${escapeHtml(String(r[c]===null? 'NULL': r[c]))}</td>`);
    html+='</tr>';
  });
  html+='</tbody></table>';
  return html;
}

/* Mini SQL engine functions (same as earlier single-file version) */
function parseQuery(q){
  let raw = q.trim().replace(/\s+/g,' ');
  const parts = {};
  const m = raw.match(/^\s*SELECT\s+(.+?)\s+FROM\s+(.+)$/i);
  if(!m) throw "Query must start with SELECT ... FROM ...";
  parts.select = m[1].trim();
  let rest = m[2].trim();
  let order = rest.match(/\sORDER\s+BY\s+(.+)$/i);
  if(order){ parts.order = order[1].trim(); rest = rest.slice(0, order.index).trim(); }
  let having = rest.match(/\sHAVING\s+(.+)$/i);
  if(having){ parts.having = having[1].trim(); rest = rest.slice(0, having.index).trim(); }
  let group = rest.match(/\sGROUP\s+BY\s+(.+)$/i);
  if(group){ parts.group = group[1].trim(); rest = rest.slice(0, group.index).trim(); }
  let where = rest.match(/\sWHERE\s+(.+)$/i);
  if(where){ parts.where = where[1].trim(); rest = rest.slice(0, where.index).trim(); }
  parts.from = rest;
  return parts;
}
function evaluateQuery(query, ds){
  try{
    const p = parseQuery(query);
    const selectFields = p.select.split(',').map(s=>s.trim());
    let fromPart = p.from;
    let baseMatch = fromPart.match(/^([^\s]+)(\s+[^\s]+)?/);
    if(!baseMatch) throw "Cannot parse FROM base table";
    const base = baseMatch[0].trim();
    const baseTokens = base.split(/\s+/);
    const baseName = baseTokens[0], baseAlias = baseTokens[1] || baseName;
    let rows = (ds[baseName] || ds[baseAlias]);
    if(!rows) throw `Table ${baseName} not found in dataset`;
    rows = rows.map(r => ({...r}));
    // handle joins
    const joinRegex = /\s+(LEFT\s+JOIN|JOIN)\s+/ig;
    let joinParts = [];
    let rest = fromPart.slice(baseMatch[0].length).trim();
    while(rest.length>0){
      const jm = rest.match(/^(LEFT\s+JOIN|JOIN)\s+([^\s]+)(?:\s+([^\s]+))?\s+ON\s+/i);
      if(!jm) break;
      const jt = jm[2].trim(); const jtAlias = jm[3]?jm[3].trim():jt;
      const after = rest.slice(jm[0].length);
      const next = after.search(/\s+(LEFT\s+JOIN|JOIN)\s+/i);
      let onText;
      if(next>=0){ onText = after.slice(0,next).trim(); rest = after.slice(next).trim(); }
      else { onText = after.trim(); rest = ''; }
      if(onText.toUpperCase().startsWith('ON ')) onText = onText.slice(3);
      joinParts.push({type:jm[1].toUpperCase(), table:jt, alias:jtAlias, on:onText});
    }
    // perform joins sequentially
    for(let j of joinParts){
      const joinTable = ds[j.table];
      if(!joinTable) throw `Table ${j.table} not found for JOIN`;
      const newRows = [];
      const onMatch = j.on.match(/([A-Za-z0-9_\.]+)\s*=\s*([A-Za-z0-9_\.]+)/);
      if(!onMatch) throw "ON clause must be equality like A.col = B.col";
      const left = onMatch[1].trim();
      const right = onMatch[2].trim();
      const leftField = left.split('.').pop();
      const rightField = right.split('.').pop();
      for(let r of rows){
        let matched=false;
        for(let jt of joinTable){
          if((r[leftField]===jt[rightField]) || (r[leftField]==String(jt[rightField]))){
            const merged = {...r};
            for(let k in jt) merged[k]=jt[k];
            newRows.push(merged);
            matched=true;
          }
        }
        if(!matched && j.type.includes('LEFT')){
          const merged = {...r};
          for(let k in joinTable[0]) merged[k]=null;
          newRows.push(merged);
        }
      }
      rows = newRows;
    }
    // WHERE
    if(p.where){ rows = rows.filter(r=>evalWhere(p.where,r)); }
    // GROUP BY
    if(p.group){
      const groupCols = p.group.split(',').map(s=>s.trim());
      const grouped = {};
      for(let row of rows){
        const key = groupCols.map(c=>resolveSimpleField(row,c)).join('||');
        if(!grouped[key]) grouped[key]={rows:[]};
        grouped[key].rows.push(row);
      }
      const aggRows = [];
      for(let key in grouped){
        const grp = grouped[key];
        const out = {};
        groupCols.forEach(c=> out[c]= resolveSimpleField(grp.rows[0],c) );
        selectFields.forEach(field=>{
            const f = field.toUpperCase();
            if(f.includes('COUNT(')){
                const col = field.match(/COUNT\s*\(\s*([^\)]+)\s*\)/i)[1].trim();
                out[field]= col==='*'? grp.rows.length : grp.rows.filter(r=>resolveSimpleField(r,col)!=null).length;
            } else if(f.includes('SUM(')){
                const col = field.match(/SUM\s*\(\s*([^\)]+)\s*\)/i)[1].trim();
                out[field] = grp.rows.reduce((s,rr)=>s + (Number(resolveSimpleField(rr,col))||0),0);
            } else if(f.includes('AVG(')){
                const col = field.match(/AVG\s*\(\s*([^\)]+)\s*\)/i)[1].trim();
                const vals = grp.rows.map(rr=>Number(resolveSimpleField(rr,col))||0);
                out[field] = vals.length? (vals.reduce((a,b)=>a+b,0)/vals.length):0;
            } else {
                out[field]= resolveSimpleField(grp.rows[0],field);
            }
        });
        aggRows.push(out);
      }
      rows = aggRows;
      if(p.having) rows = rows.filter(r=>evalHaving(p.having,r));
    } else {
      rows = rows.map(r=>{
        const obj={};
        for(let field of selectFields){
          const upf = field.toUpperCase();
          if(upf==='*'){ for(let k in r) obj[k]=r[k]; }
          else if(upf.includes('COUNT(') || upf.includes('SUM(') || upf.includes('AVG(')){
            if(upf.includes('COUNT(')){ obj[field]= (r[field.split('(')[1].split(')')[0]]?1:0); }
            else if(upf.includes('SUM(')){ obj[field]= Number(r[field.split('(')[1].split(')')[0]]||0); }
            else if(upf.includes('AVG(')){ obj[field]= Number(r[field.split('(')[1].split(')')[0]]||0); }
          } else {
            const aliasMatch = field.match(/(.+)\s+AS\s+(.+)/i);
            let alias = field;
            let orig = field;
            if(aliasMatch){ orig = aliasMatch[1].trim(); alias = aliasMatch[2].trim(); }
            obj[alias]= resolveSimpleField(r, orig);
          }
        }
        return obj;
      });
    }
    // ORDER BY
    if(p.order){
      const ob = p.order.split(',').map(s=>s.trim());
      rows.sort((a,b)=>{
        for(let o of ob){
          const parts = o.split(/\s+/);
          const col = parts[0]; const dir = (parts[1]||'ASC').toUpperCase();
          const av = resolveSimpleField(a,col), bv = resolveSimpleField(b,col);
          if(av==bv) continue;
          if(typeof av==='number' && typeof bv==='number') return dir==='ASC'? av-bv : bv-av;
          return dir==='ASC'? (''+av).localeCompare(''+bv) : (''+bv).localeCompare(''+av);
        }
        return 0;
      });
    }
    return rows;
  }catch(e){ return {error:String(e)}; }
}
function resolveSimpleField(row, field){
  let f = field.trim(); f = f.replace(/^["'`]+|["'`]+$/g,'');
  if(f.includes('.')){ const p=f.split('.'); const key=p[p.length-1]; return row[key]; }
  return row[field]!==undefined? row[field] : row[field];
}
function evalWhere(expr, row){
  let safe = expr; safe = safe.replace(/<>/g,'!=');
  const tokens = safe.split(/(\s+|\b)/).filter(x=>x!=='');
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i];
    if(/^[A-Za-z_][A-Za-z0-9_\.]*$/.test(t)){
      const up = t.toUpperCase();
      if(['AND','OR','NOT','NULL','LIKE'].includes(up)) continue;
      const simple = t.split('.').pop();
      if(row.hasOwnProperty(simple)){
        let v = row[simple];
        tokens[i] = typeof v === 'string' ? '`' + v.replace(/`/g,'\`') + '`' : String(v);
      }
    }
  }
  let rebuilt = tokens.join('');
  rebuilt = rebuilt.replace(/\s+AND\s+/ig,' && ').replace(/\s+OR\s+/ig,' || ').replace(/=/g,'==').replace(/<>/g,'!=');
  rebuilt = rebuilt.replace(/'([^']*)'/g, function(m,p){ return '`'+p.replace(/`/g,'\`')+'`'; });
  try{
    const jsExpr = rebuilt.replace(/`([^`]*)`/g, function(m,p){ return JSON.stringify(p); });
    return Function('"use strict";return ('+jsExpr+');')();
  }catch(err){ throw "Error evaluating WHERE: "+err; }
}
function evalHaving(expr, row){ return evalWhere(expr, row); }
function loadSample(which){
  const sel = document.getElementById('tableSelect');
  sel.innerHTML = '';
  const ds = datasets[which];
  for(let t in ds){ const opt = document.createElement('option'); opt.value=t; opt.textContent=t; sel.appendChild(opt); }
  if(which==='staff'){
    document.getElementById('editor').value = 'SELECT StaffName, Department, Salary FROM Staff WHERE Salary > 3000 ORDER BY Salary DESC;';
  } else {
    document.getElementById('editor').value = 'SELECT Student.Name, Course.CourseName FROM Enrollment JOIN Student ON Enrollment.StudentID = Student.StudentID JOIN Course ON Enrollment.CourseCode = Course.CourseCode;';
  }
}
function run(){ const dsKey = document.getElementById('datasetSelect').value; const ds = datasets[dsKey]; const q = document.getElementById('editor').value; const out = evaluateQuery(q, ds); if(out && out.error){ document.getElementById('resultTable').innerHTML = '<div style="color:#a00">Error: '+escapeHtml(out.error)+'</div>'; return; } if(Array.isArray(out)){ document.getElementById('resultTable').innerHTML = renderTable(out); window._lastResult = out; } else { document.getElementById('resultTable').innerHTML = '<div>'+escapeHtml(JSON.stringify(out))+'</div>'; } }
function clearOutput(){ document.getElementById('resultTable').innerHTML=''; window._lastResult=null; }
function appendFromDrop(){ const text = document.getElementById('dropZone').innerText.trim(); if(!text) return alert('Drop some keywords first'); document.getElementById('editor').value += (document.getElementById('editor').value.trim() ? '\n' : '') + text; }
document.querySelectorAll('.keyword').forEach(k=>{ k.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', k.textContent)); });
const dz = document.getElementById('dropZone'); dz.addEventListener('dragover', e => e.preventDefault()); dz.addEventListener('drop', e => { e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); dz.innerText = (dz.innerText.trim() ? dz.innerText + ' ' : '') + t; });
loadSample('staff');
function loadExample(n){ if(n===1){ document.getElementById('editor').value = "SELECT StaffName, Department FROM Staff WHERE Department = 'IT';"; } else if(n===2){ document.getElementById('editor').value = "SELECT Staff.StaffName, COUNT(Project.ProjectID) AS TotalProject FROM Staff LEFT JOIN Project ON Staff.StaffID = Project.StaffID GROUP BY Staff.StaffName;"; } else if(n===3){ document.getElementById('editor').value = "SELECT ProjectName FROM Project LEFT JOIN Staff ON Staff.StaffID = Project.StaffID WHERE Staff.StaffID IS NULL;"; } else if(n===4){ document.getElementById('editor').value = "SELECT Department, SUM(Salary) AS TotalSalary FROM Staff GROUP BY Department HAVING SUM(Salary) > 8000;"; } }
function checkExercise(){ const q = document.getElementById('editor').value.toUpperCase(); const ex = document.getElementById('exerciseResult'); ex.style.display='block'; if(q.includes('WHERE') && q.includes('DEPARTMENT')) ex.innerHTML = '✔ Looks like SELECT ... WHERE for department — try Run to verify results.'; else if(q.includes('GROUP BY') && q.includes('COUNT')) ex.innerHTML = '✔ GROUP BY and COUNT detected — run to check results.'; else if(q.includes('LEFT JOIN') && q.includes('IS NULL')) ex.innerHTML = '✔ LEFT JOIN ... IS NULL looks correct for projects without staff.'; else if(q.includes('HAVING') && q.includes('SUM')) ex.innerHTML = '✔ HAVING + SUM detected — run to verify.'; else ex.innerHTML = '❌ Query does not match expected pattern; check exercise instructions.'; }
function saveProgress(){ const payload = { editor: document.getElementById('editor').value, dropZone: document.getElementById('dropZone').innerText, dataset: document.getElementById('datasetSelect').value }; localStorage.setItem('mnemo_progress', JSON.stringify(payload)); alert('Progress saved locally.'); }
function loadProgress(){ const s = localStorage.getItem('mnemo_progress'); if(!s) return alert('No saved progress.'); const p = JSON.parse(s); document.getElementById('editor').value = p.editor; document.getElementById('dropZone').innerText = p.dropZone; document.getElementById('datasetSelect').value = p.dataset; loadSample(p.dataset); alert('Progress loaded.'); }
function exportCSV(){ const rows = window._lastResult; if(!rows || !rows.length) return alert('Run a query that returns rows first.'); const cols = Object.keys(rows[0]); const csv = [cols.join(',')].concat(rows.map(r=>cols.map(c=>`"${String(r[c]===null?'NULL':r[c]).replace(/"/g,'""')}"`).join(','))).join('\n'); const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'mnemo_result.csv'; document.body.appendChild(a); a.click(); a.remove(); }