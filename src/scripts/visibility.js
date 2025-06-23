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
        const fragmentEditor = this.#utils.getElement(Constants.Ids.Fragments.Editor.root);
        const fragmentPreview = this.#utils.getElement(Constants.Ids.Fragments.Preview.root);
        const fragmentSettings = this.#utils.getElement(Constants.Ids.Fragments.Settings.root);
        const fragmentImages = this.#utils.getElement(Constants.Ids.Fragments.Images.root);
        const fragmentSearch = this.#utils.getElement(Constants.Ids.Fragments.Search.root);

        if (revealOption === Constants.VisibilityOptions.revealEditor) {
            this.#utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = true;
        } else {
            this.#utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = false;
        }

        fragmentEditor.style.display = Constants.Display.none;
        fragmentPreview.style.display = Constants.Display.none;
        fragmentSettings.style.display = Constants.Display.none;
        fragmentImages.style.display = Constants.Display.none;
        fragmentSearch.style.display = Constants.Display.none;

        if (revealOption === Constants.VisibilityOptions.revealEditor) {
            fragmentEditor.style.display = Constants.Display.block;
        } else if (revealOption === Constants.VisibilityOptions.revealPreview) {
            fragmentPreview.style.display = Constants.Display.block;
        } else if (revealOption === Constants.VisibilityOptions.revealSettings) {
            fragmentSettings.style.display = Constants.Display.block;
        } else if (revealOption === Constants.VisibilityOptions.revealImages) {
            fragmentImages.style.display = Constants.Display.block;
        } else if (revealOption === Constants.VisibilityOptions.revealSearch) {
            fragmentSearch.style.display = Constants.Display.block;
        }
    }
}