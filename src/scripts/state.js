const Constants = {
    currentVersion: '0.0.1',
    Ids: {
        rootContainer: 'root-container',
        Fragments: {
            Preview: {
                root: 'fragment-preview',
                viewContainer: 'fragment-preview-view-container',
                buttonEdit: 'fragment-preview-button-edit',
                buttonDelete: 'fragment-preview-button-delete'
            },
            Editor: {
                root: 'fragment-editor',
                inputTitle: 'fragment-editor-input-title',
                area: 'fragment-editor-area',
                buttonUpdate: 'fragment-editor-button-update',
                buttonCancel: 'fragment-editor-button-cancel',
                selectParent: 'fragment-editor-select-parent'
            },
            Settings: {
                root: 'fragment-settings',
                buttonSaveOrder: 'fragment-settings-save-order',
                buttonResetOrder: 'fragment-settings-reset-order',
                buttonUpdateTitle: 'fragment-settings-button-title-update',
                currentTitle: 'fragment-settings-current-title',
                orderTable: 'fragment-settings-order-table',
                dataArea: 'fragment-settings-data-area',
                buttonDataImport: 'fragment-settings-button-data-import',
                versionNumberText: 'fragment-settings-version-number'
            },
            Navigation: {
                root: 'fragment-navigation',
                listContainer: 'fragment-navigation-page-list-container',
                title: 'fragment-navigation-title',
                buttonSave: 'fragment-navigation-save',
                buttonNewPage: 'fragment-navigation-new-page',
                buttonSettings: 'fragment-navigation-settings',
                buttonImages: 'fragment-navigation-images'
            },
            Images: {
                root: 'fragment-images',
                buttonEmbed: 'fragment-images-button-embed',
                imageInput: 'fragment-images-image-input',
                imageName: 'fragment-images-name',
                imageTable: 'fragment-images-display-table'
            }
        },
        stateContainer: 'root-state-container'
    },
    LocationHashes: {
        settings: '__settings__',
        images: '__images__'
    },
    StateProperties: {
        state: '__state__',
        title: 'title',
        currentPage: 'currentPage',
        pages: 'pages',
        order: 'order',
        images: 'images'
    },
    noParentOption: 'none',
    lookupErrorClass: 'lookup-error',
    VisibilityOptions: {
        revealEditor: 'revealEditor',
        revealPreview: 'revealPreview',
        revealSettings: 'revealSettings',
        revealImages: 'revealImages'
    },
    Display: {
        none: 'none',
        block: 'block'
    },
    Prefixes: {
        embeddedImageSrc: 'image/',
        pageLink: 'page/'
    },
    Versions: {
        Current: '1',
        v1: '1'
    }
};

const defaultSlug = crypto.randomUUID();
class AppState {
    #serializableState = {
        pages: [
            {
                title: 'MarkdownNotes',
                contents: '# Welcome to MarkdownNotes!!!',
                slug: defaultSlug,
                parent: null
            }
        ],
        order: [defaultSlug],
        title: 'MarkdownNotes',
        images: [],
        version: '1'
    };

    hasUnsavedChanges = false;
    #currentPage = this.#serializableState.pages[0];
    #onChangeCallbacks = [];

    #invokePropertyChangedCallbacks(propertyName) {
        for (let i = 0; i < this.#onChangeCallbacks.length; i++) {
            this.#onChangeCallbacks[i](propertyName);
        }
    };

    addPropertyChangedListener(callback) {
        this.#onChangeCallbacks.push(callback);
    };

    hydrate(nextState) {
        this.#serializableState = nextState;
        this.#currentPage = this.getFirstPage();
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.state);
    };

    getFirstPage() {
        const firstPageSlug = this.#serializableState.order[0];
        return this.#serializableState.pages.find(page => page.slug === firstPageSlug);
    };

    getSerializableState() {
        return this.#serializableState;
    };

    set title(newTitle) {
        this.#serializableState.title = newTitle;
        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.title);
    };

    get title() {
        return this.#serializableState.title;
    };

    set currentPage(nextPage) {
        this.#currentPage = nextPage;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.currentPage);
    };

    get currentPage() {
        return this.#currentPage;
    };

    get pages() {
        return this.#serializableState.pages;
    };

    set pages(nextPages) {
        this.#serializableState.pages = nextPages;
        this.#serializableState.order = this.#serializableState.order
            .filter(o => nextPages.find(page => page.slug === o));

        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.pages);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);
    }

    get images() {
        return this.#serializableState.images;
    }

    get order() {
        return this.#serializableState.order;
    };

    set order(nextOrder) {
        this.#serializableState.order = nextOrder;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);        
    };

    addImage(image) {
        this.#serializableState.images.push(image);
        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.images)
    };

    deleteImage(imageName) {
        this.#serializableState.images = this.#serializableState.images.filter(image => image.name !== imageName);
        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.images);
    };

    setImage(index, image) {
        this.#serializableState.images[index] = image;
        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.images);
    };

    deletePage(pageTitle) {
        const pageIndex = this.#serializableState.pages.findIndex(page => page.title === pageTitle);
        const pageToDelete = this.#serializableState.pages[pageIndex];

        this.#serializableState.order = this.#serializableState.order(order => order !== pageToDelete.slug);
        this.#serializableState.pages.splice(pageIndex, 1);

        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.pages);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);
    };

    addPage(page) {
        this.#serializableState.pages.push(page);
        this.#serializableState.order.push(page.slug);

        this.hasUnsavedChanges = true;

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.pages);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);

        window.location.hash = `#${page.title}`;
    };

    setPage(title, page) {
        const index = this.#serializableState.pages.findIndex(page => page.title === title);
        this.#serializableState.pages[index] = page;

        this.hasUnsavedChanges = true;

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.pages);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.currentPage);

        window.location.hash = `#${page.title}`;
    };
};