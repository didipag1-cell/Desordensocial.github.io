document.addEventListener(
    "DOMContentLoaded",
    () => {


        const cursor =
            document.querySelector(
                "#customCursor"
            );


        if (
            !cursor ||
            !window.matchMedia(
                "(pointer: fine)"
            ).matches
        ) {
            return;
        }


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


    }
);