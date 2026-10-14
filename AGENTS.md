# sigflint repository guidance

This file adds to your own rules for work on this repository. The checks are
in CONTRIBUTING.md; run `npm run check` before landing.

## Landing

The maintainer lands pull requests; contributors' commits keep their author
(see CONTRIBUTING.md). When you land for the maintainer, open a pull request
for the record, then fast-forward `main` to the branch head with
`git push origin <branch>:main` and delete the branch. GitHub's merge buttons
and any CLI or script merge are off limits, because they write the account's
profile name into the public history.

Commits you write on `main` carry `bompus <bompus@users.noreply.github.com>`
as author and committer, set per commit with
`git -c user.name=bompus -c user.email=bompus@users.noreply.github.com commit`.
To land an outside contributor's pull request, rebase it onto `main` with that
committer identity and push the result to its branch. If you cannot push
there, close the pull request with a comment naming the landing commit.

## Releases

A change users will notice gets a `CHANGELOG.md` entry under `Unreleased` in
the same commit. Changelog entries describe completed changes.

Before every version bump, re-run the speed, memory, import and size
measurements on the code being released (`bench/`, with the protocol's host
lock and no other work running), regenerate the charts and tables, correct
every README and CHANGELOG number, then record the run with
`node bench/check-benchmarked.mjs --record`. The publish workflow runs the
same script without the flag and stops when the recorded version or the `src/`
tree differs from what is being tagged. A change to `src/` after the record
needs a new run.

Then prepare one release commit that moves the `Unreleased` entries into a
dated version section and sets `package.json` `version` to the same version.
Once that commit is verified on `main`, tag it `v<version>`; the tag starts
the publish workflow (npm trusted publishing, no stored token). Publishing,
tagging and announcing wait for the maintainer's go.

## Public repository

Write nothing that names a private project, private repository, local path,
home directory or credential.
