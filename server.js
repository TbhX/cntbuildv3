import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import NodeCache from 'node-cache';
import pTimeout from 'p-timeout';
import pRetry from 'p-retry';
import compression from 'compression';
import helmet from 'helmet';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Initialize OpenAI with error handling
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 5,
    timeout: 60000
  });
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

// Cache for API responses
const cache = new NodeCache({ 
  stdTTL: 3600,
  checkperiod: 120
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
}));

// Enable compression
app.use(compression());

// Configure CORS
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());

// Pre-flight OPTIONS handler
app.options('*', cors(corsOptions));

// Serve static files in production
if (!isDev) {
  app.use(express.static(join(__dirname, 'dist')));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: isDev ? err.stack : undefined
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        status: 'error',
        message: 'OpenAI API not initialized'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        status: 'error',
        message: 'OpenAI API key not configured'
      });
    }

    res.json({
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      services: {
        openai: 'ok',
        cache: 'ok'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: isDev ? error.message : 'Internal server error'
    });
  }
});

// Build recommendation endpoint
app.post('/api/build-recommendation', async (req, res) => {
  try {
    const { allies, enemies, playerChampion, playerRole, prompt } = req.body;

    if (!allies?.length || !enemies?.length || !playerChampion) {
      return res.status(400).json({ 
        error: 'Missing required data',
        details: {
          allies: !allies?.length ? 'Missing allies' : undefined,
          enemies: !enemies?.length ? 'Missing enemies' : undefined,
          playerChampion: !playerChampion ? 'Missing player champion' : undefined
        }
      });
    }

    if (!openai) {
      throw new Error('OpenAI API not initialized');
    }

    const cacheKey = `build_${playerChampion.id}_${playerRole}_${allies.map(c => c.id).join('_')}_${enemies.map(c => c.id).join('_')}`;
    
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    const getOpenAIResponse = async () => {
      const completion = await pRetry(
        async () => {
          const response = await pTimeout(
            openai.chat.completions.create({
              model: "gpt-4-turbo-preview",
              messages: [
                {
                  role: "system",
                  content: "You are a League of Legends expert providing detailed build recommendations based on team compositions. Use only exact item names from the current patch. Provide your response in the requested JSON format."
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 2000,
              response_format: { type: "json_object" }
            }),
            {
              milliseconds: 60000,
              message: 'OpenAI API request timed out'
            }
          );
          return response;
        },
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000,
          onFailedAttempt: error => {
            console.warn(
              `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
              error.message
            );
          }
        }
      );

      return completion;
    };

    const completion = await getOpenAIResponse();

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from OpenAI API');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      console.error('Raw response:', aiResponse);
      throw new Error('Invalid response format from OpenAI');
    }

    const recommendation = {
      items: parsedResponse.items || [],
      runes: parsedResponse.runes || {},
      strategy: parsedResponse.strategy || {},
      team_analysis: parsedResponse.team_analysis || {},
      build_order: parsedResponse.build_order || {},
      forChampion: playerChampion,
      forRole: playerRole
    };

    cache.set(cacheKey, recommendation);

    res.json(recommendation);
  } catch (error) {
    console.error('Error generating build recommendation:', error);
    
    if (error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'Request timed out. Please try again.',
        details: isDev ? error.message : undefined
      });
    }
    
    if (error.message.includes('rate limits')) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        details: isDev ? error.message : undefined
      });
    }

    res.status(error.status || 500).json({ 
      error: 'Failed to generate build recommendation',
      details: isDev ? error.message : undefined
    });
  }
});

// Serve index.html for all other routes in production
if (!isDev) {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API health check: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});