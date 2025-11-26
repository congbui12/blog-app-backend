const initializeCors = (clientUrls) => {
    if (!clientUrls) {
        throw new Error("CLIENT_URLS environment variable not provided");
    }

    let allowedOrigins = JSON.parse(clientUrls);

    if (!Array.isArray(allowedOrigins)) {
        throw new Error("CLIENT_URLS must be a valid JSON array string");
    }

    return {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    }
}

export default initializeCors;


