import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import SearchAndFilter from './components/SearchAndFilter';
import ProductGrid from './components/ProductGrid';
import ProductDetailModal from './components/ProductDetailModal';
import CartPage from './components/CartPage';
import AuthModal from './components/AuthModal';
import { LoadingSkeletonGrid, EmptyState, ErrorState } from './components/StatusStates';
import Footer from './components/Footer';
import {
  fetchProducts,
  fetchProductById,
  fetchHealth,
  fetchCurrentUser,
  logoutUser,
  fetchCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart
} from './services/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [health, setHealth] = useState(null);

  // Authentication & Cart State
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: '0.00', total: '0.00' });
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [activeView, setActiveView] = useState('catalog'); // 'catalog' or 'cart'
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [toastMessage, setToastMessage] = useState(null);

  // Show temporary toast feedback
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch health status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        const res = await fetchHealth();
        if (isMounted) setHealth(res);
      } catch (err) {
        if (isMounted) setHealth({ status: 'error', error: err.message });
      }
    }
    checkHealth();
    return () => { isMounted = false; };
  }, []);

  // Check authenticated user on mount
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetchCurrentUser();
      if (res.data?.authenticated && res.data?.user) {
        setUser(res.data.user);
        // Load cart for authenticated user
        loadCart();
      } else {
        setUser(null);
        setCart({ items: [], itemCount: 0, subtotal: '0.00', total: '0.00' });
      }
    } catch (err) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch user cart
  const loadCart = async () => {
    setCartLoading(true);
    setCartError(null);
    try {
      const res = await fetchCart();
      setCart(res.data || { items: [], itemCount: 0, subtotal: '0.00', total: '0.00' });
    } catch (err) {
      setCartError(err.message || 'Failed to retrieve shopping cart.');
    } finally {
      setCartLoading(false);
    }
  };

  // Fetch products when filters, category, or sorting changes
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchProducts({
        search: debouncedSearch,
        category,
        sortBy
      });
      setProducts(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve products from server.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory('all');
    setSortBy('newest');
    setActiveView('catalog');
  };

  // Open product details modal
  const handleSelectProduct = async (product) => {
    try {
      const detailRes = await fetchProductById(product.id);
      setSelectedProduct(detailRes.data || product);
    } catch (err) {
      setSelectedProduct(product);
    }
  };

  // Add product to cart handler
  const handleAddToCart = async (product, size = 'M', quantity = 1) => {
    if (!user) {
      showToast('Please sign in to curate pieces into your wardrobe.', 'warning');
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await addToCart({
        productId: product.id,
        quantity,
        size
      });
      setCart(res.data);
      showToast(`Added "${product.name}" (${size}) to your wardrobe!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add piece to wardrobe.', 'error');
    }
  };

  // Update item quantity in cart
  const handleUpdateQuantity = async (productId, newQuantity, size) => {
    try {
      const res = await updateCartItemQuantity({
        productId,
        quantity: newQuantity,
        size
      });
      setCart(res.data);
    } catch (err) {
      showToast(err.message || 'Failed to update quantity.', 'error');
    }
  };

  // Remove item from cart
  const handleRemoveItem = async (productId, size) => {
    try {
      const res = await removeFromCart({ productId, size });
      setCart(res.data);
      showToast('Piece removed from your wardrobe.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to remove piece.', 'error');
    }
  };

  // Clear cart
  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire wardrobe?')) return;
    try {
      const res = await clearCart();
      setCart(res.data);
      showToast('Your wardrobe has been cleared.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to clear wardrobe.', 'error');
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setCart({ items: [], itemCount: 0, subtotal: '0.00', total: '0.00' });
      setActiveView('catalog');
      showToast('You have been logged out.', 'info');
    } catch (err) {
      showToast(err.message || 'Logout failed.', 'error');
    }
  };

  // Authentication success handler
  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    loadCart();
    showToast(`Welcome to VÉLORA, ${authenticatedUser.name.split(' ')[0]}!`, 'success');
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            backgroundColor: toastMessage.type === 'error' ? 'var(--burgundy-primary)' : '#111111',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideUp 0.3s ease'
          }}
        >
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header and Brand Bar */}
      <Navbar
        health={health}
        user={user}
        cartItemCount={cart?.itemCount || 0}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onToggleCart={() => setActiveView(v => v === 'cart' ? 'catalog' : 'cart')}
        activeView={activeView}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content View Switcher */}
      {activeView === 'cart' ? (
        <main className="main-content">
          <CartPage
            cart={cart}
            loading={cartLoading}
            error={cartError}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onContinueShopping={() => setActiveView('catalog')}
          />
        </main>
      ) : (
        <>
          {/* Editorial Hero Banner */}
          <HeroBanner totalProducts={products.length || 12} />

          {/* Main Catalogue Section */}
          <main className="main-content" id="catalogue-section">
            {/* Search, Filter, Sort Controls */}
            <SearchAndFilter
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              totalResults={products.length}
              onReset={handleResetFilters}
            />

            {/* Error State Banner */}
            {error && (
              <ErrorState error={error} onRetry={loadProducts} />
            )}

            {/* Loading State Skeleton */}
            {loading && <LoadingSkeletonGrid count={6} />}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <EmptyState
                search={debouncedSearch}
                category={category}
                onReset={handleResetFilters}
              />
            )}

            {/* Product Catalog Grid */}
            {!loading && !error && products.length > 0 && (
              <ProductGrid
                products={products}
                onSelectProduct={handleSelectProduct}
                onAddToCart={handleAddToCart}
              />
            )}
          </main>
        </>
      )}

      {/* Product Details Modal View */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Authentication Modal View */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
