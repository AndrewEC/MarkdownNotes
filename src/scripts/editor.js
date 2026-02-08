const AUTO_SAVE_INTERVAL = 500;

class Editor {

    #logger = new Logger('Editor');

    #appState = null;
    #visibility = null;
    #utils = null;

    #easyMdeInstance = null;
    #lastAutosaveCheckTime = null;

    constructor(appState, visibility, utils) {
        this.#appState = appState;
        this.#visibility = visibility;
        this.#utils = utils;

        this.#registerButtonClickEvents();

        this.#appState.addPropertyChangedListener(this.#onPropertyChanged.bind(this));

        this.#startPageEditListener();
    }

    #onPropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.isEditing) {
            if (this.#appState.isEditing) {
                this.#editPage();
            } else {
                this.#removeEditor();
            }
        } else if (propertyName === Constants.StateProperties.queryParams) {
            if (this.#appState.isEditing) {
                this.#appState.isEditing = false;
            }
        }
    }

    onKeyPressed(e) {
        if (e.keyCode === Constants.KeyCodes.e && e.ctrlKey) {
            if (!this.#appState.isEditing && this.#isOnEditablePage()) {
                this.#logger.log('Control + E pressed. Starting editor.');
                this.#appState.isEditing = true;
            }
            return true;
        } else if (e.keyCode === Constants.KeyCodes.escape) {
            if (this.#appState.isEditing) {
                this.#logger.log('Escape pressed. Cancelling current edits.');
                this.#cancelEdit();
                return true;
            }
        } else if (e.keyCode === Constants.KeyCodes.s && e.ctrlKey) {
            if (this.#appState.isEditing) {
                this.#logger.log('Control + S pressed. Saving current edits.');
                this.#updatePage();
                return true;
            }
        }

        return false;
    }

    #isOnEditablePage() {
        return this.#appState.currentPage
            && !Constants.reservedPageTitles.includes(this.#appState.currentPage.title);
    }

    /**
     * Periodically checks if a page is being edited and if there are
     * changes that have been made to the page that have not yet
     * been saved.
     * 
     * If there are changes this will trigger an "auto save". This doesn't
     * actually save the changes to file but stores the state of the page
     * in a temporary array.
     * 
     * When the user begins editing the page the Editor fragment will check
     * to see if the page has any "auto save" changes available and will
     * optionally restore said changes to allow the user to continue editing
     * from where they left off.
     */
    #startPageEditListener() {

        this.#logger.log('Starting editor listener.');
        const thisRef = this;
        setInterval(() => {
            if (this.#easyMdeInstance && thisRef.#appState.isEditing) {

                const currentTime = Date.now();
                const diff = currentTime - thisRef.#lastAutosaveCheckTime;
                if (diff < AUTO_SAVE_INTERVAL) {
                    return;
                }
                thisRef.#lastAutosaveCheckTime = currentTime;

                const savedContent = thisRef.#appState.currentPage.contents;
                const currentContent = thisRef.#easyMdeInstance.value();
                if (savedContent === currentContent) {
                    return;
                }

                const pageSlug = thisRef.#appState.currentPage.slug;
                thisRef.#appState.addAutoSaveChange(pageSlug, currentContent);
            }
        }, AUTO_SAVE_INTERVAL);
    }

    #registerButtonClickEvents() {
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Preview.buttonEdit,
                callback: () => this.#appState.isEditing = true
            },
            {
                id: Constants.Ids.Fragments.Editor.buttonUpdate,
                callback: this.#updatePage.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Editor.buttonCancel,
                callback: this.#cancelEdit.bind(this)
            }
        ]);
    }

    #cancelEdit() {
        const currentPageSlug = this.#appState.currentPage.slug;
        this.#logger.log(`Cancelling edit of current page: [${currentPageSlug}].`);

        const unsavedChanges = this.#appState.getAutoSaveChange(currentPageSlug);
        if (unsavedChanges && !confirm('You have unsaved changes. Are you sure you want to dispose of your changes?')) {
            return;
        }

        this.#appState.removeAutoSaveChange(currentPageSlug);
        this.#visibility.showPreview();
        this.#appState.isEditing = false;
    }

    /**
     * When initializing EasyMDE it automatically injects some elements into the
     * page. If the page is repeatedly saved and reloaded EasyMDE will
     * inject duplicate elements causing the page size to grow indefinitely.
     * 
     * To prevent said issue this will remove all EasyMDE generated elements from the
     * page so it can be re-initialized from scratch each time. This should be called
     * every time the user stops editing a page.
     */
    #removeEditor() {
        this.#logger.log('Removing EasyMDE editor.');
        this.#easyMdeInstance = null;

        const editorContainer = document.getElementsByClassName('EasyMDEContainer');
        if (editorContainer.length > 0) {
            editorContainer[0].remove();
        }
    }

    #getTitleValue() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value.trim();
    }

    #setTitleValue(value) {
        this.#utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value = value;
    }
    
    #doesPageTitleExist(title, currentPageSlug) {
        return this.#appState.pages
            .find(page => page.title === title && page.slug !== currentPageSlug)
                !== undefined;
    }
    
    #editPage() {
        const page = this.#appState.currentPage;
        this.#logger.log(`Starting edit of page [${page.slug}].`);

        this.#lastAutosaveCheckTime = Date.now();

        this.#visibility.showEditor();
        this.#populateParentPageSelect(page);

        this.#easyMdeInstance = new EasyMDE({
            element: this.#utils.getElement(Constants.Ids.Fragments.Editor.area),
            autoDownloadFontAwesome: false,
            spellChecker: false
        });

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
            this.#logger.log('Found unsaved changes for current page.');
            if (!confirm('You have unsaved changes for this page. Pickup where you leftoff?')) {
                this.#appState.removeAutoSaveChange(page.slug);
            } else {
                this.#easyMdeInstance.value(unsavedChanges.contents);
            }
        }
    }

    /**
     * Checks to see if the first page is a parent of the second page.
     * 
     * @returns True if the first page is a parent of the second page otherwise false.
     */
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

    /**
     * Populates a dropdown that allows the user to select which page should
     * be a parent of the page being currently edited.
     * 
     * @param {object} pageBeingEdited The page currently being edited.
     */
    #populateParentPageSelect(pageBeingEdited) {
        const select = this.#utils.getElement(Constants.Ids.Fragments.Editor.selectParent);
        select.innerHTML = '';

        const defaultNone = document.createElement('option');
        defaultNone.setAttribute('value', Constants.noParentOption);
        defaultNone.text = 'None';
        select.appendChild(defaultNone);

        const orderedPages = this.#appState.getPagesInOrder();
        for (let i = 0; i < orderedPages.length; i++) {
            const otherPage = orderedPages[i];

            if (pageBeingEdited
                && (otherPage.slug === pageBeingEdited.slug
                    || this.#isParentOf(pageBeingEdited, otherPage))) {
                continue;
            }

            const option = document.createElement('option');
            option.setAttribute('value', otherPage.slug);
            option.innerText = otherPage.title;
            if (pageBeingEdited && pageBeingEdited.parent === otherPage.slug) {
                option.setAttribute('selected', '');
            }
            select.appendChild(option);
        }
    }

    #getSelectedParent() {
        return this.#utils.getElement(Constants.Ids.Fragments.Editor.selectParent).value;
    }

    /**
     * Saves the content of the page being currently edited back to the global
     * app state. This doesn't yet save the changes to file.
     */
    #updatePage() {
        const currentPage = this.#appState.currentPage;
        this.#logger.log(`Saving edits of current page [${currentPage.slug}].`);
        
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

        this.#appState.isEditing = false;
    }
}