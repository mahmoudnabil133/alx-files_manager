const sha1 = require('sha1');
const dbClient = require('../utils/db');

exports.postNew = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) throw new Error('Missing email');
    if (!password) throw new Error('Missing password');
    console.log(email);
    const user = await dbClient.User.findOne({ email });
    console.log(user);
    if (user) throw new Error('Already exist');
    const hahsedPassword = sha1(password);
    const newUser = await dbClient.User.insertOne({ email, password: hahsedPassword });
    res.status(201).json({
      id: newUser.insertedId,
      email,
    });
    console.log(newUser);
  } catch (err) {
    res.status(400).json({
      error: err.message || err,
    });
  }
};
