class Search {

    #highlightSpanStart = '<span class="search-highlight">';
    #highlightSpanEnd = '</span>';

    #logger = new Logger('Search');

    #appState = null;
    #utils = null;
    #visible = false;
    #currentQuery = '';

    constructor(appState, utils) {
        this.#appState = appState;
        this.#utils = utils;
        this.#listenForVisibilityChanges();
        this.#listenForUrlChanges();
    }

    #listenForUrlChanges() {
        const thisRef = this;
        setInterval(() => {
            if (!thisRef.#visible) {
                return;
            }

            const nextQuery = new URLSearchParams(window.location.search).get('query');
            if (nextQuery === thisRef.#currentQuery) {
                return;
            }
            thisRef.#logger.log(`Search detected change in query. Performing search with new query: [${query}].`);
            thisRef.#currentQuery = nextQuery;

            this.#performSearch();
        }, 100);
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
        if (Object.keys(results).length === 0) {
            resultContainer.innerHTML += '<p>No results found.</p>';
            return;
        }

        this.#logger.log(`Search produced [${results.length}] results.`);

        for (const pageSlug in results) {
            const page = this.#appState.pages.find((page) => page.slug === pageSlug)
            const resultSectionElement = this.#buildElementForResultsForPage(page, results[pageSlug], query);
            resultContainer.appendChild(resultSectionElement);
        }
    }

    /**
     * Creates a single div to display the instances where the input "query"
     * was found within the contents of the input "page".
     * 
     * This div will consist of a link element to navigate the user to the page,
     * and one paragraph element to show each instance where the "query" was
     * found within the "page" contents.
     * 
     * @param {object} page 
     * @param {array} indexes 
     * @param {string} query 
     * @returns A div HTMLElement.
     */
    #buildElementForResultsForPage(page, indexes, query) {
        // All elements to be created will be contained within this div.
        const container = document.createElement('div');

        container.appendChild(document.createElement('hr'));

        // Create a link that, onclick, will trigger a function to update
        // the page query element to navigate the user to the selected page.
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
     * Surrounds part of the "pageContents" with a span element
     * so the "query" value, as it appears within the "pageContents", can be
     * highlighted and displayed to the user.
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

    #extractHighlightedSection(pageContents, index, query) {
        const start = Math.max(0, index - 50 - this.#highlightSpanStart.length);
        const end = Math.min(pageContents.length, index + query.length + 50 + this.#highlightSpanEnd.length);

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
            i = index;
        }
        return indexes;
    }
}