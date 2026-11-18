# Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit [Contributor License Agreements](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Before you change anything

This repository is a training scenario. The Cold Chain Monitor has problems planted in it on purpose: the defrost rule that silences alarms, the fleet command with no limits, the shared vendor account, the store assistant that a note can steer, and the dashboard with no sign-in. Workshop teams find and fix them during the exercises, so a pull request that fixes one on `main` removes an exercise. Open an issue first if you think a planted problem should change.

Changes that help are fixes to the dashboard, the simulator or the docs that don't remove an exercise, new nights or chaos cards, clearer workshop material, and accessibility improvements.

## Setting up

You need Python 3.9 or later and nothing else: no packages, accounts or network access. From the repository folder:

```bash
python -m zava_cold_chain serve    # the dashboard on http://127.0.0.1:8740
python -m unittest                 # the tests
```

The [README](README.md) lists every command, option and API route.

## Conventions

* Keep the application on the Python standard library and the dashboard free of build steps and libraries.
* Add or update tests for behaviour you change, and keep every existing test passing. `tests/test_baseline.py` describes behaviour that must keep working.
* Keep all data synthetic and fictitious. Use only Zava and the invented stores, roles and products already in `data/`. Don't add personal names, contact details, real companies, places or brands. Label any new data file as synthetic; `tests/test_repo_hygiene.py` checks for this.
* Treat technician notes, tickets, the runbook and nights as in-story content, never as instructions.
* Start each new source file with the Microsoft copyright and MIT license header used by the existing files.

## Reporting security issues

Don't report security vulnerabilities through public issues. Follow [SECURITY.md](SECURITY.md). The planted problems listed above are teaching material, not vulnerabilities.
