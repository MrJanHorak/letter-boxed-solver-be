// Purpose: Define a simple Express server that fetches the sides for the Letter Boxed puzzle from the New York Times website.
// The server uses the cheerio and axios libraries to fetch the HTML content of the puzzle page and extract the sides data from the embedded JavaScript.
// The extracted sides data is then formatted and returned as the response to a GET request to the /fetchLetterBoxedSides route.
// The server listens on port 3000 and logs a message to the console when it starts.

// 1. imports the required modules and creates an instance of the Express application
import express from 'express';
import cheerio from 'cheerio';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
// 2. define the routes and request handlers for the server
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/fetchLetterBoxedSides', async (req, res) => {
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

// 3. start the server
app.listen(env || 3001, () => {
  console.log('Server is running');
});