class Settings {

    #appState = null;
    #utils = null;
    #persistence = null;
    #nextOrder = [];

    constructor(appState, utils, persistence) {
        this.#appState = appState;
        this.#utils = utils;
        this.#persistence = persistence;
        this.#appState.addPropertyChangedListener(this.#onPropertyChanged.bind(this));
        this.#registerButtonClickEvents();
    }

    #registerButtonClickEvents() {
        this.#utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Settings.buttonResetOrder,
                callback: this.#resetOrder.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonSaveOrder,
                callback: this.#saveReorder.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonUpdateTitle,
                callback: this.#updateSettingsTitle.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonDataImport,
                callback: this.#importData.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonCopyData,
                callback: this.#copyData.bind(this)
            }
        ])
    };

    #onPropertyChanged(propertyName) {
        switch (propertyName) {
            case Constants.StateProperties.state:
                this.#rehydrate();
                break;
            case Constants.StateProperties.title:
                this.#resetTitle();
                this.#displayData();
                break;
            case Constants.StateProperties.pages:
            case Constants.StateProperties.order:
                this.#resetOrder();
                this.#displayData();
                break;
        }
    }

    #rehydrate() {
        this.#resetOrder();
        this.#resetTitle();
        this.#displayData();
        this.#displayVersion();
    };

    #displayVersion() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.versionNumberText).innerText = Constants.currentVersion
    }

    #copyData() {
        const data = this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value;
        navigator.clipboard.writeText(data).then((_) => alert('Data copied to clipboard.'));
    }

    #updateSettingsTitle() {
        let nextTitle = prompt('New Notebook title:');
        if (nextTitle === null) {
            return;
        }
        nextTitle = nextTitle.trim();

        this.#appState.title = nextTitle;
    }

    #resetTitle() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.currentTitle).innerText = this.#appState.title;
    }

    #updateOrderTable() {
        if (this.#nextOrder.length === 0) {
            this.#nextOrder = this.#appState.order.slice()
        }

        const headerMarkup = '<tr><td>Page Name</td><td>Up</td><td>Down</td></tr>';

        const orderTable = this.#utils.getElement(Constants.Ids.Fragments.Settings.orderTable);
        orderTable.innerHTML = headerMarkup;

        for (let i = 0; i < this.#nextOrder.length; i++) {
            const page = this.#appState.getPage(this.#nextOrder[i]);

            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.innerHTML = `<strong>${page.title}</strong>`;
            row.appendChild(nameCell);

            const upButtonCell = document.createElement('td');
            const upButton = document.createElement('a');
            upButton.href = 'javascript:void(0);';
            upButton.classList.add('standard-button-link');
            upButton.classList.add('standard-table-button-link');
            upButton.innerText = 'Move Up';
            upButton.onclick = () => this.#moveUp(page.slug);
            upButtonCell.appendChild(upButton);
            row.appendChild(upButtonCell);

            const downButtonCell = document.createElement('td');
            const downButton = document.createElement('a');
            downButton.href = 'javascript:void(0);';
            downButton.classList.add('standard-button-link');
            downButton.classList.add('standard-table-button-link');
            downButton.innerText = 'Move Down';
            downButton.onclick = () => this.#moveDown(page.slug);
            downButtonCell.appendChild(downButton);
            row.appendChild(downButtonCell);

            orderTable.appendChild(row);
        }
    }

    #moveUp(slug) {
        const index = this.#nextOrder.indexOf(slug);
        if (index === 0) {
            return;
        }

        const temp = this.#nextOrder[index - 1];
        this.#nextOrder[index - 1] = this.#nextOrder[index];
        this.#nextOrder[index] = temp;
        this.#updateOrderTable();
    }

    #moveDown(slug) {
        const index = this.#nextOrder.indexOf(slug);
        if (index >= this.#nextOrder.length - 1) {
            return;
        }

        const temp = this.#nextOrder[index + 1];
        this.#nextOrder[index + 1] = this.#nextOrder[index];
        this.#nextOrder[index] = temp;
        this.#updateOrderTable();
    }

    #resetOrder() {
        this.#nextOrder = this.#appState.order.slice();
        this.#updateOrderTable()
    }

    #saveReorder() {
        this.#appState.order = this.#nextOrder.slice();
    }

    #importData() {
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

        this.#utils.updateQuery('');

        this.#appState.hasUnsavedChanges = true;
        this.#utils.getElement(Constants.Ids.stateContainer).innerText = newState;
        this.#appState.hydrate(newState);
    }

    #displayData() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value
            = JSON.stringify(this.#appState.getSerializableState());
    }
};