const mongoose = require("mongoose");

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  // Set DNS resolution to use system DNS which may work better
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
  };

  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGO_URI, options);
      console.log("MongoDB Connected");
      return;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries}/${maxRetries} failed:`, error.message);
      if (retries < maxRetries) {
        const delay = Math.min(5000 * retries, 15000);
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("All MongoDB connection attempts failed.");
        console.error("TIP: If on college/corporate network, try using mobile hotspot or VPN.");
        console.error("     MongoDB Atlas SRV DNS records may be blocked by your network.");
      }
    }
  }
};

module.exports = connectDB;