import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function CartPage({
  cart,
  loading,
  error,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onContinueShopping
}) {
  const items = cart?.items || [];
  const itemCount = cart?.itemCount || 0;
  const subtotal = Number(cart?.subtotal || 0);

  // Format currency in Indian Rupee
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const isFreeShipping = subtotal >= 4999;
  const shippingAmount = subtotal > 0 ? (isFreeShipping ? 0 : 250) : 0;
  const grandTotal = subtotal + shippingAmount;

  return (
    <div className="cart-page-container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', minHeight: '65vh' }}>
      {/* Editorial Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
        <div>
          <button
            onClick={onContinueShopping}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Collection</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--burgundy-primary)', fontSize: '11px', letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase' }}>
            <Sparkles size={13} />
            <span>GenZ Fits · Contemporary Wardrobe</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '4px' }}>
            Your Curated Pieces ({itemCount})
          </h1>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={13} />
            <span>Clear Wardrobe</span>
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', backgroundColor: 'var(--burgundy-tint)', border: '1px solid var(--burgundy-border)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', color: 'var(--burgundy-primary)' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div className="brand-mark" style={{ margin: '0 auto 16px auto', animation: 'pulse 1.5s infinite' }}>V</div>
          <p style={{ fontSize: '14px', letterSpacing: '0.06em' }}>Retrieving your wardrobe from atelier database...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '70px 20px', backgroundColor: 'var(--bg-card)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--taupe-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto', color: 'var(--text-muted)' }}>
            <ShoppingBag size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Your Wardrobe is Empty
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
            Explore the VÉLORA Autumn / Winter collection. Select tailored silhouettes, outerwear, and accessories to curate your wardrobe.
          </p>
          <button
            onClick={onContinueShopping}
            className="btn-primary-action"
            style={{ padding: '12px 28px', fontSize: '13px', margin: '0 auto' }}
          >
            <span>Explore Collection</span>
            <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Cart Grid Layout */}
      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '36px', alignItems: 'start' }}>
          {/* Items Table / List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item) => {
              const unitPrice = Number(item.price);
              const totalItemPrice = Number(item.itemTotal);

              return (
                <div
                  key={`${item.productId}-${item.size}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr auto',
                    gap: '20px',
                    padding: '20px',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    alignItems: 'center'
                  }}
                >
                  {/* Product Thumbnail */}
                  <div style={{ width: '100px', height: '120px', borderRadius: 'var(--radius-xs)', overflow: 'hidden', backgroundColor: 'var(--taupe-light)' }}>
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>

                  {/* Details */}
                  <div>
                    <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      {item.category}
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', marginBottom: '6px' }}>
                      {item.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <span style={{ padding: '2px 8px', backgroundColor: 'var(--taupe-light)', borderRadius: 'var(--radius-xs)', fontSize: '11px', fontWeight: 600 }}>
                        Size: {item.size}
                      </span>
                      <span>Unit Price: <strong>{formatINR(unitPrice)}</strong></span>
                      {item.stock <= 5 && (
                        <span style={{ color: 'var(--burgundy-primary)', fontSize: '11px', fontWeight: 600 }}>
                          Only {item.stock} left in atelier
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)' }}>
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.size)}
                          style={{
                            padding: '6px 10px',
                            background: 'none',
                            border: 'none',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            color: item.quantity <= 1 ? 'var(--text-muted)' : 'var(--text-primary)'
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= item.stock}
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.size)}
                          style={{
                            padding: '6px 10px',
                            background: 'none',
                            border: 'none',
                            cursor: item.quantity >= item.stock ? 'not-allowed' : 'pointer',
                            color: item.quantity >= item.stock ? 'var(--text-muted)' : 'var(--text-primary)'
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId, item.size)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtotal for Item */}
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Item Total
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatINR(totalItemPrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div
            style={{
              padding: '26px 24px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              position: 'sticky',
              top: '90px'
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 600, marginBottom: '18px', color: 'var(--text-primary)' }}>
              Summary & Investment
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '18px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal ({itemCount} pieces)</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Express Atelier Shipping</span>
                <span>{shippingAmount === 0 ? <strong style={{ color: '#2e7d32' }}>FREE</strong> : formatINR(shippingAmount)}</span>
              </div>
              {!isFreeShipping && (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Add {formatINR(4999 - subtotal)} more to qualify for complimentary express delivery.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '22px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Total (incl. GST)
              </span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, color: 'var(--burgundy-primary)' }}>
                {formatINR(grandTotal)}
              </span>
            </div>

            <button
              type="button"
              className="btn-primary-action"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '13.5px', letterSpacing: '0.06em' }}
              onClick={() => alert(`Order checkout flow is reserved for Part 3. Your current cart total is ${formatINR(grandTotal)}.`)}
            >
              <span>Proceed to Atelier Checkout</span>
              <ArrowRight size={15} />
            </button>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <ShieldCheck size={16} style={{ color: '#2e7d32', flexShrink: 0 }} />
              <span>Prices verified against PostgreSQL database. Real-time stock reservation active.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
