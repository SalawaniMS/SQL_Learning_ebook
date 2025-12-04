// ===== Mini SQL Playground =====
var datasets = {
    staff: [
        {StaffID:101, StaffName:'Aisyah', Department:'IT', Position:'Executive', Salary:3500, Status:'Active'},
        {StaffID:102, StaffName:'Farhan', Department:'IT', Position:'Manager', Salary:5200, Status:'Active'},
        {StaffID:103, StaffName:'Daniel', Department:'HR', Position:'Assistant', Salary:2700, Status:'Active'},
        {StaffID:104, StaffName:'Nurul', Department:'HR', Position:'Executive', Salary:3300, Status:'Active'},
        {StaffID:105, StaffName:'Hafiz', Department:'Marketing', Position:'Executive', Salary:3600, Status:'Active'},
        {StaffID:106, StaffName:'Sarah', Department:'Marketing', Position:'Manager', Salary:5400, Status:'Resigned'},
        {StaffID:107, StaffName:'Adam', Department:'IT', Position:'Assistant', Salary:2600, Status:'Active'}
    ],
    project: [
        {ProjectID:'P01', ProjectName:'Website', StaffID:101},
        {ProjectID:'P02', ProjectName:'Database', StaffID:102},
        {ProjectID:'P03', ProjectName:'App', StaffID:101},
        {ProjectID:'P04', ProjectName:'Marketing Campaign', StaffID:105}
    ]
};

var currentDataset = 'staff';

function loadSample(name){
    currentDataset = name;
    document.getElementById('editor').value = '-- Write your query here';
    clearOutput();
}

// ===== Mini SQL Playground Run Function =====
function run() {
    var sql = document.getElementById('editor').value.toLowerCase();
    var resultTable = document.getElementById('resultTable');
    resultTable.innerHTML = ''; // clear previous output

    var data = datasets[currentDataset];
    if(!data || data.length===0){
        resultTable.innerHTML = '<div class="small">No data available for this dataset.</div>';
        return;
    }

    var rows = [];
    var filteredData = data;

    // Handle WHERE simple equality
    if(sql.indexOf('where') !== -1){
        var whereMatch = sql.match(/where\s+(\w+)\s*=\s*['"]?([\w\s]+)['"]?/);
        if(whereMatch){
            var col = whereMatch[1];
            var val = whereMatch[2].toLowerCase();
            filteredData = [];
            for(var i=0;i<data.length;i++){
                if(String(data[i][col]).toLowerCase() === val){
                    filteredData.push(data[i]);
                }
            }
        }
    }

    // Determine columns to display
    var cols = [];
    if(sql.indexOf('*') !== -1){
        cols = Object.keys(data[0]);
    } else {
        var selectMatch = sql.match(/select (.+) from/);
        if(selectMatch){
            cols = selectMatch[1].split(',').map(function(c){ return c.trim(); });
        } else {
            resultTable.innerHTML = '<div class="small">Invalid query format.</div>';
            return;
        }
    }

    // Push header
    rows.push(cols);
    // Push data
    for(var j=0;j<filteredData.length;j++){
        var rowData = [];
        for(var k=0;k<cols.length;k++){
            rowData.push(filteredData[j][cols[k]] !== undefined ? filteredData[j][cols[k]] : '');
        }
        rows.push(rowData);
    }

    // Generate HTML table
    var table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    for(var m=0; m<rows.length; m++){
        var tr = document.createElement('tr');
        for(var n=0; n<rows[m].length; n++){
            var td = document.createElement(m===0 ? 'th':'td');
            td.innerText = rows[m][n];
            td.style.border = '1px solid white';
            td.style.padding = '3px 6px';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    resultTable.appendChild(table);
}

// Clear playground output
function clearAll() {
  // Clear editor
  document.getElementById("editor").value = "";

  // Clear output area
  document.getElementById("resultTable").innerHTML = "";
  document.getElementById("outputMsg").innerText = "Result will appear below";

  // Clear drop zone (optional)
  document.getElementById("dropZone").innerText = "Drop keywords here...";
}

// ===== Drag & Drop Builder =====
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.dataset.word); }
function drop(ev) {
  ev.preventDefault();
  var word = ev.dataTransfer.getData("text");
  document.getElementById('dropZone').innerText += word+' ';
}
function appendFromDrop(){
    var dropZone = document.getElementById('dropZone');
    var editor = document.getElementById('editor');
    
    // Ambil hanya teks keywords, buang teks placeholder
    var keywords = dropZone.innerText.replace('Drop keywords here...', '').trim();
    if(keywords){
        editor.value += ' ' + keywords;
    }

    // Clear drop zone
    dropZone.innerText = '';
}

// ===== Auto-check Exercises =====
// ===== Load Example Queries =====
function loadExample(n){
    var editor = document.getElementById('editor');
    if(n===1){
        editor.value = "SELECT StaffName, Department, Salary FROM Staff WHERE Department='IT';";
    } else if(n===2){
        // Count projects per staff
        editor.value = "SELECT StaffName, COUNT(*) as ProjectCount FROM Staff JOIN Project ON Staff.StaffID = Project.StaffID GROUP BY StaffName;";
    } else if(n===3){
    editor.value = "SELECT StaffName, Salary FROM Staff WHERE Salary > 5000;";
} else if(n===4){
        // Departments with total salary > 8000
        editor.value = "SELECT Department, SUM(Salary) as TotalSalary FROM Staff GROUP BY Department HAVING SUM(Salary) > 8000;";
    }
    clearOutput();
}

// ===== Auto-check Exercises =====
function checkExercise(n){
    var editor = document.getElementById('editor');
    var val = editor.value.toLowerCase().trim();
    var resultDiv = document.getElementById('exerciseResult');
    var ok = false;

    if(n===1 && val.indexOf("where department = 'it'") !== -1){
        ok = true;
    }
    if(n===2 && val.indexOf('count')!==-1 && val.indexOf('project')!==-1){
        ok = true;
    }
    if(n===3 && val.indexOf('salary')!==-1 && val.indexOf('> 5000')!==-1){
    ok = true;
}
    if(n===4 && val.indexOf('having')!==-1 && val.indexOf('salary')!==-1){
        ok = true;
    }

    if(ok){
        resultDiv.style.display = 'block';
        resultDiv.innerText = 'Correct!';
        resultDiv.style.color = 'green';
        var completed = Number(localStorage.getItem('completed')||0)+1;
        var points = Number(localStorage.getItem('points')||0)+10;
        localStorage.setItem('completed', completed);
        localStorage.setItem('points', points);
    } else {
        resultDiv.style.display = 'block';
        resultDiv.innerText = 'Try again!';
        resultDiv.style.color = 'red';
    }

    if(document.getElementById('completed')) 
        document.getElementById('completed').innerText = localStorage.getItem('completed')||0;
    if(document.getElementById('points'))
        document.getElementById('points').innerText = localStorage.getItem('points')||0;
}

// ===== Save / Load / Export Progress =====
function saveProgress(){
    localStorage.setItem('completed', localStorage.getItem('completed')||0);
    localStorage.setItem('points', localStorage.getItem('points')||0);
    alert('Progress saved!');
}

function loadProgress(){
    alert('Progress loaded! Completed: '+(localStorage.getItem('completed')||0)+', Points: '+(localStorage.getItem('points')||0));
}

function exportCSV(){
    var completed = localStorage.getItem('completed')||0;
    var points = localStorage.getItem('points')||0;
    var csvContent = "data:text/csv;charset=utf-8,Completed,Points\n"+completed+","+points;
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "progress.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

