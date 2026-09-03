/* =========================================================
   DESORDEN SOCIAL — RESPUESTAS EN ???
   Archivo adicional: entrevistas-replies.js

   IMPORTANTE:
   - no toca el datamosh
   - no sustituye entrevistas.js
   - se carga DESPUÉS de entrevistas.js
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /*
       Seguridad:
       aunque el archivo se cargue dos veces por accidente,
       el sistema de respuestas solo se inicializa una vez.
    */
    if (window.__desordenRepliesInitialized) {
        return;
    }

    window.__desordenRepliesInitialized =
        true;


    const db =
        window.db || null;

    const stream =
        document.getElementById(
            "conversationStream"
        );

    const form =
        document.getElementById(
            "conversationForm"
        );

    const messageInput =
        document.getElementById(
            "chatMessage"
        );

    const websiteField =
        document.getElementById(
            "websiteField"
        );


    if (
        !db ||
        !stream ||
        !form ||
        !messageInput
    ) {
        return;
    }


    /* =====================================================
       ESTADO
    ===================================================== */

    const rowsById =
        new Map();

    const usernamesByUserId =
        new Map();

    let replyingTo =
        null;

    let sendingReply =
        false;

    let replyUi =
        null;


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function cleanUsername(username) {

        if (!username) {
            return "@usuario";
        }

        const value =
            String(username);

        return value.startsWith("@")
            ? value
            : `@${value}`;
    }


    function messageOffset(seed) {

        const value =
            String(seed);

        let hash = 0;

        for (
            let i = 0;
            i < value.length;
            i++
        ) {
            hash =
                (
                    hash * 31 +
                    value.charCodeAt(i)
                ) >>>
                0;
        }


        const isMobile =
            window.matchMedia(
                "(max-width: 640px)"
            ).matches;

        const isTablet =
            window.matchMedia(
                "(min-width: 641px) and (max-width: 980px)"
            ).matches;


        if (isMobile) {

            const positions = [
                1, 23, 7, 26,
                12, 18, 4, 21,
                9, 25, 15, 3
            ];

            return positions[
                hash %
                positions.length
            ];
        }


        if (isTablet) {

            const positions = [
                2, 34, 12, 40,
                20, 6, 29, 16,
                38, 9, 25, 4
            ];

            return positions[
                hash %
                positions.length
            ];
        }


        return (
            3 +
            (
                hash %
                50
            )
        );
    }


    function shortMessage(message) {

        const value =
            String(message || "")
                .replace(/\s+/g, " ")
                .trim();

        if (
            value.length <=
            92
        ) {
            return value;
        }

        return (
            value.slice(0, 89) +
            "..."
        );
    }


    async function loadUsername(
        userId
    ) {

        if (!userId) {
            return null;
        }


        if (
            usernamesByUserId.has(
                userId
            )
        ) {
            return usernamesByUserId.get(
                userId
            );
        }


        const {
            data,
            error
        } =
            await db
                .from("profiles")
                .select(
                    "id,username"
                )
                .eq(
                    "id",
                    userId
                )
                .maybeSingle();


        if (error) {

            console.error(
                "No se pudo cargar el @ de la respuesta:",
                error
            );

            return null;
        }


        const username =
            data?.username ||
            null;


        usernamesByUserId.set(
            userId,
            username
        );


        return username;
    }


    async function getIdentity() {

        if (
            window.DesordenUser
                ?.getCurrentUser
        ) {

            const user =
                await window
                    .DesordenUser
                    .getCurrentUser();

            if (!user) {
                return null;
            }


            const profile =
                await window
                    .DesordenUser
                    .getProfile();


            if (
                !profile
                    ?.username
            ) {
                return null;
            }


            usernamesByUserId.set(
                user.id,
                profile.username
            );


            return {
                user,
                username:
                    profile.username
            };
        }


        const {
            data: sessionData,
            error: sessionError
        } =
            await db
                .auth
                .getSession();


        if (sessionError) {
            return null;
        }


        const user =
            sessionData
                ?.session
                ?.user ||
            null;


        if (
            !user ||
            user.is_anonymous
        ) {
            return null;
        }


        const username =
            await loadUsername(
                user.id
            );


        if (!username) {
            return null;
        }


        return {
            user,
            username
        };
    }


    /* =====================================================
       DATOS DEL CHAT
    ===================================================== */

    async function loadChatData() {

        const {
            data: rows,
            error
        } =
            await db
                .from(
                    "interview_chat"
                )
                .select(
                    "id,created_by,message,created_at,reply_to"
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                )
                .limit(
                    100
                );


        if (error) {

            console.error(
                "No se pudieron cargar las respuestas de ???:",
                error
            );

            return false;
        }


        rowsById.clear();


        rows?.forEach(
            row => {
                rowsById.set(
                    String(row.id),
                    row
                );
            }
        );


        const userIds =
            [
                ...new Set(
                    (rows || [])
                        .map(
                            row =>
                                row.created_by
                        )
                        .filter(
                            Boolean
                        )
                )
            ];


        if (userIds.length) {

            const {
                data: profiles,
                error: profileError
            } =
                await db
                    .from(
                        "profiles"
                    )
                    .select(
                        "id,username"
                    )
                    .in(
                        "id",
                        userIds
                    );


            if (!profileError) {

                profiles
                    ?.forEach(
                        profile => {

                            usernamesByUserId
                                .set(
                                    profile.id,
                                    profile.username
                                );

                        }
                    );

            }
        }


        return true;
    }


    async function getRow(
        messageId
    ) {

        const key =
            String(messageId);


        if (
            rowsById.has(
                key
            )
        ) {
            return rowsById.get(
                key
            );
        }


        const {
            data,
            error
        } =
            await db
                .from(
                    "interview_chat"
                )
                .select(
                    "id,created_by,message,created_at,reply_to"
                )
                .eq(
                    "id",
                    messageId
                )
                .maybeSingle();


        if (
            error ||
            !data
        ) {
            return null;
        }


        rowsById.set(
            String(data.id),
            data
        );


        return data;
    }


    /* =====================================================
       PREVIEW AL ESCRIBIR UNA RESPUESTA
    ===================================================== */

    function ensureReplyUi() {

        if (replyUi) {
            return replyUi;
        }


        const row =
            form.querySelector(
                ".form-message-row"
            );


        if (!row) {
            return null;
        }


        const box =
            document.createElement(
                "div"
            );

        box.className =
            "reply-compose";

        box.hidden =
            true;


        const textWrap =
            document.createElement(
                "div"
            );

        textWrap.className =
            "reply-compose-text";


        const label =
            document.createElement(
                "span"
            );

        label.className =
            "reply-compose-label";


        const quote =
            document.createElement(
                "span"
            );

        quote.className =
            "reply-compose-quote";


        const cancel =
            document.createElement(
                "button"
            );

        cancel.className =
            "reply-compose-cancel";

        cancel.type =
            "button";

        cancel.setAttribute(
            "aria-label",
            "Cancelar respuesta"
        );

        cancel.textContent =
            "×";


        cancel.addEventListener(
            "click",
            () => {
                clearReply();
                messageInput.focus();
            }
        );


        textWrap.append(
            label,
            quote
        );

        box.append(
            textWrap,
            cancel
        );


        form.insertBefore(
            box,
            row
        );


        replyUi = {
            box,
            label,
            quote
        };


        return replyUi;
    }


    function setReply(
        row,
        username
    ) {

        const ui =
            ensureReplyUi();


        if (!ui) {
            return;
        }


        replyingTo = {
            id:
                row.id,

            username:
                cleanUsername(
                    username
                ),

            message:
                row.message ||
                ""
        };


        ui.label.textContent =
            `respondiendo a ${replyingTo.username}`;

        ui.quote.textContent =
            `“${shortMessage(
                replyingTo.message
            )}”`;

        ui.box.hidden =
            false;


        messageInput.placeholder =
            "responde...";

        messageInput.focus();
    }


    function clearReply() {

        replyingTo =
            null;


        const ui =
            ensureReplyUi();


        if (ui) {
            ui.box.hidden =
                true;

            ui.label.textContent =
                "";

            ui.quote.textContent =
                "";
        }


        messageInput.placeholder =
            "di algo...";
    }


    /* =====================================================
       REFERENCIA A MENSAJE ORIGINAL
    ===================================================== */

    async function makeReplyContext(
        row
    ) {

        if (
            !row?.reply_to
        ) {
            return null;
        }


        const parent =
            await getRow(
                row.reply_to
            );


        if (!parent) {
            return null;
        }


        const parentUsername =
            await loadUsername(
                parent.created_by
            );


        const context =
            document.createElement(
                "button"
            );

        context.type =
            "button";

        context.className =
            "chat-reply-context";

        context.dataset.targetMessageId =
            parent.id;


        const who =
            document.createElement(
                "span"
            );

        who.className =
            "chat-reply-context-name";

        who.textContent =
            `↳ ${cleanUsername(
                parentUsername
            )}`;


        const quote =
            document.createElement(
                "span"
            );

        quote.className =
            "chat-reply-context-quote";

        quote.textContent =
            shortMessage(
                parent.message
            );


        context.append(
            who,
            quote
        );


        context.addEventListener(
            "click",
            () => {

                const target =
                    stream.querySelector(
                        `[data-message-id="${CSS.escape(
                            String(parent.id)
                        )}"]`
                    );


                if (target) {

                    target.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "center"
                    });


                    target.classList.add(
                        "is-reply-target"
                    );


                    window.setTimeout(
                        () => {
                            target.classList
                                .remove(
                                    "is-reply-target"
                                );
                        },
                        1100
                    );

                }

            }
        );


        return context;
    }


    /* =====================================================
       AÑADIR "RESPONDER" A CADA MENSAJE
    ===================================================== */

    async function enhanceArticle(
        article
    ) {

        if (!article) {
            return;
        }


        /*
           MUY IMPORTANTE:
           marcamos el mensaje ANTES del primer await.

           Antes, MutationObserver + carga inicial podían
           entrar aquí al mismo tiempo. Los dos procesos
           esperaban a Supabase y después ambos añadían
           la referencia y el botón "responder".

           Resultado:
           referencia duplicada + responder duplicado.
        */
        if (
            article.dataset
                .replyEnhanced
        ) {
            return;
        }


        article.dataset.replyEnhanced =
            "pending";


        const messageId =
            article.dataset
                .messageId;


        if (!messageId) {

            delete article.dataset
                .replyEnhanced;

            return;
        }


        const row =
            await getRow(
                messageId
            );


        if (!row) {

            delete article.dataset
                .replyEnhanced;

            return;
        }


        /*
           Limpieza defensiva:
           si por una versión anterior quedaron elementos
           repetidos en el DOM, dejamos únicamente la
           versión que vamos a crear ahora.
        */
        article
            .querySelectorAll(
                ".chat-reply-context, .chat-reply-button"
            )
            .forEach(
                element => {
                    element.remove();
                }
            );


        const username =
            await loadUsername(
                row.created_by
            );


        if (row.reply_to) {

            const context =
                await makeReplyContext(
                    row
                );


            if (context) {

                const name =
                    article.querySelector(
                        ".chat-entry-name"
                    );


                article.insertBefore(
                    context,
                    name ||
                    article.firstChild
                );

            }

        }


        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "chat-reply-button";

        button.textContent =
            "responder ↩";


        button.addEventListener(
            "click",
            () => {

                setReply(
                    row,
                    username
                );

            }
        );


        article.appendChild(
            button
        );


        article.dataset.replyEnhanced =
            "true";

    }

    function enhanceAllArticles() {

        stream
            .querySelectorAll(
                ".chat-entry"
            )
            .forEach(
                article => {
                    enhanceArticle(
                        article
                    );
                }
            );
    }


    /* =====================================================
       RENDER INMEDIATO DE UNA RESPUESTA NUEVA

       El realtime original también la recibirá,
       pero entrevistas.js evita duplicados por id.
    ===================================================== */

    async function renderLocalReply(
        row,
        username
    ) {

        const existing =
            stream.querySelector(
                `[data-message-id="${CSS.escape(
                    String(row.id)
                )}"]`
            );


        if (existing) {

            await enhanceArticle(
                existing
            );

            return;
        }


        const article =
            document.createElement(
                "article"
            );

        article.className =
            "chat-entry is-new";

        article.dataset.messageId =
            row.id;

        article.style.setProperty(
            "--x",
            `${messageOffset(
                row.id
            )}%`
        );


        const name =
            document.createElement(
                "span"
            );

        name.className =
            "chat-entry-name";

        name.textContent =
            cleanUsername(
                username
            );


        const message =
            document.createElement(
                "p"
            );

        message.className =
            "chat-entry-message";

        message.textContent =
            row.message ||
            "";


        article.append(
            name,
            message
        );


        stream.appendChild(
            article
        );


        await enhanceArticle(
            article
        );

    }


    /* =====================================================
       ENVIAR RESPUESTA

       Capturamos SOLO cuando replyingTo existe.
       Los mensajes normales siguen siendo enviados
       por entrevistas.js exactamente como antes.
    ===================================================== */

    form.addEventListener(
        "submit",
        async event => {

            if (!replyingTo) {
                return;
            }


            event.preventDefault();
            event.stopImmediatePropagation();


            if (
                sendingReply ||
                websiteField?.value
            ) {
                return;
            }


            const message =
                messageInput
                    .value
                    .trim();


            if (!message) {
                return;
            }


            const identity =
                await getIdentity();


            if (!identity) {

                messageInput.placeholder =
                    "entra primero con tu @ usando la abeja...";

                return;
            }


            sendingReply =
                true;


            const parentId =
                replyingTo.id;


            const {
                data,
                error
            } =
                await db
                    .from(
                        "interview_chat"
                    )
                    .insert({
                        created_by:
                            identity.user.id,

                        message:
                            message.slice(
                                0,
                                500
                            ),

                        reply_to:
                            parentId
                    })
                    .select(
                        "id,created_by,message,created_at,reply_to"
                    )
                    .single();


            sendingReply =
                false;


            if (error) {

                console.error(
                    "No se pudo enviar la respuesta:",
                    error
                );

                return;
            }


            rowsById.set(
                String(data.id),
                data
            );

            usernamesByUserId.set(
                identity.user.id,
                identity.username
            );


            await renderLocalReply(
                data,
                identity.username
            );


            messageInput.value =
                "";

            messageInput.style.height =
                "auto";


            clearReply();

        },
        true
    );


    /* =====================================================
       OBSERVAR MENSAJES QUE LLEGAN POR REALTIME
    ===================================================== */

    const observer =
        new MutationObserver(
            mutations => {

                mutations.forEach(
                    mutation => {

                        mutation.addedNodes
                            .forEach(
                                node => {

                                    if (
                                        !(node instanceof HTMLElement)
                                    ) {
                                        return;
                                    }


                                    if (
                                        node.matches(
                                            ".chat-entry"
                                        )
                                    ) {
                                        enhanceArticle(
                                            node
                                        );

                                        return;
                                    }


                                    node.querySelectorAll(
                                        ".chat-entry"
                                    )
                                        .forEach(
                                            article => {
                                                enhanceArticle(
                                                    article
                                                );
                                            }
                                        );

                                }
                            );

                    }
                );

            }
        );


    observer.observe(
        stream,
        {
            childList:
                true,

            subtree:
                true
        }
    );


    /* =====================================================
       INICIAR
    ===================================================== */

    (async () => {

        const ok =
            await loadChatData();


        if (!ok) {
            return;
        }


        ensureReplyUi();

        enhanceAllArticles();

    })();

});
