/* =========================================================
   DESORDEN SOCIAL — MENÚ COMPACTO
   INTERACCIÓN FINAL

   ESCRITORIO
   - hover en pestaña: abre la carpeta
   - se queda abierta hasta entrar en otra pestaña
     o salir del stack
   - cuando está abierta, el símbolo entra

   MÓVIL / TÁCTIL
   - tocar cualquier zona visible de color entra
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


    const desktopQuery =
        window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        );


    /* =====================================================
       CURSOR — ORIGINAL
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
                        "a, button, .folder-tab, .folder-object"
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
                        "a, button, .folder-tab, .folder-object"
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
       UTILIDAD — DESTINO DE CADA CARPETA
    ===================================================== */

    function getDestination(
        folder
    ) {

        if (
            folder.matches(
                "a[href]"
            )
        ) {

            return folder.href;

        }


        /*
           Fallback por seguridad.
           Actualmente ??? ya es un <a>,
           pero lo dejamos por si acaso.
        */

        if (
            folder.classList.contains(
                "folder-kiwi"
            )
        ) {

            return "entrevistas.html";

        }


        return null;

    }


    function enterFolder(
        folder
    ) {

        const destination =
            getDestination(
                folder
            );


        if (!destination) {
            return;
        }


        window.location.href =
            destination;

    }


    /* =====================================================
       PREVIEW EN ESCRITORIO
    ===================================================== */

    let openFolder =
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

            const face =
                folder.querySelector(
                    ".folder-face"
                );

            const object =
                folder.querySelector(
                    ".folder-object"
                );


            if (!tab) {
                return;
            }


            /*
               ESCRITORIO:
               pasar por la pestaña abre.

               NO cerramos al salir de la pestaña.
               Esto permite mover el cursor hasta
               el símbolo sin que desaparezca.
            */

            tab.addEventListener(
                "mouseenter",
                () => {

                    if (
                        !desktopQuery.matches
                    ) {
                        return;
                    }


                    closeAll();


                    folder.classList.add(
                        "is-open"
                    );


                    openFolder =
                        folder;

                }
            );


            /*
               ESCRITORIO:
               la pestaña sigue entrando directamente
               si haces click sobre ella.
            */

            tab.addEventListener(
                "click",
                event => {

                    if (
                        !desktopQuery.matches
                    ) {
                        return;
                    }


                    event.preventDefault();
                    event.stopPropagation();


                    enterFolder(
                        folder
                    );

                }
            );


            /*
               ESCRITORIO:
               cuando la carpeta está abierta,
               el símbolo es el botón interior.
            */

            object
                ?.addEventListener(
                    "click",
                    event => {

                        if (
                            !desktopQuery.matches ||
                            !folder.classList.contains(
                                "is-open"
                            )
                        ) {
                            return;
                        }


                        event.preventDefault();
                        event.stopPropagation();


                        enterFolder(
                            folder
                        );

                    }
                );


            /*
               MÓVIL:
               tocar cualquier zona visible del cuerpo
               de color entra directamente.
            */

            face
                ?.addEventListener(
                    "click",
                    event => {

                        if (
                            desktopQuery.matches
                        ) {
                            return;
                        }


                        event.preventDefault();
                        event.stopPropagation();


                        enterFolder(
                            folder
                        );

                    }
                );


            /*
               MÓVIL:
               la pestaña también entra directamente.
            */

            tab.addEventListener(
                "touchend",
                event => {

                    if (
                        desktopQuery.matches
                    ) {
                        return;
                    }


                    event.preventDefault();
                    event.stopPropagation();


                    enterFolder(
                        folder
                    );

                },
                {
                    passive: false
                }
            );

        }
    );


    /* =====================================================
       HIT AREAS SIN CAMBIAR EL DISEÑO
    ===================================================== */

    function syncHitAreas() {

        folders.forEach(
            folder => {

                const face =
                    folder.querySelector(
                        ".folder-face"
                    );

                const object =
                    folder.querySelector(
                        ".folder-object"
                    );


                if (
                    desktopQuery.matches
                ) {

                    /*
                       Igual que el original:
                       el cuerpo no atrapa el cursor.
                    */

                    folder.style.pointerEvents =
                        "none";


                    if (face) {

                        face.style.pointerEvents =
                            "none";

                    }


                    if (object) {

                        object.style.pointerEvents =
                            folder.classList.contains(
                                "is-open"
                            )
                                ? "auto"
                                : "none";

                    }

                }
                else {

                    /*
                       Móvil:
                       activamos solo las zonas VISIBLES
                       de color, no el rectángulo transparente
                       completo de la carpeta.
                    */

                    folder.style.pointerEvents =
                        "none";


                    if (face) {

                        face.style.pointerEvents =
                            "auto";

                    }


                    if (object) {

                        object.style.pointerEvents =
                            "none";

                    }

                }

            }
        );

    }


    /*
       Cada vez que se abre una carpeta
       actualizamos el símbolo clicable.
    */

    const observer =
        new MutationObserver(
            syncHitAreas
        );


    folders.forEach(
        folder => {

            observer.observe(
                folder,
                {
                    attributes: true,
                    attributeFilter: [
                        "class"
                    ]
                }
            );

        }
    );


    /* =====================================================
       MOVIMIENTO 3D ORIGINAL DEL CONJUNTO
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
       Al salir del conjunto hacia el negro,
       cerramos el preview.
    */

    stack
        ?.addEventListener(
            "mouseleave",
            () => {

                if (
                    desktopQuery.matches
                ) {

                    closeAll();
                    syncHitAreas();

                }

            }
        );


    if (
        typeof desktopQuery
            .addEventListener ===
        "function"
    ) {

        desktopQuery.addEventListener(
            "change",
            () => {

                closeAll();
                syncHitAreas();

            }
        );

    }


    syncHitAreas();

})();
