import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle2, ShoppingBag, Sparkles, Plus, Minus } from 'lucide-react';

export default function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Extract available sizes from dimensions string if present, e.g. "Sizes: XS, S, M, L, XL"
  const availableSizes = React.useMemo(() => {
    if (!product?.dimensions) return ['S', 'M', 'L', 'XL'];
    const match = product.dimensions.match(/Sizes?:\s*([A-Za-z0-9,\s]+)/i);
    if (match && match[1]) {
      return match[1].split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    }
    return ['S', 'M', 'L', 'XL'];
  }, [product]);

  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSize(availableSizes.includes('M') ? 'M' : availableSizes[0]);
    }
    setQuantity(1);
    setAddedNotice(false);
  }, [product, availableSizes]);

  if (!product) return null;

  // Format price in Indian Rupee (INR)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(product.price);

  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock === 0;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product, selectedSize, quantity);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close fashion details modal"
        >
          <X size={18} />
        </button>

        {/* Gallery / Fashion Image Pane */}
        <div className="modal-gallery">
          <img
            src={product.image_url}
            alt={product.name}
            className="modal-main-img"
          />
        </div>

        {/* Product Details Content */}
        <div className="modal-content-pane">
          <div className="modal-category-eyebrow">
            <Sparkles size={14} />
            <span>GENZ FITS · VÉLORA / {product.category}</span>
          </div>

          <h2 id="modal-title" className="modal-product-title">
            {product.name}
          </h2>

          <div className="modal-rating-row">
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={15}
                  fill={i < Math.floor(product.rating || 5) ? '#c9931b' : 'none'}
                  stroke="#c9931b"
                />
              ))}
            </div>
            <span>
              <strong>{product.rating || 4.9}</strong> ({product.reviews_count || 50} verified editorial reviews)
            </span>
          </div>

          <div className="modal-price-tag">{formattedPrice}</div>

          <p className="modal-description-text">{product.description}</p>

          {/* Interactive Size Selection */}
          <div style={{ margin: '16px 0' }}>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Select Size & Silhouette
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {availableSizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  style={{
                    padding: '6px 14px',
                    border: selectedSize === size ? '1.5px solid var(--burgundy-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: selectedSize === size ? 'var(--burgundy-tint)' : 'var(--bg-card)',
                    color: selectedSize === size ? 'var(--burgundy-primary)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Quantity:
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{
                    padding: '6px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    color: quantity <= 1 ? 'var(--text-muted)' : 'var(--text-primary)'
                  }}
                >
                  <Minus size={13} />
                </button>
                <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{
                    padding: '6px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: quantity >= product.stock ? 'not-allowed' : 'pointer',
                    color: quantity >= product.stock ? 'var(--text-muted)' : 'var(--text-primary)'
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                ({product.stock} available in atelier)
              </span>
            </div>
          )}

          {/* Technical Specifications Table */}
          <table className="modal-specs-table">
            <tbody>
              <tr>
                <th>Availability</th>
                <td>
                  <span
                    className={`stock-status-pill ${
                      isOutOfStock
                        ? 'out-of-stock'
                        : isLowStock
                        ? 'low-stock'
                        : 'in-stock'
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    {isOutOfStock
                      ? 'Archived (Out of stock)'
                      : isLowStock
                      ? `Limited Run: Only ${product.stock} pieces left`
                      : `In Stock (${product.stock} pieces in atelier)`}
                  </span>
                </td>
              </tr>
              {product.material && (
                <tr>
                  <th>Fabrication</th>
                  <td>{product.material}</td>
                </tr>
              )}
              {product.dimensions && (
                <tr>
                  <th>Sizing & Cut</th>
                  <td>{product.dimensions}</td>
                </tr>
              )}
              {product.origin && (
                <tr>
                  <th>Atelier / Origin</th>
                  <td>{product.origin}</td>
                </tr>
              )}
              <tr>
                <th>Reference SKU</th>
                <td>GZF-{product.id.toString().padStart(4, '0')}</td>
              </tr>
            </tbody>
          </table>

          {/* Action button */}
          <div className="modal-actions-bar">
            <button
              className="btn-primary-action"
              disabled={isOutOfStock}
              onClick={handleAdd}
              style={{
                opacity: isOutOfStock ? 0.6 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                backgroundColor: addedNotice ? '#2e7d32' : 'var(--burgundy-primary)'
              }}
            >
              <ShoppingBag size={16} />
              <span>
                {isOutOfStock
                  ? 'Out of Stock'
                  : addedNotice
                  ? 'Piece Added to Wardrobe!'
                  : `Add to Wardrobe · Size ${selectedSize}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
