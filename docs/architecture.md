# Architecture

## High-Level Model

The application uses a single codebase with a shared frontend and a Supabase backend.

## Deployment Model

- `https://enga.in` is the Super Admin portal
- `https://<subdomain>.enga.in` is the Village Council portal

The subdomain determines the tenant automatically.
Workers do not choose a Village Council manually.

## Application Shape

The app currently follows a static page structure with shared JavaScript modules.

Existing entry points include:

- `index.html`
- `login.html`
- `dashboard.html`
- `survey.html`
- `household.html`
- `admin.html`
- `register.html`
- `super-admin.html`

Shared logic lives in:

- `app.js`
- `core.js`
- `subdomain-context.js`

## Backend

Supabase is used for:

- authentication
- profiles
- tenant data
- properties
- families
- tax records
- worker assignments

## Roles

### Super Admin

Accessed from `enga.in`.

Responsibilities:

- create Village Councils
- manage tenants
- set property prefixes
- set property number digit length
- create admins
- view all Village Councils

### Admin

Accessed through a Village Council subdomain.

Responsibilities:

- manage surveys
- assign work
- approve records
- manage workers

### Worker

Accessed through a Village Council subdomain.

Main menu:

- Collect
- My Work
- Follow Up

## Data Model Direction

The core business objects are:

- properties
- owners
- units
- families
- persons
- property_photos
- tenants

The current code also indicates support for:

- worker module assignments
- property number ranges
- dashboard stats

