const defaultSlug = crypto.randomUUID();
class AppState {
    #serializableState = {
        pages: [
            {
                title: 'Welcome',
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

    #logger = new Logger('AppState');
    #hasUnsavedChanges = false;
    #currentPage = this.#serializableState.pages[0];
    #onChangeCallbacks = [];
    #autoSavedChanges = [];
    #isEditing = false;
    #isFinding = false;

    #invokePropertyChangedCallbacks(propertyName) {
        this.#logger.log(`Invoking property change callbacks for updated property [${propertyName}].`);
        for (let i = 0; i < this.#onChangeCallbacks.length; i++) {
            this.#onChangeCallbacks[i](propertyName);
        }
    }

    addPropertyChangedListener(callback) {
        this.#onChangeCallbacks.push(callback);
    }

    hydrate(nextState) {
        this.#serializableState = nextState;

        this.#currentPage = this.getFirstPage();

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.state);
    }

    set hasUnsavedChanges(hasUnsavedChanges) {
        this.#hasUnsavedChanges = hasUnsavedChanges;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.hasUnsavedChanges);
    }

    get hasUnsavedChanges() {
        return this.#hasUnsavedChanges;
    }

    set title(newTitle) {
        this.#serializableState.title = newTitle;

        this.hasUnsavedChanges = true;

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.title);
    }

    get title() {
        return this.#serializableState.title;
    }

    set currentPage(nextPage) {
        this.#currentPage = nextPage;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.currentPage);
    }

    get currentPage() {
        return this.#currentPage;
    }

    get pages() {
        return this.#serializableState.pages;
    }

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
    }

    set order(nextOrder) {
        this.#serializableState.order = nextOrder;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);

        this.hasUnsavedChanges = true;
    }

    get isEditing() {
        return this.#isEditing;
    }

    set isEditing(isEditing) {
        if (this.#isEditing === isEditing) {
            this.#logger.log('isEditing setter invoked but no change in value found.');
            return;
        }

        this.#isEditing = isEditing;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.isEditing);
    }

    get isFinding() {
        return this.#isFinding;
    }

    set isFinding(isFinding) {
        if (this.#isFinding === isFinding) {
            this.#logger.log('isFinding setter invoked but no change in value found.');
            return;
        }

        this.#isFinding = isFinding;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.isFinding);
    }

    addImage(image) {
        this.#serializableState.images.push(image);
        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.images)
    }

    deleteImage(imageName) {
        this.#serializableState.images = this.#serializableState.images.filter(image => image.name !== imageName);
        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.images);
    }

    setImage(index, image) {
        this.#serializableState.images[index] = image;
        this.hasUnsavedChanges = true;
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.images);
    }

    addPage(page) {
        this.#serializableState.pages.push(page);
        this.#serializableState.order.push(page.slug);

        this.hasUnsavedChanges = true;

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.pages);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);
    }

    setPage(title, page) {
        const index = this.#serializableState.pages.findIndex(page => page.title === title);
        this.#serializableState.pages[index] = page;

        this.hasUnsavedChanges = true;

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.pages);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.order);
        this.#invokePropertyChangedCallbacks(Constants.StateProperties.currentPage);
    }

    doesPageTitleExist(pageTitle) {
        return this.#serializableState.pages.find(page => page.title === pageTitle) !== undefined;
    }

    addAutoSaveChange(pageSlug, content) {
        const existingSave = this.getAutoSaveChange(pageSlug);
        if (existingSave) {
            existingSave.contents = content;
            return;
        }

        this.#autoSavedChanges.push({
            slug: pageSlug,
            contents: content
        });

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.autoSavedChanges);
    }

    removeAutoSaveChange(pageSlug) {
        const existingSave = this.getAutoSaveChange(pageSlug);
        if (!existingSave) {
            return;
        }

        this.#autoSavedChanges = this.#autoSavedChanges.filter(change => change.slug !== pageSlug);

        this.#invokePropertyChangedCallbacks(Constants.StateProperties.autoSavedChanges);
    }

    getAutoSaveChange(pageSlug) {
        return this.#autoSavedChanges.find(change => change.slug === pageSlug);        
    }

    doesPageHaveUnsavedChange(pageSlug) {
        return this.getAutoSaveChange(pageSlug) !== undefined;
    }

    getFirstPage() {
        const firstPageSlug = this.order[0];
        return this.getPage(firstPageSlug);
    }

    getPagesInOrder() {
        return this.order.map(slug => this.getPage(slug));
    }

    getPage(slug) {
        return this.pages.find(page => page.slug === slug)
    }

    getSerializableState() {
        return this.#serializableState;
    }

    hasAnyUnsavedChange() {
        return this.#hasUnsavedChanges || this.#autoSavedChanges.length > 0;
    }
}