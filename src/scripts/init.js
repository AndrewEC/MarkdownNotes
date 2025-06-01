window.onload = () => {

    const appState = new AppState();
    const utils = new Utils(appState);
    const visibility = new Visibility(utils);

    const editor = new Editor(appState, visibility, utils);
    const persistence = new Persistence(appState, editor, utils);
    new Images(appState, utils);
    const navigation = new Navigation(appState, utils, visibility);
    const preview = new Preview(appState, utils, visibility);
    const settings = new Settings(appState, utils, persistence);

    persistence.rehydrateState();

    utils.registerButtonClicks([
        {
            id: Constants.Ids.Fragments.Navigation.buttonSave,
            callback: () => {
                if (editor.isShowingEditor()) {
                    return;
                }
                settings.hideDataArea();
                persistence.save();
            }
        }
    ]);

    window.onkeydown = (e) => {
        switch (e.keyCode) {
            case Constants.KeyCodes.escape:
                if (editor.isShowingEditor()) {
                    visibility.showPreview();
                    e.preventDefault();
                    return;
                }
                break;
        }

        if (!e.ctrlKey) {
            return;
        }

        const isPreviewingPage = () => !editor.isShowingEditor()
            && !visibility.isImagesPageVisible()
            && !visibility.isSettingsPageVisible()

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
            case Constants.KeyCodes.escape:
                if (editor.isShowingEditor()) {
                    visibility.showPreview();
                    e.preventDefault();
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
        }
    };

    utils.resize();
    window.onresize = () => utils.resize();
    window.onbeforeunload = () => utils.beforeUnload();
    navigation.listenForUrlChange();
};