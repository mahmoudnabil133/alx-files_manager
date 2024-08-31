const dbClient =  require('../utils/db')

const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            await setTimeout(() => {
                i += 1;
                if (i >= 10) {
                    reject()
                }
                else if(!dbClient.isAlive()) {
                    repeatFct()
                }
                else {
                    resolve()
                }
            }, 1000);
        };
        repeatFct();
    })
};

(async () => {
    console.log(dbClient.isAlive());
    await waitConnection();
    console.log(dbClient.isAlive());
    // handle id
    const { ObjectId } = require('mongodb');
    const id = '66d1ebcaab962424c4707562'


    console.log(await dbClient.User.find({_id: new ObjectId(id)}).toArray());
    console.log(await dbClient.nbUsers());
    console.log(await dbClient.nbFiles());
})();
