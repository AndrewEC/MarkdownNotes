class Navigation {

    #appState = null;
    #utils = null;
    #visibility = null;

    constructor(appState, utils, visibility) {
        this.#appState = appState;
        this.#utils = utils;
        this.#visibility = visibility;
        this.#appState.addPropertyChangedListener(this.onStatePropertyChanged.bind(this));
        this.#registerButtonClickEvents();
    }

    #registerButtonClickEvents() {
        const thisRef = this;
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Navigation.buttonSettings,
                callback: () => thisRef.#utils.updateQuery(Constants.LocationHashes.settings)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonImages,
                callback: () => thisRef.#utils.updateQuery(Constants.LocationHashes.images)
            }
        ]);
    };

    showSettings() {
        this.#visibility.showSettings();
        document.title = this.#appState.title;
    };

    showImages() {
        this.#visibility.showImages();
        document.title = this.#appState.title;
    };

    showEditor() {
        this.#visibility.showEditor();
    };

    onStatePropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.title
            || propertyName === Constants.StateProperties.currentPage) {

            this.#updateTitle();
        } else if (propertyName === Constants.StateProperties.state) {
            this.#rehydrate();
        } else if (propertyName === Constants.StateProperties.pages
            || propertyName === Constants.StateProperties.order) {

            this.#updateNavList();
        }
    };

    #rehydrate() {
        this.#updateNavList();
        this.#updateTitle(this.#appState.title);
    };

    #updateNavList() {
        const navContainer = this.#utils.getElement(Constants.Ids.Fragments.Navigation.listContainer);

        const pagesWithoutParents = this.#appState.order
            .map(slug => this.#appState.pages.find(page => page.slug === slug))
            .filter(page => page.parent === null);

        const list = this.#buildNavList(pagesWithoutParents);

        navContainer.innerHTML = '';
        navContainer.appendChild(list);
    };

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
    };

    #getImmediateChildren(parent) {
        return this.#appState.order
            .map(slug => this.#appState.pages.find(page => page.slug === slug))
            .filter(page => page.parent === parent.slug);
    };

    #buildLink(page) {
        const link = document.createElement('a');
        link.href = `javascript:void(0);`;
        link.innerText = page.title;
        const thisRef = this;
        link.onclick = () => {
            if (!thisRef.#utils.confirmCancelEdit()) {
                return;
            }
            thisRef.#utils.updateQuery(page.title);
        };
        return link;
    };

    #updateTitle() {
        const notebookTitle = this.#appState.title;
        
        this.#utils.getElement(Constants.Ids.Fragments.Navigation.title).innerText = notebookTitle;
        
        const pageTitle = this.#appState.currentPage.title;
        const nextTitle = `${notebookTitle} | ${pageTitle}`;
        document.title = nextTitle
    };

    navigateTo(pageTitle) {
        pageTitle = decodeURIComponent(pageTitle);
        const nextPage = this.#appState.pages.find(page => page.title === pageTitle);
        if (!nextPage) {
            this.#appState.currentPage = this.#appState.getFirstPage();
            return;
        }
        this.#appState.currentPage = nextPage;
    };

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

            if (pageTitle === Constants.LocationHashes.settings) {
                thisRef.showSettings();
            } else if (pageTitle === Constants.LocationHashes.images) {
                thisRef.showImages();
            } else if (pageTitle === Constants.LocationHashes.editor) {
                thisRef.showEditor();
            } else {
                thisRef.navigateTo(pageTitle);
            }
        }, 100);
    }
};