/* =========================================================
   DESORDEN SOCIAL — CREAR NUDO
   0, 1 o varias conexiones
========================================================= */

(() => {

    const unique =
        values =>
            [
                ...new Set(
                    values.filter(
                        Boolean
                    )
                )
            ];


    function getIndependentPosition() {

        const canvas =
            document.querySelector(
                ".network-canvas"
            );


        if (!canvas) {

            return {
                x: 320,
                y: 300
            };

        }


        const canvasRect =
            canvas
                .getBoundingClientRect();


        const nodes = [
            ...canvas.querySelectorAll(
                ".node, .external-node, .user-node"
            )
        ];


        let maxRight =
            0;

        let minTop =
            Infinity;


        nodes.forEach(
            node => {

                const rect =
                    node
                        .getBoundingClientRect();


                maxRight =
                    Math.max(
                        maxRight,
                        rect.right -
                        canvasRect.left
                    );


                minTop =
                    Math.min(
                        minTop,
                        rect.top -
                        canvasRect.top
                    );

            }
        );


        /*
           Sin conexiones:
           empezamos una zona nueva
           a la derecha de la red.
        */

        const x =
            Math.max(
                320,
                maxRight + 260
            );


        const y =
            Number.isFinite(
                minTop
            )
                ? Math.max(
                    220,
                    minTop + 210
                )
                : 300;


        const requiredWidth =
            x + 500;


        if (
            requiredWidth >
            canvas.scrollWidth
        ) {

            canvas.style.width =
                `${requiredWidth}px`;

            canvas.style.minWidth =
                `${requiredWidth}px`;


            window.dispatchEvent(
                new CustomEvent(
                    "desorden:canvas-resized"
                )
            );

        }


        return {
            x,
            y
        };

    }


    async function createContribution({

        parentSlugs = [],

        parentSlug = null,

        title = "",

        body = "",

        content_type = "text",

        media_url = null,

        external_url = null,

        reason = "",

        metadata = {}

    }) {


        if (!window.db) {

            return {

                data:
                    null,

                error:
                    new Error(
                        "Supabase no está disponible."
                    )

            };

        }


        if (
            !window.DesordenUser ||
            !window.DesordenPlacement
        ) {

            return {

                data:
                    null,

                error:
                    new Error(
                        "Falta el sistema de usuario o colocación."
                    )

            };

        }


        const user =
            await window
                .DesordenUser
                .getCurrentUser();


        const profile =
            await window
                .DesordenUser
                .getProfile();


        if (
            !user ||
            !profile
        ) {

            return {

                data:
                    null,

                error:
                    new Error(
                        "Necesitas un @username para añadir un nudo."
                    )

            };

        }


        const slugs =
            unique(

                [

                    ...(
                        Array.isArray(
                            parentSlugs
                        )
                            ? parentSlugs
                            : []
                    ),

                    ...(
                        parentSlug
                            ? [parentSlug]
                            : []
                    )

                ]
                    .map(
                        value =>
                            String(
                                value ||
                                ""
                            )
                                .trim()
                    )

            );


        let parentNodes =
            [];


        /* =================================================
           BUSCAR NUDOS PADRE
        ================================================= */

        if (slugs.length) {

            const {
                data,
                error
            } =
                await window.db
                    .from("nodes")
                    .select(
                        "id, slug, title"
                    )
                    .in(
                        "slug",
                        slugs
                    );


            if (error) {

                return {
                    data: null,
                    error
                };

            }


            parentNodes =
                data || [];


            if (
                parentNodes.length !==
                slugs.length
            ) {

                return {

                    data:
                        null,

                    error:
                        new Error(
                            "No se encontraron todos los nudos seleccionados."
                        )

                };

            }

        }


        /* =================================================
           POSICIÓN
        ================================================= */

        const position =
    window
        .DesordenPlacement
        .findFreePosition(
            null,
            {
                nodeData: {
                    content_type
                }
            }
        );


        if (!position) {

            return {

                data:
                    null,

                error:
                    new Error(
                        "No se encontró un espacio libre para el nudo."
                    )

            };

        }


        /* =================================================
           CREAR NUDO
        ================================================= */

        const slug =
            `user-${crypto.randomUUID()}`;


        const finalTitle =
            String(
                title ||
                ""
            )
                .trim() ||
            "nuevo nudo";


        const {
            data: newNode,
            error: nodeError
        } =
            await window.db
                .from("nodes")
                .insert({

                    created_by:
                        user.id,

                    slug:
                        slug,

                    title:
                        finalTitle,

                    node_kind:
                        "user",

                    content_type:
                        content_type,

                    body:
                        body || null,

                    media_url:
                        media_url || null,

                    external_url:
                        external_url || null,

                    x:
                        position.x,

                    y:
                        position.y,

                    aura_scale:
                        1,

                    is_seed:
                        false,

                    is_published:
                        true,

                    metadata:
                        metadata || {}

                })
                .select()
                .single();


        if (nodeError) {

            return {

                data:
                    null,

                error:
                    nodeError

            };

        }


        /* =================================================
           CREAR TODOS LOS HILOS
        ================================================= */

        let newConnections =
            [];


        if (
            parentNodes.length
        ) {

            const parentBySlug =
                Object.fromEntries(

                    parentNodes.map(
                        node => [
                            node.slug,
                            node
                        ]
                    )

                );


            const rows =
                slugs.map(
                    parent => ({

                        from_node:
                            parentBySlug[
                                parent
                            ].id,

                        to_node:
                            newNode.id,

                        created_by:
                            user.id,

                        reason:
                            reason || null,

                        is_published:
                            true

                    })
                );


            const {
                data,
                error
            } =
                await window.db
                    .from(
                        "connections"
                    )
                    .insert(
                        rows
                    )
                    .select();


            if (error) {

                /*
                   Si fallan los hilos,
                   eliminamos el nudo.
                */

                await window.db
                    .from("nodes")
                    .delete()
                    .eq(
                        "id",
                        newNode.id
                    );


                return {

                    data:
                        null,

                    error:
                        error

                };

            }


            newConnections =
                data || [];

        }


        /* =================================================
           REFRESCAR CARA
        ================================================= */

        if (
            window
                .loadDesordenUserNodes
        ) {

            await window
                .loadDesordenUserNodes();

        }


        if (
            window
                .DesordenNetwork
        ) {

            await window
                .DesordenNetwork
                .reload();

        }


        return {

            data: {

                node:
                    newNode,

                connections:
                    newConnections,

                profile:
                    profile

            },

            error:
                null

        };

    }


    window.DesordenContribution =
        {

            create:
                createContribution

        };

})();