class Utils {

    state = null;

    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Could not find element on page with ID of ${id}`);
        }
        return element;
    }

    registerButtonClicks(definitions) {
        for (let i = 0; i < definitions.length; i++) {
            const definition = definitions[i];
            this.getElement(definition.id).onclick = () => definition.callback();
        }
    }

    resize() {
        const height = `${window.innerHeight - 10}px`;

        this.#getElementsAndApply([
            Constants.Ids.Fragments.Navigation.root,
            Constants.Ids.Fragments.Preview.root,
            Constants.Ids.Fragments.Editor.root,
            Constants.Ids.Fragments.Settings.root,
            Constants.Ids.Fragments.Images.root
        ], (element) => element.style.height = height);
    }

    beforeUnload() {
        if (this.state.hasAnyUnsavedChange()) {
            return 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    updateQuery(pageTitle) {
        history.pushState(null, '', `?page=${encodeURIComponent(pageTitle)}`);
    }

    #getElementsAndApply(ids, consumer) {
        const elements = ids.map(id => this.getElement(id));
        for (let i = 0; i < elements.length; i++) {
            consumer(elements[i]);
        }
    }
}

class Visibility {

    #utils = null;

    constructor(utils) {
        this.#utils = utils;
    }

    showPreview() {
        this.#toggle(Constants.VisibilityOptions.revealPreview);
    }

    showSettings() {
        this.#toggle(Constants.VisibilityOptions.revealSettings)
    }

    showImages() {
        this.#toggle(Constants.VisibilityOptions.revealImages)
    }

    showEditor() {
        this.#toggle(Constants.VisibilityOptions.revealEditor);
    }

    isSettingsPageVisible() {
        return this.#isVisible(Constants.Ids.Fragments.Settings.root);
    }

    isImagesPageVisible() {
        return this.#isVisible(Constants.Ids.Fragments.Images.root);
    }

    #isVisible(elementId) {
        const element = this.#utils.getElement(elementId);
        return element.style.display !== Constants.Display.none;
    }

    #toggle(revealOption) {
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
    }
}