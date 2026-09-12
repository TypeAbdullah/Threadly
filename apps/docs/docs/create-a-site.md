# Create a Site

Every external website integrating Threadly is registered as a **Site**.

## Configuration

To create a site, head to the Client dashboard and specify:
1. **Name**: Human-readable label (e.g. `Mist Scans`).
2. **Site ID**: Unique public slug (e.g. `mist-scans`).
3. **Allowed Origins**: Strict list of origins allowed to embed the widget and call APIs (e.g. `https://mistscans.com`, `http://localhost:5175`).

## API Keys

Upon site registration, Threadly generates:
- **Public Key (`pk_...`)**: Publicly safe site identifier used in browser scripts.
- **Private Secret Key (`sk_...`)**: High-privilege server key used for backend-to-backend integrations.
