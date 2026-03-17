# Stock Domain Overview

## Purpose

The `Stock` area is a dedicated workspace for investment tracking and idea discovery.

At this stage it is intentionally frontend-first:

- route structure is defined
- page ownership is defined
- UI placeholders exist
- backend integrations are not defined yet

The goal is to keep the information architecture stable before adding portfolio data, watchlist logic, rankings, research modules, or admin tooling.

## Workspace Structure

Current stock routes live under `/stock` and are split into five user-facing sections:

1. `Overview`
2. `Portfolio`
3. `Watchlists`
4. `Opportunities`
5. `Research`

These sections are available both:

- in the sidebar as stock sub-navigation
- inside the stock workspace as segmented page navigation

## Domain Model At A High Level

The stock domain should be understood through four core concepts:

- `Portfolio`
  - products the user already owns
  - positions, allocation, cost basis, performance

- `Watchlists`
  - products the user wants to monitor
  - grouped lists, tags, notes, priority, status

- `Opportunities`
  - ranked outputs generated from backend analysis
  - strongest setups, best performers, best candidates, alert-driven picks

- `Research`
  - drilldown area for understanding a single product or comparing products
  - technical, fundamental, news, sentiment, ML, and future analysis modules belong here

`Overview` is not a separate data domain. It is a summary layer that combines signals from the other sections.

## Page Responsibilities

### Overview

`Overview` is the landing page for the stock workspace.

It should answer:

- what changed recently
- what matters right now
- what needs attention

Expected future content:

- portfolio summary cards
- watchlist activity summary
- top opportunities snapshot
- strongest movers
- active alerts or signals

### Portfolio

`Portfolio` is the ownership workspace.

It should answer:

- what do I currently hold
- how is the portfolio performing
- where is my exposure

Expected future content:

- holdings table
- total portfolio value
- allocation by type, sector, region, or strategy
- return and drawdown views
- individual position drilldown entry points

### Watchlists

`Watchlists` is the tracking workspace.

It should answer:

- what am I monitoring
- how are products grouped
- what should stay active or inactive

Expected future content:

- editable watchlists
- product grouping
- notes and tags
- priority state
- entry criteria or thesis notes

### Opportunities

`Opportunities` is the ranking and idea-selection workspace.

It should answer:

- what looks strongest right now
- what improved recently
- what is worth reviewing next

Expected future content:

- ranked watchlist products
- best performing products
- strongest technical setups
- backend-scored candidates
- explainable ranking summaries

This page should feel like a decision board, not a CRUD screen.

### Research

`Research` is the analysis and drilldown workspace.

It should answer:

- why is this product interesting
- what evidence supports or weakens the thesis

Expected future content:

- single-product detail
- multi-product comparison
- technical analysis
- fundamentals
- news and sentiment
- experimental or ML-backed analysis

This page should be the deepest page, not the first page.

## Navigation Logic

The intended user flow is:

1. land in `Overview`
2. inspect owned positions in `Portfolio`
3. maintain monitored products in `Watchlists`
4. review ranked candidates in `Opportunities`
5. drill deeper in `Research`

This keeps the UI organized around user goals instead of around analysis techniques.

## What Does Not Belong As A Top-Level Section

The following should not become first-level stock navigation items:

- technical analysis
- fundamentals
- sentiment
- ML analysis
- news analysis

These are analysis lenses, not workflow destinations.

They belong inside `Research`, and some of their outputs may also feed `Opportunities` or `Overview`.

## Admin Separation

Administrative and system-level tooling should stay outside the main stock workspace navigation.

Examples:

- ingestion controls
- sync jobs
- provider diagnostics
- scoring configuration
- model configuration
- cache management

Those concerns should later live behind a separate admin-oriented sidebar or admin section.

## Current Frontend Scope

The current implementation intentionally stops at:

- route scaffolding
- placeholder views
- sidebar sub-navigation
- in-page segmented navigation

This gives the stock domain a stable frontend shell without prematurely committing to backend contracts.
