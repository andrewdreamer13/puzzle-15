"use strict";

// variables

const puzzle = document.querySelector(".puzzle");
const items = Array.from(puzzle.querySelectorAll(".puzzle__item"));
const numbers = Array.from(puzzle.querySelectorAll(".puzzle__item span"));
const shuffleButton = document.querySelector("#shuffle");
const resetButton = document.querySelector("#reset");
const shuffleButtonSound = document.querySelector(".shuffle-button-click");
const itemsMoveSound = document.querySelector(".items-move-sound");
const soundForwinner = document.querySelector(".winner-sound");
const buttons = document.querySelectorAll("button");
const rangerBox = document.querySelector(".ranger-box");
const ranger = document.querySelector("#ranger");
const rangeCount = document.querySelector(".range-count");
const countItems = 16;
const blankNumber = 16;
let stateChecker = false;
let maxShuffleCount = 0;
let timer;
let shuffleCount;
let blockedCoordinates = null;
//const winFlatArray = new Array(16).fill(0).map((_item, index) => index + 1); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const winFlatArray =  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

// Events

// Position of items

items[countItems - 1].style.display = "none";

// Assigning the calling of function getMatrix with array as a parameter to the variable matrix
let matrix = getMatrix(items.map((item) => Number(item.dataset.matrixId)));
console.log(matrix); // [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]

// set position of items by default

setPositionItems(matrix);

// choice level with input range

ranger.addEventListener('input', changeLevel);

// shuffle puzzle items

shuffleButton.addEventListener("click", () => {
  shuffleCount = 0;
  clearInterval(timer);

  if (shuffleCount === 0) {
    timer = setInterval(() => {
      randomSwap(matrix);
      setPositionItems(matrix);
      shuffleCount++;
      saveMatrixInLocalStorage();
      if (shuffleCount >= maxShuffleCount) {
        console.log(shuffleCount)
        shuffleCount = 0;
        clearInterval(timer);
      }
    }, 50);
  }

  puzzle.classList.remove("blocked");

  numbers.forEach((number) => {
    number.classList.remove("winner");
  });

  playSound(shuffleButtonSound);
  saveRangeValueInLocalStorage();


  resetButton.classList.remove("disabled");
  shuffleButton.classList.add("disabled");
  rangerBox.classList.add("ranger-blocked");
});

// returning the matrix to the start position by click on the reset button

resetButton.addEventListener("click", () => {
  playSound(shuffleButtonSound);
  puzzle.classList.add("blocked");
  resetButton.classList.add("disabled");
  removeMatrixFromLocalStorage();
  matrix = getMatrix(items.map((item) => Number(item.dataset.matrixId)));
  setPositionItems(matrix);
  rangerBox.classList.remove("ranger-blocked");
  ranger.value = 0;
  rangeCount.textContent = 0;
  rangeCount.style.left = `${ranger.value - 4}% `;
  removeRangeValueFromLocalStorage();

});

// down and up effect on the buttons

buttons.forEach((button) => {
  button.addEventListener("mousedown", () => {
    button.classList.add("button--clicked");
  });
  button.addEventListener("mouseup", () => {
    button.classList.remove("button--clicked");
  });
});

buttons.forEach((button) => {
  button.addEventListener("touchstart", () => {
    button.classList.add("button--clicked");
  });
  button.addEventListener("touchend", () => {
    button.classList.remove("button--clicked");
  });
});

// shuffling items by click on itself

puzzle.addEventListener("click", (event) => {
  const puzzleItem = event.target.closest(".puzzle__item");

  if (!puzzleItem) {
    return;
  }
  const itemNumber = Number(puzzleItem.dataset.matrixId);
  const itemCoordinates = findcoordinatesByNumber(itemNumber, matrix);
  const blankCoordinates = findcoordinatesByNumber(blankNumber, matrix);
  const isValid = isValidForSwap(itemCoordinates, blankCoordinates);

  if (isValid) {
    swapItems(blankCoordinates, itemCoordinates, matrix);
    setPositionItems(matrix);
    playSound(itemsMoveSound);
    saveMatrixInLocalStorage();
    isWon(matrix);
  }
});

// get data from LocalStorage

window.addEventListener("load", () => {
  const savedMatrix = JSON.parse(localStorage.getItem('matrix'));
  const savedRange = JSON.parse(localStorage.getItem('rangeValue'));

  if (savedMatrix && savedRange) {
    puzzle.classList.remove("blocked");
    matrix = savedMatrix;
   
    setPositionItems(matrix);
    resetButton.classList.remove("disabled");
    shuffleButton.classList.add("disabled");
   
    ranger.value = savedRange;
    rangeCount.textContent = savedRange;
    rangerBox.classList.add("ranger-blocked");
    
  }
});

// Functions - helpers

function changeLevel() {

  maxShuffleCount = ranger.value;

  if( maxShuffleCount > 0 ) {
    shuffleButton.classList.remove("disabled");
  } else {
    shuffleButton.classList.add("disabled");
  }

  rangeCount.textContent = maxShuffleCount;
  rangeCount.style.left = `${ranger.value - 4}% `;

  if( ranger.value >= 10 ) {
    rangeCount.style.left = `${ranger.value - 6}% `;
  }
  if( ranger.value >= 30 ) {
    rangeCount.style.left = `${ranger.value - 7}% `;
  }
  if( ranger.value >= 50 ) {
    rangeCount.style.left = `${ranger.value - 8}% `;
  }
  if( ranger.value >= 70 ) {
    rangeCount.style.left = `${ranger.value - 10}% `;
  }
  if( ranger.value >= 100 ) {
    rangeCount.style.left = `${ranger.value - 12}% `;
  }
  
}

function randomSwap(matrix) {
  const blankCoordinates = findcoordinatesByNumber(blankNumber, matrix);

  const validCoordinates = findValidCoordinates({
    blankCoordinates,
    matrix,
    blockedCoordinates,
  });

  const swapCoordinates =
    validCoordinates[Math.floor(Math.random() * validCoordinates.length)];
  swapItems(blankCoordinates, swapCoordinates, matrix);
  blockedCoordinates = blankCoordinates;
}

function findValidCoordinates({blankCoordinates, matrix, blockedCoordinates}) {
  const validCoordinates = [];
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (isValidForSwap({ x, y }, blankCoordinates)) {
        if (!blockedCoordinates || !(blockedCoordinates.x === x && blockedCoordinates.y === y)) {
          validCoordinates.push({ x, y });
        }
      }
    }
  }
  return validCoordinates;
}

function getMatrix(array) {
  const matrix = [[], [], [], []];
  let y = 0;
  let x = 0;

  for (let i = 0; i < array.length; i++) {
    if (x >= 4) {
      x = 0;
      y++;
    }
    matrix[y][x] = array[i];
    x++;
  }
  return matrix;
}

function setPositionItems(matrix) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      const value = matrix[y][x];
      const node = items[value - 1];
      setNodeStyle(node, x, y);
    }
  }
}

function setNodeStyle(node, x, y) {
  const shiftPosition = 100;
  node.style.transform = `translate3D(${x * shiftPosition}%, ${
    y * shiftPosition
  }%, 0)`;
}

function findcoordinatesByNumber(number, matrix) {
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] === number) {
        return { x, y };
      }
    }
  }
  return null;
}

function isValidForSwap(coords1, coords2) {
  const differenceByX = Math.abs(coords1.x - coords2.x);
  const differenceByY = Math.abs(coords1.y - coords2.y);
  return (
    (differenceByX === 1 || differenceByY === 1) &&
    (coords1.x === coords2.x || coords1.y === coords2.y)
  );
}

function swapItems(coords1, coords2, matrix) {
  const coordinatesOfItem = matrix[coords1.y][coords1.x];
  matrix[coords1.y][coords1.x] = matrix[coords2.y][coords2.x];
  matrix[coords2.y][coords2.x] = coordinatesOfItem;

  if (isWon(matrix)) {
    addWonClass();
    playSound(soundForwinner);
    puzzle.classList.add("blocked");
  }
}

function isWon(matrix) {
  const flatMatrix = matrix.flat();
  for (let i = 0; i < winFlatArray.length; i++) {
    if (flatMatrix[i] !== winFlatArray[i]) {
      return false;
    }
  }
  removeMatrixFromLocalStorage();
  return true;
}

function addWonClass() {
  setTimeout(() => {
    numbers.forEach((number) => {
      number.classList.add("winner");
    });

    buttons.forEach((button) => {
      button.classList.remove("disabled");
    });
    resetButton.classList.add("disabled");
    shuffleButton.classList.add("disabled");
    rangerBox.classList.remove("ranger-blocked");
    ranger.value = 0;
    rangeCount.textContent = 0;
    rangeCount.style.left = `${ranger.value - 4}% `;
  }, 300);
}


function saveMatrixInLocalStorage() {
  localStorage.setItem("matrix", JSON.stringify(matrix));
}

function removeMatrixFromLocalStorage() {
  localStorage.removeItem("matrix");
}

function saveRangeValueInLocalStorage() {
  localStorage.setItem("rangeValue", JSON.stringify(ranger.value));
}

function removeRangeValueFromLocalStorage() {
  localStorage.removeItem("rangeValue");
}

function playSound(sound) {
  sound.play();
  sound.currentTime = 0;
}
