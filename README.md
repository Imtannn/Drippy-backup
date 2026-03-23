# Meteor Lume Template

A template for making Meteor apps with Lume

- native ES Modules on the client side
- user account login UI built in
- dark/light/auto color scheme modes, with auto mode controlled by the OS
- basic page stats tracking
- cross-origin authentication
- TypeScript source
- UI components written as Lume custom elements
  - with Solid signals for performance and clean code organization
  - with Solid templating

## After forking this

After forking this, ensure that `server/entry.ts` contains proper values for
`primaryTLD`, `remoteOrigins`, and `localhostOrigins` based on your app domain
name(s) and local dev ports.

# drippy-app

The Drippy app, v2.

# secret files

We have files that currently hold private keys, committed into the repo. This is
ok for now, as we're a tiny team. Less to manage for now, but we'll need
something more secure later so tha we don't share all keys with everyone in the
org.

- private/env.json
- scripts/.env
- scripts/google-service-account.json
