# Workflow Canvas

A visual workflow builder that runs entirely in the browser. Drag **Trigger**, **Condition**, **Action** and **Delay** nodes onto a canvas, wire them together, tweak each one in an inspector and watch the workflow's JSON update live.

The drag, connect and edge rendering are hand-written with pointer events and SVG. There is no graph library. The only runtime dependencies are `react` and `react-dom`.

![Workflow Canvas screenshot](docs/screenshot.png)

## Live Demo

**https://workflow-canvas.vercel.app**

> Placeholder URL. Replace it with the real deployment URL once the project is live.

## Features

- **Node palette.** Drag a node type onto the canvas, or click it to drop it in the first free spot. Palette items are real buttons, so Enter and Space work too.
- **Canvas.** Move nodes by dragging (snaps to an 8px grid). The canvas is 2400 × 1600 and scrolls.
- **Connections.** Drag from an output dot to any node to draw a bezier edge.
  - Condition nodes have two outputs, `true` and `false`.
  - Triggers have no input.
  - Self-links, duplicates and loops are rejected with a toast.
  - Each output port holds one edge. Connecting it again replaces the old one.
- **Inspector.** Click a node to edit its label and type-specific settings.
  - Trigger: event type, plus a cron expression for schedules.
  - Condition: expression.
  - Action: action type (email, Slack, HTTP request, create record, script) with its own parameters.
  - Delay: duration and unit.
- **Live JSON preview.** Nodes (`id`, `type`, `label`, `config`, `position`) and edges (`from`, `to`, `port`), syntax-highlighted and updated as you work. One-click copy, with a fallback for browsers or contexts without the async Clipboard API.
- **Validation hints.** The JSON panel flags a missing trigger, nodes with no incoming connection and unconnected condition branches.
- **Delete.** Press `Delete` / `Backspace` or use the button. Deleting a node removes its connections. Shortcuts are ignored while you type in a field.
- **Persistence.** Autosaves to `localStorage`. **Load example** and **Clear** are in the toolbar, and both offer an **Undo** toast.
- **Dark UI.** Plain CSS with design tokens as CSS variables. No UI framework.

## Getting Started

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server                     |
| `npm run build`     | Type-check (`tsc --noEmit`), then build to `dist/` |
| `npm run preview`   | Serve the production build locally            |
| `npm run typecheck` | Type-check only                               |

## Workflow JSON

```json
{
  "version": 1,
  "nodes": [
    {
      "id": "n_urgent",
      "type": "condition",
      "label": "Is it urgent?",
      "config": { "expression": "ticket.priority == \"urgent\"" },
      "position": { "x": 232, "y": 144 }
    }
  ],
  "edges": [
    { "id": "e_2", "from": "n_urgent", "to": "n_page", "port": "true" }
  ]
}
```

`port` is `out` for single-output nodes, or `true` / `false` for conditions.

## Project Structure

```
workflow-canvas/
├── docs/screenshot.png        # README screenshot (1440×900)
├── public/favicon.svg
├── index.html
├── src/
│   ├── main.tsx               # entry point
│   ├── App.tsx                # layout, keyboard shortcuts, toasts, wiring
│   ├── reducer.ts             # workflow state transitions
│   ├── types.ts               # Workflow / node / edge types
│   ├── nodeDefs.ts            # node types: ports, config fields, defaults, geometry
│   ├── graph.ts               # connection rules, validation, JSON export
│   ├── example.ts             # starter workflow
│   ├── storage.ts             # localStorage load/save with defensive parsing
│   ├── utils.ts               # ids, clamp/snap, clipboard helper
│   ├── styles.css             # theme tokens and all styling
│   └── components/
│       ├── Palette.tsx        # draggable node types
│       ├── Canvas.tsx         # surface, SVG edges, node dragging, connecting
│       ├── Inspector.tsx      # label and per-type config editor
│       ├── JsonPreview.tsx    # highlighted JSON, copy, validation
│       └── Icons.tsx
├── package.json
├── tsconfig.json              # strict mode
└── vite.config.ts
```

## Deploy Notes

This is a static Vite app and deploys to Vercel with zero config:

1. Push the repo to GitHub (private is fine).
2. In Vercel, choose **Add New → Project** and import the repo.
3. Keep the detected defaults: framework **Vite**, build command `npm run build`, output directory `dist`.
4. If the demo URL should be public, turn off **Deployment Protection → Vercel Authentication** for the project. It is on by default for new projects.

No environment variables are needed. Everything is stored in the visitor's own browser.
