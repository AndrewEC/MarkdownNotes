# MarkdownNotes

MarkdownNotes is a single, self-contained, HTML file that provides functionality to edit and view Markdown formatted text in a Notebook esque format.

All of the functionality is outlined in the [Getting_Started.html](./Getting_Started.html) HTML file.

An empty file ready for editing is available at [MarkdownNotes.html](./MarkdownNotes.html).

### Updating

To update MarkdownNotes simply make a change to any of the source files provided then run the `Bundle.ps1` script.

This script will combine all the source files into a single html file and write it to `./build/MarkdownNotes.html`

### Architecture

This project attempts to stay relatively simple. It does not require any special build tools (except for the `Bundle.ps1` script), node/npm, or many external dependencies (the dependencies are listed below).

#### Fragments
The app's source is broken down into fragments. A fragment will consist of a partial html file and a single script file. These files are ultimately combined into the resulting bundle file.

The script handles things related to the fragment like listening for button presses or managing the fragment's state.

#### State Management
The global, serializable, properties of the app are located in the `State` class in the `state.js` file. A singleton instance of this class is shared among all the fragments.

Fragments can update upon the change of a certain property within the global state by registering a callback using the `State.addPropertyChangedListener` method.

Whenever a certain property within the state is updated the callback will be invoked and provided the name of the property that changed.

Generally, fragments should not talk to eachother directly. Rather, they should push updates to the global state so other fragments can be alerted to the change of said state.

### Versions
There are two versions within the app. One is the app's version and the other is the save data version. These two versions don't necessarily correlate with eacother. The save version is only incremented whenever the schema of the serializable data changes.

This version is used by the app to determine how to "upgrade" the save data from an older version to a newer version and to properly validate the state properties.

The app version version works like most other versioning systems and the current version of the app can be found in the `Settings` page of MarkdownNotes.

### Dependencies:
* EasyMDE - https://github.com/Ionaru/easy-markdown-editor
* Marked - https://github.com/markedjs/marked
* Font-Awesome - https://github.com/FortAwesome/Font-Awesome
