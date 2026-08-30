/* =========================================================
   DESORDEN SOCIAL
   NUDOS DE USUARIOS DESDE SUPABASE
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const canvas =
        document.querySelector(".network-canvas");

    if (!canvas || !window.db) {
        return;
    }


    async function loadUserNodes() {

        const {
            data: nodes,
            error
        } =
            await window.db
                .from("nodes")
                .select("*")
                .eq("is_published", true)
                .eq("is_seed", false);


        if (error) {

            console.error(
                "Error cargando nudos de usuarios:",
                error
            );

            return;
        }
        /* =====================================================
   BUSCAR LOS @USERNAME DE QUIEN CREÓ CADA NUDO
===================================================== */

const creatorIds = [
    ...new Set(
        nodes
            .map(node => node.created_by)
            .filter(Boolean)
    )
];


const profilesById = {};


if (creatorIds.length > 0) {

    const {
        data: profiles,
        error: profilesError
    } =
        await window.db
            .from("profiles")
            .select("id, username")
            .in("id", creatorIds);


    if (profilesError) {

        console.error(
            "Error cargando perfiles:",
            profilesError
        );

    } else {

        (profiles || []).forEach(profile => {

            profilesById[profile.id] =
                profile;

        });

    }

}


        nodes.forEach(node => {

            /*
               Evita duplicados si recargamos
               la función.
            */

            if (
                document.querySelector(
                    `[data-node-id="${node.id}"]`
                )
            ) {
                return;
            }


            const element =
    createUserNode(
        node,
        profilesById[node.created_by] || null
    );


            canvas.appendChild(element);

        });


        /*
           Avisamos al resto de la página
           de que ya hay nuevos nudos.
        */

        window.dispatchEvent(
            new CustomEvent(
                "desorden:nodes-loaded"
            )
        );

    }


    function createUserNode(
    node,
    profile = null
) {

        /*
           Si tiene URL externa,
           el nudo será un enlace.

           Si no, será un div.
        */

        const element =
            document.createElement(
                node.external_url
                    ? "a"
                    : "div"
            );


        element.className =
            "user-node";

        element.dataset.nodeId =
            node.id;

        element.dataset.nodeSlug =
            node.slug || "";


        if (node.external_url) {

            element.href =
                node.external_url;

            element.target =
                "_blank";

            element.rel =
                "noopener noreferrer";

        }


        /*
           POSICIÓN

           x e y serán coordenadas
           dentro del lienzo de Cara.
        */

        element.style.left =
            `${node.x}px`;

        element.style.top =
            `${node.y}px`;


        /*
           Escala individual de aureola.
        */

        element.style.setProperty(
            "--aura-scale",
            node.aura_scale || 1
        );


        /* ==============================
           AUREOLA / ANCLA
        ============================== */

        const aura =
            document.createElement("span");

        aura.className =
            "node-pin user-node-aura";

        element.appendChild(aura);


        /* ==============================
           CONTENIDO
        ============================== */

        const content =
            document.createElement("div");

        content.className =
            "user-node-content";


        /*
           IMAGEN / ICONO
        */

        if (
            node.media_url &&
            (
                node.content_type === "image" ||
                node.content_type === "icon" ||
                node.content_type === "video" ||
                node.content_type === "mixed"
            )
        ) {

            const image =
                document.createElement("img");

            image.src =
                node.media_url;

            image.alt =
                node.title || "";

            image.className =
                "user-node-media";

            content.appendChild(image);

        }


        /*
           TÍTULO
        */

        if (node.title) {

            const title =
                document.createElement("div");

            title.className =
                "user-node-title";

            title.textContent =
                node.title;

            content.appendChild(title);

        }


        /*
           TEXTO

           De momento mostramos solo una
           cantidad pequeña en la red.
        */

        if (
            node.body &&
            node.content_type === "text"
        ) {

            const text =
                document.createElement("p");

            text.className =
                "user-node-text";

            text.textContent =
                node.body.length > 120
                    ? node.body.slice(0, 120) + "…"
                    : node.body;

            content.appendChild(text);

        }
        /* ==============================
   AUTOR / PERFIL
============================== */

if (
    profile &&
    profile.username
) {

    const author =
        document.createElement("span");

    author.className =
        "user-node-author";

    author.textContent =
        `@${profile.username}`;

    author.dataset.username =
        profile.username;

    content.appendChild(author);

}


        element.appendChild(content);


        return element;

    }


    await loadUserNodes();


    /*
       Dejamos esta función disponible
       para usarla después con la abeja.
    */

    window.loadDesordenUserNodes =
        loadUserNodes;

});