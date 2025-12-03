// =============================
// EXERCISE SYSTEM
// =============================

// store answers
const exerciseAnswers = {
    1: "SELECT * FROM Staff;",
    2: "SELECT Name, Position FROM Staff;"
};

// RUN exercise (show result only)
function runExercise(num) {
    const userSQL = document.getElementById('exercise${num}_editor').value;
    executeSQL(userSQL); // guna playground evaluator
}

// CHECK answer
function checkExercise(num) {
    const userSQL = document.getElementById('exercise${num}_editor').value.trim().toLowerCase();
    const correctSQL = exerciseAnswers[num].trim().toLowerCase();

    if (userSQL === correctSQL) {
        document.getElementById("exerciseResult").innerHTML = "✔️ Correct! Good job!";
    } else {
        document.getElementById("exerciseResult").innerHTML = "❌ Not correct yet. Try again!";
    }
}
// JavaScript Document

// =============================
// DRAG & DROP (Exercise)
// =============================
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.getAttribute("data-word"));
}

function drop(ev) {
    ev.preventDefault();
    const word = ev.dataTransfer.getData("text");
    ev.target.innerHTML += " " + word;
}

// Insert dropped words into editor
function appendFromDrop(num) {
    const dropText = document.getElementById("dropZone").innerText.trim();
    const editor = document.getElementById('exercise${num}_editor');
    editor.value = dropText;
}


