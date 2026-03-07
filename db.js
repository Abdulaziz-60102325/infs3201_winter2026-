const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://qwwweeerrrt1212_db_user:01H6Lslrht3CcY0p@infs3201winter2026.v4ezdkt.mongodb.net/?appName=infs3201winter2026";
const client = new MongoClient(uri);

let database;

/**
 * Initialize and connect to MongoDB
 * @returns {Promise<object>} The database object
 */
async function connectDB() {
    if (!database) {
        await client.connect();
        database = client.db("infs3201_winter2026");
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
