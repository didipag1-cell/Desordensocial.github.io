document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           CURSOR DESORDEN SOCIAL

           LO CREAMOS PRIMERO.

           Aunque hubiese algún problema con el lector,
           el cursor seguirá funcionando.
        ================================================= */


        function setupBookCursor() {


            /*
                En un dispositivo táctil puro
                no necesitamos cursor.
            */

            if (
                !window.matchMedia(
                    "(hover: hover)"
                ).matches
            ) {
                return;
            }



            /*
                Matamos visualmente cualquier
                cursor antiguo que siga en el HTML.
            */

            document
                .querySelectorAll(
                    ".custom-cursor"
                )
                .forEach(
                    oldCursor => {

                        oldCursor.style.display =
                            "none";

                    }
                );



            /*
                Crear nuestro cursor NUEVO.
            */

            let cursor =
                document.getElementById(
                    "ds-book-cursor"
                );


            if (!cursor) {


                cursor =
                    document.createElement(
                        "div"
                    );


                cursor.id =
                    "ds-book-cursor";


                cursor.setAttribute(
                    "aria-hidden",
                    "true"
                );



                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    "assets/cursor/cursor.svg";


                image.alt = "";


                image.draggable =
                    false;



                cursor.appendChild(
                    image
                );


                document.body.appendChild(
                    cursor
                );

            }



            /*
                Movimiento con requestAnimationFrame.

                Más fluido que cambiar left/top
                decenas de veces por frame.
            */

            let mouseX = 0;
            let mouseY = 0;

            let frameRequested =
                false;



            function paintCursor() {


                cursor.style.left =
                    `${mouseX}px`;


                cursor.style.top =
                    `${mouseY}px`;


                frameRequested =
                    false;

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



                    if (!frameRequested) {


                        frameRequested =
                            true;


                        window.requestAnimationFrame(
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



            document.addEventListener(
                "mouseenter",
                () => {

                    cursor.classList.add(
                        "is-visible"
                    );

                }
            );


        }



        /*
            IMPORTANTE:
            el cursor se inicia ANTES
            que el lector.
        */

        setupBookCursor();



        /* =================================================
           LIBRO
        ================================================= */


        const TOTAL_PAGES =
            23;


        const BOOK_FOLDER =
            "assets/revista/Libro";



        const spread =
            document.getElementById(
                "book-spread"
            );


        const turningPage =
            document.getElementById(
                "turning-page"
            );


        const turningPageImage =
            document.getElementById(
                "turning-page-image"
            );


        const leftPage =
            document.getElementById(
                "left-page"
            );


        const rightPage =
            document.getElementById(
                "right-page"
            );


        const previousButton =
            document.getElementById(
                "previous-button"
            );


        const nextButton =
            document.getElementById(
                "next-button"
            );


        const previousZone =
            document.getElementById(
                "previous-zone"
            );


        const nextZone =
            document.getElementById(
                "next-zone"
            );


        const currentPageLabel =
            document.getElementById(
                "current-page"
            );



        /*
            Si falta algo del libro,
            detenemos SOLO el libro.

            El cursor ya está funcionando.
        */

        if (
            !spread ||
            !turningPage ||
            !turningPageImage ||
            !leftPage ||
            !rightPage ||
            !previousButton ||
            !nextButton ||
            !previousZone ||
            !nextZone ||
            !currentPageLabel
        ) {


            console.error(
                "Libro fotográfico: falta algún elemento necesario en libro-fotografico.html."
            );


            return;

        }



        let currentPage =
            1;


        let isChanging =
            false;



        /* =================================================
           HELPERS
        ================================================= */


        function isMobileLayout() {


            return window.matchMedia(
                "(max-width: 800px)"
            ).matches;

        }



        function pageSource(
            pageNumber
        ) {


            return (
                `${BOOK_FOLDER}/` +
                `${pageNumber}.png`
            );

        }



        function formatPageNumber(
            pageNumber
        ) {


            return String(
                pageNumber
            ).padStart(
                2,
                "0"
            );

        }



        /* =================================================
           PRECARGA
        ================================================= */


        for (
            let pageNumber = 1;
            pageNumber <= TOTAL_PAGES;
            pageNumber += 1
        ) {


            const image =
                new Image();


            image.src =
                pageSource(
                    pageNumber
                );

        }



        /* =================================================
           RENDER
        ================================================= */


        function renderBook() {


            const mobile =
                isMobileLayout();



            spread.classList.remove(
                "single-page"
            );



            /* ---------------------------------------------
               MÓVIL
               una página cada vez
            --------------------------------------------- */


            if (mobile) {


                leftPage.src =
                    "";


                leftPage.alt =
                    "";



                rightPage.src =
                    pageSource(
                        currentPage
                    );


                rightPage.alt =
                    `Página ${currentPage} del libro fotográfico`;



                currentPageLabel.textContent =
                    formatPageNumber(
                        currentPage
                    );



                previousButton.disabled =
                    currentPage === 1;


                nextButton.disabled =
                    currentPage ===
                    TOTAL_PAGES;


                return;

            }



            /* ---------------------------------------------
               PORTADA SOLA
            --------------------------------------------- */


            if (
                currentPage === 1
            ) {


                spread.classList.add(
                    "single-page"
                );



                leftPage.src =
                    "";


                leftPage.alt =
                    "";



                rightPage.src =
                    pageSource(1);


                rightPage.alt =
                    "Portada del libro fotográfico";



                currentPageLabel.textContent =
                    "01";


                previousButton.disabled =
                    true;


                nextButton.disabled =
                    false;


                return;

            }



            /* ---------------------------------------------
               DOBLE PÁGINA

               2–3
               4–5
               6–7
               etc.
            --------------------------------------------- */


            const leftPageNumber =

                currentPage % 2 === 0

                    ? currentPage

                    : currentPage - 1;



            const rightPageNumber =
                leftPageNumber + 1;



            leftPage.src =
                pageSource(
                    leftPageNumber
                );


            leftPage.alt =
                `Página ${leftPageNumber} del libro fotográfico`;



            if (
                rightPageNumber <=
                TOTAL_PAGES
            ) {


                rightPage.src =
                    pageSource(
                        rightPageNumber
                    );


                rightPage.alt =
                    `Página ${rightPageNumber} del libro fotográfico`;


            } else {


                rightPage.src =
                    "";


                rightPage.alt =
                    "";

            }



            currentPageLabel.textContent =

                `${formatPageNumber(
                    leftPageNumber
                )}–${formatPageNumber(
                    Math.min(
                        rightPageNumber,
                        TOTAL_PAGES
                    )
                )}`;



            previousButton.disabled =
                false;


            nextButton.disabled =
                rightPageNumber >=
                TOTAL_PAGES;

        }



        /* =================================================
           CAMBIAR PÁGINA
        ================================================= */


        function changePage(
            direction
        ) {


            if (isChanging) {
                return;
            }



            const mobile =
                isMobileLayout();



            let nextPage =
                currentPage;



            /*
                Calcular siguiente página.
            */


            if (mobile) {


                nextPage +=
                    direction;


            } else if (
                currentPage === 1 &&
                direction === 1
            ) {


                nextPage =
                    2;


            } else {


                nextPage +=
                    direction * 2;

            }



            nextPage =
                Math.max(
                    1,
                    Math.min(
                        TOTAL_PAGES,
                        nextPage
                    )
                );



            if (
                nextPage === currentPage
            ) {
                return;
            }



            isChanging =
                true;



            /*
                Elegir la hoja que va a girar.
            */


            const sourceImage =

                direction === 1

                    ? rightPage

                    : leftPage.src

                        ? leftPage

                        : rightPage;



            turningPageImage.src =
                sourceImage.src;



            /*
                Reiniciar animación.
            */


            turningPage.className =
                "book-turning-page";


            void turningPage.offsetWidth;



            /*
                Portada y móvil:
                hoja completa.
            */


            if (
                mobile ||
                spread.classList.contains(
                    "single-page"
                )
            ) {


                turningPage.classList.add(
                    "is-single"
                );

            }



            turningPage.classList.add(

                direction === 1

                    ? "turn-next"

                    : "turn-previous"

            );



            /*
                Cambiar contenido
                aproximadamente a mitad
                del giro.
            */


            window.setTimeout(
                () => {


                    currentPage =
                        nextPage;


                    renderBook();


                },
                390
            );



            /*
                Limpiar animación.
            */


            window.setTimeout(
                () => {


                    turningPage.className =
                        "book-turning-page";


                    turningPageImage.src =
                        "";


                    isChanging =
                        false;


                },
                800
            );

        }



        /* =================================================
           CLIC
        ================================================= */


        previousButton.addEventListener(
            "click",
            () => {

                changePage(-1);

            }
        );


        nextButton.addEventListener(
            "click",
            () => {

                changePage(1);

            }
        );


        previousZone.addEventListener(
            "click",
            () => {

                changePage(-1);

            }
        );


        nextZone.addEventListener(
            "click",
            () => {

                changePage(1);

            }
        );



        /* =================================================
           TECLADO
        ================================================= */


        document.addEventListener(
            "keydown",
            event => {


                if (
                    event.key ===
                    "ArrowLeft"
                ) {


                    changePage(-1);

                }



                if (
                    event.key ===
                    "ArrowRight"
                ) {


                    changePage(1);

                }


            }
        );



        /* =================================================
           SWIPE
        ================================================= */


        let touchStartX =
            0;



        spread.addEventListener(
            "touchstart",
            event => {


                touchStartX =

                    event
                        .changedTouches[0]
                        .clientX;


            },
            {
                passive: true
            }
        );



        spread.addEventListener(
            "touchend",
            event => {


                const touchEndX =

                    event
                        .changedTouches[0]
                        .clientX;



                const movement =
                    touchEndX -
                    touchStartX;



                if (
                    Math.abs(
                        movement
                    ) < 45
                ) {
                    return;
                }



                if (
                    movement < 0
                ) {


                    changePage(1);


                } else {


                    changePage(-1);

                }


            },
            {
                passive: true
            }
        );



        /* =================================================
           RESIZE
        ================================================= */


        window.addEventListener(
            "resize",
            renderBook
        );



        /* =================================================
           START
        ================================================= */


        renderBook();


    }
);/* =========================================================
   DESORDEN — HIT AREA MÁS GRANDE SIN CAMBIAR EL DISEÑO
========================================================= */

const desordenTab =
    document.querySelector(".folder-tab[href='cara.html']");

if (desordenTab) {

    const desordenFolder =
        desordenTab.closest(".folder");

    window.addEventListener(
        "pointermove",
        (event) => {

            const rect =
                desordenTab.getBoundingClientRect();

            /*
                Zona invisible de tolerancia.
                NO cambia tamaños, posiciones ni z-index.
            */

            const paddingX = 45;
            const paddingY = 28;

            const inside =
                event.clientX >= rect.left - paddingX &&
                event.clientX <= rect.right + paddingX &&
                event.clientY >= rect.top - paddingY &&
                event.clientY <= rect.bottom + paddingY;


            if (inside && desordenFolder) {

                document
                    .querySelectorAll(".folder")
                    .forEach(folder => {
                        folder.classList.remove("is-open");
                    });

                desordenFolder.classList.add("is-open");
            }

        },
        { passive: true }
    );

}