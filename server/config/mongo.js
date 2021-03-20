const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

/**
 * init database connection
 * to be called once when starting app
 * and use connection for all transactions
 * @returns {Promise<void>}
 */
const mongoConnect = async () => {
  await mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

module.exports = mongoConnect;
