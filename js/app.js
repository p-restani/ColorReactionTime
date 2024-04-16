import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBwEZQZJhRRug7LVOjJrQpurrFPJgqAr6U",
  authDomain: "color-reaction-test.firebaseapp.com",
  projectId: "color-reaction-test",
  storageBucket: "color-reaction-test.appspot.com",
  messagingSenderId: "783453334797",
  appId: "1:783453334797:web:9887b504e3b2e2f20e9444",
  measurementId: "G-W4GZ5JKHQS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let reactionTimes = {};
let startTime;
let currentColor = '';
let colorBox = document.getElementById('colorBox');
let changesCount = 0;
let totalChanges = 21;
let hasReacted = false;
let experimentEnded = false;
let previousColor = '';
let isFirstColor = true;
let individualColorTimes = {
  'red': [],
  'green': [],
  'blue': [],
  'yellow': []
};

function getRandomColor(excludeColor) {
  const colors = ['red', 'green', 'blue', 'yellow'];
  return colors.filter(color => color !== excludeColor)[Math.floor(Math.random() * (colors.length - 1))];
}

document.getElementById('startButton').addEventListener('click', function() {
  document.getElementById('startScreen').style.display = 'none'; // Hide start screen
  document.getElementById('colorBox').style.display = 'block'; // Show the color box
  document.getElementById('instruction').style.display = 'block'; // Show the instruction
  changeColor();
});
document.getElementById('restartButton').addEventListener('click', restartExperiment);


function changeColor() {
  if (changesCount >= totalChanges) {
    endExperiment();
    return;
  }

  previousColor = currentColor;
  currentColor = getRandomColor(currentColor);
  colorBox.style.backgroundColor = currentColor;


  if (!isFirstColor) {
    startTime = performance.now();
  } else {
    isFirstColor = false;
  }

  hasReacted = false;
  changesCount++;
  setTimeout(updateProgressBar, 550);
}

function updateProgressBar() {
  const progressBar = document.getElementById('progressBar');
  const progress = (changesCount / totalChanges) * 100;
  progressBar.style.width = progress + '%';
}
function recordReaction() {
  if (!hasReacted && !isFirstColor) { // Only record reactions if it's not the first color
    const endTime = performance.now();
    const reactionTime = endTime - startTime;
    const transition = previousColor ? `${previousColor}-to-${currentColor}` : null; // Only create a transition if there is a previous color

    if (transition && !reactionTimes[transition]) {
      reactionTimes[transition] = [];
    }

    if (transition) {
      reactionTimes[transition].push(reactionTime);
      console.log(`Reaction Time for ${transition}: ${reactionTime} ms`);
    }

    hasReacted = true; // Set the flag to true after recording the reaction

    // Prepare for the next color with a random delay between 2000ms and 4000ms
    const randomDelay = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
    setTimeout(changeColor, randomDelay);
    if (currentColor in individualColorTimes) {
      individualColorTimes[currentColor].push(reactionTime);
    }
  }

  // Reset isFirstColor after the first reaction has been recorded (or ignored)
  isFirstColor = false;
}


function calculateAverageReactionTimes() {
  let averageReactionTimes = {};
  for (let color in reactionTimes) {
    let sum = reactionTimes[color].reduce((a, b) => a + b, 0);
    let avg = sum / reactionTimes[color].length;
    averageReactionTimes[color] = avg;
  }
  return averageReactionTimes;
}
function calculateIndividualColorAverages() {
  let averages = {};
  for (let color in individualColorTimes) {
    let sum = individualColorTimes[color].reduce((a, b) => a + b, 0);
    let avg = sum / individualColorTimes[color].length;
    averages[color] = avg;
  }
  return averages;
}

function endExperiment() {
  experimentEnded = true;
  const averageReactionTimes = calculateAverageReactionTimes();
  const individualAverages = calculateIndividualColorAverages();

  console.log(averageReactionTimes);
  console.log('Individual Color Averages:', individualAverages);

  // Save the calculated averages to Firestore
  saveExperimentData(averageReactionTimes);
  saveIndividualColorData(individualAverages);

  // Hide colorBox and show the endScreen with thank you message and restart button
  colorBox.style.display = 'none';
  document.getElementById('progressContainer').style.display = 'none';
  document.getElementById('instruction').style.display = 'none';
  document.getElementById('endScreen').style.display = 'block';
}
function restartExperiment() {
  // Reset experiment variables
  changesCount = 0;
  hasReacted = false;
  experimentEnded = false;
  isFirstColor = true;
  reactionTimes = {};
  individualColorTimes = {
    'red': [],
    'green': [],
    'blue': [],
    'yellow': []
  };

  document.getElementById('colorBox').style.display = 'block';
  document.getElementById('progressContainer').style.display = 'block';
  document.getElementById('instruction').style.display = 'block';
  document.getElementById('endScreen').style.display = 'none';
  resetProgressBar();

  changeColor();
}


function displayResults(averageReactionTimes) {
  let results = document.createElement('div');
  results.id = 'results';
  for (let transition in averageReactionTimes) {
    let p = document.createElement('p');
    p.textContent = `Average reaction time for ${transition}: ${averageReactionTimes[transition]} ms`;
    results.appendChild(p);
  }
  document.body.appendChild(results);
}

async function saveExperimentData(data) {
  try {
    const docRef = await addDoc(collection(db, "experimentData"), data);
    console.log("Document written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding document:", error);
  }
}

async function saveIndividualColorData(data) {
  try {
    const docRef = await addDoc(collection(db, "individualColorData"), data);
    console.log("Individual color data written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding individual color data:", error);
  }
}



function handleInput(event) {
  // Check if spacebar was pressed, or if it's a touch event
  if (event.type === 'keyup' && event.code === 'Space' || event.type === 'touchstart') {
    recordReaction();
  }
}


document.body.addEventListener('keyup', handleInput);
document.getElementById('colorBox').addEventListener('touchstart', handleInput);

