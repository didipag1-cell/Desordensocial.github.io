/* =========================================================
   DESORDEN SOCIAL — MENÚ COMPACTO
========================================================= */

(() => {

    const cursor =
        document.querySelector(
            "#customCursor"
        );

    const stack =
        document.querySelector(
            "#menuStack"
        );

    const folders =
        Array.from(
            document.querySelectorAll(
                "[data-menu-item]"
            )
        );


    /* =====================================================
       CURSOR
    ===================================================== */

    if (
        cursor &&
        window.matchMedia(
            "(pointer: fine)"
        ).matches
    ) {

        document.addEventListener(
            "mousemove",
            event => {

                cursor.style.left =
                    `${event.clientX}px`;

                cursor.style.top =
                    `${event.clientY}px`;

            }
        );


        document.addEventListener(
            "mousedown",
            () => {

                cursor.classList.add(
                    "is-clicking"
                );

            }
        );


        document.addEventListener(
            "mouseup",
            () => {

                cursor.classList.remove(
                    "is-clicking"
                );

            }
        );


        document.addEventListener(
            "mouseover",
            event => {

                if (
                    event.target.closest(
                        "a, button, .folder-tab"
                    )
                ) {

                    cursor.classList.add(
                        "is-hovering"
                    );

                }

            }
        );


        document.addEventListener(
            "mouseout",
            event => {

                if (
                    event.target.closest(
                        "a, button, .folder-tab"
                    )
                ) {

                    cursor.classList.remove(
                        "is-hovering"
                    );

                }

            }
        );

    }


    /* =====================================================
       HOVER SOLO EN LA PESTAÑA

       El cuerpo de la carpeta NO activa nada.
       Así puedes mover el cursor por el negro,
       salir de una carpeta y entrar en otra sin
       que una capa enorme se quede atrapando el ratón.
    ===================================================== */

    let openFolder =
        null;

    let closeTimer =
        null;


    function closeAll() {

        folders.forEach(
            folder => {

                folder.classList.remove(
                    "is-open"
                );

            }
        );


        openFolder =
            null;

    }


    folders.forEach(
        folder => {

            const tab =
                folder.querySelector(
                    ".folder-tab"
                );


            if (!tab) {
                return;
            }


            tab.addEventListener(
                "mouseenter",
                () => {

                    clearTimeout(
                        closeTimer
                    );


                    closeAll();


                    folder.classList.add(
                        "is-open"
                    );


                    openFolder =
                        folder;

                }
            );


            tab.addEventListener(
                "mouseleave",
                () => {

                    /*
                       Un pelín de margen para que no
                       parpadee si rozas el borde.
                    */

                    closeTimer =
                        setTimeout(
                            () => {

                                if (
                                    openFolder ===
                                    folder
                                ) {

                                    folder.classList.remove(
                                        "is-open"
                                    );


                                    openFolder =
                                        null;

                                }

                            },
                            90
                        );

                }
            );


            /*
               La pestaña sigue siendo el enlace real.
            */

            tab.addEventListener(
                "click",
                event => {

                    if (
                        folder.matches(
                            "a[href]"
                        )
                    ) {

                        event.preventDefault();


                        window.location.href =
                            folder.href;

                    }

                }
            );

        }
    );


    /* =====================================================
       MOVIMIENTO 3D SUTIL DEL CONJUNTO
    ===================================================== */

    if (
        stack &&
        window.matchMedia(
            "(pointer: fine)"
        ).matches
    ) {

        document.addEventListener(
            "mousemove",
            event => {

                const x =
                    (
                        event.clientX /
                        window.innerWidth -
                        .5
                    );

                const y =
                    (
                        event.clientY /
                        window.innerHeight -
                        .5
                    );


                stack.style.transform =
                    `
                    rotateX(${7 - y * 1.6}deg)
                    rotateY(${-3 + x * 2.4}deg)
                    `;

            },
            {
                passive: true
            }
        );

    }


    /*
       Si sales del bloque entero hacia el negro,
       siempre se resetea.
    */

    stack
        ?.addEventListener(
            "mouseleave",
            () => {

                clearTimeout(
                    closeTimer
                );


                closeAll();

            }
        );

})();
