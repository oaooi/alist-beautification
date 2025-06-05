(function () {
    const wrapHistoryMethod = (type) => {
        const orig = history[type];
        return function (...args) {
            const rv = orig.apply(this, args);
            const event = new CustomEvent(type, { detail: args });
            window.dispatchEvent(event);
            return rv;
        };
    };
    history.pushState = wrapHistoryMethod('pushState');
    history.replaceState = wrapHistoryMethod('replaceState');
})();

class Beautifier {
    static themeColor = 'rgb(240, 128, 128)';
    static lightBgColor = 'rgba(255, 255, 255, 0.8)';
    static darkBgColor = 'rgb(32, 36, 37)';

    static lightSelector = '.hope-ui-light :not(.hope-tooltip):not(.hope-close-button):not(a)';
    static darkSelector = '.hope-ui-dark :not(.hope-tooltip):not(.hope-close-button):not(a)';
    static ignoredColors = [
        'rgba(0, 0, 0, 0)',
        'rgba(0, 0, 0, 0.65)',
        'rgba(0, 0, 0, 0.09)'
    ];


    constructor(themeColor = Beautifier.themeColor, lightBgColor = Beautifier.lightBgColor, darkBgColor = Beautifier.darkBgColor) {
        this.themeColor = themeColor;
        this.lightBgColor = lightBgColor;
        this.darkBgColor = darkBgColor;

        this.ignoredColors = [...Beautifier.ignoredColors, this.themeColor];

        this.observer = null;
    }


    /**
     * @param {'light'|'dark'} theme
     */
    #rewriteBgColor(theme) {
        let selector = theme === 'light' ? Beautifier.lightSelector : Beautifier.darkSelector;
        let bgColor = theme === 'light' ? this.lightBgColor : this.darkBgColor;

        document.querySelectorAll(selector).forEach(element => {
            const computedStyle = getComputedStyle(element);

            if (computedStyle.backgroundImage !== 'none') {
                return;
            }

            if (!this.ignoredColors.includes(computedStyle.backgroundColor)) {
                element.style.backgroundColor = bgColor;
                element.dataset.beautified = 'true';
            }
        });
    }

    #beautify() {
        if (!location.pathname.startsWith('/@manage') && !location.pathname.startsWith('/@login')) {
            this.#rewriteBgColor('light');
            this.#rewriteBgColor('dark');
        }
    }

    observe() {
        this.observer = new MutationObserver(this.#beautify.bind(this));
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        this.#beautify();
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    undo() {
        document.querySelectorAll('.hope-ui-light, .hope-ui-dark').forEach(element => {
            if (element.dataset.beautified) {
                element.style.backgroundColor = '';
                delete element.dataset.beautified;
            }
        });

        this.disconnect();
    }
}

const beautifier = new Beautifier();
beautifier.observe();

function fixLogin(pathname) {
    if (pathname.startsWith('/@login')) {
        beautifier.undo();
    }
    else {
        beautifier.disconnect();
        beautifier.observe();
    }
}

['popstate', 'pushState', 'replaceState'].forEach(eventType => {
    addEventListener(eventType, () => {
        fixLogin(location.pathname);
    });
});