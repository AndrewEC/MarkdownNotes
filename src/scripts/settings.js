class Settings {

    #appState = null;
    #utils = null;
    #persistence = null;
    #nextOrder = [];

    constructor(appState, utils, persistence) {
        this.#appState = appState;
        this.#utils = utils;
        this.#persistence = persistence;
        this.#appState.addPropertyChangedListener(this.onPropertyChanged.bind(this));
        this.#registerButtonClickEvents();
    }

    #registerButtonClickEvents() {
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Settings.buttonResetOrder,
                callback: this.resetOrder.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonSaveOrder,
                callback: this.saveReorder.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonUpdateTitle,
                callback: this.updateTitle.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonDataImport,
                callback: this.importData.bind(this)
            }
        ])
    };

    onPropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.state) {
            this.#rehydrate();
        } else if (propertyName === Constants.StateProperties.title) {
            this.#resetTitle();
        } else if (propertyName === Constants.StateProperties.pages
            || propertyName === Constants.StateProperties.order) {

            this.resetOrder();
        }

        this.#displayData();
    }

    #rehydrate() {
        this.resetOrder();
        this.#resetTitle();
        this.#displayData();
        this.#displayVersion();
    };

    #displayVersion() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.versionNumberText).innerText = Constants.currentVersion
    }

    updateTitle() {
        let nextTitle = prompt('New Notebook title:');
        if (nextTitle === null) {
            return;
        }
        nextTitle = nextTitle.trim();

        this.#appState.title = nextTitle;
    };

    #resetTitle() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.currentTitle).innerText
            = this.#appState.title;
    };

    updateOrderTable() {
        if (this.#nextOrder.length === 0) {
            this.#nextOrder = this.#appState.order.slice()
        }

        const headerMarkup = '<tr><td>Page Name</td><td>Up</td><td>Down</td></tr>';

        const orderTable = this.#utils.getElement(Constants.Ids.Fragments.Settings.orderTable);
        orderTable.innerHTML = headerMarkup;

        for (let i = 0; i < this.#nextOrder.length; i++) {
            const page = this.#utils.getPage(this.#nextOrder[i]);

            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.innerHTML = `<strong>${page.title}</strong>`;
            row.appendChild(nameCell);

            const upButtonCell = document.createElement('td');
            const upButton = document.createElement('button');
            upButton.innerText = 'Move Up';
            upButton.onclick = () => this.moveUp(page.slug);
            upButtonCell.appendChild(upButton);
            row.appendChild(upButtonCell);

            const downButtonCell = document.createElement('td');
            const downButton = document.createElement('button');
            downButton.innerText = 'Move Down';
            downButton.onclick = () => this.moveDown(page.slug);
            downButtonCell.appendChild(downButton);
            row.appendChild(downButtonCell);

            orderTable.appendChild(row);
        }
    };

    moveUp(slug) {
        const index = this.#nextOrder.indexOf(slug);
        if (index === 0) {
            return;
        }

        const temp = this.#nextOrder[index - 1];
        this.#nextOrder[index - 1] = this.#nextOrder[index];
        this.#nextOrder[index] = temp;
        this.updateOrderTable();
    };

    moveDown(slug) {
        const index = this.#nextOrder.indexOf(slug);
        if (index >= this.#nextOrder.length - 1) {
            return;
        }

        const temp = this.#nextOrder[index + 1];
        this.#nextOrder[index + 1] = this.#nextOrder[index];
        this.#nextOrder[index] = temp;
        this.updateOrderTable();
    };

    resetOrder() {
        this.#nextOrder = this.#appState.order.slice();
        this.updateOrderTable()
    };

    saveReorder() {
        this.#appState.order = this.#nextOrder.slice();
    };

    importData() {
        let newState = this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value;
        try {
            newState = JSON.parse(newState);
        } catch (error) {
            return alert('The data provided could not be parsed as JSON. Error: ' + error);
        }

        if (!this.#persistence.validateState(newState)) {
            return;
        }

        if (!confirm('This action will overwrite all data in the current Notebook. Are you sure you want to continue?')) {
            return;
        }

        this.#utils.getElement(Constants.Ids.stateContainer).innerText = newState;
        this.#appState.hydrate(newState);
    };

    #displayData() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value
            = JSON.stringify(this.#appState.getSerializableState());
    }
};