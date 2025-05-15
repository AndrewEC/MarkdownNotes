class Editor {

    #instance = null;
    #creatingNewPage = false;

    #appState = null;
    #visibility = null;
    #utils = null;

    constructor(appState, visibility, utils) {
        this.#appState = appState;
        this.#visibility = visibility;
        this.#utils = utils;
        this.#appState.addPropertyChangedListener(this.#onPropertyChanged.bind(this));
        this.#registerButtonClickEvents();
    }

    #onPropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.currentPage) {
            this.editPage(this.#appState.currentPage);
        }
    };

    #registerButtonClickEvents() {
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Preview.buttonEdit,
                callback: this.editCurrentPage.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonNewPage,
                callback: this.editPage.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Editor.buttonUpdate,
                callback: this.updatePage.bind(this)
            }
        ]);
    };

    editCurrentPage() {
        this.editPage(this.#appState.currentPage);
    }

    removeEditor() {
        this.#instance = null;

        const editorContainer = document.getElementsByClassName('EasyMDEContainer');
        if (editorContainer.length > 0) {
            editorContainer[0].remove();
        }
    };

    getEditorValue() {
        if (!this.isInitialized()) {
            return null;
        }
        return this.#instance.value();
    };

    getTitleValue() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value.trim();
    };

    #setTitleValue(value) {
        this.#utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value = value;
    };

    isInitialized() {
        return this.#instance && this.#instance !== null;
    };

    isShowingEditor() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.root).style.display.toLowerCase()
            !== Constants.Display.none;
    }
    
    #doesPageTitleExist(title, currentPageSlug) {
        const pages = this.#appState.pages;
        if (!currentPageSlug) {
            return pages.find(page => page.title === title) !== undefined;
        }
        return pages.find(page => page.title === title && page.slug !== currentPageSlug)
            !== undefined;
    };
    
    editPage(page) {
        this.#visibility.toggle(Constants.VisibilityOptions.revealEditor);
        this.#populateParentPageSelect(page);

        if (!this.isInitialized()) {
            this.#instance = new EasyMDE({
                element: this.#utils.getElement(Constants.Ids.Fragments.Editor.area),
                autoDownloadFontAwesome: false,
                spellChecker: false
            });
        }

        if (page) {
            this.#creatingNewPage = false;
            this.#instance.value(page.contents);
            this.#setTitleValue(page.title);
        } else {
            this.#creatingNewPage = true;
            this.#instance.value('');
            this.#setTitleValue('New Page');
        }
    };

    // Checks to see if the "first" page is a parent of the
    // "second" page.
    #isParentOf(first, second) {
        let nextPage = second.parent;
        while (nextPage) {
            if (nextPage === first.slug) {
                return true;
            }
            nextPage = nextPage.parent;
        }
        return false;
    };

    #populateParentPageSelect(page) {
        // Populates a dropdown that allows the user to select
        // a page to be a parent of this page.

        const select = this.#utils.getElement(Constants.Ids.Fragments.Editor.selectParent);
        select.innerHTML = '';

        const defaultNone = document.createElement('option');
        defaultNone.setAttribute('value', Constants.noParentOption);
        defaultNone.text = 'None';
        select.appendChild(defaultNone);

        const order = this.#appState.order;
        for (let i = 0; i < order.length; i++) {
            const otherPage = this.#utils.getPage(order[i]);
            if (page && (otherPage.slug === page.slug || this.#isParentOf(page, otherPage))) {
                continue;
            }

            const option = document.createElement('option');
            option.setAttribute('value', otherPage.slug);
            option.innerText = otherPage.title;
            if (page && page.parent === otherPage.slug) {
                option.setAttribute('selected', '');
            }
            select.appendChild(option);
        }
    };

    #getSelectedParent() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.selectParent).value;
    }

    updatePage() {
        if (this.#creatingNewPage) {
            const newPageTitle = this.getTitleValue();
            if (this.#doesPageTitleExist(newPageTitle)) {
                return alert('A page with this title already exists. Ensure that all page titles are unique.');
            }

            // Make sure to not reference the current page in this
            // as the current page doesn't reference the page being added.
            const newPage = {
                title: newPageTitle,
                contents: this.#instance.value(),
                slug: crypto.randomUUID(),
                parent: null
            }

            const parent = this.#getSelectedParent();
            if (parent !== Constants.noParentOption) {
                newPage.parent = parent;
            }

            this.#appState.addPage(newPage);
        } else {
            const currentPage = this.#appState.currentPage;
            const currentPageTitle = currentPage.title;

            const nextPageTitle = this.getTitleValue();
            if (this.#doesPageTitleExist(nextPageTitle, currentPage.slug)) {
                return alert('A page with this title already exists. Ensure that all page titles are unique.');
            }

            currentPage.contents = this.#instance.value();
            currentPage.title = nextPageTitle;

            const parent = this.#getSelectedParent();
            if (parent !== Constants.noParentOption) {
                currentPage.parent = parent;
            } else {
                currentPage.parent = null;
            }

            this.#appState.setPage(currentPageTitle, currentPage);
        }
    }
};