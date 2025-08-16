class Visibility {

    #utils = null;
    #visibilityMappings = null;

    constructor(utils) {
        this.#utils = utils;

        this.#visibilityMappings = new Map();
        this.#visibilityMappings.set(
            Constants.VisibilityOptions.revealEditor,
            Constants.Ids.Fragments.Editor.root
        );
        this.#visibilityMappings.set(
            Constants.VisibilityOptions.revealPreview,
            Constants.Ids.Fragments.Preview.root
        );
        this.#visibilityMappings.set(
            Constants.VisibilityOptions.revealSettings,
            Constants.Ids.Fragments.Settings.root
        );
        this.#visibilityMappings.set(
            Constants.VisibilityOptions.revealImages,
            Constants.Ids.Fragments.Images.root
        );
        this.#visibilityMappings.set(
            Constants.VisibilityOptions.revealSearch,
            Constants.Ids.Fragments.Search.root
        );
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

    showSearch() {
        this.#toggle(Constants.VisibilityOptions.revealSearch);
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
        [...this.#visibilityMappings.values()]
            .map(id => this.#utils.getElement(id))
            .forEach(element => element.style.display = Constants.Display.none);

        if (revealOption === Constants.VisibilityOptions.revealEditor) {
            this.#utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = true;
        } else {
            this.#utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = false;
        }

        const idOfElementToReveal = this.#visibilityMappings.get(revealOption);
        this.#utils.getElement(idOfElementToReveal).style.display = Constants.Display.block;
    }
}