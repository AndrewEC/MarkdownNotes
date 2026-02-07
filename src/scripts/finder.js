class Finder {

    #appState = null;
    #utils = null;
    #results = [];
    #selectedIndex = -1;
    #logger = new Logger('Finder');

    constructor(appState, utils) {
        this.#appState = appState;
        this.#utils = utils;

        this.#appState.addPropertyChangedListener(this.#onPropertyChanged.bind(this));

        this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle)
            .oninput = this.#onInputChange.bind(this);
        this.#utils.getElement(Constants.Ids.Fragments.Finder.formInput)
            .onsubmit = this.#onFormSubmit.bind(this);
    }

    #onPropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.isFinding) {
            if (this.#appState.isFinding) {
                this.#present();
            } else {
                this.#hide();
            }
        }
    }

    onKeyPressed(e) {
        if (e.keyCode === Constants.KeyCodes.escape) {
            if (this.#appState.isFinding) {
                this.#logger.log('Escape pressed. Hiding finder.');
                this.#appState.isFinding = false;
                return true;
            }
        } else if (e.keyCode === Constants.KeyCodes.tab) {
            if (this.#appState.isFinding) {
                this.#onTabPressed(e);
                return false;
            }
        } else if (e.keyCode === Constants.KeyCodes.g && e.ctrlKey) {
            if (!this.#appState.isFinding) {
                this.#logger.log('Control + G pressed. Showing finder.');
                this.#appState.isFinding = true;
                return true;
            }
        }

        return false;
    }

    #onTabPressed(e) {
        if (e.shiftKey) {
            this.#highlightPreviousOption(e);
        } else {
            this.#highlightNextOption(e);
        }
    }

    #highlightPreviousOption(e) {
        this.#logger.log(`Shift + Tab pressed. Navigating to previous result from current index [${this.#selectedIndex}].`);
        if (this.#selectedIndex === -1) {
            e.preventDefault();
            this.#selectedIndex = this.#results.length - 1;
            const links = this.#utils.getElement(Constants.Ids.Fragments.Finder.resultContainer)
                .getElementsByTagName('a');
            links[links.length - 1].focus();
        } else {
            this.#selectedIndex--;
        }
    }

    #highlightNextOption(e) {
        this.#logger.log(`Shift + Tab pressed. Navigating to next result from current index [${this.#selectedIndex}].`);
        if (this.#selectedIndex === this.#results.length - 1) {
            e.preventDefault();
            this.#selectedIndex = -1;
            this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle).focus();
        } else {
            this.#selectedIndex++;
        }
    }

    #onFormSubmit() {
        const searchTerm = this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle).value;
        this.#logger.log(`Finder form submitted. Searching for term: [${searchTerm}].`);
        this.#appState.isFinding = false;
        this.#utils.updateQuery(
            Constants.LocationHashes.search,
            {
                'query': searchTerm
            }
        );
        return false;
    }

    #present() {
        this.#utils.getElement(Constants.Ids.Fragments.Finder.root).style.display
            = Constants.Display.block;
        this.#resetResults();
        this.#utils.getElement(Constants.Ids.Fragments.Finder.inputTitle).focus();
        this.resize();
    }

    #hide() {
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

        this.#results = this.#appState.pages
            .filter(page => page.title.toLowerCase().includes(pageTitle));

        this.#updateResults();
    }

    #updateResults() {
        const resultContainer = this.#utils.getElement(Constants.Ids.Fragments.Finder.resultContainer);
        resultContainer.innerHTML = '';

        if (this.#results.length === 0) {
            return;
        }

        const thisRef = this;
        const ul = document.createElement('ul');
        for (const result of this.#results) {
            const li = document.createElement('li');

            const link = document.createElement('a');
            link.href = 'javascript:void(0);';
            link.innerText = result.title;
            link.onclick = () => {
                thisRef.#logger.log(`User selected result link with title: [${result.title}].`);
                thisRef.#appState.isFinding = false;
                thisRef.#utils.updateQuery(result.title);
            };

            li.appendChild(link);
            ul.appendChild(li);
        }

        resultContainer.appendChild(ul);
    }

    resize() {
        if (!this.#appState.isFinding) {
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