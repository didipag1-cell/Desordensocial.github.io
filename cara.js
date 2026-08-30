document.addEventListener("DOMContentLoaded", () => {


    /* =========================================================
       CURSOR PERSONALIZADO
    ========================================================= */

    const cursor =
        document.querySelector(".custom-cursor");

    const interactive =
        document.querySelectorAll(
            "a, button, .node"
        );


    if (cursor) {

        document.addEventListener(
            "mousemove",
            (event) => {

                cursor.style.left =
                    `${event.clientX}px`;

                cursor.style.top =
                    `${event.clientY}px`;

            }
        );


        interactive.forEach((element) => {

            element.addEventListener(
                "mouseenter",
                () => {

                    cursor.classList.add(
                        "is-hovering"
                    );

                }
            );


            element.addEventListener(
                "mouseleave",
                () => {

                    cursor.classList.remove(
                        "is-hovering"
                    );

                }
            );

        });

    }



    /* =========================================================
       HILO ROJO RESPONSIVE
    ========================================================= */

    const networkCanvas =
        document.querySelector(".network-canvas");

    const redThread =
        document.querySelector("#redThread");


    function getPinPosition(selector) {

        const pin =
            document.querySelector(selector);

        if (
            !pin ||
            !networkCanvas
        ) {
            return null;
        }


        const pinRect =
            pin.getBoundingClientRect();

        const canvasRect =
            networkCanvas.getBoundingClientRect();


        return {

            x:
                pinRect.left -
                canvasRect.left +
                pinRect.width / 2,

            y:
                pinRect.top -
                canvasRect.top +
                pinRect.height / 2

        };

    }



    /* =========================================================
       CREAR CURVA ENTRE DOS ALFILERES
    ========================================================= */

    function createThreadPath(start, end) {

        const dx =
            end.x - start.x;

        const dy =
            end.y - start.y;

        const distance =
            Math.hypot(dx, dy) || 1;


        /*
           espacio entre alfiler
           e inicio del hilo
        */

        const gap = 22;


        const ux =
            dx / distance;

        const uy =
            dy / distance;


        const startX =
            start.x + ux * gap;

        const startY =
            start.y + uy * gap;


        const endX =
            end.x - ux * gap;

        const endY =
            end.y - uy * gap;


        let c1x;
        let c1y;
        let c2x;
        let c2y;



        /*
           COMPOSICIÓN VERTICAL
        */

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

        }



        /*
           COMPOSICIÓN HORIZONTAL
        */

        else {

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



    /* =========================================================
       DIBUJAR HILOS
    ========================================================= */

    function drawThreads() {

        if (
            !redThread ||
            !networkCanvas
        ) {
            return;
        }


        const width =
            networkCanvas.offsetWidth;

        const height =
            networkCanvas.offsetHeight;


        redThread.setAttribute(
            "viewBox",
            `0 0 ${width} ${height}`
        );


        redThread.innerHTML = "";



        /*
           PERFECT DAYS
           →
           DIRECTORES
        */

        const perfect =
            getPinPosition(
                ".node-perfect-days .node-pin"
            );


        const directores =
            getPinPosition(
                ".node-directores .node-pin"
            );


        if (
            perfect &&
            directores
        ) {

            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            path.setAttribute(
                "d",
                createThreadPath(
                    perfect,
                    directores
                )
            );


            redThread.appendChild(path);

        }



        /*
           DIRECTORES
           →
           PEDRO ALMODÓVAR × ROCHE BOBOIS
        */

        const roche =
            getPinPosition(
                ".node-roche .node-pin"
            );


        if (
            directores &&
            roche
        ) {

            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            path.setAttribute(
                "d",
                createThreadPath(
                    directores,
                    roche
                )
            );


            redThread.appendChild(path);

        }
/*
   ROCHE BOBOIS
   →
   VIDEO DE LAS SILLAS
*/

const chairsVideo =
    getPinPosition(
        ".chairs-video-node .external-pin"
    );


if (
    roche &&
    chairsVideo
) {

    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    path.setAttribute(
        "d",
        createThreadPath(
            roche,
            chairsVideo
        )
    );


    redThread.appendChild(path);

}

        /*
   DIRECTORES
   →
   DAVID LYNCH × PATTI SMITH
*/

const lynchInterview =
    getPinPosition(
        ".lynch-interview-node .external-pin"
    );


if (
    directores &&
    lynchInterview
) {

    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    path.setAttribute(
        "d",
        createThreadPath(
            directores,
            lynchInterview
        )
    );


    redThread.appendChild(path);

}
    }



    /*
       dibujar inmediatamente
    */

    requestAnimationFrame(
        drawThreads
    );


    /*
       volver a calcular cuando
       terminen de cargar imágenes
    */

    window.addEventListener(
        "load",
        drawThreads
    );


    /*
       volver a calcular si cambia
       el tamaño del navegador
    */

    window.addEventListener(
        "resize",
        drawThreads
    );



    /* =========================================================
       FUNCIÓN GENERAL PARA ABRIR / CERRAR NUDOS
    ========================================================= */

    function setupNode(
        openSelector,
        closeSelector,
        insideSelector
    ) {

        const openButton =
            document.querySelector(
                openSelector
            );

        const closeButton =
            document.querySelector(
                closeSelector
            );

        const inside =
            document.querySelector(
                insideSelector
            );


        if (
            !openButton ||
            !closeButton ||
            !inside
        ) {
            return;
        }



        /*
           ABRIR
        */

        openButton.addEventListener(
            "click",
            () => {

                inside.classList.add(
                    "is-open"
                );

                inside.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }
        );



        /*
           CERRAR
        */

        closeButton.addEventListener(
            "click",
            () => {

                inside.classList.remove(
                    "is-open"
                );

                inside.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );

    }



    /* =========================================================
       PERFECT DAYS
    ========================================================= */

    setupNode(
        "#openPerfectDays",
        "#closePerfectDays",
        "#perfectDaysInside"
    );



    /* =========================================================
       DIRECTORES
    ========================================================= */

    setupNode(
        "#openDirectores",
        "#closeDirectores",
        "#directoresInside"
    );



    /* =========================================================
       PEDRO ALMODÓVAR × ROCHE BOBOIS
    ========================================================= */

    setupNode(
        "#openRoche",
        "#closeRoche",
        "#rocheInside"
    );



    /* =========================================================
       ESCAPE CIERRA CUALQUIER NUDO ABIERTO
    ========================================================= */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            const openInside =
                document.querySelectorAll(
                    ".node-inside.is-open"
                );


            openInside.forEach(
                (inside) => {

                    inside.classList.remove(
                        "is-open"
                    );

                    inside.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                }
            );

        }
    );


});