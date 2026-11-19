// Request validation middleware for e-commerce API

// Validate product ID parameter
function validateProductId(req, res, next) {
  const { id } = req.params;

  // Must be an integer greater than 0
  const parsedId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product ID. The ID must be a positive integer.'
    });
  }

  req.validatedId = parsedId;
  next();
}

// Validate query parameters for product listing
function validateProductQueryParams(req, res, next) {
  const { search, category, sortBy } = req.query;

  if (search && typeof search === 'string' && search.length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Search query is too long. Maximum allowed length is 100 characters.'
    });
  }

  if (category && typeof category === 'string' && category.length > 80) {
    return res.status(400).json({
      success: false,
      error: 'Category filter is too long. Maximum allowed length is 80 characters.'
    });
  }

  const allowedSortOptions = ['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest', 'rating'];
  if (sortBy && !allowedSortOptions.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      error: `Invalid sortBy parameter. Allowed options: ${allowedSortOptions.join(', ')}`
    });
  }

  next();
}

// Helper to validate email format
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 180;
}

// Validate user registration payload
function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return res.status(400).json({
      success: false,
      error: 'Name is required and must be between 2 and 100 characters.'
    });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'A valid email address is required.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({
      success: false,
      error: 'Password is required and must be between 6 and 128 characters.'
    });
  }

  req.validatedRegister = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password
  };

  next();
}

// Validate user login payload
function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'A valid email address is required.'
    });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Password is required.'
    });
  }

  req.validatedLogin = {
    email: email.trim().toLowerCase(),
    password
  };

  next();
}

module.exports = {
  validateProductId,
  validateProductQueryParams,
  validateRegister,
  validateLogin
};
