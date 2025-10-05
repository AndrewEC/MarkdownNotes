const Constants = {
    Ids: {
        rootContainer: 'root-container',
        Fragments: {
            Preview: {
                root: 'fragment-preview',
                viewContainer: 'fragment-preview-view-container',
                buttonEdit: 'fragment-preview-button-edit',
                buttonDelete: 'fragment-preview-button-delete'
            },
            Editor: {
                root: 'fragment-editor',
                inputTitle: 'fragment-editor-input-title',
                area: 'fragment-editor-area',
                buttonUpdate: 'fragment-editor-button-update',
                buttonCancel: 'fragment-editor-button-cancel',
                selectParent: 'fragment-editor-select-parent'
            },
            Settings: {
                root: 'fragment-settings',
                buttonSaveOrder: 'fragment-settings-button-save-order',
                buttonResetOrder: 'fragment-settings-button-reset-order',
                buttonUpdateTitle: 'fragment-settings-button-title-update',
                currentTitle: 'fragment-settings-current-title',
                orderTable: 'fragment-settings-table-order',
                dataArea: 'fragment-settings-data-area',
                buttonDataImport: 'fragment-settings-button-data-import',
                versionNumberText: 'fragment-settings-version-number',
                buttonCopyData: 'fragment-settings-button-data-copy',
                buttonRevealData: 'fragment-settings-button-reveal-data',
                templateOrderTableRow: 'fragment-settings-template-order-row'
            },
            Navigation: {
                root: 'fragment-navigation',
                listContainer: 'fragment-navigation-page-list-container',
                title: 'fragment-navigation-title',
                buttonSave: 'fragment-navigation-button-save',
                buttonNewPage: 'fragment-navigation-button-new-page',
                buttonSettings: 'fragment-navigation-button-settings',
                buttonImages: 'fragment-navigation-button-images',
                buttonSearch: 'fragment-navigation-button-search'
            },
            Images: {
                root: 'fragment-images',
                buttonEmbed: 'fragment-images-button-embed',
                imageInput: 'fragment-images-image-input',
                imageName: 'fragment-images-input-name',
                imageTable: 'fragment-images-display-table',
                templateTableRow: 'fragment-images-template-table-row'
            },
            Search: {
                root: 'fragment-search',
                resultsContainer: 'fragment-search-results-container'
            },
            Finder: {
                root: 'fragment-finder',
                inputTitle: 'fragment-finder-input-title',
                resultContainer: 'fragment-finder-result-container',
                formInput: 'fragment-finder-form-input'
            }
        },
        stateContainer: 'root-state-container'
    },
    LocationHashes: {
        settings: '__settings__',
        images: '__images__',
        search: '__search__'
    },
    reservedPageTitles: [
        '__settings__',
        '__images__',
        '__search__',
        'none'
    ],
    StateProperties: {
        state: '__state__',
        title: 'title',
        currentPage: 'currentPage',
        pages: 'pages',
        order: 'order',
        images: 'images',
        autoSavedChanges: 'autoSavedChanges',
        hasUnsavedChanges: 'hasUnsavedChanges',
        isEditing: 'isEditing',
        isFinding: 'isFinding'
    },
    noParentOption: 'none',
    lookupErrorClass: 'fragment-preview-lookup-error',
    VisibilityOptions: {
        revealEditor: 'revealEditor',
        revealPreview: 'revealPreview',
        revealSettings: 'revealSettings',
        revealImages: 'revealImages',
        revealSearch: 'revealSearch'
    },
    Display: {
        none: 'none',
        block: 'block'
    },
    Prefixes: {
        embeddedImageSrc: 'image/',
        pageLink: 'page/'
    },
    KeyCodes: {
        e: 69,
        g: 71,
        n: 78,
        q: 81,
        s: 83,
        comma: 188,
        escape: 27,
        period: 190,
        tab: 9
    },
    Versions: {
        Save: {
            Current: '1',
            v1: '1'
        },
        App: '0.1.2'
    }
};