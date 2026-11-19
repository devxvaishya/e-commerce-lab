# GenZ Fits (VÉLORA Collection) — Submission Screenshots & Verification Checklist

This folder contains verified visual artifacts for the lab assignment submission across Parts 1, 2, and 3:

## Part 1: Product Catalog & Luxury Storefront
1. **`01-product-listing.png`**: Full fashion catalogue storefront showing the editorial hero section (*"Discover Your Style"*), *"Explore Collection"* action, category filter pills, live search bar, and fashion product grid.
2. **`02-product-details.png`**: Interactive garment detail modal displaying high-resolution fashion photography, Indian Rupee (`₹`) pricing, interactive size selection pills, fabrication, sizing and cut, atelier origin, and collection SKU (`GZF-XXXX`).
3. **`03-search-and-filter.png`**: Live search and category filter in action (e.g. searching `"trench"`), showing active filter chip and result count.
4. **`04-empty-state.png`**: Editorial empty state displaying the minimalist silhouette icon, *"No Pieces Found"* messaging, and *"Clear Filters & View All"* action button.

## Part 2: Authentication, Authorization & Shopping Cart
5. **`05-user-registration-login.png`**: Authentication modal showcasing VÉLORA Atelier design with "Sign In" and "Register" tabs, input validation, and password visibility toggle.
6. **`06-shopping-cart-wardrobe.png`**: Curated Wardrobe shopping cart page displaying selected pieces, garment thumbnails, size indicators, real-time quantity controls (`-` / `+`), item subtotal, complimentary express shipping threshold (₹4,999), and verified grand total.

## Part 3: Monitoring & Observability Infrastructure
7. **`07-grafana-metrics-dashboard.png`**: Preconfigured Grafana dashboard (`http://localhost:3000`) populated with live telemetry from `npm run demo:traffic`:
   - Panel 1: Total HTTP request volume over time (req/s)
   - Panel 2: HTTP latency percentiles (p50 median & p95 tail latency)
   - Panel 3: HTTP error rate and failure spike monitoring
   - Panel 4: HTTP request counts grouped by endpoint and status code
   - Panel 5: Products added to carts over time
   - Panel 6: Shopping cart lifecycle operations (view, add, update, remove, clear)
8. **`08-prometheus-targets.png`**: Prometheus targets status page (`http://localhost:9090/targets`) displaying `genz-fits-backend` (`host.docker.internal:5000`) in active `UP` state with 5s scrape interval.
