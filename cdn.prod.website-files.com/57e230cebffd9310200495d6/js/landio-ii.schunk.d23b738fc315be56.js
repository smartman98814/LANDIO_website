
/*!
 * Webflow: Front-end site library
 * @license MIT
 * Inline scripts may access the api using an async handler:
 *   var Webflow = Webflow || [];
 *   Webflow.push(readyFunction);
 */

"use strict";
(self["webpackChunk"] = self["webpackChunk"] || []).push([["417"], {
12458: (function (module, __unused_webpack_exports, __webpack_require__) {
/* globals window, document, jQuery */ /**
 * Webflow: Lightbox component
 */ 
var Webflow = __webpack_require__(43949);
var CONDITION_INVISIBLE_CLASS = 'w-condition-invisible';
var CONDVIS_SELECTOR = '.' + CONDITION_INVISIBLE_CLASS;
function withoutConditionallyHidden(items) {
    return items.filter(function(item) {
        return !isConditionallyHidden(item);
    });
}
function isConditionallyHidden(item) {
    return Boolean(item.$el && item.$el.closest(CONDVIS_SELECTOR).length);
}
function getPreviousVisibleIndex(start, items) {
    for(var i = start; i >= 0; i--){
        if (!isConditionallyHidden(items[i])) {
            return i;
        }
    }
    return -1;
}
function getNextVisibleIndex(start, items) {
    for(var i = start; i <= items.length - 1; i++){
        if (!isConditionallyHidden(items[i])) {
            return i;
        }
    }
    return -1;
}
function shouldSetArrowLeftInactive(currentIndex, items) {
    return getPreviousVisibleIndex(currentIndex - 1, items) === -1;
}
function shouldSetArrowRightInactive(currentIndex, items) {
    return getNextVisibleIndex(currentIndex + 1, items) === -1;
}
function setAriaLabelIfEmpty($element, labelText) {
    if (!$element.attr('aria-label')) {
        $element.attr('aria-label', labelText);
    }
}
function createLightbox(window1, document1, $, container) {
    var tram = $.tram;
    var isArray = Array.isArray;
    var namespace = 'w-lightbox';
    var prefix = namespace + '-';
    var prefixRegex = /(^|\s+)/g;
    // Array of objects describing items to be displayed.
    var items = [];
    // Index of the currently displayed item.
    var currentIndex;
    // Object holding references to jQuery wrapped nodes.
    var $refs;
    // Instance of Spinner
    var spinner;
    // Tracks data on element visiblity modified when lightbox opens
    var resetVisibilityState = [];
    function lightbox(thing, index) {
        items = isArray(thing) ? thing : [
            thing
        ];
        if (!$refs) {
            lightbox.build();
        }
        if (withoutConditionallyHidden(items).length > 1) {
            $refs.items = $refs.empty;
            items.forEach(function(item, idx) {
                var $thumbnail = dom('thumbnail');
                var $item = dom('item').prop('tabIndex', 0).attr('aria-controls', 'w-lightbox-view').attr('role', 'tab').append($thumbnail);
                setAriaLabelIfEmpty($item, `show item ${idx + 1} of ${items.length}`);
                if (isConditionallyHidden(item)) {
                    $item.addClass(CONDITION_INVISIBLE_CLASS);
                }
                $refs.items = $refs.items.add($item);
                loadImage(item.thumbnailUrl || item.url, function($image) {
                    if ($image.prop('width') > $image.prop('height')) {
                        addClass($image, 'wide');
                    } else {
                        addClass($image, 'tall');
                    }
                    $thumbnail.append(addClass($image, 'thumbnail-image'));
                });
            });
            $refs.strip.empty().append($refs.items);
            addClass($refs.content, 'group');
        }
        tram(// Focus the lightbox to receive keyboard events.
        removeClass($refs.lightbox, 'hide').trigger('focus')).add('opacity .3s').start({
            opacity: 1
        });
        // Prevent document from scrolling while lightbox is active.
        addClass($refs.html, 'noscroll');
        return lightbox.show(index || 0);
    }
    /**
   * Creates the DOM structure required by the lightbox.
   */ lightbox.build = function() {
        // In case `build` is called more than once.
        lightbox.destroy();
        $refs = {
            html: $(document1.documentElement),
            // Empty jQuery object can be used to build new ones using `.add`.
            empty: $()
        };
        $refs.arrowLeft = dom('control left inactive').attr('role', 'button').attr('aria-hidden', true).attr('aria-controls', 'w-lightbox-view');
        $refs.arrowRight = dom('control right inactive').attr('role', 'button').attr('aria-hidden', true).attr('aria-controls', 'w-lightbox-view');
        $refs.close = dom('control close').attr('role', 'button');
        // Only set `aria-label` values if not already present
        setAriaLabelIfEmpty($refs.arrowLeft, 'previous image');
        setAriaLabelIfEmpty($refs.arrowRight, 'next image');
        setAriaLabelIfEmpty($refs.close, 'close lightbox');
        $refs.spinner = dom('spinner').attr('role', 'progressbar').attr('aria-live', 'polite').attr('aria-hidden', false).attr('aria-busy', true).attr('aria-valuemin', 0).attr('aria-valuemax', 100).attr('aria-valuenow', 0).attr('aria-valuetext', 'Loading image');
        $refs.strip = dom('strip').attr('role', 'tablist');
        spinner = new Spinner($refs.spinner, prefixed('hide'));
        $refs.content = dom('content').append($refs.spinner, $refs.arrowLeft, $refs.arrowRight, $refs.close);
        $refs.container = dom('container').append($refs.content, $refs.strip);
        $refs.lightbox = dom('backdrop hide').append($refs.container);
        // We are delegating events for performance reasons and also
        // to not have to reattach handlers when images change.
        $refs.strip.on('click', selector('item'), itemTapHandler);
        $refs.content.on('swipe', swipeHandler).on('click', selector('left'), handlerPrev).on('click', selector('right'), handlerNext).on('click', selector('close'), handlerHide).on('click', selector('image, caption'), handlerNext);
        $refs.container.on('click', selector('view'), handlerHide)// Prevent images from being dragged around.
        .on('dragstart', selector('img'), preventDefault);
        $refs.lightbox.on('keydown', keyHandler)// IE loses focus to inner nodes without letting us know.
        .on('focusin', focusThis);
        $(container).append($refs.lightbox);
        return lightbox;
    };
    /**
   * Dispose of DOM nodes created by the lightbox.
   */ lightbox.destroy = function() {
        if (!$refs) {
            return;
        }
        // Event handlers are also removed.
        removeClass($refs.html, 'noscroll');
        $refs.lightbox.remove();
        $refs = undefined;
    };
    /**
   * Show a specific item.
   */ lightbox.show = function(index) {
        // Bail if we are already showing this item.
        if (index === currentIndex) {
            return;
        }
        var item = items[index];
        if (!item) {
            return lightbox.hide();
        }
        if (isConditionallyHidden(item)) {
            if (index < currentIndex) {
                var previousVisibleIndex = getPreviousVisibleIndex(index - 1, items);
                index = previousVisibleIndex > -1 ? previousVisibleIndex : index;
            } else {
                var nextVisibleIndex = getNextVisibleIndex(index + 1, items);
                index = nextVisibleIndex > -1 ? nextVisibleIndex : index;
            }
            item = items[index];
        }
        var previousIndex = currentIndex;
        currentIndex = index;
        $refs.spinner.attr('aria-hidden', false).attr('aria-busy', true).attr('aria-valuenow', 0).attr('aria-valuetext', 'Loading image');
        spinner.show();
        // For videos, load an empty SVG with the video dimensions to preserve
        // the video’s aspect ratio while being responsive.
        var url = item.html && svgDataUri(item.width, item.height) || item.url;
        loadImage(url, function($image) {
            // Make sure this is the last item requested to be shown since
            // images can finish loading in a different order than they were
            // requested in.
            if (index !== currentIndex) {
                return;
            }
            var $figure = dom('figure', 'figure').append(addClass($image, 'image'));
            var $frame = dom('frame').append($figure);
            var $newView = dom('view').prop('tabIndex', 0).attr('id', 'w-lightbox-view').append($frame);
            var $html;
            var isIframe;
            if (item.html) {
                $html = $(item.html);
                isIframe = $html.is('iframe');
                if (isIframe) {
                    $html.on('load', transitionToNewView);
                }
                $figure.append(addClass($html, 'embed'));
            }
            if (item.caption) {
                $figure.append(dom('caption', 'figcaption').text(item.caption));
            }
            $refs.spinner.before($newView);
            if (!isIframe) {
                transitionToNewView();
            }
            function transitionToNewView() {
                $refs.spinner.attr('aria-hidden', true).attr('aria-busy', false).attr('aria-valuenow', 100).attr('aria-valuetext', 'Loaded image');
                spinner.hide();
                if (index !== currentIndex) {
                    $newView.remove();
                    return;
                }
                const shouldHideLeftArrow = shouldSetArrowLeftInactive(index, items);
                toggleClass($refs.arrowLeft, 'inactive', shouldHideLeftArrow);
                toggleHidden($refs.arrowLeft, shouldHideLeftArrow);
                if (shouldHideLeftArrow && $refs.arrowLeft.is(':focus')) {
                    // Refocus on right arrow as left arrow is hidden
                    $refs.arrowRight.focus();
                }
                const shouldHideRightArrow = shouldSetArrowRightInactive(index, items);
                toggleClass($refs.arrowRight, 'inactive', shouldHideRightArrow);
                toggleHidden($refs.arrowRight, shouldHideRightArrow);
                if (shouldHideRightArrow && $refs.arrowRight.is(':focus')) {
                    // Refocus on left arrow as right arrow is hidden
                    $refs.arrowLeft.focus();
                }
                if ($refs.view) {
                    tram($refs.view).add('opacity .3s').start({
                        opacity: 0
                    }).then(remover($refs.view));
                    tram($newView).add('opacity .3s').add('transform .3s').set({
                        x: index > previousIndex ? '80px' : '-80px'
                    }).start({
                        opacity: 1,
                        x: 0
                    });
                } else {
                    $newView.css('opacity', 1);
                }
                $refs.view = $newView;
                $refs.view.prop('tabIndex', 0);
                if ($refs.items) {
                    removeClass($refs.items, 'active');
                    $refs.items.removeAttr('aria-selected');
                    // Mark proper thumbnail as active
                    var $activeThumb = $refs.items.eq(index);
                    addClass($activeThumb, 'active');
                    $activeThumb.attr('aria-selected', true);
                    // Scroll into view
                    maybeScroll($activeThumb);
                }
            }
        });
        $refs.close.prop('tabIndex', 0);
        // Track the focused item on page prior to lightbox opening,
        // so we can return focus on hide
        $(':focus').addClass('active-lightbox');
        // Build is only called once per site (across multiple lightboxes),
        // while the show function is called when opening lightbox but also
        // when changing image.
        // So checking resetVisibilityState seems to be one approach to
        // trigger something only when the lightbox is opened
        if (resetVisibilityState.length === 0) {
            // Take all elements on the page out of the accessibility flow by marking
            // them hidden and preventing tab index while lightbox is open.
            $('body').children().each(function() {
                // We don't include the lightbox wrapper or script tags
                if ($(this).hasClass('w-lightbox-backdrop') || $(this).is('script')) {
                    return;
                }
                // Store the elements previous visiblity state
                resetVisibilityState.push({
                    node: $(this),
                    hidden: $(this).attr('aria-hidden'),
                    tabIndex: $(this).attr('tabIndex')
                });
                // Hide element from the accessiblity tree
                $(this).attr('aria-hidden', true).attr('tabIndex', -1);
            });
            // Start focus on the close icon
            $refs.close.focus();
        }
        return lightbox;
    };
    /**
   * Hides the lightbox.
   */ lightbox.hide = function() {
        tram($refs.lightbox).add('opacity .3s').start({
            opacity: 0
        }).then(hideLightbox);
        return lightbox;
    };
    lightbox.prev = function() {
        var previousVisibleIndex = getPreviousVisibleIndex(currentIndex - 1, items);
        if (previousVisibleIndex > -1) {
            lightbox.show(previousVisibleIndex);
        }
    };
    lightbox.next = function() {
        var nextVisibleIndex = getNextVisibleIndex(currentIndex + 1, items);
        if (nextVisibleIndex > -1) {
            lightbox.show(nextVisibleIndex);
        }
    };
    function createHandler(action) {
        return function(event) {
            // We only care about events triggered directly on the bound selectors.
            if (this !== event.target) {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            action();
        };
    }
    var handlerPrev = createHandler(lightbox.prev);
    var handlerNext = createHandler(lightbox.next);
    var handlerHide = createHandler(lightbox.hide);
    var itemTapHandler = function(event) {
        var index = $(this).index();
        event.preventDefault();
        lightbox.show(index);
    };
    var swipeHandler = function(event, data) {
        // Prevent scrolling.
        event.preventDefault();
        if (data.direction === 'left') {
            lightbox.next();
        } else if (data.direction === 'right') {
            lightbox.prev();
        }
    };
    var focusThis = function() {
        this.focus();
    };
    function preventDefault(event) {
        event.preventDefault();
    }
    function keyHandler(event) {
        var keyCode = event.keyCode;
        // [esc] or ([enter] or [space] while close button is focused)
        if (keyCode === 27 || checkForFocusTrigger(keyCode, 'close')) {
            lightbox.hide();
        // [◀] or ([enter] or [space] while left button is focused)
        } else if (keyCode === 37 || checkForFocusTrigger(keyCode, 'left')) {
            lightbox.prev();
        // [▶] or ([enter] or [space] while right button is focused)
        } else if (keyCode === 39 || checkForFocusTrigger(keyCode, 'right')) {
            lightbox.next();
        // [enter] or [space] while a thumbnail is focused
        } else if (checkForFocusTrigger(keyCode, 'item')) {
            $(':focus').click();
        }
    }
    /**
   * checkForFocusTrigger will check if the current focused element includes the matching class
   * and that the user has pressed either enter or space to trigger an action.
   * @param  {number} The numerical keyCode from the `keydown` event
   * @param  {string} The unique part of the `className` from the element we are checking. E.g. `close` will be prefixed into `w-lightbox-close`
   * @return {boolean}
   */ function checkForFocusTrigger(keyCode, classMatch) {
        if (keyCode !== 13 && keyCode !== 32) {
            return false;
        }
        var currentElementClasses = $(':focus').attr('class');
        var classToFind = prefixed(classMatch).trim();
        return currentElementClasses.includes(classToFind);
    }
    function hideLightbox() {
        // If the lightbox hasn't been destroyed already
        if ($refs) {
            // Reset strip scroll, otherwise next lightbox opens scrolled to last position
            $refs.strip.scrollLeft(0).empty();
            removeClass($refs.html, 'noscroll');
            addClass($refs.lightbox, 'hide');
            $refs.view && $refs.view.remove();
            // Reset some stuff
            removeClass($refs.content, 'group');
            addClass($refs.arrowLeft, 'inactive');
            addClass($refs.arrowRight, 'inactive');
            currentIndex = $refs.view = undefined;
            // Bring the page elements back into the accessiblity tree
            resetVisibilityState.forEach(function(visibilityState) {
                var node = visibilityState.node;
                if (!node) {
                    return;
                }
                if (visibilityState.hidden) {
                    node.attr('aria-hidden', visibilityState.hidden);
                } else {
                    node.removeAttr('aria-hidden');
                }
                if (visibilityState.tabIndex) {
                    node.attr('tabIndex', visibilityState.tabIndex);
                } else {
                    node.removeAttr('tabIndex');
                }
            });
            // Clear out the reset visibility state
            resetVisibilityState = [];
            // Re-focus on the element that triggered the lightbox
            $('.active-lightbox').removeClass('active-lightbox').focus();
        }
    }
    function loadImage(url, callback) {
        var $image = dom('img', 'img');
        $image.one('load', function() {
            callback($image);
        });
        // Start loading image.
        $image.attr('src', url);
        return $image;
    }
    function remover($element) {
        return function() {
            $element.remove();
        };
    }
    function maybeScroll($item) {
        var itemElement = $item.get(0);
        var stripElement = $refs.strip.get(0);
        var itemLeft = itemElement.offsetLeft;
        var itemWidth = itemElement.clientWidth;
        var stripScrollLeft = stripElement.scrollLeft;
        var stripWidth = stripElement.clientWidth;
        var stripScrollLeftMax = stripElement.scrollWidth - stripWidth;
        var newScrollLeft;
        if (itemLeft < stripScrollLeft) {
            newScrollLeft = Math.max(0, itemLeft + itemWidth - stripWidth);
        } else if (itemLeft + itemWidth > stripWidth + stripScrollLeft) {
            newScrollLeft = Math.min(itemLeft, stripScrollLeftMax);
        }
        if (newScrollLeft != null) {
            tram($refs.strip).add('scroll-left 500ms').start({
                'scroll-left': newScrollLeft
            });
        }
    }
    /**
   * Spinner
   */ function Spinner($spinner, className, delay) {
        this.$element = $spinner;
        this.className = className;
        this.delay = delay || 200;
        this.hide();
    }
    Spinner.prototype.show = function() {
        var spinner = this;
        // Bail if we are already showing the spinner.
        if (spinner.timeoutId) {
            return;
        }
        spinner.timeoutId = setTimeout(function() {
            spinner.$element.removeClass(spinner.className);
            // eslint-disable-next-line webflow/no-delete
            delete spinner.timeoutId;
        }, spinner.delay);
    };
    Spinner.prototype.hide = function() {
        var spinner = this;
        if (spinner.timeoutId) {
            clearTimeout(spinner.timeoutId);
            // eslint-disable-next-line webflow/no-delete
            delete spinner.timeoutId;
            return;
        }
        spinner.$element.addClass(spinner.className);
    };
    function prefixed(string, isSelector) {
        return string.replace(prefixRegex, (isSelector ? ' .' : ' ') + prefix);
    }
    function selector(string) {
        return prefixed(string, true);
    }
    /**
   * jQuery.addClass with auto-prefixing
   * @param  {jQuery} Element to add class to
   * @param  {string} Class name that will be prefixed and added to element
   * @return {jQuery}
   */ function addClass($element, className) {
        return $element.addClass(prefixed(className));
    }
    /**
   * jQuery.removeClass with auto-prefixing
   * @param  {jQuery} Element to remove class from
   * @param  {string} Class name that will be prefixed and removed from element
   * @return {jQuery}
   */ function removeClass($element, className) {
        return $element.removeClass(prefixed(className));
    }
    /**
   * jQuery.toggleClass with auto-prefixing
   * @param  {jQuery}  Element where class will be toggled
   * @param  {string}  Class name that will be prefixed and toggled
   * @param  {boolean} Optional boolean that determines if class will be added or removed
   * @return {jQuery}
   */ function toggleClass($element, className, shouldAdd) {
        return $element.toggleClass(prefixed(className), shouldAdd);
    }
    /**
   * jQuery.toggleHidden
   * @param  {jQuery}  Element where attribute will be set
   * @param  {boolean} Boolean that determines if aria-hidden will be true or false
   * @return {jQuery}
   */ function toggleHidden($element, isHidden) {
        return $element.attr('aria-hidden', isHidden).attr('tabIndex', isHidden ? -1 : 0);
    }
    /**
   * Create a new DOM element wrapped in a jQuery object,
   * decorated with our custom methods.
   * @param  {string} className
   * @param  {string} [tag]
   * @return {jQuery}
   */ function dom(className, tag) {
        return addClass($(document1.createElement(tag || 'div')), className);
    }
    function svgDataUri(width, height) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"/>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURI(svg);
    }
    // Compute some dimensions manually for iOS < 8, because of buggy support for VH.
    // Also, Android built-in browser does not support viewport units.
    (function() {
        var ua = window1.navigator.userAgent;
        var iOSRegex = /(iPhone|iPad|iPod);[^OS]*OS (\d)/;
        var iOSMatches = ua.match(iOSRegex);
        var android = ua.indexOf('Android ') > -1 && ua.indexOf('Chrome') === -1;
        if (!android && (!iOSMatches || iOSMatches[2] > 7)) {
            return;
        }
        var styleNode = document1.createElement('style');
        document1.head.appendChild(styleNode);
        window1.addEventListener('resize', refresh, true);
        function refresh() {
            var vh = window1.innerHeight;
            var vw = window1.innerWidth;
            var content = '.w-lightbox-content, .w-lightbox-view, .w-lightbox-view:before {' + 'height:' + vh + 'px' + '}' + '.w-lightbox-view {' + 'width:' + vw + 'px' + '}' + '.w-lightbox-group, .w-lightbox-group .w-lightbox-view, .w-lightbox-group .w-lightbox-view:before {' + 'height:' + 0.86 * vh + 'px' + '}' + '.w-lightbox-image {' + 'max-width:' + vw + 'px;' + 'max-height:' + vh + 'px' + '}' + '.w-lightbox-group .w-lightbox-image {' + 'max-height:' + 0.86 * vh + 'px' + '}' + '.w-lightbox-strip {' + 'padding: 0 ' + 0.01 * vh + 'px' + '}' + '.w-lightbox-item {' + 'width:' + 0.1 * vh + 'px;' + 'padding:' + 0.02 * vh + 'px ' + 0.01 * vh + 'px' + '}' + '.w-lightbox-thumbnail {' + 'height:' + 0.1 * vh + 'px' + '}' + '@media (min-width: 768px) {' + '.w-lightbox-content, .w-lightbox-view, .w-lightbox-view:before {' + 'height:' + 0.96 * vh + 'px' + '}' + '.w-lightbox-content {' + 'margin-top:' + 0.02 * vh + 'px' + '}' + '.w-lightbox-group, .w-lightbox-group .w-lightbox-view, .w-lightbox-group .w-lightbox-view:before {' + 'height:' + 0.84 * vh + 'px' + '}' + '.w-lightbox-image {' + 'max-width:' + 0.96 * vw + 'px;' + 'max-height:' + 0.96 * vh + 'px' + '}' + '.w-lightbox-group .w-lightbox-image {' + 'max-width:' + 0.823 * vw + 'px;' + 'max-height:' + 0.84 * vh + 'px' + '}' + '}';
            styleNode.textContent = content;
        }
        refresh();
    })();
    return lightbox;
}
Webflow.define('lightbox', module.exports = function($) {
    var api = {};
    var inApp = Webflow.env();
    var lightbox = createLightbox(window, document, $, inApp ? '#lightbox-mountpoint' : 'body');
    var $doc = $(document);
    var $lightboxes;
    var designer;
    var namespace = '.w-lightbox';
    var groups;
    // -----------------------------------
    // Module methods
    api.ready = api.design = api.preview = init;
    // -----------------------------------
    // Private methods
    function init() {
        designer = inApp && Webflow.env('design');
        // Reset Lightbox
        lightbox.destroy();
        // Reset groups
        groups = {};
        // Find all instances on the page
        $lightboxes = $doc.find(namespace);
        // Instantiate all lighboxes
        $lightboxes.webflowLightBox();
        // Set accessibility properties that are useful prior
        // to a lightbox being opened
        $lightboxes.each(function() {
            setAriaLabelIfEmpty($(this), 'open lightbox');
            $(this).attr('aria-haspopup', 'dialog');
        });
    }
    jQuery.fn.extend({
        webflowLightBox: function() {
            var $el = this;
            $.each($el, function(i, el) {
                // Store state in data
                var data = $.data(el, namespace);
                if (!data) {
                    data = $.data(el, namespace, {
                        el: $(el),
                        mode: 'images',
                        images: [],
                        embed: ''
                    });
                }
                // Remove old events
                data.el.off(namespace);
                // Set config from json script tag
                configure(data);
                // Add events based on mode
                if (designer) {
                    data.el.on('setting' + namespace, configure.bind(null, data));
                } else {
                    data.el.on('click' + namespace, clickHandler(data))// Prevent page scrolling to top when clicking on lightbox triggers.
                    .on('click' + namespace, function(e) {
                        e.preventDefault();
                    });
                }
            });
        }
    });
    function configure(data) {
        var json = data.el.children('.w-json').html();
        var groupName;
        var groupItems;
        if (!json) {
            data.items = [];
            return;
        }
        try {
            json = JSON.parse(json);
        } catch (e) {
            console.error('Malformed lightbox JSON configuration.', e);
        }
        supportOldLightboxJson(json);
        json.items.forEach(function(item) {
            item.$el = data.el;
        });
        groupName = json.group;
        if (groupName) {
            groupItems = groups[groupName];
            if (!groupItems) {
                groupItems = groups[groupName] = [];
            }
            data.items = groupItems;
            if (json.items.length) {
                data.index = groupItems.length;
                groupItems.push.apply(groupItems, json.items);
            }
        } else {
            data.items = json.items;
            data.index = 0;
        }
    }
    function clickHandler(data) {
        return function() {
            data.items.length && lightbox(data.items, data.index || 0);
        };
    }
    function supportOldLightboxJson(data) {
        if (data.images) {
            data.images.forEach(function(item) {
                item.type = 'image';
            });
            data.items = data.images;
        }
        if (data.embed) {
            data.embed.type = 'video';
            data.items = [
                data.embed
            ];
        }
        if (data.groupId) {
            data.group = data.groupId;
        }
    }
    // Export module
    return api;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYmZsb3ctbGlnaHRib3guanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyB3aW5kb3csIGRvY3VtZW50LCBqUXVlcnkgKi9cblxuLyoqXG4gKiBXZWJmbG93OiBMaWdodGJveCBjb21wb25lbnRcbiAqL1xuXG52YXIgV2ViZmxvdyA9IHJlcXVpcmUoJy4uL0Jhc2VTaXRlTW9kdWxlcy93ZWJmbG93LWxpYicpO1xuXG52YXIgQ09ORElUSU9OX0lOVklTSUJMRV9DTEFTUyA9ICd3LWNvbmRpdGlvbi1pbnZpc2libGUnO1xudmFyIENPTkRWSVNfU0VMRUNUT1IgPSAnLicgKyBDT05ESVRJT05fSU5WSVNJQkxFX0NMQVNTO1xuXG5mdW5jdGlvbiB3aXRob3V0Q29uZGl0aW9uYWxseUhpZGRlbihpdGVtcykge1xuICByZXR1cm4gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgcmV0dXJuICFpc0NvbmRpdGlvbmFsbHlIaWRkZW4oaXRlbSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpc0NvbmRpdGlvbmFsbHlIaWRkZW4oaXRlbSkge1xuICByZXR1cm4gQm9vbGVhbihpdGVtLiRlbCAmJiBpdGVtLiRlbC5jbG9zZXN0KENPTkRWSVNfU0VMRUNUT1IpLmxlbmd0aCk7XG59XG5cbmZ1bmN0aW9uIGdldFByZXZpb3VzVmlzaWJsZUluZGV4KHN0YXJ0LCBpdGVtcykge1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKCFpc0NvbmRpdGlvbmFsbHlIaWRkZW4oaXRlbXNbaV0pKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBnZXROZXh0VmlzaWJsZUluZGV4KHN0YXJ0LCBpdGVtcykge1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPD0gaXRlbXMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgaWYgKCFpc0NvbmRpdGlvbmFsbHlIaWRkZW4oaXRlbXNbaV0pKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5mdW5jdGlvbiBzaG91bGRTZXRBcnJvd0xlZnRJbmFjdGl2ZShjdXJyZW50SW5kZXgsIGl0ZW1zKSB7XG4gIHJldHVybiBnZXRQcmV2aW91c1Zpc2libGVJbmRleChjdXJyZW50SW5kZXggLSAxLCBpdGVtcykgPT09IC0xO1xufVxuXG5mdW5jdGlvbiBzaG91bGRTZXRBcnJvd1JpZ2h0SW5hY3RpdmUoY3VycmVudEluZGV4LCBpdGVtcykge1xuICByZXR1cm4gZ2V0TmV4dFZpc2libGVJbmRleChjdXJyZW50SW5kZXggKyAxLCBpdGVtcykgPT09IC0xO1xufVxuXG5mdW5jdGlvbiBzZXRBcmlhTGFiZWxJZkVtcHR5KCRlbGVtZW50LCBsYWJlbFRleHQpIHtcbiAgaWYgKCEkZWxlbWVudC5hdHRyKCdhcmlhLWxhYmVsJykpIHtcbiAgICAkZWxlbWVudC5hdHRyKCdhcmlhLWxhYmVsJywgbGFiZWxUZXh0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVMaWdodGJveCh3aW5kb3csIGRvY3VtZW50LCAkLCBjb250YWluZXIpIHtcbiAgdmFyIHRyYW0gPSAkLnRyYW07XG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcbiAgdmFyIG5hbWVzcGFjZSA9ICd3LWxpZ2h0Ym94JztcbiAgdmFyIHByZWZpeCA9IG5hbWVzcGFjZSArICctJztcbiAgdmFyIHByZWZpeFJlZ2V4ID0gLyhefFxccyspL2c7XG5cbiAgLy8gQXJyYXkgb2Ygb2JqZWN0cyBkZXNjcmliaW5nIGl0ZW1zIHRvIGJlIGRpc3BsYXllZC5cbiAgdmFyIGl0ZW1zID0gW107XG5cbiAgLy8gSW5kZXggb2YgdGhlIGN1cnJlbnRseSBkaXNwbGF5ZWQgaXRlbS5cbiAgdmFyIGN1cnJlbnRJbmRleDtcblxuICAvLyBPYmplY3QgaG9sZGluZyByZWZlcmVuY2VzIHRvIGpRdWVyeSB3cmFwcGVkIG5vZGVzLlxuICB2YXIgJHJlZnM7XG5cbiAgLy8gSW5zdGFuY2Ugb2YgU3Bpbm5lclxuICB2YXIgc3Bpbm5lcjtcblxuICAvLyBUcmFja3MgZGF0YSBvbiBlbGVtZW50IHZpc2libGl0eSBtb2RpZmllZCB3aGVuIGxpZ2h0Ym94IG9wZW5zXG4gIHZhciByZXNldFZpc2liaWxpdHlTdGF0ZSA9IFtdO1xuXG4gIGZ1bmN0aW9uIGxpZ2h0Ym94KHRoaW5nLCBpbmRleCkge1xuICAgIGl0ZW1zID0gaXNBcnJheSh0aGluZykgPyB0aGluZyA6IFt0aGluZ107XG5cbiAgICBpZiAoISRyZWZzKSB7XG4gICAgICBsaWdodGJveC5idWlsZCgpO1xuICAgIH1cblxuICAgIGlmICh3aXRob3V0Q29uZGl0aW9uYWxseUhpZGRlbihpdGVtcykubGVuZ3RoID4gMSkge1xuICAgICAgJHJlZnMuaXRlbXMgPSAkcmVmcy5lbXB0eTtcblxuICAgICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSwgaWR4KSB7XG4gICAgICAgIHZhciAkdGh1bWJuYWlsID0gZG9tKCd0aHVtYm5haWwnKTtcbiAgICAgICAgdmFyICRpdGVtID0gZG9tKCdpdGVtJylcbiAgICAgICAgICAucHJvcCgndGFiSW5kZXgnLCAwKVxuICAgICAgICAgIC5hdHRyKCdhcmlhLWNvbnRyb2xzJywgJ3ctbGlnaHRib3gtdmlldycpXG4gICAgICAgICAgLmF0dHIoJ3JvbGUnLCAndGFiJylcbiAgICAgICAgICAuYXBwZW5kKCR0aHVtYm5haWwpO1xuXG4gICAgICAgIHNldEFyaWFMYWJlbElmRW1wdHkoJGl0ZW0sIGBzaG93IGl0ZW0gJHtpZHggKyAxfSBvZiAke2l0ZW1zLmxlbmd0aH1gKTtcblxuICAgICAgICBpZiAoaXNDb25kaXRpb25hbGx5SGlkZGVuKGl0ZW0pKSB7XG4gICAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoQ09ORElUSU9OX0lOVklTSUJMRV9DTEFTUyk7XG4gICAgICAgIH1cblxuICAgICAgICAkcmVmcy5pdGVtcyA9ICRyZWZzLml0ZW1zLmFkZCgkaXRlbSk7XG5cbiAgICAgICAgbG9hZEltYWdlKGl0ZW0udGh1bWJuYWlsVXJsIHx8IGl0ZW0udXJsLCBmdW5jdGlvbiAoJGltYWdlKSB7XG4gICAgICAgICAgaWYgKCRpbWFnZS5wcm9wKCd3aWR0aCcpID4gJGltYWdlLnByb3AoJ2hlaWdodCcpKSB7XG4gICAgICAgICAgICBhZGRDbGFzcygkaW1hZ2UsICd3aWRlJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFkZENsYXNzKCRpbWFnZSwgJ3RhbGwnKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgJHRodW1ibmFpbC5hcHBlbmQoYWRkQ2xhc3MoJGltYWdlLCAndGh1bWJuYWlsLWltYWdlJykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAkcmVmcy5zdHJpcC5lbXB0eSgpLmFwcGVuZCgkcmVmcy5pdGVtcyk7XG4gICAgICBhZGRDbGFzcygkcmVmcy5jb250ZW50LCAnZ3JvdXAnKTtcbiAgICB9XG5cbiAgICB0cmFtKFxuICAgICAgLy8gRm9jdXMgdGhlIGxpZ2h0Ym94IHRvIHJlY2VpdmUga2V5Ym9hcmQgZXZlbnRzLlxuICAgICAgcmVtb3ZlQ2xhc3MoJHJlZnMubGlnaHRib3gsICdoaWRlJykudHJpZ2dlcignZm9jdXMnKVxuICAgIClcbiAgICAgIC5hZGQoJ29wYWNpdHkgLjNzJylcbiAgICAgIC5zdGFydCh7b3BhY2l0eTogMX0pO1xuXG4gICAgLy8gUHJldmVudCBkb2N1bWVudCBmcm9tIHNjcm9sbGluZyB3aGlsZSBsaWdodGJveCBpcyBhY3RpdmUuXG4gICAgYWRkQ2xhc3MoJHJlZnMuaHRtbCwgJ25vc2Nyb2xsJyk7XG5cbiAgICByZXR1cm4gbGlnaHRib3guc2hvdyhpbmRleCB8fCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIHRoZSBET00gc3RydWN0dXJlIHJlcXVpcmVkIGJ5IHRoZSBsaWdodGJveC5cbiAgICovXG4gIGxpZ2h0Ym94LmJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIEluIGNhc2UgYGJ1aWxkYCBpcyBjYWxsZWQgbW9yZSB0aGFuIG9uY2UuXG4gICAgbGlnaHRib3guZGVzdHJveSgpO1xuXG4gICAgJHJlZnMgPSB7XG4gICAgICBodG1sOiAkKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCksXG4gICAgICAvLyBFbXB0eSBqUXVlcnkgb2JqZWN0IGNhbiBiZSB1c2VkIHRvIGJ1aWxkIG5ldyBvbmVzIHVzaW5nIGAuYWRkYC5cbiAgICAgIGVtcHR5OiAkKCksXG4gICAgfTtcblxuICAgICRyZWZzLmFycm93TGVmdCA9IGRvbSgnY29udHJvbCBsZWZ0IGluYWN0aXZlJylcbiAgICAgIC5hdHRyKCdyb2xlJywgJ2J1dHRvbicpXG4gICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKVxuICAgICAgLmF0dHIoJ2FyaWEtY29udHJvbHMnLCAndy1saWdodGJveC12aWV3Jyk7XG4gICAgJHJlZnMuYXJyb3dSaWdodCA9IGRvbSgnY29udHJvbCByaWdodCBpbmFjdGl2ZScpXG4gICAgICAuYXR0cigncm9sZScsICdidXR0b24nKVxuICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSlcbiAgICAgIC5hdHRyKCdhcmlhLWNvbnRyb2xzJywgJ3ctbGlnaHRib3gtdmlldycpO1xuICAgICRyZWZzLmNsb3NlID0gZG9tKCdjb250cm9sIGNsb3NlJykuYXR0cigncm9sZScsICdidXR0b24nKTtcblxuICAgIC8vIE9ubHkgc2V0IGBhcmlhLWxhYmVsYCB2YWx1ZXMgaWYgbm90IGFscmVhZHkgcHJlc2VudFxuICAgIHNldEFyaWFMYWJlbElmRW1wdHkoJHJlZnMuYXJyb3dMZWZ0LCAncHJldmlvdXMgaW1hZ2UnKTtcbiAgICBzZXRBcmlhTGFiZWxJZkVtcHR5KCRyZWZzLmFycm93UmlnaHQsICduZXh0IGltYWdlJyk7XG4gICAgc2V0QXJpYUxhYmVsSWZFbXB0eSgkcmVmcy5jbG9zZSwgJ2Nsb3NlIGxpZ2h0Ym94Jyk7XG5cbiAgICAkcmVmcy5zcGlubmVyID0gZG9tKCdzcGlubmVyJylcbiAgICAgIC5hdHRyKCdyb2xlJywgJ3Byb2dyZXNzYmFyJylcbiAgICAgIC5hdHRyKCdhcmlhLWxpdmUnLCAncG9saXRlJylcbiAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsIGZhbHNlKVxuICAgICAgLmF0dHIoJ2FyaWEtYnVzeScsIHRydWUpXG4gICAgICAuYXR0cignYXJpYS12YWx1ZW1pbicsIDApXG4gICAgICAuYXR0cignYXJpYS12YWx1ZW1heCcsIDEwMClcbiAgICAgIC5hdHRyKCdhcmlhLXZhbHVlbm93JywgMClcbiAgICAgIC5hdHRyKCdhcmlhLXZhbHVldGV4dCcsICdMb2FkaW5nIGltYWdlJyk7XG5cbiAgICAkcmVmcy5zdHJpcCA9IGRvbSgnc3RyaXAnKS5hdHRyKCdyb2xlJywgJ3RhYmxpc3QnKTtcblxuICAgIHNwaW5uZXIgPSBuZXcgU3Bpbm5lcigkcmVmcy5zcGlubmVyLCBwcmVmaXhlZCgnaGlkZScpKTtcblxuICAgICRyZWZzLmNvbnRlbnQgPSBkb20oJ2NvbnRlbnQnKS5hcHBlbmQoXG4gICAgICAkcmVmcy5zcGlubmVyLFxuICAgICAgJHJlZnMuYXJyb3dMZWZ0LFxuICAgICAgJHJlZnMuYXJyb3dSaWdodCxcbiAgICAgICRyZWZzLmNsb3NlXG4gICAgKTtcblxuICAgICRyZWZzLmNvbnRhaW5lciA9IGRvbSgnY29udGFpbmVyJykuYXBwZW5kKCRyZWZzLmNvbnRlbnQsICRyZWZzLnN0cmlwKTtcblxuICAgICRyZWZzLmxpZ2h0Ym94ID0gZG9tKCdiYWNrZHJvcCBoaWRlJykuYXBwZW5kKCRyZWZzLmNvbnRhaW5lcik7XG5cbiAgICAvLyBXZSBhcmUgZGVsZWdhdGluZyBldmVudHMgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgYW5kIGFsc29cbiAgICAvLyB0byBub3QgaGF2ZSB0byByZWF0dGFjaCBoYW5kbGVycyB3aGVuIGltYWdlcyBjaGFuZ2UuXG4gICAgJHJlZnMuc3RyaXAub24oJ2NsaWNrJywgc2VsZWN0b3IoJ2l0ZW0nKSwgaXRlbVRhcEhhbmRsZXIpO1xuICAgICRyZWZzLmNvbnRlbnRcbiAgICAgIC5vbignc3dpcGUnLCBzd2lwZUhhbmRsZXIpXG4gICAgICAub24oJ2NsaWNrJywgc2VsZWN0b3IoJ2xlZnQnKSwgaGFuZGxlclByZXYpXG4gICAgICAub24oJ2NsaWNrJywgc2VsZWN0b3IoJ3JpZ2h0JyksIGhhbmRsZXJOZXh0KVxuICAgICAgLm9uKCdjbGljaycsIHNlbGVjdG9yKCdjbG9zZScpLCBoYW5kbGVySGlkZSlcbiAgICAgIC5vbignY2xpY2snLCBzZWxlY3RvcignaW1hZ2UsIGNhcHRpb24nKSwgaGFuZGxlck5leHQpO1xuICAgICRyZWZzLmNvbnRhaW5lclxuICAgICAgLm9uKCdjbGljaycsIHNlbGVjdG9yKCd2aWV3JyksIGhhbmRsZXJIaWRlKVxuICAgICAgLy8gUHJldmVudCBpbWFnZXMgZnJvbSBiZWluZyBkcmFnZ2VkIGFyb3VuZC5cbiAgICAgIC5vbignZHJhZ3N0YXJ0Jywgc2VsZWN0b3IoJ2ltZycpLCBwcmV2ZW50RGVmYXVsdCk7XG4gICAgJHJlZnMubGlnaHRib3hcbiAgICAgIC5vbigna2V5ZG93bicsIGtleUhhbmRsZXIpXG4gICAgICAvLyBJRSBsb3NlcyBmb2N1cyB0byBpbm5lciBub2RlcyB3aXRob3V0IGxldHRpbmcgdXMga25vdy5cbiAgICAgIC5vbignZm9jdXNpbicsIGZvY3VzVGhpcyk7XG5cbiAgICAkKGNvbnRhaW5lcikuYXBwZW5kKCRyZWZzLmxpZ2h0Ym94KTtcblxuICAgIHJldHVybiBsaWdodGJveDtcbiAgfTtcblxuICAvKipcbiAgICogRGlzcG9zZSBvZiBET00gbm9kZXMgY3JlYXRlZCBieSB0aGUgbGlnaHRib3guXG4gICAqL1xuICBsaWdodGJveC5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghJHJlZnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBFdmVudCBoYW5kbGVycyBhcmUgYWxzbyByZW1vdmVkLlxuICAgIHJlbW92ZUNsYXNzKCRyZWZzLmh0bWwsICdub3Njcm9sbCcpO1xuICAgICRyZWZzLmxpZ2h0Ym94LnJlbW92ZSgpO1xuICAgICRyZWZzID0gdW5kZWZpbmVkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTaG93IGEgc3BlY2lmaWMgaXRlbS5cbiAgICovXG4gIGxpZ2h0Ym94LnNob3cgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAvLyBCYWlsIGlmIHdlIGFyZSBhbHJlYWR5IHNob3dpbmcgdGhpcyBpdGVtLlxuICAgIGlmIChpbmRleCA9PT0gY3VycmVudEluZGV4KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBpdGVtID0gaXRlbXNbaW5kZXhdO1xuICAgIGlmICghaXRlbSkge1xuICAgICAgcmV0dXJuIGxpZ2h0Ym94LmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoaXNDb25kaXRpb25hbGx5SGlkZGVuKGl0ZW0pKSB7XG4gICAgICBpZiAoaW5kZXggPCBjdXJyZW50SW5kZXgpIHtcbiAgICAgICAgdmFyIHByZXZpb3VzVmlzaWJsZUluZGV4ID0gZ2V0UHJldmlvdXNWaXNpYmxlSW5kZXgoaW5kZXggLSAxLCBpdGVtcyk7XG4gICAgICAgIGluZGV4ID0gcHJldmlvdXNWaXNpYmxlSW5kZXggPiAtMSA/IHByZXZpb3VzVmlzaWJsZUluZGV4IDogaW5kZXg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbmV4dFZpc2libGVJbmRleCA9IGdldE5leHRWaXNpYmxlSW5kZXgoaW5kZXggKyAxLCBpdGVtcyk7XG4gICAgICAgIGluZGV4ID0gbmV4dFZpc2libGVJbmRleCA+IC0xID8gbmV4dFZpc2libGVJbmRleCA6IGluZGV4O1xuICAgICAgfVxuICAgICAgaXRlbSA9IGl0ZW1zW2luZGV4XTtcbiAgICB9XG5cbiAgICB2YXIgcHJldmlvdXNJbmRleCA9IGN1cnJlbnRJbmRleDtcbiAgICBjdXJyZW50SW5kZXggPSBpbmRleDtcbiAgICAkcmVmcy5zcGlubmVyXG4gICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCBmYWxzZSlcbiAgICAgIC5hdHRyKCdhcmlhLWJ1c3knLCB0cnVlKVxuICAgICAgLmF0dHIoJ2FyaWEtdmFsdWVub3cnLCAwKVxuICAgICAgLmF0dHIoJ2FyaWEtdmFsdWV0ZXh0JywgJ0xvYWRpbmcgaW1hZ2UnKTtcbiAgICBzcGlubmVyLnNob3coKTtcblxuICAgIC8vIEZvciB2aWRlb3MsIGxvYWQgYW4gZW1wdHkgU1ZHIHdpdGggdGhlIHZpZGVvIGRpbWVuc2lvbnMgdG8gcHJlc2VydmVcbiAgICAvLyB0aGUgdmlkZW/igJlzIGFzcGVjdCByYXRpbyB3aGlsZSBiZWluZyByZXNwb25zaXZlLlxuICAgIHZhciB1cmwgPSAoaXRlbS5odG1sICYmIHN2Z0RhdGFVcmkoaXRlbS53aWR0aCwgaXRlbS5oZWlnaHQpKSB8fCBpdGVtLnVybDtcbiAgICBsb2FkSW1hZ2UodXJsLCBmdW5jdGlvbiAoJGltYWdlKSB7XG4gICAgICAvLyBNYWtlIHN1cmUgdGhpcyBpcyB0aGUgbGFzdCBpdGVtIHJlcXVlc3RlZCB0byBiZSBzaG93biBzaW5jZVxuICAgICAgLy8gaW1hZ2VzIGNhbiBmaW5pc2ggbG9hZGluZyBpbiBhIGRpZmZlcmVudCBvcmRlciB0aGFuIHRoZXkgd2VyZVxuICAgICAgLy8gcmVxdWVzdGVkIGluLlxuICAgICAgaWYgKGluZGV4ICE9PSBjdXJyZW50SW5kZXgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyICRmaWd1cmUgPSBkb20oJ2ZpZ3VyZScsICdmaWd1cmUnKS5hcHBlbmQoYWRkQ2xhc3MoJGltYWdlLCAnaW1hZ2UnKSk7XG4gICAgICB2YXIgJGZyYW1lID0gZG9tKCdmcmFtZScpLmFwcGVuZCgkZmlndXJlKTtcbiAgICAgIHZhciAkbmV3VmlldyA9IGRvbSgndmlldycpXG4gICAgICAgIC5wcm9wKCd0YWJJbmRleCcsIDApXG4gICAgICAgIC5hdHRyKCdpZCcsICd3LWxpZ2h0Ym94LXZpZXcnKVxuICAgICAgICAuYXBwZW5kKCRmcmFtZSk7XG4gICAgICB2YXIgJGh0bWw7XG4gICAgICB2YXIgaXNJZnJhbWU7XG4gICAgICBpZiAoaXRlbS5odG1sKSB7XG4gICAgICAgICRodG1sID0gJChpdGVtLmh0bWwpO1xuICAgICAgICBpc0lmcmFtZSA9ICRodG1sLmlzKCdpZnJhbWUnKTtcblxuICAgICAgICBpZiAoaXNJZnJhbWUpIHtcbiAgICAgICAgICAkaHRtbC5vbignbG9hZCcsIHRyYW5zaXRpb25Ub05ld1ZpZXcpO1xuICAgICAgICB9XG5cbiAgICAgICAgJGZpZ3VyZS5hcHBlbmQoYWRkQ2xhc3MoJGh0bWwsICdlbWJlZCcpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGl0ZW0uY2FwdGlvbikge1xuICAgICAgICAkZmlndXJlLmFwcGVuZChkb20oJ2NhcHRpb24nLCAnZmlnY2FwdGlvbicpLnRleHQoaXRlbS5jYXB0aW9uKSk7XG4gICAgICB9XG5cbiAgICAgICRyZWZzLnNwaW5uZXIuYmVmb3JlKCRuZXdWaWV3KTtcblxuICAgICAgaWYgKCFpc0lmcmFtZSkge1xuICAgICAgICB0cmFuc2l0aW9uVG9OZXdWaWV3KCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHRyYW5zaXRpb25Ub05ld1ZpZXcoKSB7XG4gICAgICAgICRyZWZzLnNwaW5uZXJcbiAgICAgICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKVxuICAgICAgICAgIC5hdHRyKCdhcmlhLWJ1c3knLCBmYWxzZSlcbiAgICAgICAgICAuYXR0cignYXJpYS12YWx1ZW5vdycsIDEwMClcbiAgICAgICAgICAuYXR0cignYXJpYS12YWx1ZXRleHQnLCAnTG9hZGVkIGltYWdlJyk7XG4gICAgICAgIHNwaW5uZXIuaGlkZSgpO1xuXG4gICAgICAgIGlmIChpbmRleCAhPT0gY3VycmVudEluZGV4KSB7XG4gICAgICAgICAgJG5ld1ZpZXcucmVtb3ZlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2hvdWxkSGlkZUxlZnRBcnJvdyA9IHNob3VsZFNldEFycm93TGVmdEluYWN0aXZlKGluZGV4LCBpdGVtcyk7XG4gICAgICAgIHRvZ2dsZUNsYXNzKCRyZWZzLmFycm93TGVmdCwgJ2luYWN0aXZlJywgc2hvdWxkSGlkZUxlZnRBcnJvdyk7XG4gICAgICAgIHRvZ2dsZUhpZGRlbigkcmVmcy5hcnJvd0xlZnQsIHNob3VsZEhpZGVMZWZ0QXJyb3cpO1xuICAgICAgICBpZiAoc2hvdWxkSGlkZUxlZnRBcnJvdyAmJiAkcmVmcy5hcnJvd0xlZnQuaXMoJzpmb2N1cycpKSB7XG4gICAgICAgICAgLy8gUmVmb2N1cyBvbiByaWdodCBhcnJvdyBhcyBsZWZ0IGFycm93IGlzIGhpZGRlblxuICAgICAgICAgICRyZWZzLmFycm93UmlnaHQuZm9jdXMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNob3VsZEhpZGVSaWdodEFycm93ID0gc2hvdWxkU2V0QXJyb3dSaWdodEluYWN0aXZlKGluZGV4LCBpdGVtcyk7XG4gICAgICAgIHRvZ2dsZUNsYXNzKCRyZWZzLmFycm93UmlnaHQsICdpbmFjdGl2ZScsIHNob3VsZEhpZGVSaWdodEFycm93KTtcbiAgICAgICAgdG9nZ2xlSGlkZGVuKCRyZWZzLmFycm93UmlnaHQsIHNob3VsZEhpZGVSaWdodEFycm93KTtcbiAgICAgICAgaWYgKHNob3VsZEhpZGVSaWdodEFycm93ICYmICRyZWZzLmFycm93UmlnaHQuaXMoJzpmb2N1cycpKSB7XG4gICAgICAgICAgLy8gUmVmb2N1cyBvbiBsZWZ0IGFycm93IGFzIHJpZ2h0IGFycm93IGlzIGhpZGRlblxuICAgICAgICAgICRyZWZzLmFycm93TGVmdC5mb2N1cygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCRyZWZzLnZpZXcpIHtcbiAgICAgICAgICB0cmFtKCRyZWZzLnZpZXcpXG4gICAgICAgICAgICAuYWRkKCdvcGFjaXR5IC4zcycpXG4gICAgICAgICAgICAuc3RhcnQoe29wYWNpdHk6IDB9KVxuICAgICAgICAgICAgLnRoZW4ocmVtb3ZlcigkcmVmcy52aWV3KSk7XG5cbiAgICAgICAgICB0cmFtKCRuZXdWaWV3KVxuICAgICAgICAgICAgLmFkZCgnb3BhY2l0eSAuM3MnKVxuICAgICAgICAgICAgLmFkZCgndHJhbnNmb3JtIC4zcycpXG4gICAgICAgICAgICAuc2V0KHt4OiBpbmRleCA+IHByZXZpb3VzSW5kZXggPyAnODBweCcgOiAnLTgwcHgnfSlcbiAgICAgICAgICAgIC5zdGFydCh7b3BhY2l0eTogMSwgeDogMH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICRuZXdWaWV3LmNzcygnb3BhY2l0eScsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgJHJlZnMudmlldyA9ICRuZXdWaWV3O1xuICAgICAgICAkcmVmcy52aWV3LnByb3AoJ3RhYkluZGV4JywgMCk7XG5cbiAgICAgICAgaWYgKCRyZWZzLml0ZW1zKSB7XG4gICAgICAgICAgcmVtb3ZlQ2xhc3MoJHJlZnMuaXRlbXMsICdhY3RpdmUnKTtcbiAgICAgICAgICAkcmVmcy5pdGVtcy5yZW1vdmVBdHRyKCdhcmlhLXNlbGVjdGVkJyk7XG5cbiAgICAgICAgICAvLyBNYXJrIHByb3BlciB0aHVtYm5haWwgYXMgYWN0aXZlXG4gICAgICAgICAgdmFyICRhY3RpdmVUaHVtYiA9ICRyZWZzLml0ZW1zLmVxKGluZGV4KTtcbiAgICAgICAgICBhZGRDbGFzcygkYWN0aXZlVGh1bWIsICdhY3RpdmUnKTtcbiAgICAgICAgICAkYWN0aXZlVGh1bWIuYXR0cignYXJpYS1zZWxlY3RlZCcsIHRydWUpO1xuICAgICAgICAgIC8vIFNjcm9sbCBpbnRvIHZpZXdcbiAgICAgICAgICBtYXliZVNjcm9sbCgkYWN0aXZlVGh1bWIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAkcmVmcy5jbG9zZS5wcm9wKCd0YWJJbmRleCcsIDApO1xuXG4gICAgLy8gVHJhY2sgdGhlIGZvY3VzZWQgaXRlbSBvbiBwYWdlIHByaW9yIHRvIGxpZ2h0Ym94IG9wZW5pbmcsXG4gICAgLy8gc28gd2UgY2FuIHJldHVybiBmb2N1cyBvbiBoaWRlXG4gICAgJCgnOmZvY3VzJykuYWRkQ2xhc3MoJ2FjdGl2ZS1saWdodGJveCcpO1xuXG4gICAgLy8gQnVpbGQgaXMgb25seSBjYWxsZWQgb25jZSBwZXIgc2l0ZSAoYWNyb3NzIG11bHRpcGxlIGxpZ2h0Ym94ZXMpLFxuICAgIC8vIHdoaWxlIHRoZSBzaG93IGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIG9wZW5pbmcgbGlnaHRib3ggYnV0IGFsc29cbiAgICAvLyB3aGVuIGNoYW5naW5nIGltYWdlLlxuICAgIC8vIFNvIGNoZWNraW5nIHJlc2V0VmlzaWJpbGl0eVN0YXRlIHNlZW1zIHRvIGJlIG9uZSBhcHByb2FjaCB0b1xuICAgIC8vIHRyaWdnZXIgc29tZXRoaW5nIG9ubHkgd2hlbiB0aGUgbGlnaHRib3ggaXMgb3BlbmVkXG4gICAgaWYgKHJlc2V0VmlzaWJpbGl0eVN0YXRlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgLy8gVGFrZSBhbGwgZWxlbWVudHMgb24gdGhlIHBhZ2Ugb3V0IG9mIHRoZSBhY2Nlc3NpYmlsaXR5IGZsb3cgYnkgbWFya2luZ1xuICAgICAgLy8gdGhlbSBoaWRkZW4gYW5kIHByZXZlbnRpbmcgdGFiIGluZGV4IHdoaWxlIGxpZ2h0Ym94IGlzIG9wZW4uXG4gICAgICAkKCdib2R5JylcbiAgICAgICAgLmNoaWxkcmVuKClcbiAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8vIFdlIGRvbid0IGluY2x1ZGUgdGhlIGxpZ2h0Ym94IHdyYXBwZXIgb3Igc2NyaXB0IHRhZ3NcbiAgICAgICAgICBpZiAoJCh0aGlzKS5oYXNDbGFzcygndy1saWdodGJveC1iYWNrZHJvcCcpIHx8ICQodGhpcykuaXMoJ3NjcmlwdCcpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU3RvcmUgdGhlIGVsZW1lbnRzIHByZXZpb3VzIHZpc2libGl0eSBzdGF0ZVxuICAgICAgICAgIHJlc2V0VmlzaWJpbGl0eVN0YXRlLnB1c2goe1xuICAgICAgICAgICAgbm9kZTogJCh0aGlzKSxcbiAgICAgICAgICAgIGhpZGRlbjogJCh0aGlzKS5hdHRyKCdhcmlhLWhpZGRlbicpLFxuICAgICAgICAgICAgdGFiSW5kZXg6ICQodGhpcykuYXR0cigndGFiSW5kZXgnKSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIEhpZGUgZWxlbWVudCBmcm9tIHRoZSBhY2Nlc3NpYmxpdHkgdHJlZVxuICAgICAgICAgICQodGhpcykuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKS5hdHRyKCd0YWJJbmRleCcsIC0xKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIC8vIFN0YXJ0IGZvY3VzIG9uIHRoZSBjbG9zZSBpY29uXG4gICAgICAkcmVmcy5jbG9zZS5mb2N1cygpO1xuICAgIH1cblxuICAgIHJldHVybiBsaWdodGJveDtcbiAgfTtcblxuICAvKipcbiAgICogSGlkZXMgdGhlIGxpZ2h0Ym94LlxuICAgKi9cbiAgbGlnaHRib3guaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0cmFtKCRyZWZzLmxpZ2h0Ym94KVxuICAgICAgLmFkZCgnb3BhY2l0eSAuM3MnKVxuICAgICAgLnN0YXJ0KHtvcGFjaXR5OiAwfSlcbiAgICAgIC50aGVuKGhpZGVMaWdodGJveCk7XG5cbiAgICByZXR1cm4gbGlnaHRib3g7XG4gIH07XG5cbiAgbGlnaHRib3gucHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJldmlvdXNWaXNpYmxlSW5kZXggPSBnZXRQcmV2aW91c1Zpc2libGVJbmRleChjdXJyZW50SW5kZXggLSAxLCBpdGVtcyk7XG4gICAgaWYgKHByZXZpb3VzVmlzaWJsZUluZGV4ID4gLTEpIHtcbiAgICAgIGxpZ2h0Ym94LnNob3cocHJldmlvdXNWaXNpYmxlSW5kZXgpO1xuICAgIH1cbiAgfTtcblxuICBsaWdodGJveC5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuZXh0VmlzaWJsZUluZGV4ID0gZ2V0TmV4dFZpc2libGVJbmRleChjdXJyZW50SW5kZXggKyAxLCBpdGVtcyk7XG4gICAgaWYgKG5leHRWaXNpYmxlSW5kZXggPiAtMSkge1xuICAgICAgbGlnaHRib3guc2hvdyhuZXh0VmlzaWJsZUluZGV4KTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gY3JlYXRlSGFuZGxlcihhY3Rpb24pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAvLyBXZSBvbmx5IGNhcmUgYWJvdXQgZXZlbnRzIHRyaWdnZXJlZCBkaXJlY3RseSBvbiB0aGUgYm91bmQgc2VsZWN0b3JzLlxuICAgICAgaWYgKHRoaXMgIT09IGV2ZW50LnRhcmdldCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgYWN0aW9uKCk7XG4gICAgfTtcbiAgfVxuXG4gIHZhciBoYW5kbGVyUHJldiA9IGNyZWF0ZUhhbmRsZXIobGlnaHRib3gucHJldik7XG4gIHZhciBoYW5kbGVyTmV4dCA9IGNyZWF0ZUhhbmRsZXIobGlnaHRib3gubmV4dCk7XG4gIHZhciBoYW5kbGVySGlkZSA9IGNyZWF0ZUhhbmRsZXIobGlnaHRib3guaGlkZSk7XG5cbiAgdmFyIGl0ZW1UYXBIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIGluZGV4ID0gJCh0aGlzKS5pbmRleCgpO1xuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsaWdodGJveC5zaG93KGluZGV4KTtcbiAgfTtcblxuICB2YXIgc3dpcGVIYW5kbGVyID0gZnVuY3Rpb24gKGV2ZW50LCBkYXRhKSB7XG4gICAgLy8gUHJldmVudCBzY3JvbGxpbmcuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGlmIChkYXRhLmRpcmVjdGlvbiA9PT0gJ2xlZnQnKSB7XG4gICAgICBsaWdodGJveC5uZXh0KCk7XG4gICAgfSBlbHNlIGlmIChkYXRhLmRpcmVjdGlvbiA9PT0gJ3JpZ2h0Jykge1xuICAgICAgbGlnaHRib3gucHJldigpO1xuICAgIH1cbiAgfTtcblxuICB2YXIgZm9jdXNUaGlzID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZm9jdXMoKTtcbiAgfTtcblxuICBmdW5jdGlvbiBwcmV2ZW50RGVmYXVsdChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBrZXlIYW5kbGVyKGV2ZW50KSB7XG4gICAgdmFyIGtleUNvZGUgPSBldmVudC5rZXlDb2RlO1xuXG4gICAgLy8gW2VzY10gb3IgKFtlbnRlcl0gb3IgW3NwYWNlXSB3aGlsZSBjbG9zZSBidXR0b24gaXMgZm9jdXNlZClcbiAgICBpZiAoa2V5Q29kZSA9PT0gMjcgfHwgY2hlY2tGb3JGb2N1c1RyaWdnZXIoa2V5Q29kZSwgJ2Nsb3NlJykpIHtcbiAgICAgIGxpZ2h0Ym94LmhpZGUoKTtcblxuICAgICAgLy8gW+KXgF0gb3IgKFtlbnRlcl0gb3IgW3NwYWNlXSB3aGlsZSBsZWZ0IGJ1dHRvbiBpcyBmb2N1c2VkKVxuICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gMzcgfHwgY2hlY2tGb3JGb2N1c1RyaWdnZXIoa2V5Q29kZSwgJ2xlZnQnKSkge1xuICAgICAgbGlnaHRib3gucHJldigpO1xuXG4gICAgICAvLyBb4pa2XSBvciAoW2VudGVyXSBvciBbc3BhY2VdIHdoaWxlIHJpZ2h0IGJ1dHRvbiBpcyBmb2N1c2VkKVxuICAgIH0gZWxzZSBpZiAoa2V5Q29kZSA9PT0gMzkgfHwgY2hlY2tGb3JGb2N1c1RyaWdnZXIoa2V5Q29kZSwgJ3JpZ2h0JykpIHtcbiAgICAgIGxpZ2h0Ym94Lm5leHQoKTtcbiAgICAgIC8vIFtlbnRlcl0gb3IgW3NwYWNlXSB3aGlsZSBhIHRodW1ibmFpbCBpcyBmb2N1c2VkXG4gICAgfSBlbHNlIGlmIChjaGVja0ZvckZvY3VzVHJpZ2dlcihrZXlDb2RlLCAnaXRlbScpKSB7XG4gICAgICAkKCc6Zm9jdXMnKS5jbGljaygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBjaGVja0ZvckZvY3VzVHJpZ2dlciB3aWxsIGNoZWNrIGlmIHRoZSBjdXJyZW50IGZvY3VzZWQgZWxlbWVudCBpbmNsdWRlcyB0aGUgbWF0Y2hpbmcgY2xhc3NcbiAgICogYW5kIHRoYXQgdGhlIHVzZXIgaGFzIHByZXNzZWQgZWl0aGVyIGVudGVyIG9yIHNwYWNlIHRvIHRyaWdnZXIgYW4gYWN0aW9uLlxuICAgKiBAcGFyYW0gIHtudW1iZXJ9IFRoZSBudW1lcmljYWwga2V5Q29kZSBmcm9tIHRoZSBga2V5ZG93bmAgZXZlbnRcbiAgICogQHBhcmFtICB7c3RyaW5nfSBUaGUgdW5pcXVlIHBhcnQgb2YgdGhlIGBjbGFzc05hbWVgIGZyb20gdGhlIGVsZW1lbnQgd2UgYXJlIGNoZWNraW5nLiBFLmcuIGBjbG9zZWAgd2lsbCBiZSBwcmVmaXhlZCBpbnRvIGB3LWxpZ2h0Ym94LWNsb3NlYFxuICAgKiBAcmV0dXJuIHtib29sZWFufVxuICAgKi9cbiAgZnVuY3Rpb24gY2hlY2tGb3JGb2N1c1RyaWdnZXIoa2V5Q29kZSwgY2xhc3NNYXRjaCkge1xuICAgIGlmIChrZXlDb2RlICE9PSAxMyAmJiBrZXlDb2RlICE9PSAzMikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBjdXJyZW50RWxlbWVudENsYXNzZXMgPSAkKCc6Zm9jdXMnKS5hdHRyKCdjbGFzcycpO1xuICAgIHZhciBjbGFzc1RvRmluZCA9IHByZWZpeGVkKGNsYXNzTWF0Y2gpLnRyaW0oKTtcblxuICAgIHJldHVybiBjdXJyZW50RWxlbWVudENsYXNzZXMuaW5jbHVkZXMoY2xhc3NUb0ZpbmQpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZUxpZ2h0Ym94KCkge1xuICAgIC8vIElmIHRoZSBsaWdodGJveCBoYXNuJ3QgYmVlbiBkZXN0cm95ZWQgYWxyZWFkeVxuICAgIGlmICgkcmVmcykge1xuICAgICAgLy8gUmVzZXQgc3RyaXAgc2Nyb2xsLCBvdGhlcndpc2UgbmV4dCBsaWdodGJveCBvcGVucyBzY3JvbGxlZCB0byBsYXN0IHBvc2l0aW9uXG4gICAgICAkcmVmcy5zdHJpcC5zY3JvbGxMZWZ0KDApLmVtcHR5KCk7XG4gICAgICByZW1vdmVDbGFzcygkcmVmcy5odG1sLCAnbm9zY3JvbGwnKTtcbiAgICAgIGFkZENsYXNzKCRyZWZzLmxpZ2h0Ym94LCAnaGlkZScpO1xuICAgICAgJHJlZnMudmlldyAmJiAkcmVmcy52aWV3LnJlbW92ZSgpO1xuXG4gICAgICAvLyBSZXNldCBzb21lIHN0dWZmXG4gICAgICByZW1vdmVDbGFzcygkcmVmcy5jb250ZW50LCAnZ3JvdXAnKTtcbiAgICAgIGFkZENsYXNzKCRyZWZzLmFycm93TGVmdCwgJ2luYWN0aXZlJyk7XG4gICAgICBhZGRDbGFzcygkcmVmcy5hcnJvd1JpZ2h0LCAnaW5hY3RpdmUnKTtcblxuICAgICAgY3VycmVudEluZGV4ID0gJHJlZnMudmlldyA9IHVuZGVmaW5lZDtcblxuICAgICAgLy8gQnJpbmcgdGhlIHBhZ2UgZWxlbWVudHMgYmFjayBpbnRvIHRoZSBhY2Nlc3NpYmxpdHkgdHJlZVxuICAgICAgcmVzZXRWaXNpYmlsaXR5U3RhdGUuZm9yRWFjaChmdW5jdGlvbiAodmlzaWJpbGl0eVN0YXRlKSB7XG4gICAgICAgIHZhciBub2RlID0gdmlzaWJpbGl0eVN0YXRlLm5vZGU7XG5cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZpc2liaWxpdHlTdGF0ZS5oaWRkZW4pIHtcbiAgICAgICAgICBub2RlLmF0dHIoJ2FyaWEtaGlkZGVuJywgdmlzaWJpbGl0eVN0YXRlLmhpZGRlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbm9kZS5yZW1vdmVBdHRyKCdhcmlhLWhpZGRlbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZpc2liaWxpdHlTdGF0ZS50YWJJbmRleCkge1xuICAgICAgICAgIG5vZGUuYXR0cigndGFiSW5kZXgnLCB2aXNpYmlsaXR5U3RhdGUudGFiSW5kZXgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5vZGUucmVtb3ZlQXR0cigndGFiSW5kZXgnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIENsZWFyIG91dCB0aGUgcmVzZXQgdmlzaWJpbGl0eSBzdGF0ZVxuICAgICAgcmVzZXRWaXNpYmlsaXR5U3RhdGUgPSBbXTtcblxuICAgICAgLy8gUmUtZm9jdXMgb24gdGhlIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIGxpZ2h0Ym94XG4gICAgICAkKCcuYWN0aXZlLWxpZ2h0Ym94JykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZS1saWdodGJveCcpLmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbG9hZEltYWdlKHVybCwgY2FsbGJhY2spIHtcbiAgICB2YXIgJGltYWdlID0gZG9tKCdpbWcnLCAnaW1nJyk7XG5cbiAgICAkaW1hZ2Uub25lKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgY2FsbGJhY2soJGltYWdlKTtcbiAgICB9KTtcblxuICAgIC8vIFN0YXJ0IGxvYWRpbmcgaW1hZ2UuXG4gICAgJGltYWdlLmF0dHIoJ3NyYycsIHVybCk7XG5cbiAgICByZXR1cm4gJGltYWdlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlcigkZWxlbWVudCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAkZWxlbWVudC5yZW1vdmUoKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gbWF5YmVTY3JvbGwoJGl0ZW0pIHtcbiAgICB2YXIgaXRlbUVsZW1lbnQgPSAkaXRlbS5nZXQoMCk7XG4gICAgdmFyIHN0cmlwRWxlbWVudCA9ICRyZWZzLnN0cmlwLmdldCgwKTtcbiAgICB2YXIgaXRlbUxlZnQgPSBpdGVtRWxlbWVudC5vZmZzZXRMZWZ0O1xuICAgIHZhciBpdGVtV2lkdGggPSBpdGVtRWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICB2YXIgc3RyaXBTY3JvbGxMZWZ0ID0gc3RyaXBFbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgdmFyIHN0cmlwV2lkdGggPSBzdHJpcEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgdmFyIHN0cmlwU2Nyb2xsTGVmdE1heCA9IHN0cmlwRWxlbWVudC5zY3JvbGxXaWR0aCAtIHN0cmlwV2lkdGg7XG5cbiAgICB2YXIgbmV3U2Nyb2xsTGVmdDtcbiAgICBpZiAoaXRlbUxlZnQgPCBzdHJpcFNjcm9sbExlZnQpIHtcbiAgICAgIG5ld1Njcm9sbExlZnQgPSBNYXRoLm1heCgwLCBpdGVtTGVmdCArIGl0ZW1XaWR0aCAtIHN0cmlwV2lkdGgpO1xuICAgIH0gZWxzZSBpZiAoaXRlbUxlZnQgKyBpdGVtV2lkdGggPiBzdHJpcFdpZHRoICsgc3RyaXBTY3JvbGxMZWZ0KSB7XG4gICAgICBuZXdTY3JvbGxMZWZ0ID0gTWF0aC5taW4oaXRlbUxlZnQsIHN0cmlwU2Nyb2xsTGVmdE1heCk7XG4gICAgfVxuXG4gICAgaWYgKG5ld1Njcm9sbExlZnQgIT0gbnVsbCkge1xuICAgICAgdHJhbSgkcmVmcy5zdHJpcClcbiAgICAgICAgLmFkZCgnc2Nyb2xsLWxlZnQgNTAwbXMnKVxuICAgICAgICAuc3RhcnQoeydzY3JvbGwtbGVmdCc6IG5ld1Njcm9sbExlZnR9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU3Bpbm5lclxuICAgKi9cbiAgZnVuY3Rpb24gU3Bpbm5lcigkc3Bpbm5lciwgY2xhc3NOYW1lLCBkZWxheSkge1xuICAgIHRoaXMuJGVsZW1lbnQgPSAkc3Bpbm5lcjtcbiAgICB0aGlzLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICB0aGlzLmRlbGF5ID0gZGVsYXkgfHwgMjAwO1xuICAgIHRoaXMuaGlkZSgpO1xuICB9XG5cbiAgU3Bpbm5lci5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc3Bpbm5lciA9IHRoaXM7XG5cbiAgICAvLyBCYWlsIGlmIHdlIGFyZSBhbHJlYWR5IHNob3dpbmcgdGhlIHNwaW5uZXIuXG4gICAgaWYgKHNwaW5uZXIudGltZW91dElkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3Bpbm5lci50aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIHNwaW5uZXIuJGVsZW1lbnQucmVtb3ZlQ2xhc3Moc3Bpbm5lci5jbGFzc05hbWUpO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHdlYmZsb3cvbm8tZGVsZXRlXG4gICAgICBkZWxldGUgc3Bpbm5lci50aW1lb3V0SWQ7XG4gICAgfSwgc3Bpbm5lci5kZWxheSk7XG4gIH07XG5cbiAgU3Bpbm5lci5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc3Bpbm5lciA9IHRoaXM7XG4gICAgaWYgKHNwaW5uZXIudGltZW91dElkKSB7XG4gICAgICBjbGVhclRpbWVvdXQoc3Bpbm5lci50aW1lb3V0SWQpO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHdlYmZsb3cvbm8tZGVsZXRlXG4gICAgICBkZWxldGUgc3Bpbm5lci50aW1lb3V0SWQ7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3Bpbm5lci4kZWxlbWVudC5hZGRDbGFzcyhzcGlubmVyLmNsYXNzTmFtZSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gcHJlZml4ZWQoc3RyaW5nLCBpc1NlbGVjdG9yKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKHByZWZpeFJlZ2V4LCAoaXNTZWxlY3RvciA/ICcgLicgOiAnICcpICsgcHJlZml4KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdG9yKHN0cmluZykge1xuICAgIHJldHVybiBwcmVmaXhlZChzdHJpbmcsIHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIGpRdWVyeS5hZGRDbGFzcyB3aXRoIGF1dG8tcHJlZml4aW5nXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gRWxlbWVudCB0byBhZGQgY2xhc3MgdG9cbiAgICogQHBhcmFtICB7c3RyaW5nfSBDbGFzcyBuYW1lIHRoYXQgd2lsbCBiZSBwcmVmaXhlZCBhbmQgYWRkZWQgdG8gZWxlbWVudFxuICAgKiBAcmV0dXJuIHtqUXVlcnl9XG4gICAqL1xuICBmdW5jdGlvbiBhZGRDbGFzcygkZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuICRlbGVtZW50LmFkZENsYXNzKHByZWZpeGVkKGNsYXNzTmFtZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIGpRdWVyeS5yZW1vdmVDbGFzcyB3aXRoIGF1dG8tcHJlZml4aW5nXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gRWxlbWVudCB0byByZW1vdmUgY2xhc3MgZnJvbVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IENsYXNzIG5hbWUgdGhhdCB3aWxsIGJlIHByZWZpeGVkIGFuZCByZW1vdmVkIGZyb20gZWxlbWVudFxuICAgKiBAcmV0dXJuIHtqUXVlcnl9XG4gICAqL1xuICBmdW5jdGlvbiByZW1vdmVDbGFzcygkZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuICRlbGVtZW50LnJlbW92ZUNsYXNzKHByZWZpeGVkKGNsYXNzTmFtZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIGpRdWVyeS50b2dnbGVDbGFzcyB3aXRoIGF1dG8tcHJlZml4aW5nXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gIEVsZW1lbnQgd2hlcmUgY2xhc3Mgd2lsbCBiZSB0b2dnbGVkXG4gICAqIEBwYXJhbSAge3N0cmluZ30gIENsYXNzIG5hbWUgdGhhdCB3aWxsIGJlIHByZWZpeGVkIGFuZCB0b2dnbGVkXG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IE9wdGlvbmFsIGJvb2xlYW4gdGhhdCBkZXRlcm1pbmVzIGlmIGNsYXNzIHdpbGwgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICAgKiBAcmV0dXJuIHtqUXVlcnl9XG4gICAqL1xuICBmdW5jdGlvbiB0b2dnbGVDbGFzcygkZWxlbWVudCwgY2xhc3NOYW1lLCBzaG91bGRBZGQpIHtcbiAgICByZXR1cm4gJGVsZW1lbnQudG9nZ2xlQ2xhc3MocHJlZml4ZWQoY2xhc3NOYW1lKSwgc2hvdWxkQWRkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBqUXVlcnkudG9nZ2xlSGlkZGVuXG4gICAqIEBwYXJhbSAge2pRdWVyeX0gIEVsZW1lbnQgd2hlcmUgYXR0cmlidXRlIHdpbGwgYmUgc2V0XG4gICAqIEBwYXJhbSAge2Jvb2xlYW59IEJvb2xlYW4gdGhhdCBkZXRlcm1pbmVzIGlmIGFyaWEtaGlkZGVuIHdpbGwgYmUgdHJ1ZSBvciBmYWxzZVxuICAgKiBAcmV0dXJuIHtqUXVlcnl9XG4gICAqL1xuICBmdW5jdGlvbiB0b2dnbGVIaWRkZW4oJGVsZW1lbnQsIGlzSGlkZGVuKSB7XG4gICAgcmV0dXJuICRlbGVtZW50XG4gICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCBpc0hpZGRlbilcbiAgICAgIC5hdHRyKCd0YWJJbmRleCcsIGlzSGlkZGVuID8gLTEgOiAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgRE9NIGVsZW1lbnQgd3JhcHBlZCBpbiBhIGpRdWVyeSBvYmplY3QsXG4gICAqIGRlY29yYXRlZCB3aXRoIG91ciBjdXN0b20gbWV0aG9kcy5cbiAgICogQHBhcmFtICB7c3RyaW5nfSBjbGFzc05hbWVcbiAgICogQHBhcmFtICB7c3RyaW5nfSBbdGFnXVxuICAgKiBAcmV0dXJuIHtqUXVlcnl9XG4gICAqL1xuICBmdW5jdGlvbiBkb20oY2xhc3NOYW1lLCB0YWcpIHtcbiAgICByZXR1cm4gYWRkQ2xhc3MoJChkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyB8fCAnZGl2JykpLCBjbGFzc05hbWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3ZnRGF0YVVyaSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIHN2ZyA9XG4gICAgICAnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCInICtcbiAgICAgIHdpZHRoICtcbiAgICAgICdcIiBoZWlnaHQ9XCInICtcbiAgICAgIGhlaWdodCArXG4gICAgICAnXCIvPic7XG4gICAgcmV0dXJuICdkYXRhOmltYWdlL3N2Zyt4bWw7Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJKHN2Zyk7XG4gIH1cblxuICAvLyBDb21wdXRlIHNvbWUgZGltZW5zaW9ucyBtYW51YWxseSBmb3IgaU9TIDwgOCwgYmVjYXVzZSBvZiBidWdneSBzdXBwb3J0IGZvciBWSC5cbiAgLy8gQWxzbywgQW5kcm9pZCBidWlsdC1pbiBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdmlld3BvcnQgdW5pdHMuXG4gIChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgdmFyIGlPU1JlZ2V4ID0gLyhpUGhvbmV8aVBhZHxpUG9kKTtbXk9TXSpPUyAoXFxkKS87XG4gICAgdmFyIGlPU01hdGNoZXMgPSB1YS5tYXRjaChpT1NSZWdleCk7XG4gICAgdmFyIGFuZHJvaWQgPSB1YS5pbmRleE9mKCdBbmRyb2lkICcpID4gLTEgJiYgdWEuaW5kZXhPZignQ2hyb21lJykgPT09IC0xO1xuXG4gICAgaWYgKCFhbmRyb2lkICYmICghaU9TTWF0Y2hlcyB8fCBpT1NNYXRjaGVzWzJdID4gNykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHN0eWxlTm9kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZU5vZGUpO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZWZyZXNoLCB0cnVlKTtcblxuICAgIGZ1bmN0aW9uIHJlZnJlc2goKSB7XG4gICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICB2YXIgdncgPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgIHZhciBjb250ZW50ID1cbiAgICAgICAgJy53LWxpZ2h0Ym94LWNvbnRlbnQsIC53LWxpZ2h0Ym94LXZpZXcsIC53LWxpZ2h0Ym94LXZpZXc6YmVmb3JlIHsnICtcbiAgICAgICAgJ2hlaWdodDonICtcbiAgICAgICAgdmggK1xuICAgICAgICAncHgnICtcbiAgICAgICAgJ30nICtcbiAgICAgICAgJy53LWxpZ2h0Ym94LXZpZXcgeycgK1xuICAgICAgICAnd2lkdGg6JyArXG4gICAgICAgIHZ3ICtcbiAgICAgICAgJ3B4JyArXG4gICAgICAgICd9JyArXG4gICAgICAgICcudy1saWdodGJveC1ncm91cCwgLnctbGlnaHRib3gtZ3JvdXAgLnctbGlnaHRib3gtdmlldywgLnctbGlnaHRib3gtZ3JvdXAgLnctbGlnaHRib3gtdmlldzpiZWZvcmUgeycgK1xuICAgICAgICAnaGVpZ2h0OicgK1xuICAgICAgICAwLjg2ICogdmggK1xuICAgICAgICAncHgnICtcbiAgICAgICAgJ30nICtcbiAgICAgICAgJy53LWxpZ2h0Ym94LWltYWdlIHsnICtcbiAgICAgICAgJ21heC13aWR0aDonICtcbiAgICAgICAgdncgK1xuICAgICAgICAncHg7JyArXG4gICAgICAgICdtYXgtaGVpZ2h0OicgK1xuICAgICAgICB2aCArXG4gICAgICAgICdweCcgK1xuICAgICAgICAnfScgK1xuICAgICAgICAnLnctbGlnaHRib3gtZ3JvdXAgLnctbGlnaHRib3gtaW1hZ2UgeycgK1xuICAgICAgICAnbWF4LWhlaWdodDonICtcbiAgICAgICAgMC44NiAqIHZoICtcbiAgICAgICAgJ3B4JyArXG4gICAgICAgICd9JyArXG4gICAgICAgICcudy1saWdodGJveC1zdHJpcCB7JyArXG4gICAgICAgICdwYWRkaW5nOiAwICcgK1xuICAgICAgICAwLjAxICogdmggK1xuICAgICAgICAncHgnICtcbiAgICAgICAgJ30nICtcbiAgICAgICAgJy53LWxpZ2h0Ym94LWl0ZW0geycgK1xuICAgICAgICAnd2lkdGg6JyArXG4gICAgICAgIDAuMSAqIHZoICtcbiAgICAgICAgJ3B4OycgK1xuICAgICAgICAncGFkZGluZzonICtcbiAgICAgICAgMC4wMiAqIHZoICtcbiAgICAgICAgJ3B4ICcgK1xuICAgICAgICAwLjAxICogdmggK1xuICAgICAgICAncHgnICtcbiAgICAgICAgJ30nICtcbiAgICAgICAgJy53LWxpZ2h0Ym94LXRodW1ibmFpbCB7JyArXG4gICAgICAgICdoZWlnaHQ6JyArXG4gICAgICAgIDAuMSAqIHZoICtcbiAgICAgICAgJ3B4JyArXG4gICAgICAgICd9JyArXG4gICAgICAgICdAbWVkaWEgKG1pbi13aWR0aDogNzY4cHgpIHsnICtcbiAgICAgICAgJy53LWxpZ2h0Ym94LWNvbnRlbnQsIC53LWxpZ2h0Ym94LXZpZXcsIC53LWxpZ2h0Ym94LXZpZXc6YmVmb3JlIHsnICtcbiAgICAgICAgJ2hlaWdodDonICtcbiAgICAgICAgMC45NiAqIHZoICtcbiAgICAgICAgJ3B4JyArXG4gICAgICAgICd9JyArXG4gICAgICAgICcudy1saWdodGJveC1jb250ZW50IHsnICtcbiAgICAgICAgJ21hcmdpbi10b3A6JyArXG4gICAgICAgIDAuMDIgKiB2aCArXG4gICAgICAgICdweCcgK1xuICAgICAgICAnfScgK1xuICAgICAgICAnLnctbGlnaHRib3gtZ3JvdXAsIC53LWxpZ2h0Ym94LWdyb3VwIC53LWxpZ2h0Ym94LXZpZXcsIC53LWxpZ2h0Ym94LWdyb3VwIC53LWxpZ2h0Ym94LXZpZXc6YmVmb3JlIHsnICtcbiAgICAgICAgJ2hlaWdodDonICtcbiAgICAgICAgMC44NCAqIHZoICtcbiAgICAgICAgJ3B4JyArXG4gICAgICAgICd9JyArXG4gICAgICAgICcudy1saWdodGJveC1pbWFnZSB7JyArXG4gICAgICAgICdtYXgtd2lkdGg6JyArXG4gICAgICAgIDAuOTYgKiB2dyArXG4gICAgICAgICdweDsnICtcbiAgICAgICAgJ21heC1oZWlnaHQ6JyArXG4gICAgICAgIDAuOTYgKiB2aCArXG4gICAgICAgICdweCcgK1xuICAgICAgICAnfScgK1xuICAgICAgICAnLnctbGlnaHRib3gtZ3JvdXAgLnctbGlnaHRib3gtaW1hZ2UgeycgK1xuICAgICAgICAnbWF4LXdpZHRoOicgK1xuICAgICAgICAwLjgyMyAqIHZ3ICtcbiAgICAgICAgJ3B4OycgK1xuICAgICAgICAnbWF4LWhlaWdodDonICtcbiAgICAgICAgMC44NCAqIHZoICtcbiAgICAgICAgJ3B4JyArXG4gICAgICAgICd9JyArXG4gICAgICAgICd9JztcblxuICAgICAgc3R5bGVOb2RlLnRleHRDb250ZW50ID0gY29udGVudDtcbiAgICB9XG5cbiAgICByZWZyZXNoKCk7XG4gIH0pKCk7XG5cbiAgcmV0dXJuIGxpZ2h0Ym94O1xufVxuXG5XZWJmbG93LmRlZmluZShcbiAgJ2xpZ2h0Ym94JyxcbiAgKG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCQpIHtcbiAgICB2YXIgYXBpID0ge307XG4gICAgdmFyIGluQXBwID0gV2ViZmxvdy5lbnYoKTtcbiAgICB2YXIgbGlnaHRib3ggPSBjcmVhdGVMaWdodGJveChcbiAgICAgIHdpbmRvdyxcbiAgICAgIGRvY3VtZW50LFxuICAgICAgJCxcbiAgICAgIGluQXBwID8gJyNsaWdodGJveC1tb3VudHBvaW50JyA6ICdib2R5J1xuICAgICk7XG4gICAgdmFyICRkb2MgPSAkKGRvY3VtZW50KTtcbiAgICB2YXIgJGxpZ2h0Ym94ZXM7XG4gICAgdmFyIGRlc2lnbmVyO1xuICAgIHZhciBuYW1lc3BhY2UgPSAnLnctbGlnaHRib3gnO1xuICAgIHZhciBncm91cHM7XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIE1vZHVsZSBtZXRob2RzXG5cbiAgICBhcGkucmVhZHkgPSBhcGkuZGVzaWduID0gYXBpLnByZXZpZXcgPSBpbml0O1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBQcml2YXRlIG1ldGhvZHNcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICBkZXNpZ25lciA9IGluQXBwICYmIFdlYmZsb3cuZW52KCdkZXNpZ24nKTtcblxuICAgICAgLy8gUmVzZXQgTGlnaHRib3hcbiAgICAgIGxpZ2h0Ym94LmRlc3Ryb3koKTtcblxuICAgICAgLy8gUmVzZXQgZ3JvdXBzXG4gICAgICBncm91cHMgPSB7fTtcblxuICAgICAgLy8gRmluZCBhbGwgaW5zdGFuY2VzIG9uIHRoZSBwYWdlXG4gICAgICAkbGlnaHRib3hlcyA9ICRkb2MuZmluZChuYW1lc3BhY2UpO1xuXG4gICAgICAvLyBJbnN0YW50aWF0ZSBhbGwgbGlnaGJveGVzXG4gICAgICAkbGlnaHRib3hlcy53ZWJmbG93TGlnaHRCb3goKTtcblxuICAgICAgLy8gU2V0IGFjY2Vzc2liaWxpdHkgcHJvcGVydGllcyB0aGF0IGFyZSB1c2VmdWwgcHJpb3JcbiAgICAgIC8vIHRvIGEgbGlnaHRib3ggYmVpbmcgb3BlbmVkXG4gICAgICAkbGlnaHRib3hlcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2V0QXJpYUxhYmVsSWZFbXB0eSgkKHRoaXMpLCAnb3BlbiBsaWdodGJveCcpO1xuXG4gICAgICAgICQodGhpcykuYXR0cignYXJpYS1oYXNwb3B1cCcsICdkaWFsb2cnKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGpRdWVyeS5mbi5leHRlbmQoe1xuICAgICAgd2ViZmxvd0xpZ2h0Qm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciAkZWwgPSB0aGlzO1xuICAgICAgICAkLmVhY2goJGVsLCBmdW5jdGlvbiAoaSwgZWwpIHtcbiAgICAgICAgICAvLyBTdG9yZSBzdGF0ZSBpbiBkYXRhXG4gICAgICAgICAgdmFyIGRhdGEgPSAkLmRhdGEoZWwsIG5hbWVzcGFjZSk7XG4gICAgICAgICAgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICBkYXRhID0gJC5kYXRhKGVsLCBuYW1lc3BhY2UsIHtcbiAgICAgICAgICAgICAgZWw6ICQoZWwpLFxuICAgICAgICAgICAgICBtb2RlOiAnaW1hZ2VzJyxcbiAgICAgICAgICAgICAgaW1hZ2VzOiBbXSxcbiAgICAgICAgICAgICAgZW1iZWQ6ICcnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVtb3ZlIG9sZCBldmVudHNcbiAgICAgICAgICBkYXRhLmVsLm9mZihuYW1lc3BhY2UpO1xuXG4gICAgICAgICAgLy8gU2V0IGNvbmZpZyBmcm9tIGpzb24gc2NyaXB0IHRhZ1xuICAgICAgICAgIGNvbmZpZ3VyZShkYXRhKTtcblxuICAgICAgICAgIC8vIEFkZCBldmVudHMgYmFzZWQgb24gbW9kZVxuICAgICAgICAgIGlmIChkZXNpZ25lcikge1xuICAgICAgICAgICAgZGF0YS5lbC5vbignc2V0dGluZycgKyBuYW1lc3BhY2UsIGNvbmZpZ3VyZS5iaW5kKG51bGwsIGRhdGEpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YS5lbFxuICAgICAgICAgICAgICAub24oJ2NsaWNrJyArIG5hbWVzcGFjZSwgY2xpY2tIYW5kbGVyKGRhdGEpKVxuICAgICAgICAgICAgICAvLyBQcmV2ZW50IHBhZ2Ugc2Nyb2xsaW5nIHRvIHRvcCB3aGVuIGNsaWNraW5nIG9uIGxpZ2h0Ym94IHRyaWdnZXJzLlxuICAgICAgICAgICAgICAub24oJ2NsaWNrJyArIG5hbWVzcGFjZSwgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gY29uZmlndXJlKGRhdGEpIHtcbiAgICAgIHZhciBqc29uID0gZGF0YS5lbC5jaGlsZHJlbignLnctanNvbicpLmh0bWwoKTtcbiAgICAgIHZhciBncm91cE5hbWU7XG4gICAgICB2YXIgZ3JvdXBJdGVtcztcblxuICAgICAgaWYgKCFqc29uKSB7XG4gICAgICAgIGRhdGEuaXRlbXMgPSBbXTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBqc29uID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignTWFsZm9ybWVkIGxpZ2h0Ym94IEpTT04gY29uZmlndXJhdGlvbi4nLCBlKTtcbiAgICAgIH1cblxuICAgICAgc3VwcG9ydE9sZExpZ2h0Ym94SnNvbihqc29uKTtcblxuICAgICAganNvbi5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIGl0ZW0uJGVsID0gZGF0YS5lbDtcbiAgICAgIH0pO1xuXG4gICAgICBncm91cE5hbWUgPSBqc29uLmdyb3VwO1xuXG4gICAgICBpZiAoZ3JvdXBOYW1lKSB7XG4gICAgICAgIGdyb3VwSXRlbXMgPSBncm91cHNbZ3JvdXBOYW1lXTtcbiAgICAgICAgaWYgKCFncm91cEl0ZW1zKSB7XG4gICAgICAgICAgZ3JvdXBJdGVtcyA9IGdyb3Vwc1tncm91cE5hbWVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLml0ZW1zID0gZ3JvdXBJdGVtcztcblxuICAgICAgICBpZiAoanNvbi5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICBkYXRhLmluZGV4ID0gZ3JvdXBJdGVtcy5sZW5ndGg7XG4gICAgICAgICAgZ3JvdXBJdGVtcy5wdXNoLmFwcGx5KGdyb3VwSXRlbXMsIGpzb24uaXRlbXMpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkYXRhLml0ZW1zID0ganNvbi5pdGVtcztcbiAgICAgICAgZGF0YS5pbmRleCA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGRhdGEpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRhdGEuaXRlbXMubGVuZ3RoICYmIGxpZ2h0Ym94KGRhdGEuaXRlbXMsIGRhdGEuaW5kZXggfHwgMCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1cHBvcnRPbGRMaWdodGJveEpzb24oZGF0YSkge1xuICAgICAgaWYgKGRhdGEuaW1hZ2VzKSB7XG4gICAgICAgIGRhdGEuaW1hZ2VzLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICBpdGVtLnR5cGUgPSAnaW1hZ2UnO1xuICAgICAgICB9KTtcbiAgICAgICAgZGF0YS5pdGVtcyA9IGRhdGEuaW1hZ2VzO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5lbWJlZCkge1xuICAgICAgICBkYXRhLmVtYmVkLnR5cGUgPSAndmlkZW8nO1xuICAgICAgICBkYXRhLml0ZW1zID0gW2RhdGEuZW1iZWRdO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YS5ncm91cElkKSB7XG4gICAgICAgIGRhdGEuZ3JvdXAgPSBkYXRhLmdyb3VwSWQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRXhwb3J0IG1vZHVsZVxuICAgIHJldHVybiBhcGk7XG4gIH0pXG4pO1xuIl0sIm5hbWVzIjpbIldlYmZsb3ciLCJyZXF1aXJlIiwiQ09ORElUSU9OX0lOVklTSUJMRV9DTEFTUyIsIkNPTkRWSVNfU0VMRUNUT1IiLCJ3aXRob3V0Q29uZGl0aW9uYWxseUhpZGRlbiIsIml0ZW1zIiwiZmlsdGVyIiwiaXRlbSIsImlzQ29uZGl0aW9uYWxseUhpZGRlbiIsIkJvb2xlYW4iLCIkZWwiLCJjbG9zZXN0IiwibGVuZ3RoIiwiZ2V0UHJldmlvdXNWaXNpYmxlSW5kZXgiLCJzdGFydCIsImkiLCJnZXROZXh0VmlzaWJsZUluZGV4Iiwic2hvdWxkU2V0QXJyb3dMZWZ0SW5hY3RpdmUiLCJjdXJyZW50SW5kZXgiLCJzaG91bGRTZXRBcnJvd1JpZ2h0SW5hY3RpdmUiLCJzZXRBcmlhTGFiZWxJZkVtcHR5IiwiJGVsZW1lbnQiLCJsYWJlbFRleHQiLCJhdHRyIiwiY3JlYXRlTGlnaHRib3giLCJ3aW5kb3ciLCJkb2N1bWVudCIsIiQiLCJjb250YWluZXIiLCJ0cmFtIiwiaXNBcnJheSIsIkFycmF5IiwibmFtZXNwYWNlIiwicHJlZml4IiwicHJlZml4UmVnZXgiLCIkcmVmcyIsInNwaW5uZXIiLCJyZXNldFZpc2liaWxpdHlTdGF0ZSIsImxpZ2h0Ym94IiwidGhpbmciLCJpbmRleCIsImJ1aWxkIiwiZW1wdHkiLCJmb3JFYWNoIiwiaWR4IiwiJHRodW1ibmFpbCIsImRvbSIsIiRpdGVtIiwicHJvcCIsImFwcGVuZCIsImFkZENsYXNzIiwiYWRkIiwibG9hZEltYWdlIiwidGh1bWJuYWlsVXJsIiwidXJsIiwiJGltYWdlIiwic3RyaXAiLCJjb250ZW50IiwicmVtb3ZlQ2xhc3MiLCJ0cmlnZ2VyIiwib3BhY2l0eSIsImh0bWwiLCJzaG93IiwiZGVzdHJveSIsImRvY3VtZW50RWxlbWVudCIsImFycm93TGVmdCIsImFycm93UmlnaHQiLCJjbG9zZSIsIlNwaW5uZXIiLCJwcmVmaXhlZCIsIm9uIiwic2VsZWN0b3IiLCJpdGVtVGFwSGFuZGxlciIsInN3aXBlSGFuZGxlciIsImhhbmRsZXJQcmV2IiwiaGFuZGxlck5leHQiLCJoYW5kbGVySGlkZSIsInByZXZlbnREZWZhdWx0Iiwia2V5SGFuZGxlciIsImZvY3VzVGhpcyIsInJlbW92ZSIsInVuZGVmaW5lZCIsImhpZGUiLCJwcmV2aW91c1Zpc2libGVJbmRleCIsIm5leHRWaXNpYmxlSW5kZXgiLCJwcmV2aW91c0luZGV4Iiwic3ZnRGF0YVVyaSIsIndpZHRoIiwiaGVpZ2h0IiwiJGZpZ3VyZSIsIiRmcmFtZSIsIiRuZXdWaWV3IiwiJGh0bWwiLCJpc0lmcmFtZSIsImlzIiwidHJhbnNpdGlvblRvTmV3VmlldyIsImNhcHRpb24iLCJ0ZXh0IiwiYmVmb3JlIiwic2hvdWxkSGlkZUxlZnRBcnJvdyIsInRvZ2dsZUNsYXNzIiwidG9nZ2xlSGlkZGVuIiwiZm9jdXMiLCJzaG91bGRIaWRlUmlnaHRBcnJvdyIsInZpZXciLCJ0aGVuIiwicmVtb3ZlciIsInNldCIsIngiLCJjc3MiLCJyZW1vdmVBdHRyIiwiJGFjdGl2ZVRodW1iIiwiZXEiLCJtYXliZVNjcm9sbCIsImNoaWxkcmVuIiwiZWFjaCIsImhhc0NsYXNzIiwicHVzaCIsIm5vZGUiLCJoaWRkZW4iLCJ0YWJJbmRleCIsImhpZGVMaWdodGJveCIsInByZXYiLCJuZXh0IiwiY3JlYXRlSGFuZGxlciIsImFjdGlvbiIsImV2ZW50IiwidGFyZ2V0Iiwic3RvcFByb3BhZ2F0aW9uIiwiZGF0YSIsImRpcmVjdGlvbiIsImtleUNvZGUiLCJjaGVja0ZvckZvY3VzVHJpZ2dlciIsImNsaWNrIiwiY2xhc3NNYXRjaCIsImN1cnJlbnRFbGVtZW50Q2xhc3NlcyIsImNsYXNzVG9GaW5kIiwidHJpbSIsImluY2x1ZGVzIiwic2Nyb2xsTGVmdCIsInZpc2liaWxpdHlTdGF0ZSIsImNhbGxiYWNrIiwib25lIiwiaXRlbUVsZW1lbnQiLCJnZXQiLCJzdHJpcEVsZW1lbnQiLCJpdGVtTGVmdCIsIm9mZnNldExlZnQiLCJpdGVtV2lkdGgiLCJjbGllbnRXaWR0aCIsInN0cmlwU2Nyb2xsTGVmdCIsInN0cmlwV2lkdGgiLCJzdHJpcFNjcm9sbExlZnRNYXgiLCJzY3JvbGxXaWR0aCIsIm5ld1Njcm9sbExlZnQiLCJNYXRoIiwibWF4IiwibWluIiwiJHNwaW5uZXIiLCJjbGFzc05hbWUiLCJkZWxheSIsInByb3RvdHlwZSIsInRpbWVvdXRJZCIsInNldFRpbWVvdXQiLCJjbGVhclRpbWVvdXQiLCJzdHJpbmciLCJpc1NlbGVjdG9yIiwicmVwbGFjZSIsInNob3VsZEFkZCIsImlzSGlkZGVuIiwidGFnIiwiY3JlYXRlRWxlbWVudCIsInN2ZyIsImVuY29kZVVSSSIsInVhIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiaU9TUmVnZXgiLCJpT1NNYXRjaGVzIiwibWF0Y2giLCJhbmRyb2lkIiwiaW5kZXhPZiIsInN0eWxlTm9kZSIsImhlYWQiLCJhcHBlbmRDaGlsZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZWZyZXNoIiwidmgiLCJpbm5lckhlaWdodCIsInZ3IiwiaW5uZXJXaWR0aCIsInRleHRDb250ZW50IiwiZGVmaW5lIiwibW9kdWxlIiwiZXhwb3J0cyIsImFwaSIsImluQXBwIiwiZW52IiwiJGRvYyIsIiRsaWdodGJveGVzIiwiZGVzaWduZXIiLCJncm91cHMiLCJyZWFkeSIsImRlc2lnbiIsInByZXZpZXciLCJpbml0IiwiZmluZCIsIndlYmZsb3dMaWdodEJveCIsImpRdWVyeSIsImZuIiwiZXh0ZW5kIiwiZWwiLCJtb2RlIiwiaW1hZ2VzIiwiZW1iZWQiLCJvZmYiLCJjb25maWd1cmUiLCJiaW5kIiwiY2xpY2tIYW5kbGVyIiwiZSIsImpzb24iLCJncm91cE5hbWUiLCJncm91cEl0ZW1zIiwiSlNPTiIsInBhcnNlIiwiY29uc29sZSIsImVycm9yIiwic3VwcG9ydE9sZExpZ2h0Ym94SnNvbiIsImdyb3VwIiwiYXBwbHkiLCJ0eXBlIiwiZ3JvdXBJZCJdLCJtYXBwaW5ncyI6IkFBQUEsb0NBQW9DLEdBRXBDOztDQUVDO0FBRUQsSUFBSUEsVUFBVUMsUUFBUTtBQUV0QixJQUFJQyw0QkFBNEI7QUFDaEMsSUFBSUMsbUJBQW1CLE1BQU1EO0FBRTdCLFNBQVNFLDJCQUEyQkMsS0FBSztJQUN2QyxPQUFPQSxNQUFNQyxNQUFNLENBQUMsU0FBVUMsSUFBSTtRQUNoQyxPQUFPLENBQUNDLHNCQUFzQkQ7SUFDaEM7QUFDRjtBQUVBLFNBQVNDLHNCQUFzQkQsSUFBSTtJQUNqQyxPQUFPRSxRQUFRRixLQUFLRyxHQUFHLElBQUlILEtBQUtHLEdBQUcsQ0FBQ0MsT0FBTyxDQUFDUixrQkFBa0JTLE1BQU07QUFDdEU7QUFFQSxTQUFTQyx3QkFBd0JDLEtBQUssRUFBRVQsS0FBSztJQUMzQyxJQUFLLElBQUlVLElBQUlELE9BQU9DLEtBQUssR0FBR0EsSUFBSztRQUMvQixJQUFJLENBQUNQLHNCQUFzQkgsS0FBSyxDQUFDVSxFQUFFLEdBQUc7WUFDcEMsT0FBT0E7UUFDVDtJQUNGO0lBQ0EsT0FBTyxDQUFDO0FBQ1Y7QUFFQSxTQUFTQyxvQkFBb0JGLEtBQUssRUFBRVQsS0FBSztJQUN2QyxJQUFLLElBQUlVLElBQUlELE9BQU9DLEtBQUtWLE1BQU1PLE1BQU0sR0FBRyxHQUFHRyxJQUFLO1FB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

}),

}]);