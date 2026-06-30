# Project Memory

This document captures the current design decisions for `enga.in`.

## Decision Summary

- This is a production system, not a demo.
- The MVP focuses only on Property Survey and Household Register.
- The existing layout should be preserved.
- Workflow improvements are preferred over visual redesign.
- One codebase should serve both the super admin portal and tenant portals.
- The subdomain determines the tenant.
- Workers never choose a Village Council manually.
- Continue using the existing Supabase tables unless a schema change is truly necessary.

## Property Survey Rules

- The worker enters only the physical property number.
- The system formats the displayed property ID using the configured prefix and digit length.
- Property IDs are not generated from scratch by the app.
- Duplicate validation is required.
- Range validation is required.
- A property cannot be saved without:
  - property number
  - GPS
  - front photo

## Household Register Rules

- One residential unit equals one household.
- Multiple households in one residential unit are not allowed.
- If there are two families, they must be represented as two residential units.
- Person 1 exists by default as Self / Head and is locked.
- Age is stored instead of date of birth.
- Temporary Resident is not part of the Version 1 UI.

## UI Rules

- Keep the blue header.
- Keep the large buttons.
- Keep the three tabs.
- Keep the single long scrolling form.
- Improve workflow only.

## Development Order

Build features in this order:

1. Application shell
2. Property Survey
3. Household Register
4. Tax Assessment
5. Tax Collection
6. Reports
7. Super Admin

## Working Principle

Every change should help field workers move faster, type less, and preserve evidence more reliably.

