window.onload = () => {

    // Utilities and state.
    const appState = new AppState();
    const utils = new Utils(appState);
    const visibility = new Visibility(utils);
    const persistence = new Persistence(appState, utils);

    // Fragments
    const editor = new Editor(appState, visibility, utils);
    const navigation = new Navigation(appState, utils);
    const settings = new Settings(appState, utils, persistence, visibility);
    const finder = new Finder(appState, utils);
    new Preview(appState, utils, visibility);
    new Images(appState, utils, visibility);
    new Search(appState, utils, visibility);

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