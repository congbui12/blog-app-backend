import mongoose from "mongoose";
import logger from "../lib/logger.js";

const mongoConnect = async (mongoUri) => {
    if (!mongoUri) {
        throw new Error("MongoDB URI environment variable not provided");
    }
    try {
        await mongoose.connect(mongoUri);
        logger.info("MongoDB connected");
    } catch (error) {
        throw error;
    }
}

export default mongoConnect;