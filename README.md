# mastodon-v4-hide-all-filters
Switch all filters from "warn" to "hide" for a single Mastodon user (client-side program) using the client API.

## Usage

`node mastodon-v4-hide-all-filters.js <string:domain without protocol> <string:token>`

The script will explain the actions it's about to take and ask you to confirm.

## API access

Create a new app via Preferences/Development, enable the scopes `read:accounts`, `read:filters`, and `write:filters`, and copy the access token. **Do not share that access token with anyone else!** Run the script as described above. You can (and should, if you don't plan to use it for anything  else) delete the API access in the preferences afterwards.

![Screenshot of the "Your applications development" section in the Mastodon settings, with the "new application" button highlighted.](https://github.com/mxamber/mastodon-v4-hide-all-filters/assets/13611718/6fe56ea7-8742-40f7-a139-45aad97c0c2a 'Screenshot of the "Your applications development" section in the Mastodon settings, with the "new application" button highlighted.')
*Create a new application in your Mastodon Preferences under "Development"*

![API scopes in the development section of the Mastodon settings. All API scopes are unchecked, except (highlighted in red) "read:accounts", "read:filters" and "write:filters".](https://github.com/mxamber/mastodon-v4-hide-all-filters/assets/13611718/e7737538-849a-4b90-9d0f-ed0c1cb5306a 'API scopes in the development section of the Mastodon settings. All API scopes are unchecked, except (highlighted in red) "read:accounts", "read:filters" and "write:filters".')
*Deselect the default scopes and select only the three scopes mentioned above*

![Screenshot of the Mastodon settings for creating new apps: the table with client key, client secret and access token is shown (all access data blacked out) and the access token is highlighted in red](https://github.com/mxamber/mastodon-v4-hide-all-filters/assets/13611718/9278e0b1-c1ca-4e53-8564-ac1bb996dc62 'Screenshot of the Mastodon settings for creating new apps: the table with client key, client secret and access token is shown (all access data blacked out) and the access token is highlighted in red')
*Copy the access token. Note: this token is regenerated every time you change scopes*

## Internals

The script uses the `read:accounts`, `read:filters` and `write:filters` to (in order) verify the provided access token works via `GET /api/v1/accounts/verify_credentials`, to request a list of all of the user's filters via `GET /api/v2/filters`, and updates all filters one after another via `PUT /api/v2/filters/:id`. Only these three scopes are required; the worst that can happen (**to my knowledge**) if anything goes wrong is failure to update filters.

I've tried to put in as many safeguards to prevent the script from failing without helpful error messages as I could; I can't guarantee I've thought of all contingencies. It should provide informative error messages (i.e. "account pending approval", "incorrect scopes", etc.).
