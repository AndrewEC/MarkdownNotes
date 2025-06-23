class Search {

    #appState = null;
    #utils = null;
    #visible = false;
    #currentQuery = '';

    constructor(appState, utils) {
        this.#appState = appState;
        this.#utils = utils;
        this.#listenForVisibilityChanges();
        this.#listenForSearchChanges();
    }

    #listenForSearchChanges() {
        const thisRef = this;
        setInterval(() => {
            if (!thisRef.#visible) {
                return;
            }

            const nextQuery = new URLSearchParams(window.location.search).get('query');
            if (nextQuery === thisRef.#currentQuery) {
                return;
            }
            thisRef.#currentQuery = nextQuery;

            this.#performSearch();
        }, 100);
    }

    #listenForVisibilityChanges() {
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                const nextState = mutation.target.style.display === Constants.Display.block;
                if (nextState === this.#visible) {
                    return;
                }
                this.#visible = nextState;

                if (this.#visible) {
                    this.#performSearch();
                } else {
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

        const resultContainer = this.#utils.getElement(Constants.Ids.Fragments.Search.resultsContainer);
        resultContainer.innerHTML = `<p>Search results for: <strong>${query}</strong></p>`;

        const results = this.#findOccurrences(query);
        if (Object.keys(results).length === 0) {
            resultContainer.innerHTML += '<p>No results found.</p>';
            return;
        }

        for (const pageSlug in results) {
            const page = this.#appState.pages.find((page) => page.slug === pageSlug)
            const resultSection = this.#buildResultSection(page, results[pageSlug], query);
            resultContainer.appendChild(resultSection);
        }
    }

    #buildResultSection(page, indexes, query) {
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

        for (const index of indexes) {
            const paragraph = document.createElement('p');
            const highlightedResult = this.#highlightResult(page.contents, index, query);
            paragraph.innerHTML = this.#extractHighlightedSection(highlightedResult, index, query);
            container.appendChild(paragraph);
        }

        return container
    }

    #highlightResult(pageContents, index, query) {
        return pageContents.slice(0, index)
            + '<span class="search-highlight">'
            + pageContents.slice(index, index + query.length)
            + '</span>'
            + pageContents.slice(index + query.length, pageContents.length);
    }

    #extractHighlightedSection(pageContents, index, query) {
        const start = Math.max(0, index - 100);
        const end = Math.min(pageContents.length, index + query.length + 100);
        return pageContents.slice(start, end);
    }

    #findOccurrences(query) {
        const results = {};

        for (const page of this.#appState.pages) {
            const indexes = this.#findAllOccurrencesOnPage(page, query);
            if (indexes.length > 0) {
                results[page.slug] = indexes;
            }
        }

        return results;
    }

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