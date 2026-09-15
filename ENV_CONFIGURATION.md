VEditor - Environment Configuration Guide
This document explains how to configure VEditor's rendering system through environment variables.

Quick Start
Copy .env.example to .env
Configure the render mode based on your needs (see scenarios below)
Render Mode Architecture
VEditor supports 3 rendering modes:

┌─────────────────────────────────────────────────────────────────┐
│                        RENDER MODES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │     CSR     │    │     SSR     │    │     SSR-Local       │  │
│  │  (Browser)  │    │   (Cloud)   │    │  (Your Server)      │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
│         │                  │                      │              │
│         ▼                  ▼                      ▼              │
│   ┌──────────┐      ┌──────────────┐     ┌────────────────┐     │
│   │ Browser  │      │ DesignCombo  │     │ Your Server    │     │
│   │ WebCodecs│      │  Cloud API   │     │ (local/remote) │     │
│   └──────────┘      └──────────────┘     └────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
CSR (Client-Side Rendering)
Renders video directly in the browser using WebCodecs API
Requires: Modern browser (Chrome 94+, Edge 94+, Safari 16.4+)
Pros: Fast, free, works offline
Cons: Uses client CPU/memory, not all browsers supported
SSR (Server-Side via Cloud)
Uses DesignCombo's cloud rendering API
Requires: COMBO_SK API key
Pros: Works on any browser, reliable
Cons: Requires API key, usage limits apply
SSR-Local (Server-Side via Your Server)
Uses your own render server (veditor_render_server)
Requires: Running render server (local or remote)
Pros: Works on any browser, no external API needed
Cons: Need to host/maintain render server
Configuration Scenarios
Scenario 1: Local Development (Recommended)
Use SSR-Local with local render server:

RENDER_MODE=local
NEXT_PUBLIC_DEFAULT_RENDER_MODE=ssr-local
NEXT_PUBLIC_SSR_MODE=ssr-local
Also start the render server:

cd veditor_render_server
npm run dev
Scenario 2: Production on Vercel + Remote Render Server (Recommended)
Deploy main app on Vercel, render server on Hugging Face (or VPS):
- Default export mode is CSR (Client-Side Rendering in browser via WebCodecs) - zero server costs, instant, free.
- Toggle button allows switching to Remote Render Server (Hugging Face) when device is weak or WebCodecs is unsupported.

# Backend calls remote render server (Hugging Face / VPS)
RENDER_MODE=remote
RENDER_SERVER_URL=https://your-username-veditor-render-server.hf.space

# Frontend defaults to CSR, toggles to Remote Server
NEXT_PUBLIC_DEFAULT_RENDER_MODE=csr
NEXT_PUBLIC_SSR_MODE=ssr-local
Scenario 3: Browser-Only (No Server)
Use CSR for everything:

NEXT_PUBLIC_DEFAULT_RENDER_MODE=csr
Note: CSR only works on modern browsers with WebCodecs support.

Scenario 4: Production with DesignCombo Cloud
Use DesignCombo's managed API:

# Get API key from https://designcombo.dev
COMBO_SK=dc_live_your_api_key_here

# Use cloud API
NEXT_PUBLIC_DEFAULT_RENDER_MODE=ssr
NEXT_PUBLIC_SSR_MODE=ssr
Environment Variables Reference
Variable	Values	Description
RENDER_MODE	local, remote	Backend render service mode
RENDER_SERVER_URL	URL	Remote render server URL (when RENDER_MODE=remote)
NEXT_PUBLIC_DEFAULT_RENDER_MODE	csr, ssr, ssr-local	Default mode in export dialog
NEXT_PUBLIC_SSR_MODE	ssr, ssr-local	Which SSR mode when toggling from CSR
Troubleshooting
"SSR-Local switches to SSR Cloud when toggling"
Set NEXT_PUBLIC_SSR_MODE=ssr-local and restart dev server.

"Render progress stuck at 0%"
Rebuild the render server - progress updates were added recently.

"Blob URL cannot be downloaded"
For SSR-Local, local media files are now automatically uploaded before rendering.

Related Files
.env - Your local configuration
.env.example - Template with documentation
src/features/editor/store/use-download-state.ts - Render mode state
src/lib/render-service.ts - Backend render service
veditor_render_server/ - Standalone render server