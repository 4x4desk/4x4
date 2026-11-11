# The layers

4x4 AWD Desk is built in five layers, from the engine at the bottom to the person's data at the top. Each changes at its own pace and meets the next through a written promise, a contract, so work on one layer doesn't need the others' code.

| Layer | In plain words | Changes |
|---|---|---|
| 1. Foundation | The browser engine: Firefox with our patches, compiled and signed | When Firefox moves on |
| 2. Glue | The window, the bar, zones, workspaces, the part that runs each app, the installer | Any day, as an update with no recompile |
| 3. Apps | One folder per app | Any day, by us, the person or their agent |
| 4. Workspaces | One small file each: which apps, and where | Whenever the person likes |
| 5. Data | Sign-ins and what each app stores | Stays on the person's computer |

## What this means for you

- **Building an app touches layer 3 only.** No engine, compiler or desk code: a folder of HTML, CSS and JavaScript is enough.
- **A feature every desk should have** goes in layer 2, so every app gets it at once.
- **Layer 1 is the last resort:** a change there means a new compile and a signed release.
- **Layer 5 is never in a repository.** That is why apps and workspaces can be shared.

Layers 1 and 2 are not in this repository yet. Their side of each contract is written in plain words, so you can build against it today.

The full table, with the contract between each pair of layers: [`contracts/README.md`](../contracts/README.md). Next: [apps](apps.md).
