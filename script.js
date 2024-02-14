"use strict";

const puzzle = document.querySelector('.puzzle');
const items = Array.from(puzzle.querySelectorAll('.puzzle__item'));
const numbers = Array.from(puzzle.querySelectorAll('.puzzle__item span'));
const shuffleButton = document.querySelector('#shuffle');
const resetButton = document.querySelector('#reset');
const shuffleButtonSound = document.querySelector('.shuffle-button-click');
const itemsMoveSound = document.querySelector(".items-move-sound");
const soundForwinner = document.querySelector('.winner-sound');
const levelBox = document.querySelector('.level-button-box');
const buttons = document.querySelectorAll('button');
const levelButtons = document.querySelectorAll('.level-button');
const countItems = 16;
let stateChecker = false;

// Position of items

items[countItems - 1].style.display = 'none';

// Assigning the calling of function getMatrix with array as a parameter to the variable matrix
let matrix = getMatrix(items.map((item) => Number(item.dataset.matrixId)));
console.log(matrix); // [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]

// set position of items by default

setPositionItems(matrix);

// choice level

let maxShuffleCount = 0;

levelBox.addEventListener('click', (event) => {

  levelButtons.forEach((button) => {
    button.classList.remove('level-button--active')
  });
 
  if(event.target.id === 'easy') {
    maxShuffleCount = 15;
    playSound(shuffleButtonSound);
    event.target.classList.add('level-button--active');
    shuffleButton.classList.remove('disabled');
  } 
  if(event.target.id === 'normal') {
    maxShuffleCount = 30;
    playSound(shuffleButtonSound);
    event.target.classList.add('level-button--active');
    shuffleButton.classList.remove('disabled');
  } 
  if(event.target.id === 'hard') {
    maxShuffleCount = 60;
    playSound(shuffleButtonSound);
    event.target.classList.add('level-button--active');
    shuffleButton.classList.remove('disabled');
  }
})

// shuffle items by click on te shuffle button

let timer;

shuffleButton.addEventListener("click", () => {
  
  puzzle.classList.remove('blocked');
 
  let shuffleCount = 0;
  clearInterval(timer);
  
  if(shuffleCount === 0) {
    timer = setInterval(() => {
      randomSwap(matrix);
      setPositionItems(matrix);
      shuffleCount++;
      saveMatrixInLocalStorage();
     if(shuffleCount >= maxShuffleCount) {
        shuffleCount = 0;
        clearInterval(timer);
      }
    }, 50);
  }

  numbers.forEach((number) => {
    number.classList.remove("winner");
  });

  playSound(shuffleButtonSound);

  buttons.forEach((button) => {
    button.classList.add('disabled');
  });
  levelButtons.forEach((button) => {
    button.classList.remove('level-button--active')
  });
  resetButton.classList.remove('disabled')
});

// returning the matrix to the start position by click on the reset button

resetButton.addEventListener("click", () => {
  playSound(shuffleButtonSound);
  puzzle.classList.add('blocked');
  buttons.forEach((button) => {
    button.classList.remove('disabled')
  });
  resetButton.classList.add('disabled');
  shuffleButton.classList.add('disabled');
  removeMatrixFromLocalStorage();
  matrix = getMatrix(items.map((item) => Number(item.dataset.matrixId)));
  setPositionItems(matrix);

})

// down and up the buttons

buttons.forEach((button) => {
  button.addEventListener('mousedown', () => {
    button.classList.add('button--clicked')
  })
  button.addEventListener('mouseup', () => {
    button.classList.remove('button--clicked')
  })
})

buttons.forEach((button) => {
  button.addEventListener('touchstart', () => {
    button.classList.add('button--clicked')
  })
  button.addEventListener('touchend', () => {
    button.classList.remove('button--clicked')
  })
})


const blankNumber = 16;

puzzle.addEventListener("click", (event) => {
  const puzzleItem = event.target.closest('.puzzle__item');

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



// functions - helpers

let blockedCoordinates = null;

function randomSwap(matrix) {
  const blankCoordinates = findcoordinatesByNumber(blankNumber, matrix);
  
  
  const validCoordinates = findValidCoordinates({
    blankCoordinates,
    matrix,
    blockedCoordinates
  });
 
  const swapCoordinates =  validCoordinates[
    Math.floor(Math.random() *  validCoordinates.length)
  ];
  swapItems(blankCoordinates, swapCoordinates, matrix);
  blockedCoordinates = blankCoordinates;
 
}

function findValidCoordinates( {blankCoordinates, matrix, blockedCoordinates} ) {
  const validCoordinates = [];
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (isValidForSwap({ x, y }, blankCoordinates)) {
        if(!blockedCoordinates || !(blockedCoordinates.x === x && blockedCoordinates.y === y)) {
          validCoordinates.push({ x, y })
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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
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
    puzzle.classList.add('blocked');
  }
}

const winFlatArray = new Array(16).fill(0).map((_item, index) => index + 1); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
//const winFlatArray =  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
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
      button.classList.remove('disabled');
    });
    resetButton.classList.add('disabled');
    shuffleButton.classList.add('disabled');
  }, 300);
}



// save matrix in LocalStorage

function saveMatrixInLocalStorage() {
  localStorage.setItem('matrix', JSON.stringify(matrix));
}

// get matrix from LocalStorage

window.addEventListener('load', () => {
  const savedMatrix = JSON.parse(localStorage.getItem('matrix'));
  if(savedMatrix) {
     puzzle.classList.remove('blocked');
    matrix = savedMatrix;
    setPositionItems(matrix);
   resetButton.classList.remove('disabled');
   levelButtons.forEach((button) => {
    button.classList.add('disabled')
  });
 }
})

// remove matrix from LocalStorage

function removeMatrixFromLocalStorage() {
  localStorage.removeItem('matrix');
}

// sound functions

// play sound

function playSound(sound) {
  sound.play();
  sound.currentTime = 0;
}

