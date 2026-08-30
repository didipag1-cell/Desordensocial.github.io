/* =========================================================
   DESORDEN SOCIAL — HOME → CARA
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const KEY =
            "desorden-pending-contribution";


        const raw =
            sessionStorage
                .getItem(
                    KEY
                );


        if (!raw) return;


        let contribution;


        try {

            contribution =
                JSON.parse(
                    raw
                );

        }
        catch (error) {

            console.error(
                "Polen pendiente inválido:",
                error
            );


            sessionStorage
                .removeItem(
                    KEY
                );


            return;

        }


        if (
            !window
                .DesordenContribution ||
            !window
                .DesordenPlacement
        ) {

            console.error(
                "El sistema de contribuciones no está listo."
            );

            return;

        }


        const parentSlugs =
            Array.isArray(
                contribution
                    .parentSlugs
            )

                ? contribution
                    .parentSlugs

                : contribution
                    .parentSlug

                    ? [
                        contribution
                            .parentSlug
                    ]

                    : [];


        async function waitForParent(
            slug,
            timeout = 6000
        ) {

            const start =
                Date.now();


            while (
                Date.now() -
                start <
                timeout
            ) {

                const element =
                    window
                        .DesordenPlacement
                        .resolveNode(
                            slug
                        );


                if (element) {

                    return element;

                }


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            120
                        )
                );

            }


            return null;

        }


        /*
           Si existen conexiones,
           el primero es el ancla visual.
        */

        if (
            parentSlugs.length
        ) {

            const parent =
                await waitForParent(
                    parentSlugs[0]
                );


            if (!parent) {

                console.error(
                    "No se encontró el nudo ancla:",
                    parentSlugs[0]
                );

                return;

            }

        }

/*
   Esperamos a que Supabase haya terminado
   de dibujar todos los nudos existentes.

   Si calculamos antes, el motor podría creer
   que un espacio ocupado está vacío.
*/

await new Promise(resolve => {

    let finished =
        false;


    const finish = () => {

        if (finished) {
            return;
        }

        finished =
            true;

        resolve();

    };


    window.addEventListener(
        "desorden:nodes-loaded",
        finish,
        {
            once: true
        }
    );


    /*
       Seguridad por si el evento
       no llegara por algún motivo.
    */

    setTimeout(
        finish,
        3000
    );

});

        const result =
            await window
                .DesordenContribution
                .create({

                    ...contribution,

                    parentSlugs:
                        parentSlugs

                });


        if (result.error) {

            console.error(
                "No se pudo dejar el polen:",
                result.error
            );

            return;

        }


        sessionStorage
            .removeItem(
                KEY
            );


        requestAnimationFrame(
            () => {

                const node =
                    result
                        .data
                        .node;


                const network =
                    document
                        .querySelector(
                            ".network"
                        );


                if (
                    !node ||
                    !network
                ) {
                    return;
                }


                network.scrollTo({

                    left:
                        Math.max(
                            0,
                            node.x -
                            network
                                .clientWidth /
                                2
                        ),

                    top:
                        Math.max(
                            0,
                            node.y -
                            network
                                .clientHeight /
                                2
                        ),

                    behavior:
                        "smooth"

                });

            }
        );


        window.history
            .replaceState(
                {},
                "",
                "cara.html"
            );

    }
);