const redis = require('redis');
const { promisify } = require('util');

const RedisClient = class {
    constructor(){
        this.client = redis.createClient();
        this.client.on('connect', ()=>{
            console.log('Redis client connected to the server');
        });
        this.client.on('error', (err)=>{
            console.log(`Redis client not connected to the server: ${err}`);
        });
        this.getAsync = promisify(this.client.get).bind(this.client);
    }
    isAlive(){
        return this.client.connected;
    }
    async get(key){
        try{
            const value = await this.getAsync(key);
            return value;
        }catch(err){
            console.log('errrrrrrrrrrrrrr get');
            return(err);
        }
    }
    async set(key, value, duration){
        try{
            await this.client.setex(key, duration, value);
        }catch(err){
            console.log('errrrrrrrrrrrrrr set');
            return(err);
        }
    }
}

const redisClient = new RedisClient();
module.exports = redisClient;
