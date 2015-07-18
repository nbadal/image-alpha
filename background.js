function getOptions() {
    return localStorage.options ? JSON.parse(localStorage.options) : {};
}

function saveOptions(options) {
    localStorage.options = JSON.stringify(options);
}

function sendToTab(trans, color) {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                setBackground: {
                    trans: trans,
                    color: color
                }
            });
        });
    });
}

function updateContextMenu() {
    var options = getOptions();
    var checked = 'solid';
    if (!options.enabled) {
        checked = 'disabled';
    } else if (options.transparent) {
        checked = 'transparent';
    }
    chrome.contextMenus.update(checked, {
        checked: true
    });
    chrome.contextMenus.update('selectColor', {
        enabled: options.enabled
    });
}

function setTransparencyGrid() {
    var options = getOptions();
    options.transparent = true;
    options.enabled = true;
    saveOptions(options);
    sendToTab(true, null);
    updateContextMenu();
}

function setSolidColor(color) {
    var options = getOptions();
    if (!options.enabled) {
        enableColorSelector(true);
    }
    options.transparent = false;
    options.solidColor = color;
    options.enabled = true;
    saveOptions(options);
    sendToTab(false, options.solidColor);
    updateContextMenu();
}

function chooseSolidColor(info, tab) {
    chrome.tabs.query({}, function (tabs) {
        tabs.forEach(function (tab) {
            chrome.tabs.sendMessage(tab.id, {
                selectColor: true
            });
        });
    });
}

function setDisabled() {
    var options = getOptions();
    options.enabled = false;
    saveOptions(options);
    sendToTab(false, null);
    updateContextMenu();
}

function addContextMenu() {
    var options = getOptions();
    chrome.contextMenus.create({
        id: 'transparent',
        type: 'radio',
        title: 'Transparency Grid',
        contexts: ['all'],
        onclick: setTransparencyGrid,
        checked: options.transparent && options.enabled
    });
    chrome.contextMenus.create({
        id: 'solid',
        type: 'radio',
        title: 'Solid Color',
        contexts: ['all'],
        onclick: setSolidColor,
        checked: !options.transparent && options.enabled
    });
    chrome.contextMenus.create({
        id: 'disabled',
        type: 'radio',
        title: 'Disabled',
        contexts: ['all'],
        onclick: setDisabled,
        checked: !options.enabled
    });
    chrome.contextMenus.create({
        type: 'separator'
    });
    chrome.contextMenus.create({
        id: 'selectColor',
        type: 'normal',
        title: 'Select Solid Color...',
        contexts: ['all'],
        onclick: chooseSolidColor,
        enabled: options.enabled
    });
}

function init() {
    var options = localStorage.options ? JSON.parse(localStorage.options) : null;
    if (!options) {
        options = {
            solidColor: '#000000',
            transparent: true,
            enabled: true
        };
    }
    saveOptions(options);
    addContextMenu();
}

init();

chrome.runtime.onConnect.addListener(function () {
    var options = getOptions();
    if (options.enabled) {
        sendToTab(options.transparent, options.solidColor);
    }
});

chrome.runtime.onMessage.addListener(function (req) {
    if (req.changeColor) {
        setSolidColor(req.changeColor.color);
    }
});