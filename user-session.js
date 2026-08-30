/* =========================================================
   DESORDEN SOCIAL
   USUARIO / SESIÓN / @USERNAME + CONTRASEÑA
========================================================= */

(() => {

    let currentUser = null;
    let currentProfile = null;

    /*
       Supabase necesita internamente un email
       para usar autenticación con contraseña.

       El visitante NO verá ni escribirá este email.
       Se genera automáticamente a partir del @username.
    */

    const INTERNAL_AUTH_DOMAIN =
        "auth.desordensocial.com";


    /* =====================================================
       NORMALIZAR @USERNAME
    ===================================================== */

    function normalizeUsername(rawUsername) {

        return String(rawUsername || "")
            .trim()
            .replace(/^@+/, "")
            .toLowerCase();

    }


    /* =====================================================
       VALIDAR @USERNAME
    ===================================================== */

    function validateUsername(username) {

        if (
            username.length < 2 ||
            username.length > 30
        ) {

            return new Error(
                "el nombre debe tener entre 2 y 30 caracteres"
            );

        }


        /*
           Permitimos letras, números,
           puntos, guiones y guion bajo.

           También permitimos letras acentuadas.
        */

        const valid =
            /^[a-z0-9áéíóúüñ._-]+$/i
                .test(username);


        if (!valid) {

            return new Error(
                "usa solo letras, números, puntos, guiones o _"
            );

        }


        return null;

    }


    /* =====================================================
       VALIDAR CONTRASEÑA
    ===================================================== */

    function validatePassword(password) {

        const value =
            String(password || "");


        if (value.length < 8) {

            return new Error(
                "la contraseña debe tener al menos 8 caracteres"
            );

        }


        return null;

    }


    /* =====================================================
       CONVERTIR @USERNAME EN IDENTIDAD INTERNA

       Ejemplo conceptual:

       @didi
          ↓
       u-48f8...@auth.desordensocial.com

       El usuario nunca ve esto.
    ===================================================== */

    async function usernameToInternalEmail(
        username
    ) {

        if (
            !window.crypto ||
            !window.crypto.subtle
        ) {

            throw new Error(
                "este navegador no permite crear una sesión segura"
            );

        }


        const encoder =
            new TextEncoder();


        const bytes =
            encoder.encode(
                `desorden-social:${username}`
            );


        const hashBuffer =
            await window.crypto.subtle.digest(
                "SHA-256",
                bytes
            );


        const hash =
            Array.from(
                new Uint8Array(
                    hashBuffer
                )
            )
                .map(
                    byte =>
                        byte
                            .toString(16)
                            .padStart(2, "0")
                )
                .join("");


        /*
           48 caracteres son más que suficientes
           y mantienen el email interno corto.
        */

        return (
            "u-" +
            hash.slice(0, 48) +
            "@" +
            INTERNAL_AUTH_DOMAIN
        );

    }


    /* =====================================================
       AVISAR AL RESTO DE LA WEB
    ===================================================== */

    function dispatchUserReady() {

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
       LEER SESIÓN

       IMPORTANTE:
       ya NO creamos usuarios anónimos.
    ===================================================== */

    async function getCurrentUser() {

        if (!window.db) {

            console.error(
                "Supabase todavía no está disponible."
            );

            return null;

        }


        const {
            data,
            error
        } =
            await window.db.auth
                .getSession();


        if (error) {

            console.error(
                "Error comprobando sesión:",
                error
            );

            return null;

        }


        const user =
            data?.session?.user ||
            null;


        /*
           Durante las pruebas anteriores
           quedaron sesiones anónimas.

           Si encontramos una, la cerramos.
        */

        if (
            user &&
            user.is_anonymous
        ) {

            await window.db.auth
                .signOut({
                    scope:
                        "local"
                });


            currentUser =
                null;

            currentProfile =
                null;


            return null;

        }


        currentUser =
            user;


        return currentUser;

    }


    /* =====================================================
       BUSCAR PERFIL DE UN USUARIO
    ===================================================== */

    async function loadProfileForUser(
        user
    ) {

        if (!user) {

            currentProfile =
                null;

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
       PERFIL ACTUAL
    ===================================================== */

    async function getProfile() {

        const user =
            await getCurrentUser();


        if (!user) {

            currentProfile =
                null;

            return null;

        }


        return await loadProfileForUser(
            user
        );

    }


    /* =====================================================
       COMPROBAR SI UN @USERNAME EXISTE
    ===================================================== */

    async function findUsernameOwner(
        username
    ) {

        const {
            data,
            error
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


        if (error) {

            throw error;

        }


        return data || null;

    }


    /* =====================================================
       CREAR PERFIL PARA USUARIO AUTENTICADO
    ===================================================== */

    async function createProfileForUser(
        user,
        username
    ) {

        const owner =
            await findUsernameOwner(
                username
            );


        if (
            owner &&
            owner.id !== user.id
        ) {

            return {
                data:
                    null,

                error:
                    new Error(
                        `@${username} ya está en uso`
                    )
            };

        }


        if (
            owner &&
            owner.id === user.id
        ) {

            currentProfile =
                owner;


            return {
                data:
                    currentProfile,

                error:
                    null
            };

        }


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
                data:
                    null,

                error
            };

        }


        currentProfile =
            data;


        return {
            data:
                currentProfile,

            error:
                null
        };

    }


    /* =====================================================
       CREAR UNA CUENTA NUEVA

       @USERNAME + CONTRASEÑA
    ===================================================== */

    async function register(
        rawUsername,
        rawPassword
    ) {

        if (!window.db) {

            return {
                data:
                    null,

                error:
                    new Error(
                        "Supabase no está disponible"
                    )
            };

        }


        const username =
            normalizeUsername(
                rawUsername
            );


        const usernameError =
            validateUsername(
                username
            );


        if (usernameError) {

            return {
                data:
                    null,

                error:
                    usernameError
            };

        }


        const password =
            String(
                rawPassword || ""
            );


        const passwordError =
            validatePassword(
                password
            );


        if (passwordError) {

            return {
                data:
                    null,

                error:
                    passwordError
            };

        }


        try {

            /*
               Primero comprobamos que ese @
               no esté ya registrado.
            */

            const owner =
                await findUsernameOwner(
                    username
                );


            if (owner) {

                return {
                    data:
                        null,

                    error:
                        new Error(
                            `@${username} ya está en uso`
                        )
                };

            }


            const internalEmail =
                await usernameToInternalEmail(
                    username
                );


            /*
               Creamos el usuario permanente
               dentro de Supabase Auth.
            */

            const {
                data:
                    authData,

                error:
                    authError
            } =
                await window.db.auth
                    .signUp({

                        email:
                            internalEmail,

                        password:
                            password,

                        options: {

                            data: {
                                username:
                                    username,

                                desorden_social:
                                    true
                            }

                        }

                    });


            if (authError) {

                let message =
                    authError.message ||
                    "no se pudo crear la cuenta";


                if (
                    /already registered/i
                        .test(message)
                ) {

                    message =
                        `@${username} ya está en uso`;

                }


                return {
                    data:
                        null,

                    error:
                        new Error(
                            message
                        )
                };

            }


            const user =
                authData?.user ||
                null;


            if (!user) {

                return {
                    data:
                        null,

                    error:
                        new Error(
                            "no se pudo crear el usuario"
                        )
                };

            }


            currentUser =
                user;


            /*
               Creamos ahora el perfil público
               con su @username.
            */

            const profileResult =
                await createProfileForUser(
                    user,
                    username
                );


            if (
                profileResult.error
            ) {

                await window.db.auth
                    .signOut({
                        scope:
                            "local"
                    });


                currentUser =
                    null;

                currentProfile =
                    null;


                return profileResult;

            }


            dispatchUserReady();


            return {
                data:
                    currentProfile,

                error:
                    null
            };

        }
        catch (error) {

            console.error(
                "Error registrando usuario:",
                error
            );


            return {
                data:
                    null,

                error:
                    error instanceof Error
                        ? error
                        : new Error(
                            "no se pudo crear la cuenta"
                        )
            };

        }

    }


    /* =====================================================
       ENTRAR DESDE CUALQUIER DISPOSITIVO

       @USERNAME + CONTRASEÑA
    ===================================================== */

    async function login(
        rawUsername,
        rawPassword
    ) {

        if (!window.db) {

            return {
                data:
                    null,

                error:
                    new Error(
                        "Supabase no está disponible"
                    )
            };

        }


        const username =
            normalizeUsername(
                rawUsername
            );


        const usernameError =
            validateUsername(
                username
            );


        if (usernameError) {

            return {
                data:
                    null,

                error:
                    usernameError
            };

        }


        const password =
            String(
                rawPassword || ""
            );


        if (!password) {

            return {
                data:
                    null,

                error:
                    new Error(
                        "escribe tu contraseña"
                    )
            };

        }


        try {

            const internalEmail =
                await usernameToInternalEmail(
                    username
                );


            const {
                data:
                    authData,

                error:
                    authError
            } =
                await window.db.auth
                    .signInWithPassword({

                        email:
                            internalEmail,

                        password:
                            password

                    });


            if (authError) {

                return {
                    data:
                        null,

                    error:
                        new Error(
                            "usuario o contraseña incorrectos"
                        )
                };

            }


            const user =
                authData?.user ||
                null;


            if (!user) {

                return {
                    data:
                        null,

                    error:
                        new Error(
                            "no se pudo iniciar sesión"
                        )
                };

            }


            currentUser =
                user;


            let profile =
                await loadProfileForUser(
                    user
                );


            /*
               Si por cualquier razón existe
               la cuenta de Auth pero falta
               el perfil, lo reconstruimos.
            */

            if (!profile) {

                const result =
                    await createProfileForUser(
                        user,
                        username
                    );


                if (result.error) {

                    return result;

                }


                profile =
                    result.data;

            }


            currentProfile =
                profile;


            dispatchUserReady();


            return {
                data:
                    currentProfile,

                error:
                    null
            };

        }
        catch (error) {

            console.error(
                "Error entrando:",
                error
            );


            return {
                data:
                    null,

                error:
                    error instanceof Error
                        ? error
                        : new Error(
                            "no se pudo iniciar sesión"
                        )
            };

        }

    }


    /* =====================================================
       CERRAR SESIÓN EN ESTE DISPOSITIVO
    ===================================================== */

    async function logout() {

        if (!window.db) {
            return;
        }


        const {
            error
        } =
            await window.db.auth
                .signOut({
                    scope:
                        "local"
                });


        if (error) {

            console.error(
                "Error cerrando sesión:",
                error
            );

            return;

        }


        currentUser =
            null;

        currentProfile =
            null;


        dispatchUserReady();

    }


    /* =====================================================
       CREAR PERFIL

       Se mantiene por compatibilidad
       con otras partes de la web.

       Ya NO crea usuarios anónimos.
    ===================================================== */

    async function createProfile(
        rawUsername
    ) {

        const username =
            normalizeUsername(
                rawUsername
            );


        const usernameError =
            validateUsername(
                username
            );


        if (usernameError) {

            return {
                data:
                    null,

                error:
                    usernameError
            };

        }


        const user =
            await getCurrentUser();


        if (!user) {

            return {
                data:
                    null,

                error:
                    new Error(
                        "primero crea tu cuenta o entra con tu contraseña"
                    )
            };

        }


        return await createProfileForUser(
            user,
            username
        );

    }


    /* =====================================================
       INICIALIZACIÓN
    ===================================================== */

    async function init() {

        const user =
            await getCurrentUser();


        if (user) {

            await loadProfileForUser(
                user
            );

        }


        console.log(
            "Usuario Desorden:",
            currentProfile
                ? `@${currentProfile.username}`
                : "sin sesión"
        );


        dispatchUserReady();

    }


    /* =====================================================
       API PARA TODA LA WEB
    ===================================================== */

    window.DesordenUser = {

        init,

        register,

        login,

        logout,

        getCurrentUser,

        getProfile,

        createProfile,

        normalizeUsername,

        get user() {
            return currentUser;
        },

        get profile() {
            return currentProfile;
        }

    };


    init();

})();