# recipes

Recipes, and nothing else. Two words, one meaning each:

- **Recipe:** our changes to someone else's site. Data the desk runs.
- **Blueprint:** how to build something of our own. A page an agent reads before it builds.

The test: does the desk run it, or does an agent read it?

The desk runs everything here. So this folder holds one folder per site, `<id>/`, with `recipe.json` and the `style/` and `script/` it names, `AGENTS.md` on why, and `README.md` with notes. Not here: a page on how to build something (that is a blueprint, [`blueprints/`](../blueprints/README.md)), an app of our own (`apps/`), or a tool. Two of ours sit beside a recipe for now, never laid on a person's computer: `tools/`, which read a site for us, and `drive.json`, which drives a site's controls.

A recipe turns a website into a sanitized app on the desk: which hosts its pages may reach, what they may not send, and how they look. Each folder here is one site's recipe, in the shape [`contracts/recipe`](../contracts/recipe/README.md) sets, and anyone may send one.

Every site on the desk is fenced, with or without a recipe: it reaches only its own domain and its maker's, and nothing else of the internet. That fence alone breaks some sites, because their own pictures or code sit on another domain. A recipe fixes that, and goes further: ads, trackers and clutter gone, a dark look, controls of our own.

[`CONTRIBUTING.md`](../CONTRIBUTING.md) › Trim a site says how to make one and send it.

## What's here

- [`kijiji/`](kijiji/): Kijiji, the Canadian classifieds. Its listings come from `*.classifiedscloud.io`, which the plain fence refuses; the recipe allows it, refuses its ads and beacons, and makes it dark when the desk is dark.
- [`netflix/`](netflix/): Netflix. Its pictures, fonts and logo come from its own other domains; the recipe allows them, lets it play protected video, and refuses its logging and the advertisers' trackers.
- [`aistudio/`](aistudio/): Google AI Studio's speech page, slimmed for a zone. Its rules matter once the person is signed in; signed out it is the same as the plain fence.

## The sites people pick

These are the sites the desk offers when a person adds an app to a zone. Each says how far it has got:

- **trimmed**: a recipe makes it whole and clean;
- **plain, works**: seen working with no recipe, only the fence (a recipe would still slim it);
- **plain, breaks**: seen broken with no recipe; a recipe is needed;
- **not checked**: nobody has looked at it fenced yet. Open it and tell us ("A site that breaks"), or trim it;
- **an app to install**: a link to an app for the computer, not a site in a zone; nothing to trim.

A pull request that adds or changes a recipe changes its site's line here too. A site that isn't listed is welcome: its id is the one the desk gives it (below).

| Site | id | Address | Where it stands |
|---|---|---|---|
| Bing | `bing` | www.bing.com | not checked |
| Brave Search | `brave-search` | search.brave.com | not checked |
| DuckDuckGo | `duckduckgo` | duckduckgo.com | not checked |
| Google Search | `google-search` | www.google.com | not checked |
| SearXNG | `searxng` | docs.searxng.org | not checked |
| Startpage | `startpage` | www.startpage.com | not checked |
| Gmail | `gmail` | mail.google.com | not checked |
| Internet Archive | `internet-archive` | archive.org | not checked |
| YouTube | `youtube` | www.youtube.com | trimmed by 4x4; its recipe isn't public yet |
| YouTube panel | `youtube-panel` | www.youtube.com | trimmed by 4x4, with YouTube |
| Current events | `current-events` | en.wikipedia.org | not checked |
| Project Gutenberg | `gutenberg` | www.gutenberg.org | not checked |
| NPR, text only | `npr-text` | text.npr.org | not checked |
| Radio Browser | `radio-browser` | www.radio-browser.info | not checked |
| Radio Garden | `radio-garden` | radio.garden | not checked |
| Wikipedia | `wikipedia` | www.wikipedia.org | plain, works |
| Desmos | `desmos` | www.desmos.com | not checked |
| Wiktionary | `wiktionary` | www.wiktionary.org | not checked |
| Google Maps | `google-maps` | www.google.com | not checked |
| OpenTopoMap | `opentopomap` | opentopomap.org | not checked |
| OsmAnd Web | `osmand-web` | osmand.net | not checked |
| Apple Maps | `apple-maps` | maps.apple.com | not checked |
| Bing Maps | `bing-maps` | www.bing.com | not checked |
| BRouter | `brouter` | brouter.de | not checked |
| CoMaps | `comaps` | flathub.org | an app to install |
| GNOME Maps | `gnome-maps` | flathub.org | an app to install |
| God's Eye View | `gods-eye-view` | github.com | an app to install |
| GraphHopper Maps | `graphhopper` | graphhopper.com | not checked |
| HERE WeGo | `here-wego` | wego.here.com | not checked |
| Mapy.com | `mapy` | mapy.com | not checked |
| Marble | `marble` | flathub.org | an app to install |
| OpenStreetMap embed | `osm-embed` | www.openstreetmap.org | not checked |
| Organic Maps | `organic-maps` | flathub.org | an app to install |
| OSRM | `osrm` | map.project-osrm.org | not checked |
| QGIS | `qgis` | flathub.org | an app to install |
| uMap | `umap` | umap.openstreetmap.fr | not checked |
| Waymarked Trails | `waymarked-trails` | hiking.waymarkedtrails.org | not checked |
| Ventusky | `ventusky` | www.ventusky.com | not checked |
| Windy | `windy` | www.windy.com | plain, works |
| Excalidraw | `excalidraw` | excalidraw.com | not checked |
| Google Docs | `google-docs` | docs.google.com | not checked |
| PDF viewer | `pdfjs` | mozilla.github.io | not checked |
| CryptPad | `cryptpad` | cryptpad.fr | not checked |
| StackEdit | `stackedit` | stackedit.io | not checked |
| Squoosh | `squoosh` | squoosh.app | not checked |
| Photopea | `photopea` | www.photopea.com | not checked |
| Google Drive | `google-drive` | drive.google.com | not checked |
| Google Calendar | `google-calendar` | calendar.google.com | not checked |
| Google Translate | `google-translate` | translate.google.com | not checked |
| LibreTranslate | `libretranslate` | libretranslate.com | not checked |
| VoiceInk | `voiceink` | tryvoiceink.com | an app to install |
| Voxtype | `voxtype` | voxtype.io | an app to install |
| Apple Dictation | `apple-dictation` | support.apple.com | an app to install |
| Gemini app for Mac (Speak to Window) | `gemini-mac` | support.google.com | an app to install |
| Handy | `handy` | handy.computer | an app to install |
| Hex | `hex` | anoma.ly | an app to install |
| Spokenly | `spokenly` | spokenly.app | an app to install |
| Superwhisper | `superwhisper` | superwhisper.com | an app to install |
| Wispr Flow | `wispr-flow` | wisprflow.ai | an app to install |
| Google AI Studio | `aistudio` | aistudio.google.com | trimmed: [`aistudio/`](aistudio/) |
| LibreSpeed | `librespeed` | librespeed.org | not checked |
| JupyterLite | `jupyterlite` | jupyterlite.github.io | not checked |
| CyberChef | `cyberchef` | gchq.github.io | not checked |

Two more, not in the picker: Kijiji (`kijiji`, www.kijiji.ca) and Netflix (`netflix`, www.netflix.com) are **plain, breaks** and **trimmed** by the recipes above.

What was seen, and how: each site opened in 4x4 AWD Desk in its own container, signed out, once with no recipe and once with its recipe, counting the requests let through and refused, and looking at the page. A line moves when someone has looked; say in the pull request what you saw.

## Where a recipe comes from

The same folder, `<id>/` with its `recipe.json`, lives at three levels, and the person chooses which they take:

1. **Here, in public**: reviewed, and shipped with the desk to everyone.
2. **A network's own**: a group of people sharing a private set of recipes among their own computers. Not built yet.
3. **The person's own**: in their desk's folder, `<data>/4x4/tpa/<id>/`, written by them or their agent. This is the copy the desk runs: a recipe from the other levels is laid into it, and a file the person changed stays theirs through every update.

[`contracts/recipe`](../contracts/recipe/README.md) › Where a recipe comes from says the same as a promise.
