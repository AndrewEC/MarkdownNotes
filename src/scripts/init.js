window.onload = () => {

    const appState = new AppState();
    const utils = new Utils();
    const visibility = new Visibility(utils);

    const editor = new Editor(appState, visibility, utils);
    const persistence = new Persistence(appState, editor, utils);
    new Images(appState, utils);
    const navigation = new Navigation(appState, utils, visibility);
    new Preview(appState, utils, visibility);
    new Settings(appState, utils, persistence);

    utils.state = appState;

    persistence.rehydrateState();

    utils.registerButtonClicks([
        {
            id: Constants.Ids.Fragments.Navigation.buttonSave,
            callback: () => {
                if (editor.isShowingEditor()) {
                    return;
                }
                persistence.save();
            }
        }
    ]);

    utils.resize();
    window.onresize = () => utils.resize();
    window.onbeforeunload = () => utils.beforeUnload();
    navigation.listenForUrlChange();
};