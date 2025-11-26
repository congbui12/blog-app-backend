import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import passport from "passport";
import cors from "cors";
import initializeCors from "./config/corsConfig.js";
import mongoConnect from "./config/mongoConnect.js";
import passportConfig from "./config/passportConfig.js";
import initializeSession from "./config/sessionConfig.js";
import errorHandler from "./middleware/errorHandler.js";
import router from "./route/index.js";
import logger from "./lib/logger.js";

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const app = express();
dotenv.config();

app.use(helmet());

await mongoConnect(process.env.MONGODB_URI);

app.use(cors(initializeCors(process.env.CLIENT_URLS)));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

passportConfig();   // before passport.initialize()
app.use(initializeSession(process.env.MONGODB_URI, process.env.SESSION_SECRET)); // before passport.session()

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", router);

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});