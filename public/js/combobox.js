'use strict';

// Define values for key codes
const VK_ENTER = 13;
const VK_ESC = 27;
const VK_UP = 38;
const VK_DOWN = 40;

let LAST_ID = 0;

/**
 * Generate a unique DOM ID.
 * @return {string}
 */
function nextId() {
    let id = ':' + LAST_ID;
    LAST_ID++;
    return id;
}

/**
 * @constructor
 * Implements a minimal combo box: a text field with a list of options which pops up when the text
 * field is focused.
 * Use arrow keys or mouse to choose from available options.
 * @param {Element} el The text field element to decorate.
 * @param {Element} listEl The listbox element to associate with this text field; also decorates
 *     it with the `ListBox` pattern.
 */
function ComboBox(el, listEl) {
    this.el = el;
    this.listbox = new ListBox(listEl, this);
    listEl.id = nextId();

    this.el.addEventListener('focus', this.handleFocus.bind(this), true);
    this.el.addEventListener('blur', this.handleBlur.bind(this), true);
    this.el.addEventListener('input', this.handleInput.bind(this));
    this.el.addEventListener('keydown', this.handleKeyDown.bind(this));
}

ComboBox.prototype = {
    set value(val) {
        this.el.value = val;
    },

    showListbox: function (target) {
        this.listbox.show(target);
        this.el.setAttribute('aria-expanded', true);
    },

    hideListbox: function () {
        this.listbox.hide();
        this.el.setAttribute('aria-expanded', false);
        this.el.removeAttribute('aria-activedescendant');
    },

    handleFocus: function (e) {
        this.showListbox(e.target);
    },

    handleBlur: function (e) {
        this.hideListbox();
    },

    handleInput: function (e) {
        this.showListbox(e.target);
        this.listbox.filter(this.el.value);
    },

    handleKeyDown: function (e) {
        switch (e.keyCode) {
            case VK_DOWN:
                if (!this.listbox.hidden) {
                    this.listbox.nextActiveListItem();
                }
                break;
            case VK_UP:
                if (!this.listbox.hidden) {
                    this.listbox.previousActiveListItem();
                }
                break;
            case VK_ENTER:
                let active = this.listbox.activeItem;
                if (!active)
                    break;
                this.setSelected(active);
                this.hideListbox();
                break;
            case VK_ESC:
                this.hideListbox();
                break;
        }
    },

    setSelected: function (el) {
        this.value = el.textContent;
        updateRestaurants();
    },

    /**
     * Sets the aria-activedescendant value of the textbox to the ID of the given element.
     * @param {Element} el
     */
    setActiveDescendant: function (el) {
        if (!el.id)
            return;
        this.el.setAttribute('aria-activedescendant', el.id);
    }
};

/**
 * @constructor
 * @param {Element} el The element to decorate as a listbox.
 * @param {textbox} textbox The textbox which controls this listbox in a combobox pattern.
 */
function ListBox(el, textbox) {
    this.el = el;
    this.textbox = textbox;
    this.items = Array.prototype.slice.call(el.querySelectorAll('[role=option]'));
    for (let i = 0; i < this.items.length; i++) {
        let item = this.items[i];
        item.id = nextId();

        item.addEventListener('mouseover', this.handleHoverOnItem.bind(this));
        item.addEventListener('mousedown', this.handleClickOnItem.bind(this), true);
    }

    this.visibleItems = this.items.slice();
}


ListBox.prototype = {
    toggle: function () {
        if (this.hidden) {
            this.show();
        } else {
            this.hide();
        }
    },

    get hidden() {
        return this.el.hasAttribute('hidden');
    },

    get activeItem() {
        return this.el.querySelector('[role=option].active');
    },

    filter: function (str) {
        this.visibleItems = [];
        let foundItems = 0;
        for (let item of this.items) {
            if (item.textContent.toLowerCase().startsWith(str.toLowerCase())) {
                foundItems++;
                item.hidden = false;
                this.visibleItems.push(item);
            } else {
                item.hidden = true;
                item.classList.remove('active');
            }
        }
        if (foundItems === 0) {
            this.hide();
        } else {
            for (let i = 0; i < this.visibleItems.length; i++) {
                let item = this.visibleItems[i];
                item.setAttribute('aria-posinset', i + 1);
                item.setAttribute('aria-setsize', this.visibleItems.length);
            }
        }
    },

    show: function (target) {
        if (!this.hidden)
            return;
        this.el.style.width = `${target.offsetWidth}px`;
        this.el.style.left = `${target.offsetLeft}px`;
        this.el.removeAttribute('hidden');
    },

    hide: function () {
        if (this.hidden)
            return;

        if (this.activeItem)
            this.activeItem.classList.remove('active');
        this.el.setAttribute('hidden', '');
    },

    handleHoverOnItem: function (e) {
        let newIdx = this.visibleItems.indexOf(e.target);
        if (newIdx < 0)
            return;
        this.changeActiveListitem(newIdx);
    },

    handleClickOnItem: function (e) {
        let item = e.target;
        if (this.items.indexOf(item) < 0)
            return;
        this.textbox.setSelected(item);
        this.hide();
    },

    nextActiveListItem: function () {
        let active = this.activeItem;
        let activeIdx = -1;
        if (active)
            activeIdx = this.visibleItems.indexOf(active);

        let newIdx = activeIdx;
        newIdx = (newIdx + 1) % this.visibleItems.length;
        this.changeActiveListitem(newIdx);
    },

    previousActiveListItem: function () {
        let active = this.activeItem;
        let activeIdx = -1;
        if (active)
            activeIdx = this.visibleItems.indexOf(active);

        let newIdx = activeIdx;
        newIdx--;
        if (newIdx < 0)
            newIdx += this.visibleItems.length;

        this.changeActiveListitem(newIdx);
    },

    changeActiveListitem: function (newIdx) {
        let active = this.activeItem;
        let newActive = this.visibleItems[newIdx];
        if (active)
            active.classList.remove('active');
        newActive.classList.add('active');

        this.textbox.setActiveDescendant(newActive);
    }
};