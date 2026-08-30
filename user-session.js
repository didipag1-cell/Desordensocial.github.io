/* =========================================================
   DESORDEN SOCIAL
   USUARIO / SESIÓN / @USERNAME
========================================================= */

(() => {

    let currentUser = null;
    let currentProfile = null;


    /* =====================================================
       ASEGURAR QUE EXISTE UNA SESIÓN
    ===================================================== */

    async function ensureSession() {

        if (!window.db) {

            console.error(
                "Supabase todavía no está disponible."
            );

            return null;
        }


        /*
           Primero comprobamos si este navegador
           ya tiene una sesión guardada.
        */

        const {
            data: sessionData,
            error: sessionError
        } =
            await window.db.auth.getSession();


        if (sessionError) {

            console.error(
                "Error comprobando sesión:",
                sessionError
            );

            return null;
        }


        if (
            sessionData &&
            sessionData.session &&
            sessionData.session.user
        ) {

            currentUser =
                sessionData.session.user;

            return currentUser;

        }


        /*
           Si nunca había entrado,
           creamos un usuario anónimo.
        */

        const {
            data,
            error
        } =
            await window.db.auth
                .signInAnonymously();


        if (error) {

            console.error(
                "Error creando usuario anónimo:",
                error
            );

            return null;
        }


        currentUser =
            data.user;


        return currentUser;

    }


    /* =====================================================
       BUSCAR SU PERFIL
    ===================================================== */

    async function getProfile() {

        const user =
            await ensureSession();


        if (!user) {
            return null;
        }


        const {
            data,
            error
        } =
            await window.db
                .from("profiles")
                .select(
                    "id, username, created_at"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Error buscando perfil:",
                error
            );

            return null;
        }


        currentProfile =
            data || null;


        return currentProfile;

    }


    /* =====================================================
       CREAR @USERNAME
    ===================================================== */

    async function createProfile(
        rawUsername
    ) {

        const user =
            await ensureSession();


        if (!user) {
            return {
                data: null,
                error: new Error(
                    "No hay usuario disponible."
                )
            };
        }


        /*
           Quitamos espacios y @.
           Lo guardamos en minúsculas
           para evitar didi / Didi / DIDI.
        */

        const username =
            String(rawUsername || "")
                .trim()
                .replace(/^@+/, "")
                .toLowerCase();


        if (
            username.length < 2 ||
            username.length > 30
        ) {

            return {
                data: null,
                error: new Error(
                    "El nombre debe tener entre 2 y 30 caracteres."
                )
            };

        }


        /*
           Si esta persona ya tiene perfil,
           no creamos otro.
        */

        const existingProfile =
            await getProfile();


        if (existingProfile) {

            return {
                data: existingProfile,
                error: null
            };

        }


        /*
           Comprobamos si el nombre
           ya pertenece a otra persona.
        */

        const {
            data: usernameOwner,
            error: usernameCheckError
        } =
            await window.db
                .from("profiles")
                .select(
                    "id, username"
                )
                .eq(
                    "username",
                    username
                )
                .maybeSingle();


        if (usernameCheckError) {

            return {
                data: null,
                error: usernameCheckError
            };

        }


        if (usernameOwner) {

            return {
                data: null,
                error: new Error(
                    `@${username} ya está en uso.`
                )
            };

        }


        /*
           Creamos el perfil.
        */

        const {
            data,
            error
        } =
            await window.db
                .from("profiles")
                .insert({
                    id:
                        user.id,

                    username:
                        username
                })
                .select(
                    "id, username, created_at"
                )
                .single();


        if (error) {

            console.error(
                "Error creando perfil:",
                error
            );

            return {
                data: null,
                error
            };

        }


        currentProfile =
            data;


        /*
           Avisamos al resto de la web.
        */

        window.dispatchEvent(
            new CustomEvent(
                "desorden:user-ready",
                {
                    detail: {
                        user:
                            currentUser,

                        profile:
                            currentProfile
                    }
                }
            )
        );


        return {
            data:
                currentProfile,

            error:
                null
        };

    }


    /* =====================================================
       SABER QUIÉN ES EL USUARIO ACTUAL
    ===================================================== */

    async function getCurrentUser() {

        return await ensureSession();

    }


    /* =====================================================
       INICIALIZACIÓN
    ===================================================== */

    async function init() {

        await ensureSession();

        await getProfile();


        console.log(
            "Usuario Desorden:",
            currentProfile
                ? `@${currentProfile.username}`
                : "sin username todavía"
        );


        window.dispatchEvent(
            new CustomEvent(
                "desorden:user-ready",
                {
                    detail: {
                        user:
                            currentUser,

                        profile:
                            currentProfile
                    }
                }
            )
        );

    }


    /* =====================================================
       API PARA LA ABEJA
    ===================================================== */

    window.DesordenUser = {

        init,

        getCurrentUser,

        getProfile,

        createProfile,

        get user() {
            return currentUser;
        },

        get profile() {
            return currentProfile;
        }

    };


    init();

})();