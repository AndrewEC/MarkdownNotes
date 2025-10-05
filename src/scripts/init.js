window.onload = () => {

    const appState = new AppState();
    const utils = new Utils(appState);
    const visibility = new Visibility(utils);

    const editor = new Editor(appState, visibility, utils);
    const persistence = new Persistence(appState, utils);
    const navigation = new Navigation(appState, utils, visibility);
    const settings = new Settings(appState, utils, persistence);
    const finder = new Finder(appState, utils);
    new Preview(appState, utils, visibility);
    new Images(appState, utils);
    new Search(appState, utils);

    const keyboardHandlers = [
        finder,
        editor,
        navigation,
        settings
    ];

    const resizeHandlers = [
        utils,
        finder
    ];

    // Load the app state.
    persistence.rehydrateState();

    // Global keyboard shortcuts.
    window.onkeydown = (e) => {
        for (const fragment of keyboardHandlers) {
            if (fragment.onKeyPressed(e)) {
                e.preventDefault();
                break;
            }
        }
    };

    // Resize handlers.
    const doResize = () => {
        for (const fragment of resizeHandlers) {
            fragment.resize();
        }
    };
    doResize();
    window.onresize = doResize;

    // Misc. event handlers.
    window.onbeforeunload = () => utils.beforeUnload();
};