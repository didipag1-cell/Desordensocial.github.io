/* =========================================================
   DESORDEN SOCIAL
   RED DE CONEXIONES DESDE SUPABASE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const networkCanvas =
        document.querySelector(".network-canvas");

    const redThread =
        document.querySelector("#redThread");


    if (
        !networkCanvas ||
        !redThread ||
        !window.db
    ) {

        console.error(
            "No se pudo iniciar la red de Supabase."
        );

        return;

    }


    /* =====================================================
       NUDOS INICIALES DE CARA
    ===================================================== */

    const seedSelectors = {

        "perfect-days":
            ".node-perfect-days .node-pin",

        "directores":
            ".node-directores .node-pin",

        "lynch-patti-smith":
            ".lynch-interview-node .external-pin",

        "almodovar-roche-bobois":
            ".node-roche .node-pin",

        "chairs-video":
            ".chairs-video-node .external-pin"

    };


    let nodesById = {};
    let connections = [];


    /* =====================================================
       ENCONTRAR EL ANCLA VISUAL DE CUALQUIER NUDO
    ===================================================== */

    function getNodeAnchor(node) {

        if (!node) {
            return null;
        }


        /*
           NUDOS EDITORIALES / SEMILLA
        */

        if (
            node.slug &&
            seedSelectors[node.slug]
        ) {

            return document.querySelector(
                seedSelectors[node.slug]
            );

        }


        /*
           NUDOS DE USUARIOS

           Los buscamos por UUID,
           así no dependemos del nombre
           que haya escrito el usuario.
        */

        const userNode =
            document.querySelector(
                `[data-node-id="${node.id}"]`
            );


        if (!userNode) {
            return null;
        }


        /*
           Preferimos el centro de la aureola.
        */

        return (
            userNode.querySelector(
                ".user-node-aura"
            ) ||
            userNode
        );

    }


    /* =====================================================
       POSICIÓN DEL CENTRO DEL NUDO
       DENTRO DEL LIENZO
    ===================================================== */

    function getNodePosition(node) {

        const anchor =
            getNodeAnchor(node);


        if (!anchor) {
            return null;
        }


        const anchorRect =
            anchor.getBoundingClientRect();

        const canvasRect =
            networkCanvas.getBoundingClientRect();


        return {

            x:
                anchorRect.left -
                canvasRect.left +
                anchorRect.width / 2,

            y:
                anchorRect.top -
                canvasRect.top +
                anchorRect.height / 2

        };

    }


    /* =====================================================
       FORMA DEL HILO
    ===================================================== */

    function createThreadPath(
        start,
        end
    ) {

        const dx =
            end.x - start.x;

        const dy =
            end.y - start.y;


        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        const gap = 22;


        const ux =
            dx / distance;

        const uy =
            dy / distance;


        const startX =
            start.x +
            ux * gap;

        const startY =
            start.y +
            uy * gap;


        const endX =
            end.x -
            ux * gap;

        const endY =
            end.y -
            uy * gap;


        let c1x;
        let c1y;
        let c2x;
        let c2y;


        if (
            Math.abs(dy) >
            Math.abs(dx) * 0.7
        ) {

            c1x =
                startX +
                dx * 0.18;

            c1y =
                startY +
                dy * 0.46;


            c2x =
                endX -
                dx * 0.18;

            c2y =
                endY -
                dy * 0.46;

        } else {

            c1x =
                startX +
                dx * 0.46;

            c1y =
                startY +
                dy * 0.14;


            c2x =
                endX -
                dx * 0.46;

            c2y =
                endY -
                dy * 0.14;

        }


        return `
            M ${startX} ${startY}
            C ${c1x} ${c1y},
              ${c2x} ${c2y},
              ${endX} ${endY}
        `;

    }


    /* =====================================================
       DIBUJAR LA RED COMPLETA
    ===================================================== */

    function drawThreads() {

        const width =
            networkCanvas.offsetWidth;

        const height =
            networkCanvas.offsetHeight;


        redThread.setAttribute(
            "viewBox",
            `0 0 ${width} ${height}`
        );


        redThread.innerHTML = "";


        connections.forEach(
            connection => {

                const fromNode =
                    nodesById[
                        connection.from_node
                    ];

                const toNode =
                    nodesById[
                        connection.to_node
                    ];


                if (
                    !fromNode ||
                    !toNode
                ) {
                    return;
                }


                const start =
                    getNodePosition(
                        fromNode
                    );

                const end =
                    getNodePosition(
                        toNode
                    );


                /*
                   Si alguno todavía no está
                   en el DOM, esperamos al
                   siguiente redibujado.
                */

                if (
                    !start ||
                    !end
                ) {
                    return;
                }


                const path =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "path"
                    );


                path.setAttribute(
                    "d",
                    createThreadPath(
                        start,
                        end
                    )
                );


                path.dataset.connectionId =
                    connection.id;


                redThread.appendChild(
                    path
                );

            }
        );

    }


    /* =====================================================
       LEER NUDOS + CONEXIONES DE SUPABASE
    ===================================================== */

    async function loadNetwork() {

        const {
            data: nodes,
            error: nodesError
        } =
            await window.db
                .from("nodes")
                .select(
                    "id, slug, is_seed"
                )
                .eq(
                    "is_published",
                    true
                );


        if (nodesError) {

            console.error(
                "Error cargando nudos:",
                nodesError
            );

            return;

        }


        nodesById = {};


        (nodes || []).forEach(
            node => {

                nodesById[node.id] =
                    node;

            }
        );


        const {
            data: connectionData,
            error: connectionError
        } =
            await window.db
                .from("connections")
                .select(
                    "id, from_node, to_node"
                )
                .eq(
                    "is_published",
                    true
                );


        if (connectionError) {

            console.error(
                "Error cargando conexiones:",
                connectionError
            );

            return;

        }


        connections =
            connectionData || [];


        console.log(
            "Nudos en la red:",
            Object.keys(
                nodesById
            ).length
        );


        console.log(
            "Conexiones en la red:",
            connections.length
        );


        /*
           Esperamos un frame para asegurarnos
           de que supabase-nodes.js ya haya
           podido añadir los nudos al DOM.
        */

        requestAnimationFrame(
            drawThreads
        );

    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    /*
       Cuando supabase-nodes.js termina
       de crear los nudos visuales.
    */

    window.addEventListener(
        "desorden:nodes-loaded",
        () => {

            requestAnimationFrame(
                drawThreads
            );

        }
    );


    /*
       Cuando node-placement.js
       hace crecer el lienzo.
    */

    window.addEventListener(
        "desorden:canvas-resized",
        () => {

            requestAnimationFrame(
                drawThreads
            );

        }
    );


    /*
       Si cambia la ventana.
    */

    window.addEventListener(
        "resize",
        () => {

            requestAnimationFrame(
                drawThreads
            );

        }
    );


    /*
       Última comprobación una vez
       cargadas imágenes y demás.
    */

    window.addEventListener(
        "load",
        () => {

            requestAnimationFrame(
                drawThreads
            );

        }
    );


    /* =====================================================
       DISPONIBLE PARA LA ABEJA MÁS ADELANTE
    ===================================================== */

    window.DesordenNetwork = {

        reload:
            loadNetwork,

        redraw:
            drawThreads

    };


    loadNetwork();

});