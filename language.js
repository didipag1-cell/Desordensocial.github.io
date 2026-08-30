(() => {
    function initializeLanguageSwitcher() {
        const languageButtons =
            document.querySelectorAll(".lang-button");

        function applyLanguage(language) {
            document.documentElement.lang = language;

            /*
             * Textos normales:
             * data-es="..."
             * data-en="..."
             */
            document
                .querySelectorAll("[data-es][data-en]")
                .forEach((element) => {
                    const translatedText =
                        language === "en"
                            ? element.getAttribute("data-en")
                            : element.getAttribute("data-es");

                    if (translatedText !== null) {
                        element.textContent = translatedText;
                    }
                });

            /*
             * Imágenes o SVG diferentes
             * para cada idioma.
             */
            document
                .querySelectorAll("[data-src-es][data-src-en]")
                .forEach((image) => {
                    const translatedSource =
                        language === "en"
                            ? image.getAttribute("data-src-en")
                            : image.getAttribute("data-src-es");

                    const translatedAlt =
                        language === "en"
                            ? image.getAttribute("data-alt-en")
                            : image.getAttribute("data-alt-es");

                    if (translatedSource) {
                        image.setAttribute(
                            "src",
                            translatedSource
                        );
                    }

                    if (translatedAlt) {
                        image.setAttribute(
                            "alt",
                            translatedAlt
                        );
                    }
                });

            /*
             * Títulos que aparecen al pasar
             * por los iconos de la home.
             */
            document
                .querySelectorAll(".project-link")
                .forEach((link) => {
                    const translatedLabel =
                        language === "en"
                            ? link.getAttribute("data-label-en")
                            : link.getAttribute("data-label-es");

                    const translatedAria =
                        language === "en"
                            ? link.getAttribute("data-aria-en")
                            : link.getAttribute("data-aria-es");

                    if (translatedLabel) {
                        link.setAttribute(
                            "data-label",
                            translatedLabel
                        );
                    }

                    if (translatedAria) {
                        link.setAttribute(
                            "aria-label",
                            translatedAria
                        );
                    }
                });

            /*
             * Marca visualmente el idioma activo.
             */
            languageButtons.forEach((button) => {
                button.classList.toggle(
                    "active",
                    button.dataset.lang === language
                );
            });

            localStorage.setItem(
                "desorden-language",
                language
            );
        }

        languageButtons.forEach((button) => {
            button.addEventListener("click", () => {
                applyLanguage(button.dataset.lang);
            });
        });

        const savedLanguage =
            localStorage.getItem("desorden-language") || "es";

        applyLanguage(savedLanguage);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeLanguageSwitcher
        );
    } else {
        initializeLanguageSwitcher();
    }
})();