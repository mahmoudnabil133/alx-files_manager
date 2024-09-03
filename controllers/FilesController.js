const { ObjectId } = require('mongodb');
const uuid = require('uuid');
const fs = require('fs');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const mime = require('mime-types');

exports.postUpload = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    const tokenKey = `auth_${token}`;
    const strId = await redisClient.get(tokenKey);
    const userId = new ObjectId(strId);
    const user = await dbClient.User.findOne({ _id: userId });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, data,
    } = req.body;
    let {
      parentId, isPublic,
    } = req.body;
    if (!name) throw new Error('Missing name');
    if (!type || !['folder', 'file', 'image'].includes(type)) throw new Error('Missing type');
    if (!data && type !== 'folder') throw new Error('Missing data');
    if (!parentId) {
      parentId = '0';
    }
    if (!isPublic) {
      isPublic = false;
    }
    if (parentId && parentId !== '0') {
      parentId = new ObjectId(parentId);
      const parent = await dbClient.File.findOne({ _id: parentId });
      if (!parent) throw new Error('Parent not found');
      if (parent.type !== 'folder') throw new Error('Parent is not a folder');
    }
    let newFile = {
      userId,
      name,
      type,
      parentId,
      isPublic,
    };
    if (type === 'folder') {
      const folder = await dbClient.File.insertOne(newFile);
      // newFile.id = folder.insertedId;
      newFile = { id: folder.insertedId, ...newFile };
      delete newFile._id;
      return res.status(201).json(newFile);
    }
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const fileName = uuid.v4();
    const filePath = `${folderPath}/${fileName}`;
    newFile.localPath = filePath;
    const file = await dbClient.File.insertOne(newFile);
    newFile = { id: file.insertedId, ...newFile };
    if (!fs.existsSync(folderPath)) {
      try {
        fs.mkdirSync(folderPath, { recursive: true });
      } catch (err) {
        throw new Error('Cannot create folder path');
      }
    }
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    try {
      await fs.writeFileSync(filePath, decodedData);
    } catch (err) {
      throw new Error('Cannot write file');
    }
    return res.status(201).json(newFile);
  } catch (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
};

exports.getShow = async (req, res) => {
  try {
    let fileId = req.params.id;
    fileId = new ObjectId(fileId);
    const tokenKey = `auth_${req.headers['x-token']}`;
    let userId = await redisClient.get(tokenKey);
    userId = new ObjectId(userId);
    const user = await dbClient.User.findOne({ _id: userId });
    if (!user) throw new Error('Unauthorized');
    const file = await dbClient.File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({
        error: 'Not found',
      });
    }
    return res.status(200).json(file);
  } catch (err) {
    return res.status(401).json({
      error: err.message,
    });
  }
};

exports.getIndex = async (req, res) => {
  try {
    const tokenKey = `auth_${req.headers['x-token']}`;
    let userId = await redisClient.get(tokenKey);
    console.log(userId);
    userId = new ObjectId(userId);
    const user = await dbClient.User.findOne({ _id: userId });
    if (!user) throw new Error('Unauthorized');
    console.log(user);
    let { parentId, page } = req.query;
    if (!parentId) {
      parentId = '0';
    } else {
      parentId = new ObjectId(parentId);
    }
    if (!page) {
      page = 0;
    } else {
      page = parseInt(page, 10);
    }
    const limit = 20;
    const skip = page * limit;
    const files = await dbClient.File.find({ parentId }).skip(skip).limit(limit).toArray();
    res.status(200).json(files);
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }
};

exports.putPublish = async (req, res) => {
  try {
    let fileId = req.params.id;
    fileId = new ObjectId(fileId);
    const tokenKey = `auth_${req.headers['x-token']}`;
    let userId = await redisClient.get(tokenKey);
    userId = new ObjectId(userId);
    const user = await dbClient.User.findOne({ _id: userId });
    if (!user) throw new Error('Unauthorized');
    const file = await dbClient.File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({
        error: 'Not found',
      });
    }
    await dbClient.File.updateOne({ _id: fileId }, { $set: { isPublic: true } });
    return res.status(200).json({
      ...file,
      isPublic: true,
    });
  } catch (err) {
    return res.status(401).json({
      error: err.message,
    });
  }
};

exports.putUnpublish = async (req, res) => {
  try {
    let fileId = req.params.id;
    fileId = new ObjectId(fileId);
    const tokenKey = `auth_${req.headers['x-token']}`;
    let userId = await redisClient.get(tokenKey);
    userId = new ObjectId(userId);
    const user = await dbClient.User.findOne({ _id: userId });
    if (!user) throw new Error('Unauthorized');
    const file = await dbClient.File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({
        error: 'Not found',
      });
    }
    await dbClient.File.updateOne({ _id: fileId }, { $set: { isPublic: false } });
    return res.status(200).json({
      ...file,
      isPublic: false,
    });
  } catch (err) {
    return res.status(401).json({
      error: err.message,
    });
  }
};

exports.getFile = async (req, res) => {
  try {
    let fileId = req.params.id;
    fileId = new ObjectId(fileId);
    const tokenKey = `auth_${req.headers['x-token']}`;
    let userId = await redisClient.get(tokenKey);
    userId = new ObjectId(userId);
    const file = await dbClient.File.findOne({ _id: fileId});
    if (!file) {
      return res.status(404).json({
        error: 'Not found',
      });
    }
    if(!file.isPublic && file.userId.toString() !== userId.toString()){
      return res.status(404).json({
        error: 'Not found',
      });
    };
    if(file.type === 'folder'){
      return res.status(400).json({
        error: "A folder doesn't have content"
      });
    };
    let data;
    try{
      data = await fs.readFileSync(file.localPath, 'utf-8');
    }catch(err){
      return res.status(404).json({
        error: 'Not found',
      });
    };
    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    return res.status(200).send(data);
  } catch (err) {
    return res.status(401).json({
      error: err.message,
    });
  }
};

