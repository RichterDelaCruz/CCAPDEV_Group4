const {MongoClient} = require('mongodb')

let dbConnection
let uri = 'mongodb+srv://user:12345@cluster0.hdkzd0w.mongodb.net/?retryWrites=true&w=majority'

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(uri)
            .then((client) => {
                dbConnection = client.db()
                return cb()
            })
            .catch(err => {
                console.log(err)
                return cb(err)
            })
    },
    getDb: () => dbConnection
}