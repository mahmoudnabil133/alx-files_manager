const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

exports.status = async (req, res)=>{
    try{
        res.status(200).json({
            redis: redisClient.isAlive(),
            db: dbClient.isAlive()
        });

    }catch(err){
        res.status(500).json({msg: 'Internal server error'});
    }
};

exports.stats = async (req, res)=>{
    try{
        const nbUsers = await dbClient.nbUsers();
        const nbFiles = await dbClient.nbFiles();
        res.status(200).json({
            users: nbUsers,
            files: nbFiles
        });
    }catch(err){
        res.status(500).json({msg: 'Internal server error'});
    }
}