class Utils {

    #state = null;

    constructor(state) {
        this.#state = state;
    }

    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Could not find element on page with ID of: [${id}]`);
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
        if (this.#state.hasAnyUnsavedChange()) {
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