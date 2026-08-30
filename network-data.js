/* =========================================================
   DESORDEN SOCIAL
   RED EDITORIAL ORIGINAL

   Aquí viven las conexiones creadas por Diana.
   Las conexiones de visitantes se guardarán aparte.
   ========================================================= */

window.DESORDEN_NETWORK = {

    nodes: [

        {
    id: "almodovar",

    type: "editorial",

    title: "Pedro Almodóvar",

    text: "",

    image: "",

    url: "",

    caption: "",

    x: 260,
    y: 260
}

       {
    id: "roche-bobois",

    type: "editorial",

    title: "Roche Bobois",

    text: "",

    image: "",

    url: "",

    caption: "",

    x: 560,
    y: 330
}
        {
            id: "furniture",
            title: "furniture que me gusta",
            x: 850,
            y: 250
        },

        {
            id: "alemania-calle",
            title: "Alemania / cosas en la calle",
            x: 1060,
            y: 470
        },

        {
            id: "reutilizar",
            title: "encontrar y reutilizar cosas buenas",
            x: 820,
            y: 650
        },

        {
            id: "comunidad-favores",
            title: "comunidad de favores",
            x: 510,
            y: 720
        },

        {
            id: "individualismo",
            title: "fuera el individualismo",
            x: 260,
            y: 590
        }

    ],


    edges: [

        {
            from: "almodovar",
            to: "roche-bobois"
        },

        {
            from: "roche-bobois",
            to: "furniture"
        },

        {
            from: "furniture",
            to: "alemania-calle"
        },

        {
            from: "alemania-calle",
            to: "reutilizar"
        },

        {
            from: "reutilizar",
            to: "comunidad-favores"
        },

        {
            from: "comunidad-favores",
            to: "individualismo"
        }

    ]

};