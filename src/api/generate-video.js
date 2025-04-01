import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

export default async function handler(req, res) {
  const { imageUrls, voiceoverUrl } = req.body;

  try {
    // Create a temporary directory to store the images
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'story-to-video-'));

    // Launch Puppeteer and generate screenshots
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      await page.goto(imageUrl, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(tempDir, `image_${i}.png`) });
    }

    await browser.close();

    // Generate the video using FFmpeg
    const outputVideoPath = path.join(tempDir, 'output.mp4');
    const ffmpegCommand = `ffmpeg -framerate 1 -pattern_type glob -i '${tempDir}/*.png' -i ${voiceoverUrl} -c:v libx264 -c:a aac -shortest ${outputVideoPath}`;

    await exec(ffmpegCommand);

    // Send the generated video back to the client
    res.setHeader('Content-Type', 'video/mp4');
    res.sendFile(outputVideoPath);
  } catch (error) {
    console.error('Failed to generate video:', error);
    res.status(500).json({ error: 'Failed to generate video' });
  }
}
