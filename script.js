const bloques = document.querySelectorAll(".reveal");

const observador = new IntersectionObserver(
    (entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add("visible");
            }
        });
    },
    {
        threshold: 0.25
    }
);

bloques.forEach((bloque) => {
    observador.observe(bloque);
});
const cursor = document.querySelector(".custom-cursor");

if (cursor && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
    });

    const interactivos = document.querySelectorAll(
        ".icono, .story-icon, .desorden, .social, .autor, a, button"
    );

    interactivos.forEach((elemento) => {
        elemento.addEventListener("mouseenter", () => {
            cursor.classList.add("is-hovering");
        });

        elemento.addEventListener("mouseleave", () => {
            cursor.classList.remove("is-hovering");
        });
    });

    window.addEventListener("mousedown", () => {
        cursor.classList.add("is-clicking");
    });

    window.addEventListener("mouseup", () => {
        cursor.classList.remove("is-clicking");
    });
}

const bigProjectTitle = document.querySelector(
    ".project-title-overlay"
);

const projectLinks = document.querySelectorAll(
    ".project-link"
);

if (
    bigProjectTitle &&
    window.matchMedia("(pointer: fine)").matches
) {
    const screenMargin = 16;
    const imageGap = 24;

    function showProjectTitle(link) {
        const image = link.querySelector(".icono");

        if (!image) return;

        const imageRect = image.getBoundingClientRect();

        const imageGap = Number(
    link.dataset.titleGap ?? 24
);

const enterDistance = Number(
    link.dataset.enterDistance ?? 38
);


        const imageCenterX =
            imageRect.left + imageRect.width / 2;

        const imageCenterY =
            imageRect.top + imageRect.height / 2;

        bigProjectTitle.textContent =
            link.dataset.label || "";

        bigProjectTitle.classList.remove("visible");
        bigProjectTitle.style.visibility = "hidden";

        /* Primero medimos el título */
        bigProjectTitle.style.left = "0px";
        bigProjectTitle.style.top = "0px";

        requestAnimationFrame(() => {
            const titleWidth = Math.min(
                bigProjectTitle.scrollWidth,
                window.innerWidth - screenMargin * 2
            );

            const titleHeight =
                bigProjectTitle.scrollHeight;

            let titleLeft;
            let entranceDirection;
            let titleOrigin;

            /*
             * Si el recorte está a la izquierda,
             * intentamos sacar el texto hacia la derecha.
             */
            if (imageCenterX < window.innerWidth / 2) {
                titleLeft =
                    imageRect.right + imageGap;

               entranceDirection = "-38px";
                titleOrigin = "left";

                /*
                 * Si no cabe a la derecha,
                 * lo sacamos hacia la izquierda.
                 */
                if (
                    titleLeft + titleWidth >
                    window.innerWidth - screenMargin
                ) {
                    titleLeft =
                        imageRect.left -
                        titleWidth -
                        imageGap;

                    entranceDirection = "38px";
                    titleOrigin = "right";
                }
            } else {
                /*
                 * Si el recorte está a la derecha,
                 * intentamos sacar el texto hacia la izquierda.
                 */
                titleLeft =
                    imageRect.left -
                    titleWidth -
                    imageGap;

                entranceDirection = "38px";
                titleOrigin = "right";

                /*
                 * Si no cabe, lo colocamos a la derecha.
                 */
                if (titleLeft < screenMargin) {
                    titleLeft =
                        imageRect.right + imageGap;

                   entranceDirection = "-38px";
                    titleOrigin = "left";
                }
            }

            /*
             * Impide que el título se salga
             * por cualquiera de los laterales.
             */
            titleLeft = Math.max(
                screenMargin,
                Math.min(
                    titleLeft,
                    window.innerWidth -
                    titleWidth -
                    screenMargin
                )
            );

            /*
             * Impide que se salga por arriba o por abajo.
             */
            const halfTitleHeight = titleHeight / 2;

            const titleTop = Math.max(
                screenMargin + halfTitleHeight,
                Math.min(
                    imageCenterY,
                    window.innerHeight -
                    screenMargin -
                    halfTitleHeight
                )
            );

            bigProjectTitle.style.left =
                `${titleLeft}px`;

            bigProjectTitle.style.top =
                `${titleTop}px`;

            bigProjectTitle.style.setProperty(
                "--enter-x",
                entranceDirection
            );

            bigProjectTitle.style.setProperty(
                "--title-origin",
                titleOrigin
            );

            bigProjectTitle.style.visibility =
                "visible";

            requestAnimationFrame(() => {
                bigProjectTitle.classList.add(
                    "visible"
                );
            });
        });
    }

    projectLinks.forEach((link) => {
        link.addEventListener("mouseenter", () => {
            showProjectTitle(link);
        });

        link.addEventListener("mouseleave", () => {
            bigProjectTitle.classList.remove(
                "visible"
            );
        });
    });

    /*
     * Si se cambia el tamaño de la ventana
     * mientras aparece un título, lo ocultamos.
     */
    window.addEventListener("resize", () => {
        bigProjectTitle.classList.remove("visible");
    });
}