class Settings {

    #logger = new Logger('Settings');

    #appState = null;
    #utils = null;
    #persistence = null;
    #visibility = null;

    #nextOrder = [];

    constructor(appState, utils, persistence, visibility) {
        this.#appState = appState;
        this.#utils = utils;
        this.#persistence = persistence;
        this.#visibility = visibility;

        this.#appState.addPropertyChangedListener(this.#onPropertyChanged.bind(this));
        this.#registerButtonClickEvents();
    }

    onKeyPressed(e) {
        if (e.keyCode === Constants.KeyCodes.s && e.ctrlKey) {
            if (!this.#appState.isEditing && !this.#appState.isFinding) {
                this.#logger.log('Control + S pressed. Saving notebook.');
                this.#hideDataArea();
                this.#persistence.save();
                return true;
            }
        }

        return false;
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
                callback: this.#updateNotebookTitle.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonDataImport,
                callback: this.#importData.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonCopyData,
                callback: this.#copyStateJsonToClipboard.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonRevealData,
                callback: this.#showDataArea.bind(this)
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonSave,
                callback: () => {
                    this.#hideDataArea();
                    this.#persistence.save();
                }
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
            case Constants.StateProperties.order:
                this.#resetOrder();
                this.#displayData();
                break;
            case Constants.StateProperties.queryParams:
                this.#showSettingsPage();
                break;
        }
    }

    #showSettingsPage() {
        const page = this.#appState.queryParams.get('page');
        if (page === Constants.LocationHashes.settings) {
            this.#logger.log('Showing settings page...');
            document.title = `${this.#appState.title} | Settings`;
            this.#visibility.showSettings();
        }
    }

    #rehydrate() {
        this.#resetOrder();
        this.#resetTitle();
        this.#displayData();
        this.#displayCurrentVersions();
    };

    #displayCurrentVersions() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.appVersionNumberText)
            .innerText = Constants.Versions.App;
        
        this.#utils.getElement(Constants.Ids.Fragments.Settings.saveVersionNumberText)
            .innerText = Constants.Versions.Save.Current;
    }

    #copyStateJsonToClipboard() {
        const data = JSON.stringify(this.#appState.getSerializableState());
        navigator.clipboard.writeText(data).then((_) => alert('Data copied to clipboard.'));
    }

    #updateNotebookTitle() {
        let nextTitle = prompt('New Notebook title:', this.#appState.title);
        if (nextTitle === null) {
            return;
        }
        nextTitle = nextTitle.trim();

        this.#logger.log(`Updating notebook title to: [${nextTitle}].`);

        this.#appState.title = nextTitle;

        alert('Notebook title has been updated.');
    }

    #resetTitle() {
        this.#utils.getElement(Constants.Ids.Fragments.Settings.currentTitle)
            .innerText = this.#appState.title;
    }

    /**
     * Generates the table HTMLElement to display the list of pages
     * within the Notebook in the order the user has defined.
     */
    #updatePageOrderTable() {
        if (this.#nextOrder.length === 0) {
            this.#nextOrder = this.#appState.order.slice()
        }

        this.#logger.log(`Updating page order table with [${this.#nextOrder.length}] pages.`);

        const headerMarkup = '<tr><td>Page Name</td><td>Up</td><td>Down</td></tr>';

        const orderTable = this.#utils.getElement(Constants.Ids.Fragments.Settings.orderTable);
        orderTable.innerHTML = headerMarkup;

        const rowTemplate = this.#utils.getElement(Constants.Ids.Fragments.Settings.templateOrderTableRow);

        for (let i = 0; i < this.#nextOrder.length; i++) {
            const page = this.#appState.getPage(this.#nextOrder[i]);

            const row = rowTemplate.content.cloneNode(true);

            row.querySelectorAll('td')[0].innerHTML = `<strong>${page.title}</strong>`;
            row.querySelectorAll('a')[0].onclick = () => this.#movePageUp(page.slug);
            row.querySelectorAll('a')[1].onclick = () => this.#movePageDown(page.slug);

            orderTable.appendChild(row);
        }
    }

    #movePageUp(slug) {
        const index = this.#nextOrder.indexOf(slug);
        if (index === 0) {
            return;
        }

        const temp = this.#nextOrder[index - 1];
        this.#nextOrder[index - 1] = this.#nextOrder[index];
        this.#nextOrder[index] = temp;
        this.#updatePageOrderTable();
    }

    #movePageDown(slug) {
        const index = this.#nextOrder.indexOf(slug);
        if (index >= this.#nextOrder.length - 1) {
            return;
        }

        const temp = this.#nextOrder[index + 1];
        this.#nextOrder[index + 1] = this.#nextOrder[index];
        this.#nextOrder[index] = temp;
        this.#updatePageOrderTable();
    }

    #resetOrder() {
        this.#nextOrder = this.#appState.order.slice();
        this.#updatePageOrderTable()
    }

    #saveReorder() {
        this.#appState.order = this.#nextOrder.slice();
        alert('Page order has been updated.');
    }

    /**
     * Attempts to take the JSON data entered into the text area and replace the
     * current global app state with the new JSON data.
     */
    #importData() {
        this.#logger.log('Importing user entered JSON data.');

        const dataArea = this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea);

        let newState = null;
        if (dataArea.style.display == Constants.Display.none) {
            newState = JSON.stringify(this.#appState.getSerializableState());
        } else {
            newState = this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value;
        }

        try {
            newState = JSON.parse(newState);
        } catch (error) {
            this.#logger.error(`Data could not be parsed as JSON. Cause: [${error}].`);
            return alert(`The data provided could not be parsed as JSON. Error: [${error}]`);
        }

        if (!this.#persistence.validateState(newState)) {
            this.#logger.error('User entered state is not valid. Data will not be imported.');
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
        if (!this.#isDataAreaVisible()) {
            return;
        }

        this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value
            = JSON.stringify(this.#appState.getSerializableState());
    }

    #isDataAreaVisible() {
        const dataArea = this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea);
        return dataArea.style.display !== Constants.Display.none;
    }

    #showDataArea() {
        if (this.#isDataAreaVisible()) {
            return;
        }

        this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea)
            .style.display = Constants.Display.block;
        
        this.#utils.getElement(Constants.Ids.Fragments.Settings.buttonRevealData)
            .style.display = Constants.Display.none;
        
        this.#displayData();
    }

    #hideDataArea() {
        if (!this.#isDataAreaVisible()) {
            return;
        }

        const dataArea = this.#utils.getElement(Constants.Ids.Fragments.Settings.dataArea);
        dataArea.style.display = Constants.Display.none;
        dataArea.value = '';
        
        this.#utils.getElement(Constants.Ids.Fragments.Settings.buttonRevealData)
            .style.display = Constants.Display.block;
        
        this.#displayData();
    }
};