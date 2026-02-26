# Specification

## Summary
**Goal:** Add loading skeleton screens across all major pages and configure the project for Vercel and GitHub deployment.

**Planned changes:**
- Add animated shimmer skeleton placeholders for Dashboard summary cards, HoursChart, and ActivityFeed while data loads
- Add skeleton table/grid rows on the Resources page during data fetching
- Add skeleton Kanban column cards on the Projects page during loading
- Add skeleton weekly view on the Timesheets page during loading
- Add a global loading spinner/progress bar for page-level navigation transitions
- All skeletons use a shimmer effect matching the dark slate/charcoal theme with no layout shift
- Add a `vercel.json` at the repository root with build command, output directory, and SPA rewrite rules (all paths → `/index.html`)
- Update Vite config to set `base: '/'` for correct asset resolution on Vercel
- Add a `README.md` at the repository root with local setup and Vercel deployment instructions
- Add a `.env.example` file documenting required environment variables

**User-visible outcome:** All major pages show smooth skeleton loading states during data fetches, and the project is fully configured for one-click deployment to Vercel or GitHub with clear setup documentation.
