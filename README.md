# Fortify Landing (Static Site)

A lightweight, futuristic marketing page for **getfortify.ai**. Pure HTML/CSS/JS — no build step.

## Local preview
Open `index.html` in a browser or serve with any static server.

## Deploy to Porkbun Static Hosting
1) In Porkbun, purchase/enable **Static Hosting** for your domain.
2) Option A — **GitHub Connect** (recommended):
   - Create a public or private repo, e.g., `fortify-landing`.
   - Push these files to the repo root.
   - In Porkbun Static Hosting → **GitHub Connect**, choose the repo and branch (main).
   - Porkbun will auto-deploy on each push.
3) Option B — **Direct Upload**:
   - Zip the `fortify_landing` contents and upload via the Static Hosting file manager.
4) DNS: keep your root `ALIAS getfortify.ai → ss1-sixie.porkbun.com` (Porkbun default).
5) SSL is auto-issued by Porkbun for the root domain.

## Link API subdomain
- In Porkbun DNS, set: `CNAME api.getfortify.ai → fortify-api.onrender.com.`
- In Render, add custom domain `api.getfortify.ai` and click **Retry Verification**.

## Customize
- Edit colors and gradients in `css/styles.css`.
- Replace Formspree action URL in the waitlist form with your own endpoint.
- Update social links in the footer.
