/* =========================================================
   DESORDEN SOCIAL — nudo.js
   Interior genérico de los nudos creados por visitantes
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const root =
        document.getElementById("nodeDetail");

    if (!root) {
        return;
    }


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function getDb() {
        return window.db || null;
    }


    function safeMetadata(value) {

        if (!value) {
            return {};
        }

        if (
            typeof value ===
            "object"
        ) {
            return value;
        }

        try {
            return JSON.parse(value);
        }
        catch (error) {
            return {};
        }

    }


    function makeText(
        tag,
        className,
        text
    ) {

        const element =
            document.createElement(tag);

        element.className =
            className;

        element.textContent =
            text || "";

        return element;

    }


    function appendFile(
        container,
        attachment
    ) {

        if (
            !attachment ||
            !attachment.url
        ) {
            return;
        }


        const item =
            document.createElement(
                "div"
            );

        item.className =
            "node-detail-media-item";


        if (
            attachment.kind ===
            "image"
        ) {

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                attachment.url;

            image.alt =
                attachment.name ||
                "";

            image.loading =
                "lazy";

            item.appendChild(
                image
            );

        }
        else if (
            attachment.kind ===
            "video"
        ) {

            const video =
                document.createElement(
                    "video"
                );

            video.src =
                attachment.url;

            video.controls =
                true;

            video.playsInline =
                true;

            video.preload =
                "metadata";

            item.appendChild(
                video
            );

        }
        else if (
            attachment.kind ===
            "audio"
        ) {

            const audio =
                document.createElement(
                    "audio"
                );

            audio.src =
                attachment.url;

            audio.controls =
                true;

            audio.preload =
                "metadata";

            item.appendChild(
                audio
            );

        }
        else {

            const link =
                document.createElement(
                    "a"
                );

            link.className =
                "node-detail-file-link";

            link.href =
                attachment.url;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";

            link.textContent =
                attachment.kind === "pdf"
                    ? "abrir PDF ↗"
                    : "abrir archivo ↗";

            item.appendChild(
                link
            );

        }


        if (attachment.name) {

            item.appendChild(
                makeText(
                    "span",
                    "node-detail-file-name",
                    attachment.name
                )
            );

        }


        container.appendChild(
            item
        );

    }


    /* =====================================================
       ENCONTRAR EL NUDO
    ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const slug =
        params.get("slug");

    const id =
        params.get("id");


    if (
        !slug &&
        !id
    ) {

        root.innerHTML =
            "";

        root.appendChild(
            makeText(
                "p",
                "node-detail-error",
                "este nudo no existe"
            )
        );

        return;

    }


    const db =
        getDb();


    if (!db) {

        root.innerHTML =
            "";

        root.appendChild(
            makeText(
                "p",
                "node-detail-error",
                "no puedo abrir el nudo"
            )
        );

        return;

    }


    let query =
        db
            .from("nodes")
            .select("*")
            .eq(
                "is_published",
                true
            );


    if (slug) {

        query =
            query.eq(
                "slug",
                slug
            );

    }
    else {

        query =
            query.eq(
                "id",
                id
            );

    }


    const {
        data: node,
        error
    } =
        await query
            .maybeSingle();


    if (
        error ||
        !node
    ) {

        console.error(
            "No se pudo abrir el nudo:",
            error
        );

        root.innerHTML =
            "";

        root.appendChild(
            makeText(
                "p",
                "node-detail-error",
                "no encuentro este nudo"
            )
        );

        return;

    }


    /* =====================================================
       AUTOR
    ===================================================== */

    let username =
        null;


    if (node.created_by) {

        const {
            data: profile
        } =
            await db
                .from("profiles")
                .select("username")
                .eq(
                    "id",
                    node.created_by
                )
                .maybeSingle();


        username =
            profile?.username ||
            null;

    }


    /* =====================================================
       RENDER
    ===================================================== */

    root.innerHTML =
        "";


    document.title =
        `${node.title || "Nudo"} — Desorden Social`;


    const header =
        document.createElement(
            "header"
        );

    header.className =
        "node-detail-header";


    header.appendChild(
        makeText(
            "p",
            "node-detail-kicker",
            "DESORDEN SOCIAL / NUDO"
        )
    );


    header.appendChild(
        makeText(
            "h1",
            "node-detail-title",
            node.title ||
            "sin título"
        )
    );


    if (username) {

        header.appendChild(
            makeText(
                "p",
                "node-detail-author",
                `dejado por @${username}`
            )
        );

    }


    root.appendChild(
        header
    );


    if (node.media_url) {

        const cover =
            document.createElement(
                "img"
            );

        cover.className =
            "node-detail-cover";

        cover.src =
            node.media_url;

        cover.alt =
            node.title ||
            "";

        root.appendChild(
            cover
        );

    }


    if (node.body) {

        root.appendChild(
            makeText(
                "div",
                "node-detail-body",
                node.body
            )
        );

    }


    if (node.reason) {

        const reason =
            document.createElement(
                "section"
            );

        reason.className =
            "node-detail-reason";

        reason.appendChild(
            makeText(
                "p",
                "node-detail-reason-label",
                "por qué está aquí"
            )
        );

        reason.appendChild(
            makeText(
                "p",
                "",
                node.reason
            )
        );

        root.appendChild(
            reason
        );

    }


    const metadata =
        safeMetadata(
            node.metadata
        );

    const attachments =
        Array.isArray(
            metadata.attachments
        )
            ? metadata.attachments
            : [];


    if (attachments.length) {

        root.appendChild(
            makeText(
                "p",
                "node-detail-files-label",
                "contenido"
            )
        );


        const media =
            document.createElement(
                "section"
            );

        media.className =
            "node-detail-media";


        attachments
            .forEach(
                attachment => {
                    appendFile(
                        media,
                        attachment
                    );
                }
            );


        root.appendChild(
            media
        );

    }


    if (node.external_url) {

        const wrap =
            document.createElement(
                "div"
            );

        wrap.className =
            "node-detail-external-wrap";


        const link =
            document.createElement(
                "a"
            );

        link.className =
            "node-detail-external";

        link.href =
            node.external_url;

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

        link.textContent =
            "ir al enlace original ↗";


        wrap.appendChild(
            link
        );


        root.appendChild(
            wrap
        );

    }

});


/* =========================================================
   CURSOR PERSONALIZADO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const cursor =
        document.getElementById(
            "siteCursor"
        );

    if (
        !cursor ||
        !window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches
    ) {
        return;
    }


    let mouseX = 0;
    let mouseY = 0;
    let cursorFrame = null;


    function paintCursor() {

        cursorFrame = null;

        cursor.style.left =
            `${mouseX}px`;

        cursor.style.top =
            `${mouseY}px`;

    }


    document.addEventListener(
        "mousemove",
        event => {

            mouseX =
                event.clientX;

            mouseY =
                event.clientY;

            cursor.classList.add(
                "is-visible"
            );

            if (
                cursorFrame === null
            ) {

                cursorFrame =
                    requestAnimationFrame(
                        paintCursor
                    );

            }

        },
        {
            passive: true
        }
    );


    document.addEventListener(
        "mouseleave",
        () => {

            cursor.classList.remove(
                "is-visible"
            );

        }
    );

});
