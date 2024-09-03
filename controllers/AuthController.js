const uuid = require('uuid');
const { ObjectId } = require('mongodb');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

exports.getConnect = async (req, res) => {
  try {
    const basicAuth = req.headers.authorization.split(' ')[1];
    const decodedCredentials = Buffer.from(basicAuth, 'base64').toString('utf-8');
    const [email, password] = decodedCredentials.split(':');
    const hashedPassword = sha1(password);
    const user = await dbClient.User.findOne({ email, password: hashedPassword });
    if (!user) throw new Error('Unauthorized');
    const token = uuid.v4();
    const tokenKey = `auth_${token}`;
    redisClient.set(tokenKey, user._id.toString(), 86400);
    res.status(200).json({ token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.gitDisconnect = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    if (!token) throw new Error('Unauthorized');
    const tokenKey = `auth_${token}`;
    redisClient.del(tokenKey);
    res.status(204).end();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const token = req.headers['x-token'];
    const tokenKey = `auth_${token}`;
    const strId = await redisClient.get(tokenKey);
    const userId = new ObjectId(strId);
    const user = await dbClient.User.findOne({ _id: userId });
    if (!user) throw new Error('Unauthorized');
    res.status(200).json({
      email: user.email,
      id: user._id,
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

exports.getEncodedCredentials = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) throw new Error('Missing email');
    if (!password) throw new Error('Missing password');
    const encodedCredentials = Buffer.from(`${email}:${password}`).toString('base64');
    res.status(200).json({
      encodedCredentials,
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
