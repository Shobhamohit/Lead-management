/**
 * Validation middleware factory.
 *
 * Wraps a pure validator function `(body) => normalized` that either
 * returns the normalized payload or throws an ApiError. The normalized
 * result is attached to `req.validated` for the controller to use.
 *
 * Validators live alongside each module (e.g. auth.validation.js) and
 * may also be called directly inside controllers.
 */
const validate = (validator) => (req, res, next) => {
  try {
    req.validated = validator(req.body);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;
