class Preview {

    #appState = null;
    #utils = null;
    #visibility = null;

    constructor(appState, utils, visibility) {
        this.#appState = appState;
        this.#utils = utils;
        this.#visibility = visibility;
        this.#appState.addPropertyChangedListener(this.#onAppStateChanged.bind(this));
        this.#registerButtonClickEvents();
    }

    #registerButtonClickEvents() {
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Preview.buttonDelete,
                callback: this.#deletePage.bind(this)
            }
        ]);
    };

    #onAppStateChanged(propertyName) {
        if (propertyName === Constants.StateProperties.state
            || propertyName === Constants.StateProperties.currentPage) {

            this.#previewPage();
        }
    };

    #previewPage() {
        const page = this.#appState.currentPage;

        this.#visibility.showPreview();

        const viewContainer = this.#utils.getElement(Constants.Ids.Fragments.Preview.viewContainer);
        viewContainer.innerHTML = marked.parse(page.contents);
        this.#addEmbededImages(viewContainer);
        this.#addPageLinks(viewContainer);
    };

    previewPreviousPage() {
        const order = this.#appState.order;
        const currentIndex = order.findIndex(o => o === this.#appState.currentPage.slug);
        if (currentIndex <= 0) {
            return;
        }

        const nextPage = this.#appState.getPage(order[currentIndex - 1]);
        this.#utils.updateQuery(nextPage.title);
    };

    previewNextPage() {
        const order = this.#appState.order;
        const currentIndex = order.findIndex(o => o === this.#appState.currentPage.slug);
        if (currentIndex < 0 || currentIndex >= order.length - 1) {
            return;
        }

        const nextPage = this.#appState.getPage(order[currentIndex + 1]);
        this.#utils.updateQuery(nextPage.title);
    };

    #addEmbededImages(viewContainer) {
        const images = viewContainer.getElementsByTagName('img');
        if (images.length === 0) {
            return;
        }

        for (let i = 0; i < images.length; i++) {
            const imageElement = images[i];
            const src = imageElement.getAttribute('src');
            if (!src || !src.startsWith(Constants.Prefixes.embeddedImageSrc)) {
                continue;
            }

            const desiredImageName = src.replace(Constants.Prefixes.embeddedImageSrc, '');
            const image = this.#appState.images.find(image => image.name === desiredImageName);
            if (!image) {
                imageElement.setAttribute('alt', `[Image Error: image with name not found: ${desiredImageName}]`);
                imageElement.classList.add(Constants.lookupErrorClass);
                continue;
            }
            imageElement.setAttribute('src', image.data);
        }
    };

    #addPageLinks(viewContainer) {
        const links = viewContainer.getElementsByTagName('a');
        if (links.length === 0) {
            return;
        }

        for (let i = 0; i < links.length; i++) {
            const linkElement = links[i];
            const href = linkElement.getAttribute('href');
            if (!href || !href.startsWith(Constants.Prefixes.pageLink)) {
                continue;
            }

            const desiredPageTitle = href.replace(Constants.Prefixes.pageLink, '')
                .replaceAll('_', ' ');
            const page = this.#appState.pages.find(page => page.title === desiredPageTitle);
            if (page) {
                linkElement.setAttribute('href', 'javascript:void(0);');
                const thisRef = this;
                linkElement.onclick = () => {
                    thisRef.#utils.updateQuery(page.title);
                };
            } else {
                linkElement.removeAttribute('href');
                linkElement.innerText = `[Link Error: Page with title not found: ${desiredPageTitle}]`;
                linkElement.classList.add(Constants.lookupErrorClass);
            }
        }
    };

    #deletePage() {
        const pageToDelete = this.#appState.currentPage;

        let pages = this.#appState.pages;

        if (pages.length === 1) {
            return alert('Page cannot be deleted because it is the last page left.');
        }

        if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
            return;
        }

        pages = pages.filter(page => page.slug !== pageToDelete.slug);

        // If the page being deleted was a parent of another page then shift all those
        // pages up one spot in the hierarchy.
        for (let i = 0; i < pages.length; i++) {
            const otherPage = pages[i];
            if (otherPage.parent === pageToDelete.slug) {
                otherPage.parent = pageToDelete.parent;
            }
        }

        this.#appState.pages = pages;
        
        this.#utils.updateQuery(this.#appState.getFirstPage().title);
    }
};