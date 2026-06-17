# How we collaborate (beginner-friendly guide)

We both work on the same GitHub repo (`Jshort805/Games`). To avoid stepping on each
other's toes, we **never edit `main` directly** — instead each change goes on its own
**branch** and gets merged through a **Pull Request (PR)** the other person can glance at.

You can do all of this with **GitHub Desktop** (a visual app) — no command line needed.

## One-time setup

1. Install [GitHub Desktop](https://desktop.github.com) and sign in with your GitHub account.
2. **File → Clone repository →** pick `Jshort805/Games` → choose where to save it.
3. Install [Node.js](https://nodejs.org) (LTS).
4. Open the `landgrab-collaborated/` folder and run `npm install` once.

## The everyday loop

1. **Get the latest:** In GitHub Desktop, make sure the current branch is `main`,
   then click **Fetch origin** / **Pull origin**.
2. **Start a branch:** **Current branch → New branch.** Name it for what you're doing,
   e.g. `add-sound-effects`. (Branches keep your work separate until it's ready.)
3. **Make your changes** in your code editor. Test with `npm run dev`.
4. **Commit:** Back in GitHub Desktop, your changes appear on the left. Write a short
   summary (e.g. "Add click sound on buy") and click **Commit to <branch>**.
5. **Publish/Push:** Click **Push origin** (first push says **Publish branch**).
6. **Open a Pull Request:** Click **Create Pull Request**. This opens GitHub in your
   browser — add a sentence about what changed and create it.
7. **Review & merge:** The other person looks at the PR and clicks **Merge pull request**.
   Then both of you switch back to `main` and **Pull** to get the merged change.

## Golden rules

- 🚫 Don't commit straight to `main` — always branch first.
- 🌱 One branch per feature/fix. Small PRs are easier to review.
- 🔄 **Pull `main` before starting** a new branch so you build on the latest.
- 💬 If two changes touch the same lines, GitHub flags a "merge conflict" — ping each
  other and resolve it together; it's normal and not scary.
- 🔑 Never commit secrets (API keys, `.env` files). They're already in `.gitignore`.
