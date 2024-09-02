const { MongoClient } = require('mongodb');
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || '27017';
const dbName = process.env.DB_DATABASE || 'files_manager'
const url = `mongodb://${host}:${port}`;


class DBClient {
    constructor() {
        this.client = null;
        this.db = null;
        this.User = null;
        this.File = null;
        this.connect();
    }
    async connect() {
        try{
            const client = new MongoClient(url);
            this.client = await client.connect();
            console.log('Connected to DB mongodb');
            this.db = this.client.db(dbName);
            this.User = this.db.collection('users');
            this.File = this.db.collection('files');
        } catch (error) {
            console.log(`errrr`, error.message);
        }
    }
    isAlive(){
        if (this.db) return true;
        return false;
    }
    async nbUsers(){
        if (!this.User) return 0;
        const nbUsers = await this.User.countDocuments();
        return nbUsers;
    }
    async nbFiles(){
        if(!this.File) return 0;
        const nbFiles = await this.File.countDocuments();
        return nbFiles;
    }

}

const dbClient = new DBClient();
module.exports = dbClient;