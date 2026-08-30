/* =========================================================
   DESORDEN SOCIAL
   INTERACCIONES ENTRE NUDOS

   - no dibuja líneas
   - hover ilumina conexiones
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
       ILUMINAR CONEXIONES
    ===================================================== */

    function highlightConnections(
        nodeId
    ) {

        clearHighlights();


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


        const connectedIds =
            connectedIdsById.get(
                nodeId
            ) ||
            new Set();


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
       EVENTOS DE CADA NUDO
    ===================================================== */

    function bindNode(
        node
    ) {

        const element =
            getElement(
                node
            );


        if (
            !element ||
            boundElements.has(
                element
            )
        ) {

            return;

        }


        boundElements.add(
            element
        );


        element.addEventListener(
            "mouseenter",
            () => {

                highlightConnections(
                    node.id
                );

            }
        );


        element.addEventListener(
            "mouseleave",
            () => {

                clearHighlights();

            }
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
            clearHighlights

    };

})();