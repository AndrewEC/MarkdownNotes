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
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Navigation.buttonSettings,
                callback: this.showSettings.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonImages,
                callback: this.showImages.bind(this)
            }
        ]);
    };

    showSettings() {
        this.#visibility.showSettings()
    };

    showImages() {
        this.#visibility.showImages()
    };

    onStatePropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.title) {
            this.#updateTitle(this.#appState.title);
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
        link.setAttribute('data-slug', page.slug);
        link.href = 'javascript:void(0);'
        link.innerText = page.title;
        link.onclick = () => this.onNavigateClick(page.slug);
        return link;
    };

    onNavigateClick(slug) {
        if (this.#utils.confirmCancelEdit()) {
            this.#appState.currentPage = this.#utils.getPage(slug);
        }
    };

    #updateTitle(title) {
        this.#utils.getElement(Constants.Ids.Fragments.Navigation.title).innerText = title;
    };
};