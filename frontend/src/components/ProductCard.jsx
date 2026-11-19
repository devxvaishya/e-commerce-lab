import React from 'react';
import { ArrowUpRight, Star, ShoppingBag } from 'lucide-react';

export default function ProductCard({ product, onSelect, onAddToCart }) {
  // Format price in Indian Rupee (INR)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(product.price);

  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock === 0;

  return (
    <article
      className="product-card"
      onClick={() => onSelect(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(product);
        }
      }}
      aria-label={`Inspect ${product.name}`}
    >
      <div className="card-image-container">
        <img
          src={product.image_url}
          alt={product.name}
          className="card-product-img"
          loading="lazy"
        />
        <span className="card-category-badge">{product.category}</span>
        <span className="card-stock-pill">
          {isOutOfStock
            ? 'Archive Only'
            : isLowStock
            ? `Limited: ${product.stock} pieces`
            : `${product.stock} available`}
        </span>
      </div>

      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
          <Star size={13} fill="#c9931b" stroke="#c9931b" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {product.rating || '4.9'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({product.reviews_count || 48} reviews)
          </span>
        </div>

        <h3 className="card-title">{product.name}</h3>
        <p className="card-description">{product.description}</p>

        <div className="card-meta-row">
          <div className="card-price-block">
            <span className="card-price-label">Price</span>
            <span className="card-price-value">{formattedPrice}</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              className="card-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              aria-label={`View silhouette of ${product.name}`}
            >
              <span>View</span>
              <ArrowUpRight size={13} />
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToCart) onAddToCart(product);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                backgroundColor: isOutOfStock ? 'var(--taupe-light)' : 'var(--burgundy-primary)',
                color: isOutOfStock ? 'var(--text-muted)' : '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={isOutOfStock ? 'Out of stock' : 'Add to Wardrobe'}
              aria-label={`Add ${product.name} to Wardrobe`}
            >
              <ShoppingBag size={12} />
              <span>{isOutOfStock ? 'Sold' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
