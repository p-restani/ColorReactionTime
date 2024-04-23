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

// Initialize Firebase
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

document.getElementById('startButton').addEventListener('click', function() {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('colorBox').style.display = 'block';
  document.getElementById('instruction').style.display = 'block';
  changeColor();
});

document.getElementById('restartButton').addEventListener('click', restartExperiment);
document.getElementById('colorBox').addEventListener('touchstart', handleInput);
document.body.addEventListener('keyup', handleInput);

function getRandomColor(excludeColor) {
  const colors = ['red', 'green', 'blue', 'yellow'];
  return colors.filter(color => color !== excludeColor)[Math.floor(Math.random() * (colors.length - 1))];
}

function changeColor() {
  if (changesCount >= totalChanges) {
    endExperiment();
    return;
  }

  if (!isFirstColor) {
    previousColor = currentColor;
    currentColor = getRandomColor(currentColor);
    colorBox.style.backgroundColor = currentColor;
    startTime = performance.now();
  } else {
    isFirstColor = false;
  }

  hasReacted = false;
  changesCount++;
  updateProgressBar();
}

function recordReaction() {
  if (!hasReacted && !isFirstColor) {
    const endTime = performance.now();
    const reactionTime = endTime - startTime;
    const transition = previousColor ? `${previousColor}-to-${currentColor}` : null;

    if (transition) {
      reactionTimes[transition] = reactionTimes[transition] || [];
      reactionTimes[transition].push(reactionTime);
      console.log(`Reaction Time for ${transition}: ${reactionTime} ms`);
    }

    hasReacted = true;
    setTimeout(changeColor, Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000);
  }
}

function updateProgressBar() {
  const progressBar = document.getElementById('progressBar');
  const progress = (changesCount / totalChanges) * 100;
  setTimeout(() => {
    progressBar.style.width = `${progress}%`;
  }, 500);
}

function endExperiment() {
  experimentEnded = true;
  saveExperimentData();
  document.getElementById('colorBox').style.display = 'none';
  document.getElementById('progressContainer').style.display = 'none';
  document.getElementById('instruction').style.display = 'none';
  document.getElementById('endScreen').style.display = 'block';
}

function restartExperiment() {
  changesCount = 0;
  hasReacted = false;
  experimentEnded = false;
  isFirstColor = true;
  reactionTimes = {};

  document.getElementById('colorBox').style.display = 'block';
  document.getElementById('progressContainer').style.display = 'block';
  document.getElementById('instruction').style.display = 'block';
  document.getElementById('endScreen').style.display = 'none';
  resetProgressBar();
  changeColor();
}

// Save all reaction times to Firestore
async function saveExperimentData() {
  try {
    const docRef = await addDoc(collection(db, "experimentData"), { reactionTimes });
    console.log("Document written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding document:", error);
  }
}

function handleInput(event) {
  if (event.type === 'keyup' && event.code === 'Space' || event.type === 'touchstart') {
    recordReaction();
  }
}
