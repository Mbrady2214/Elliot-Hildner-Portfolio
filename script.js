document.addEventListener("DOMContentLoaded", () => {
    // Each feature runs in isolation so one failure cannot break the rest
    // (in particular the reveal animation, which would leave content hidden).
    [
        initNavigation,
        initRevealAnimations,
        initMediaSlots,
        initDocSlots,
        initLightbox,
        initContactForm,
        initViewers,
        initPlayerCard,
        initTicker,
        initHotspots,
        initDecks,
        initScrollProgress,
        initFooterYear
    ].forEach((init) => {
        try {
            init();
        } catch (error) {
            console.error(`${init.name} failed:`, error);
        }
    });
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------- Navigation ---------- */

function initNavigation() {
    const nav = document.getElementById("site-nav");
    const toggle = document.querySelector(".nav-toggle");
    const navLinks = [...document.querySelectorAll(".site-nav a")];

    // Compare bare page names so "/projects" (GitHub Pages) matches "projects.html".
    const pageName = (value) => {
        let path = value.split(/[?#]/)[0];
        try {
            path = decodeURIComponent(path);
        } catch {
            // Keep the raw path if it contains malformed escapes.
        }
        return path.toLowerCase().split("/").pop().replace(/\.html$/, "") || "index";
    };
    const currentPage = pageName(window.location.pathname || "/");
    const isProjectDetailPage = currentPage.startsWith("project-");

    navLinks.forEach((link) => {
        const hrefPage = pageName(link.getAttribute("href") || "");
        const isMatch = hrefPage === currentPage || (hrefPage === "projects" && isProjectDetailPage);

        link.classList.toggle("is-active", isMatch);
        if (isMatch) {
            link.setAttribute("aria-current", "page");
        }
    });

    if (!nav || !toggle) {
        return;
    }

    const setOpen = (open) => {
        nav.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && nav.classList.contains("is-open")) {
            setOpen(false);
            toggle.focus();
        }
    });
}

/* ---------- Scroll reveal ---------- */

function initRevealAnimations() {
    const revealItems = document.querySelectorAll(".reveal");

    if (!revealItems.length) {
        return;
    }

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
    }

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
}

/* ---------- Media slots ----------
   Real images sit directly in the markup: <div class="media-slot"><img ...></div>.
   They get click-to-enlarge unless they live inside a link or carry data-zoom="false".

   Empty drop-in slots still work: <div class="media-slot" data-src="assets/images/x/y">.
   data-src without an extension tries .jpg, .png, .jpeg and .webp in order. If a file
   exists it replaces the placeholder; otherwise the placeholder stays and shows the
   expected file path so the right image can be dropped in. */

// Most likely first to keep failed requests low. GitHub Pages is
// case-sensitive, so phone exports like ".JPG" are covered too.
const IMAGE_EXTENSIONS = ["jpg", "png", "jpeg", "webp", "JPG", "PNG", "JPEG"];

function hasExtension(path) {
    return /\.[a-z0-9]{2,5}$/i.test(path.split("/").pop());
}

function makeZoomable(slot, img) {
    slot.classList.add("has-media");
    if (slot.dataset.zoom === "false" || slot.closest("a, button")) {
        return;
    }
    slot.setAttribute("tabindex", "0");
    slot.setAttribute("role", "button");
    slot.setAttribute("aria-label", `Enlarge image: ${img.alt || "project image"}`);
    slot.dataset.lightbox = "true";
}

function initMediaSlots() {
    document.querySelectorAll(".media-slot").forEach((slot) => {
        const existing = slot.querySelector(":scope > img");
        if (existing) {
            makeZoomable(slot, existing);
            return;
        }

        const src = slot.dataset.src;
        if (!src) {
            return;
        }

        const candidates = hasExtension(src) ? [src] : IMAGE_EXTENSIONS.map((ext) => `${src}.${ext}`);
        const pathLabel = slot.querySelector("[data-slot-path]");

        if (pathLabel) {
            pathLabel.textContent = hasExtension(src) ? src : `${src}.jpg / .png`;
        }

        const img = new Image();
        img.decoding = "async";
        img.alt = slot.dataset.alt || "";

        let attempt = 0;
        img.addEventListener("error", () => {
            attempt += 1;
            if (attempt < candidates.length) {
                img.src = candidates[attempt];
            }
        });

        img.addEventListener("load", () => {
            slot.querySelector(".media-slot-placeholder")?.remove();
            slot.prepend(img);
            makeZoomable(slot, img);
        });

        img.src = candidates[0];
    });
}

/* ---------- Document slots ----------
   <a class="doc-slot" data-doc="assets/docs/jacket-presentation.pdf">
   Linked up when the file is reachable. A missing file hides the link entirely,
   so visitors never meet a "coming soon" button; drop the PDF in and it appears. */

function initDocSlots() {
    document.querySelectorAll("[data-doc]").forEach(async (slot) => {
        const path = slot.dataset.doc;
        const state = slot.querySelector(".doc-slot-state");

        const enable = () => {
            slot.setAttribute("href", path);
            slot.setAttribute("target", "_blank");
            slot.setAttribute("rel", "noopener");
            slot.classList.remove("is-pending");
            slot.removeAttribute("aria-disabled");
            slot.removeAttribute("role");
            slot.hidden = false;
            if (state && !slot.classList.contains("button")) {
                state.textContent = slot.dataset.state || "Open PDF";
            }
        };

        const hide = () => {
            slot.hidden = true;
            const row = slot.closest(".doc-row");
            if (row && ![...row.querySelectorAll("[data-doc]")].some((item) => !item.hidden)) {
                row.hidden = true;
            }
        };

        // Local file previews (file://) cannot be checked, so trust the path.
        if (window.location.protocol === "file:") {
            enable();
            return;
        }

        try {
            const response = await fetch(path, { method: "HEAD", cache: "no-store" });
            if (response.ok) {
                enable();
            } else {
                hide();
            }
        } catch {
            hide();
        }
    });
}

/* ---------- Lightbox ----------
   Any zoomable media slot opens here. Slots that share a [data-gallery] container
   become a gallery: arrow buttons and the left/right keys step through them. */

function initLightbox() {
    const dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Enlarged image");
    dialog.innerHTML = `
        <div class="lightbox-bar">
            <p class="lightbox-count" aria-live="polite"></p>
            <button class="lightbox-close" type="button" aria-label="Close image">&times;</button>
        </div>
        <div class="lightbox-stage">
            <button class="lightbox-nav prev" type="button" aria-label="Previous image">&larr;</button>
            <img alt="">
            <button class="lightbox-nav next" type="button" aria-label="Next image">&rarr;</button>
        </div>
        <p class="lightbox-caption"></p>
    `;
    document.body.appendChild(dialog);

    const dialogImg = dialog.querySelector("img");
    const caption = dialog.querySelector(".lightbox-caption");
    const count = dialog.querySelector(".lightbox-count");
    const prev = dialog.querySelector(".prev");
    const next = dialog.querySelector(".next");
    let group = [];
    let index = 0;

    const show = (i) => {
        index = (i + group.length) % group.length;
        const slot = group[index];
        const img = slot.querySelector("img");
        dialogImg.src = slot.dataset.full || img.currentSrc || img.src;
        dialogImg.alt = img.alt;
        caption.textContent = slot.closest("figure")?.querySelector("figcaption")?.textContent.trim().replace(/\s+/g, " ") || img.alt;
        const many = group.length > 1;
        prev.hidden = !many;
        next.hidden = !many;
        count.textContent = many ? `${String(index + 1).padStart(2, "0")} / ${String(group.length).padStart(2, "0")}` : "";
    };

    const open = (slot) => {
        if (!slot.querySelector("img") || typeof dialog.showModal !== "function") {
            return;
        }
        const gallery = slot.closest("[data-gallery]");
        group = gallery ? [...gallery.querySelectorAll("[data-lightbox='true']")] : [slot];
        show(Math.max(0, group.indexOf(slot)));
        dialog.showModal();
    };

    document.addEventListener("click", (event) => {
        const slot = event.target.closest("[data-lightbox='true']");
        if (slot) {
            open(slot);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (dialog.open) {
            if (event.key === "ArrowRight" && group.length > 1) {
                show(index + 1);
            } else if (event.key === "ArrowLeft" && group.length > 1) {
                show(index - 1);
            }
            return;
        }
        const slot = event.target.closest?.("[data-lightbox='true']");
        if (slot && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            open(slot);
        }
    });

    prev.addEventListener("click", () => show(index - 1));
    next.addEventListener("click", () => show(index + 1));
    dialog.querySelector(".lightbox-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog || event.target.classList.contains("lightbox-stage")) {
            dialog.close();
        }
    });
}

/* ---------- Contact form ----------
   Set data-endpoint on the form to a Formspree URL (https://formspree.io/f/xxxx)
   to send messages straight from the page. Without one, the form opens the
   visitor's email app with the message filled in (data-mailto). */

function initContactForm() {
    const form = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");

    if (!form || !formStatus) {
        return;
    }

    const endpoint = (form.dataset.endpoint || "").trim();
    const mailto = (form.dataset.mailto || "").trim();
    const submitButton = form.querySelector(".submit-btn");

    if (!endpoint && !mailto) {
        formStatus.textContent = "The contact form is not connected yet. Please use the email link for now.";
        formStatus.className = "form-status notice";
        submitButton?.setAttribute("disabled", "true");
        return;
    }

    // Disabled in the HTML so the form is inert without JS.
    submitButton?.removeAttribute("disabled");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!endpoint) {
            const data = new FormData(form);
            const subject = `Portfolio enquiry from ${data.get("name")}`;
            const body = `${data.get("message")}\n\n${data.get("name")}\n${data.get("email")}`;
            window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            formStatus.textContent = "Your email app should open with the message ready to send.";
            formStatus.className = "form-status success";
            return;
        }

        const originalText = submitButton?.textContent || "Send Message";

        if (submitButton) {
            submitButton.textContent = "Sending...";
            submitButton.setAttribute("disabled", "true");
        }

        formStatus.textContent = "";
        formStatus.className = "form-status";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: new FormData(form),
                headers: { Accept: "application/json" }
            });

            if (!response.ok) {
                throw new Error("Unable to send message.");
            }

            form.reset();
            formStatus.textContent = "Thanks! Your message has been sent.";
            formStatus.classList.add("success");
        } catch (error) {
            console.error(error);
            formStatus.textContent = "There was a problem sending your message. Please try again or use the email link.";
            formStatus.classList.add("error");
        } finally {
            if (submitButton) {
                submitButton.textContent = originalText;
                submitButton.removeAttribute("disabled");
            }
        }
    });
}

/* ---------- 3D viewer ----------
   <div class="viewer-shell" data-viewer data-model="models/x/y.glb"
        data-stage="light" data-parts='{"Web":"Pebax web"}' data-camera="0.8,0.55,1">
   data-stage="light" shows the model on a studio backdrop (dark is the default).
   Models with more than one named part get an Explode button and a part legend
   whose chips toggle each part on and off. */

function initViewers() {
    document.querySelectorAll("[data-viewer]").forEach((viewer) => {
        try {
            buildViewer(viewer);
        } catch (error) {
            console.error("Viewer initialization failed:", error);
            setViewerStatus(viewer, "Viewer failed to initialize.");
        }
    });
}

function setViewerStatus(viewerRoot, message) {
    const status = viewerRoot.querySelector(".viewer-status");
    if (status) {
        status.textContent = message;
    }
}

function showViewerPlaceholder(canvasHost, title, body) {
    canvasHost.querySelector(".viewer-placeholder")?.remove();
    const placeholder = document.createElement("div");
    placeholder.className = "viewer-placeholder";
    placeholder.innerHTML = `<div><strong></strong><p></p></div>`;
    placeholder.querySelector("strong").textContent = title;
    placeholder.querySelector("p").textContent = body;
    canvasHost.appendChild(placeholder);
    // Without a model the host is plain text, not an image.
    canvasHost.removeAttribute("role");
    canvasHost.removeAttribute("aria-label");
    return placeholder;
}

function disableViewerButtons(viewerRoot) {
    viewerRoot.querySelectorAll("[data-action]").forEach((button) => {
        button.setAttribute("disabled", "true");
        button.removeAttribute("aria-pressed");
    });
}

function buildViewer(viewerRoot) {
    const canvasHost = viewerRoot.querySelector(".viewer-canvas");
    // data-model may list several comma-separated paths; the first that loads wins.
    const modelPaths = (viewerRoot.dataset.model || "").split(",").map((path) => path.trim()).filter(Boolean);
    const modelPath = modelPaths[0] || "";
    const modelTitle = viewerRoot.dataset.title || "3D model";
    const lightStage = viewerRoot.dataset.stage === "light";
    const partLabels = JSON.parse(viewerRoot.dataset.parts || "{}");
    const cameraDir = (viewerRoot.dataset.camera || "0.8,0.55,1").split(",").map(Number);
    const awaitingCopy = `Awaiting CAD export. Save the model as ${modelPaths.join(" or ") || "a .glb file in models/"} and it will load here.`;

    if (!canvasHost) {
        return;
    }

    if (!window.THREE || !THREE.OrbitControls || !THREE.GLTFLoader) {
        showViewerPlaceholder(canvasHost, "3D viewer unavailable", "The 3D libraries could not be loaded. Check your connection and refresh.");
        setViewerStatus(viewerRoot, "3D libraries unavailable");
        disableViewerButtons(viewerRoot);
        return;
    }

    if (!modelPath) {
        showViewerPlaceholder(canvasHost, `${modelTitle} coming soon`, awaitingCopy);
        setViewerStatus(viewerRoot, "Awaiting model");
        disableViewerButtons(viewerRoot);
        return;
    }

    const scene = new THREE.Scene();
    if (!lightStage) {
        scene.background = new THREE.Color(0x15171a);
    }

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 2000);
    camera.position.set(2.2, 1.4, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: lightStage });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lightStage ? 1.05 : 1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasHost.appendChild(renderer.domElement);

    // Soft studio reflections when the environment helper is available.
    if (THREE.RoomEnvironment) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    }

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = !prefersReducedMotion;
    controls.autoRotateSpeed = 1.2;

    // Don't trap page scrolling: vertical swipes scroll the page, and wheel
    // zoom only turns on once the visitor has clicked into the viewer.
    renderer.domElement.style.touchAction = "pan-y";
    controls.enableZoom = false;
    renderer.domElement.addEventListener("pointerdown", () => {
        controls.enableZoom = true;
    });
    renderer.domElement.addEventListener("pointerleave", () => {
        controls.enableZoom = false;
    });

    scene.add(new THREE.HemisphereLight(0xffffff, lightStage ? 0xb9b4aa : 0x2a2d33, lightStage ? 0.45 : 0.55));

    const keyLight = new THREE.DirectionalLight(0xffffff, lightStage ? 0.8 : 0.95);
    keyLight.position.set(5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0002;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(lightStage ? 0xffffff : 0xff8a4c, lightStage ? 0.35 : 0.55);
    rimLight.position.set(-4, 3, -6);
    scene.add(rimLight);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(16, 16),
        new THREE.ShadowMaterial({ color: 0x000000, opacity: lightStage ? 0.16 : 0.35 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(6, 24, 0xff5a1f, lightStage ? 0xc9c5bc : 0x3a3f47);
    gridHelper.visible = false;
    scene.add(gridHelper);

    let initialCameraPosition = camera.position.clone();
    let initialTarget = controls.target.clone();
    let model = null;
    let visible = true;
    const originalMaterials = new Map();
    let clayMode = viewerRoot.dataset.material === "clay";
    const parts = [];
    let explodeTarget = 0;
    let explodeNow = 0;

    const clayMaterial = new THREE.MeshStandardMaterial({ color: 0xd9dbde, metalness: 0.05, roughness: 0.6 });

    const applyMaterials = () => {
        if (!model) {
            return;
        }
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = clayMode ? clayMaterial : originalMaterials.get(child);
            }
        });
    };

    const resize = () => {
        const width = canvasHost.clientWidth;
        const height = canvasHost.clientHeight;
        if (!width || !height) {
            return;
        }
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };

    const frameObject = (object) => {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2 / (Math.max(size.x, size.y, size.z) || 1);

        object.scale.setScalar(scale);
        object.position.copy(center).multiplyScalar(-scale);

        const framed = new THREE.Box3().setFromObject(object);
        object.position.y -= framed.min.y;

        const framedSize = framed.getSize(new THREE.Vector3());
        const distance = Math.max(framedSize.x, framedSize.y, framedSize.z) * 1.65;
        const dir = new THREE.Vector3(...cameraDir).normalize();

        controls.target.set(0, framedSize.y * 0.45, 0);
        camera.position.copy(dir.multiplyScalar(distance)).add(controls.target);
        controls.update();

        initialCameraPosition = camera.position.clone();
        initialTarget = controls.target.clone();
        return framedSize;
    };

    // Optimised GLBs can hang a mesh under an unnamed child node, so a part's name is
    // the first named ancestor (or its material) that data-parts knows about.
    const partName = (mesh) => {
        for (let node = mesh; node && node !== model; node = node.parent) {
            if (partLabels[node.name]) {
                return node.name;
            }
        }
        return partLabels[mesh.material?.name] ? mesh.material.name : mesh.name;
    };

    // Named meshes become parts. Explode spreads them apart along the up axis,
    // lowest part down and highest part up, so stacked soles read as layers.
    const collectParts = (framedSize) => {
        model.traverse((child) => {
            if (child.isMesh) {
                const name = partName(child);
                parts.push({ mesh: child, label: partLabels[name] || name.replace(/_/g, " ") });
            }
        });
        if (parts.length < 2) {
            parts.length = 0;
            viewerRoot.querySelector("[data-action='explode']")?.remove();
            return;
        }

        model.updateMatrixWorld(true);
        parts.forEach((part) => {
            const box = new THREE.Box3().setFromObject(part.mesh);
            part.centerY = box.getCenter(new THREE.Vector3()).y;
            part.origin = part.mesh.position.clone();
            const parentScale = new THREE.Vector3();
            part.mesh.parent.getWorldScale(parentScale);
            part.localUnit = 1 / (parentScale.y || 1);
        });
        const sorted = [...parts].sort((a, b) => a.centerY - b.centerY);
        const spread = framedSize.y * 0.9 + 0.15;
        sorted.forEach((part, i) => {
            part.offset = (i - (sorted.length - 1) / 2) * spread;
        });

        const legend = viewerRoot.querySelector(".viewer-parts");
        if (!legend) {
            return;
        }
        parts.forEach((part) => {
            const material = originalMaterials.get(part.mesh);
            const chip = material?.color ? `#${material.color.clone().convertLinearToSRGB().getHexString()}` : "#999";
            const button = document.createElement("button");
            button.type = "button";
            button.className = "part-chip";
            button.setAttribute("aria-pressed", "true");
            button.innerHTML = `<span class="swatch" aria-hidden="true"></span><span></span>`;
            button.querySelector(".swatch").style.background = chip;
            button.lastElementChild.textContent = part.label;
            button.addEventListener("click", () => {
                part.mesh.visible = !part.mesh.visible;
                button.setAttribute("aria-pressed", String(part.mesh.visible));
            });
            legend.appendChild(button);
        });
        legend.hidden = false;
    };

    const loading = createLoadingOverlay();
    canvasHost.appendChild(loading.element);
    setViewerStatus(viewerRoot, "Loading model...");

    const loader = new THREE.GLTFLoader();
    let pathIndex = 0;

    const onLoaded = (gltf) => {
        model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                originalMaterials.set(child, child.material);
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        applyMaterials();
        scene.add(model);
        const framedSize = frameObject(model);
        collectParts(framedSize);
        loading.element.remove();
        setViewerStatus(viewerRoot, finePointer ? "Drag to orbit · Click, then scroll to zoom" : "Drag to orbit");
        viewerRoot.classList.add("is-loaded");
        resize();
    };

    const onProgress = (xhr) => {
        if (xhr.total) {
            loading.setProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
    };

    const onFailed = (error) => {
        console.warn(`Model not loaded from ${modelPaths[pathIndex]}:`, error);
        pathIndex += 1;
        if (pathIndex < modelPaths.length) {
            loader.load(modelPaths[pathIndex], onLoaded, onProgress, onFailed);
            return;
        }
        visible = false;
        loading.element.remove();
        renderer.domElement.remove();
        if (window.location.protocol === "file:") {
            // Browsers block model loading from file://, even when the file exists.
            showViewerPlaceholder(canvasHost, "Preview needs a local server", "Open the site with VS Code Live Server (or once hosted on GitHub Pages) to see the 3D model.");
            setViewerStatus(viewerRoot, "Local preview only");
        } else {
            showViewerPlaceholder(canvasHost, `${modelTitle} coming soon`, awaitingCopy);
            setViewerStatus(viewerRoot, "Awaiting model");
        }
        disableViewerButtons(viewerRoot);
    };

    loader.load(modelPath, onLoaded, onProgress, onFailed);

    viewerRoot.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;

            if (action === "reset") {
                camera.position.copy(initialCameraPosition);
                controls.target.copy(initialTarget);
                controls.update();
            }

            if (action === "grid") {
                gridHelper.visible = !gridHelper.visible;
                button.setAttribute("aria-pressed", String(gridHelper.visible));
            }

            if (action === "spin") {
                controls.autoRotate = !controls.autoRotate;
                button.setAttribute("aria-pressed", String(controls.autoRotate));
            }

            if (action === "material") {
                clayMode = !clayMode;
                applyMaterials();
                button.setAttribute("aria-pressed", String(clayMode));
            }

            if (action === "explode") {
                explodeTarget = explodeTarget ? 0 : 1;
                button.setAttribute("aria-pressed", String(Boolean(explodeTarget)));
                if (prefersReducedMotion) {
                    explodeNow = explodeTarget;
                }
            }

            // Keyboard-operable alternatives to dragging and wheel zoom.
            if (action === "rotate-left" || action === "rotate-right") {
                const angle = (action === "rotate-left" ? -1 : 1) * (Math.PI / 8);
                const offset = camera.position.clone().sub(controls.target);
                offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
                camera.position.copy(controls.target).add(offset);
                controls.update();
            }

            if (action === "zoom-in" || action === "zoom-out") {
                const factor = action === "zoom-in" ? 0.82 : 1.22;
                const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
                camera.position.copy(controls.target).add(offset);
                controls.update();
            }
        });
    });

    viewerRoot.querySelector("[data-action='spin']")?.setAttribute("aria-pressed", String(controls.autoRotate));
    viewerRoot.querySelector("[data-action='material']")?.setAttribute("aria-pressed", String(clayMode));
    viewerRoot.querySelector("[data-action='explode']")?.setAttribute("aria-pressed", "false");

    // Only render while the viewer is on screen.
    if ("IntersectionObserver" in window) {
        new IntersectionObserver((entries) => {
            visible = entries[entries.length - 1].isIntersecting && renderer.domElement.isConnected;
        }).observe(canvasHost);
    }

    window.addEventListener("resize", resize);
    resize();

    const animate = () => {
        window.requestAnimationFrame(animate);
        if (!visible) {
            return;
        }
        if (parts.length && Math.abs(explodeTarget - explodeNow) > 0.001) {
            explodeNow += (explodeTarget - explodeNow) * 0.12;
            parts.forEach((part) => {
                part.mesh.position.y = part.origin.y + part.offset * explodeNow * part.localUnit;
            });
        }
        controls.update();
        renderer.render(scene, camera);
    };

    animate();
}

function createLoadingOverlay() {
    const element = document.createElement("div");
    element.className = "viewer-loading";
    element.innerHTML = `
        <div>
            <strong>Loading 3D model</strong>
            <div class="progress-track"><div class="progress-bar"></div></div>
        </div>
    `;

    const progressBar = element.querySelector(".progress-bar");

    return {
        element,
        setProgress(value) {
            if (progressBar) {
                progressBar.style.width = `${Math.max(0, Math.min(100, value))}%`;
            }
        }
    };
}

/* ---------- Player card ----------
   The trading card on the home page tilts toward the pointer and flips to show
   its back. The flip button carries the state for assistive tech. */

function initPlayerCard() {
    document.querySelectorAll(".player-card").forEach((card) => {
        // The flip button sits beside the card, so it stays put while the card turns.
        const flip = card.parentElement?.querySelector(".player-card-flip");
        const faces = card.querySelectorAll(".player-face");

        const setFlipped = (flipped) => {
            card.classList.toggle("is-flipped", flipped);
            flip?.setAttribute("aria-pressed", String(flipped));
            faces.forEach((face) => {
                const isBack = face.classList.contains("back");
                face.setAttribute("aria-hidden", String(isBack ? !flipped : flipped));
            });
        };

        flip?.addEventListener("click", (event) => {
            event.stopPropagation();
            setFlipped(!card.classList.contains("is-flipped"));
        });
        card.querySelector(".player-card-body")?.addEventListener("click", () => setFlipped(!card.classList.contains("is-flipped")));
        setFlipped(false);

        if (prefersReducedMotion || !finePointer) {
            return;
        }

        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            card.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
            card.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
            card.style.setProperty("--mx", `${x * 100}%`);
            card.style.setProperty("--my", `${y * 100}%`);
            card.classList.add("is-tilting");
        });

        card.addEventListener("pointerleave", () => {
            card.style.setProperty("--ry", "0deg");
            card.style.setProperty("--rx", "0deg");
            card.classList.remove("is-tilting");
        });
    });
}

/* ---------- Ticker ----------
   Duplicates the item list once so the scoreboard loop has no gap. The copy is
   hidden from assistive tech; with reduced motion the band simply scrolls. */

function initTicker() {
    document.querySelectorAll(".ticker-track").forEach((track) => {
        const clone = track.querySelector(".ticker-items")?.cloneNode(true);
        if (!clone) {
            return;
        }
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
    });
}

/* ---------- Hotspots ----------
   Pins over a product image and the numbered list under it highlight each other,
   so the callout text always lives in the list (readable on phones and by
   screen readers) and the pins just point at the spot. */

function initHotspots() {
    document.querySelectorAll(".hotspots").forEach((root) => {
        const items = [...root.querySelectorAll("[data-hotspot]")];

        const activate = (id, on) => {
            items.forEach((item) => {
                if (item.dataset.hotspot === id) {
                    item.classList.toggle("is-active", on);
                }
            });
        };

        items.forEach((item) => {
            const id = item.dataset.hotspot;
            item.addEventListener("pointerenter", () => activate(id, true));
            item.addEventListener("pointerleave", () => activate(id, false));
            item.addEventListener("focusin", () => activate(id, true));
            item.addEventListener("focusout", () => activate(id, false));
        });

        root.querySelectorAll(".hotspot-pin").forEach((pin) => {
            pin.addEventListener("click", () => {
                const target = root.querySelector(`.hotspot-list [data-hotspot="${pin.dataset.hotspot}"]`);
                if (!target) {
                    return;
                }
                items.forEach((item) => item.classList.remove("is-active"));
                activate(pin.dataset.hotspot, true);
                if (!finePointer) {
                    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
                }
            });
        });
    });
}

/* ---------- Presentation decks ----------
   A horizontal strip of slide images with previous/next buttons and a counter.
   Slides are ordinary zoomable media slots, so the lightbox can page through them. */

function initDecks() {
    document.querySelectorAll(".deck").forEach((deck) => {
        const track = deck.querySelector(".deck-track");
        const slides = [...deck.querySelectorAll(".deck-slide")];
        const counter = deck.querySelector(".deck-count");
        const prev = deck.querySelector("[data-deck='prev']");
        const next = deck.querySelector("[data-deck='next']");

        if (!track || !slides.length) {
            return;
        }

        const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
        const current = () => Math.round(track.scrollLeft / (step() || 1));

        const update = () => {
            const i = Math.min(slides.length - 1, Math.max(0, current()));
            if (counter) {
                counter.textContent = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
            }
            if (prev) {
                prev.disabled = track.scrollLeft <= 2;
            }
            if (next) {
                next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
            }
        };

        const go = (dir) => {
            track.scrollBy({ left: dir * step(), behavior: prefersReducedMotion ? "auto" : "smooth" });
        };

        prev?.addEventListener("click", () => go(-1));
        next?.addEventListener("click", () => go(1));

        let ticking = false;
        track.addEventListener("scroll", () => {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(() => {
                    update();
                    ticking = false;
                });
            }
        });
        window.addEventListener("resize", update);
        update();
    });
}

/* ---------- Scroll progress ----------
   A thin bar under the header on case-study pages, filled in the project's colourway. */

function initScrollProgress() {
    const bar = document.querySelector(".scroll-progress span");
    if (!bar) {
        return;
    }

    let ticking = false;
    const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    }, { passive: true });
    update();
}

/* ---------- Footer ---------- */

function initFooterYear() {
    document.querySelectorAll("[data-year]").forEach((node) => {
        node.textContent = String(new Date().getFullYear());
    });
}
