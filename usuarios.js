/* =========================================================
   DESORDEN SOCIAL
   BIBLIOTECA DE USUARIOS
========================================================= */

(() => {

    const $ =
        selector =>
            document.querySelector(
                selector
            );


    const form =
        $("#userSearchForm");

    const input =
        $("#userSearchInput");

    const suggestions =
        $("#userSuggestions");

    const message =
        $("#libraryMessage");

    const archive =
        $("#userArchive");

    const archiveUsername =
        $("#archiveUsername");

    const archiveCount =
        $("#archiveCount");

    const gallery =
        $("#userGallery");

    const peopleIndexList =
        $("#peopleIndexList");


    const viewer =
        $("#contributionViewer");

    const viewerUser =
        $("#viewerUser");

    const viewerType =
        $("#viewerType");

    const viewerTitle =
        $("#viewerTitle");

    const viewerCover =
        $("#viewerCover");

    const viewerBody =
        $("#viewerBody");

    const viewerAttachments =
        $("#viewerAttachments");

    const viewerExternal =
        $("#viewerExternal");


    let suggestionTimer =
        null;


    /* =====================================================
       AYUDAS
    ===================================================== */

    function normalizeUsername(
        value
    ) {

        return String(
            value || ""
        )
            .trim()
            .replace(
                /^@+/,
                ""
            )
            .toLowerCase();

    }


    function safeSearchValue(
        value
    ) {

        return normalizeUsername(
            value
        )
            .replace(
                /[%_]/g,
                ""
            );

    }


    function getMetadata(
        node
    ) {

        if (!node?.metadata) {
            return {};
        }


        if (
            typeof node.metadata ===
            "object"
        ) {
            return node.metadata;
        }


        try {

            return JSON.parse(
                node.metadata
            );

        }
        catch (error) {

            return {};

        }

    }


    function getAttachments(
        node
    ) {

        const metadata =
            getMetadata(
                node
            );


        return Array.isArray(
            metadata.attachments
        )
            ? metadata.attachments
            : [];

    }


    function getSubmissionType(
        node
    ) {

        const metadata =
            getMetadata(
                node
            );


        return (
            metadata.submission_type ||
            node.content_type ||
            "aportación"
        );

    }


    function getCardImage(
        node
    ) {

        if (
            node.media_url
        ) {
            return node.media_url;
        }


        const image =
            getAttachments(
                node
            )
                .find(
                    attachment =>
                        attachment.type ===
                        "image"
                );


        return image?.url ||
            null;

    }


    function makeExcerpt(
        value
    ) {

        const clean =
            String(
                value || ""
            )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


        if (!clean) {
            return "";
        }


        return clean.length > 125
            ? `${clean.slice(0, 125)}…`
            : clean;

    }


    /* =====================================================
       CARGAR TODOS LOS USUARIOS
       PARA LA NUBE INFERIOR
    ===================================================== */

    async function getAllProfiles() {

        if (!window.db) {
            return [];
        }


        const allProfiles =
            [];

        const pageSize =
            1000;

        let from =
            0;


        while (true) {

            const {
                data,
                error
            } =
                await window.db
                    .from(
                        "profiles"
                    )
                    .select(
                        "id, username"
                    )
                    .order(
                        "username",
                        {
                            ascending:
                                true
                        }
                    )
                    .range(
                        from,
                        from +
                            pageSize -
                            1
                    );


            if (error) {
                throw error;
            }


            const page =
                data || [];


            allProfiles.push(
                ...page
            );


            if (
                page.length <
                pageSize
            ) {
                break;
            }


            from +=
                pageSize;

        }


        return allProfiles;

    }


    async function loadPeopleIndex() {

        if (
            !peopleIndexList ||
            !window.db
        ) {
            return;
        }


        try {

            const profiles =
                await getAllProfiles();


            peopleIndexList.innerHTML =
                "";


            profiles.forEach(
                profile => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";

                    button.className =
                        "people-index-user";

                    button.textContent =
                        `@${profile.username}`;


                    button.addEventListener(
                        "click",
                        () => {

                            input.value =
                                profile.username;

                            openUser(
                                profile.username
                            );

                        }
                    );


                    peopleIndexList
                        .appendChild(
                            button
                        );

                }
            );

        }
        catch (error) {

            console.error(
                "Error cargando usuarios:",
                error
            );

        }

    }


    /* =====================================================
       SUGERENCIAS AL ESCRIBIR
    ===================================================== */

    async function loadSuggestions() {

        if (!window.db) {
            return;
        }


        const query =
            safeSearchValue(
                input?.value
            );


        if (!query) {

            suggestions.hidden =
                true;

            suggestions.innerHTML =
                "";

            return;
        }


        const {
            data,
            error
        } =
            await window.db
                .from(
                    "profiles"
                )
                .select(
                    "id, username"
                )
                .ilike(
                    "username",
                    `${query}%`
                )
                .limit(
                    8
                );


        if (error) {

            console.error(
                "Error buscando usuarios:",
                error
            );

            suggestions.hidden =
                true;

            return;
        }


        suggestions.innerHTML =
            "";


        if (!data?.length) {

            suggestions.hidden =
                true;

            return;
        }


        data.forEach(
            profile => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";

                button.className =
                    "user-suggestion";

                button.textContent =
                    `@${profile.username}`;


                button.addEventListener(
                    "click",
                    () => {

                        input.value =
                            profile.username;

                        suggestions.hidden =
                            true;

                        openUser(
                            profile.username
                        );

                    }
                );


                suggestions
                    .appendChild(
                        button
                    );

            }
        );


        suggestions.hidden =
            false;

    }


    input
        ?.addEventListener(
            "input",
            () => {

                clearTimeout(
                    suggestionTimer
                );


                suggestionTimer =
                    setTimeout(
                        loadSuggestions,
                        150
                    );

            }
        );


    /* =====================================================
       BUSCAR PERFIL
    ===================================================== */

    async function findProfile(
        rawUsername
    ) {

        const username =
            normalizeUsername(
                rawUsername
            );


        if (!username) {
            return null;
        }


        const {
            data,
            error
        } =
            await window.db
                .from(
                    "profiles"
                )
                .select(
                    "id, username"
                )
                .ilike(
                    "username",
                    username
                )
                .limit(
                    1
                );


        if (error) {
            throw error;
        }


        return data?.[0] ||
            null;

    }


    /* =====================================================
       APORTACIONES DE ESE USUARIO
    ===================================================== */

    async function loadUserNodes(
        profileId
    ) {

        const {
            data,
            error
        } =
            await window.db
                .from(
                    "nodes"
                )
                .select(
                    `
                    id,
                    slug,
                    title,
                    content_type,
                    body,
                    media_url,
                    external_url,
                    metadata,
                    created_by
                    `
                )
                .eq(
                    "created_by",
                    profileId
                )
                .eq(
                    "is_published",
                    true
                );


        if (error) {
            throw error;
        }


        return data || [];

    }


    /* =====================================================
       DIBUJAR GALERÍA
    ===================================================== */

    function renderGallery(
        profile,
        nodes
    ) {

        archiveUsername.textContent =
            `@${profile.username}`;


        archiveCount.textContent =
            String(
                nodes.length
            );


        gallery.innerHTML =
            "";


        if (!nodes.length) {

            const empty =
                document.createElement(
                    "p"
                );


            empty.className =
                "empty-user-gallery";

            empty.textContent =
                "todavía no ha dejado nada aquí";


            gallery.appendChild(
                empty
            );


            archive.hidden =
                false;

            return;
        }


        nodes.forEach(
            (node, index) => {

                const card =
                    document.createElement(
                        "button"
                    );


                card.type =
                    "button";

                card.className =
                    "contribution-card";

                card.dataset.nodeId =
                    node.id;


                const media =
                    document.createElement(
                        "div"
                    );


                media.className =
                    "card-media";


                const imageUrl =
                    getCardImage(
                        node
                    );


                if (imageUrl) {

                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        imageUrl;

                    image.alt =
                        "";


                    media.appendChild(
                        image
                    );

                }
                else {

                    const placeholder =
                        document.createElement(
                            "div"
                        );


                    placeholder.className =
                        "card-placeholder";

                    placeholder.textContent =
                        String(
                            index + 1
                        )
                            .padStart(
                                2,
                                "0"
                            );


                    media.appendChild(
                        placeholder
                    );

                }


                const type =
                    document.createElement(
                        "p"
                    );


                type.className =
                    "card-type";

                type.textContent =
                    getSubmissionType(
                        node
                    );


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    node.title ||
                    "sin título";


                card.appendChild(
                    media
                );

                card.appendChild(
                    type
                );

                card.appendChild(
                    title
                );


                const excerptText =
                    makeExcerpt(
                        node.body
                    );


                if (
                    excerptText
                ) {

                    const excerpt =
                        document.createElement(
                            "p"
                        );


                    excerpt.className =
                        "card-excerpt";

                    excerpt.textContent =
                        excerptText;


                    card.appendChild(
                        excerpt
                    );

                }


                card.addEventListener(
                    "click",
                    () => {

                        openViewer(
                            profile,
                            node
                        );

                    }
                );


                gallery.appendChild(
                    card
                );

            }
        );


        archive.hidden =
            false;

    }


    /* =====================================================
       VISOR
    ===================================================== */

    function closeViewer() {

        viewer.classList
            .remove(
                "is-open"
            );


        viewer.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style
            .overflow =
            "";

    }


    function appendAttachment(
        attachment
    ) {

        if (
            !attachment ||
            !attachment.url
        ) {
            return;
        }


        if (
            attachment.type ===
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


            viewerAttachments
                .appendChild(
                    image
                );

            return;
        }


        if (
            attachment.type ===
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

            video.preload =
                "metadata";


            viewerAttachments
                .appendChild(
                    video
                );

            return;
        }


        const link =
            document.createElement(
                "a"
            );


        link.className =
            "viewer-file-link";

        link.href =
            attachment.url;

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

        link.textContent =
            attachment.name
                ? `abrir ${attachment.name} ↗`
                : "abrir archivo ↗";


        viewerAttachments
            .appendChild(
                link
            );

    }


    function openViewer(
        profile,
        node
    ) {

        viewerUser.textContent =
            `dejado por @${profile.username}`;


        viewerType.textContent =
            getSubmissionType(
                node
            );


        viewerTitle.textContent =
            node.title ||
            "sin título";


        if (
            node.media_url
        ) {

            viewerCover.src =
                node.media_url;

            viewerCover.hidden =
                false;

        }
        else {

            viewerCover
                .removeAttribute(
                    "src"
                );

            viewerCover.hidden =
                true;

        }


        viewerBody.textContent =
            node.body ||
            "";


        viewerAttachments.innerHTML =
            "";


        getAttachments(
            node
        )
            .forEach(
                appendAttachment
            );


        if (
            node.external_url
        ) {

            viewerExternal.href =
                node.external_url;

            viewerExternal.hidden =
                false;

        }
        else {

            viewerExternal.hidden =
                true;

            viewerExternal
                .removeAttribute(
                    "href"
                );

        }


        viewer.classList
            .add(
                "is-open"
            );


        viewer.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style
            .overflow =
            "hidden";

    }


    viewer
        ?.querySelectorAll(
            "[data-close-viewer]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    closeViewer
                );

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Escape" &&
                viewer
                    ?.classList
                    .contains(
                        "is-open"
                    )
            ) {

                closeViewer();

            }

        }
    );


    /* =====================================================
       ABRIR ARCHIVO
    ===================================================== */

    async function openUser(
        rawUsername
    ) {

        if (!window.db) {

            message.textContent =
                "Supabase no está disponible";

            return;
        }


        const username =
            normalizeUsername(
                rawUsername
            );


        if (!username) {

            message.textContent =
                "escribe un nombre";

            return;
        }


        suggestions.hidden =
            true;


        message.textContent =
            "buscando...";


        try {

            const profile =
                await findProfile(
                    username
                );


            if (!profile) {

                archive.hidden =
                    true;

                message.textContent =
                    `no encuentro a @${username}`;

                return;
            }


            const nodes =
                await loadUserNodes(
                    profile.id
                );


            renderGallery(
                profile,
                nodes
            );


            message.textContent =
                `@${profile.username}`;


            requestAnimationFrame(
                () => {

                    archive.scrollIntoView(
                        {
                            behavior:
                                "smooth",
                            block:
                                "start"
                        }
                    );

                }
            );

        }
        catch (error) {

            console.error(
                "Error abriendo usuario:",
                error
            );


            archive.hidden =
                true;

            message.textContent =
                "no pude abrir ese archivo";

        }

    }


    form
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                openUser(
                    input.value
                );

            }
        );


    /* =====================================================
       CURSOR PERSONALIZADO
    ===================================================== */

    const customCursor =
        $("#customCursor");


    if (
        customCursor &&
        window.matchMedia(
            "(pointer: fine)"
        ).matches
    ) {

        document.addEventListener(
            "mousemove",
            event => {

                customCursor.style.left =
                    `${event.clientX}px`;

                customCursor.style.top =
                    `${event.clientY}px`;

            }
        );


        document.addEventListener(
            "mousedown",
            () => {

                customCursor.classList
                    .add(
                        "is-clicking"
                    );

            }
        );


        document.addEventListener(
            "mouseup",
            () => {

                customCursor.classList
                    .remove(
                        "is-clicking"
                    );

            }
        );


        document.addEventListener(
            "mouseover",
            event => {

                if (
                    event.target.closest(
                        `
                        a,
                        button,
                        input,
                        .contribution-card
                        `
                    )
                ) {

                    customCursor.classList
                        .add(
                            "is-hovering"
                        );

                }

            }
        );


        document.addEventListener(
            "mouseout",
            event => {

                if (
                    event.target.closest(
                        `
                        a,
                        button,
                        input,
                        .contribution-card
                        `
                    )
                ) {

                    customCursor.classList
                        .remove(
                            "is-hovering"
                        );

                }

            }
        );

    }


    /* =====================================================
       ARRANQUE
    ===================================================== */

    loadPeopleIndex();


    const params =
        new URLSearchParams(
            window.location.search
        );


    const initialUser =
        normalizeUsername(
            params.get(
                "u"
            )
        );


    if (
        initialUser
    ) {

        input.value =
            initialUser;

        openUser(
            initialUser
        );

    }

})();
