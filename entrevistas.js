/* =========================================================
   DESORDEN SOCIAL — ENTREVISTAS
   entrevistas.js

   - cara + datamosh responsive
   - fallback seguro para móvil / Safari
   - scroll de "let's talk to each other"
   - chat Supabase
   - usa la sesión nueva de DesordenUser
   - NO crea usuarios anónimos
   - cursor personalizado
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

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
       ESTADO
    ===================================================== */

    let currentUser = null;
    let currentUsername = null;

    let realtimeChannel = null;

    let fallbackFaceVisible = false;

let scrollAnimationFrame = null;


/* =====================================================
   ESTABILIDAD MÓVIL / iPHONE
===================================================== */

const isTouchDevice =
    window.matchMedia(
        "(pointer: coarse)"
    ).matches;
const isIOS =
    /iPad|iPhone|iPod/.test(
        navigator.userAgent
    ) ||
    (
        navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1
    );


let mobileFaceBase = null;
let mobileFaceA = null;
let mobileFaceB = null;
let hasSuccessfulCanvasFrame = false;

let lastMobileGlitchStep = -1;


/*
   Guardamos el último frame bueno.

   Si Safari falla durante UN frame de scroll,
   mostramos el último frame correcto en vez
   de volver repentinamente a face.svg.
*/

const backupCanvas =
    document.createElement("canvas");

const backupCtx =
    backupCanvas.getContext("2d");

    /* =====================================================
       UTILIDADES
    ===================================================== */

    function clamp(value, min, max) {
        return Math.max(
            min,
            Math.min(max, value)
        );
    }


    function getDb() {
        return window.db || null;
    }


    function getFaceTransform(progress) {

        /*
           La cara empieza algo más abajo
           y termina subiendo durante el scroll.
        */

        const faceStart = 9;
        const faceEnd = -36;

        const faceY =
            faceStart +
            (
                faceEnd -
                faceStart
            ) *
            progress;

        return (
            `translateX(-50%) ` +
            `translateY(${faceY}vh)`
        );
    }


    /* =====================================================
       CANVAS / DATAMOSH
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

/* =====================================================
   CARA GLITCH ESTABLE — iPHONE / iOS
===================================================== */

function setupIOSFace() {

    if (
        !isIOS ||
        !faceSource
    ) {
        return;
    }


    const faceWrap =
        document.getElementById(
            "faceWrap"
        );


    if (!faceWrap) {
        return;
    }


    /*
       En iPhone NO usamos el canvas durante scroll.
    */

    if (canvas) {
        canvas.style.display =
            "none";
    }


    /* imagen base */

    mobileFaceBase =
        faceSource;

    mobileFaceBase.style.display =
        "block";

    mobileFaceBase.classList.add(
        "ios-face-base"
    );


    /* primera capa glitch */

    mobileFaceA =
        faceSource.cloneNode(
            true
        );

    mobileFaceA.removeAttribute(
        "id"
    );

    mobileFaceA.setAttribute(
        "aria-hidden",
        "true"
    );

    mobileFaceA.classList.add(
        "ios-face-glitch",
        "ios-face-glitch-a"
    );


    /* segunda capa glitch */

    mobileFaceB =
        faceSource.cloneNode(
            true
        );

    mobileFaceB.removeAttribute(
        "id"
    );

    mobileFaceB.setAttribute(
        "aria-hidden",
        "true"
    );

    mobileFaceB.classList.add(
        "ios-face-glitch",
        "ios-face-glitch-b"
    );


    faceWrap.append(
        mobileFaceA,
        mobileFaceB
    );

}


setupIOSFace();

    function hideFaceFallback() {

        if (!faceSource) {
            return;
        }

        fallbackFaceVisible = false;

        /*
           Volvemos a respetar el CSS original:
           .face-source { display: none; }
        */

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

        if (canvas) {
            canvas.style.opacity = "";
        }

    }


    function showFaceFallback(progress = 0) {

        if (
            !faceSource ||
            !canvas
        ) {
            return;
        }

        fallbackFaceVisible = true;

        /*
           Si un móvil no consigue rasterizar el SVG
           dentro del canvas, mostramos el propio SVG
           en el mismo sitio.

           Así nunca desaparece la cara completa.
        */

        const canvasStyles =
            window.getComputedStyle(
                canvas
            );

        const rect =
            canvas.getBoundingClientRect();

        faceSource.style.display =
            "block";

        faceSource.style.position =
            "absolute";

        faceSource.style.left =
            "50%";

        faceSource.style.top =
            canvasStyles.top || "10vh";

        faceSource.style.width =
            `${Math.max(
                1,
                Math.round(rect.width)
            )}px`;

        faceSource.style.height =
            "auto";

        faceSource.style.transform =
            getFaceTransform(
                progress
            );

        faceSource.style.mixBlendMode =
            "multiply";

        faceSource.style.opacity =
            "0.98";

        faceSource.style.pointerEvents =
            "none";

        faceSource.style.zIndex =
            "1";

        canvas.style.opacity =
            "0";

    }


    function canvasContainsVisibleFace(
        imageData
    ) {

        if (
            !imageData ||
            !imageData.data ||
            !imageData.data.length
        ) {
            return false;
        }

        const pixels =
            imageData.data;

        /*
           El fondo que pintamos es:
           rgb(236, 239, 49)

           Si todo sigue prácticamente igual,
           el SVG no llegó a dibujarse.
        */

        const step =
            4 * 31;

        for (
            let i = 0;
            i < pixels.length;
            i += step
        ) {

            const r =
                pixels[i];

            const g =
                pixels[i + 1];

            const b =
                pixels[i + 2];

            const a =
                pixels[i + 3];

            if (
                a > 0 &&
                (
                    Math.abs(r - 236) +
                    Math.abs(g - 239) +
                    Math.abs(b - 49)
                ) >
                18
            ) {
                return true;
            }

        }

        return false;

    }


    function drawSourceIntoCanvas(
        cw,
        ch
    ) {

        if (
            !ctx ||
            !faceSource
        ) {
            return false;
        }


        const iw =
            Number(
                faceSource.naturalWidth
            ) || 0;

        const ih =
            Number(
                faceSource.naturalHeight
            ) || 0;


        try {

            /*
               Caso normal:
               el navegador conoce el tamaño
               intrínseco del SVG.
            */

            if (
                iw > 0 &&
                ih > 0
            ) {

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
                        (iw - sw) /
                        2;

                }
                else {

                    sh =
                        iw /
                        targetRatio;

                    sy =
                        (ih - sh) /
                        2;

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

            }
            else {

                /*
                   Fallback de rasterización:
                   algunos WebKit/Safari pueden
                   no dar dimensiones intrínsecas
                   fiables para ciertos SVG.

                   Intentamos dibujarlo directamente.
                */

                ctx.drawImage(
                    faceSource,
                    0,
                    0,
                    cw,
                    ch
                );

            }


            /*
               Comprobamos que realmente apareció
               información visual en el canvas.
            */

            const probe =
                ctx.getImageData(
                    0,
                    0,
                    cw,
                    ch
                );

            return canvasContainsVisibleFace(
                probe
            );

        }
        catch (error) {

            console.warn(
                "No se pudo rasterizar face.svg en el canvas:",
                error
            );

            return false;

        }

    }


   function drawDatamosh(
    progress = 0
) {

    /*
       iPhone utiliza las capas SVG estables,
       no el canvas.
    */

    if (isIOS) {
        return;
    }


    if (
        !canvas ||
        !ctx ||
        !faceSource ||
        !faceSource.complete
    ) {
        return;
    }


    /* =================================================
       MÓVIL:
       no generamos un glitch completamente nuevo
       por cada píxel de scroll.

       Lo dividimos en pasos pequeños y estables.
    ================================================= */

    if (isTouchDevice) {

        const mobileStep =
            Math.round(
                progress * 45
            );

        if (
            mobileStep ===
            lastMobileGlitchStep
        ) {
            return;
        }

        lastMobileGlitchStep =
            mobileStep;

    }


        const rect =
            canvas.getBoundingClientRect();


        const displayWidth =
            Math.max(
                1,
                rect.width ||
                canvas.clientWidth ||
                800
            );


        /*
           Conservamos la proporción visual
           que ya tenía la pieza.
        */

        const displayHeight =
            Math.round(
                displayWidth *
                1.34
            );


        /*
           Canvas interno pequeño =
           pixelación más visible y menos
           carga para móviles.
        */

        const internalScale =
            window.matchMedia(
                "(max-width: 640px)"
            ).matches
                ? 0.48
                : 0.43;


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


        /*
           Cambiar width/height limpia el canvas
           y restablece su estado.
        */

        if (
            canvas.width !== cw
        ) {
            canvas.width = cw;
        }

        if (
            canvas.height !== ch
        ) {
            canvas.height = ch;
        }


        ctx.globalAlpha = 1;

        ctx.clearRect(
            0,
            0,
            cw,
            ch
        );


        /* fondo amarillo */

        ctx.fillStyle =
            "#ecef31";

        ctx.fillRect(
            0,
            0,
            cw,
            ch
        );


        /*
           Dibujar SVG.

           Si Safari/iOS no puede hacerlo,
           enseñamos el SVG directamente
           en lugar de dejar una pantalla vacía.
        */

        const sourceWasDrawn =
    drawSourceIntoCanvas(
        cw,
        ch
    );


if (!sourceWasDrawn) {

    /*
       Si ya conseguimos dibujar correctamente
       al menos una vez, NO volvemos al SVG normal.

       Safari puede fallar un frame durante el scroll.
       En ese caso recuperamos el último frame bueno.
    */

    if (
        hasSuccessfulCanvasFrame &&
        backupCanvas.width > 0 &&
        backupCanvas.height > 0
    ) {

        ctx.clearRect(
            0,
            0,
            cw,
            ch
        );

        ctx.drawImage(
            backupCanvas,
            0,
            0,
            backupCanvas.width,
            backupCanvas.height,
            0,
            0,
            cw,
            ch
        );

        hideFaceFallback();

        canvas.style.opacity =
            "0.98";

        return;
    }


    /*
       Solo utilizamos el SVG directo
       si Safari JAMÁS consiguió generar
       el canvas.
    */

    showFaceFallback(
        progress
    );

    return;
}


hasSuccessfulCanvasFrame = true;

hideFaceFallback();


        /* =================================================
           CONVERTIR TODO A LOS DOS COLORES
        ================================================= */

        let imageData = null;

        try {

            imageData =
                ctx.getImageData(
                    0,
                    0,
                    cw,
                    ch
                );

        }
       catch (error) {

    console.warn(
        "Safari no pudo leer un frame del canvas.",
        error
    );


    if (
        hasSuccessfulCanvasFrame &&
        backupCanvas.width > 0 &&
        backupCanvas.height > 0
    ) {

        ctx.clearRect(
            0,
            0,
            cw,
            ch
        );

        ctx.drawImage(
            backupCanvas,
            0,
            0,
            backupCanvas.width,
            backupCanvas.height,
            0,
            0,
            cw,
            ch
        );

        hideFaceFallback();

        canvas.style.opacity =
            "0.98";

        return;
    }


    showFaceFallback(
        progress
    );

    return;
}


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
                ) /
                255;


            const darkness =
                Math.pow(
                    1 -
                    luminance,
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
            Math.max(
                1,
                Math.floor(
                    cw *
                    0.10 *
                    intensity
                )
            );


        for (
            let i = 0;
            i < slices;
            i++
        ) {

            const sliceHeight =
                Math.max(
                    1,
                    Math.floor(
                        5 +
                        Math.random() *
                        ch *
                        0.07
                    )
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

            }
            catch (error) {

                /*
                   Un bloque inválido no debe
                   romper toda la animación.
                */

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
                    Math.random() *
                    28
                );


            const height =
                Math.floor(
                    4 +
                    Math.random() *
                    25
                );


            const x =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        cw -
                        width
                    )
                );


            const y =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        ch -
                        height
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

            }
            catch (error) {

                /*
                   Ignoramos únicamente
                   el fragmento inválido.
                */

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
                    Math.random() *
                    14
                );


            const x =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        cw -
                        size
                    )
                );


            const y =
                Math.floor(
                    Math.random() *
                    Math.max(
                        1,
                        ch -
                        size
                    )
                );


            ctx.fillStyle =
                Math.random() >
                0.5
                    ? "#d73a2f"
                    : "#ecef31";


            ctx.globalAlpha =
                0.32 +
                Math.random() *
                0.35;


            ctx.fillRect(
                x,
                y,
                size,
                size
            );

        }


        ctx.globalAlpha = 1;


        /* =================================================
           SCANLINES SUAVES
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

        /* =================================================
   GUARDAR ÚLTIMO FRAME CORRECTO
================================================= */

if (
    isTouchDevice &&
    backupCtx
) {

    if (
        backupCanvas.width !== cw ||
        backupCanvas.height !== ch
    ) {

        backupCanvas.width =
            cw;

        backupCanvas.height =
            ch;

    }


    backupCtx.clearRect(
        0,
        0,
        cw,
        ch
    );


    backupCtx.drawImage(
        canvas,
        0,
        0
    );

}

    }


    /* =====================================================
       SCROLL
    ===================================================== */

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
            Math.max(
                0,
                section.offsetHeight -
                window.innerHeight
            );


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


        /* cara */

        const faceTransform =
    getFaceTransform(
        progress
    );


/* =================================================
   CARA — iPHONE
================================================= */

if (
    isIOS &&
    mobileFaceBase &&
    mobileFaceA &&
    mobileFaceB
) {

    /*
       Movimiento general de la cara.
    */

    mobileFaceBase.style.transform =
        faceTransform;


    /*
       Dos desplazamientos distintos generan
       las roturas horizontales del glitch.

       Son deterministas: no hay Math.random()
       haciendo que Safari salte de un frame a otro.
    */

    const glitchA =
        Math.sin(
            progress * 38
        ) *
        (
            3 +
            progress * 18
        );


    const glitchB =
        Math.cos(
            progress * 51
        ) *
        (
            3 +
            progress * 14
        );


    mobileFaceA.style.transform =
        `${faceTransform} translateX(${glitchA}px)`;


    mobileFaceB.style.transform =
        `${faceTransform} translateX(${glitchB}px)`;


    /*
       A medida que bajas,
       el glitch se hace un poco más evidente.
    */

    mobileFaceA.style.opacity =
        String(
            0.38 +
            progress * 0.38
        );


    mobileFaceB.style.opacity =
        String(
            0.30 +
            progress * 0.42
        );

}


/* =================================================
   CARA — DESKTOP / RESTO
================================================= */

else {

    canvas.style.transform =
        faceTransform;


    if (
        fallbackFaceVisible &&
        faceSource
    ) {

        faceSource.style.transform =
            faceTransform;

    }

}


        /* texto */

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
            `translateY(${
                totalTravel *
                progress
            }px)`;


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


    window.addEventListener(
        "orientationchange",
        requestScrollUpdate
    );


    window.addEventListener(
        "pageshow",
        requestScrollUpdate
    );





    /*
       Esperamos a que la imagen esté realmente
       disponible antes de pintar.

       decode() ayuda especialmente en móviles,
       pero si no está disponible o falla,
       seguimos usando el evento load.
    */

    if (faceSource) {

       const startFace =
    async () => {


        /*
           En iPhone la imagen ya funciona como <img>.
           No esperamos decode() del SVG.
        */

        if (isIOS) {

            requestScrollUpdate();

            return;

        }


        if (
            typeof faceSource.decode ===
            "function"
        ) {

            try {

                await faceSource.decode();

            }
            catch (error) {

                /*
                   load / complete sigue siendo suficiente
                */

            }

        }


        requestScrollUpdate();

    };


        if (
            faceSource.complete
        ) {

            await startFace();

        }
        else {

            faceSource.addEventListener(
                "load",
                startFace,
                {
                    once: true
                }
            );


            faceSource.addEventListener(
                "error",
                () => {

                    console.error(
                        "No se pudo cargar la imagen de la cara:",
                        faceSource.currentSrc ||
                        faceSource.src
                    );

                },
                {
                    once: true
                }
            );

        }

    }


    /*
       Pintado inicial aunque el navegador
       no haya generado ningún scroll.
    */

    requestScrollUpdate();


    /* =====================================================
       IDENTIDAD — NUEVO SISTEMA @ + CONTRASEÑA

       Esta página NO crea sesiones anónimas.
       Usa la misma sesión que user-session.js.
    ===================================================== */

    async function loadBeeUser() {

        currentUser = null;
        currentUsername = null;


        /*
           Ruta principal:
           usar la API compartida del nuevo sistema.
        */

        if (
            window.DesordenUser
        ) {

            try {

                const user =
                    await window
                        .DesordenUser
                        .getCurrentUser();


                if (
                    !user ||
                    user.is_anonymous
                ) {
                    return false;
                }


                const profile =
                    await window
                        .DesordenUser
                        .getProfile();


                if (
                    !profile?.username
                ) {
                    return false;
                }


                currentUser =
                    user;

                currentUsername =
                    profile.username;


                return true;

            }
            catch (error) {

                console.error(
                    "Error leyendo la sesión de DesordenUser:",
                    error
                );

                return false;

            }

        }


        /*
           Fallback:
           si DesordenUser no está cargado,
           leemos una sesión permanente existente.
           Nunca creamos una sesión anónima.
        */

        const db =
            getDb();


        if (!db) {

            console.warn(
                "Supabase no está disponible en entrevistas.js"
            );

            return false;

        }


        const {
            data: sessionData,
            error: sessionError
        } =
            await db
                .auth
                .getSession();


        if (sessionError) {

            console.error(
                "Error recuperando sesión:",
                sessionError
            );

            return false;

        }


        const user =
            sessionData
                ?.session
                ?.user ||
            null;


        if (
            !user ||
            user.is_anonymous
        ) {
            return false;
        }


        const {
            data: profile,
            error: profileError
        } =
            await db
                .from(
                    "profiles"
                )
                .select(
                    "username"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (profileError) {

            console.error(
                "Error cargando username:",
                profileError
            );

            return false;

        }


        if (
            !profile?.username
        ) {
            return false;
        }


        currentUser =
            user;

        currentUsername =
            profile.username;


        return true;

    }


    /*
       Si la abeja crea, recupera o cierra
       una sesión mientras esta página está abierta,
       actualizamos aquí la identidad.
    */

    window.addEventListener(
        "desorden:user-ready",
        () => {
            loadBeeUser();
        }
    );


    /* =====================================================
       CHAT — UTILIDADES
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
                ) >>>
                0;

        }


        /*
           Escritorio:
           mantiene la dispersión original.

           Móvil:
           reducimos el desplazamiento para que
           ningún mensaje salga del viewport.
        */

        const isMobile =
            window.matchMedia(
                "(max-width: 640px)"
            ).matches;

        const baseOffset =
            isMobile
                ? 2
                : 3;

        const spread =
            isMobile
                ? 17
                : 50;

        return (
            baseOffset +
            (
                hash %
                spread
            )
        );

    }


    function cleanUsername(
        username
    ) {

        if (!username) {
            return "@usuario";
        }


        return username
            .startsWith("@")
                ? username
                : `@${username}`;

    }


    async function getUsernameMap(
        rows
    ) {

        const map =
            new Map();


        const db =
            getDb();


        if (
            !db ||
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
                        .filter(
                            Boolean
                        )
                )
            ];


        if (!ids.length) {
            return map;
        }


        const {
            data,
            error
        } =
            await db
                .from(
                    "profiles"
                )
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
           evitar duplicados de realtime
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
            `${messageOffset(
                row.id
            )}%`
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
            row.message ||
            "";


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

        const db =
            getDb();


        if (
            !db ||
            !stream
        ) {
            return;
        }


        const {
            data: rows,
            error
        } =
            await db
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
                .limit(
                    100
                );


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

        const db =
            getDb();


        if (!db) {
            return;
        }


        if (realtimeChannel) {
            return;
        }


        realtimeChannel =
            db
                .channel(
                    "desorden-interview-chat"
                )
                .on(
                    "postgres_changes",

                    {
                        event:
                            "INSERT",

                        schema:
                            "public",

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

                        }
                        else {

                            const {
                                data,
                                error
                            } =
                                await db
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


                            if (error) {

                                console.error(
                                    "No se pudo cargar el username del mensaje:",
                                    error
                                );

                            }


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
                    (
                        Math.min(
                            messageInput.scrollHeight,
                            180
                        )
                    ) +
                    "px";

            }
        );

    }


    /* =====================================================
       ENVIAR MENSAJE
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


                const db =
                    getDb();


                if (!db) {

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


                /*
                   Recuperamos la identidad permanente
                   del sistema de la abeja.
                */

                const userReady =
                    await loadBeeUser();


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


                /*
                   pequeño cooldown
                */

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


                const {
                    data,
                    error
                } =
                    await db
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
                   Lo dibujamos inmediatamente.
                   Si realtime llega después,
                   renderMessage evita el duplicado.
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
       INICIAR CHAT
    ===================================================== */

    if (
        getDb()
    ) {

        await loadBeeUser();

        await loadMessages();

        startRealtime();

    }
    else {

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
/* =========================================================
   ABEJA — SOLO EN LA ZONA DEL CHAT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const bee =
            document.getElementById("bee");

        const chatSection =
            document.querySelector(
                ".conversation-section"
            );


        if (
            !bee ||
            !chatSection
        ) {
            return;
        }


        function updateBeeVisibility() {

            const chatRect =
                chatSection
                    .getBoundingClientRect();


            /*
               La abeja aparece únicamente
               cuando hemos entrado completamente
               en la zona amarilla del chat.
            */

            const showBee =
                chatRect.top <= 0;


            if (showBee) {

                bee.style.opacity =
                    "1";

                bee.style.visibility =
                    "visible";

                bee.style.pointerEvents =
                    "auto";

            }
            else {

                bee.style.opacity =
                    "0";

                bee.style.visibility =
                    "hidden";

                bee.style.pointerEvents =
                    "none";

            }

        }


        /*
           La escondemos desde el principio
           para evitar que haga un pequeño flash
           al cargar la página.
        */

        bee.style.opacity =
            "0";

        bee.style.visibility =
            "hidden";

        bee.style.pointerEvents =
            "none";


        window.addEventListener(
            "scroll",
            updateBeeVisibility,
            {
                passive: true
            }
        );


        window.addEventListener(
            "resize",
            updateBeeVisibility
        );


        updateBeeVisibility();

    }
);