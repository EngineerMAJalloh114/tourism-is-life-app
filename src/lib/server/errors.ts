/**
 * Errors that carry an HTTP status. The staff middleware turns `status` into
 * the server-function response status, so a signed-out caller gets 401 and a
 * caller without the capability gets 403 instead of a generic 500.
 *
 * Messages are shown to team members as they are, so they are written in plain
 * words and never include internal details.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

/** 401: no valid session (signed out, expired, revoked, or the account is disabled). */
export class AuthRequiredError extends HttpError {
  constructor(message = "Sign in to continue.") {
    super(401, "AUTH_REQUIRED", message);
    this.name = "AuthRequiredError";
  }
}

/** 403: signed in, but this account may not do this. */
export class ForbiddenError extends HttpError {
  constructor(message = "Your account does not have access to this.", code = "FORBIDDEN") {
    super(403, code, message);
    this.name = "ForbiddenError";
  }
}

/** 400: the request itself is not acceptable (beyond schema validation). */
export class InvalidRequestError extends HttpError {
  constructor(message: string, code = "INVALID_REQUEST") {
    super(400, code, message);
    this.name = "InvalidRequestError";
  }
}

/** 404: the record does not exist (or is not visible to this caller). */
export class NotFoundError extends HttpError {
  constructor(message = "That record does not exist.") {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

/** 409: the change conflicts with the current state (a rule or a newer save). */
export class ConflictError extends HttpError {
  constructor(message: string, code = "CONFLICT") {
    super(409, code, message);
    this.name = "ConflictError";
  }
}

/** 429: too many attempts in the current window. */
export class TooManyRequestsError extends HttpError {
  constructor(message = "Too many attempts. Wait 15 minutes, then try again.") {
    super(429, "TOO_MANY_REQUESTS", message);
    this.name = "TooManyRequestsError";
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
