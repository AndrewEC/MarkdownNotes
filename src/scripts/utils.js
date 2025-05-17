class Utils {

    editor = null;
    state = null;

    getPage(slug) {
        return this.state.pages.find(page => page.slug === slug)
    };

    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Could not find element on page with ID of ${id}`);
        }
        return element;
    };

    registerButtonClicks(definitions) {
        for (let i = 0; i < definitions.length; i++) {
            const definition = definitions[i];
            this.getElement(definition.id).onclick = () => definition.callback();
        }
    };

    resize() {
        const height = `${window.innerHeight - 10}px`;
        this.getElement(Constants.Ids.Fragments.Navigation.root).style.height = height;
        this.getElement(Constants.Ids.Fragments.Preview.root).style.height = height;
        this.getElement(Constants.Ids.Fragments.Editor.root).style.height = height;
        this.getElement(Constants.Ids.Fragments.Settings.root).style.height = height;
        this.getElement(Constants.Ids.Fragments.Images.root).style.height = height;
    };

    beforeUnload() {
        if (this.state.hasAnyUnsavedChange()) {
            return 'You have unsaved changes. Are you sure you want to leave?';
        }
    };

    updateQuery(pageTitle) {
        history.pushState(null, '', `?page=${pageTitle}`);
    };
};

class Visibility {

    #utils = null;

    constructor(utils) {
        this.#utils = utils;
    }

    showPreview() {
        this.toggle(Constants.VisibilityOptions.revealPreview);
    };

    showSettings() {
        this.toggle(Constants.VisibilityOptions.revealSettings)
    };

    showImages() {
        this.toggle(Constants.VisibilityOptions.revealImages)
    };

    toggle(revealOption) {
        const fragmentEditor = this.#utils.getElement(Constants.Ids.Fragments.Editor.root);
        const fragmentPreview = this.#utils.getElement(Constants.Ids.Fragments.Preview.root);
        const fragmentSettings = this.#utils.getElement(Constants.Ids.Fragments.Settings.root);
        const fragmentImages = this.#utils.getElement(Constants.Ids.Fragments.Images.root);

        if (revealOption === Constants.VisibilityOptions.revealEditor) {
            this.#utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = true;
        } else {
            this.#utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = false;
        }

        fragmentEditor.style.display = Constants.Display.none;
        fragmentPreview.style.display = Constants.Display.none;
        fragmentSettings.style.display = Constants.Display.none;
        fragmentImages.style.display = Constants.Display.none;

        if (revealOption === Constants.VisibilityOptions.revealEditor) {
            fragmentEditor.style.display = Constants.Display.block;
        } else if (revealOption === Constants.VisibilityOptions.revealPreview) {
            fragmentPreview.style.display = Constants.Display.block;
        } else if (revealOption === Constants.VisibilityOptions.revealSettings) {
            fragmentSettings.style.display = Constants.Display.block;
        } else if (revealOption === Constants.VisibilityOptions.revealImages) {
            fragmentImages.style.display = Constants.Display.block;
        }
    };
};