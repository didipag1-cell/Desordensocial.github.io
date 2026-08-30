document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           HERO
        ================================================= */

        const heroText =
            document.querySelector(
                "#infoHeroText"
            );


        const phrases = [
            "¿quién es desorden social?",
            "eres tú",
            "soy yo",
            "somos todos"
        ];


        const sequence = [
            0,
            1,
            2,
            3,
            2,
            1
        ];


        let heroStep = 0;


        function renderHero() {

            if (!heroText) {
                return;
            }


            heroText.textContent =
                phrases[
                    sequence[heroStep]
                ];


            heroStep++;


            if (
                heroStep >=
                sequence.length
            ) {

                heroStep = 0;

            }

        }


        renderHero();


        setInterval(
            renderHero,
            500
        );



        /* =================================================
           STOP MOTION PEQUEÑO
        ================================================= */

        const frame =
            document.querySelector(
                "#stopMotionFrame"
            );


        const wrapper =
            document.querySelector(
                "#stopMotion"
            );


        const extensions = [
            "jpg",
            "jpeg",
            "png",
            "webp"
        ];


        const discoveredFrames = {};


        function findFrame(index) {

            return new Promise(
                resolve => {


                    let extensionIndex = 0;


                    function tryExtension() {


                        if (
                            extensionIndex >=
                            extensions.length
                        ) {

                            resolve(null);

                            return;

                        }


                        const source =
                            `assets/about/intro/${index}.${extensions[extensionIndex]}`;


                        const image =
                            new Image();


                        image.onload =
                            () => {

                                resolve(source);

                            };


                        image.onerror =
                            () => {

                                extensionIndex++;

                                tryExtension();

                            };


                        image.src =
                            source;

                    }


                    tryExtension();

                }
            );

        }



        async function startStopMotion() {


            if (!frame || !wrapper) {
                return;
            }


            for (
                const index
                of [0, 1, 2, 3]
            ) {

                discoveredFrames[index] =
                    await findFrame(index);

            }


            const ready =
                [0, 1, 2, 3].every(
                    index =>
                        discoveredFrames[index]
                );


            if (!ready) {

                wrapper.style.display =
                    "none";

                return;

            }


            let frameStep = 0;


            function renderFrame() {


                const index =
                    sequence[
                        frameStep
                    ];


                frame.src =
                    discoveredFrames[
                        index
                    ];


                frameStep++;


                if (
                    frameStep >=
                    sequence.length
                ) {

                    frameStep = 0;

                }

            }


            renderFrame();


            setInterval(
                renderFrame,
                500
            );

        }


        startStopMotion();



        /* =================================================
           CURSOR
        ================================================= */

        const cursor =
            document.querySelector(
                "#customCursor"
            );


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

                },
                {
                    passive: true
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
                            "a, button"
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
                            "a, button"
                        )
                    ) {

                        cursor.classList.remove(
                            "is-hovering"
                        );

                    }

                }
            );

        }



       /* =================================================
   PRIMERA PANTALLA

   Mientras estamos dentro del hero:
   - no abeja
   - no flecha

   Cuando salimos:
   - aparece abeja
   - aparece flecha

   Si volvemos arriba:
   - ambas vuelven a desaparecer
================================================= */

const heroStage =
    document.querySelector(
        ".hero-stage"
    );


function updateHeroState() {

    if (!heroStage) {
        return;
    }


    const heroHeight =
        heroStage.offsetHeight;


    /*
        Aparecen justo después
        de atravesar la primera pantalla.
    */

    const hasLeftHero =
        window.scrollY >=
        heroHeight - 10;


    document.body.classList.toggle(
        "has-left-hero",
        hasLeftHero
    );

}


window.addEventListener(
    "scroll",
    updateHeroState,
    {
        passive: true
    }
);


window.addEventListener(
    "resize",
    updateHeroState
);


updateHeroState();



        function updateHeroState() {


            /*
                La primera pantalla mide 100vh.

                Hasta que no la hemos atravesado
                casi completamente:

                - no hay abeja
                - no hay flecha
            */


            const heroLimit =
                window.innerHeight * 0.94;


            const hasLeftHero =
                window.scrollY >=
                heroLimit;



            if (hasLeftHero) {


                document.body.classList.add(
                    "has-left-hero"
                );


                loadBee();


                window.removeEventListener(
                    "scroll",
                    updateHeroState
                );

            }

        }



        window.addEventListener(
            "scroll",
            updateHeroState,
            {
                passive: true
            }
        );


        updateHeroState();


    }
);