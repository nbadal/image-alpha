function hasClass(ele, cls) {
    return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

function addClass(ele, cls) {
    if (!hasClass(ele, cls)) ele.className += " " + cls;
}

function removeClass(ele, cls) {
    if (hasClass(ele, cls)) {
        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
        ele.className = ele.className.replace(reg, ' ');
    }
}

function setStyle(cssText) {
    var sheet = document.createElement('style');
    sheet.type = 'text/css';
    (document.head || document.getElementsByTagName('head')[0]).appendChild(sheet);
    return (setStyle = function (cssText, node) {
        if (!node || node.parentNode !== sheet)
            return sheet.appendChild(document.createTextNode(cssText));
        node.nodeValue = cssText;
        return node;
    })(cssText);
}

function changeSolidColor(color, node) {
    return setStyle("body.image-alpha-bg, img.image-alpha-bg { background-color: " + color + " !important; }", node);
}

function applyStyle(element, trans, color) {
    if (trans) {
        addClass(element, 'image-alpha-grid');
        removeClass(element, 'image-alpha-bg');
    } else if (color) {
        addClass(element, 'image-alpha-bg');
        removeClass(element, 'image-alpha-grid');
    } else {
        removeClass(element, 'image-alpha-bg');
        removeClass(element, 'image-alpha-grid');
    }
}

function init() {
    var wholePage = document.body.children.length == 1 && document.body.children[0].tagName == 'IMG';
    var style = changeSolidColor('black');
    var colorPicker = document.createElement('div');
    colorPicker.id = 'colorPicker';
    addClass(colorPicker, 'hidden');
    var input = document.createElement('input');
    colorPicker.appendChild(input);
    document.body.appendChild(colorPicker);
    var changingColor = false;

    var spectrumOptions = {
        flat: true,
        showInput: true,
        preferredFormat: 'hex',
        change: function (color) {
            if (changingColor) {
                changingColor = false;
                chrome.runtime.sendMessage({
                    changeColor: {
                        color: color.toHexString() || '#000000'
                    }
                });
                addClass(colorPicker, 'hidden');
            }
        }
    };
    $(input).spectrum(spectrumOptions);

    chrome.runtime.onMessage.addListener(function (req) {
        if (req.setBackground) {
            if (req.setBackground.color) {
                input.value = req.setBackground.color;
                changeSolidColor(req.setBackground.color, style);
                spectrumOptions.color = req.setBackground.color;
                $(input).spectrum(spectrumOptions);
            }

            var trans = req.setBackground.trans;
            var color = req.setBackground.trans ? false : req.setBackground.color;
            if (wholePage) {
                applyStyle(document.body, trans, color);
            } else {
                var imgs = document.querySelectorAll('html /deep/ img');
                for (var i = 0; i < imgs.length; i++) {
                    var img = imgs[i];
                    applyStyle(img, trans, color);
                }
            }
        } else if (req.selectColor) {
            removeClass(colorPicker, 'hidden');
            changingColor = true;
        }
    });

    chrome.runtime.connect();
}

init();