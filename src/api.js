// 1. imports the required modules
import { Router } from 'express';
import serverless from "serverless-http";
import cheerio from 'cheerio';
import axios from 'axios';
import cors from 'cors';

const express = require('express');
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());

// 2. define the routes and request handlers for the server
const router = Router();

router.get('/', (req, res) => {
  res.send('Hello World');
});

router.get('/fetchLetterBoxedSides', async (req, res) => {
  console.log('Fetching Letter Boxed sides...');
  try {
    const response = await axios.get(
      'https://www.nytimes.com/puzzles/letter-boxed'
    );
    const $ = cheerio.load(response.data);
    let sidesData = '';

    $('script').each((i, script) => {
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

app.use(`/.netlify/functions/api`, router);

// 3. export the handler function
module.exports.handler = serverless(app);