# blueprints

Blueprints, and nothing else. Two words, one meaning each:

- **Recipe:** our changes to someone else's site. Data the desk runs.
- **Blueprint:** how to build something of our own. A page an agent reads before it builds.

The test: does the desk run it, or does an agent read it?

An agent reads everything here. A blueprint is our written opinion on the easy way to do a common job inside 4x4: one page per job. Not here: anything the desk runs. Our changes to a site are a recipe ([`recipes/`](../recipes/README.md)); code we ship is in [`apps/parts`](../apps/parts/README.md), and appears there only when several apps need the same thing.

The desk lays these pages with the parts, at `apps/parts/blueprints/` on the person's computer, beside the skill an agent is handed.

Each page says: when to choose this, the recommended shape, the parts and contracts it touches, where the data sits, how it is kept and moved, what to watch for, and the alternatives with when each is the better pick.

## What's here
- `data-on-this-computer.md`: what an app keeps, on the person's computer, with `data()`. Written from Lists.
- `a-shared-thing.md`: one thing on several computers and between people, with `shared()`. Written from the shared list.
- `files.md`: a picture or a file in an app, kept by its hash and fetched by the others. Written from Text chat.
- `signing-in-to-a-site.md`: a site the person signs in to, made into an app with a recipe. Written from YouTube, Netflix and AI Studio.

## Ideas
- Why blueprints, and what would change them: the 4x4 repository's notes on blueprints.

## Next
- The candidates named there: a shared database, sign-in to a site, files. Each waits for a real app that needs it.
