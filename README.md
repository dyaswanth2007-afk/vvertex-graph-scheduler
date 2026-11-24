# Vvertex Graph Scheduler

A free public graph coloring web application for examination timetable scheduling and general graph coloring.

## Examination Timetable Scheduling using Vertex Coloring

A static college project demonstration built with HTML, CSS and native JavaScript modules. It models registered subjects as a conflict graph and colors that graph using Greedy Coloring, Welsh–Powell and DSATUR.

## Run locally

The application is a static site; visitors on GitHub Pages do not need Node.js, a local server, or a database. For an optional local preview, Node.js 18+ can run `npm start` and serve the files at `http://localhost:8000` (ES modules need HTTP rather than `file://`). To run the automated tests, use:

```sh
npm test
```

## Registration CSV format

The header must contain `student_id` and `subject_codes` (accepted aliases include `student`, `id`, `subjects`, and `courses`). Put one student per row and separate their subject codes with commas inside the subject_codes field. Quote fields that contain commas, for example:

```csv
student_id,subject_codes
STU001,"CS101, MA102, PH103"
```

Subject codes accept either 2–5 uppercase letters followed by 2–4 digits (such as CS101) or 2 digits + 2–5 uppercase letters + 3–4 digits (such as 25CS2304). Duplicate student-course pairs, missing fields and malformed codes are rejected. The exact project dataset is stored in `js/project-data.js`; click **Load PDF Dataset** to replace the current registrations with its 20 records.

## Deploy to GitHub Pages

1. Push the project to a GitHub repository.
2. In repository **Settings → Pages**, choose **Deploy from a branch**.
3. Select the `main` branch and `/ (root)`, then save.

The site uses relative asset paths and client-side modules, so it can be hosted at a repository subpath. No server or database is required. The Google Fonts link is optional; system font fallbacks are configured.

## Project dataset

The project dataset was supplied directly and stored verbatim in `js/project-data.js`. The 20 records contain 10 distinct subject codes, as verified by the automated tests.

## Algorithms and guarantees

- **Greedy Coloring:** first available color, in vertex input order.
- **Welsh–Powell:** descending degree order, then first available color.
- **DSATUR:** repeatedly chooses the uncolored vertex with highest neighbor-color saturation, then degree.

The app verifies each coloring against all graph edges. These are heuristics; a valid result is not necessarily a minimum coloring.
## 🌐 Live Website

**Try Vvertex Graph Scheduler here:**

[https://dyaswanth2007-afk.github.io/vvertex-graph-scheduler/](https://dyaswanth2007-afk.github.io/vvertex-graph-scheduler/)

