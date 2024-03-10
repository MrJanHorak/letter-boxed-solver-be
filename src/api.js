/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
import functions from 'firebase-functions';
import express from 'express';
import cheerio from 'cheerio';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());

const threeWordSolutions = (lettersArraySet, wordList) => {
  let solutions = [];
  let wordMap = new Map();
  let wordSetList = Object.keys(wordList).map((word) => ({
    word,
    set: new Set(word.split('')),
  }));

  // Create a map where the keys are the first letter of each word
  // and the values are arrays of words that start with that letter
  for (let wordObj of wordSetList) {
    let firstLetter = wordObj.word.charAt(0);
    if (wordMap.has(firstLetter)) {
      wordMap.get(firstLetter).push(wordObj);
    } else {
      wordMap.set(firstLetter, [wordObj]);
    }
  }

  function findSolutions(firstWord, secondWord, thirdWord) {
    if (solutions.length >= 2500) return;

    if (
      firstWord.word.slice(-1) === secondWord.word.charAt(0) &&
      secondWord.word.slice(-1) === thirdWord.word.charAt(0) &&
      [...lettersArraySet].every(
        (letter) =>
          firstWord.set.has(letter) ||
          secondWord.set.has(letter) ||
          thirdWord.set.has(letter)
      )
    ) {
      solutions.push([firstWord.word, secondWord.word, thirdWord.word]);
    }
  }

  for (let firstWord of wordSetList) {
    let secondWords = wordMap.get(firstWord.word.slice(-1));
    if (!secondWords) continue;
    for (let secondWord of secondWords) {
      if (secondWord === firstWord) continue;
      let thirdWords = wordMap.get(secondWord.word.slice(-1));
      if (!thirdWords) continue;
      for (let thirdWord of thirdWords) {
        if (thirdWord === secondWord || thirdWord === firstWord) continue;
        findSolutions(firstWord, secondWord, thirdWord);
      }
    }
  }

  return solutions.length ? solutions : ['no three word solutions found'];
};

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/fetchLetterBoxedSides', async (req, res) => {
  try {
    const response = await axios.get(
      'https://www.nytimes.com/puzzles/letter-boxed'
    );
    const $ = cheerio.load(response.data);
    let sidesData = '';

    const data = $('script').each((_, script) => {
      const scriptContent = $(script).html();
      if (scriptContent.startsWith('window.gameData')) {
        const gameDataText = scriptContent;
        const search = '"sides":';
        const sidesStart = gameDataText.indexOf(search) + search.length + 1;
        const length = '"ABC"'.length * 4 + ','.length * 3; // Adjust based on expected length
        sidesData = gameDataText.substring(sidesStart, sidesStart + length); // Extract the sides data
      }
    });

    // Replace and format the string to match the desired output
    const formattedSidesData = sidesData
      .replace(/"/g, '')
      .replace(/,/g, ' ')
      .toLowerCase();
    res.json({ sides: formattedSidesData });
  } catch (error) {
    console.error('Failed to fetch Letter Boxed sides:', error);
    res.status(500).send('Failed to fetch Letter Boxed sides');
  }
});

app.use(express.json()); // This line is necessary to parse JSON request bodies

app.post('/findSolutions', (req, res) => {
  const { lettersArraySet, wordList } = req.body;

  if (!lettersArraySet || !wordList) {
    return res
      .status(400)
      .send('Missing lettersArraySet or wordList in request body');
  }

  const solutions = threeWordSolutions(lettersArraySet, wordList);
  console.log('typeof solutions:', typeof solutions);
  res.json({ solutions });
});

export const api = functions.https.onRequest(app);
