# Binabox

## First install

After cloning the repo, run:

```bash
npm ci
```

## Commands

Use these commands to build or run your project locally.

**General:**

* `npm start` — runs the development server with hot reload (same as `vite dev`)
* `npm run build` — builds the project for production and outputs files to the `dist` folder
* `npm run preview` — serves the built project from the `dist` folder for local preview

**Linting:**

* `npm run lint` — runs ESLint for JavaScript/TypeScript files
* `npm run lint:fix` — runs ESLint and automatically fixes issues
* `npm run stylelint` — checks all `.scss` files with Stylelint
* `npm run stylelint:fix` — same as above, but also fixes fixable style issues

## Notes

This project uses `Vite` as the build tool and supports `workspaces`, meaning you may have separate packages inside the `packages/` directory. Make sure each sub-package has its own dependencies properly installed.

Also, `husky` is included for git hooks. If it’s not set up yet, run:

```bash
npm run prepare
```
