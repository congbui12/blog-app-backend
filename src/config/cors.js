export const initializeCors = () => {
  return {
    origin: (origin, callback) => {
      if (!origin || origin === process.env.FRONTEND_BASE_URL) {
        callback(null, true);
      } else {
        callback(new Error('Access denied by CORS policy'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
};
