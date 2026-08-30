/* =========================================================
   DESORDEN SOCIAL
   INTERACCIONES ENTRE NUDOS

   ESCRITORIO
   - hover ilumina conexiones
   - nudos sin conexiones solo crecen

   MÓVIL
   - primer tap muestra conexiones
   - segundo tap entra al nudo
   - nudos sin conexiones entran directamente
========================================================= */

(() => {

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


    let nodesById =
        new Map();


    let connectedIdsById =
        new Map();


    let boundElements =
        new WeakSet();


    /*
       En móvil recuerda qué nudo recibió
       el primer tap.
    */

    let armedNodeId =
        null;


    /* =====================================================
       SABER SI ESTAMOS EN DISPOSITIVO TÁCTIL
    ===================================================== */

    function isTouchDevice() {

        return window.matchMedia(
            "(hover: none), (pointer: coarse)"
        ).matches;

    }


    /* =====================================================
       ENCONTRAR ELEMENTO DE UN NUDO
    ===================================================== */

    function getElement(node) {

        if (!node) {
            return null;
        }


        if (
            SEED_SELECTORS[
                node.slug
            ]
        ) {

            return document
                .querySelector(
                    SEED_SELECTORS[
                        node.slug
                    ]
                );

        }


        return (

            document.querySelector(
                `[data-node-id="${node.id}"]`
            ) ||

            document.querySelector(
                `[data-node-slug="${node.slug}"]`
            )

        );

    }


    /* =====================================================
       SABER SI UN NUDO TIENE CONEXIONES
    ===================================================== */

    function hasConnections(
        nodeId
    ) {

        const connections =
            connectedIdsById.get(
                nodeId
            );


        return Boolean(
            connections &&
            connections.size > 0
        );

    }


    /* =====================================================
       GUARDAR TRANSFORMACIÓN ORIGINAL

       Nos permite hacer crecer un nudo suelto
       SIN moverlo ni cambiar su inclinación.
    ===================================================== */

    function rememberBaseTransform(
        element
    ) {

        if (
            !element ||
            element.dataset
                .desordenBaseTransform
        ) {
            return;
        }


        const transform =
            window
                .getComputedStyle(
                    element
                )
                .transform;


        const baseTransform =
            transform === "none"
                ? "none"
                : transform;


        element.dataset
            .desordenBaseTransform =
            baseTransform;


        element.style
            .setProperty(
                "--desorden-base-transform",
                baseTransform
            );

    }


    /* =====================================================
       ACTUALIZAR ESTADO DEL NUDO

       Si no tiene conexiones le ponemos
       una clase especial.
    ===================================================== */

    function updateNodeState(
        node
    ) {

        const element =
            getElement(
                node
            );


        if (!element) {
            return;
        }


        rememberBaseTransform(
            element
        );


        if (
            hasConnections(
                node.id
            )
        ) {

            element.classList
                .remove(
                    "is-unconnected-node"
                );

        }
        else {

            element.classList
                .add(
                    "is-unconnected-node"
                );

        }

    }


    /* =====================================================
       QUITAR ILUMINACIÓN
    ===================================================== */

    function clearHighlights() {

        document
            .querySelectorAll(
                ".is-connected-highlight, .is-connection-origin"
            )
            .forEach(
                element => {

                    element.classList
                        .remove(
                            "is-connected-highlight",
                            "is-connection-origin"
                        );

                }
            );

    }


    /* =====================================================
       QUITAR ESTADO DE PRIMER TAP
    ===================================================== */

    function clearMobileArmed() {

        document
            .querySelectorAll(
                ".is-mobile-node-armed"
            )
            .forEach(
                element => {

                    element.classList
                        .remove(
                            "is-mobile-node-armed"
                        );

                }
            );


        armedNodeId =
            null;

    }


    /* =====================================================
       ILUMINAR CONEXIONES
    ===================================================== */

    function highlightConnections(
        nodeId
    ) {

        clearHighlights();


        const connectedIds =
            connectedIdsById.get(
                nodeId
            ) ||
            new Set();


        /*
           IMPORTANTE:

           Si este nudo no está conectado
           a nada, no lo convertimos en
           "connection origin".
        */

        if (
            connectedIds.size === 0
        ) {

            return;

        }


        const originNode =
            nodesById.get(
                nodeId
            );


        const originElement =
            getElement(
                originNode
            );


        originElement
            ?.classList
            .add(
                "is-connection-origin"
            );


        connectedIds
            .forEach(
                connectedId => {

                    const connectedNode =
                        nodesById.get(
                            connectedId
                        );


                    const connectedElement =
                        getElement(
                            connectedNode
                        );


                    connectedElement
                        ?.classList
                        .add(
                            "is-connected-highlight"
                        );

                }
            );

    }


    /* =====================================================
       PRIMER TAP EN MÓVIL
    ===================================================== */

    function armMobileNode(
        node,
        element
    ) {

        clearMobileArmed();


        armedNodeId =
            node.id;


        element.classList
            .add(
                "is-mobile-node-armed"
            );


        highlightConnections(
            node.id
        );

    }


    /* =====================================================
       EVENTOS DE CADA NUDO
    ===================================================== */

    function bindNode(
        node
    ) {

        const element =
            getElement(
                node
            );


        if (!element) {
            return;
        }


        /*
           La clase de conectado/no conectado
           sí se actualiza cada vez que cargamos.
        */

        updateNodeState(
            node
        );


        /*
           Los listeners solo se añaden una vez.
        */

        if (
            boundElements.has(
                element
            )
        ) {

            return;

        }


        boundElements.add(
            element
        );


        /* =============================================
           ESCRITORIO — HOVER
        ============================================= */

        element.addEventListener(
            "mouseenter",
            () => {

                if (
                    isTouchDevice()
                ) {
                    return;
                }


                /*
                   Solo iluminamos conexiones
                   si realmente existen.
                */

                if (
                    hasConnections(
                        node.id
                    )
                ) {

                    highlightConnections(
                        node.id
                    );

                }

            }
        );


        element.addEventListener(
            "mouseleave",
            () => {

                if (
                    isTouchDevice()
                ) {
                    return;
                }


                clearHighlights();

            }
        );


        /* =============================================
           MÓVIL — PRIMER TAP / SEGUNDO TAP
        ============================================= */

        element.addEventListener(
            "click",
            event => {

                if (
                    !isTouchDevice()
                ) {

                    /*
                       En ordenador no interferimos
                       con el click original.
                    */

                    return;

                }


                /*
                   Si no tiene conexiones,
                   no hay nada que enseñar.

                   Dejamos que el click continúe
                   y abra el nudo directamente.
                */

                if (
                    !hasConnections(
                        node.id
                    )
                ) {

                    clearMobileArmed();
                    clearHighlights();

                    return;

                }


                /*
                   SEGUNDO TAP sobre el mismo nudo:

                   Dejamos pasar el evento.

                   Eso permite que el código original
                   abra el interior del nudo.
                */

                if (
                    armedNodeId ===
                    node.id
                ) {

                    clearMobileArmed();
                    clearHighlights();

                    return;

                }


                /*
                   PRIMER TAP:

                   impedimos temporalmente
                   que abra el nudo.
                */

                event.preventDefault();

                event.stopPropagation();

                event.stopImmediatePropagation();


                armMobileNode(
                    node,
                    element
                );

            },

            /*
               Capture = true.

               Así interceptamos el primer tap
               antes del código que abre el nudo.
            */

            true
        );

    }


    /* =====================================================
       CARGAR RED DESDE SUPABASE
    ===================================================== */

    async function load() {

        if (!window.db) {

            console.error(
                "Supabase no está disponible para las interacciones."
            );

            return;

        }


        const [
            nodesResult,
            connectionsResult
        ] =
            await Promise.all([

                window.db
                    .from("nodes")
                    .select(
                        "id, slug, title"
                    )
                    .eq(
                        "is_published",
                        true
                    ),

                window.db
                    .from(
                        "connections"
                    )
                    .select(
                        "from_node, to_node"
                    )
                    .eq(
                        "is_published",
                        true
                    )

            ]);


        if (
            nodesResult.error
        ) {

            console.error(
                "Error cargando nudos:",
                nodesResult.error
            );

            return;

        }


        if (
            connectionsResult.error
        ) {

            console.error(
                "Error cargando conexiones:",
                connectionsResult.error
            );

            return;

        }


        nodesById =
            new Map();


        connectedIdsById =
            new Map();


        (
            nodesResult.data ||
            []
        )
            .forEach(
                node => {

                    nodesById.set(
                        node.id,
                        node
                    );


                    connectedIdsById.set(
                        node.id,
                        new Set()
                    );

                }
            );


        (
            connectionsResult.data ||
            []
        )
            .forEach(
                connection => {

                    /*
                       La relación se puede descubrir
                       desde cualquiera de los dos lados.
                    */

                    connectedIdsById
                        .get(
                            connection.from_node
                        )
                        ?.add(
                            connection.to_node
                        );


                    connectedIdsById
                        .get(
                            connection.to_node
                        )
                        ?.add(
                            connection.from_node
                        );

                }
            );


        nodesById
            .forEach(
                node => {

                    bindNode(
                        node
                    );

                }
            );

    }


    /* =====================================================
       TAP FUERA DEL NUDO EN MÓVIL

       Si el usuario toca cualquier otra zona,
       quitamos las conexiones destacadas.
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !isTouchDevice() ||
                armedNodeId === null
            ) {

                return;

            }


            const armedElement =
                document.querySelector(
                    ".is-mobile-node-armed"
                );


            if (
                armedElement &&
                !armedElement.contains(
                    event.target
                )
            ) {

                clearMobileArmed();
                clearHighlights();

            }

        }
    );


    /* =====================================================
       INICIAR
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        load
    );


    /*
       Cuando aparecen nudos nuevos
       volvemos a vincularlos.
    */

    window.addEventListener(
        "desorden:nodes-loaded",
        load
    );


    window.addEventListener(
        "desorden:contribution-created",
        load
    );


    window.DesordenInteractions = {

        reload:
            load,

        clear:
            () => {

                clearHighlights();
                clearMobileArmed();

            }

    };

})();