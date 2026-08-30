/* =========================================================
   DESORDEN SOCIAL
   MOTOR DE COLOCACIÓN DE NUDOS
========================================================= */

(() => {

    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const NODE_SELECTOR =
        ".node, .external-node, .user-node, .placement-preview";

    /*
       Distancia mínima que queremos mantener
       entre un nudo y otro.
    */

    const MIN_GAP = 22;

const AURA_PADDING = 32;

    /*
       Margen para evitar colocar cosas
       pegadas al borde superior o izquierdo.
    */

    const EDGE_MARGIN = 90;

    /*
       Distancia inicial desde el nudo padre.
    */

    const BASE_RADIUS = 240;

    /*
       Si alrededor está lleno,
       vamos alejándonos.
    */

    const RING_STEP = 75;

    /*
       Número de posiciones que probamos
       aproximadamente por cada vuelta.
    */

    const CANDIDATES_PER_RING = 14;

    /*
       Cuántas vueltas podemos intentar
       antes de usar una posición de emergencia.
    */

    const MAX_RINGS = 12;

    /*
       Ángulo áureo.
       Evita que los nudos parezcan
       colocados sobre una cuadrícula rígida.
    */

    const GOLDEN_ANGLE = 137.507764;


    /* =====================================================
       NUDOS SEMILLA QUE YA EXISTEN EN CARA
    ===================================================== */

    const SEED_SELECTORS = {

        "perfect-days":
            ".node-perfect-days",

        "directores":
            ".node-directores",

        "lynch-patti-smith":
            ".lynch-interview-node",

        "almodovar-roche-bobois":
            ".node-roche",

        "chairs-video":
            ".chairs-video-node"

    };


    /* =====================================================
       OBTENER EL LIENZO
    ===================================================== */

    function getCanvas() {

        return document.querySelector(
            ".network-canvas"
        );

    }


    /* =====================================================
       ENCONTRAR UN NUDO A PARTIR DE SU SLUG
       O DE SU ELEMENTO HTML
    ===================================================== */

    function resolveNode(reference) {

        if (!reference) {
            return null;
        }


        /*
           Si ya nos pasan directamente
           un elemento HTML.
        */

        if (reference instanceof Element) {

            return reference;

        }


        /*
           Nudos iniciales de Cara.
        */

        if (SEED_SELECTORS[reference]) {

            return document.querySelector(
                SEED_SELECTORS[reference]
            );

        }


        /*
           Nudos creados por usuarios.
        */

        const safeReference =
            String(reference)
                .replace(/\\/g, "\\\\")
                .replace(/"/g, '\\"');


        const userNode =
            document.querySelector(
                `[data-node-slug="${safeReference}"]`
            ) ||
            document.querySelector(
                `[data-node-id="${safeReference}"]`
            );


        if (userNode) {
            return userNode;
        }


        /*
           Permitimos también pasar
           directamente un selector CSS.
        */

        if (
            String(reference).startsWith(".") ||
            String(reference).startsWith("#")
        ) {

            try {

                return document.querySelector(
                    reference
                );

            } catch (error) {

                return null;

            }

        }


        return null;

    }


    /* =====================================================
       CENTRO DE UN NUDO DENTRO DEL LIENZO
    ===================================================== */

    function getNodeCenter(element) {

        const canvas =
            getCanvas();


        if (
            !canvas ||
            !element
        ) {
            return null;
        }


        const elementRect =
            element.getBoundingClientRect();

        const canvasRect =
            canvas.getBoundingClientRect();


        return {

            x:
                elementRect.left -
                canvasRect.left +
                elementRect.width / 2,

            y:
                elementRect.top -
                canvasRect.top +
                elementRect.height / 2

        };

    }


    /* =====================================================
       RECTÁNGULO RESERVADO PARA CADA NUDO
    ===================================================== */

   function getReservedRect(element) {

    const canvas =
        getCanvas();


    if (
        !canvas ||
        !element
    ) {
        return null;
    }


    const elementRect =
        element.getBoundingClientRect();

    const canvasRect =
        canvas.getBoundingClientRect();


    /*
       Buscamos también la aureola real.

       El blur visual no forma parte del tamaño
       del elemento, por eso añadimos AURA_PADDING.
    */

    const aura =
        element.querySelector(
            ".user-node-aura, .external-pin, .node-pin"
        );


    const auraRect =
        aura
            ? aura.getBoundingClientRect()
            : null;


    const centerX =
        elementRect.left -
        canvasRect.left +
        elementRect.width / 2;


    const centerY =
        elementRect.top -
        canvasRect.top +
        elementRect.height / 2;


    /*
       Reservamos el mayor tamaño entre:
       - contenido
       - portada
       - aureola

       y después añadimos espacio para el blur.
    */

    const width =
        Math.max(
            elementRect.width,
            auraRect?.width || 0,
            190
        ) +
        AURA_PADDING * 2;


    const height =
        Math.max(
            elementRect.height,
            auraRect?.height || 0,
            180
        ) +
        AURA_PADDING * 2;


    return {

        left:
            centerX - width / 2,

        right:
            centerX + width / 2,

        top:
            centerY - height / 2,

        bottom:
            centerY + height / 2,

        width,

        height,

        centerX,

        centerY,

        element

    };

}

    /* =====================================================
       TODOS LOS ESPACIOS YA OCUPADOS
    ===================================================== */

    function getOccupiedRects(
        ignoreElement = null
    ) {

        const canvas =
            getCanvas();


        if (!canvas) {
            return [];
        }


        return Array
            .from(
                canvas.querySelectorAll(
                    NODE_SELECTOR
                )
            )
            .filter(element => {

                if (
                    ignoreElement &&
                    element === ignoreElement
                ) {
                    return false;
                }


                /*
                   Ignoramos elementos
                   que no están visibles.
                */

                const style =
                    window.getComputedStyle(
                        element
                    );


                return (
                    style.display !== "none" &&
                    style.visibility !== "hidden"
                );

            })
            .map(
                getReservedRect
            )
            .filter(Boolean);

    }


    /* =====================================================
       TAMAÑO ESTIMADO DE UN NUDO NUEVO
    ===================================================== */

   function estimateNodeSize(
    nodeData = {}
) {

    switch (
        nodeData.content_type
    ) {

        case "image":
        case "icon":
        case "video":

            return {
                width: 235,
                height: 235
            };


        case "mixed":

            return {
                width: 270,
                height: 255
            };


        case "text":
        case "link":
        default:

            return {
                width: 250,
                height: 225
            };

    }

}


    /* =====================================================
       ¿ESA POSICIÓN CHOCA CON ALGO?
    ===================================================== */

    function hasCollision(
        candidate,
        size,
        ignoreElement = null
    ) {

        const occupied =
            getOccupiedRects(
                ignoreElement
            );


        const candidateRect = {

            left:
                candidate.x -
                size.width / 2,

            right:
                candidate.x +
                size.width / 2,

            top:
                candidate.y -
                size.height / 2,

            bottom:
                candidate.y +
                size.height / 2

        };


        /*
           No dejamos que aparezca
           pegado al borde superior
           o izquierdo.
        */

        if (
            candidateRect.left <
                EDGE_MARGIN ||

            candidateRect.top <
                EDGE_MARGIN
        ) {

            return true;

        }


        /*
           Comprobamos cada nudo existente.
        */

        for (
            const rect
            of occupied
        ) {

            const overlaps =
                candidateRect.right +
                    MIN_GAP >
                    rect.left &&

                candidateRect.left -
                    MIN_GAP <
                    rect.right &&

                candidateRect.bottom +
                    MIN_GAP >
                    rect.top &&

                candidateRect.top -
                    MIN_GAP <
                    rect.bottom;


            if (overlaps) {

                return true;

            }

        }


        return false;

    }


    /* =====================================================
       HACER CRECER CARA SI HACE FALTA
    ===================================================== */

    function expandCanvasIfNeeded(
        position,
        size
    ) {

        const canvas =
            getCanvas();


        if (!canvas) {
            return;
        }


        const currentWidth =
            canvas.offsetWidth;

        const currentHeight =
            canvas.offsetHeight;


        const requiredWidth =
            Math.ceil(
                position.x +
                size.width / 2 +
                EDGE_MARGIN
            );

        const requiredHeight =
            Math.ceil(
                position.y +
                size.height / 2 +
                EDGE_MARGIN
            );


        /*
           Cara crece por bloques,
           no píxel a píxel.
        */

        const growthBlock = 300;


        let newWidth =
            currentWidth;

        let newHeight =
            currentHeight;


        if (
            requiredWidth >
            currentWidth
        ) {

            newWidth =
                Math.ceil(
                    requiredWidth /
                    growthBlock
                ) *
                growthBlock;

        }


        if (
            requiredHeight >
            currentHeight
        ) {

            newHeight =
                Math.ceil(
                    requiredHeight /
                    growthBlock
                ) *
                growthBlock;

        }


        let changed = false;


        if (
            newWidth >
            currentWidth
        ) {

            canvas.style.width =
                `${newWidth}px`;

            canvas.style.minWidth =
                `${newWidth}px`;

            changed = true;

        }


        if (
            newHeight >
            currentHeight
        ) {

            canvas.style.height =
                `${newHeight}px`;

            canvas.style.minHeight =
                `${newHeight}px`;

            changed = true;

        }


        /*
           Avisamos a otros archivos,
           por ejemplo al sistema
           del hilo rojo.
        */

        if (changed) {

            window.dispatchEvent(
                new CustomEvent(
                    "desorden:canvas-resized",
                    {
                        detail: {
                            width:
                                newWidth,

                            height:
                                newHeight
                        }
                    }
                )
            );

        }

    }

/* =====================================================
   CENTRO ESPACIAL DE LA RED

   Las conexiones NO determinan la posición.
===================================================== */

function getPackingCenter() {

    const canvas =
        getCanvas();


    if (!canvas) {
        return null;
    }


    const occupied =
        getOccupiedRects();


    /*
       Si todavía no existen nudos,
       empezamos aproximadamente
       en el centro del lienzo.
    */

    if (!occupied.length) {

        return {

            x:
                Math.max(
                    250,
                    canvas.offsetWidth / 2
                ),

            y:
                Math.max(
                    250,
                    canvas.offsetHeight / 2
                )

        };

    }


    let totalX = 0;
    let totalY = 0;


    occupied.forEach(rect => {

        totalX +=
            (
                rect.left +
                rect.right
            ) / 2;


        totalY +=
            (
                rect.top +
                rect.bottom
            ) / 2;

    });


    return {

        x:
            totalX /
            occupied.length,

        y:
            totalY /
            occupied.length

    };

}


/* =====================================================
   BUSCAR EL HUECO LIBRE MÁS CERCANO

   parentReference se mantiene únicamente
   para que el resto del código siga siendo compatible.

   YA NO se usa para decidir la posición.
===================================================== */

function findFreePosition(
    parentReference = null,
    options = {}
) {

    const canvas =
        getCanvas();


    if (!canvas) {
        return null;
    }


    const size =
        options.size ||
        estimateNodeSize(
            options.nodeData || {}
        );


    const center =
        getPackingCenter();


    if (!center) {
        return null;
    }


    const occupiedCount =
        getOccupiedRects()
            .length;


    /*
       Una ligera variación evita
       composiciones demasiado perfectas.
    */

    const angleOffset =
        (
            occupiedCount *
            37
        ) %
        360;


    /*
       Búsqueda compacta.

       Empezamos en el centro de la red
       y vamos abriendo una espiral.

       Por tanto:
       primero intenta llenar huecos,
       después crece hacia fuera.
    */

    const SEARCH_STEP = 28;

    const SLOTS_PER_RING = 24;

    const MAX_SEARCH_RINGS = 55;


    for (
        let ring = 0;
        ring < MAX_SEARCH_RINGS;
        ring++
    ) {

        const radius =
            ring *
            SEARCH_STEP;


        const slots =
            ring === 0
                ? 1
                : SLOTS_PER_RING;


        for (
            let slot = 0;
            slot < slots;
            slot++
        ) {

            const index =
                ring *
                SLOTS_PER_RING +
                slot;


            const angleDegrees =
                (
                    angleOffset +
                    index *
                    GOLDEN_ANGLE
                ) %
                360;


            const angle =
                angleDegrees *
                Math.PI /
                180;


            const candidate = {

                x:
                    center.x +
                    Math.cos(
                        angle
                    ) *
                    radius,

                y:
                    center.y +
                    Math.sin(
                        angle
                    ) *
                    radius

            };


            if (
                !hasCollision(
                    candidate,
                    size
                )
            ) {

                expandCanvasIfNeeded(
                    candidate,
                    size
                );


                return {

                    x:
                        Math.round(
                            candidate.x
                        ),

                    y:
                        Math.round(
                            candidate.y
                        )

                };

            }

        }

    }


    /*
       PLAN B.

       Solo ocurre si la zona está
       realmente saturada.
    */

    const occupied =
        getOccupiedRects();


    const maxRight =
        occupied.length

            ? Math.max(
                ...occupied.map(
                    rect =>
                        rect.right
                )
            )

            : EDGE_MARGIN;


    const maxBottom =
        occupied.length

            ? Math.max(
                ...occupied.map(
                    rect =>
                        rect.bottom
                )
            )

            : EDGE_MARGIN;


    let fallback = {

        x:
            maxRight +
            size.width / 2 +
            MIN_GAP,

        y:
            Math.max(
                center.y,
                EDGE_MARGIN +
                size.height / 2
            )

    };


    if (
        hasCollision(
            fallback,
            size
        )
    ) {

        fallback = {

            x:
                Math.max(
                    center.x,
                    EDGE_MARGIN +
                    size.width / 2
                ),

            y:
                maxBottom +
                size.height / 2 +
                MIN_GAP

        };

    }


    expandCanvasIfNeeded(
        fallback,
        size
    );


    return {

        x:
            Math.round(
                fallback.x
            ),

        y:
            Math.round(
                fallback.y
            )

    };

}

    /* =====================================================
       PRUEBA VISUAL

       Crea durante unos segundos
       una caja que representa
       dónde iría un nuevo nudo.

       NO guarda nada.
    ===================================================== */

    function previewPosition(
        parentReference,
        options = {}
    ) {

        const canvas =
            getCanvas();


        if (!canvas) {
            return null;
        }


        const size =
            options.size ||
            estimateNodeSize(
                options.nodeData || {}
            );


        const position =
            findFreePosition(
                parentReference,
                {
                    ...options,
                    size
                }
            );


        if (!position) {
            return null;
        }


        const preview =
            document.createElement(
                "div"
            );


        preview.className =
            "placement-preview";


        preview.textContent =
            "nuevo nudo";


        Object.assign(
            preview.style,
            {

                position:
                    "absolute",

                left:
                    `${position.x}px`,

                top:
                    `${position.y}px`,

                width:
                    `${size.width}px`,

                height:
                    `${size.height}px`,

                transform:
                    "translate(-50%, -50%)",

                border:
                    "1px dashed rgba(0,0,0,.35)",

                borderRadius:
                    "50%",

                display:
                    "grid",

                placeItems:
                    "center",

                fontFamily:
                    "Arial, sans-serif",

                fontSize:
                    "11px",

                pointerEvents:
                    "none",

                zIndex:
                    "9999"

            }
        );


        canvas.appendChild(
            preview
        );


        /*
           Desaparece solo.
        */

        setTimeout(
            () => {

                preview.remove();

            },
            5000
        );


        return position;

    }


    /* =====================================================
       HACEMOS DISPONIBLE EL MOTOR
       PARA LOS DEMÁS ARCHIVOS
    ===================================================== */

    window.DesordenPlacement = {

        resolveNode,

        getNodeCenter,

        getOccupiedRects,

        estimateNodeSize,

        hasCollision,

        findFreePosition,

        expandCanvasIfNeeded,

        previewPosition

    };

})();