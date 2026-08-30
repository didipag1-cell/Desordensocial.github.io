/* =========================================================
   DESORDEN SOCIAL
   ABEJA + IDENTIDAD + POLEN
   Compartido entre Home y Cara
========================================================= */

(() => {

    const MAX_COVER_BYTES = 5 * 1024 * 1024;
    const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

    const ALLOWED_COVER_TYPES = new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ]);

    const ALLOWED_MEDIA_TYPES = new Set([
        "video/mp4",
        "video/webm",
        "application/pdf",
        "text/plain"
    ]);


    /* =====================================================
       MOVIMIENTO ORGÁNICO DE LA ABEJA
    ===================================================== */

    function initBeeMovement(bee) {

        if (!bee) return;

        let x = window.innerWidth * 0.72;
        let y = window.innerHeight * 0.58;

        let targetX = x;
        let targetY = y;

        let lastTime = performance.now();
        let nextTargetTime = 0;
        let paused = false;


        function randomBetween(min, max) {
            return Math.random() * (max - min) + min;
        }


        function chooseNewTarget(now) {

            const rect = bee.getBoundingClientRect();
            const margin = 45;

            const maxX = Math.max(
                margin,
                window.innerWidth - rect.width - margin
            );

            const maxY = Math.max(
                margin,
                window.innerHeight - rect.height - margin
            );

            targetX = randomBetween(margin, maxX);
            targetY = randomBetween(margin, maxY);

            nextTargetTime =
                now + randomBetween(3500, 7000);
        }


        function animateBee(now) {

            const delta =
                Math.min(now - lastTime, 40);

            lastTime = now;

            if (!paused) {

                const speed =
                    1 - Math.exp(-delta * 0.00115);

                x += (targetX - x) * speed;
                y += (targetY - y) * speed;

                const floatX =
                    Math.sin(now / 720) * 3;

                const floatY =
                    Math.sin(now / 430) * 6;

                bee.style.transform =
                    `translate3d(${x + floatX}px, ${y + floatY}px, 0)`;

                if (now >= nextTargetTime) {
                    chooseNewTarget(now);
                }
            }

            requestAnimationFrame(animateBee);
        }


        bee.addEventListener(
            "mouseenter",
            () => {
                paused = true;
            }
        );


        bee.addEventListener(
            "mouseleave",
            () => {
                paused = false;
                chooseNewTarget(performance.now());
            }
        );


        window.addEventListener(
            "resize",
            () => {

                const rect =
                    bee.getBoundingClientRect();

                x = Math.min(
                    x,
                    window.innerWidth -
                    rect.width -
                    30
                );

                y = Math.min(
                    y,
                    window.innerHeight -
                    rect.height -
                    30
                );

                chooseNewTarget(
                    performance.now()
                );
            }
        );


        chooseNewTarget(
            performance.now()
        );

        requestAnimationFrame(
            animateBee
        );
    }



    /* =====================================================
       MONTAJE AUTOMÁTICO

       Si una página no tiene todavía la abeja y el modal,
       los añadimos automáticamente. Así, para futuras salas,
       basta con cargar bee-pollen.css + bee-pollen.js.
    ===================================================== */

    function ensureBeeInterface() {

        if (!document.querySelector("#bee")) {

            document.body.insertAdjacentHTML(
                "beforeend",
                `
                <button
                    class="bee"
                    id="bee"
                    type="button"
                    aria-label="Dejar polen"
                >
                    <img
                        src="assets/icons/abeja.svg"
                        alt=""
                    >
                    <span class="bee-label">
                        poliniza
                    </span>
                </button>
                `
            );
        }


        if (!document.querySelector("#usernameModal")) {

            document.body.insertAdjacentHTML(
                "beforeend",
                `
                <div
                    class="username-modal"
                    id="usernameModal"
                    aria-hidden="true"
                >

                    <div class="username-backdrop"></div>

                    <div
                        class="username-window"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="usernameTitle"
                    >

                        <button
                            class="username-close"
                            id="usernameClose"
                            type="button"
                            aria-label="Cerrar"
                        >
                            ×
                        </button>

                        <div
                            class="username-create"
                            id="usernameCreate"
                        >

                            <p class="username-small">
                                DESORDEN SOCIAL
                            </p>

                            <h2 id="usernameTitle">
                                ¿cómo quieres aparecer aquí?
                            </h2>

                            <p class="username-description">
                                elige un nombre para dejar tu rastro
                            </p>

                            <form id="usernameForm">

                                <div class="username-field">
                                    <span>@</span>

                                    <input
                                        type="text"
                                        id="usernameInput"
                                        maxlength="30"
                                        autocomplete="off"
                                        spellcheck="false"
                                        placeholder="tu nombre"
                                        required
                                    >
                                </div>

                                <p
                                    class="username-error"
                                    id="usernameError"
                                    aria-live="polite"
                                ></p>

                                <button
                                    class="username-submit"
                                    type="submit"
                                >
                                    entrar
                                </button>

                            </form>

                        </div>


                        <div
                            class="username-return"
                            id="usernameReturn"
                            hidden
                        >

                            <p class="username-small">
                                DESORDEN SOCIAL
                            </p>

                            <h2>
                                hola,
                                <span id="savedUsername"></span>
                            </h2>

                            <p class="username-description">
                                ya puedes dejar tu rastro
                            </p>

                            <button
                                class="username-continue"
                                id="usernameContinue"
                                type="button"
                            >
                                continuar
                            </button>

                            <button
                                class="username-change"
                                id="usernameChange"
                                type="button"
                            >
                                cambiar nombre
                            </button>

                        </div>


                        <div
                            class="pollen-create"
                            id="pollenCreate"
                            hidden
                        >

                            <p class="username-small">
                                DESORDEN SOCIAL
                            </p>

                            <p class="pollen-user">
                                dejando polen como
                                <span id="pollenUsername"></span>
                            </p>

                            <h2>
                                ¿qué quieres conectar?
                            </h2>

                            <form id="pollenForm">

                                <div class="pollen-field pollen-connections-field">

                                    <span>
                                        ¿con qué lo conectas?
                                        <small>
                                            opcional · puedes elegir varios
                                        </small>
                                    </span>

                                    <div class="pollen-connection-picker">

                                        <input
                                            type="text"
                                            id="pollenConnectTo"
                                            list="connectionSuggestions"
                                            autocomplete="off"
                                            placeholder="empieza a escribir..."
                                        >

                                        <button
                                            type="button"
                                            id="addConnection"
                                            class="pollen-add-connection"
                                        >
                                            añadir
                                        </button>

                                    </div>

                                    <datalist
                                        id="connectionSuggestions"
                                    ></datalist>

                                    <div
                                        class="selected-connections"
                                        id="selectedConnections"
                                        aria-live="polite"
                                    ></div>

                                </div>


                                <label class="pollen-field">
                                    <span>¿qué quieres dejar?</span>

                                    <input
                                        type="text"
                                        id="pollenTitle"
                                        maxlength="120"
                                        autocomplete="off"
                                        placeholder="una canción, una foto, un texto, una idea..."
                                        required
                                    >
                                </label>


                                <label class="pollen-field">
                                    <span>qué es</span>

                                    <select id="pollenType">
                                        <option value="canción">canción</option>
                                        <option value="película">película</option>
                                        <option value="texto">texto</option>
                                        <option value="imagen">imagen</option>
                                        <option value="vídeo">vídeo</option>
                                        <option value="entrevista">entrevista</option>
                                        <option value="web">web</option>
                                        <option value="idea">idea</option>
                                        <option value="otro">otro</option>
                                    </select>
                                </label>


                                <label class="pollen-field">
                                    <span>enlace — si existe</span>

                                    <input
                                        type="url"
                                        id="pollenUrl"
                                        placeholder="https://..."
                                    >
                                </label>


                                <label class="pollen-field pollen-file-field">
                                    <span>
                                        portada del nudo — opcional
                                    </span>

                                    <input
                                        type="file"
                                        id="pollenFile"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                    >

                                    <span
                                        class="pollen-file-name"
                                        id="pollenFileName"
                                    >
                                        ningún archivo seleccionado
                                    </span>
                                </label>


                                <label class="pollen-field">
                                    <span>
                                        texto — si quieres escribir algo
                                    </span>

                                    <textarea
                                        id="pollenBody"
                                        rows="6"
                                        maxlength="5000"
                                        placeholder="escribe aquí lo que quieres dejar..."
                                    ></textarea>
                                </label>


                                <label class="pollen-field pollen-file-field">
                                    <span>
                                        imágenes, vídeos o archivos — opcional
                                    </span>

                                    <input
                                        type="file"
                                        id="pollenMedia"
                                        multiple
                                        accept="image/*,video/mp4,video/webm,application/pdf,text/plain"
                                    >

                                    <span
                                        class="pollen-file-name"
                                        id="pollenMediaName"
                                    >
                                        ningún archivo añadido
                                    </span>
                                </label>


                                <div
                                    class="pollen-media-preview"
                                    id="pollenMediaPreview"
                                ></div>


                                <label class="pollen-field">
                                    <span>¿por qué lo conectas?</span>

                                    <textarea
                                        id="pollenNote"
                                        rows="4"
                                        maxlength="500"
                                        placeholder="cuéntame la conexión..."
                                    ></textarea>
                                </label>


                                <p
                                    class="username-error"
                                    id="pollenError"
                                    aria-live="polite"
                                ></p>


                                <button
                                    class="username-submit"
                                    type="submit"
                                >
                                    dejar polen
                                </button>


                                <button
                                    class="pollen-back"
                                    id="pollenBack"
                                    type="button"
                                >
                                    volver
                                </button>

                            </form>

                        </div>


                        <div
                            class="pollen-success"
                            id="pollenSuccess"
                            hidden
                        >

                            <p class="username-small">
                                DESORDEN SOCIAL
                            </p>

                            <h2>
                                polen dejado.
                            </h2>

                            <p class="username-description">
                                tu conexión ya forma parte de este desorden.
                            </p>

                            <p
                                class="pollen-signature"
                                id="pollenSignature"
                            ></p>

                            <button
                                class="username-continue"
                                id="pollenDone"
                                type="button"
                            >
                                volver
                            </button>

                        </div>

                    </div>

                </div>
                `
            );
        }
    }


    /* =====================================================
       INICIAR COMPONENTE
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            ensureBeeInterface();

            const $ = selector =>
                document.querySelector(selector);

            const bee =
                $("#bee");

            const modal =
                $("#usernameModal");

            if (!bee || !modal) {
                return;
            }

            initBeeMovement(bee);


            /* =================================================
               REFERENCIAS DEL MODAL
            ================================================= */

            const closeButton =
                $("#usernameClose");

            const backdrop =
                modal.querySelector(
                    ".username-backdrop"
                );

            const createPanel =
                $("#usernameCreate");

            const returnPanel =
                $("#usernameReturn");

            const usernameForm =
                $("#usernameForm");

            const usernameInput =
                $("#usernameInput");

            const usernameError =
                $("#usernameError");

            const savedUsername =
                $("#savedUsername");

            const continueButton =
                $("#usernameContinue");

            const changeButton =
                $("#usernameChange");

            const pollenPanel =
                $("#pollenCreate");

            const pollenForm =
                $("#pollenForm");

            const pollenUsername =
                $("#pollenUsername");

            const pollenConnectTo =
                $("#pollenConnectTo");

            const connectionSuggestions =
                $("#connectionSuggestions");

            const addConnectionButton =
                $("#addConnection");

            const selectedConnectionsContainer =
                $("#selectedConnections");

            const pollenTitle =
                $("#pollenTitle");

            const pollenType =
                $("#pollenType");

            const pollenUrl =
                $("#pollenUrl");

            const pollenFile =
                $("#pollenFile");

            const pollenFileName =
                $("#pollenFileName");

            const pollenBody =
                $("#pollenBody");

            const pollenMedia =
                $("#pollenMedia");

            const pollenMediaName =
                $("#pollenMediaName");

            const pollenMediaPreview =
                $("#pollenMediaPreview");

            const pollenNote =
                $("#pollenNote");

            const pollenError =
                $("#pollenError");

            const pollenBack =
                $("#pollenBack");

            const pollenSuccess =
                $("#pollenSuccess");

            const pollenSignature =
                $("#pollenSignature");

            const pollenDone =
                $("#pollenDone");


            let availableConnections = [];
            let selectedConnections = [];
            let coverPreview =
                $("#pollenCoverPreview");

            let mediaObjectUrls = [];


            /* =================================================
               SUPABASE
            ================================================= */

            const hasSupabase =
                () =>
                    Boolean(
                        window.db &&
                        window.DesordenUser
                    );


            async function getProfile() {

                if (!hasSupabase()) {
                    return null;
                }

                return await window
                    .DesordenUser
                    .getProfile();
            }


            async function saveUsername(
                rawValue
            ) {

                if (!hasSupabase()) {

                    return {
                        data: null,
                        error: new Error(
                            "Supabase no está disponible."
                        )
                    };
                }


                const username =
                    String(rawValue || "")
                        .trim()
                        .replace(/^@+/, "")
                        .toLowerCase();


                if (
                    username.length < 2 ||
                    username.length > 30
                ) {

                    return {
                        data: null,
                        error: new Error(
                            "el nombre debe tener entre 2 y 30 caracteres"
                        )
                    };
                }


                const currentProfile =
                    await getProfile();


                if (!currentProfile) {

                    return await window
                        .DesordenUser
                        .createProfile(
                            username
                        );
                }


                if (
                    currentProfile.username ===
                    username
                ) {

                    return {
                        data: currentProfile,
                        error: null
                    };
                }


                const {
                    data: owner,
                    error: ownerError
                } =
                    await window.db
                        .from("profiles")
                        .select(
                            "id, username"
                        )
                        .eq(
                            "username",
                            username
                        )
                        .maybeSingle();


                if (ownerError) {

                    return {
                        data: null,
                        error: ownerError
                    };
                }


                if (
                    owner &&
                    owner.id !==
                    currentProfile.id
                ) {

                    return {
                        data: null,
                        error: new Error(
                            `@${username} ya está en uso`
                        )
                    };
                }


                const {
                    data,
                    error
                } =
                    await window.db
                        .from("profiles")
                        .update({
                            username
                        })
                        .eq(
                            "id",
                            currentProfile.id
                        )
                        .select(
                            "id, username"
                        )
                        .single();


                return {
                    data,
                    error
                };
            }


            /* =================================================
               CONEXIONES
            ================================================= */

            if (pollenConnectTo) {

                pollenConnectTo.required =
                    false;

                pollenConnectTo.placeholder =
                    "opcional · busca un nudo";
            }


            async function loadAvailableConnections() {

                availableConnections =
                    [];

                if (!hasSupabase()) {
                    return;
                }


                const {
                    data: nodes,
                    error
                } =
                    await window.db
                        .from("nodes")
                        .select(
                            "id, slug, title, created_by"
                        )
                        .eq(
                            "is_published",
                            true
                        );


                if (error) {

                    console.error(
                        "Error cargando nudos:",
                        error
                    );

                    return;
                }


                const creatorIds =
                    [
                        ...new Set(
                            (nodes || [])
                                .map(
                                    node =>
                                        node.created_by
                                )
                                .filter(Boolean)
                        )
                    ];


                const profilesById =
                    {};


                if (
                    creatorIds.length
                ) {

                    const {
                        data: profiles,
                        error: profilesError
                    } =
                        await window.db
                            .from(
                                "profiles"
                            )
                            .select(
                                "id, username"
                            )
                            .in(
                                "id",
                                creatorIds
                            );


                    if (!profilesError) {

                        (profiles || [])
                            .forEach(
                                profile => {

                                    profilesById[
                                        profile.id
                                    ] =
                                        profile;
                                }
                            );
                    }
                }


                availableConnections =
                    (nodes || [])
                        .filter(
                            node =>
                                node.id &&
                                node.slug &&
                                node.title
                        )
                        .map(
                            node => ({
                                id:
                                    node.id,

                                slug:
                                    node.slug,

                                title:
                                    node.title,

                                username:
                                    profilesById[
                                        node.created_by
                                    ]?.username ||
                                    null
                            })
                        );


                renderConnectionSuggestions();
            }


            function renderConnectionSuggestions() {

                if (!connectionSuggestions) {
                    return;
                }

                connectionSuggestions.innerHTML =
                    "";


                availableConnections
                    .forEach(
                        connection => {

                            const option =
                                document
                                    .createElement(
                                        "option"
                                    );

                            option.value =
                                connection.title;

                            if (
                                connection.username
                            ) {

                                option.label =
                                    `añadido por @${connection.username}`;
                            }

                            connectionSuggestions
                                .appendChild(
                                    option
                                );
                        }
                    );
            }


            function renderSelectedConnections() {

                if (
                    !selectedConnectionsContainer
                ) {
                    return;
                }


                selectedConnectionsContainer
                    .innerHTML =
                    "";


                selectedConnections
                    .forEach(
                        connection => {

                            const item =
                                document
                                    .createElement(
                                        "span"
                                    );

                            item.className =
                                "selected-connection";


                            const label =
                                document
                                    .createElement(
                                        "span"
                                    );

                            label.textContent =
                                connection.title;


                            const remove =
                                document
                                    .createElement(
                                        "button"
                                    );

                            remove.type =
                                "button";

                            remove.className =
                                "remove-connection";

                            remove.textContent =
                                "×";

                            remove.setAttribute(
                                "aria-label",
                                `Quitar ${connection.title}`
                            );


                            remove.addEventListener(
                                "click",
                                () => {

                                    selectedConnections =
                                        selectedConnections
                                            .filter(
                                                selected =>
                                                    selected.id !==
                                                    connection.id
                                            );

                                    renderSelectedConnections();
                                }
                            );


                            item.append(
                                label,
                                remove
                            );

                            selectedConnectionsContainer
                                .appendChild(
                                    item
                                );
                        }
                    );
            }


            function addSelectedConnection() {

                if (!pollenConnectTo) {
                    return true;
                }


                const value =
                    pollenConnectTo
                        .value
                        .trim();


                if (!value) {
                    return true;
                }


                const connection =
                    availableConnections
                        .find(
                            node =>
                                node.title
                                    .toLowerCase() ===
                                value
                                    .toLowerCase()
                        );


                if (!connection) {

                    if (pollenError) {

                        pollenError.textContent =
                            "elige un nudo que ya exista en la red";
                    }

                    return false;
                }


                const alreadySelected =
                    selectedConnections
                        .some(
                            item =>
                                item.id ===
                                connection.id
                        );


                if (!alreadySelected) {

                    selectedConnections
                        .push(
                            connection
                        );
                }


                pollenConnectTo.value =
                    "";

                if (pollenError) {
                    pollenError.textContent =
                        "";
                }

                renderSelectedConnections();

                return true;
            }


            addConnectionButton
                ?.addEventListener(
                    "click",
                    addSelectedConnection
                );


            pollenConnectTo
                ?.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            event.preventDefault();

                            addSelectedConnection();
                        }
                    }
                );


            /* =================================================
               PORTADA
            ================================================= */

            if (pollenFile) {

                pollenFile.accept =
                    "image/jpeg,image/png,image/webp,image/gif";


                const labelText =
                    pollenFile
                        .closest("label")
                        ?.querySelector(
                            "span"
                        );


                if (labelText) {

                    labelText.textContent =
                        "portada del nudo — opcional";
                }


                if (!coverPreview) {

                    coverPreview =
                        document
                            .createElement(
                                "img"
                            );

                    coverPreview.id =
                        "pollenCoverPreview";

                    coverPreview.className =
                        "pollen-cover-preview";

                    coverPreview.alt =
                        "Vista previa de la portada";

                    coverPreview.hidden =
                        true;


                    (
                        pollenFileName ||
                        pollenFile
                    )
                        .insertAdjacentElement(
                            "afterend",
                            coverPreview
                        );
                }
            }


            function clearCoverPreview() {

                if (
                    coverPreview
                        ?.dataset
                        .objectUrl
                ) {

                    URL.revokeObjectURL(
                        coverPreview
                            .dataset
                            .objectUrl
                    );
                }


                if (coverPreview) {

                    coverPreview.src =
                        "";

                    coverPreview.hidden =
                        true;

                    delete coverPreview
                        .dataset
                        .objectUrl;
                }


                if (pollenFileName) {

                    pollenFileName.textContent =
                        "ninguna portada seleccionada";
                }
            }


            pollenFile
                ?.addEventListener(
                    "change",
                    () => {

                        const file =
                            pollenFile
                                .files?.[0] ||
                            null;

                        clearCoverPreview();


                        if (!file) {
                            return;
                        }


                        if (
                            !ALLOWED_COVER_TYPES
                                .has(
                                    file.type
                                )
                        ) {

                            pollenFile.value =
                                "";

                            if (pollenError) {

                                pollenError.textContent =
                                    "la portada debe ser JPG, PNG, WEBP o GIF";
                            }

                            return;
                        }


                        if (
                            file.size >
                            MAX_COVER_BYTES
                        ) {

                            pollenFile.value =
                                "";

                            if (pollenError) {

                                pollenError.textContent =
                                    "la portada no puede pesar más de 5 MB";
                            }

                            return;
                        }


                        if (pollenFileName) {

                            pollenFileName
                                .textContent =
                                file.name;
                        }


                        if (coverPreview) {

                            const objectUrl =
                                URL.createObjectURL(
                                    file
                                );

                            coverPreview.src =
                                objectUrl;

                            coverPreview
                                .dataset
                                .objectUrl =
                                objectUrl;

                            coverPreview.hidden =
                                false;
                        }


                        if (pollenError) {

                            pollenError.textContent =
                                "";
                        }
                    }
                );


            /* =================================================
               ARCHIVOS DEL CONTENIDO
            ================================================= */

            function isAllowedMedia(
                file
            ) {

                return (
                    file.type
                        .startsWith(
                            "image/"
                        ) ||
                    ALLOWED_MEDIA_TYPES
                        .has(
                            file.type
                        )
                );
            }


            function clearMediaPreview() {

                mediaObjectUrls
                    .forEach(
                        objectUrl => {
                            URL.revokeObjectURL(
                                objectUrl
                            );
                        }
                    );

                mediaObjectUrls =
                    [];


                if (pollenMediaPreview) {

                    pollenMediaPreview
                        .innerHTML =
                        "";
                }


                if (pollenMediaName) {

                    pollenMediaName
                        .textContent =
                        "ningún archivo añadido";
                }
            }


            function mediaKind(
                file
            ) {

                if (
                    file.type
                        .startsWith(
                            "image/"
                        )
                ) {
                    return "image";
                }

                if (
                    file.type
                        .startsWith(
                            "video/"
                        )
                ) {
                    return "video";
                }

                if (
                    file.type ===
                    "application/pdf"
                ) {
                    return "pdf";
                }

                if (
                    file.type ===
                    "text/plain"
                ) {
                    return "text";
                }

                return "file";
            }


            function renderMediaPreview(
                files
            ) {

                clearMediaPreview();


                if (!files.length) {
                    return;
                }


                if (pollenMediaName) {

                    pollenMediaName
                        .textContent =
                        files.length === 1
                            ? files[0].name
                            : `${files.length} archivos añadidos`;
                }


                if (!pollenMediaPreview) {
                    return;
                }


                files.forEach(
                    file => {

                        const item =
                            document
                                .createElement(
                                    "div"
                                );

                        item.className =
                            "pollen-media-item";


                        const kind =
                            mediaKind(
                                file
                            );


                        if (
                            kind ===
                            "image"
                        ) {

                            const img =
                                document
                                    .createElement(
                                        "img"
                                    );

                            const objectUrl =
                                URL.createObjectURL(
                                    file
                                );

                            mediaObjectUrls
                                .push(
                                    objectUrl
                                );

                            img.src =
                                objectUrl;

                            img.alt =
                                "";

                            img.className =
                                "pollen-media-thumb";

                            item.appendChild(
                                img
                            );

                        } else if (
                            kind ===
                            "video"
                        ) {

                            const video =
                                document
                                    .createElement(
                                        "video"
                                    );

                            const objectUrl =
                                URL.createObjectURL(
                                    file
                                );

                            mediaObjectUrls
                                .push(
                                    objectUrl
                                );

                            video.src =
                                objectUrl;

                            video.className =
                                "pollen-media-thumb";

                            video.muted =
                                true;

                            video.playsInline =
                                true;

                            video.preload =
                                "metadata";

                            item.appendChild(
                                video
                            );

                        } else {

                            const badge =
                                document
                                    .createElement(
                                        "span"
                                    );

                            badge.className =
                                "pollen-media-badge";

                            badge.textContent =
                                kind === "pdf"
                                    ? "PDF"
                                    : kind === "text"
                                        ? "TXT"
                                        : "ARCHIVO";

                            item.appendChild(
                                badge
                            );
                        }


                        const name =
                            document
                                .createElement(
                                    "span"
                                );

                        name.className =
                            "pollen-media-item-name";

                        name.textContent =
                            file.name;

                        item.appendChild(
                            name
                        );


                        pollenMediaPreview
                            .appendChild(
                                item
                            );
                    }
                );
            }


            pollenMedia
                ?.addEventListener(
                    "change",
                    () => {

                        const files =
                            Array.from(
                                pollenMedia
                                    .files ||
                                []
                            );


                        const invalidType =
                            files.find(
                                file =>
                                    !isAllowedMedia(
                                        file
                                    )
                            );


                        if (invalidType) {

                            pollenMedia.value =
                                "";

                            clearMediaPreview();

                            if (pollenError) {

                                pollenError.textContent =
                                    `“${invalidType.name}” no es un tipo de archivo permitido`;
                            }

                            return;
                        }


                        const tooLarge =
                            files.find(
                                file =>
                                    file.size >
                                    MAX_MEDIA_BYTES
                            );


                        if (tooLarge) {

                            pollenMedia.value =
                                "";

                            clearMediaPreview();

                            if (pollenError) {

                                pollenError.textContent =
                                    `“${tooLarge.name}” supera los 50 MB`;
                            }

                            return;
                        }


                        renderMediaPreview(
                            files
                        );


                        if (pollenError) {

                            pollenError.textContent =
                                "";
                        }
                    }
                );


            /* =================================================
               STORAGE
            ================================================= */

            function randomId() {

                return crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()
                        .toString(16)
                        .slice(2)}`;
            }


            function safeFilename(
                name
            ) {

                const clean =
                    String(name || "archivo")
                        .normalize("NFD")
                        .replace(
                            /[\u0300-\u036f]/g,
                            ""
                        )
                        .replace(
                            /[^a-zA-Z0-9._-]+/g,
                            "-"
                        )
                        .replace(
                            /-+/g,
                            "-"
                        )
                        .replace(
                            /^[-.]+|[-.]+$/g,
                            ""
                        );

                return clean ||
                    "archivo";
            }


            async function uploadCover(
                file,
                userId
            ) {

                if (!file) {
                    return null;
                }


                const safeName =
                    safeFilename(
                        file.name
                    );

                const path =
                    `${userId}/${randomId()}-${safeName}`;


                const {
                    error
                } =
                    await window.db
                        .storage
                        .from(
                            "node-covers"
                        )
                        .upload(
                            path,
                            file,
                            {
                                cacheControl:
                                    "3600",

                                upsert:
                                    false,

                                contentType:
                                    file.type
                            }
                        );


                if (error) {
                    throw error;
                }


                const {
                    data
                } =
                    window.db
                        .storage
                        .from(
                            "node-covers"
                        )
                        .getPublicUrl(
                            path
                        );


                if (
                    !data?.publicUrl
                ) {

                    throw new Error(
                        "No se pudo obtener la URL de la portada."
                    );
                }


                return {
                    url:
                        data.publicUrl,

                    path
                };
            }


            async function uploadMediaFiles(
                files,
                userId,
                onProgress = null
            ) {

                const attachments =
                    [];


                for (
                    let index = 0;
                    index < files.length;
                    index++
                ) {

                    const file =
                        files[index];

                    if (onProgress) {

                        onProgress(
                            index + 1,
                            files.length,
                            file
                        );
                    }


                    const safeName =
                        safeFilename(
                            file.name
                        );

                    const path =
                        `${userId}/${randomId()}-${safeName}`;


                    const {
                        error
                    } =
                        await window.db
                            .storage
                            .from(
                                "node-media"
                            )
                            .upload(
                                path,
                                file,
                                {
                                    cacheControl:
                                        "3600",

                                    upsert:
                                        false,

                                    contentType:
                                        file.type
                                }
                            );


                    if (error) {
                        throw error;
                    }


                    const {
                        data
                    } =
                        window.db
                            .storage
                            .from(
                                "node-media"
                            )
                            .getPublicUrl(
                                path
                            );


                    if (
                        !data?.publicUrl
                    ) {

                        throw new Error(
                            `No se pudo obtener la URL de ${file.name}.`
                        );
                    }


                    attachments.push({
                        kind:
                            mediaKind(
                                file
                            ),

                        name:
                            file.name,

                        mime_type:
                            file.type,

                        size:
                            file.size,

                        bucket:
                            "node-media",

                        storage_path:
                            path,

                        url:
                            data.publicUrl
                    });
                }


                return attachments;
            }


            /* =================================================
               MODAL
            ================================================= */

            async function showProfilePanel() {

                if (pollenPanel) {
                    pollenPanel.hidden =
                        true;
                }

                if (pollenSuccess) {
                    pollenSuccess.hidden =
                        true;
                }


                const profile =
                    await getProfile();


                if (profile) {

                    if (createPanel) {
                        createPanel.hidden =
                            true;
                    }

                    if (returnPanel) {
                        returnPanel.hidden =
                            false;
                    }

                    if (savedUsername) {

                        savedUsername.textContent =
                            `@${profile.username}`;
                    }

                    return;
                }


                if (createPanel) {
                    createPanel.hidden =
                        false;
                }

                if (returnPanel) {
                    returnPanel.hidden =
                        true;
                }

                if (usernameInput) {
                    usernameInput.value =
                        "";
                }

                if (usernameError) {

                    usernameError.textContent =
                        hasSupabase()
                            ? ""
                            : "Supabase no está cargado en esta página";
                }


                setTimeout(
                    () =>
                        usernameInput
                            ?.focus(),
                    100
                );
            }


            async function openModal() {

                modal.classList.add(
                    "is-open"
                );

                modal.setAttribute(
                    "aria-hidden",
                    "false"
                );

                await showProfilePanel();
            }


            function closeModal() {

                modal.classList.remove(
                    "is-open"
                );

                modal.setAttribute(
                    "aria-hidden",
                    "true"
                );
            }


            bee.addEventListener(
                "click",
                openModal
            );


            closeButton
                ?.addEventListener(
                    "click",
                    closeModal
                );


            backdrop
                ?.addEventListener(
                    "click",
                    closeModal
                );


            document.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                            "Escape" &&
                        modal.classList
                            .contains(
                                "is-open"
                            )
                    ) {

                        closeModal();
                    }
                }
            );


            /* =================================================
               USERNAME
            ================================================= */

            usernameForm
                ?.addEventListener(
                    "submit",
                    async event => {

                        event.preventDefault();


                        if (usernameError) {

                            usernameError.textContent =
                                "";
                        }


                        const result =
                            await saveUsername(
                                usernameInput
                                    ?.value ||
                                ""
                            );


                        if (result.error) {

                            if (usernameError) {

                                usernameError.textContent =
                                    result
                                        .error
                                        .message;
                            }

                            return;
                        }


                        if (createPanel) {

                            createPanel.hidden =
                                true;
                        }


                        if (returnPanel) {

                            returnPanel.hidden =
                                false;
                        }


                        if (savedUsername) {

                            savedUsername.textContent =
                                `@${result.data.username}`;
                        }
                    }
                );


            changeButton
                ?.addEventListener(
                    "click",
                    async () => {

                        const profile =
                            await getProfile();


                        if (returnPanel) {
                            returnPanel.hidden =
                                true;
                        }


                        if (createPanel) {
                            createPanel.hidden =
                                false;
                        }


                        if (usernameInput) {

                            usernameInput.value =
                                profile
                                    ?.username ||
                                "";

                            setTimeout(
                                () => {

                                    usernameInput
                                        .focus();

                                    usernameInput
                                        .select();
                                },
                                100
                            );
                        }
                    }
                );


            /* =================================================
               ABRIR FORMULARIO DE POLEN
            ================================================= */

            continueButton
                ?.addEventListener(
                    "click",
                    async () => {

                        const profile =
                            await getProfile();


                        if (!profile) {

                            await showProfilePanel();
                            return;
                        }


                        await loadAvailableConnections();


                        selectedConnections =
                            [];

                        renderSelectedConnections();

                        clearCoverPreview();
                        clearMediaPreview();


                        if (pollenConnectTo) {

                            pollenConnectTo.value =
                                "";
                        }


                        if (pollenError) {

                            pollenError.textContent =
                                "";
                        }


                        if (returnPanel) {
                            returnPanel.hidden =
                                true;
                        }

                        if (createPanel) {
                            createPanel.hidden =
                                true;
                        }

                        if (pollenSuccess) {
                            pollenSuccess.hidden =
                                true;
                        }

                        if (pollenPanel) {
                            pollenPanel.hidden =
                                false;
                        }


                        if (pollenUsername) {

                            pollenUsername.textContent =
                                `@${profile.username}`;
                        }


                        setTimeout(
                            () =>
                                pollenTitle
                                    ?.focus(),
                            100
                        );
                    }
                );


            pollenBack
                ?.addEventListener(
                    "click",
                    showProfilePanel
                );


            /* =================================================
               TIPO EXTERIOR DEL NUDO
            ================================================= */

            function getContentType(
                type,
                url,
                coverUrl
            ) {

                if (coverUrl) {
                    return "mixed";
                }


                if (
                    url &&
                    [
                        "vídeo",
                        "película",
                        "entrevista"
                    ]
                        .includes(
                            type
                        )
                ) {

                    return "video";
                }


                if (url) {
                    return "link";
                }


                /*
                   Sin portada, los archivos adjuntos
                   pertenecen al interior del nudo.
                   Por fuera enseñamos título/texto.
                */

                return "text";
            }


            /* =================================================
               DEJAR POLEN
            ================================================= */

            pollenForm
                ?.addEventListener(
                    "submit",
                    async event => {

                        event.preventDefault();


                        if (pollenError) {

                            pollenError.textContent =
                                "";
                        }


                        const profile =
                            await getProfile();

                        const user =
                            await window
                                .DesordenUser
                                ?.getCurrentUser();


                        if (
                            !profile ||
                            !user
                        ) {

                            if (pollenError) {

                                pollenError.textContent =
                                    "no encuentro tu perfil";
                            }

                            return;
                        }


                        if (
                            pollenConnectTo
                                ?.value
                                .trim() &&
                            !addSelectedConnection()
                        ) {

                            return;
                        }


                        const title =
                            pollenTitle
                                ?.value
                                .trim() ||
                            "";

                        const type =
                            pollenType
                                ?.value ||
                            "otro";

                        const url =
                            pollenUrl
                                ?.value
                                .trim() ||
                            "";

                        const body =
                            pollenBody
                                ?.value
                                .trim() ||
                            "";

                        const note =
                            pollenNote
                                ?.value
                                .trim() ||
                            "";

                        const coverFile =
                            pollenFile
                                ?.files?.[0] ||
                            null;

                        const mediaFiles =
                            Array.from(
                                pollenMedia
                                    ?.files ||
                                []
                            );


                        if (!title) {

                            if (pollenError) {

                                pollenError.textContent =
                                    "dime qué quieres dejar";
                            }

                            return;
                        }


                        const invalidMedia =
                            mediaFiles
                                .find(
                                    file =>
                                        !isAllowedMedia(
                                            file
                                        ) ||
                                        file.size >
                                        MAX_MEDIA_BYTES
                                );


                        if (invalidMedia) {

                            if (pollenError) {

                                pollenError.textContent =
                                    `revisa el archivo “${invalidMedia.name}”`;
                            }

                            return;
                        }


                        const submitButton =
                            pollenForm
                                .querySelector(
                                    'button[type="submit"]'
                                );

                        const oldText =
                            submitButton
                                ?.textContent ||
                            "";


                        if (submitButton) {

                            submitButton.disabled =
                                true;

                            submitButton.textContent =
                                "preparando polen...";
                        }


                        try {

                            const coverUpload =
                                await uploadCover(
                                    coverFile,
                                    user.id
                                );


                            const attachments =
                                await uploadMediaFiles(
                                    mediaFiles,
                                    user.id,
                                    (
                                        current,
                                        total
                                    ) => {

                                        if (
                                            submitButton
                                        ) {

                                            submitButton.textContent =
                                                `subiendo archivo ${current}/${total}...`;
                                        }
                                    }
                                );


                            const coverUrl =
                                coverUpload
                                    ?.url ||
                                null;


                            const pendingContribution =
                                {

                                    parentSlugs:
                                        selectedConnections
                                            .map(
                                                item =>
                                                    item.slug
                                            ),

                                    title,

                                    body,

                                    content_type:
                                        getContentType(
                                            type,
                                            url,
                                            coverUrl
                                        ),

                                    media_url:
                                        coverUrl,

                                    external_url:
                                        url ||
                                        null,

                                    reason:
                                        note,

                                    metadata:
                                        {
                                            submission_type:
                                                type,

                                            attachments,

                                            cover:
                                                coverUpload
                                                    ? {
                                                        bucket:
                                                            "node-covers",

                                                        storage_path:
                                                            coverUpload.path
                                                    }
                                                    : null
                                        }
                                };


                            sessionStorage
                                .setItem(
                                    "desorden-pending-contribution",
                                    JSON.stringify(
                                        pendingContribution
                                    )
                                );


                            window.location.href =
                                "cara.html?polen=nuevo";

                        } catch (error) {

                            console.error(
                                "Error dejando polen:",
                                error
                            );


                            if (pollenError) {

                                pollenError.textContent =
                                    error
                                        ?.message ||
                                    "no se pudo dejar el polen";
                            }


                            if (submitButton) {

                                submitButton.disabled =
                                    false;

                                submitButton.textContent =
                                    oldText;
                            }
                        }
                    }
                );


            pollenDone
                ?.addEventListener(
                    "click",
                    closeModal
                );


            /*
               El panel de éxito queda preparado
               por si después decidimos crear el
               nudo sin recargar Cara.
            */

            if (
                pollenSignature &&
                pollenSuccess
            ) {

                pollenSuccess.hidden =
                    true;
            }
        }
    );

})();
