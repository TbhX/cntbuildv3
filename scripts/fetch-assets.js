import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config();

const DDRAGON_VERSION = process.env.DDRAGON_VERSION || '15.5.1';
const DDRAGON_LOCALE = process.env.DDRAGON_LOCALE || 'en_US';
const DDRAGON_BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;

async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function downloadAndOptimizeImage(url, outputPath) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await sharp(response.data)
      .resize(64, 64, { fit: 'contain' })
      .webp({ quality: 80 })
      .toFile(outputPath);
    console.log(`✓ Downloaded and optimized: ${outputPath}`);
  } catch (error) {
    console.error(`× Failed to process: ${url}`, error.message);
  }
}

async function fetchAssets() {
  // Create assets directories
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  const itemsDir = path.join(assetsDir, 'items');
  const runesDir = path.join(assetsDir, 'runes');
  
  await ensureDir(assetsDir);
  await ensureDir(itemsDir);
  await ensureDir(runesDir);

  // Fetch items
  console.log('Fetching items...');
  const itemsResponse = await axios.get(`${DDRAGON_BASE_URL}/data/${DDRAGON_LOCALE}/item.json`);
  const items = itemsResponse.data.data;

  // Download item images
  for (const [itemId, item] of Object.entries(items)) {
    if (item.gold?.purchasable && !item.consumed) {
      const imageUrl = `${DDRAGON_BASE_URL}/img/item/${itemId}.png`;
      const outputPath = path.join(itemsDir, `${itemId}.webp`);
      await downloadAndOptimizeImage(imageUrl, outputPath);
    }
  }

  // Fetch runes
  console.log('Fetching runes...');
  const runesResponse = await axios.get(`${DDRAGON_BASE_URL}/data/${DDRAGON_LOCALE}/runesReforged.json`);
  const runes = runesResponse.data;

  // Download rune images
  for (const tree of runes) {
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        const imageUrl = `${DDRAGON_BASE_URL}/img/${rune.icon}`;
        const outputPath = path.join(runesDir, `${rune.id}.webp`);
        await downloadAndOptimizeImage(imageUrl, outputPath);
      }
    }
  }

  console.log('Asset download complete!');
}

// Run the script
fetchAssets().catch(console.error);