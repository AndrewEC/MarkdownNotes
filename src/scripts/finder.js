class Finder {

    #visible = false;
    #appState = null;
    #utils = null;
    #results = [];
    #selectedIndex = -1;

    constructor(appState, utils) {
        this.#appState = appState;
        this.#utils = utils;

        this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle)
            .oninput = this.#onInputChange.bind(this);
        this.#utils.getElement(Constants.Ids.Fragments.Finder.formInput)
            .onsubmit = this.#onFormSubmit.bind(this);
    }

    onTabPressed(e) {
        if (!this.#visible) {
            return;
        }

        if (e.shiftKey) {
            // Navigate to the previous available result in the search results.
            if (this.#selectedIndex === -1) {
                e.preventDefault();
                this.#selectedIndex = this.#results.length - 1;
                const links = this.#utils.getElement(Constants.Ids.Fragments.Finder.resultContainer)
                    .getElementsByTagName('a');
                links[links.length - 1].focus();
            } else {
                this.#selectedIndex--;
            }
        } else {
            // Navigate to the next available result in the search results.
            if (this.#selectedIndex === this.#results.length - 1) {
                e.preventDefault();
                this.#selectedIndex = -1
                this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle).focus();
            } else {
                this.#selectedIndex++;
            }
        }
    }

    #onFormSubmit() {
        const pageTitle = this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle).value;
        this.hide();
        this.#utils.updateQuery(
            Constants.LocationHashes.search,
            {
                'query': pageTitle
            }
        );
        return false;
    }

    isVisible() {
        return this.#visible;
    }

    present() {
        this.#visible = true;
        this.#utils.getElement(Constants.Ids.Fragments.Finder.root).style.display
            = Constants.Display.block;
        this.#resetResults();
        this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle).focus();
    }

    hide() {
        this.#visible = false;
        this.#utils.getElement(Constants.Ids.Fragments.Finder.root).style.display
            = Constants.Display.none;
        this.#resetResults();
        this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle).value = '';
    }

    #resetResults() {
        this.#results = [];
        this.#updateResults();
    }

    #onInputChange() {
        const pageTitle = this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle)
            .value.toLowerCase();

        this.#results = this.#appState.pages.filter(page => page.title.toLowerCase().includes(pageTitle));

        this.#updateResults();
    }

    #updateResults() {
        const resultContainer = this.#utils.getElement(Constants.Ids.Fragments.Finder.resultContainer);
        resultContainer.innerHTML = '';

        if (this.#results.length === 0) {
            return;
        }

        const ul = document.createElement('ul');

        for (const result of this.#results) {
            const li = document.createElement('li');

            const link = document.createElement('a');
            link.href = 'javascript:void(0);';
            link.innerText = result.title;
            const thisRef = this;
            link.onclick = () => {
                thisRef.hide();
                thisRef.#utils.updateQuery(result.title);
            };

            li.appendChild(link);
            ul.appendChild(li);
        }

        resultContainer.appendChild(ul);
    }

    resize() {
        if (!this.#visible) {
            return;
        }

        this.#resizeTitleInput();
        this.#resizeResultContainer();
    }

    #resizeTitleInput() {
        const titleInput = this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle);

        const width = window.innerWidth / 3;
        titleInput.style.width = `${width}px`;

        const left = Math.round((window.innerWidth / 2) - (width / 2));
        titleInput.style.left = `${left}px`;

        const top = Math.round(window.innerHeight * 0.1);
        titleInput.style.top = `${top}px`;
    }

    #resizeResultContainer() {
        setTimeout(() => {
            const titleInput = this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle);
            const resultContainer = this.#utils.getElement(Constants.Ids.Fragments.Finder.resultContainer);        

            resultContainer.style.width = `${titleInput.offsetWidth}px`;

            resultContainer.style.left = titleInput.style.left;

            const top = titleInput.offsetTop + titleInput.offsetHeight;
            resultContainer.style.top = `${top}px`;
        }, 0);
    }

}