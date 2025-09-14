class Images {

    #logger = new Logger('Images');
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
    }

    #onStatePropertyChanged(propertyName) {
        if (propertyName === Constants.StateProperties.images
            || propertyName === Constants.StateProperties.state) {

            this.#updateImageTable();
        }
    }

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
        const file = imageInput.files[0];
        this.#logger.log(`Embedding image from file: [${file}], with name: [${imageName}].`);
        reader.readAsDataURL(file);
    }

    #doesNameExist(newImageName) {
        return this.#appState.images.map(image => image.name)
            .indexOf(newImageName) !== -1;
    }

    #updateImageTable() {
        const images = this.#appState.images;

        const imageTable = this.#utils.getElement(Constants.Ids.Fragments.Images.imageTable);
        if (images.length === 0) {
            imageTable.innerHTML = '';
            return;
        }

        imageTable.innerHTML = '<tr><td>Image</td><td>Name</td><td>Rename</td><td>Delete</td></tr>';

        const rowTemplate = this.#utils.getElement(Constants.Ids.Fragments.Images.templateTableRow);

        const imagesByName = images.sort((first, second) => first.name.localeCompare(second.name));
        for (let i = 0; i < imagesByName.length; i++) {

            const row = rowTemplate.content.cloneNode(true);

            row.querySelectorAll('img')[0].src = imagesByName[i].data;
            row.querySelectorAll('td')[1].innerText = imagesByName[i].name;

            row.querySelectorAll('a')[0].onclick = () => this.#onUpdateImageNameClicked(imagesByName[i].name);
            row.querySelectorAll('a')[1].onclick = () => this.#onDeleteImageClicked(imagesByName[i].name);

            imageTable.append(row);
        }
    }

    #onUpdateImageNameClicked(currentImageName) {
        let newImageName = prompt('Enter new name for image:');
        if (!newImageName) {
            return;
        }
        newImageName = newImageName.trim();

        if (newImageName.length === 0 || newImageName.includes(' ')) {
            return alert('The image name cannot be empty or contain spaces.');
        } else if (this.#doesNameExist(newImageName)) {
            return alert('Image name cannot be used because another image has that name. All image names must be unique.');
        }

        this.#logger.log(`Updating image name from [${currentImageName}] to [${newImageName}].`);

        const image = this.#appState.images.find(image => image.name === currentImageName);
        image.name = newImageName;

        const index = this.#appState.images.indexOf(image);
        this.#appState.setImage(index, image);
    }

    #onDeleteImageClicked(imageName) {
        if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            return;
        }

        this.#appState.deleteImage(imageName);
    }
}