class Search {

    #highlightSpanStart = '<span class="search-highlight">';
    #highlightSpanEnd = '</span>';
    #numberOfSurroundingCharsToShow = 50;

    #logger = new Logger('Search');

    #appState = null;
    #utils = null;
    #visibility = null;

    #visible = false;
    #currentQuery = '';

    constructor(appState, utils, visibility) {
        this.#appState = appState;
        this.#utils = utils;
        this.#visibility = visibility;

        this.#appState.addPropertyChangedListener(this.#onPropertyChanged.bind(this));

        this.#listenForVisibilityChanges();
    }

    #onPropertyChanged(propertyName) {
        if (propertyName !== Constants.StateProperties.queryParams) {
            return;
        }

        this.#showSearch();
        this.#updateSearch();
    }

    #showSearch() {
        const page = this.#appState.queryParams.get('page');
        if (page === Constants.LocationHashes.search && !this.#visible) {
            this.#logger.log('Showing search page...');
            document.title = `${this.#appState.title} | Search Results`;
            this.#visibility.showSearch();
        }
    }

    #updateSearch() {
        const nextQuery = this.#appState.queryParams.get('query');
        if (!nextQuery) {
            return;
        }

        if (nextQuery === this.#currentQuery) {
            return;
        }
        this.#currentQuery = nextQuery;

        this.#logger.log(`Search detected change in query. Performing search with new query: [${nextQuery}].`);
        this.#performSearch();
    }

    /**
     * Checks to see if the visibility of the main search results area element changes.
     * 
     * Upon the element being hidden all previous search results will be cleared.
     * 
     * Upon the element being shown a search will be executed.
     */
    #listenForVisibilityChanges() {
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                const nextState = mutation.target.style.display === Constants.Display.block;
                if (nextState === this.#visible) {
                    return;
                }
                this.#visible = nextState;

                if (this.#visible) {
                    this.#logger.log('Search result container become visible. Performing search.');
                    this.#performSearch();
                } else {
                    this.#logger.log('Search result container hidden. Removing previous search results.');
                    this.#utils.getElement(Constants.Ids.Fragments.Search.resultsContainer)
                        .innerHTML = '';
                }
            }
        });

        const target = this.#utils.getElement(Constants.Ids.Fragments.Search.root);
        observer.observe(target, { attributes: true, attributeFilter: ['style'] });
    }

    #performSearch() {
        const query = new URLSearchParams(window.location.search).get('query');

        this.#logger.log(`Performing search with query: [${query}].`);

        const resultContainer = this.#utils.getElement(Constants.Ids.Fragments.Search.resultsContainer);
        resultContainer.innerHTML = `<p>Search results for: <strong>${query}</strong></p>`;

        const results = this.#findOccurrences(query);
        const resultCount = Object.keys(results).length;
        if (resultCount === 0) {
            resultContainer.innerHTML += '<p>No results found.</p>';
            return;
        }

        this.#logger.log(`Search produced [${resultCount}] results.`);

        for (const pageSlug in results) {
            const page = this.#appState.pages.find((page) => page.slug === pageSlug);
            const resultSectionElement = this.#buildElementForResultsForPage(page, results[pageSlug], query);
            resultContainer.appendChild(resultSectionElement);
        }

        setTimeout(function() {
            resultContainer.getElementsByTagName('a')[0].focus();
        }, 0);
    }

    /**
     * Creates a single div to display the instances where the input "query"
     * was found within the contents of the input "page".
     * 
     * This div will consist of a link element to navigate the user to the page,
     * and one paragraph element per instance where the "query" was
     * found within the "page" contents.
     * 
     * @param {object} page 
     * @param {array} indexes 
     * @param {string} query 
     * @returns A div HTMLElement.
     */
    #buildElementForResultsForPage(page, indexes, query) {
        const container = document.createElement('div');

        container.appendChild(document.createElement('hr'));

        const pageLink = document.createElement('a');
        pageLink.innerText = page.title;
        pageLink.setAttribute('href', 'javascript:void(0);');
        const thisRef = this;
        pageLink.onclick = () => {
            thisRef.#utils.updateQuery(page.title);
        };
        container.appendChild(pageLink);

        // Iterate through all the matches and create a paragraph that contains
        // a snippet of the text from the page's markdown content that matches
        // the user's query.
        for (const index of indexes) {
            const paragraph = document.createElement('p');
            const highlightedResult = this.#highlightResult(page.contents, index, query);
            paragraph.innerHTML = this.#extractHighlightedSection(highlightedResult, index, query);
            container.appendChild(paragraph);
        }

        return container
    }

    /**
     * Modifies the input "pageContents" to wrap the "query" text
     * within a span element. The Span element specifies a class that
     * applies a background colour to the query text to make it appear
     * highlighted.
     * 
     * For example the given values:
     * - pageContents = This is an example value.
     * - index = 8
     * - query = an
     * 
     * Would result in:
     * - This is <span class="search-highlight">an</span> example value.
     * 
     * @param {string} pageContents The markdown contents of the page.
     * @param {int} index The numerical index representing where the input
     *  query value can be found in the input pageContents.
     * @param {string} query The value the user searched for.
     * @returns The pageContents now containing the inserted span element.
     */
    #highlightResult(pageContents, index, query) {
        return pageContents.slice(0, index)
            + this.#highlightSpanStart
            + pageContents.slice(index, index + query.length)
            + this.#highlightSpanEnd
            + pageContents.slice(index + query.length, pageContents.length);
    }

    /**
     * Extracts the "query" text from the "pageContents" plus up 50 characters
     * that appear before and 50 characters that appear after the "query" text
     * plus the HTML characters that make up the "span" element used to provide
     * a background highlight.
     * 
     * It is expected that the "pageContents" value be the result of the
     * #highlightResult function call.
     * 
     * For example if we are assuming that we are extracting only 5 characters before
     * and after the "query" then given the following values:
     * - pageContents = This is <span class="search-highlight">an</span> example value.
     * - index = 8
     * - query = an
     * 
     * Would result in a value of:
     * - ...s is <span class="search-highlight">an</span> exam...
     */
    #extractHighlightedSection(pageContents, index, query) {
        const start = Math.max(0,
            index - this.#numberOfSurroundingCharsToShow - this.#highlightSpanStart.length);

        const end = Math.min(pageContents.length,
            index + query.length + this.#numberOfSurroundingCharsToShow + this.#highlightSpanEnd.length);

        let surroundingContent = pageContents.slice(start, end);
        if (start > 0) {
            surroundingContent = '...' + surroundingContent;
        }
        if (end < pageContents.length - 1) {
            surroundingContent = surroundingContent + '...';
        }

        return surroundingContent;
    }

    /**
     * Iterates through all the pages within the global app state
     * to find pages whose contents contains at least one instance of
     * the user's search "query".
     * 
     * @param {string} query The value the user is searching for.
     * @returns An object with the keys representing the slug of the page
     *  and the value representing the indexes of the matches. If no matches
     *  are found within a page the page slug will not be found in the list
     *  keys in the resulting object.
     */
    #findOccurrences(query) {
        const results = {};

        for (const page of this.#appState.getPagesInOrder()) {
            const indexes = this.#findAllOccurrencesOnPage(page, query);
            if (indexes.length > 0) {
                results[page.slug] = indexes;
            }
        }

        return results;
    }

    /**
     * Finds the indexes of all the instances of the input "searchQuery"
     * within the "page.contents".
     * 
     * @param {object} page The page from which the page contents will be pulled.
     * @param {string} searchQuery The user's search term to locate within the page contents.
     * @returns An array of numbers representing the indexes within the page content
     *  that matches the input searchQuery.
     */
    #findAllOccurrencesOnPage(page, searchQuery) {
        const indexes = [];
        for (let i = 0; i < page.contents.length; i++) {
            const index = page.contents.indexOf(searchQuery, i);
            if (index === -1) {
                break;
            }
            indexes.push(index);
            i = index + searchQuery.length;
        }
        return indexes;
    }
}