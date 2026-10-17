# Security

## Reporting

Open a GitHub issue on this repository. Do not paste tokens, `.env` contents, or private keys into the issue.

## Trust model

The SHA-256 chain is tamper evidence only together with a head hash stored outside the browser. The kernel runs in the browser, so anyone who can recompute the chain can replace it. Replay (`reproduceExportedRun`) is a determinism test, not a proof of authenticity. A JSON file with matching numbers can be written by hand. The head hash is compared only when the export recorded a logical clock and a named origin (`clockMode: "logical"` and a string `logicalOrigin`).

`reproduceExportedRun` caps the payload at 1_000_000 bytes, rejects invalid JSON and schema mismatches (`upo-run-2`, and the older `upo-run-1`), and copies only known parameter keys.

## Secret scanning

GitHub secret scanning is not enabled on this repository. The API reports that secret scanning is disabled and that GitHub Advanced Security is not enabled, so a client with ordinary repository rights cannot turn the setting on. A code search of the tree and a content scan of the historical Python sources at commits `472624bf` and `d61bb5e` found no API keys, tokens, or private keys. Do not commit `.env` files, credentials, or platform glue (auth, database, preview bridge).

## License

There is no LICENSE file. That decision is open.
