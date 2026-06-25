# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## ✍️ Writing posts (Notion)

Articles are written in Notion and pulled in at build time — no code editing required to publish a post.

**One-time setup:**

1. Create an integration at [notion.so/my-integrations](https://www.notion.so/my-integrations) and copy its **Internal Integration Secret**.
2. Create a Notion database (table) with these properties:
   | Property  | Type          | Notes                                              |
   | :-------- | :------------ | :-------------------------------------------------- |
   | `Title`   | Title         | required                                            |
   | `Summary` | Text          | shown as the teaser/dek on cards                    |
   | `Date`    | Date          | required, used for sorting                          |
   | `Tags`    | Multi-select  | shown as the tagline                                |
   | `Status`  | Select        | `Draft` / `Published` — only `Published` rows ship  |
   | `Slug`    | Text          | optional — derived from the title if left blank     |
3. Open the database, click **···** → **Connections**, and add the integration you just created.
4. Copy `.env.example` to `.env` and fill in:
   ```
   NOTION_API_KEY=secret_xxx
   NOTION_DATABASE_ID=xxxxxxxxxxxx
   ```
   (the database ID is the 32-character segment in its URL).

**Writing a post:** add a row to the database, write the page body using normal Notion blocks (headings, paragraphs, lists, code, quotes, images), and set `Status` to `Published`. Read time is calculated automatically from word count.

⚠️ Images pasted/uploaded directly into Notion get signed URLs that expire after about an hour — they'll render at build time but can break later. Use externally-hosted image URLs until this is automated.

Since the site is statically generated, a new or edited post only goes live after the site is rebuilt and redeployed.

## 🗂️ Editing "The Desk" (Notion)

The sidebar tabs (Reading / Learning / Signals / Building) pull their items from a second Notion database — the tab labels and panel headings themselves stay in code (`src/pages/index.astro`), only the list of books/courses/feeds/projects is dynamic.

**One-time setup:**

1. Create a second Notion database with these properties:
   | Property   | Type    | Notes                                                          |
   | :--------- | :------ | :-------------------------------------------------------------- |
   | `Name`     | Title   | required                                                         |
   | `By`       | Text    | author / source                                                  |
   | `Meta`     | Text    | status string, e.g. `in progress`, `finished · ★★★★★`            |
   | `Category` | Select  | one of `Reading`, `Learning`, `Signals`, `Building`              |
   | `Order`    | Number  | controls position within its tab                                |
2. Share it with the same integration (**···** → **Connections**).
3. Add `NOTION_DESK_DATABASE_ID=xxxxxxxxxxxx` to your `.env`.

**Adding an item:** add a row, set its `Category` to route it into the right tab, and it appears on the next build.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
