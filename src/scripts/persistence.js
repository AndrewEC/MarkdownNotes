class Persistence {

    #appState = null;
    #utils = null;
    #editor = null;

    constructor(appState, editor, utils) {
        this.#appState = appState;
        this.#editor = editor;
        this.#utils = utils;
    }

    save() {
        this.#appState.hasUnsavedChanges = false;

        this.#editor.removeEditor();

        const stateContainer = this.#utils.getElement(Constants.Ids.stateContainer);
        stateContainer.innerText = JSON.stringify(this.#appState.getSerializableState());

        // Prepend the DOCTYPE declaration since it's not part of the outerHTML property.
        const documentString = `<!DOCTYPE html>${document.documentElement.outerHTML}`;
        const blob = new Blob([documentString], { type: 'text' });

        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${this.#appState.title}.html`;
        link.click();
        URL.revokeObjectURL(objectUrl);
    }

    rehydrateState() {
        let nextState = null;
        try {
            const stateContainer = this.#utils.getElement(Constants.Ids.stateContainer);
            nextState = JSON.parse(stateContainer.innerText);
        } catch (error) {
            alert('Previous save data could not be loaded. It may be corrupt or incompatible with this version of MarkdownNotes.');
        }

        this.validateState(nextState);

        this.#appState.hydrate(nextState);
    }

    #getVersion(state) {
        if (!state || !state.version || typeof state.version !== 'string') {
            state.version = Constants.Versions.Save.Current;
        }
        return state.version;
    }

    validateState(state) {
        try {
            const version = this.#getVersion(state);
            if (version === Constants.Versions.Save.v1) {
                this.#validateStateV1(state);
            } else {
                throw new Error(`Data contains an invalid version of: ${version}`);
            }
            return true;
        } catch (error) {
            alert(error);
            return false
        }
    }

    #validateStateV1(state) {
        if (!state) {
            throw new Error("Data was null or undefined.");
        }

        // Validate pages array.
        if (!this.#isNonEmptyArray(state.pages)) {
            throw new Error("Invalid pages value. Pages must be an array with at least one element.");
        }
        for (let i = 0; i < state.pages.length; i++) {
            const page = state.pages[i];
            if (!this.#isNonEmptyString(page.slug)) {
                throw new Error(`Invalid pages value. Page at index [${i}] has an empty or non-string slug property.`);
            } else if (!this.#isNonEmptyString(page.title)) {
                throw new Error(`Invalid pages value. Page at index [${i}] has an empty or non-string title property.`);
            } else if (!this.#isString(page.contents)) {
                throw new Error(`Invalid pages value. Page at index [${i}] has an empty or non-string contents property.`);
            } else if (this.#isReservedPageTitle(page.title)) {
                throw new Error(`Invalid pages value. Page at index [${i}] has a title that is reserved and can't be used.`);
            }
        }
        if (!this.#areAllUnique(state.pages.map(page => page.title))) {
            throw new Error('Invalid pages value. All pages must have a unique title.');
        } else if (!this.#areAllUnique(state.pages.map(page => page.slug))) {
            throw new Error('Invalid pages value. All pages must have a unique slug.');
        }
        
        // Validate images array.
        if (!this.#isArray(state.images)) {
            throw new Error("Invalid images value. Images must be an array.");
        }
        for (let i = 0; i < state.images.length; i++) {
            const image = state.images[i];
            if (!this.#isNonEmptyString(image.name)) {
                throw new Error(`Invalid image value. Image at index [${i}] has an empty or non-string name property.`);
            } else if (!this.#isNonEmptyString(image.data)) {
                throw new Error(`Invalid image value. Image at index [${i}] has an empty or non-string data property.`);
            }
        }
        if (!this.#areAllUnique(state.images.map(image => image.name))) {
            throw new Error('Invalid images. All image must have a unique name.');
        }
        
        // Validate order array.
        if (!this.#isNonEmptyArray(state.order)) {
            throw new Error("Invalid order value. Order must be an array with at least one element.");
        }
        for (let i = 0; i < state.order.length; i++) {
            const slug = state.order[i];
            if (!this.#isNonEmptyString(slug)) {
                throw new Error(`Invalid order value. Order at index [${i}] must be a non-empty string.`);
            }

            const matchingPage = state.pages.find(page => page.slug === slug);
            if (!matchingPage) {
                throw new Error(`Invalid order value. Order at index [${i}] does match the slug of any known page.`);
            }
        }
    }

    #isReservedPageTitle(pageTitle) {
        return Constants.reservedPageTitles.includes(pageTitle);
    }

    #areAllUnique(values){
        return [...new Set(values)].length === values.length;
    }

    #isString(value) {
        return typeof value === 'string'
    }

    #isNonEmptyString(value) {
        return this.#isString(value) && value.trim() !== ''
    }
    
    #isArray(value){
        return value && Array.isArray(value)
    }

    #isNonEmptyArray(value) {
        return this.#isArray(value) && value.length > 0
    }
}