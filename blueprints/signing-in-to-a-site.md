# Blueprint: a site the person signs in to

Written from YouTube, Netflix and Google AI Studio, three sites made into apps that the person signs in to.

## Choose this when
The person wants a site they use with their account (mail, video, a bank, a shop) as an app in a zone, trimmed. This is a recipe (`skill/4x4-app/recipe.md`), not a page of ours.

## The shape
- **The sign-in stays the site's own.** It lives in the app's container on this computer and never in its folder: a recipe can be shared without it. Never script, fill or restyle a sign-in form.
- **Let its sign-in reach where it must.** A big maker's sign-in goes through other hosts (Google's through `accounts.google.com` and its country sites; YouTube's list has them). With `allow`, list them, or the sign-in page is refused. With no `allow`, the desk already lets the maker's own hosts in.
- **Several apps on one account** share one container, so signing in once covers them (YouTube and its companion page).
- **Trim after signing in:** the person signs in on the plain site first, then you hide what they don't want with `style`. A page that refuses to work when scripts are added (some banking sites) gets CSS only.
- **Protected video** (a streaming site) needs `"drm": true`.

## Watch for
- A sign-in that loops or shows a blank page: a host it needs is refused. Ask the person what the dot in the app's corner says was stopped, and allow that host.
- Never `deny` a sign-in host to stop tracking: deny the tracking addresses only.
