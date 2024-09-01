const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const {ObjectId} = require('mongodb');
const uuid = require('uuid');
const fs = require('fs');
const path = require('path');
exports.addFile = async(req, res)=>{
    try{
        const token = req.headers['x-token'];
        const tokenKey = `auth_${token}`;
        const str_id = await redisClient.get(tokenKey);
        const user_id = new ObjectId(str_id);
        const user = await dbClient.User.findOne({_id: user_id});
        if (!user){
            res.status(401).json({error: 'Unauthorized'});
        };
        let {name, type, parentId, isPublic, data} = req.body;
        if (!name) throw new Error('Missing name');
        if (!type || !['folder', 'file', 'image'].includes(type)) throw new Error('Missing type');
        if (!data && type !== 'folder') throw new Error('Missing data');
        if (!parentId){
            parentId = '0';
        }
        if (!isPublic){
            isPublic = false;
        }
        if(parentId && parentId !== "0"){
            parentId = new ObjectId(parentId);
            console.log(parentId);
            const parent = await dbClient.File.findOne({_id: parentId});
            if(!parent) throw new Error('Parent not found');
            if(parent.type !== 'folder') throw new Error('Parent is not a folder');
        }
        let newFile = {
            userId: user_id,
            name,
            type,
            parentId,
            isPublic,
        }
        if (type === 'folder'){
            const folder = await dbClient.File.insertOne(newFile);
            // newFile.id = folder.insertedId;
            newFile = {id: folder.insertedId, ...newFile};
            res.status(201).json(newFile);

        };
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const fileName = uuid.v4();
        const filePath = `${folderPath}/${fileName}`;
        newFile.localPath = filePath;
        const file = await dbClient.File.insertOne(newFile);
        newFile = {id: file.insertedId, ...newFile};
        if (!fs.existsSync(folderPath)){
            try{
                fs.mkdirSync(folderPath, {recursive: true});
            }catch(err){
                throw new Error('Cannot create folder path');
            }
        };
        const decodedData = Buffer.from(data, 'base64').toString('utf-8');
        try{
            await fs.writeFileSync(filePath, decodedData);
        }catch(err){
            throw new Error('Cannot write file');
        };
        res.status(201).json(newFile);

    }catch(err){
        res.status(400).json({
            error: err.message
        })
    }
}