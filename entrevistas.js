/* =========================================================
   DESORDEN SOCIAL — ENTREVISTAS
   entrevistas.js

   - datamosh canvas en escritorio / resto de móviles
   - versión iOS sin canvas, estable para Safari/Chrome iPhone
   - scroll de "let's talk to each other"
   - chat Supabase
   - sesión DesordenUser
   - cursor personalizado
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const section = document.getElementById("interviewsScroll");
    const talk = document.getElementById("talkBlock");
    const canvas = document.getElementById("faceCanvas");
    const faceSource = document.getElementById("faceSource");
    const cursor = document.getElementById("siteCursor");
    const stream = document.getElementById("conversationStream");
    const form = document.getElementById("conversationForm");
    const messageInput = document.getElementById("chatMessage");
    const websiteField = document.getElementById("websiteField");


    /* =====================================================
       ESTADO
    ===================================================== */

    let currentUser = null;
    let currentUsername = null;
    let realtimeChannel = null;
    let fallbackFaceVisible = false;
    let scrollAnimationFrame = null;


    /* =====================================================
       DISPOSITIVO / iOS
    ===================================================== */

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (
            navigator.platform === "MacIntel" &&
            navigator.maxTouchPoints > 1
        );

    if (isIOS) {
        document.documentElement.classList.add("is-ios");
    }

    let iosFaceStage = null;
    let iosFaceSlices = [];

    let hasSuccessfulCanvasFrame = false;
    let lastMobileGlitchStep = -1;


    /* =====================================================
       BACKUP DEL ÚLTIMO FRAME BUENO DEL CANVAS
       (solo para navegadores que sí usan canvas)
    ===================================================== */

    const backupCanvas = document.createElement("canvas");
    const backupCtx = backupCanvas.getContext("2d");


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getDb() {
        return window.db || null;
    }

    function getFaceTransform(progress) {
        const faceStart = 9;
        const faceEnd = -36;

        const faceY =
            faceStart +
            (faceEnd - faceStart) * progress;

        return `translateX(-50%) translateY(${faceY}vh)`;
    }


    /* =====================================================
       CANVAS / DATAMOSH — ESCRITORIO Y NO-iOS
    ===================================================== */

    let ctx = null;

    if (canvas && !isIOS) {
        ctx = canvas.getContext(
            "2d",
            { willReadFrequently: true }
        );
    }


    /* =====================================================
       CARA GLITCH ESTABLE — iPHONE / iOS

       iOS NO usa canvas.
       La imagen fuente original permanece oculta.
       Creamos una base muy intervenida + 7 bandas.
    ===================================================== */

    function setupIOSFace() {
        if (!isIOS || !faceSource) {
            return;
        }

        const faceWrap = document.getElementById("faceWrap");

        if (!faceWrap) {
            return;
        }

        if (canvas) {
            canvas.style.display = "none";
        }

        faceSource.style.display = "none";

        iosFaceStage = document.createElement("div");
        iosFaceStage.className = "ios-face-stage";
        iosFaceStage.style.transform = getFaceTransform(0);

        const base = faceSource.cloneNode(true);
        base.removeAttribute("id");
        base.className = "ios-face-base";
        base.setAttribute("aria-hidden", "true");

        iosFaceStage.appendChild(base);

        const bands = [
            { top: 4,  height: 9 },
            { top: 16, height: 12 },
            { top: 31, height: 8 },
            { top: 43, height: 13 },
            { top: 59, height: 9 },
            { top: 72, height: 12 },
            { top: 87, height: 8 }
        ];

        bands.forEach((band, index) => {
            const slice = document.createElement("div");
            slice.className = "ios-face-slice";
            slice.style.setProperty("--slice-top", `${band.top}%`);
            slice.style.setProperty("--slice-height", `${band.height}%`);
            slice.style.setProperty("--slice-offset", `${-band.top}%`);

            const image = faceSource.cloneNode(true);
            image.removeAttribute("id");
            image.className = "ios-face-slice-image";
            image.setAttribute("aria-hidden", "true");

            slice.appendChild(image);
            iosFaceStage.appendChild(slice);

            iosFaceSlices.push({
                element: slice,
                index
            });
        });

        faceWrap.appendChild(iosFaceStage);
    }

    setupIOSFace();


    /* =====================================================
       FALLBACK DEL CANVAS — SOLO NO-iOS
    ===================================================== */

    function hideFaceFallback() {
        if (!faceSource || isIOS) {
            return;
        }

        fallbackFaceVisible = false;

        faceSource.style.display = "";
        faceSource.style.position = "";
        faceSource.style.left = "";
        faceSource.style.top = "";
        faceSource.style.width = "";
        faceSource.style.height = "";
        faceSource.style.transform = "";
        faceSource.style.mixBlendMode = "";
        faceSource.style.opacity = "";
        faceSource.style.pointerEvents = "";
        faceSource.style.zIndex = "";
        faceSource.classList.remove("face-fallback-visible");

        if (canvas) {
            canvas.style.opacity = "";
        }
    }

    function showFaceFallback(progress = 0) {
        if (!faceSource || !canvas || isIOS) {
            return;
        }

        fallbackFaceVisible = true;

        const canvasStyles = window.getComputedStyle(canvas);
        const rect = canvas.getBoundingClientRect();

        faceSource.classList.add("face-fallback-visible");
        faceSource.style.display = "block";
        faceSource.style.position = "absolute";
        faceSource.style.left = "50%";
        faceSource.style.top = canvasStyles.top || "10vh";
        faceSource.style.width = `${Math.max(1, Math.round(rect.width))}px`;
        faceSource.style.height = "auto";
        faceSource.style.transform = getFaceTransform(progress);
        faceSource.style.mixBlendMode = "multiply";
        faceSource.style.opacity = "0.9";
        faceSource.style.pointerEvents = "none";
        faceSource.style.zIndex = "1";

        canvas.style.opacity = "0";
    }

    function canvasContainsVisibleFace(imageData) {
        if (!imageData?.data?.length) {
            return false;
        }

        const pixels = imageData.data;
        const step = 4 * 31;

        for (let i = 0; i < pixels.length; i += step) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            if (
                a > 0 &&
                (
                    Math.abs(r - 236) +
                    Math.abs(g - 239) +
                    Math.abs(b - 49)
                ) > 18
            ) {
                return true;
            }
        }

        return false;
    }

    function drawSourceIntoCanvas(cw, ch) {
        if (!ctx || !faceSource) {
            return false;
        }

        const iw = Number(faceSource.naturalWidth) || 0;
        const ih = Number(faceSource.naturalHeight) || 0;

        try {
            if (iw > 0 && ih > 0) {
                const sourceRatio = iw / ih;
                const targetRatio = cw / ch;

                let sx = 0;
                let sy = 0;
                let sw = iw;
                let sh = ih;

                if (sourceRatio > targetRatio) {
                    sw = ih * targetRatio;
                    sx = (iw - sw) / 2;
                } else {
                    sh = iw / targetRatio;
                    sy = (ih - sh) / 2;
                }

                ctx.drawImage(
                    faceSource,
                    sx, sy, sw, sh,
                    0, 0, cw, ch
                );
            } else {
                ctx.drawImage(faceSource, 0, 0, cw, ch);
            }

            const probe = ctx.getImageData(0, 0, cw, ch);
            return canvasContainsVisibleFace(probe);

        } catch (error) {
            console.warn(
                "No se pudo rasterizar face.svg en el canvas:",
                error
            );
            return false;
        }
    }


    /* =====================================================
       DIBUJO DATAMOSH — NO-iOS
    ===================================================== */

    function drawDatamosh(progress = 0) {
        if (isIOS) {
            return;
        }

        if (!canvas || !ctx || !faceSource || !faceSource.complete) {
            return;
        }

        if (isTouchDevice) {
            const mobileStep = Math.round(progress * 45);

            if (mobileStep === lastMobileGlitchStep) {
                return;
            }

            lastMobileGlitchStep = mobileStep;
        }

        const rect = canvas.getBoundingClientRect();

        const displayWidth = Math.max(
            1,
            rect.width || canvas.clientWidth || 800
        );

        const displayHeight = Math.round(displayWidth * 1.34);

        const internalScale = window.matchMedia("(max-width: 640px)").matches
            ? 0.48
            : 0.43;

        const cw = Math.max(
            240,
            Math.round(displayWidth * internalScale)
        );

        const ch = Math.max(
            330,
            Math.round(displayHeight * internalScale)
        );

        if (canvas.width !== cw) {
            canvas.width = cw;
        }

        if (canvas.height !== ch) {
            canvas.height = ch;
        }

        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, cw, ch);

        ctx.fillStyle = "#ecef31";
        ctx.fillRect(0, 0, cw, ch);

        const sourceWasDrawn = drawSourceIntoCanvas(cw, ch);

        if (!sourceWasDrawn) {
            if (
                hasSuccessfulCanvasFrame &&
                backupCanvas.width > 0 &&
                backupCanvas.height > 0
            ) {
                ctx.clearRect(0, 0, cw, ch);
                ctx.drawImage(
                    backupCanvas,
                    0, 0,
                    backupCanvas.width,
                    backupCanvas.height,
                    0, 0,
                    cw, ch
                );

                hideFaceFallback();
                canvas.style.opacity = "0.98";
                return;
            }

            showFaceFallback(progress);
            return;
        }

        hasSuccessfulCanvasFrame = true;
        hideFaceFallback();

        let imageData = null;

        try {
            imageData = ctx.getImageData(0, 0, cw, ch);
        } catch (error) {
            console.warn(
                "El navegador no pudo leer un frame del canvas:",
                error
            );

            if (
                hasSuccessfulCanvasFrame &&
                backupCanvas.width > 0 &&
                backupCanvas.height > 0
            ) {
                ctx.clearRect(0, 0, cw, ch);
                ctx.drawImage(
                    backupCanvas,
                    0, 0,
                    backupCanvas.width,
                    backupCanvas.height,
                    0, 0,
                    cw, ch
                );

                hideFaceFallback();
                canvas.style.opacity = "0.98";
                return;
            }

            showFaceFallback(progress);
            return;
        }

        const pixels = imageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            const luminance = (
                0.299 * r +
                0.587 * g +
                0.114 * b
            ) / 255;

            const darkness = Math.pow(1 - luminance, 0.78);

            pixels[i] = 236 - darkness * 21;
            pixels[i + 1] = 239 - darkness * 181;
            pixels[i + 2] = 49 - darkness * 2;
            pixels[i + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);

        const intensity = 0.65 + progress * 0.75;
        const slices = Math.floor(18 + progress * 28);
        const maxShift = Math.max(
            1,
            Math.floor(cw * 0.10 * intensity)
        );

        for (let i = 0; i < slices; i++) {
            const sliceHeight = Math.max(
                1,
                Math.floor(5 + Math.random() * ch * 0.07)
            );

            const y = Math.floor(
                Math.random() * Math.max(1, ch - sliceHeight)
            );

            const shift = Math.floor(
                Math.random() * maxShift * 2 - maxShift
            );

            try {
                const slice = ctx.getImageData(
                    0,
                    y,
                    cw,
                    sliceHeight
                );

                ctx.putImageData(slice, shift, y);
            } catch (error) {
                // Ignoramos únicamente el bloque inválido.
            }
        }

        const fragments = Math.floor(35 + progress * 55);

        for (let i = 0; i < fragments; i++) {
            const width = Math.floor(5 + Math.random() * 28);
            const height = Math.floor(4 + Math.random() * 25);

            const x = Math.floor(
                Math.random() * Math.max(1, cw - width)
            );

            const y = Math.floor(
                Math.random() * Math.max(1, ch - height)
            );

            try {
                const fragment = ctx.getImageData(
                    x,
                    y,
                    width,
                    height
                );

                const offsetX = Math.floor(
                    (Math.random() - 0.5) * maxShift * 2
                );

                const offsetY = Math.floor(
                    (Math.random() - 0.5) * 20
                );

                ctx.putImageData(
                    fragment,
                    x + offsetX,
                    y + offsetY
                );
            } catch (error) {
                // Ignoramos únicamente el fragmento inválido.
            }
        }

        const blocks = Math.floor(28 + progress * 55);

        for (let i = 0; i < blocks; i++) {
            const size = Math.floor(3 + Math.random() * 14);

            const x = Math.floor(
                Math.random() * Math.max(1, cw - size)
            );

            const y = Math.floor(
                Math.random() * Math.max(1, ch - size)
            );

            ctx.fillStyle = Math.random() > 0.5
                ? "#d73a2f"
                : "#ecef31";

            ctx.globalAlpha = 0.32 + Math.random() * 0.35;
            ctx.fillRect(x, y, size, size);
        }

        ctx.globalAlpha = 1;

        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = "#d73a2f";

        for (let y = 0; y < ch; y += 4) {
            ctx.fillRect(0, y, cw, 1);
        }

        ctx.restore();

        if (isTouchDevice && backupCtx) {
            if (
                backupCanvas.width !== cw ||
                backupCanvas.height !== ch
            ) {
                backupCanvas.width = cw;
                backupCanvas.height = ch;
            }

            backupCtx.clearRect(0, 0, cw, ch);
            backupCtx.drawImage(canvas, 0, 0);
        }
    }


    /* =====================================================
       iOS — MOVIMIENTO DE LAS BANDAS
    ===================================================== */

    function updateIOSFace(progress, faceTransform) {
        if (!iosFaceStage) {
            return;
        }

        iosFaceStage.style.transform = faceTransform;

        const intensity = 12 + progress * 38;

        iosFaceSlices.forEach(({ element, index }) => {
            const phase = (index + 1) * 1.73;
            const direction = index % 2 === 0 ? 1 : -1;

            const shiftX =
                Math.sin(progress * 33 + phase) *
                intensity *
                direction;

            const shiftY =
                Math.cos(progress * 21 + phase) *
                (2 + progress * 6);

            const scaleX =
                1 +
                Math.sin(progress * 18 + phase) *
                0.035;

            element.style.transform =
                `translate3d(${shiftX}px, ${shiftY}px, 0) ` +
                `scaleX(${scaleX})`;
        });
    }


    /* =====================================================
       SCROLL
    ===================================================== */

    function updateScroll() {
        scrollAnimationFrame = null;

        if (!section || !talk) {
            return;
        }

        const rect = section.getBoundingClientRect();

        const maxScroll = Math.max(
            0,
            section.offsetHeight - window.innerHeight
        );

        const current = clamp(
            -rect.top,
            0,
            maxScroll
        );

        const progress = maxScroll > 0
            ? current / maxScroll
            : 0;

        const faceTransform = getFaceTransform(progress);

        if (isIOS) {
            updateIOSFace(progress, faceTransform);
        } else if (canvas) {
            canvas.style.transform = faceTransform;

            if (fallbackFaceVisible && faceSource) {
                faceSource.style.transform = faceTransform;
            }
        }

        const startTop = window.innerHeight * 0.06;
        const bottomSpace = window.innerHeight * 0.05;
        const textHeight = talk.offsetHeight;

        const finalTop =
            window.innerHeight -
            textHeight -
            bottomSpace;

        const totalTravel = Math.max(
            0,
            finalTop - startTop
        );

        talk.style.transform =
            `translateY(${totalTravel * progress}px)`;

        talk.style.opacity = "1";

        drawDatamosh(progress);
    }

    function requestScrollUpdate() {
        if (scrollAnimationFrame !== null) {
            return;
        }

        scrollAnimationFrame = requestAnimationFrame(updateScroll);
    }

    window.addEventListener(
        "scroll",
        requestScrollUpdate,
        { passive: true }
    );

    window.addEventListener("resize", requestScrollUpdate);
    window.addEventListener("orientationchange", requestScrollUpdate);
    window.addEventListener("pageshow", requestScrollUpdate);


    /* =====================================================
       CARGA DE LA IMAGEN
    ===================================================== */

    if (faceSource) {
        const startFace = async () => {
            if (isIOS) {
                requestScrollUpdate();
                return;
            }

            if (typeof faceSource.decode === "function") {
                try {
                    await faceSource.decode();
                } catch (error) {
                    // load / complete siguen siendo suficientes.
                }
            }

            requestScrollUpdate();
        };

        if (faceSource.complete) {
            await startFace();
        } else {
            faceSource.addEventListener(
                "load",
                startFace,
                { once: true }
            );

            faceSource.addEventListener(
                "error",
                () => {
                    console.error(
                        "No se pudo cargar la imagen de la cara:",
                        faceSource.currentSrc || faceSource.src
                    );
                },
                { once: true }
            );
        }
    }

    requestScrollUpdate();


    /* =====================================================
       IDENTIDAD — @ + CONTRASEÑA
    ===================================================== */

    async function loadBeeUser() {
        currentUser = null;
        currentUsername = null;

        if (window.DesordenUser) {
            try {
                const user = await window.DesordenUser.getCurrentUser();

                if (!user || user.is_anonymous) {
                    return false;
                }

                const profile = await window.DesordenUser.getProfile();

                if (!profile?.username) {
                    return false;
                }

                currentUser = user;
                currentUsername = profile.username;

                return true;

            } catch (error) {
                console.error(
                    "Error leyendo la sesión de DesordenUser:",
                    error
                );
                return false;
            }
        }

        const db = getDb();

        if (!db) {
            console.warn(
                "Supabase no está disponible en entrevistas.js"
            );
            return false;
        }

        const {
            data: sessionData,
            error: sessionError
        } = await db.auth.getSession();

        if (sessionError) {
            console.error(
                "Error recuperando sesión:",
                sessionError
            );
            return false;
        }

        const user = sessionData?.session?.user || null;

        if (!user || user.is_anonymous) {
            return false;
        }

        const {
            data: profile,
            error: profileError
        } = await db
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) {
            console.error(
                "Error cargando username:",
                profileError
            );
            return false;
        }

        if (!profile?.username) {
            return false;
        }

        currentUser = user;
        currentUsername = profile.username;

        return true;
    }

    window.addEventListener(
        "desorden:user-ready",
        () => {
            loadBeeUser();
        }
    );


    /* =====================================================
       CHAT — POSICIÓN DE LOS MENSAJES
    ===================================================== */

    function messageOffset(seed) {
        const value = String(seed);
        let hash = 0;

        for (let i = 0; i < value.length; i++) {
            hash = (
                hash * 31 +
                value.charCodeAt(i)
            ) >>> 0;
        }

        const isMobile = window.matchMedia("(max-width: 640px)").matches;

        if (isMobile) {
            const mobilePositions = [
                1,
                23,
                7,
                26,
                12,
                18,
                4,
                21,
                9,
                25,
                15,
                3
            ];

            return mobilePositions[
                hash % mobilePositions.length
            ];
        }

        return 3 + (hash % 50);
    }

    function cleanUsername(username) {
        if (!username) {
            return "@usuario";
        }

        return username.startsWith("@")
            ? username
            : `@${username}`;
    }

    async function getUsernameMap(rows) {
        const map = new Map();
        const db = getDb();

        if (!db || !rows?.length) {
            return map;
        }

        const ids = [
            ...new Set(
                rows
                    .map(row => row.created_by)
                    .filter(Boolean)
            )
        ];

        if (!ids.length) {
            return map;
        }

        const {
            data,
            error
        } = await db
            .from("profiles")
            .select("id,username")
            .in("id", ids);

        if (error) {
            console.error(
                "No se pudieron cargar usernames:",
                error
            );
            return map;
        }

        data?.forEach(profile => {
            map.set(profile.id, profile.username);
        });

        return map;
    }


    /* =====================================================
       RENDER MENSAJE
    ===================================================== */

    function renderMessage(row, username, animate = false) {
        if (!stream) {
            return;
        }

        if (
            stream.querySelector(
                `[data-message-id="${row.id}"]`
            )
        ) {
            return;
        }

        const article = document.createElement("article");
        article.className = "chat-entry";
        article.dataset.messageId = row.id;

        if (animate) {
            article.classList.add("is-new");
        }

        article.style.setProperty(
            "--x",
            `${messageOffset(row.id)}%`
        );

        const nameElement = document.createElement("span");
        nameElement.className = "chat-entry-name";
        nameElement.textContent = cleanUsername(username);

        const messageElement = document.createElement("p");
        messageElement.className = "chat-entry-message";
        messageElement.textContent = row.message || "";

        article.append(nameElement, messageElement);
        stream.appendChild(article);
    }


    /* =====================================================
       CARGAR MENSAJES
    ===================================================== */

    async function loadMessages() {
        const db = getDb();

        if (!db || !stream) {
            return;
        }

        const {
            data: rows,
            error
        } = await db
            .from("interview_chat")
            .select("id,created_by,message,created_at")
            .order("created_at", { ascending: true })
            .limit(100);

        if (error) {
            console.error(
                "Error cargando chat:",
                error
            );
            return;
        }

        stream.innerHTML = "";

        const usernameMap = await getUsernameMap(rows);

        rows.forEach(row => {
            const username =
                row.created_by === currentUser?.id
                    ? currentUsername
                    : usernameMap.get(row.created_by);

            renderMessage(row, username);
        });
    }


    /* =====================================================
       REALTIME
    ===================================================== */

    function startRealtime() {
        const db = getDb();

        if (!db || realtimeChannel) {
            return;
        }

        realtimeChannel = db
            .channel("desorden-interview-chat")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "interview_chat"
                },
                async payload => {
                    const row = payload.new;
                    let username = null;

                    if (row.created_by === currentUser?.id) {
                        username = currentUsername;
                    } else {
                        const {
                            data,
                            error
                        } = await db
                            .from("profiles")
                            .select("username")
                            .eq("id", row.created_by)
                            .maybeSingle();

                        if (error) {
                            console.error(
                                "No se pudo cargar el username del mensaje:",
                                error
                            );
                        }

                        username = data?.username || null;
                    }

                    renderMessage(row, username, true);
                }
            )
            .subscribe();
    }


    /* =====================================================
       TEXTAREA AUTOGROW
    ===================================================== */

    if (messageInput) {
        messageInput.addEventListener("input", () => {
            messageInput.style.height = "auto";
            messageInput.style.height =
                `${Math.min(messageInput.scrollHeight, 180)}px`;
        });
    }


    /* =====================================================
       ENVIAR MENSAJE
    ===================================================== */

    let lastSend = 0;

    if (form) {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            if (websiteField?.value) {
                return;
            }

            const db = getDb();

            if (!db) {
                console.error("Supabase no está conectado.");
                return;
            }

            const message = messageInput?.value.trim();

            if (!message) {
                return;
            }

            const userReady = await loadBeeUser();

            if (!userReady) {
                console.warn(
                    "No se puede enviar: falta iniciar sesión con un @ de Desorden Social."
                );

                if (messageInput) {
                    messageInput.placeholder =
                        "entra primero con tu @ usando la abeja...";
                }

                return;
            }

            const now = Date.now();

            if (now - lastSend < 2500) {
                return;
            }

            lastSend = now;

            const {
                data,
                error
            } = await db
                .from("interview_chat")
                .insert({
                    created_by: currentUser.id,
                    message: message.slice(0, 500)
                })
                .select("id,created_by,message,created_at")
                .single();

            if (error) {
                console.error(
                    "Error enviando mensaje:",
                    error
                );
                return;
            }

            renderMessage(
                data,
                currentUsername,
                true
            );

            messageInput.value = "";
            messageInput.style.height = "auto";
            messageInput.placeholder = "di algo...";
        });
    }


    /* =====================================================
       INICIAR CHAT
    ===================================================== */

    if (getDb()) {
        await loadBeeUser();
        await loadMessages();
        startRealtime();
    } else {
        console.warn(
            "Supabase no está disponible en entrevistas.js. " +
            "Comprueba que supabase-config.js cargue antes."
        );
    }


    /* =====================================================
       CURSOR
    ===================================================== */

    if (
        cursor &&
        window.matchMedia("(hover: hover)").matches
    ) {
        let mouseX = 0;
        let mouseY = 0;
        let cursorFrame = null;

        function paintCursor() {
            cursorFrame = null;
            cursor.style.left = `${mouseX}px`;
            cursor.style.top = `${mouseY}px`;
        }

        document.addEventListener(
            "mousemove",
            event => {
                mouseX = event.clientX;
                mouseY = event.clientY;

                cursor.classList.add("is-visible");

                if (cursorFrame === null) {
                    cursorFrame = requestAnimationFrame(paintCursor);
                }
            },
            { passive: true }
        );

        document.addEventListener("mouseleave", () => {
            cursor.classList.remove("is-visible");
        });
    }
});


/* =========================================================
   ABEJA — SOLO EN LA ZONA DEL CHAT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    const bee = document.getElementById("bee");
    const chatSection = document.querySelector(".conversation-section");

    if (!bee || !chatSection) {
        return;
    }

    function updateBeeVisibility() {
        const chatRect = chatSection.getBoundingClientRect();
        const showBee = chatRect.top <= 0;

        if (showBee) {
            bee.style.opacity = "1";
            bee.style.visibility = "visible";
            bee.style.pointerEvents = "auto";
        } else {
            bee.style.opacity = "0";
            bee.style.visibility = "hidden";
            bee.style.pointerEvents = "none";
        }
    }

    bee.style.opacity = "0";
    bee.style.visibility = "hidden";
    bee.style.pointerEvents = "none";

    window.addEventListener(
        "scroll",
        updateBeeVisibility,
        { passive: true }
    );

    window.addEventListener("resize", updateBeeVisibility);

    updateBeeVisibility();
});
