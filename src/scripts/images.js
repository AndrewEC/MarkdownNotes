class Images {

    #appState = null;
    #utils = null;

    constructor(appState, utils) {
        this.#appState = appState;
        this.#utils = utils;
        this.#appState.addPropertyChangedListener(this.#onStatePropertyChanged.bind(this));
        this.#registerButtonClickEvents();
    }

    #registerButtonClickEvents() {
        this.#utils.getElement(Constants.Ids.Fragments.Images.buttonEmbed)
            .onclick = this.#onEmbedImageClicked.bind(this);
    };

    #onStatePropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.images
            || propertyName === Constants.StateProperties.state) {

            this.#updateImageList();
        }
    };

    #onEmbedImageClicked() {
        const imageNameInput = this.#utils.getElement(Constants.Ids.Fragments.Images.imageName);
        const imageName = imageNameInput.value.trim();
        if (!imageName || imageName === '') {
            return;
        }

        const imageInput = this.#utils.getElement(Constants.Ids.Fragments.Images.imageInput);
        if (!imageInput.files || !imageInput.files.length || imageInput.files.length === 0) {
            return;
        }

        if (this.#doesNameExist(imageName)) {
            return alert('An image with that name has already been embeded. Each image name must be unique.');
        }

        const thisRef = this;
        const reader = new FileReader();
        reader.onloadend = function() {
            thisRef.#appState.addImage({
                name: imageName,
                data: reader.result
            });

            imageInput.value = null;
            imageNameInput.value = null;
        }
        reader.readAsDataURL(imageInput.files[0]);
    };

    #doesNameExist(newImageName) {
        return this.#appState.images.map(image => image.name)
            .indexOf(newImageName) !== -1;
    };

    #updateImageList() {
        const images = this.#appState.images;

        const imageTable = this.#utils.getElement(Constants.Ids.Fragments.Images.imageTable);
        if (images.length === 0) {
            imageTable.innerHTML = '';
            return;
        }

        imageTable.innerHTML = '<tr><td>Image</td><td>Name</td><td>Rename</td><td>Delete</td></tr>';

        const sortedImages = images.sort((first, second) => first.name.localeCompare(second.name));
        for (let i = 0; i < sortedImages.length; i++) {
            const row = document.createElement('tr');

            const imagecell = document.createElement('td');
            const image = document.createElement('img');
            image.setAttribute('src', sortedImages[i].data);
            image.style.maxWidth = '300px';
            image.style.maxHeight = '300px';
            imagecell.appendChild(image);
            row.appendChild(imagecell);

            const imageNameCell = document.createElement('td');
            imageNameCell.innerText = sortedImages[i].name;
            row.appendChild(imageNameCell);

            const updateNameButtonCell = document.createElement('td');
            const updateNameButton = document.createElement('a');
            updateNameButton.href = 'javascript:void(0);';
            updateNameButton.classList.add('standard-button-link');
            updateNameButton.classList.add('standard-table-button-link');
            updateNameButton.innerText = 'Update Name';
            updateNameButton.onclick = () => this.#onUpdateImageNameClicked(sortedImages[i].name);
            updateNameButtonCell.appendChild(updateNameButton);
            row.append(updateNameButtonCell);

            const deleteButtonCell = document.createElement('td');
            const deleteButton = document.createElement('a');
            deleteButton.href = 'javascript:void(0);';
            deleteButton.classList.add('standard-button-link');
            deleteButton.classList.add('standard-table-button-link');
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = () => this.#onDeleteImageClicked(sortedImages[i].name);
            deleteButtonCell.appendChild(deleteButton);
            row.append(deleteButtonCell);

            imageTable.append(row);
        }
    };

    #onUpdateImageNameClicked(currentImageName) {
        let newImageName = prompt('Enter new name for image:');
        if (newImageName === null) {
            return;
        }
        newImageName = newImageName.trim();

        if (newImageName.length === 0 || newImageName.includes(' ')) {
            return alert('The image name cannot be empty or contain spaces.');
        } else if (this.#doesNameExist(newImageName)) {
            return alert('Image name cannot be used because another image has that name. All image names must be unique.');
        }

        const image = this.#appState.images.find(image => image.name === currentImageName);
        image.name = newImageName;

        const index = this.#appState.images.indexOf(image);
        this.#appState.setImage(index, image);
    };

    #onDeleteImageClicked(imageName) {
        if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            return;
        }

        this.#appState.deleteImage(imageName);
    };
};