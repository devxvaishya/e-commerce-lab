// API Service Layer for GenZ Fits (VÉLORA Collection) E-Commerce Client
// All requests include credentials: 'include' for cross-origin session cookies.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch product list with optional filters and sorting
 * @param {Object} params
 * @param {string} [params.search]
 * @param {string} [params.category]
 * @param {string} [params.sortBy]
 */
export async function fetchProducts({ search = '', category = 'all', sortBy = 'newest' } = {}) {
  const queryParams = new URLSearchParams();

  if (search && search.trim()) {
    queryParams.set('search', search.trim());
  }

  if (category && category !== 'all') {
    queryParams.set('category', category);
  }

  if (sortBy && sortBy !== 'default') {
    queryParams.set('sortBy', sortBy);
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE}/products${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include'
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch products (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Fetch single product details by numeric ID
 * @param {number|string} id
 */
export async function fetchProductById(id) {
  const url = `${API_BASE}/products/${id}`;

  const response = await fetch(url, {
    credentials: 'include'
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch product #${id} (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Fetch backend and database health status
 */
export async function fetchHealth() {
  const url = `${API_BASE}/health`;

  const response = await fetch(url, {
    credentials: 'include'
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Health check failed (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Register a new user account
 * @param {Object} credentials
 * @param {string} credentials.name
 * @param {string} credentials.email
 * @param {string} credentials.password
 */
export async function registerUser({ name, email, password }) {
  const url = `${API_BASE}/auth/register`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Registration failed (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Log into an existing user account
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 */
export async function loginUser({ email, password }) {
  const url = `${API_BASE}/auth/login`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Login failed (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Log out and destroy current session
 */
export async function logoutUser() {
  const url = `${API_BASE}/auth/logout`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Logout failed (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Get current authenticated user session
 */
export async function fetchCurrentUser() {
  const url = `${API_BASE}/auth/me`;

  const response = await fetch(url, {
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch user session (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Fetch the logged-in user's cart
 */
export async function fetchCart() {
  const url = `${API_BASE}/cart`;

  const response = await fetch(url, {
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to fetch cart (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Add a product to the user's cart
 * @param {Object} item
 * @param {number} item.productId
 * @param {number} [item.quantity=1]
 * @param {string} [item.size='M']
 */
export async function addToCart({ productId, quantity = 1, size = 'M' }) {
  const url = `${API_BASE}/cart/items`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity, size })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to add product to cart (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Update quantity of a product in the cart
 * @param {Object} params
 * @param {number} params.productId
 * @param {number} params.quantity
 * @param {string} [params.size]
 */
export async function updateCartItemQuantity({ productId, quantity, size }) {
  const url = `${API_BASE}/cart/items/${productId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ quantity, size })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to update quantity (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Remove a product from the cart
 * @param {Object} params
 * @param {number} params.productId
 * @param {string} [params.size]
 */
export async function removeFromCart({ productId, size }) {
  const queryParam = size ? `?size=${encodeURIComponent(size)}` : '';
  const url = `${API_BASE}/cart/items/${productId}${queryParam}`;

  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to remove product from cart (HTTP ${response.status})`);
  }

  return data;
}

/**
 * Clear the entire cart
 */
export async function clearCart() {
  const url = `${API_BASE}/cart`;

  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Failed to clear cart (HTTP ${response.status})`);
  }

  return data;
}
