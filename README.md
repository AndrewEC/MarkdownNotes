# MarkdownNotes

MarkdownNotes is a single, self-contained, HTML file that provides functionality to edit and view Markdown formatted text in a Notebook esque format.

The getting started documentation is provided a the [Getting_Started.html](./Getting_Started.html) HTML file.

An empty file ready for editing is available at [MarkdownNotes.html](./MarkdownNotes.html).

This project is heavily inspired by [FeatherWiki](https://codeberg.org/Alamantus/FeatherWiki). Though inspired by, this project has different goals and features like a built-in markdown editor using EasyMDE, an "autosave" system, and fewer additional bells and whistles to keep things simple. This project also produces a much larger file. If you are looking for something easier to redistribute check out [FeatherWiki](https://codeberg.org/Alamantus/FeatherWiki) or [TiddlyWiki](https://tiddlywiki.com/)

---

### Updating

To update MarkdownNotes simply make a change to any of the source files provided then run the `Bundle.ps1` script.

This script will combine all the source files into a single html file and write it to `./build/MarkdownNotes.html`

---

### Architecture
This project attempts to stay relatively simple. It does not require any special build tools (except for the `Bundle.ps1` script), node/npm, and only a few external dependencies (dependencies are listed at the bottom of this readme).

#### Fragments
The app's source is broken down into fragments. A fragment will consist of a partial .html file and a single .js file. These files are ultimately combined into the resulting bundle file.

The partial .html files are located in `src/markup` and the .js files are located in `src/scripts`. Generally there should be a single .html file and a single .js file per fragment with matching names.

The .html files contain the markup for the fragment. The .js files contain any state specific to the fragment, handle updating the fragment upon certain state changes, and provide callbacks for things like button click events.

#### State Management
The global, serializable, properties of the app are located in the `State` class in the `state.js` file. A singleton instance of this class is shared among all the fragments.

Fragments can make updates to the state via the property getters and setters and also receive updates whenever the state changes. Fragments can register a callback via `State.addPropertyChangedListener`. The callback will be invoked whenever certain properties of the global state are changed and said callback will be provided a single parameter which is the name of the property that changed.

Fragments should not talk to eachother directly. Rather, they should push updates to the global state and other fragments should listen for state changes and update accordingly.

#### Dependencies:
This project relies on the following dependencies:
* EasyMDE - https://github.com/Ionaru/easy-markdown-editor
* Marked - https://github.com/markedjs/marked
* Font-Awesome - https://github.com/FortAwesome/Font-Awesome

The dependencies are embedded directly into the resulting bundle file. A loose copy of the above dependencies can be found in the `src/deps` folder.

---

### Versions
There are two versions within the app. One is the app's version and the other is the save data version. These two versions don't necessarily correlate with eacother. The save version is only incremented whenever the schema of the serializable data changes.

This version is used by the app to determine how to "upgrade" the save data from an older version to a newer version and to properly validate the state properties.

The app version version works like most other versioning systems and the current version of the app can be found in the `Settings` page of MarkdownNotes.
