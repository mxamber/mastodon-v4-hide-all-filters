# mastodon-v4-hide-all-filters
Switch all filters from "warn" to "hide" for a single Mastodon user (client-side program) using the client API.

## Usage

`node mastodon-v4-hide-all-filters.js <string:domain without protocol> <string:token>`

## API access

Create a new app via Preferences/Development, enable the scopes `read:accounts`, `read:filters`, and `write:filters`, and copy the access token. **Do not share that access token with anyone else!** Run the script as described above. You can (and should, if you don't plan to use it for anything  else) delete the API access in the preferences afterwards.
