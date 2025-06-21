class Editor {

    #easyMdeInstance = null;

    #appState = null;
    #visibility = null;
    #utils = null;
    #lastAutosaveCheckTime = null;

    constructor(appState, visibility, utils) {
        this.#appState = appState;
        this.#visibility = visibility;
        this.#utils = utils;
        this.#registerButtonClickEvents();
        this.#startPageEditListener();
    }

    #startPageEditListener() {
        // Periodically check if a page is being edited and if there are
        // changes that have been made to the page that have not yet
        // been saved.

        const thisRef = this;
        setInterval(() => {
            if (thisRef.#isInitialized() && thisRef.isShowingEditor()) {

                const currentTime = Date.now();
                const diff = currentTime - thisRef.#lastAutosaveCheckTime;
                if (diff < 1_000) {
                    return;
                }
                thisRef.#lastAutosaveCheckTime = currentTime;

                const savedContent = thisRef.#appState.currentPage.contents;
                const currentContent = thisRef.#easyMdeInstance.value();
                if (savedContent === currentContent) {
                    return;
                }

                let pageSlug = thisRef.#appState.currentPage.slug;
                thisRef.#appState.addAutoSaveChange(pageSlug, currentContent);
            }
        }, 1_000);
    }

    #registerButtonClickEvents() {
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Preview.buttonEdit,
                callback: this.editPage.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Editor.buttonUpdate,
                callback: this.updatePage.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Editor.buttonCancel,
                callback: this.#cancelEdit.bind(this)
            }
        ]);
    }

    #cancelEdit() {
        this.#appState.removeAutoSaveChange(this.#appState.currentPage.slug);
        this.#visibility.showPreview();
    }

    removeEditor() {
        this.#easyMdeInstance = null;

        const editorContainer = document.getElementsByClassName('EasyMDEContainer');
        if (editorContainer.length > 0) {
            editorContainer[0].remove();
        }
    }

    getEditorValue() {
        if (!this.#isInitialized()) {
            return null;
        }
        return this.#easyMdeInstance.value();
    }

    #getTitleValue() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value.trim();
    }

    #setTitleValue(value) {
        this.#utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value = value;
    }

    #isInitialized() {
        return this.#easyMdeInstance && this.#easyMdeInstance !== null;
    }

    isShowingEditor() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.root).style.display.toLowerCase()
            !== Constants.Display.none;
    }
    
    #doesPageTitleExist(title, currentPageSlug) {
        return this.#appState.pages
            .find(page => page.title === title && page.slug !== currentPageSlug)
                !== undefined;
    }
    
    editPage() {
        const page = this.#appState.currentPage;

        this.#lastAutosaveCheckTime = Date.now();

        this.#visibility.showEditor();
        this.#populateParentPageSelect(page);

        if (!this.#isInitialized()) {
            this.#easyMdeInstance = new EasyMDE({
                element: this.#utils.getElement(Constants.Ids.Fragments.Editor.area),
                autoDownloadFontAwesome: false,
                spellChecker: false
            });
        }

        // Move page focus to the text area created by EasyMDE.
        setTimeout(function() {
            const editorTextArea = document.querySelector('.CodeMirror > div:nth-child(1) > textarea:nth-child(1)');
            if (editorTextArea) {
                editorTextArea.focus();
            }
        }, 0);

        this.#setTitleValue(page.title);
        this.#easyMdeInstance.value(page.contents);

        const unsavedChanges = this.#appState.getAutoSaveChange(page.slug);
        if (unsavedChanges) {
            if (!confirm('You have unsaved changes for this page. Pickup where you leftoff?')) {
                this.#appState.removeAutoSaveChange(page.slug);
            } else {
                this.#easyMdeInstance.value(unsavedChanges.contents);
            }
        }
    }

    // Checks to see if the "first" page is a parent of the
    // "second" page.
    #isParentOf(first, second) {
        let secondParentSlug = second.parent;
        while (secondParentSlug) {
            if (secondParentSlug === first.slug) {
                return true;
            }
            secondParentSlug = secondParentSlug.parent;
        }
        return false;
    }

    #populateParentPageSelect(page) {
        // Populates a dropdown that allows the user to select
        // a page to be a parent of this page.
        // The input "page" argument can be null if the user is creating a new page.

        const select = this.#utils.getElement(Constants.Ids.Fragments.Editor.selectParent);
        select.innerHTML = '';

        const defaultNone = document.createElement('option');
        defaultNone.setAttribute('value', Constants.noParentOption);
        defaultNone.text = 'None';
        select.appendChild(defaultNone);

        const order = this.#appState.order;
        for (let i = 0; i < order.length; i++) {
            const otherPage = this.#appState.getPage(order[i]);
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
    }

    #getSelectedParent() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.selectParent).value;
    }

    updatePage() {
        const currentPage = this.#appState.currentPage;
        
        this.#appState.removeAutoSaveChange(this.#appState.currentPage.slug);

        const nextPageTitle = this.#getTitleValue();
        if (this.#doesPageTitleExist(nextPageTitle, currentPage.slug)) {
            return alert('A page with this title already exists. Ensure that all page titles are unique.');
        }

        currentPage.contents = this.#easyMdeInstance.value();
        currentPage.title = nextPageTitle;

        const parent = this.#getSelectedParent();
        if (parent !== Constants.noParentOption) {
            currentPage.parent = parent;
        } else {
            currentPage.parent = null;
        }

        this.#appState.setPage(currentPage.title, currentPage);
        this.#utils.updateQuery(currentPage.title);
    }
}