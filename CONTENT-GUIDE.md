# Content Guide: Elliot Hildner Portfolio

All the project content is in. This guide covers what's left to fill in, how to change things, and how the media was prepared.

## Resume, email and links
- **Resume:** downloads from `assets/docs/Elliot-Hildner-Resume.pdf` (home hero button, Experience page, Contact page and every footer). To update it, save the new PDF over that file with the same name.
- **Email:** `hildner.elliot@gmail.com`, from the resume, on the Contact page and in the contact form. The form opens the visitor's email app with the message addressed to Elliot. To have messages sent straight from the site instead, create a free form at formspree.io and paste its URL into `data-endpoint="..."` on the form in `contact.html`.
- **LinkedIn:** linkedin.com/in/elliot-hildner (Experience page, Contact page and every footer).

**Worth confirming:** Winter 2026 for PHLO and Fall 2026 for the equipment studio (`experience.html`), and the "20+ prototypes" stat on the player card.

Grey italic text with `class="is-placeholder"` marks anything unconfirmed. None is left on the site right now; the style stays in `style.css` for future drafts.

## Changing an image
Images are plain `<img>` tags. To swap one, save the new file over the old one (same name), or change the `src` and the `width`/`height` to match. Long edge around 1800 px and under about 500 KB keeps pages fast.

Every image is click-to-enlarge. Images inside one `data-gallery` container (decks, galleries) can be stepped through with the arrow keys.

## Project colorways
Each project page sets `data-cw` on `<body>` (for example `data-cw="spikeshift"`). The colors are defined once near the end of `style.css` under "Sports product layer". Change them there and the spec label, pins, bars, progress bar and cards all follow.

## Hotspots (numbered product callouts)
Each pin is positioned in percent of the image: `style="--x: 26%; --y: 56%"`. The text lives in the numbered list underneath, so it reads fine on phones and screen readers. Keep the `data-hotspot` numbers on the pin and its list item the same.

## 3D models
The viewers load GLB files from `models/`. They were converted from the Rhino files using the render meshes saved in each `.3dm`, then simplified and compressed. The boot sole is 1.6 MB, the midsole 1.1 MB and the goggle 0.8 MB.

| Model | Source file | Notes |
| --- | --- | --- |
| `models/shoe/clover-sole.glb` | `Hildner_MidsoleBoot_SPD686.3dm` + `Hildner_OutsoleBoot_SPD686.3dm` | Outsole aligned under the midsole. Parts: Midsole, Outsole (Explode button) |
| `models/goggles/goggles.glb` | `goggle cad file.3dm` | Frame only |
| `models/midsole/lotus-midsole.glb` | `flowermed.3dm` | Pebax web + SubD petals. This is the petal layout in the working file; the final drawing adds radial clusters. Export the final version to replace it |

To replace a model from Rhino 7+: select the parts, *File > Export Selected > .glb*, keep it under about 15 MB, and save it over the file above. Name each part's object or layer (e.g. `Web`, `Petals`) and list it in the viewer's `data-parts` attribute to get a labeled part chip and the Explode button.

## Adding a project
1. Copy an existing case-study page (for example `project-spikeshift.html`), rename it, and swap the text and images. Put the images in a new `assets/images/<name>/` folder.
2. Add a colorway line for it in `style.css` and set `data-cw` on the new page's `<body>`.
3. Add a row to the box score and a card on `projects.html`, and a card in Selected Work on `index.html` if it should be featured.
4. Update the previous/next links at the bottom of the neighboring project pages.
