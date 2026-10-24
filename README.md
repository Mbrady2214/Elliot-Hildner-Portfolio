# Elliot Hildner: Sports Product Design Portfolio

Static portfolio site (HTML/CSS/JS, no build step) for Elliot Hildner: B.S. Mechanical Engineering, Oregon State University; M.S. Sports Product Design (in progress), University of Oregon.

## Pages
| File | Page |
| --- | --- |
| `index.html` | Home: player card, highlights ticker, about, the Playbook, toolkit, education, selected work |
| `projects.html` | Box score table, all case studies, side projects |
| `project-shoe.html` | 01 PF Flyers Clover: beekeeping boot (3D sole viewer, tech pack) |
| `project-jacket.html` | 02 PHLO Jacket: golf rain jacket |
| `project-spikeshift.html` | 03 SpikeShift: roundnet cleat outsole (traction test) |
| `project-goggles.html` | 04 The Rooster: flat track goggle (3D frame viewer) |
| `project-sleeve.html` | 05 Recovery Sleeve: pitcher's compression sleeve |
| `project-midsole.html` | 06 Lotus I: biomimicry midsole (3D viewer) |
| `project-workshop.html` | Bat No. 01: woodturning build log |
| `experience.html` | Studio record, work experience, education |
| `contact.html` | Contact links and form |

## Where things live
- `assets/images/<page>/` web-sized images for each page (`shoe/`, `jacket/`, `spikeshift/`, `goggles/`, `sleeve/`, `midsole/`, `workshop/`, `about/`). Each project folder has a `deck/` folder of presentation slides; `shoe/techpack/` holds the tech pack pages.
- `assets/docs/` Elliot's resume (`Elliot-Hildner-Resume.pdf`), the original presentation PDFs and the Clover tech pack.
- `models/` GLB files for the 3D viewers, converted from Elliot's Rhino files.
- `Media/` the raw drop of originals. Git-ignored, never published (one CAD file is over GitHub's 100 MB limit).

See **[CONTENT-GUIDE.md](CONTENT-GUIDE.md)** for how to swap images, fill in the remaining placeholders and add projects. Raw, unsorted files can also go in **[_incoming/](_incoming/README.md)**.

## Previewing locally
Open the folder in VS Code and use **Live Server** (right-click `index.html` > *Open with Live Server*). The 3D models and the PDF links need a local server or a host like GitHub Pages; opening the HTML file directly won't load them.
