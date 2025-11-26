import session from "express-session";
import MongoStore from "connect-mongo";

const initializeSession = (mongoUri, sessionSecret) => {
    if (!mongoUri) {
        throw new Error("MongoDB URI environment variable not provided");
    }

    if (!sessionSecret) {
        throw new Error("Session secret environment variable not provided");
    }

    return session({
        // name: "my-session-cookie",  // Set the cookie name
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: mongoUri,
            ttl: 30 * 60,
            autoRemove: "native",   // Automatically remove expired sessions via TTL index
            crypto: {
                secret: sessionSecret,
            }
        }),
        rolling: true,
        cookie: {
            maxAge: 30 * 60 * 1000,
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        }
    });
}

export default initializeSession;
