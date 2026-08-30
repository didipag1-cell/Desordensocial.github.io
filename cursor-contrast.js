/* =========================================================
   DESORDEN SOCIAL — CURSOR CON CONTRASTE AUTOMÁTICO

   El cursor sigue siendo negro normalmente.
   Cuando está sobre una zona oscura, se vuelve blanco.

   No controla el movimiento del cursor:
   solo cambia su color, así que puede convivir con
   script.js, cara.js, usuarios.js, menu.js, etc.
========================================================= */

(() => {

    const cursor =
        document.querySelector(
            ".custom-cursor"
        );

    const cursorImage =
        cursor?.querySelector(
            "img"
        );


    if (
        !cursor ||
        !cursorImage ||
        !window.matchMedia(
            "(pointer: fine)"
        ).matches
    ) {
        return;
    }


    cursorImage.style.transition =
        "filter 0.12s ease";


    /* =====================================================
       COLOR → RGB
    ===================================================== */

    function parseRgb(
        value
    ) {

        if (
            !value ||
            value === "transparent"
        ) {
            return null;
        }


        const match =
            value.match(
                /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
            );


        if (!match) {
            return null;
        }


        const alpha =
            match[4] === undefined
                ? 1
                : Number(
                    match[4]
                );


        if (
            alpha <= 0.05
        ) {
            return null;
        }


        return {
            r: Number(
                match[1]
            ),

            g: Number(
                match[2]
            ),

            b: Number(
                match[3]
            ),

            a: alpha
        };

    }


    /* =====================================================
       ¿ES OSCURO?
    ===================================================== */

    function isDark(
        color
    ) {

        if (!color) {
            return false;
        }


        /*
           Brillo perceptual.
           0 = negro
           255 = blanco

           El umbral 112 hace que negro,
           gris muy oscuro, azul marino, etc.
           usen cursor blanco.
        */

        const brightness =
            (
                color.r * 299 +
                color.g * 587 +
                color.b * 114
            ) /
            1000;


        return brightness < 112;

    }


    /* =====================================================
       BUSCAR EL FONDO REAL DEL ELEMENTO

       Subimos por sus padres hasta encontrar
       un background-color no transparente.
    ===================================================== */

    function getSurfaceColor(
        element
    ) {

        let current =
            element;


        while (
            current &&
            current !== document
        ) {

            const style =
                getComputedStyle(
                    current
                );


            const color =
                parseRgb(
                    style.backgroundColor
                );


            if (color) {
                return color;
            }


            current =
                current.parentElement;

        }


        /*
           Última red de seguridad:
           html / body.
        */

        const bodyColor =
            parseRgb(
                getComputedStyle(
                    document.body
                ).backgroundColor
            );


        if (bodyColor) {
            return bodyColor;
        }


        return parseRgb(
            getComputedStyle(
                document.documentElement
            ).backgroundColor
        );

    }


    /* =====================================================
       APLICAR COLOR
    ===================================================== */

    function updateCursorContrast(
        x,
        y
    ) {

        const underneath =
            document.elementFromPoint(
                x,
                y
            );


        if (!underneath) {
            return;
        }


        const surfaceColor =
            getSurfaceColor(
                underneath
            );


        const dark =
            isDark(
                surfaceColor
            );


        cursor.classList.toggle(
            "cursor-on-dark",
            dark
        );


        /*
           Forzamos el SVG a negro o blanco.
           Así funciona aunque el SVG original
           no sea negro puro.
        */

        cursorImage.style.filter =
            dark
                ? "brightness(0) invert(1)"
                : "brightness(0)";

    }


    /* =====================================================
       MOVIMIENTO
    ===================================================== */

    document.addEventListener(
        "mousemove",
        event => {

            updateCursorContrast(
                event.clientX,
                event.clientY
            );

        },
        {
            passive: true
        }
    );

})();
