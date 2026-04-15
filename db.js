const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://gpt521013_db_user:Hd5gMMr8Yy8w4tht@infs3201winter2026.mnlvpuw.mongodb.net/?appName=infs3201winter2026";
const client = new MongoClient(uri, {
    tlsAllowInvalidCertificates: true
});

let database;

/**
 * Initialize and connect to MongoDB
 * @returns {Promise<object>} The database object
 */
async function connectDB() {
    if (!database) {
        await client.connect();
        database = client.db("infs3201winter2026");
    }
    return database;
}

/**
 * Get the database instance
 * @returns {object} The database object
 */
function getDB() {
    return database;
}


module.exports = { connectDB, getDB };
