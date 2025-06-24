class Navigation {

    #appState = null;
    #utils = null;
    #visibility = null;

    constructor(appState, utils, visibility) {
        this.#appState = appState;
        this.#utils = utils;
        this.#visibility = visibility;
        this.#appState.addPropertyChangedListener(this.#onStatePropertyChanged.bind(this));
        this.#registerButtonClickEvents();
        this.#utils.getElement(Constants.Ids.Fragments.Navigation.formSearch)
            .onsubmit = this.#searchFormSubmit.bind(this);
    }

    #searchFormSubmit() {
        this.#performSearch();
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
                callback: this.createNewPage.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonImages,
                callback: () => thisRef.#utils.updateQuery(Constants.LocationHashes.images)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonSearch,
                callback: () => thisRef.#performSearch()
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

    #performSearch() {
        const searchQuery = this.#utils.getElement(Constants.Ids.Fragments.Navigation.inputSearch).value;
        if (searchQuery === '') {
            return;
        }
        this.#utils.updateQuery(
            Constants.LocationHashes.search,
            {
                'query': searchQuery
            }
        );
    }

    createNewPage() {
        let newPageTitle = prompt('New Page Title:');
        if (!newPageTitle) {
            return;
        }

        newPageTitle = newPageTitle.trim();
        if (!newPageTitle) {
            return;
        }

        if (this.#appState.doesPageTitleExist(newPageTitle)) {
            return alert('A page with that name already exists. Page names must be unique.');
        }

        const newPage = {
            title: newPageTitle,
            contents: '',
            slug: crypto.randomUUID(),
            parent: null
        };

        this.#appState.addPage(newPage);
        this.#utils.updateQuery(newPage.title);
    }

    #showSettings() {
        this.#visibility.showSettings();
        document.title = `${this.#appState.title} | Settings`;
    }

    #showImages() {
        this.#visibility.showImages();
        document.title = `${this.#appState.title} | Images`;
    }

    #showSearch() {
        this.#visibility.showSearch();
        document.title = `${this.#appState.title} | Search Results`;
    }

    #showEditor() {
        this.#visibility.showEditor();
    }

    #rehydrate() {
        this.#updateNavList();
        this.#updateTitle(this.#appState.title);
    }

    #updateNavList() {
        const navContainer = this.#utils.getElement(Constants.Ids.Fragments.Navigation.listContainer);

        const pagesWithoutParents = this.#appState.order
            .map(slug => this.#appState.pages.find(page => page.slug === slug))
            .filter(page => page.parent === null);

        const list = this.#buildNavList(pagesWithoutParents);

        navContainer.innerHTML = '';
        navContainer.appendChild(list);
    }

    #buildNavList(pages) {
        const list = document.createElement('ul');

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];

            const item = document.createElement('li');
            item.appendChild(this.#buildLink(page));

            const children = this.#getImmediateChildren(page);
            if (children.length > 0) {
                item.appendChild(this.#buildNavList(children));
            }

            list.append(item);
        }

        return list;
    }

    #getImmediateChildren(parent) {
        return this.#appState.order
            .map(slug => this.#appState.pages.find(page => page.slug === slug))
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

    #updateTitle() {
        let prefix = '';
        if (this.#appState.hasAnyUnsavedChange()) {
            prefix = '* ';
        }

        const notebookTitle = `${prefix}${this.#appState.title}`;
        
        this.#utils.getElement(Constants.Ids.Fragments.Navigation.title).innerText = notebookTitle;
        
        const pageTitle = this.#appState.currentPage.title;
        const nextTitle = `${notebookTitle} | ${pageTitle}`;
        document.title = nextTitle
    }

    #navigateTo(pageTitle) {
        pageTitle = decodeURIComponent(pageTitle);
        const nextPage = this.#appState.pages.find(page => page.title === pageTitle);
        if (!nextPage) {
            this.#appState.currentPage = this.#appState.getFirstPage();
            return;
        }
        this.#appState.currentPage = nextPage;
    }

    listenForUrlChange() {
        const thisRef = this;
        let currentUrl = '';
        setInterval(() => {
            const nextUrl = window.location.href;
            if (nextUrl === currentUrl) {
                return;
            }
            currentUrl = nextUrl;

            let pageTitle = '';
            if (window.location.search) {
                const page = new URLSearchParams(window.location.search).get('page');
                if (page) {
                    pageTitle = decodeURIComponent(page);
                }
            }

            switch (pageTitle) {
                case Constants.LocationHashes.settings:
                    thisRef.#showSettings();
                    break;
                case Constants.LocationHashes.images:
                    thisRef.#showImages();
                    break;
                case Constants.LocationHashes.editor:
                    thisRef.#showEditor();
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