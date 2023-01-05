const HttpResponseStatus = {
  OK: 200,
  NO_CONTENT: 204,
  NOT_AUTHENTICATED: 401,
  NOT_AUTHORIZED: 403,
  MISSING_PARAMS: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  ENANCE_YOUR_CALM: 420,
  SERVER_ERROR: 500
};

const RedisDb = {
  TOKEN_SECRETS: 0,
  USER_TOKENS: 1,
  TOKEN_TO_MODIFY: 2,
  GUESTS_TOKENS: 3
};

const NotificationServices = {
  GOOGLE: "GOOGLE",
  APPLE: "APPLE"
};

export { HttpResponseStatus, RedisDb, NotificationServices };
