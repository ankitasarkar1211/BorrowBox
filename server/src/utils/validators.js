const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the register request body.
 * Returns an array of human-readable error strings (empty if valid).
 */
const validateRegisterInput = ({ name, email, password, communityId }) => {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password is required and must be at least 8 characters long.');
  }

  if (!communityId || typeof communityId !== 'string' || communityId.trim().length < 1) {
    errors.push('communityId is required.');
  }

  return errors;
};

/**
 * Validates the login request body.
 */
const validateLoginInput = ({ email, password }) => {
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email is required.');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  }

  return errors;
};

module.exports = { validateRegisterInput, validateLoginInput };
