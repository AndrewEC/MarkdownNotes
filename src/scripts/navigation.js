class Navigation {

    #logger = new Logger('Navigation');

    #appState = null;
    #utils = null;
    #visibility = null;

    constructor(appState, utils, visibility) {
        this.#appState = appState;
        this.#utils = utils;
        this.#visibility = visibility;

        this.#appState.addPropertyChangedListener(this.#onStatePropertyChanged.bind(this));
        this.#registerButtonClickEvents();
        this.#listenForUrlChanges();
    }

    onKeyPressed(e) {
        if (e.keyCode === Constants.KeyCodes.n && e.ctrlKey) {
            if (!this.#appState.isEditing) {
                this.#createNewPage();
                return true;
            }
        }

        return false;
    }

    #registerButtonClickEvents() {
        const thisRef = this;
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Navigation.buttonSettings,
                callback: () => thisRef.#utils.updateQuery(Constants.LocationHashes.settings)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonNewPage,
                callback: this.#createNewPage.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonImages,
                callback: () => thisRef.#utils.updateQuery(Constants.LocationHashes.images)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonSearch,
                callback: () => thisRef.#appState.isFinding = true
            }
        ]);
    }

    #onStatePropertyChanged(propertyName) {
        switch (propertyName) {
            case Constants.StateProperties.title:
            case Constants.StateProperties.currentPage:
            case Constants.StateProperties.hasUnsavedChanges:
                this.#updateTitle();
                break;
            case Constants.StateProperties.state:
                this.#rehydrate();
                break;
            case Constants.StateProperties.pages:
            case Constants.StateProperties.order:
                this.#updateNavList();
                break;
            case Constants.StateProperties.autoSavedChanges:
                this.#updateTitle();
                this.#updateNavList();
                break;
        }
    }

    #createNewPage() {
        let newPageTitle = prompt('New Page Title:');
        if (!newPageTitle) {
            return;
        }

        newPageTitle = newPageTitle.trim();
        if (!newPageTitle) {
            return;
        }

        if (this.#appState.doesPageTitleExist(newPageTitle)) {
            return alert('A page with that title already exists. Page titles must be unique.');
        } else if (Constants.reservedPageTitles.includes(newPageTitle)) {
            return alert('The page title provided is a reserved value and cannot be used.')
        }

        const pageSlug = crypto.randomUUID();
        this.#logger.log(`Creating new page with title [${newPageTitle}] and slug [${pageSlug}].`);

        const newPage = {
            title: newPageTitle,
            contents: '',
            slug: pageSlug,
            parent: null
        };

        this.#appState.addPage(newPage);
        this.#utils.updateQuery(newPage.title);
    }

    #showSettings() {
        this.#logger.log('Navigating to settings.');
        this.#visibility.showSettings();
        document.title = `${this.#appState.title} | Settings`;
    }

    #showImages() {
        this.#logger.log('Navigating to images.');
        this.#visibility.showImages();
        document.title = `${this.#appState.title} | Images`;
    }

    #showSearch() {
        this.#logger.log('Navigating to search results.');
        this.#visibility.showSearch();
        document.title = `${this.#appState.title} | Search Results`;
    }

    #rehydrate() {
        this.#updateNavList();
        this.#updateTitle(this.#appState.title);
    }

    #updateNavList() {
        // The nav list is the list of pages that appears on the bottom left-hand side of the page.
        const navContainer = this.#utils.getElement(Constants.Ids.Fragments.Navigation.listContainer);

        const pagesWithoutParents = this.#appState.getPagesInOrder()
            .filter(page => page.parent === null);

        const list = this.#buildNavListUlElement(pagesWithoutParents);

        navContainer.innerHTML = '';
        navContainer.appendChild(list);
    }

    #buildNavListUlElement(pages) {
        const list = document.createElement('ul');

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            const item = document.createElement('li');
            item.appendChild(this.#buildLink(page));

            const children = this.#getImmediateChildren(page);
            if (children.length > 0) {
                item.appendChild(this.#buildNavListUlElement(children));
            }

            list.append(item);
        }

        return list;
    }

    #getImmediateChildren(parent) {
        // Gets the pages that are direct children of the input parent page.
        return this.#appState.getPagesInOrder()
            .filter(page => page.parent === parent.slug);
    }

    #buildLink(page) {
        let prefix = '';
        if (this.#appState.doesPageHaveUnsavedChange(page.slug)) {
            prefix = '* ';
        }

        const link = document.createElement('a');
        link.href = `javascript:void(0);`;
        link.innerText = `${prefix}${page.title}`;
        const thisRef = this;
        link.onclick = () => thisRef.#utils.updateQuery(page.title);
        return link;
    }

    /**
     * Updates the title element that is located near the top left-hand side of
     * the page to the current notebook title registered in the global app state.
     * 
     * The title in this instance is not the title of a particular page but
     * rather the title of the entire notebook.
     */
    #updateTitle() {
        let prefix = '';
        if (this.#appState.hasAnyUnsavedChange()) {
            prefix = '* ';
        }

        const notebookTitle = `${prefix}${this.#appState.title}`;
        
        this.#utils.getElement(Constants.Ids.Fragments.Navigation.title)
            .innerText = notebookTitle;
        
        const pageTitle = this.#appState.currentPage.title;
        document.title = `${notebookTitle} | ${pageTitle}`;
    }

    #navigateTo(pageTitle) {
        pageTitle = decodeURIComponent(pageTitle);
        this.#logger.log(`Navigating to page with title: [${pageTitle}]`);
        const nextPage = this.#appState.pages.find(page => page.title === pageTitle);
        if (!nextPage) {
            this.#logger.log(`Page with matching title could not be found. Defaulting to first page.`);
            this.#appState.currentPage = this.#appState.getFirstPage();
            return;
        }
        this.#appState.currentPage = nextPage;
    }

    #listenForUrlChanges() {
        const thisRef = this;
        let currentUrl = '';
        setInterval(() => {
            const nextUrl = window.location.href;
            if (nextUrl === currentUrl) {
                return;
            }
            currentUrl = nextUrl;
            thisRef.#logger.log(`URL changed to: [${nextUrl}].`);

            let pageTitle = '';
            if (window.location.search) {
                const page = new URLSearchParams(window.location.search).get('page');
                if (page) {
                    pageTitle = decodeURIComponent(page);
                }
            }

            thisRef.#logger.log(`URL contains page title of: [${pageTitle}].`);

            switch (pageTitle) {
                case Constants.LocationHashes.settings:
                    thisRef.#showSettings();
                    break;
                case Constants.LocationHashes.images:
                    thisRef.#showImages();
                    break;
                case Constants.LocationHashes.search:
                    thisRef.#showSearch();
                    break;
                default:
                    thisRef.#navigateTo(pageTitle);
                    break;
            }
        }, 100);
    }
}