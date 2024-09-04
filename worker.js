const Queue = require('bull');

const fileQueue = new Queue('images');
const fs = require('fs');
const image_thumbnail = require('image-thumbnail');
const { ObjectId } = require('mongodb');
const dbClient = require('./utils/db');

fileQueue.process(async (job) => {
  const widths = [500, 250, 100];
  let { userId, fileId } = job.data;
  if (!userId) throw new Error('Missing userId');
  if (!fileId) throw new Error('Missing fileId');
  userId = new ObjectId(userId);
  fileId = new ObjectId(fileId);
  const file = await dbClient.File.findOne({ _id: fileId, userId });
  if (!file) throw new Error('File not foundddd');
  const { localPath } = file;
  try {
    widths.forEach(async (w) => {
      const thumb = await image_thumbnail(localPath, { width: w });
      await fs.writeFileSync(`${localPath}_${w}`, thumb);
      // await fs.writeFileSync(`${localPath.split('.')[0]}_${w}.png`, thumb);
    });
  } catch (err) {
    throw new Error('Cannot create thumbnails');
  }
});

fileQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed`);
});
fileQueue.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed: ${err.message}`);
});
