(function() {

    // ===== ===== Globals ===== =====
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
                    buttonSaveOrder: 'fragment-settings-save-order',
                    buttonResetOrder: 'fragment-settings-reset-order',
                    inputTitle: 'fragment-settings-input-title',
                    buttonUpdateTitle: 'fragment-settings-button-title-update',
                    buttonResetTitle: 'fragment-settings-button-title-reset',
                    orderTable: 'fragment-settings-order-table',
                    dataArea: 'fragment-settings-data-area',
                    buttonDataImport: 'fragment-settings-button-data-import'
                },
                Navigation: {
                    root: 'fragment-navigation',
                    listContainer: 'fragment-navigation-page-list-container',
                    title: 'fragment-navigation-title',
                    buttonSave: 'fragment-navigation-save',
                    buttonNewPage: 'fragment-navigation-new-page',
                    buttonSettings: 'fragment-navigation-settings',
                    buttonImages: 'fragment-navigation-images'
                },
                Images: {
                    root: 'fragment-images',
                    buttonEmbed: 'fragment-images-button-embed',
                    imageInput: 'fragment-images-image-input',
                    imageName: 'fragment-images-name',
                    imageTable: 'fragment-images-display-table'
                }
            },
            stateContainer: 'root-state-container'
        },
        noParentOption: 'none',
        VisibilityOptions: {
            revealEditor: 'revealEditor',
            revealPreview: 'revealPreview',
            revealSettings: 'revealSettings',
            revealImages: 'revealImages'
        },
        Display: {
            none: 'none',
            block: 'block'
        },
        Prefixes: {
            embeddedImageSrc: 'image/',
            pageLink: 'page/'
        },
        Versions: {
            v1: '1'
        }
    };

    const defaultSlug = crypto.randomUUID();
    let state = {
        pages: [
            {
                title: 'MarkdownNotes',
                contents: '# Welcome to MarkdownNotes!!!',
                slug: defaultSlug,
                parent: null
            }
        ],
        order: [defaultSlug],
        title: 'MarkdownNotes',
        images: [],
        version: '1'
    };

    let hasUnsavedChanges = false;
    let currentPage = state.pages[0];
    // ===== ===== Globals ===== =====

    // ===== ===== Utility Function ===== =====
    const Utils = {
        getPage: (slug) => state.pages.find(page => page.slug === slug),

        getElement: (id) => {
            const element = document.getElementById(id);
            if (!element) {
                throw new Error(`Could not find element on page with ID of ${id}`);
            }
            return element;
        },

        confirmCancelEdit: () => {
            if (Editor.isInitialized()
                && Editor.isShowingEditor()
                && Editor.instance.value() !== currentPage.contents) {

                return confirm('All changes made to the page will be lost. Are you sure you want to continue?');
            }
            return true;
        },

        registerButtonClicks: (definitions) => {
            for (let i = 0; i < definitions.length; i++) {
                const definition = definitions[i];
                Utils.getElement(definition.id).onclick = definition.callback;
            }
        },

        resize: () => {
            const height = `${window.innerHeight - 20}px`;
            Utils.getElement(Constants.Ids.Fragments.Navigation.root).style.height = height;
            Utils.getElement(Constants.Ids.Fragments.Preview.root).style.height = height;
            Utils.getElement(Constants.Ids.Fragments.Editor.root).style.height = height;
            Utils.getElement(Constants.Ids.Fragments.Settings.root).style.height = height;
            Utils.getElement(Constants.Ids.Fragments.Images.root).style.height = height;
        },

        beforeUnload: () => {
            if (hasUnsavedChanges) {
                return 'You have unsaved changes. Are you sure you want to leave?';
            }
        }
    };
    // ===== ===== Utility Functions ===== =====
    
    // ===== ===== Save/Load Functions ===== =====
    const Persistence = {
        save: () => {
            hasUnsavedChanges = false;

            // The EasyMDE editor generates a few elements on the page.
            // These elements need to be removed so they are not included
            // in the resulting html file. This is to prevent an issue
            // where re-initializing the editor on a subsequent load of the page
            // can cause duplicate elements to be appended causing the file size
            // to expand infinitely.
            Editor.removeEditor();

            const stateContainer = Utils.getElement(Constants.Ids.stateContainer);
            stateContainer.innerText = JSON.stringify(state);

            // Prepend the DOCTYPE since it's not part of the outerHTML property.
            const documentString = `<!DOCTYPE html>${document.documentElement.outerHTML}`;
            const blob = new Blob([documentString], { type: 'text' });

            const objectUrl = URL.createObjectURL(blob)
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = `${state.title}.html`;
            link.click();
            URL.revokeObjectURL(objectUrl);

            Settings.displayData();
        },

        rehydrateState: () => {
            try {
                const stateContainer = Utils.getElement(Constants.Ids.stateContainer);
                state = JSON.parse(stateContainer.innerText);
            } catch (error) {
                console.error('Could not parse state from root-state-container. Error: ' + error);
            }

            if (!Persistence.validateState(state)) {
                return;
            }

            currentPage = Utils.getPage(state.order[0]);
            Preview.previewPage(currentPage);
            Navigation.updateNavList();
            Settings.resetOrder();
            Navigation.updateTitle(state.title);
            Settings.resetTitle();
            Images.updateImageList();
            Settings.displayData();
        },

        getVersion: (state) => {
            if (!state || !state.version || typeof state.version !== 'string') {
                console.warn('Unknown state version provided. Defaulting to version 1.');
                return '1';
            }
            return state.version;
        },

        validateState: (state) => {
            try {
                const version = Persistence.getVersion(state);
                if (version === Constants.Versions.v1) {
                    Persistence.validateStateV1(state);
                } else {
                    throw new Error(`Data contains an invalid version of: ${version}`);
                }
                return true;
            } catch (error) {
                alert(error);
                return false
            }
        },

        validateStateV1: (state) => {
            if (!state) {
                throw new Error("Data was null or undefined.");
            }

            // Validate pages array.
            if (!Persistence.isNonEmptyArray(state.pages)) {
                throw new Error("Invalid pages value. Pages must be an array with at least one element.");
            }
            for (let i = 0; i < state.pages.length; i++) {
                const page = state.pages[i];
                if (!Persistence.isNonEmptyString(page.slug)) {
                    throw new Error(`Invalid pages value. Page at index [${i}] has an empty or non-string slug property.`);
                } else if (!Persistence.isNonEmptyString(page.title)) {
                    throw new Error(`Invalid pages value. Page at index [${i}] has an empty or non-string title property.`);
                } else if (!Persistence.isString(page.contents)) {
                    throw new Error(`Invalid pages value. Page at index [${i}] has an empty or non-string contents property.`);
                }
            }
            if (!Persistence.areAllUnique(state.pages.map(page => page.title))) {
                throw new Error('Invalid pages value. All pages must have a unique title.');
            } else if (!Persistence.areAllUnique(state.pages.map(page => page.slug))) {
                throw new Error('Invalid pages value. All pages must have a unique slug.');
            }
            
            // Validate images array.
            if (!Persistence.isArray(state.images)) {
                throw new Error("Invalid images value. Images must be an array.");
            }
            for (let i = 0; i < state.images.length; i++) {
                const image = state.images[i];
                if (!Persistence.isNonEmptyString(image.name)) {
                    throw new Error(`Invalid image value. Image at index [${i}] has an empty or non-string name property.`);
                } else if (!Persistence.isNonEmptyString(image.data)) {
                    throw new Error(`Invalid image value. Image at index [${i}] has an empty or non-string data property.`);
                }
            }
            if (!Persistence.areAllUnique(state.images.map(image => image.name))) {
                throw new Error('Invalid images. All image must have a unique name.');
            }
         
            // Validate order array.
            if (!Persistence.isNonEmptyArray(state.order)) {
                throw new Error("Invalid order value. Order must be an array with at least one element.");
            }
            for (let i = 0; i < state.order.length; i++) {
                const slug = state.order[i];
                if (!Persistence.isNonEmptyString(slug)) {
                    throw new Error(`Invalid order value. Order at index [${i}] must be a non-empty string.`);
                }

                const matchingPage = state.pages.find(page => page.slug === slug);
                if (!matchingPage) {
                    throw new Error(`Invalid order value. Order at index [${i}] does match the slug of any known page.`);
                }
            }
        },

        areAllUnique: (values) => [...new Set(values)].length === values.length,

        isString: (value) => typeof value === 'string',

        isNonEmptyString: (value) => Persistence.isString(value) && value.trim() !== '',
        
        isArray: (value) => value && Array.isArray(value),

        isNonEmptyArray: (value) => Persistence.isArray(value) && value.length > 0
    };
    // ===== ===== Save/Load Functions ===== =====

    // ===== ===== Navigation Functions ===== =====
    const Navigation = {
        updateNavList: () => {
            const navContainer = Utils.getElement(Constants.Ids.Fragments.Navigation.listContainer);

            const pagesWithoutParents = state.order
                .map(slug => state.pages.find(page => page.slug === slug))
                .filter(page => page.parent === null);

            const list = Navigation.buildNavList(pagesWithoutParents);

            navContainer.innerHTML = '';
            navContainer.appendChild(list);
        },

        buildNavList: (pages) => {
            const list = document.createElement('ul');

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];

                const item = document.createElement('li');
                item.appendChild(Navigation.buildLink(page));

                const children = Navigation.getImmediateChildren(page);
                if (children.length > 0) {
                    item.appendChild(Navigation.buildNavList(children));
                }

                list.append(item);
            }

            return list;
        },

        getImmediateChildren: (parent) => state.pages.filter(page => page.parent === parent.slug),

        buildLink: (page) => {
            const link = document.createElement('a');
            link.setAttribute('data-slug', page.slug);
            link.href = 'javascript:void(0);'
            link.innerText = page.title;
            link.onclick = () => Navigation.onNavigateClick(page.slug);
            return link;
        },

        onNavigateClick: (slug) => {
            if (Utils.confirmCancelEdit()) {
                Preview.previewPage(Utils.getPage(slug));
            }
        },

        updateTitle: (title) => {
            Utils.getElement(Constants.Ids.Fragments.Navigation.title).innerText = title;
        }
    };
    // ===== ===== Navigation Functions ===== =====

    // ===== ===== Editor/Preview Functions ===== =====
    const Editor = {
        instance: null,
        creatingNewPage: false,

        removeEditor: () => {
            Editor.instance = null;

            const editorContainer = document.getElementsByClassName('EasyMDEContainer');
            if (editorContainer.length > 0) {
                editorContainer[0].remove();
            }
        },

        Title: {
            getInputValue: () => Utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value.trim(),
            setInputValue: (value) => Utils.getElement(Constants.Ids.Fragments.Editor.inputTitle).value = value
        },

        isInitialized: () => Editor.instance !== null,

        isShowingEditor: () =>
            Utils.getElement(Constants.Ids.Fragments.Editor.root).style.display.toLowerCase()
                !== Constants.Display.none,
        
        doesPageTitleExist: (title, currentPageSlug) => {
            if (!currentPageSlug) {
                return state.pages.find(page => page.title === title) !== undefined;
            }
            return state.pages.find(page => page.title === title
                && page.slug !== currentPageSlug) !== undefined;
        },
        
        editPage: (page) => {
            Visibility.toggle(Constants.VisibilityOptions.revealEditor);
            Editor.populateParentPageSelect(page);

            if (!Editor.isInitialized()) {
                Editor.instance = new EasyMDE({
                    element: Utils.getElement(Constants.Ids.Fragments.Editor.area),
                    autoDownloadFontAwesome: false,
                    spellChecker: false
                });
            }

            if (page) {
                Editor.creatingNewPage = false;
                Editor.instance.value(page.contents);
                Editor.Title.setInputValue(page.title);
            } else {
                Editor.creatingNewPage = true;
                Editor.instance.value('');
                Editor.Title.setInputValue('New Page');
            }
        },

        // Checks to see if the "first" page is a parent of the
        // "second" page.
        isParentOf: (first, second) => {
            let nextPage = second.parent;
            while (nextPage) {
                if (nextPage === first.slug) {
                    return true;
                }
                nextPage = nextPage.parent;
            }
            return false;
        },

        populateParentPageSelect: (page) => {
            // Populates a dropdown that allows the user to select
            // a page to be a parent of this page.

            const select = Utils.getElement(Constants.Ids.Fragments.Editor.selectParent);
            select.innerHTML = '';

            const defaultNone = document.createElement('option');
            defaultNone.setAttribute('value', Constants.noParentOption);
            defaultNone.text = 'None';
            select.appendChild(defaultNone);

            for (let i = 0; i < state.order.length; i++) {
                const otherPage = Utils.getPage(state.order[i]);
                if (page && (otherPage.slug === page.slug || Editor.isParentOf(page, otherPage))) {
                    continue;
                }

                const option = document.createElement('option');
                option.setAttribute('value', otherPage.slug);
                option.innerText = otherPage.title;
                if (page && page.parent === otherPage.slug) {
                    option.setAttribute('selected', '');
                }
                select.appendChild(option);
            }
        },

        getSelectedParent: () => Utils.getElement(Constants.Ids.Fragments.Editor.selectParent).value,

        updatePage: () => {
            hasUnsavedChanges = true;
            if (Editor.creatingNewPage) {
                const newPageTitle = Editor.Title.getInputValue();
                if (Editor.doesPageTitleExist(newPageTitle)) {
                    return alert('A page with this title already exists. Ensure that all page titles are unique.');
                }

                // Make sure to not reference the current page in this
                // as the current page doesn't reference the page being added.
                const newPage = {
                    title: newPageTitle,
                    contents: Editor.instance.value(),
                    slug: crypto.randomUUID(),
                    parent: null
                }

                const parent = Editor.getSelectedParent();
                if (parent !== Constants.noParentOption) {
                    newPage.parent = parent;
                }

                state.pages.push(newPage);
                state.order.push(newPage.slug);

                currentPage = newPage;
                Preview.previewPage(newPage);
            } else {
                const nextPageTitle = Editor.Title.getInputValue();
                if (Editor.doesPageTitleExist(nextPageTitle, currentPage.slug)) {
                    return alert('A page with this title already exists. Ensure that all page titles are unique.');
                }

                currentPage.contents = Editor.instance.value();
                currentPage.title = nextPageTitle;

                const parent = Editor.getSelectedParent();
                if (parent !== Constants.noParentOption) {
                    currentPage.parent = parent;
                } else {
                    currentPage.parent = null;
                }

                Preview.previewPage(currentPage);
            }

            Navigation.updateNavList();
            Settings.resetOrder();
        }
    };

    const Preview = {
        previewPage: (page) => {
            Visibility.toggle(Constants.VisibilityOptions.revealPreview);

            currentPage = page;

            document.title = page.title;

            const viewContainer = Utils.getElement(Constants.Ids.Fragments.Preview.viewContainer);
            viewContainer.innerHTML = marked.parse(page.contents);
            Preview.addEmbededImages(viewContainer);
            Preview.addPageLinks(viewContainer);
        },

        addEmbededImages: (viewContainer) => {
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
                const image = state.images.find(image => image.name === desiredImageName);
                if (!image) {
                    continue;
                }
                imageElement.setAttribute('src', image.data);
            }
        },

        addPageLinks: (viewContainer) => {
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
                const page = state.pages.find(page => page.title === desiredPageTitle);
                if (page) {
                    linkElement.setAttribute('href', 'javascript:void(0);');
                    linkElement.onclick = () => {
                        Preview.previewPage(page);
                    };
                }
            }
        },

        deletePage: (pageToDelete) => {
            if (state.pages.length === 1) {
                return alert('Page cannot be deleted because it is the last page left.');
            }

            if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
                return;
            }

            state.pages = state.pages.filter(page => page.slug !== pageToDelete.slug);
            state.order = state.order.filter(slug => slug !== pageToDelete.slug);

            // If the page being deleted was a parent of another page then shift all those
            // pages up one spot in the hierarchy.
            for (let i = 0; i < state.pages.length; i++) {
                const otherPage = state.pages[i];
                if (otherPage.parent === pageToDelete.slug) {
                    otherPage.parent = pageToDelete.parent;
                }
            }

            Preview.previewPage(state.pages[0]);
            Navigation.updateNavList();
            Settings.resetOrder();
        }
    };
    // ===== ===== Editor/Preview Functions ===== =====

    // ===== ===== Settings Functions ===== =====
    const Visibility = {
        showSettings: () => Visibility.toggle(Constants.VisibilityOptions.revealSettings),
        showImages: () => Visibility.toggle(Constants.VisibilityOptions.revealImages),

        toggle: (revealOption) => {
            const fragmentEditor = Utils.getElement(Constants.Ids.Fragments.Editor.root);
            const fragmentPreview = Utils.getElement(Constants.Ids.Fragments.Preview.root);
            const fragmentSettings = Utils.getElement(Constants.Ids.Fragments.Settings.root);
            const fragmentImages = Utils.getElement(Constants.Ids.Fragments.Images.root);

            if (revealOption !== Constants.VisibilityOptions.revealEditor && !Utils.confirmCancelEdit()) {
                return;
            }

            if (revealOption === Constants.VisibilityOptions.revealEditor) {
                Utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = true;
            } else {
                Utils.getElement(Constants.Ids.Fragments.Navigation.buttonSave).disabled = false;
            }

            fragmentEditor.style.display = Constants.Display.none;
            fragmentPreview.style.display = Constants.Display.none;
            fragmentSettings.style.display = Constants.Display.none;
            fragmentImages.style.display = Constants.Display.none;

            if (revealOption === Constants.VisibilityOptions.revealEditor) {
                fragmentEditor.style.display = Constants.Display.block;
            } else if (revealOption === Constants.VisibilityOptions.revealPreview) {
                fragmentPreview.style.display = Constants.Display.block;
            } else if (revealOption === Constants.VisibilityOptions.revealSettings) {
                fragmentSettings.style.display = Constants.Display.block;
            } else if (revealOption === Constants.VisibilityOptions.revealImages) {
                fragmentImages.style.display = Constants.Display.block;
            }
        }
    };

    const Settings = {
        nextOrder: [],

        updateTitle: () => {
            hasUnsavedChanges = true;

            const titleValue = Utils.getElement(Constants.Ids.Fragments.Settings.inputTitle).value;
            state.title = titleValue;

            Navigation.updateTitle(titleValue);
        },

        resetTitle: () => {
            Utils.getElement(Constants.Ids.Fragments.Settings.inputTitle).value = state.title;
        },

        updateOrderTable: () => {
            if (Settings.nextOrder.length === 0) {
                Settings.nextOrder = state.order.slice()
            }

            const headerMarkup = '<tr><td>Page Name</td><td>Up</td><td>Down</td></tr>';

            const orderTable = Utils.getElement(Constants.Ids.Fragments.Settings.orderTable);
            orderTable.innerHTML = headerMarkup;

            for (let i = 0; i < Settings.nextOrder.length; i++) {
                const page = Utils.getPage(Settings.nextOrder[i]);

                const row = document.createElement('tr');

                const nameCell = document.createElement('td');
                nameCell.innerHTML = `<strong>${page.title}</strong>`;
                row.appendChild(nameCell);

                const upButtonCell = document.createElement('td');
                const upButton = document.createElement('button');
                upButton.innerText = 'Move Up';
                upButton.onclick = () => Settings.moveUp(page.slug);
                upButtonCell.appendChild(upButton);
                row.appendChild(upButtonCell);

                const downButtonCell = document.createElement('td');
                const downButton = document.createElement('button');
                downButton.innerText = 'Move Down';
                downButton.onclick = () => Settings.moveDown(page.slug);
                downButtonCell.appendChild(downButton);
                row.appendChild(downButtonCell);

                orderTable.appendChild(row);
            }
        },

        moveUp: (slug) => {
            const index = Settings.nextOrder.indexOf(slug);
            if (index === 0) {
                return;
            }

            const temp = Settings.nextOrder[index - 1];
            Settings.nextOrder[index - 1] = Settings.nextOrder[index];
            Settings.nextOrder[index] = temp;
            Settings.updateOrderTable();
        },

        moveDown: (slug) => {
            const index = Settings.nextOrder.indexOf(slug);
            if (index >= Settings.nextOrder.length - 1) {
                return;
            }

            const temp = Settings.nextOrder[index + 1];
            Settings.nextOrder[index + 1] = Settings.nextOrder[index];
            Settings.nextOrder[index] = temp;
            Settings.updateOrderTable();
        },

        resetOrder: () => {
            Settings.nextOrder = state.order.slice();
            Settings.updateOrderTable()
        },

        saveReorder: () => {
            hasUnsavedChanges = true;
            state.order = Settings.nextOrder.slice();
            Navigation.updateNavList();
        },

        importData: () => {
            let newState = Utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value;
            try {
                newState = JSON.parse(newState);
            } catch (error) {
                return alert('The data provided could not be parsed as JSON. Error: ' + error);
            }

            if (!Persistence.validateState(newState)) {
                return;
            }

            if (!confirm('This action will overwrite all data in the current Notebook. Are you sure you want to continue?')) {
                return;
            }

            state = newState;

            Utils.getElement(Constants.Ids.stateContainer).innerText = newState;
            Persistence.rehydrateState();
        },

        displayData: () => {
            Utils.getElement(Constants.Ids.Fragments.Settings.dataArea).value = JSON.stringify(state);
        }
    };
    // ===== ===== Settings Functions ===== =====

    // ===== ===== Image Functions ===== =====
    const Images = {
        embed: () => {
            const imageNameInput = Utils.getElement(Constants.Ids.Fragments.Images.imageName);
            const imageName = imageNameInput.value.trim();
            if (!imageName || imageName === '') {
                return;
            }

            if (Images.doesNameExist(imageName)) {
                return alert('An image with that name has already been embeded. Each image name must be unique.');
            }

            const imageInput = Utils.getElement(Constants.Ids.Fragments.Images.imageInput);
            if (!imageInput.files || !imageInput.files.length || imageInput.files.length === 0) {
                return;
            }

            const reader = new FileReader();
            reader.onloadend = function() {
                state.images.push({
                    name: imageName,
                    data: reader.result
                });

                imageInput.value = null;
                imageNameInput.value = null;

                hasUnsavedChanges = true;
                Images.updateImageList();
            }
            reader.readAsDataURL(imageInput.files[0]);
        },

        doesNameExist: (newImageName) => state.images.map(image => image.name)
                .indexOf(newImageName) !== -1,

        updateImageList: () => {
            const imageTable = Utils.getElement(Constants.Ids.Fragments.Images.imageTable);
            imageTable.innerHTML = '<tr><td>Image</td><td>Name</td><td>Delete</td></tr>';

            for (let i = 0; i < state.images.length; i++) {
                const row = document.createElement('tr');

                const imagecell = document.createElement('td');
                const image = document.createElement('img');
                image.setAttribute('src', state.images[i].data);
                image.style.maxWidth = '300px';
                image.style.maxHeight = '300px';
                imagecell.appendChild(image);
                row.appendChild(imagecell);

                const imageNameCell = document.createElement('td');
                imageNameCell.innerText = state.images[i].name;
                row.appendChild(imageNameCell);

                const buttonCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.innerText = 'Delete';
                buttonCell.appendChild(deleteButton);
                deleteButton.onclick = () => Images.deleteImage(state.images[i].name);
                row.append(buttonCell);

                imageTable.append(row);
            }
        },

        deleteImage: (imageName) => {
            if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
                return;
            }

            hasUnsavedChanges = true;
            state.images = state.images.filter(image => image.name !== imageName);
            Images.updateImageList();
        }
    };
    // ===== ===== Image Functions ===== =====

    window.onload = () => {
        Persistence.rehydrateState();

        // Preview buttons
        Utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Preview.buttonEdit,
                callback: () => Editor.editPage(currentPage)
            },
            {
                id: Constants.Ids.Fragments.Preview.buttonDelete,
                callback: () => Preview.deletePage(currentPage)
            }
        ]);

        // Editor buttons
        Utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Editor.buttonUpdate,
                callback: () => Editor.updatePage()
            },
            {
                id: Constants.Ids.Fragments.Editor.buttonCancel,
                callback: () => Preview.previewPage(currentPage)
            }
        ])

        // Navigation buttons
        Utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Navigation.buttonSave,
                callback: () => Persistence.save()
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonNewPage,
                callback: () => Editor.editPage()
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonSettings,
                callback: () => Visibility.showSettings()
            },
            {
                id: Constants.Ids.Fragments.Navigation.buttonImages,
                callback: () => Visibility.showImages()
            }
        ]);

        // Settings buttons
        Utils.registerButtonClicks([
            {
                id: Constants.Ids.Fragments.Settings.buttonResetOrder,
                callback: () => Settings.resetOrder()
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonSaveOrder,
                callback: () => Settings.saveReorder()
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonUpdateTitle,
                callback: () => Settings.updateTitle()
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonResetTitle,
                callback: () => Settings.resetTitle()
            },
            {
                id: Constants.Ids.Fragments.Settings.buttonDataImport,
                callback: () => Settings.importData()
            }
        ])

        // Image buttons
        Utils.getElement(Constants.Ids.Fragments.Images.buttonEmbed).onclick = () => Images.embed();

        Utils.resize();
        window.onresize = () => Utils.resize();
        window.onbeforeunload = () => Utils.beforeUnload();
    };
})();