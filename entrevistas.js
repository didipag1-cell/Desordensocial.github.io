/* =========================================================
   DESORDEN SOCIAL — ENTREVISTAS
   entrevistas.js COMPLETO
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {


    /* =====================================================
       SUPABASE
       PEGA AQUÍ LOS MISMOS DATOS QUE USA LA ABEJA
    ===================================================== */

    const SUPABASE_URL =
        "https://vomccqnimuiysdabzslk.supabase.co";

    const SUPABASE_ANON_KEY =
        "sb_publishable_nTqXyHD94PGkkx8Bl6wN1Q_8JvHy_C9";


    let supabaseClient = null;

    let currentUser = null;

    let currentUsername = null;



    /* =====================================================
       ELEMENTOS
    ===================================================== */

    const section =
        document.getElementById("interviewsScroll");

    const talk =
        document.getElementById("talkBlock");

    const canvas =
        document.getElementById("faceCanvas");

    const faceSource =
        document.getElementById("faceSource");

    const cursor =
        document.getElementById("siteCursor");

    const stream =
        document.getElementById("conversationStream");

    const form =
        document.getElementById("conversationForm");

    const messageInput =
        document.getElementById("chatMessage");

    const websiteField =
        document.getElementById("websiteField");



    /* =====================================================
       UTILIDAD
    ===================================================== */

    function clamp(value, min, max) {

        return Math.max(
            min,
            Math.min(max, value)
        );

    }



    /* =====================================================
       =====================================================
       DATAMOSH
       =====================================================
    ===================================================== */

    let ctx = null;


    if (canvas) {

        ctx =
            canvas.getContext(
                "2d",
                {
                    willReadFrequently: true
                }
            );

    }



    function drawDatamosh(progress = 0) {

        if (
            !canvas ||
            !ctx ||
            !faceSource ||
            !faceSource.complete ||
            !faceSource.naturalWidth
        ) {
            return;
        }


        const displayWidth =
            canvas.clientWidth || 800;


        const displayHeight =
            Math.round(
                displayWidth * 1.34
            );


        /*
            Canvas interno pequeño =
            pixelación más visible.
        */

        const internalScale = 0.43;


        const cw =
            Math.max(
                240,
                Math.round(
                    displayWidth *
                    internalScale
                )
            );


        const ch =
            Math.max(
                330,
                Math.round(
                    displayHeight *
                    internalScale
                )
            );


        canvas.width = cw;

        canvas.height = ch;



        /* fondo amarillo */

        ctx.fillStyle =
            "#ecef31";

        ctx.fillRect(
            0,
            0,
            cw,
            ch
        );



        /* =================================================
           AJUSTAR FACE.SVG AL CANVAS
        ================================================= */

        const iw =
            faceSource.naturalWidth;

        const ih =
            faceSource.naturalHeight;


        const sourceRatio =
            iw / ih;

        const targetRatio =
            cw / ch;


        let sx = 0;
        let sy = 0;
        let sw = iw;
        let sh = ih;


        if (
            sourceRatio >
            targetRatio
        ) {

            sw =
                ih *
                targetRatio;

            sx =
                (iw - sw) / 2;

        } else {

            sh =
                iw /
                targetRatio;

            sy =
                (ih - sh) / 2;

        }


        ctx.drawImage(
            faceSource,

            sx,
            sy,
            sw,
            sh,

            0,
            0,
            cw,
            ch
        );



        /* =================================================
           CONVERTIR TODO A LOS DOS COLORES
        ================================================= */

        const imageData =
            ctx.getImageData(
                0,
                0,
                cw,
                ch
            );


        const pixels =
            imageData.data;


        for (
            let i = 0;
            i < pixels.length;
            i += 4
        ) {

            const r =
                pixels[i];

            const g =
                pixels[i + 1];

            const b =
                pixels[i + 2];


            const luminance =

                (
                    0.299 * r +
                    0.587 * g +
                    0.114 * b
                ) / 255;


            const darkness =
                Math.pow(
                    1 - luminance,
                    0.78
                );


            /*
                amarillo:
                236 239 49

                rojo:
                215 58 47
            */

            pixels[i] =
                236 -
                darkness * 21;

            pixels[i + 1] =
                239 -
                darkness * 181;

            pixels[i + 2] =
                49 -
                darkness * 2;

            pixels[i + 3] =
                255;

        }


        ctx.putImageData(
            imageData,
            0,
            0
        );



        /* =================================================
           DATAMOSH — DESPLAZAMIENTO DE BLOQUES
        ================================================= */

        const intensity =
            0.65 +
            progress * 0.75;


        const slices =
            Math.floor(
                18 +
                progress * 28
            );


        const maxShift =
            Math.floor(
                cw *
                0.10 *
                intensity
            );


        for (
            let i = 0;
            i < slices;
            i++
        ) {

            const sliceHeight =
                Math.floor(
                    5 +
                    Math.random() *
                    ch *
                    0.07
                );


            const y =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        ch -
                        sliceHeight
                    )
                );


            const shift =
                Math.floor(
                    (
                        Math.random() *
                        maxShift *
                        2
                    ) -
                    maxShift
                );


            try {

                const slice =
                    ctx.getImageData(
                        0,
                        y,
                        cw,
                        sliceHeight
                    );


                ctx.putImageData(
                    slice,
                    shift,
                    y
                );

            } catch (error) {

                // simplemente saltamos
                // un bloque inválido

            }

        }



        /* =================================================
           FRAGMENTOS CUADRADOS
        ================================================= */

        const fragments =
            Math.floor(
                35 +
                progress * 55
            );


        for (
            let i = 0;
            i < fragments;
            i++
        ) {

            const width =
                Math.floor(
                    5 +
                    Math.random() * 28
                );


            const height =
                Math.floor(
                    4 +
                    Math.random() * 25
                );


            const x =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        cw - width
                    )
                );


            const y =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        ch - height
                    )
                );


            try {

                const fragment =
                    ctx.getImageData(
                        x,
                        y,
                        width,
                        height
                    );


                const offsetX =
                    Math.floor(
                        (
                            Math.random() -
                            0.5
                        ) *
                        maxShift *
                        2
                    );


                const offsetY =
                    Math.floor(
                        (
                            Math.random() -
                            0.5
                        ) *
                        20
                    );


                ctx.putImageData(
                    fragment,

                    x + offsetX,
                    y + offsetY
                );

            } catch (error) {

                // ignoramos fragmento

            }

        }



        /* =================================================
           PIXEL BLOCKS
        ================================================= */

        const blocks =
            Math.floor(
                28 +
                progress * 55
            );


        for (
            let i = 0;
            i < blocks;
            i++
        ) {

            const size =
                Math.floor(
                    3 +
                    Math.random() * 14
                );


            const x =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        cw - size
                    )
                );


            const y =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        ch - size
                    )
                );


            /*
                Alternamos los dos colores.
            */

            ctx.fillStyle =

                Math.random() > 0.5

                    ? "#d73a2f"

                    : "#ecef31";


            ctx.globalAlpha =
                0.32 +
                Math.random() * 0.35;


            ctx.fillRect(
                x,
                y,
                size,
                size
            );

        }


        ctx.globalAlpha = 1;



        /* =================================================
           SCANLINES MUY SUAVES
        ================================================= */

        ctx.save();

        ctx.globalAlpha =
            0.07;

        ctx.fillStyle =
            "#d73a2f";


        for (
            let y = 0;
            y < ch;
            y += 4
        ) {

            ctx.fillRect(
                0,
                y,
                cw,
                1
            );

        }


        ctx.restore();

    }



    /* =====================================================
       =====================================================
       SCROLL
       =====================================================
    ===================================================== */

    let scrollAnimationFrame =
        null;



    function updateScroll() {

        scrollAnimationFrame =
            null;


        if (
            !section ||
            !talk ||
            !canvas
        ) {
            return;
        }


        const rect =
            section.getBoundingClientRect();


        const maxScroll =

            section.offsetHeight -
            window.innerHeight;


        const current =
            clamp(
                -rect.top,
                0,
                maxScroll
            );


        const progress =

            maxScroll > 0

                ? current /
                  maxScroll

                : 0;



        /* =================================================
           CARA

           empieza arriba / cortada
           y termina completamente revelada
        ================================================= */

        const faceStart =
            9;

        const faceEnd =
            -36;


        const faceY =

            faceStart +
            (
                faceEnd -
                faceStart
            ) *
            progress;


        canvas.style.transform =

            `translateX(-50%) translateY(${faceY}vh)`;



        /* =================================================
           TEXTO

           empieza ARRIBA y acaba ABAJO.
        ================================================= */

        const startTop =
            window.innerHeight *
            0.06;


        const bottomSpace =
            window.innerHeight *
            0.05;


        const textHeight =
            talk.offsetHeight;


        const finalTop =

            window.innerHeight -
            textHeight -
            bottomSpace;


        const totalTravel =
            Math.max(
                0,
                finalTop -
                startTop
            );


        talk.style.transform =

            `translateY(${totalTravel * progress}px)`;


        talk.style.opacity =
            "1";


        drawDatamosh(
            progress
        );

    }



    function requestScrollUpdate() {

        if (
            scrollAnimationFrame !==
            null
        ) {
            return;
        }


        scrollAnimationFrame =
            requestAnimationFrame(
                updateScroll
            );

    }



    window.addEventListener(
        "scroll",
        requestScrollUpdate,
        {
            passive: true
        }
    );



    window.addEventListener(
        "resize",
        requestScrollUpdate
    );



    if (
        faceSource
    ) {

        if (
            faceSource.complete
        ) {

            requestScrollUpdate();

        } else {

            faceSource.addEventListener(
                "load",
                requestScrollUpdate
            );

        }

    }



    /* =====================================================
       =====================================================
       SUPABASE
       =====================================================
    ===================================================== */

    const credentialsReady =

        SUPABASE_URL &&
        SUPABASE_ANON_KEY &&

        !SUPABASE_URL.includes(
            "PEGA_AQUI"
        ) &&

        !SUPABASE_ANON_KEY.includes(
            "PEGA_AQUI"
        );



    if (
        credentialsReady &&
        window.supabase
    ) {

        supabaseClient =
            window.supabase.createClient(

                SUPABASE_URL,
                SUPABASE_ANON_KEY,

                {
                    auth: {

                        persistSession:
                            true,

                        autoRefreshToken:
                            true,

                        detectSessionInUrl:
                            true

                    }
                }

            );

    } else {

        console.warn(
            "Supabase no está configurado en entrevistas.js"
        );

    }



    /* =====================================================
       USUARIO DE LA ABEJA
    ===================================================== */

    async function loadBeeUser() {

        if (!supabaseClient) {

            return false;

        }



        /* ---------------------------------------------
           SESIÓN EXISTENTE
        --------------------------------------------- */

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient
                .auth
                .getSession();



        if (sessionError) {

            console.error(
                "Error recuperando sesión:",
                sessionError
            );

            return false;

        }



        let session =
            sessionData?.session ||
            null;



        /* ---------------------------------------------
           SI NO HAY SESIÓN:
           usuario anónimo
        --------------------------------------------- */

        if (!session) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInAnonymously();



            if (error) {

                console.error(
                    "No se pudo iniciar sesión anónima:",
                    error
                );

                return false;

            }


            session =
                data?.session ||
                null;

        }



        currentUser =
            session?.user ||
            null;



        if (!currentUser) {

            return false;

        }



        /* ---------------------------------------------
           BUSCAR USERNAME DE LA ABEJA
        --------------------------------------------- */

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient

                .from("profiles")

                .select("username")

                .eq(
                    "id",
                    currentUser.id
                )

                .maybeSingle();



        if (profileError) {

            console.error(
                "Error cargando username:",
                profileError
            );

            return false;

        }



        currentUsername =
            profile?.username ||
            null;



        if (!currentUsername) {

            console.log(
                "El usuario aún no ha elegido username con la abeja."
            );

            return false;

        }



        return true;

    }



    /* =====================================================
       =====================================================
       CHAT
       =====================================================
    ===================================================== */


    function messageOffset(seed) {

        const value =
            String(seed);


        let hash = 0;


        for (
            let i = 0;
            i < value.length;
            i++
        ) {

            hash =
                (
                    hash * 31 +
                    value.charCodeAt(i)
                ) >>> 0;

        }


        /*
            posiciones entre 3% y 52%
        */

        return (
            3 +
            (
                hash % 50
            )
        );

    }



    function cleanUsername(username) {

        if (!username) {

            return "@usuario";

        }


        return username.startsWith("@")

            ? username

            : `@${username}`;

    }



    /* =====================================================
       OBTENER USERNAMES EN BLOQUE
    ===================================================== */

    async function getUsernameMap(rows) {

        const map =
            new Map();


        if (
            !supabaseClient ||
            !rows?.length
        ) {

            return map;

        }


        const ids =
            [
                ...new Set(

                    rows

                        .map(
                            row =>
                                row.created_by
                        )

                        .filter(Boolean)

                )
            ];



        if (!ids.length) {

            return map;

        }



        const {
            data,
            error
        } =
            await supabaseClient

                .from("profiles")

                .select(
                    "id,username"
                )

                .in(
                    "id",
                    ids
                );



        if (error) {

            console.error(
                "No se pudieron cargar usernames:",
                error
            );

            return map;

        }



        data?.forEach(
            profile => {

                map.set(
                    profile.id,
                    profile.username
                );

            }
        );


        return map;

    }



    /* =====================================================
       RENDER MENSAJE
    ===================================================== */

    function renderMessage(
        row,
        username,
        animate = false
    ) {

        if (!stream) {

            return;

        }



        /*
            evitar duplicados realtime
        */

        if (
            stream.querySelector(
                `[data-message-id="${row.id}"]`
            )
        ) {

            return;

        }



        const article =
            document.createElement(
                "article"
            );


        article.className =
            "chat-entry";


        article.dataset.messageId =
            row.id;



        if (animate) {

            article.classList.add(
                "is-new"
            );

        }



        article.style.setProperty(
            "--x",
            `${messageOffset(row.id)}%`
        );



        const nameElement =
            document.createElement(
                "span"
            );


        nameElement.className =
            "chat-entry-name";


        nameElement.textContent =
            cleanUsername(
                username
            );



        const messageElement =
            document.createElement(
                "p"
            );


        messageElement.className =
            "chat-entry-message";


        messageElement.textContent =
            row.message || "";


        article.append(
            nameElement,
            messageElement
        );


        stream.appendChild(
            article
        );

    }



    /* =====================================================
       CARGAR MENSAJES
    ===================================================== */

    async function loadMessages() {

        if (
            !supabaseClient ||
            !stream
        ) {

            return;

        }



        const {
            data: rows,
            error
        } =
            await supabaseClient

                .from(
                    "interview_chat"
                )

                .select(
                    "id,created_by,message,created_at"
                )

                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                )

                .limit(100);



        if (error) {

            console.error(
                "Error cargando chat:",
                error
            );

            return;

        }



        stream.innerHTML =
            "";



        const usernameMap =
            await getUsernameMap(
                rows
            );



        rows.forEach(
            row => {

                const username =

                    row.created_by ===
                    currentUser?.id

                        ? currentUsername

                        : usernameMap.get(
                            row.created_by
                        );


                renderMessage(
                    row,
                    username
                );

            }
        );

    }



    /* =====================================================
       REALTIME
    ===================================================== */

    function startRealtime() {

        if (!supabaseClient) {

            return;

        }



        supabaseClient

            .channel(
                "desorden-interview-chat"
            )

            .on(

                "postgres_changes",

                {
                    event: "INSERT",

                    schema: "public",

                    table:
                        "interview_chat"
                },

                async payload => {


                    const row =
                        payload.new;


                    let username =
                        null;



                    if (
                        row.created_by ===
                        currentUser?.id
                    ) {

                        username =
                            currentUsername;

                    } else {


                        const {
                            data
                        } =
                            await supabaseClient

                                .from(
                                    "profiles"
                                )

                                .select(
                                    "username"
                                )

                                .eq(
                                    "id",
                                    row.created_by
                                )

                                .maybeSingle();


                        username =
                            data?.username ||
                            null;

                    }



                    renderMessage(
                        row,
                        username,
                        true
                    );

                }

            )

            .subscribe();

    }



    /* =====================================================
       TEXTAREA AUTOGROW
    ===================================================== */

    if (messageInput) {

        messageInput.addEventListener(
            "input",
            () => {


                messageInput.style.height =
                    "auto";


                messageInput.style.height =

                    Math.min(
                        messageInput.scrollHeight,
                        180
                    ) +
                    "px";

            }
        );

    }



    /* =====================================================
       ENVIAR
    ===================================================== */

    let lastSend = 0;



    if (form) {

        form.addEventListener(
            "submit",
            async event => {


                event.preventDefault();



                /*
                    honeypot
                */

                if (
                    websiteField?.value
                ) {

                    return;

                }



                if (
                    !supabaseClient
                ) {

                    console.error(
                        "Supabase no está conectado."
                    );

                    return;

                }



                const message =
                    messageInput
                        ?.value
                        .trim();



                if (!message) {

                    return;

                }



                /* -----------------------------------------
                   CARGAR USUARIO DE LA ABEJA
                ----------------------------------------- */

                const userReady =
                    await loadBeeUser();



                if (!userReady) {


                    console.warn(
                        "No se puede enviar porque este visitante todavía no tiene un username de Desorden Social."
                    );


                    /*
                        Le damos una pista SIN meter
                        otro formulario de identidad.
                    */

                    if (messageInput) {

                        messageInput.placeholder =
                            "elige primero tu usuario con la abeja...";

                    }


                    return;

                }



                /* -----------------------------------------
                   PEQUEÑO COOLDOWN
                ----------------------------------------- */

                const now =
                    Date.now();


                if (
                    now -
                    lastSend <
                    2500
                ) {

                    return;

                }


                lastSend =
                    now;



                /* -----------------------------------------
                   INSERT
                ----------------------------------------- */

                const {
                    data,
                    error
                } =
                    await supabaseClient

                        .from(
                            "interview_chat"
                        )

                        .insert(
                            {

                                created_by:
                                    currentUser.id,

                                message:
                                    message.slice(
                                        0,
                                        500
                                    )

                            }
                        )

                        .select(
                            "id,created_by,message,created_at"
                        )

                        .single();



                if (error) {

                    console.error(
                        "Error enviando mensaje:",
                        error
                    );

                    return;

                }



                /*
                    Lo dibujamos ya.
                    Si realtime llega después,
                    renderMessage evita duplicarlo.
                */

                renderMessage(
                    data,
                    currentUsername,
                    true
                );



                messageInput.value =
                    "";


                messageInput.style.height =
                    "auto";


                messageInput.placeholder =
                    "di algo...";

            }
        );

    }



    /* =====================================================
       INICIAR SUPABASE / CHAT
    ===================================================== */

    if (supabaseClient) {

        await loadBeeUser();

        await loadMessages();

        startRealtime();

    }



    /* =====================================================
       =====================================================
       CURSOR
       =====================================================
    ===================================================== */

    if (
        cursor &&
        window.matchMedia(
            "(hover: hover)"
        ).matches
    ) {


        let mouseX = 0;

        let mouseY = 0;

        let cursorFrame =
            null;



        function paintCursor() {

            cursorFrame =
                null;


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
                    cursorFrame ===
                    null
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

    }


});