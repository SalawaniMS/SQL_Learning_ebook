/// ===== Exercises.js =====

// Container di mana soalan akan dipaparkan
var containerEx1 = document.getElementById('ex1Container');
var containerEx2 = document.getElementById('ex2Container');

// ===== EX1: MCQ 10 Soalan =====
var ex1Questions = [
  {q:"1. Which SQL command retrieves data?", options:{A:"SELECT", B:"INSERT", C:"UPDATE", D:"DELETE"}, answer:"A"},
  {q:"2. Which clause filters rows?", options:{A:"ORDER BY", B:"WHERE", C:"GROUP BY", D:"HAVING"}, answer:"B"},
  {q:"3. To sort records ascending, we use?", options:{A:"ORDER BY ASC", B:"ORDER BY DESC", C:"SORT BY ASC", D:"SORT BY DESC"}, answer:"A"},
  {q:"4. COUNT(*) returns?", options:{A:"Sum", B:"Average", C:"Number of rows", D:"Maximum value"}, answer:"C"},
  {q:"5. Which SQL command adds a row?", options:{A:"INSERT", B:"UPDATE", C:"SELECT", D:"DELETE"}, answer:"A"},
  {q:"6. HAVING clause is used with?", options:{A:"WHERE", B:"GROUP BY", C:"ORDER BY", D:"JOIN"}, answer:"B"},
  {q:"7. JOIN combines data from?", options:{A:"One table", B:"Multiple tables", C:"Views only", D:"Indexes"}, answer:"B"},
  {q:"8. UPDATE command is used to?", options:{A:"Remove rows", B:"Modify data", C:"Select rows", D:"Create table"}, answer:"B"},
  {q:"9. DELETE removes rows from?", options:{A:"Table", B:"View", C:"Index", D:"Column"}, answer:"A"},
  {q:"10. PRIMARY KEY ensures?", options:{A:"Unique rows", B:"NULL values", C:"Duplicate keys", D:"Sorting"}, answer:"A"}
];

// Paparkan soalan Ex1
function loadEx1(){
  containerEx1.innerHTML = '';
  ex1Questions.forEach(function(item,i){
    var qHTML = '<div class="question">' +
                  '<p>'+item.q+'</p>' +
                  '<label><input type="radio" name="q'+i+'" value="A"> A. '+item.options.A+'</label><br>' +
                  '<label><input type="radio" name="q'+i+'" value="B"> B. '+item.options.B+'</label><br>' +
                  '<label><input type="radio" name="q'+i+'" value="C"> C. '+item.options.C+'</label><br>' +
                  '<label><input type="radio" name="q'+i+'" value="D"> D. '+item.options.D+'</label>' +
                '</div>';
    containerEx1.innerHTML += qHTML;
  });

  containerEx1.innerHTML += '<button class="btn" onclick="checkEx1()">Check Answers</button>' +
                             '<button class="btn ghost" onclick="resetEx1()">Reset</button>' +
                             '<button class="btn secondary" onclick="window.location=\'index.html\'">Back to Index</button>' +
                             '<div id="ex1Result" style="margin-top:10px;"></div>';
}

// Check jawapan Ex1
function checkEx1(){
  var correct = 0;
  ex1Questions.forEach(function(item,i){
    var radios = document.getElementsByName('q'+i);
    for(var j=0;j<radios.length;j++){
      if(radios[j].checked && radios[j].value === item.answer){
        correct++;
      }
    }
  });
  var resultDiv = document.getElementById('ex1Result');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = 'You answered '+correct+' out of '+ex1Questions.length+' correctly.';
  resultDiv.style.color = 'green';
}

// Reset Ex1
function resetEx1(){
  ex1Questions.forEach(function(item,i){
    var radios = document.getElementsByName('q'+i);
    for(var j=0;j<radios.length;j++){
      radios[j].checked = false;
    }
  });
  document.getElementById('ex1Result').innerHTML = '';
}

// ===== EX2: True / False 10 Soalan =====
var ex2Questions = [
  {q:"1. SELECT * FROM table retrieves all columns.", answer:"T"},
  {q:"2. WHERE clause filters rows.", answer:"T"},
  {q:"3. INSERT removes existing rows.", answer:"F"},
  {q:"4. UPDATE changes data in a table.", answer:"T"},
  {q:"5. DELETE keeps the row in table.", answer:"F"},
  {q:"6. GROUP BY can be used without aggregate functions.", answer:"F"},
  {q:"7. HAVING is used after GROUP BY.", answer:"T"},
  {q:"8. ORDER BY DESC sorts ascending.", answer:"F"},
  {q:"9. JOIN combines two or more tables.", answer:"T"},
  {q:"10. COUNT(*) counts only non-null values.", answer:"F"}
];

// Paparkan Ex2
function loadEx2(){
  containerEx2.innerHTML = '';
  ex2Questions.forEach(function(item,i){
    var qHTML = '<div class="question">' +
                  '<p>'+item.q+'</p>' +
                  '<label><input type="radio" name="ex2q'+i+'" value="T"> True</label><br>' +
                  '<label><input type="radio" name="ex2q'+i+'" value="F"> False</label>' +
                '</div>';
    containerEx2.innerHTML += qHTML;
  });

  containerEx2.innerHTML += '<button class="btn" onclick="checkEx2()">Check Answers</button>' +
                             '<button class="btn ghost" onclick="resetEx2()">Reset</button>' +
                             '<button class="btn secondary" onclick="window.location=\'index.html\'">Back to Index</button>' +
                             '<div id="ex2Result" style="margin-top:10px;"></div>';
}

// Check jawapan Ex2
function checkEx2(){
  var correct = 0;
  ex2Questions.forEach(function(item,i){
    var radios = document.getElementsByName('ex2q'+i);
    for(var j=0;j<radios.length;j++){
      if(radios[j].checked && radios[j].value === item.answer){
        correct++;
      }
    }
  });
  var resultDiv = document.getElementById('ex2Result');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = 'You answered '+correct+' out of '+ex2Questions.length+' correctly.';
  resultDiv.style.color = 'green';
}

// Reset Ex2
function resetEx2(){
  ex2Questions.forEach(function(item,i){
    var radios = document.getElementsByName('ex2q'+i);
    for(var j=0;j<radios.length;j++){
      radios[j].checked = false;
    }
  });
  document.getElementById('ex2Result').innerHTML = '';
}

// === Load semua bila page ready ===
window.onload = function(){
  if(containerEx1) loadEx1();
  if(containerEx2) loadEx2();
};
