window.onload = () => {

    // Initialize the fragments.
    const appState = new AppState();
    const utils = new Utils(appState);
    const visibility = new Visibility(utils);

    const editor = new Editor(appState, visibility, utils);
    const persistence = new Persistence(appState, editor, utils);
    const navigation = new Navigation(appState, utils, visibility);
    const preview = new Preview(appState, utils, visibility);
    const settings = new Settings(appState, utils, persistence);
    const finder = new Finder(appState, utils);

    new Images(appState, utils);
    new Search(appState, utils);

    // Load the app state.
    persistence.rehydrateState();

    // Register the button that allows the user to save the
    // current notebook to file.
    utils.registerButtonClicks([
        {
            id: Constants.Ids.Fragments.Navigation.buttonSave,
            callback: () => {
                if (editor.isShowingEditor() || finder.isVisible()) {
                    return;
                }
                settings.hideDataArea();
                persistence.save();
            }
        }
    ]);

    // Global keyboard shortcuts.
    window.onkeydown = (e) => {
        switch (e.keyCode) {
            case Constants.KeyCodes.escape:
                if (editor.isShowingEditor()) {
                    visibility.showPreview();
                    e.preventDefault();
                    return;
                } else if (finder.isVisible()) {
                    finder.hide();
                    e.preventDefault();
                    return;
                }
                break;
            
            case Constants.KeyCodes.tab:
                if (finder.isVisible()) {
                    finder.onTabPressed(e);
                    return;
                }
                break;
        }

        if (!e.ctrlKey) {
            return;
        }

        const isPreviewingPage = () => !editor.isShowingEditor()
            && !visibility.isImagesPageVisible()
            && !visibility.isSettingsPageVisible();

        switch (e.keyCode) {
            case Constants.KeyCodes.s:
                if (editor.isShowingEditor()) {
                    editor.updatePage();
                } else {
                    settings.hideDataArea();
                    persistence.save();
                }
                e.preventDefault();
                break;
            case Constants.KeyCodes.n:
                e.preventDefault();
                if (!editor.isShowingEditor()) {
                    navigation.createNewPage();
                }
                break;
            case Constants.KeyCodes.e:
                e.preventDefault();
                if (isPreviewingPage()) {
                    editor.editPage();
                }
                break;
            case Constants.KeyCodes.comma:
                if (isPreviewingPage()) {
                    preview.previewPreviousPage();
                }
                e.preventDefault();
                break;
            case Constants.KeyCodes.period:
                if (isPreviewingPage()) {
                    preview.previewNextPage();
                }
                e.preventDefault();
                break;
            case Constants.KeyCodes.g:
                if (!editor.isShowingEditor()) {
                    finder.present();
                    finder.resize();
                }
                e.preventDefault();
                break;
        }
    };

    // Misc. event listeners.
    utils.resize();
    finder.resize();
    window.onresize = () => {
        utils.resize();
        finder.resize();
    };
    window.onbeforeunload = () => utils.beforeUnload();
    navigation.listenForUrlChange();
};