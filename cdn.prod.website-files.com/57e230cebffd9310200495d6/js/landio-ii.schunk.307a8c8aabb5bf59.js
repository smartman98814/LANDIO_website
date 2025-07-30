
/*!
 * Webflow: Front-end site library
 * @license MIT
 * Inline scripts may access the api using an async handler:
 *   var Webflow = Webflow || [];
 *   Webflow.push(readyFunction);
 */

"use strict";
(self["webpackChunk"] = self["webpackChunk"] || []).push([["14"], {
79858: (function (module, __unused_webpack_exports, __webpack_require__) {
/* globals window, document */ /**
 * Webflow: Dropdown component
 */ 
var Webflow = __webpack_require__(43949);
var IXEvents = __webpack_require__(65134);
const KEY_CODES = {
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    ESCAPE: 27,
    SPACE: 32,
    ENTER: 13,
    HOME: 36,
    END: 35
};
const FORCE_CLOSE = true;
/**
 * This pattern matches links that begin with a `#` AND have some alphanumeric
 * characters after it, including also hyphens and underscores
 *
 * Matches:
 * #foo
 * #999
 * #foo-bar_baz
 *
 * Does not match:
 * #
 */ const INTERNAL_PAGE_LINK_HASHES_PATTERN = /^#[a-zA-Z0-9\-_]+$/;
Webflow.define('dropdown', module.exports = function($, _) {
    var debounce = _.debounce;
    var api = {};
    var inApp = Webflow.env();
    var inPreview = false;
    var inDesigner;
    var touch = Webflow.env.touch;
    var namespace = '.w-dropdown';
    var openStateClassName = 'w--open';
    var ix = IXEvents.triggers;
    var defaultZIndex = 900; // @dropdown-depth
    var focusOutEvent = 'focusout' + namespace;
    var keydownEvent = 'keydown' + namespace;
    var mouseEnterEvent = 'mouseenter' + namespace;
    var mouseMoveEvent = 'mousemove' + namespace;
    var mouseLeaveEvent = 'mouseleave' + namespace;
    var mouseUpEvent = (touch ? 'click' : 'mouseup') + namespace;
    var closeEvent = 'w-close' + namespace;
    var settingEvent = 'setting' + namespace;
    var $doc = $(document);
    var $dropdowns;
    // -----------------------------------
    // Module methods
    api.ready = init;
    api.design = function() {
        // Close all when returning from preview
        if (inPreview) {
            closeAll();
        }
        inPreview = false;
        init();
    };
    api.preview = function() {
        inPreview = true;
        init();
    };
    // -----------------------------------
    // Private methods
    function init() {
        inDesigner = inApp && Webflow.env('design');
        // Find all instances on the page
        $dropdowns = $doc.find(namespace);
        $dropdowns.each(build);
    }
    function build(i, el) {
        var $el = $(el);
        // Store state in data
        var data = $.data(el, namespace);
        if (!data) {
            data = $.data(el, namespace, {
                open: false,
                el: $el,
                config: {},
                selectedIdx: -1
            });
        }
        data.toggle = data.el.children('.w-dropdown-toggle');
        data.list = data.el.children('.w-dropdown-list');
        data.links = data.list.find('a:not(.w-dropdown .w-dropdown a)');
        data.complete = complete(data);
        data.mouseLeave = makeMouseLeaveHandler(data);
        data.mouseUpOutside = outside(data);
        data.mouseMoveOutside = moveOutside(data);
        // Set config from data attributes
        configure(data);
        // Store the IDs of the toggle button & list
        var toggleId = data.toggle.attr('id');
        var listId = data.list.attr('id');
        // If user did not provide toggle ID, set it
        if (!toggleId) {
            toggleId = 'w-dropdown-toggle-' + i;
        }
        // If user did not provide list ID, set it
        if (!listId) {
            listId = 'w-dropdown-list-' + i;
        }
        // Add attributes to toggle element
        data.toggle.attr('id', toggleId);
        data.toggle.attr('aria-controls', listId);
        data.toggle.attr('aria-haspopup', 'menu');
        data.toggle.attr('aria-expanded', 'false');
        // Hide toggle icon from ATs
        data.toggle.find('.w-icon-dropdown-toggle').attr('aria-hidden', 'true');
        // If toggle element is not a button
        if (data.toggle.prop('tagName') !== 'BUTTON') {
            // Give it an appropriate role
            data.toggle.attr('role', 'button');
            // And give it a tabindex if user has not provided one
            if (!data.toggle.attr('tabindex')) {
                data.toggle.attr('tabindex', '0');
            }
        }
        // Add attributes to list element
        data.list.attr('id', listId);
        data.list.attr('aria-labelledby', toggleId);
        data.links.each(function(idx, link) {
            /**
         * In macOS Safari, links don't take focus on click unless they have
         * a tabindex. Without this, the dropdown will break.
         * @see https://gist.github.com/cvrebert/68659d0333a578d75372
         */ if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
            // We want to close the drop down if the href links somewhere internally
            // to the page
            if (INTERNAL_PAGE_LINK_HASHES_PATTERN.test(link.hash)) {
                link.addEventListener('click', close.bind(null, data));
            }
        });
        // Remove old events
        data.el.off(namespace);
        data.toggle.off(namespace);
        if (data.nav) {
            data.nav.off(namespace);
        }
        var initialToggler = makeToggler(data, FORCE_CLOSE);
        if (inDesigner) {
            data.el.on(settingEvent, makeSettingEventHandler(data));
        }
        if (!inDesigner) {
            // Close in preview mode and clean the data.hovering state
            if (inApp) {
                data.hovering = false;
                close(data);
            }
            if (data.config.hover) {
                data.toggle.on(mouseEnterEvent, makeMouseEnterHandler(data));
            }
            data.el.on(closeEvent, initialToggler);
            data.el.on(keydownEvent, makeDropdownKeydownHandler(data));
            data.el.on(focusOutEvent, makeDropdownFocusOutHandler(data));
            data.toggle.on(mouseUpEvent, initialToggler);
            data.toggle.on(keydownEvent, makeToggleKeydownHandler(data));
            data.nav = data.el.closest('.w-nav');
            data.nav.on(closeEvent, initialToggler);
        }
    }
    /**
     * Mutate the data object with a new config property
     */ function configure(data) {
        // Determine if z-index should be managed
        var zIndex = Number(data.el.css('z-index'));
        data.manageZ = zIndex === defaultZIndex || zIndex === defaultZIndex + 1;
        data.config = {
            hover: data.el.attr('data-hover') === 'true' && !touch,
            delay: data.el.attr('data-delay')
        };
    }
    function makeSettingEventHandler(data) {
        return function(evt, options) {
            options = options || {};
            configure(data);
            options.open === true && open(data);
            options.open === false && close(data, {
                immediate: true
            });
        };
    }
    function makeToggler(data, forceClose) {
        return debounce(function(evt) {
            if (data.open || evt && evt.type === 'w-close') {
                return close(data, {
                    forceClose
                });
            }
            open(data);
        });
    }
    function open(data) {
        if (data.open) {
            return;
        }
        closeOthers(data);
        data.open = true;
        data.list.addClass(openStateClassName);
        data.toggle.addClass(openStateClassName);
        data.toggle.attr('aria-expanded', 'true'); // ARIA
        ix.intro(0, data.el[0]);
        Webflow.redraw.up();
        // Increase z-index to keep above other managed dropdowns
        data.manageZ && data.el.css('z-index', defaultZIndex + 1);
        // Listen for click outside events
        var isEditor = Webflow.env('editor');
        if (!inDesigner) {
            $doc.on(mouseUpEvent, data.mouseUpOutside);
        }
        if (data.hovering && !isEditor) {
            data.el.on(mouseLeaveEvent, data.mouseLeave);
        }
        if (data.hovering && isEditor) {
            $doc.on(mouseMoveEvent, data.mouseMoveOutside);
        }
        // Clear previous delay
        window.clearTimeout(data.delayId);
    }
    function close(data, { immediate, forceClose } = {}) {
        if (!data.open) {
            return;
        }
        // Do not close hover-based menus if currently hovering
        if (data.config.hover && data.hovering && !forceClose) {
            return;
        }
        data.toggle.attr('aria-expanded', 'false');
        data.open = false;
        var config = data.config;
        ix.outro(0, data.el[0]);
        // Stop listening for click outside events
        $doc.off(mouseUpEvent, data.mouseUpOutside);
        $doc.off(mouseMoveEvent, data.mouseMoveOutside);
        data.el.off(mouseLeaveEvent, data.mouseLeave);
        // Clear previous delay
        window.clearTimeout(data.delayId);
        // Skip delay during immediate
        if (!config.delay || immediate) {
            return data.complete();
        }
        // Optionally wait for delay before close
        data.delayId = window.setTimeout(data.complete, config.delay);
    }
    function closeAll() {
        $doc.find(namespace).each(function(i, el) {
            $(el).triggerHandler(closeEvent);
        });
    }
    function closeOthers(data) {
        var self = data.el[0];
        $dropdowns.each(function(i, other) {
            var $other = $(other);
            if ($other.is(self) || $other.has(self).length) {
                return;
            }
            $other.triggerHandler(closeEvent);
        });
    }
    function outside(data) {
        // Unbind previous click handler if it exists
        if (data.mouseUpOutside) {
            $doc.off(mouseUpEvent, data.mouseUpOutside);
        }
        // Close menu when clicked outside
        return debounce(function(evt) {
            if (!data.open) {
                return;
            }
            var $target = $(evt.target);
            if ($target.closest('.w-dropdown-toggle').length) {
                return;
            }
            var isEventOutsideDropdowns = $.inArray(data.el[0], $target.parents(namespace)) === -1;
            var isEditor = Webflow.env('editor');
            if (isEventOutsideDropdowns) {
                if (isEditor) {
                    var isEventOnDetachedSvg = $target.parents().length === 1 && $target.parents('svg').length === 1;
                    var isEventOnHoverControls = $target.parents('.w-editor-bem-EditorHoverControls').length;
                    if (isEventOnDetachedSvg || isEventOnHoverControls) {
                        return;
                    }
                }
                close(data);
            }
        });
    }
    function complete(data) {
        return function() {
            data.list.removeClass(openStateClassName);
            data.toggle.removeClass(openStateClassName);
            // Reset z-index for managed dropdowns
            data.manageZ && data.el.css('z-index', '');
        };
    }
    function makeMouseEnterHandler(data) {
        return function() {
            data.hovering = true;
            open(data);
        };
    }
    function makeMouseLeaveHandler(data) {
        return function() {
            data.hovering = false;
            // We do not want the list to close upon mouseleave
            // if one of the links has focus
            if (!data.links.is(':focus')) {
                close(data);
            }
        };
    }
    function moveOutside(data) {
        return debounce(function(evt) {
            if (!data.open) {
                return;
            }
            var $target = $(evt.target);
            var isEventOutsideDropdowns = $.inArray(data.el[0], $target.parents(namespace)) === -1;
            if (isEventOutsideDropdowns) {
                var isEventOnHoverControls = $target.parents('.w-editor-bem-EditorHoverControls').length;
                var isEventOnHoverToolbar = $target.parents('.w-editor-bem-RTToolbar').length;
                var $editorOverlay = $('.w-editor-bem-EditorOverlay');
                var isDropdownInEdition = $editorOverlay.find('.w-editor-edit-outline').length || $editorOverlay.find('.w-editor-bem-RTToolbar').length;
                if (isEventOnHoverControls || isEventOnHoverToolbar || isDropdownInEdition) {
                    return;
                }
                data.hovering = false;
                close(data);
            }
        });
    }
    function makeDropdownKeydownHandler(data) {
        return function(evt) {
            // Don't respond to keyboard in designer or if the list is not open
            if (inDesigner || !data.open) {
                return;
            }
            // Realign selectedIdx with the menu item that is currently in focus.
            // We need this because we do not track the `Tab` key activity!
            data.selectedIdx = data.links.index(document.activeElement);
            // Evaluate item-selection logic
            switch(evt.keyCode){
                case KEY_CODES.HOME:
                    {
                        if (!data.open) return;
                        data.selectedIdx = 0;
                        focusSelectedLink(data);
                        return evt.preventDefault();
                    }
                case KEY_CODES.END:
                    {
                        if (!data.open) return;
                        data.selectedIdx = data.links.length - 1;
                        focusSelectedLink(data);
                        return evt.preventDefault();
                    }
                case KEY_CODES.ESCAPE:
                    {
                        close(data);
                        data.toggle.focus();
                        return evt.stopPropagation();
                    }
                case KEY_CODES.ARROW_RIGHT:
                case KEY_CODES.ARROW_DOWN:
                    {
                        data.selectedIdx = Math.min(data.links.length - 1, data.selectedIdx + 1);
                        focusSelectedLink(data);
                        return evt.preventDefault();
                    }
                case KEY_CODES.ARROW_LEFT:
                case KEY_CODES.ARROW_UP:
                    {
                        data.selectedIdx = Math.max(-1, data.selectedIdx - 1);
                        focusSelectedLink(data);
                        return evt.preventDefault();
                    }
            }
        };
    }
    function focusSelectedLink(data) {
        if (data.links[data.selectedIdx]) {
            data.links[data.selectedIdx].focus();
        }
    }
    function makeToggleKeydownHandler(data) {
        // We want to close immediately
        // if interacting via keyboard
        var toggler = makeToggler(data, FORCE_CLOSE);
        return function(evt) {
            if (inDesigner) return;
            // If the menu is not open, we don't want
            // the up or Down arrows to do anything
            if (!data.open) {
                switch(evt.keyCode){
                    case KEY_CODES.ARROW_UP:
                    case KEY_CODES.ARROW_DOWN:
                        {
                            return evt.stopPropagation();
                        }
                }
            }
            switch(evt.keyCode){
                case KEY_CODES.SPACE:
                case KEY_CODES.ENTER:
                    {
                        toggler();
                        evt.stopPropagation();
                        return evt.preventDefault();
                    }
            }
        };
    }
    function makeDropdownFocusOutHandler(data) {
        return debounce(function(evt) {
            var { relatedTarget, target } = evt;
            var menuEl = data.el[0];
            /**
         * Close menu
         * With focusout events, the `relatedTarget` is the element that will next receive focus.
         * @see: https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent/relatedTarget
         */ var menuContainsFocus = menuEl.contains(relatedTarget) || menuEl.contains(target);
            if (!menuContainsFocus) {
                close(data);
            }
            return evt.stopPropagation();
        });
    }
    // Export module
    return api;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYmZsb3ctZHJvcGRvd24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyB3aW5kb3csIGRvY3VtZW50ICovXG5cbi8qKlxuICogV2ViZmxvdzogRHJvcGRvd24gY29tcG9uZW50XG4gKi9cblxudmFyIFdlYmZsb3cgPSByZXF1aXJlKCcuLi9CYXNlU2l0ZU1vZHVsZXMvd2ViZmxvdy1saWInKTtcbnZhciBJWEV2ZW50cyA9IHJlcXVpcmUoJy4uL0Jhc2VTaXRlTW9kdWxlcy93ZWJmbG93LWl4Mi1ldmVudHMnKTtcblxuY29uc3QgS0VZX0NPREVTID0ge1xuICBBUlJPV19MRUZUOiAzNyxcbiAgQVJST1dfVVA6IDM4LFxuICBBUlJPV19SSUdIVDogMzksXG4gIEFSUk9XX0RPV046IDQwLFxuICBFU0NBUEU6IDI3LFxuICBTUEFDRTogMzIsXG4gIEVOVEVSOiAxMyxcbiAgSE9NRTogMzYsXG4gIEVORDogMzUsXG59O1xuXG5jb25zdCBGT1JDRV9DTE9TRSA9IHRydWU7XG5cbi8qKlxuICogVGhpcyBwYXR0ZXJuIG1hdGNoZXMgbGlua3MgdGhhdCBiZWdpbiB3aXRoIGEgYCNgIEFORCBoYXZlIHNvbWUgYWxwaGFudW1lcmljXG4gKiBjaGFyYWN0ZXJzIGFmdGVyIGl0LCBpbmNsdWRpbmcgYWxzbyBoeXBoZW5zIGFuZCB1bmRlcnNjb3Jlc1xuICpcbiAqIE1hdGNoZXM6XG4gKiAjZm9vXG4gKiAjOTk5XG4gKiAjZm9vLWJhcl9iYXpcbiAqXG4gKiBEb2VzIG5vdCBtYXRjaDpcbiAqICNcbiAqL1xuY29uc3QgSU5URVJOQUxfUEFHRV9MSU5LX0hBU0hFU19QQVRURVJOID0gL14jW2EtekEtWjAtOVxcLV9dKyQvO1xuXG5XZWJmbG93LmRlZmluZShcbiAgJ2Ryb3Bkb3duJyxcbiAgKG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCQsIF8pIHtcbiAgICB2YXIgZGVib3VuY2UgPSBfLmRlYm91bmNlO1xuXG4gICAgdmFyIGFwaSA9IHt9O1xuICAgIHZhciBpbkFwcCA9IFdlYmZsb3cuZW52KCk7XG4gICAgdmFyIGluUHJldmlldyA9IGZhbHNlO1xuICAgIHZhciBpbkRlc2lnbmVyO1xuICAgIHZhciB0b3VjaCA9IFdlYmZsb3cuZW52LnRvdWNoO1xuICAgIHZhciBuYW1lc3BhY2UgPSAnLnctZHJvcGRvd24nO1xuICAgIHZhciBvcGVuU3RhdGVDbGFzc05hbWUgPSAndy0tb3Blbic7XG4gICAgdmFyIGl4ID0gSVhFdmVudHMudHJpZ2dlcnM7XG4gICAgdmFyIGRlZmF1bHRaSW5kZXggPSA5MDA7IC8vIEBkcm9wZG93bi1kZXB0aFxuXG4gICAgdmFyIGZvY3VzT3V0RXZlbnQgPSAnZm9jdXNvdXQnICsgbmFtZXNwYWNlO1xuICAgIHZhciBrZXlkb3duRXZlbnQgPSAna2V5ZG93bicgKyBuYW1lc3BhY2U7XG4gICAgdmFyIG1vdXNlRW50ZXJFdmVudCA9ICdtb3VzZWVudGVyJyArIG5hbWVzcGFjZTtcbiAgICB2YXIgbW91c2VNb3ZlRXZlbnQgPSAnbW91c2Vtb3ZlJyArIG5hbWVzcGFjZTtcbiAgICB2YXIgbW91c2VMZWF2ZUV2ZW50ID0gJ21vdXNlbGVhdmUnICsgbmFtZXNwYWNlO1xuICAgIHZhciBtb3VzZVVwRXZlbnQgPSAodG91Y2ggPyAnY2xpY2snIDogJ21vdXNldXAnKSArIG5hbWVzcGFjZTtcblxuICAgIHZhciBjbG9zZUV2ZW50ID0gJ3ctY2xvc2UnICsgbmFtZXNwYWNlO1xuICAgIHZhciBzZXR0aW5nRXZlbnQgPSAnc2V0dGluZycgKyBuYW1lc3BhY2U7XG5cbiAgICB2YXIgJGRvYyA9ICQoZG9jdW1lbnQpO1xuICAgIHZhciAkZHJvcGRvd25zO1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gTW9kdWxlIG1ldGhvZHNcblxuICAgIGFwaS5yZWFkeSA9IGluaXQ7XG5cbiAgICBhcGkuZGVzaWduID0gZnVuY3Rpb24gKCkge1xuICAgICAgLy8gQ2xvc2UgYWxsIHdoZW4gcmV0dXJuaW5nIGZyb20gcHJldmlld1xuICAgICAgaWYgKGluUHJldmlldykge1xuICAgICAgICBjbG9zZUFsbCgpO1xuICAgICAgfVxuICAgICAgaW5QcmV2aWV3ID0gZmFsc2U7XG4gICAgICBpbml0KCk7XG4gICAgfTtcblxuICAgIGFwaS5wcmV2aWV3ID0gZnVuY3Rpb24gKCkge1xuICAgICAgaW5QcmV2aWV3ID0gdHJ1ZTtcbiAgICAgIGluaXQoKTtcbiAgICB9O1xuXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBQcml2YXRlIG1ldGhvZHNcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICBpbkRlc2lnbmVyID0gaW5BcHAgJiYgV2ViZmxvdy5lbnYoJ2Rlc2lnbicpO1xuXG4gICAgICAvLyBGaW5kIGFsbCBpbnN0YW5jZXMgb24gdGhlIHBhZ2VcbiAgICAgICRkcm9wZG93bnMgPSAkZG9jLmZpbmQobmFtZXNwYWNlKTtcbiAgICAgICRkcm9wZG93bnMuZWFjaChidWlsZCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGQoaSwgZWwpIHtcbiAgICAgIHZhciAkZWwgPSAkKGVsKTtcblxuICAgICAgLy8gU3RvcmUgc3RhdGUgaW4gZGF0YVxuICAgICAgdmFyIGRhdGEgPSAkLmRhdGEoZWwsIG5hbWVzcGFjZSk7XG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgZGF0YSA9ICQuZGF0YShlbCwgbmFtZXNwYWNlLCB7XG4gICAgICAgICAgb3BlbjogZmFsc2UsXG4gICAgICAgICAgZWw6ICRlbCxcbiAgICAgICAgICBjb25maWc6IHt9LFxuICAgICAgICAgIHNlbGVjdGVkSWR4OiAtMSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBkYXRhLnRvZ2dsZSA9IGRhdGEuZWwuY2hpbGRyZW4oJy53LWRyb3Bkb3duLXRvZ2dsZScpO1xuICAgICAgZGF0YS5saXN0ID0gZGF0YS5lbC5jaGlsZHJlbignLnctZHJvcGRvd24tbGlzdCcpO1xuICAgICAgZGF0YS5saW5rcyA9IGRhdGEubGlzdC5maW5kKCdhOm5vdCgudy1kcm9wZG93biAudy1kcm9wZG93biBhKScpO1xuICAgICAgZGF0YS5jb21wbGV0ZSA9IGNvbXBsZXRlKGRhdGEpO1xuICAgICAgZGF0YS5tb3VzZUxlYXZlID0gbWFrZU1vdXNlTGVhdmVIYW5kbGVyKGRhdGEpO1xuICAgICAgZGF0YS5tb3VzZVVwT3V0c2lkZSA9IG91dHNpZGUoZGF0YSk7XG4gICAgICBkYXRhLm1vdXNlTW92ZU91dHNpZGUgPSBtb3ZlT3V0c2lkZShkYXRhKTtcblxuICAgICAgLy8gU2V0IGNvbmZpZyBmcm9tIGRhdGEgYXR0cmlidXRlc1xuICAgICAgY29uZmlndXJlKGRhdGEpO1xuXG4gICAgICAvLyBTdG9yZSB0aGUgSURzIG9mIHRoZSB0b2dnbGUgYnV0dG9uICYgbGlzdFxuICAgICAgdmFyIHRvZ2dsZUlkID0gZGF0YS50b2dnbGUuYXR0cignaWQnKTtcbiAgICAgIHZhciBsaXN0SWQgPSBkYXRhLmxpc3QuYXR0cignaWQnKTtcblxuICAgICAgLy8gSWYgdXNlciBkaWQgbm90IHByb3ZpZGUgdG9nZ2xlIElELCBzZXQgaXRcbiAgICAgIGlmICghdG9nZ2xlSWQpIHtcbiAgICAgICAgdG9nZ2xlSWQgPSAndy1kcm9wZG93bi10b2dnbGUtJyArIGk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHVzZXIgZGlkIG5vdCBwcm92aWRlIGxpc3QgSUQsIHNldCBpdFxuICAgICAgaWYgKCFsaXN0SWQpIHtcbiAgICAgICAgbGlzdElkID0gJ3ctZHJvcGRvd24tbGlzdC0nICsgaTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGF0dHJpYnV0ZXMgdG8gdG9nZ2xlIGVsZW1lbnRcbiAgICAgIGRhdGEudG9nZ2xlLmF0dHIoJ2lkJywgdG9nZ2xlSWQpO1xuICAgICAgZGF0YS50b2dnbGUuYXR0cignYXJpYS1jb250cm9scycsIGxpc3RJZCk7XG4gICAgICBkYXRhLnRvZ2dsZS5hdHRyKCdhcmlhLWhhc3BvcHVwJywgJ21lbnUnKTtcbiAgICAgIGRhdGEudG9nZ2xlLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcblxuICAgICAgLy8gSGlkZSB0b2dnbGUgaWNvbiBmcm9tIEFUc1xuICAgICAgZGF0YS50b2dnbGUuZmluZCgnLnctaWNvbi1kcm9wZG93bi10b2dnbGUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG5cbiAgICAgIC8vIElmIHRvZ2dsZSBlbGVtZW50IGlzIG5vdCBhIGJ1dHRvblxuICAgICAgaWYgKGRhdGEudG9nZ2xlLnByb3AoJ3RhZ05hbWUnKSAhPT0gJ0JVVFRPTicpIHtcbiAgICAgICAgLy8gR2l2ZSBpdCBhbiBhcHByb3ByaWF0ZSByb2xlXG4gICAgICAgIGRhdGEudG9nZ2xlLmF0dHIoJ3JvbGUnLCAnYnV0dG9uJyk7XG5cbiAgICAgICAgLy8gQW5kIGdpdmUgaXQgYSB0YWJpbmRleCBpZiB1c2VyIGhhcyBub3QgcHJvdmlkZWQgb25lXG4gICAgICAgIGlmICghZGF0YS50b2dnbGUuYXR0cigndGFiaW5kZXgnKSkge1xuICAgICAgICAgIGRhdGEudG9nZ2xlLmF0dHIoJ3RhYmluZGV4JywgJzAnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYXR0cmlidXRlcyB0byBsaXN0IGVsZW1lbnRcbiAgICAgIGRhdGEubGlzdC5hdHRyKCdpZCcsIGxpc3RJZCk7XG4gICAgICBkYXRhLmxpc3QuYXR0cignYXJpYS1sYWJlbGxlZGJ5JywgdG9nZ2xlSWQpO1xuXG4gICAgICBkYXRhLmxpbmtzLmVhY2goZnVuY3Rpb24gKGlkeCwgbGluaykge1xuICAgICAgICAvKipcbiAgICAgICAgICogSW4gbWFjT1MgU2FmYXJpLCBsaW5rcyBkb24ndCB0YWtlIGZvY3VzIG9uIGNsaWNrIHVubGVzcyB0aGV5IGhhdmVcbiAgICAgICAgICogYSB0YWJpbmRleC4gV2l0aG91dCB0aGlzLCB0aGUgZHJvcGRvd24gd2lsbCBicmVhay5cbiAgICAgICAgICogQHNlZSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9jdnJlYmVydC82ODY1OWQwMzMzYTU3OGQ3NTM3MlxuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCFsaW5rLmhhc0F0dHJpYnV0ZSgndGFiaW5kZXgnKSkgbGluay5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgJzAnKTtcblxuICAgICAgICAvLyBXZSB3YW50IHRvIGNsb3NlIHRoZSBkcm9wIGRvd24gaWYgdGhlIGhyZWYgbGlua3Mgc29tZXdoZXJlIGludGVybmFsbHlcbiAgICAgICAgLy8gdG8gdGhlIHBhZ2VcbiAgICAgICAgaWYgKElOVEVSTkFMX1BBR0VfTElOS19IQVNIRVNfUEFUVEVSTi50ZXN0KGxpbmsuaGFzaCkpIHtcbiAgICAgICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xvc2UuYmluZChudWxsLCBkYXRhKSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZW1vdmUgb2xkIGV2ZW50c1xuICAgICAgZGF0YS5lbC5vZmYobmFtZXNwYWNlKTtcbiAgICAgIGRhdGEudG9nZ2xlLm9mZihuYW1lc3BhY2UpO1xuXG4gICAgICBpZiAoZGF0YS5uYXYpIHtcbiAgICAgICAgZGF0YS5uYXYub2ZmKG5hbWVzcGFjZSk7XG4gICAgICB9XG4gICAgICB2YXIgaW5pdGlhbFRvZ2dsZXIgPSBtYWtlVG9nZ2xlcihkYXRhLCBGT1JDRV9DTE9TRSk7XG5cbiAgICAgIGlmIChpbkRlc2lnbmVyKSB7XG4gICAgICAgIGRhdGEuZWwub24oc2V0dGluZ0V2ZW50LCBtYWtlU2V0dGluZ0V2ZW50SGFuZGxlcihkYXRhKSk7XG4gICAgICB9XG4gICAgICBpZiAoIWluRGVzaWduZXIpIHtcbiAgICAgICAgLy8gQ2xvc2UgaW4gcHJldmlldyBtb2RlIGFuZCBjbGVhbiB0aGUgZGF0YS5ob3ZlcmluZyBzdGF0ZVxuICAgICAgICBpZiAoaW5BcHApIHtcbiAgICAgICAgICBkYXRhLmhvdmVyaW5nID0gZmFsc2U7XG4gICAgICAgICAgY2xvc2UoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuY29uZmlnLmhvdmVyKSB7XG4gICAgICAgICAgZGF0YS50b2dnbGUub24obW91c2VFbnRlckV2ZW50LCBtYWtlTW91c2VFbnRlckhhbmRsZXIoZGF0YSkpO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEuZWwub24oY2xvc2VFdmVudCwgaW5pdGlhbFRvZ2dsZXIpO1xuICAgICAgICBkYXRhLmVsLm9uKGtleWRvd25FdmVudCwgbWFrZURyb3Bkb3duS2V5ZG93bkhhbmRsZXIoZGF0YSkpO1xuICAgICAgICBkYXRhLmVsLm9uKGZvY3VzT3V0RXZlbnQsIG1ha2VEcm9wZG93bkZvY3VzT3V0SGFuZGxlcihkYXRhKSk7XG5cbiAgICAgICAgZGF0YS50b2dnbGUub24obW91c2VVcEV2ZW50LCBpbml0aWFsVG9nZ2xlcik7XG4gICAgICAgIGRhdGEudG9nZ2xlLm9uKGtleWRvd25FdmVudCwgbWFrZVRvZ2dsZUtleWRvd25IYW5kbGVyKGRhdGEpKTtcblxuICAgICAgICBkYXRhLm5hdiA9IGRhdGEuZWwuY2xvc2VzdCgnLnctbmF2Jyk7XG4gICAgICAgIGRhdGEubmF2Lm9uKGNsb3NlRXZlbnQsIGluaXRpYWxUb2dnbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNdXRhdGUgdGhlIGRhdGEgb2JqZWN0IHdpdGggYSBuZXcgY29uZmlnIHByb3BlcnR5XG4gICAgICovXG4gICAgZnVuY3Rpb24gY29uZmlndXJlKGRhdGEpIHtcbiAgICAgIC8vIERldGVybWluZSBpZiB6LWluZGV4IHNob3VsZCBiZSBtYW5hZ2VkXG4gICAgICB2YXIgekluZGV4ID0gTnVtYmVyKGRhdGEuZWwuY3NzKCd6LWluZGV4JykpO1xuICAgICAgZGF0YS5tYW5hZ2VaID0gekluZGV4ID09PSBkZWZhdWx0WkluZGV4IHx8IHpJbmRleCA9PT0gZGVmYXVsdFpJbmRleCArIDE7XG4gICAgICBkYXRhLmNvbmZpZyA9IHtcbiAgICAgICAgaG92ZXI6IGRhdGEuZWwuYXR0cignZGF0YS1ob3ZlcicpID09PSAndHJ1ZScgJiYgIXRvdWNoLFxuICAgICAgICBkZWxheTogZGF0YS5lbC5hdHRyKCdkYXRhLWRlbGF5JyksXG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VTZXR0aW5nRXZlbnRIYW5kbGVyKGRhdGEpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZXZ0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICBjb25maWd1cmUoZGF0YSk7XG4gICAgICAgIG9wdGlvbnMub3BlbiA9PT0gdHJ1ZSAmJiBvcGVuKGRhdGEpO1xuICAgICAgICBvcHRpb25zLm9wZW4gPT09IGZhbHNlICYmIGNsb3NlKGRhdGEsIHtpbW1lZGlhdGU6IHRydWV9KTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZVRvZ2dsZXIoZGF0YSwgZm9yY2VDbG9zZSkge1xuICAgICAgcmV0dXJuIGRlYm91bmNlKGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgaWYgKGRhdGEub3BlbiB8fCAoZXZ0ICYmIGV2dC50eXBlID09PSAndy1jbG9zZScpKSB7XG4gICAgICAgICAgcmV0dXJuIGNsb3NlKGRhdGEsIHtmb3JjZUNsb3NlfSk7XG4gICAgICAgIH1cbiAgICAgICAgb3BlbihkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9wZW4oZGF0YSkge1xuICAgICAgaWYgKGRhdGEub3Blbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNsb3NlT3RoZXJzKGRhdGEpO1xuICAgICAgZGF0YS5vcGVuID0gdHJ1ZTtcbiAgICAgIGRhdGEubGlzdC5hZGRDbGFzcyhvcGVuU3RhdGVDbGFzc05hbWUpO1xuICAgICAgZGF0YS50b2dnbGUuYWRkQ2xhc3Mob3BlblN0YXRlQ2xhc3NOYW1lKTtcbiAgICAgIGRhdGEudG9nZ2xlLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpOyAvLyBBUklBXG4gICAgICBpeC5pbnRybygwLCBkYXRhLmVsWzBdKTtcbiAgICAgIFdlYmZsb3cucmVkcmF3LnVwKCk7XG5cbiAgICAgIC8vIEluY3JlYXNlIHotaW5kZXggdG8ga2VlcCBhYm92ZSBvdGhlciBtYW5hZ2VkIGRyb3Bkb3duc1xuICAgICAgZGF0YS5tYW5hZ2VaICYmIGRhdGEuZWwuY3NzKCd6LWluZGV4JywgZGVmYXVsdFpJbmRleCArIDEpO1xuXG4gICAgICAvLyBMaXN0ZW4gZm9yIGNsaWNrIG91dHNpZGUgZXZlbnRzXG4gICAgICB2YXIgaXNFZGl0b3IgPSBXZWJmbG93LmVudignZWRpdG9yJyk7XG4gICAgICBpZiAoIWluRGVzaWduZXIpIHtcbiAgICAgICAgJGRvYy5vbihtb3VzZVVwRXZlbnQsIGRhdGEubW91c2VVcE91dHNpZGUpO1xuICAgICAgfVxuICAgICAgaWYgKGRhdGEuaG92ZXJpbmcgJiYgIWlzRWRpdG9yKSB7XG4gICAgICAgIGRhdGEuZWwub24obW91c2VMZWF2ZUV2ZW50LCBkYXRhLm1vdXNlTGVhdmUpO1xuICAgICAgfVxuICAgICAgaWYgKGRhdGEuaG92ZXJpbmcgJiYgaXNFZGl0b3IpIHtcbiAgICAgICAgJGRvYy5vbihtb3VzZU1vdmVFdmVudCwgZGF0YS5tb3VzZU1vdmVPdXRzaWRlKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2xlYXIgcHJldmlvdXMgZGVsYXlcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoZGF0YS5kZWxheUlkKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZShkYXRhLCB7aW1tZWRpYXRlLCBmb3JjZUNsb3NlfSA9IHt9KSB7XG4gICAgICBpZiAoIWRhdGEub3Blbikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIERvIG5vdCBjbG9zZSBob3Zlci1iYXNlZCBtZW51cyBpZiBjdXJyZW50bHkgaG92ZXJpbmdcbiAgICAgIGlmIChkYXRhLmNvbmZpZy5ob3ZlciAmJiBkYXRhLmhvdmVyaW5nICYmICFmb3JjZUNsb3NlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZGF0YS50b2dnbGUuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuXG4gICAgICBkYXRhLm9wZW4gPSBmYWxzZTtcbiAgICAgIHZhciBjb25maWcgPSBkYXRhLmNvbmZpZztcbiAgICAgIGl4Lm91dHJvKDAsIGRhdGEuZWxbMF0pO1xuXG4gICAgICAvLyBTdG9wIGxpc3RlbmluZyBmb3IgY2xpY2sgb3V0c2lkZSBldmVudHNcbiAgICAgICRkb2Mub2ZmKG1vdXNlVXBFdmVudCwgZGF0YS5tb3VzZVVwT3V0c2lkZSk7XG4gICAgICAkZG9jLm9mZihtb3VzZU1vdmVFdmVudCwgZGF0YS5tb3VzZU1vdmVPdXRzaWRlKTtcbiAgICAgIGRhdGEuZWwub2ZmKG1vdXNlTGVhdmVFdmVudCwgZGF0YS5tb3VzZUxlYXZlKTtcblxuICAgICAgLy8gQ2xlYXIgcHJldmlvdXMgZGVsYXlcbiAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoZGF0YS5kZWxheUlkKTtcblxuICAgICAgLy8gU2tpcCBkZWxheSBkdXJpbmcgaW1tZWRpYXRlXG4gICAgICBpZiAoIWNvbmZpZy5kZWxheSB8fCBpbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGRhdGEuY29tcGxldGUoKTtcbiAgICAgIH1cblxuICAgICAgLy8gT3B0aW9uYWxseSB3YWl0IGZvciBkZWxheSBiZWZvcmUgY2xvc2VcbiAgICAgIGRhdGEuZGVsYXlJZCA9IHdpbmRvdy5zZXRUaW1lb3V0KGRhdGEuY29tcGxldGUsIGNvbmZpZy5kZWxheSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VBbGwoKSB7XG4gICAgICAkZG9jLmZpbmQobmFtZXNwYWNlKS5lYWNoKGZ1bmN0aW9uIChpLCBlbCkge1xuICAgICAgICAkKGVsKS50cmlnZ2VySGFuZGxlcihjbG9zZUV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlT3RoZXJzKGRhdGEpIHtcbiAgICAgIHZhciBzZWxmID0gZGF0YS5lbFswXTtcbiAgICAgICRkcm9wZG93bnMuZWFjaChmdW5jdGlvbiAoaSwgb3RoZXIpIHtcbiAgICAgICAgdmFyICRvdGhlciA9ICQob3RoZXIpO1xuICAgICAgICBpZiAoJG90aGVyLmlzKHNlbGYpIHx8ICRvdGhlci5oYXMoc2VsZikubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgICRvdGhlci50cmlnZ2VySGFuZGxlcihjbG9zZUV2ZW50KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG91dHNpZGUoZGF0YSkge1xuICAgICAgLy8gVW5iaW5kIHByZXZpb3VzIGNsaWNrIGhhbmRsZXIgaWYgaXQgZXhpc3RzXG4gICAgICBpZiAoZGF0YS5tb3VzZVVwT3V0c2lkZSkge1xuICAgICAgICAkZG9jLm9mZihtb3VzZVVwRXZlbnQsIGRhdGEubW91c2VVcE91dHNpZGUpO1xuICAgICAgfVxuXG4gICAgICAvLyBDbG9zZSBtZW51IHdoZW4gY2xpY2tlZCBvdXRzaWRlXG4gICAgICByZXR1cm4gZGVib3VuY2UoZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICBpZiAoIWRhdGEub3Blbikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgJHRhcmdldCA9ICQoZXZ0LnRhcmdldCk7XG4gICAgICAgIGlmICgkdGFyZ2V0LmNsb3Nlc3QoJy53LWRyb3Bkb3duLXRvZ2dsZScpLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNFdmVudE91dHNpZGVEcm9wZG93bnMgPVxuICAgICAgICAgICQuaW5BcnJheShkYXRhLmVsWzBdLCAkdGFyZ2V0LnBhcmVudHMobmFtZXNwYWNlKSkgPT09IC0xO1xuICAgICAgICB2YXIgaXNFZGl0b3IgPSBXZWJmbG93LmVudignZWRpdG9yJyk7XG4gICAgICAgIGlmIChpc0V2ZW50T3V0c2lkZURyb3Bkb3ducykge1xuICAgICAgICAgIGlmIChpc0VkaXRvcikge1xuICAgICAgICAgICAgdmFyIGlzRXZlbnRPbkRldGFjaGVkU3ZnID1cbiAgICAgICAgICAgICAgJHRhcmdldC5wYXJlbnRzKCkubGVuZ3RoID09PSAxICYmXG4gICAgICAgICAgICAgICR0YXJnZXQucGFyZW50cygnc3ZnJykubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgdmFyIGlzRXZlbnRPbkhvdmVyQ29udHJvbHMgPSAkdGFyZ2V0LnBhcmVudHMoXG4gICAgICAgICAgICAgICcudy1lZGl0b3ItYmVtLUVkaXRvckhvdmVyQ29udHJvbHMnXG4gICAgICAgICAgICApLmxlbmd0aDtcbiAgICAgICAgICAgIGlmIChpc0V2ZW50T25EZXRhY2hlZFN2ZyB8fCBpc0V2ZW50T25Ib3ZlckNvbnRyb2xzKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgY2xvc2UoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXBsZXRlKGRhdGEpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRhdGEubGlzdC5yZW1vdmVDbGFzcyhvcGVuU3RhdGVDbGFzc05hbWUpO1xuICAgICAgICBkYXRhLnRvZ2dsZS5yZW1vdmVDbGFzcyhvcGVuU3RhdGVDbGFzc05hbWUpO1xuXG4gICAgICAgIC8vIFJlc2V0IHotaW5kZXggZm9yIG1hbmFnZWQgZHJvcGRvd25zXG4gICAgICAgIGRhdGEubWFuYWdlWiAmJiBkYXRhLmVsLmNzcygnei1pbmRleCcsICcnKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZU1vdXNlRW50ZXJIYW5kbGVyKGRhdGEpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRhdGEuaG92ZXJpbmcgPSB0cnVlO1xuICAgICAgICBvcGVuKGRhdGEpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlTW91c2VMZWF2ZUhhbmRsZXIoZGF0YSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZGF0YS5ob3ZlcmluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIFdlIGRvIG5vdCB3YW50IHRoZSBsaXN0IHRvIGNsb3NlIHVwb24gbW91c2VsZWF2ZVxuICAgICAgICAvLyBpZiBvbmUgb2YgdGhlIGxpbmtzIGhhcyBmb2N1c1xuICAgICAgICBpZiAoIWRhdGEubGlua3MuaXMoJzpmb2N1cycpKSB7XG4gICAgICAgICAgY2xvc2UoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW92ZU91dHNpZGUoZGF0YSkge1xuICAgICAgcmV0dXJuIGRlYm91bmNlKGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgaWYgKCFkYXRhLm9wZW4pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyICR0YXJnZXQgPSAkKGV2dC50YXJnZXQpO1xuICAgICAgICB2YXIgaXNFdmVudE91dHNpZGVEcm9wZG93bnMgPVxuICAgICAgICAgICQuaW5BcnJheShkYXRhLmVsWzBdLCAkdGFyZ2V0LnBhcmVudHMobmFtZXNwYWNlKSkgPT09IC0xO1xuICAgICAgICBpZiAoaXNFdmVudE91dHNpZGVEcm9wZG93bnMpIHtcbiAgICAgICAgICB2YXIgaXNFdmVudE9uSG92ZXJDb250cm9scyA9ICR0YXJnZXQucGFyZW50cyhcbiAgICAgICAgICAgICcudy1lZGl0b3ItYmVtLUVkaXRvckhvdmVyQ29udHJvbHMnXG4gICAgICAgICAgKS5sZW5ndGg7XG4gICAgICAgICAgdmFyIGlzRXZlbnRPbkhvdmVyVG9vbGJhciA9ICR0YXJnZXQucGFyZW50cyhcbiAgICAgICAgICAgICcudy1lZGl0b3ItYmVtLVJUVG9vbGJhcidcbiAgICAgICAgICApLmxlbmd0aDtcbiAgICAgICAgICB2YXIgJGVkaXRvck92ZXJsYXkgPSAkKCcudy1lZGl0b3ItYmVtLUVkaXRvck92ZXJsYXknKTtcbiAgICAgICAgICB2YXIgaXNEcm9wZG93bkluRWRpdGlvbiA9XG4gICAgICAgICAgICAkZWRpdG9yT3ZlcmxheS5maW5kKCcudy1lZGl0b3ItZWRpdC1vdXRsaW5lJykubGVuZ3RoIHx8XG4gICAgICAgICAgICAkZWRpdG9yT3ZlcmxheS5maW5kKCcudy1lZGl0b3ItYmVtLVJUVG9vbGJhcicpLmxlbmd0aDtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBpc0V2ZW50T25Ib3ZlckNvbnRyb2xzIHx8XG4gICAgICAgICAgICBpc0V2ZW50T25Ib3ZlclRvb2xiYXIgfHxcbiAgICAgICAgICAgIGlzRHJvcGRvd25JbkVkaXRpb25cbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGF0YS5ob3ZlcmluZyA9IGZhbHNlO1xuICAgICAgICAgIGNsb3NlKGRhdGEpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlRHJvcGRvd25LZXlkb3duSGFuZGxlcihkYXRhKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAvLyBEb24ndCByZXNwb25kIHRvIGtleWJvYXJkIGluIGRlc2lnbmVyIG9yIGlmIHRoZSBsaXN0IGlzIG5vdCBvcGVuXG4gICAgICAgIGlmIChpbkRlc2lnbmVyIHx8ICFkYXRhLm9wZW4pIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZWFsaWduIHNlbGVjdGVkSWR4IHdpdGggdGhlIG1lbnUgaXRlbSB0aGF0IGlzIGN1cnJlbnRseSBpbiBmb2N1cy5cbiAgICAgICAgLy8gV2UgbmVlZCB0aGlzIGJlY2F1c2Ugd2UgZG8gbm90IHRyYWNrIHRoZSBgVGFiYCBrZXkgYWN0aXZpdHkhXG4gICAgICAgIGRhdGEuc2VsZWN0ZWRJZHggPSBkYXRhLmxpbmtzLmluZGV4KGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuXG4gICAgICAgIC8vIEV2YWx1YXRlIGl0ZW0tc2VsZWN0aW9uIGxvZ2ljXG4gICAgICAgIHN3aXRjaCAoZXZ0LmtleUNvZGUpIHtcbiAgICAgICAgICBjYXNlIEtFWV9DT0RFUy5IT01FOiB7XG4gICAgICAgICAgICBpZiAoIWRhdGEub3BlbikgcmV0dXJuO1xuXG4gICAgICAgICAgICBkYXRhLnNlbGVjdGVkSWR4ID0gMDtcbiAgICAgICAgICAgIGZvY3VzU2VsZWN0ZWRMaW5rKGRhdGEpO1xuXG4gICAgICAgICAgICByZXR1cm4gZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSBLRVlfQ09ERVMuRU5EOiB7XG4gICAgICAgICAgICBpZiAoIWRhdGEub3BlbikgcmV0dXJuO1xuXG4gICAgICAgICAgICBkYXRhLnNlbGVjdGVkSWR4ID0gZGF0YS5saW5rcy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgZm9jdXNTZWxlY3RlZExpbmsoZGF0YSk7XG5cbiAgICAgICAgICAgIHJldHVybiBldnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlIEtFWV9DT0RFUy5FU0NBUEU6IHtcbiAgICAgICAgICAgIGNsb3NlKGRhdGEpO1xuICAgICAgICAgICAgZGF0YS50b2dnbGUuZm9jdXMoKTtcblxuICAgICAgICAgICAgcmV0dXJuIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjYXNlIEtFWV9DT0RFUy5BUlJPV19SSUdIVDpcbiAgICAgICAgICBjYXNlIEtFWV9DT0RFUy5BUlJPV19ET1dOOiB7XG4gICAgICAgICAgICBkYXRhLnNlbGVjdGVkSWR4ID0gTWF0aC5taW4oXG4gICAgICAgICAgICAgIGRhdGEubGlua3MubGVuZ3RoIC0gMSxcbiAgICAgICAgICAgICAgZGF0YS5zZWxlY3RlZElkeCArIDFcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGZvY3VzU2VsZWN0ZWRMaW5rKGRhdGEpO1xuXG4gICAgICAgICAgICByZXR1cm4gZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSBLRVlfQ09ERVMuQVJST1dfTEVGVDpcbiAgICAgICAgICBjYXNlIEtFWV9DT0RFUy5BUlJPV19VUDoge1xuICAgICAgICAgICAgZGF0YS5zZWxlY3RlZElkeCA9IE1hdGgubWF4KC0xLCBkYXRhLnNlbGVjdGVkSWR4IC0gMSk7XG4gICAgICAgICAgICBmb2N1c1NlbGVjdGVkTGluayhkYXRhKTtcblxuICAgICAgICAgICAgcmV0dXJuIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmb2N1c1NlbGVjdGVkTGluayhkYXRhKSB7XG4gICAgICBpZiAoZGF0YS5saW5rc1tkYXRhLnNlbGVjdGVkSWR4XSkge1xuICAgICAgICBkYXRhLmxpbmtzW2RhdGEuc2VsZWN0ZWRJZHhdLmZvY3VzKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZVRvZ2dsZUtleWRvd25IYW5kbGVyKGRhdGEpIHtcbiAgICAgIC8vIFdlIHdhbnQgdG8gY2xvc2UgaW1tZWRpYXRlbHlcbiAgICAgIC8vIGlmIGludGVyYWN0aW5nIHZpYSBrZXlib2FyZFxuICAgICAgdmFyIHRvZ2dsZXIgPSBtYWtlVG9nZ2xlcihkYXRhLCBGT1JDRV9DTE9TRSk7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGlmIChpbkRlc2lnbmVyKSByZXR1cm47XG5cbiAgICAgICAgLy8gSWYgdGhlIG1lbnUgaXMgbm90IG9wZW4sIHdlIGRvbid0IHdhbnRcbiAgICAgICAgLy8gdGhlIHVwIG9yIERvd24gYXJyb3dzIHRvIGRvIGFueXRoaW5nXG4gICAgICAgIGlmICghZGF0YS5vcGVuKSB7XG4gICAgICAgICAgc3dpdGNoIChldnQua2V5Q29kZSkge1xuICAgICAgICAgICAgY2FzZSBLRVlfQ09ERVMuQVJST1dfVVA6XG4gICAgICAgICAgICBjYXNlIEtFWV9DT0RFUy5BUlJPV19ET1dOOiB7XG4gICAgICAgICAgICAgIHJldHVybiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChldnQua2V5Q29kZSkge1xuICAgICAgICAgIGNhc2UgS0VZX0NPREVTLlNQQUNFOlxuICAgICAgICAgIGNhc2UgS0VZX0NPREVTLkVOVEVSOiB7XG4gICAgICAgICAgICB0b2dnbGVyKCk7XG4gICAgICAgICAgICBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICByZXR1cm4gZXZ0LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VEcm9wZG93bkZvY3VzT3V0SGFuZGxlcihkYXRhKSB7XG4gICAgICByZXR1cm4gZGVib3VuY2UoZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICB2YXIge3JlbGF0ZWRUYXJnZXQsIHRhcmdldH0gPSBldnQ7XG4gICAgICAgIHZhciBtZW51RWwgPSBkYXRhLmVsWzBdO1xuICAgICAgICAvKipcbiAgICAgICAgICogQ2xvc2UgbWVudVxuICAgICAgICAgKiBXaXRoIGZvY3Vzb3V0IGV2ZW50cywgdGhlIGByZWxhdGVkVGFyZ2V0YCBpcyB0aGUgZWxlbWVudCB0aGF0IHdpbGwgbmV4dCByZWNlaXZlIGZvY3VzLlxuICAgICAgICAgKiBAc2VlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRm9jdXNFdmVudC9yZWxhdGVkVGFyZ2V0XG4gICAgICAgICAqL1xuICAgICAgICB2YXIgbWVudUNvbnRhaW5zRm9jdXMgPVxuICAgICAgICAgIG1lbnVFbC5jb250YWlucyhyZWxhdGVkVGFyZ2V0KSB8fCBtZW51RWwuY29udGFpbnModGFyZ2V0KTtcbiAgICAgICAgaWYgKCFtZW51Q29udGFpbnNGb2N1cykge1xuICAgICAgICAgIGNsb3NlKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBFeHBvcnQgbW9kdWxlXG4gICAgcmV0dXJuIGFwaTtcbiAgfSlcbik7XG4iXSwibmFtZXMiOlsiV2ViZmxvdyIsInJlcXVpcmUiLCJJWEV2ZW50cyIsIktFWV9DT0RFUyIsIkFSUk9XX0xFRlQiLCJBUlJPV19VUCIsIkFSUk9XX1JJR0hUIiwiQVJST1dfRE9XTiIsIkVTQ0FQRSIsIlNQQUNFIiwiRU5URVIiLCJIT01FIiwiRU5EIiwiRk9SQ0VfQ0xPU0UiLCJJTlRFUk5BTF9QQUdFX0xJTktfSEFTSEVTX1BBVFRFUk4iLCJkZWZpbmUiLCJtb2R1bGUiLCJleHBvcnRzIiwiJCIsIl8iLCJkZWJvdW5jZSIsImFwaSIsImluQXBwIiwiZW52IiwiaW5QcmV2aWV3IiwiaW5EZXNpZ25lciIsInRvdWNoIiwibmFtZXNwYWNlIiwib3BlblN0YXRlQ2xhc3NOYW1lIiwiaXgiLCJ0cmlnZ2VycyIsImRlZmF1bHRaSW5kZXgiLCJmb2N1c091dEV2ZW50Iiwia2V5ZG93bkV2ZW50IiwibW91c2VFbnRlckV2ZW50IiwibW91c2VNb3ZlRXZlbnQiLCJtb3VzZUxlYXZlRXZlbnQiLCJtb3VzZVVwRXZlbnQiLCJjbG9zZUV2ZW50Iiwic2V0dGluZ0V2ZW50IiwiJGRvYyIsImRvY3VtZW50IiwiJGRyb3Bkb3ducyIsInJlYWR5IiwiaW5pdCIsImRlc2lnbiIsImNsb3NlQWxsIiwicHJldmlldyIsImZpbmQiLCJlYWNoIiwiYnVpbGQiLCJpIiwiZWwiLCIkZWwiLCJkYXRhIiwib3BlbiIsImNvbmZpZyIsInNlbGVjdGVkSWR4IiwidG9nZ2xlIiwiY2hpbGRyZW4iLCJsaXN0IiwibGlua3MiLCJjb21wbGV0ZSIsIm1vdXNlTGVhdmUiLCJtYWtlTW91c2VMZWF2ZUhhbmRsZXIiLCJtb3VzZVVwT3V0c2lkZSIsIm91dHNpZGUiLCJtb3VzZU1vdmVPdXRzaWRlIiwibW92ZU91dHNpZGUiLCJjb25maWd1cmUiLCJ0b2dnbGVJZCIsImF0dHIiLCJsaXN0SWQiLCJwcm9wIiwiaWR4IiwibGluayIsImhhc0F0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsInRlc3QiLCJoYXNoIiwiYWRkRXZlbnRMaXN0ZW5lciIsImNsb3NlIiwiYmluZCIsIm9mZiIsIm5hdiIsImluaXRpYWxUb2dnbGVyIiwibWFrZVRvZ2dsZXIiLCJvbiIsIm1ha2VTZXR0aW5nRXZlbnRIYW5kbGVyIiwiaG92ZXJpbmciLCJob3ZlciIsIm1ha2VNb3VzZUVudGVySGFuZGxlciIsIm1ha2VEcm9wZG93bktleWRvd25IYW5kbGVyIiwibWFrZURyb3Bkb3duRm9jdXNPdXRIYW5kbGVyIiwibWFrZVRvZ2dsZUtleWRvd25IYW5kbGVyIiwiY2xvc2VzdCIsInpJbmRleCIsIk51bWJlciIsImNzcyIsIm1hbmFnZVoiLCJkZWxheSIsImV2dCIsIm9wdGlvbnMiLCJpbW1lZGlhdGUiLCJmb3JjZUNsb3NlIiwidHlwZSIsImNsb3NlT3RoZXJzIiwiYWRkQ2xhc3MiLCJpbnRybyIsInJlZHJhdyIsInVwIiwiaXNFZGl0b3IiLCJ3aW5kb3ciLCJjbGVhclRpbWVvdXQiLCJkZWxheUlkIiwib3V0cm8iLCJzZXRUaW1lb3V0IiwidHJpZ2dlckhhbmRsZXIiLCJzZWxmIiwib3RoZXIiLCIkb3RoZXIiLCJpcyIsImhhcyIsImxlbmd0aCIsIiR0YXJnZXQiLCJ0YXJnZXQiLCJpc0V2ZW50T3V0c2lkZURyb3Bkb3ducyIsImluQXJyYXkiLCJwYXJlbnRzIiwiaXNFdmVudE9uRGV0YWNoZWRTdmciLCJpc0V2ZW50T25Ib3ZlckNvbnRyb2xzIiwicmVtb3ZlQ2xhc3MiLCJpc0V2ZW50T25Ib3ZlclRvb2xiYXIiLCIkZWRpdG9yT3ZlcmxheSIsImlzRHJvcGRvd25JbkVkaXRpb24iLCJpbmRleCIsImFjdGl2ZUVsZW1lbnQiLCJrZXlDb2RlIiwiZm9jdXNTZWxlY3RlZExpbmsiLCJwcmV2ZW50RGVmYXVsdCIsImZvY3VzIiwic3RvcFByb3BhZ2F0aW9uIiwiTWF0aCIsIm1pbiIsIm1heCIsInRvZ2dsZXIiLCJyZWxhdGVkVGFyZ2V0IiwibWVudUVsIiwibWVudUNvbnRhaW5zRm9jdXMiLCJjb250YWlucyJdLCJtYXBwaW5ncyI6IkFBQUEsNEJBQTRCLEdBRTVCOztDQUVDO0FBRUQsSUFBSUEsVUFBVUMsUUFBUTtBQUN0QixJQUFJQyxXQUFXRCxRQUFRO0FBRXZCLE1BQU1FLFlBQVk7SUFDaEJDLFlBQVk7SUFDWkMsVUFBVTtJQUNWQyxhQUFhO0lBQ2JDLFlBQVk7SUFDWkMsUUFBUTtJQUNSQyxPQUFPO0lBQ1BDLE9BQU87SUFDUEMsTUFBTTtJQUNOQyxLQUFLO0FBQ1A7QUFFQSxNQUFNQyxjQUFjO0FBRXBCOzs7Ozs7Ozs7OztDQVdDLEdBQ0QsTUFBTUMsb0NBQW9DO0FBRTFDZCxRQUFRZSxNQUFNLENBQ1osWUFDQ0MsT0FBT0MsT0FBTyxHQUFHLFNBQVVDLENBQUMsRUFBRUMsQ0FBQztJQUM5QixJQUFJQyxXQUFXRCxFQUFFQyxRQUFRO0lBRXpCLElBQUlDLE1BQU0sQ0FBQztJQUNYLElBQUlDLFFBQVF0QixRQUFRdUIsR0FBRztJQUN2QixJQUFJQyxZQUFZO0lBQ2hCLElBQUlDO0lBQ0osSUFBSUMsUUFBUTFCLFFBQVF1QixHQUFHLENBQUNHLEtBQUs7SUFDN0IsSUFBSUMsWUFBWTtJQUNoQixJQUFJQyxxQkFBcUI7SUFDekIsSUFBSUMsS0FBSzNCLFNBQVM0QixRQUFRO0lBQzFCLElBQUlDLGdCQUFnQixLQUFLLGtCQUFrQjtJQUUzQyxJQUFJQyxnQkFBZ0IsYUFBYUw7SUFDakMsSUFBSU0sZUFBZSxZQUFZTjtJQUMvQixJQUFJTyxrQkFBa0IsZUFBZVA7SUFDckMsSUFBSVEsaUJBQWlCLGNBQWNSO0lBQ25DLElBQUlTLGtCQUFrQixlQUFlVDtJQUNyQyxJQUFJVSxlQUFlLEFBQUNYLENBQUFBLFFBQVEsVUFBVSxTQUFRLElBQUtDO0lBRW5ELElBQUlXLGFBQWEsWUFBWVg7SUFDN0IsSUFBSVksZUFBZSxZQUFZWjtJQUUvQixJQUFJYSxPQUFPdEIsRUFBRXVCO0lBQ2IsSUFBSUM7SUFDSixzQ0FBc0M7SUFDdEMsaUJBQWlCO0lBRWpCckIsSUFBSXNCLEtBQUssR0FBR0M7SUFFWnZCLElBQUl3QixNQUFNLEdBQUc7UUFDWCx3Q0FBd0M7UUFDeEMsSUFBSXJCLFdBQVc7WUFDYnNCO1FBQ0Y7UUFDQXRCLFlBQVk7UUFDWm9CO0lBQ0Y7SUFFQXZCLElBQUkwQixPQUFPLEdBQUc7UUFDWnZCLFlBQVk7UUFDWm9CO0lBQ0Y7SUFFQSxzQ0FBc0M7SUFDdEMsa0JBQWtCO0lBRWxCLFNBQVNBO1FBQ1BuQixhQUFhSCxTQUFTdEIsUUFBUXVCLEdBQUcsQ0FBQztRQUVsQyxpQ0FBaUM7UUFDakNtQixhQUFhRixLQUFLUSxJQUFJLENBQUNyQjtRQUN2QmUsV0FBV08sSUFBSSxDQUFDQztJQUNsQjtJQUVBLFNBQVNBLE1BQU1DLENBQUMsRUFBRUMsRUFBRTtRQUNsQixJQUFJQyxNQUFNbkMsRUFBRWtDO1FBRVosc0JBQXNCO1FBQ3RCLElBQUlFLE9BQU9wQyxFQUFFb0MsSUFBSSxDQUFDRixJQUFJekI7UUFDdEIsSUFBSSxDQUFDMkIsTUFBTTtZQUNUQSxPQUFPcEMsRUFBRW9DLElBQUksQ0FBQ0YsSUFBSXpCLFdBQVc7Z0JBQzNCNEIsTUFBTTtnQkFDTkgsSUFBSUM7Z0JBQ0pHLFFBQVEsQ0FBQztnQkFDVEMsYUFBYSxDQUFDO1lBQ2hCO1FBQ0Y7UUFDQUgsS0FBS0ksTUFBTSxHQUFHSixLQUFLRixFQUFFLENBQUNPLFFBQVEsQ0FBQztRQUMvQkwsS0FBS00sSUFBSSxHQUFHTixLQUFLRixFQUFFLENBQUNPLFFBQVEsQ0FBQztRQUM3QkwsS0FBS08sS0FBSyxHQUFHUCxLQUFLTSxJQUFJLENBQUNaLElBQUksQ0FBQztRQUM1Qk0sS0FBS1EsUUFBUSxHQUFHQSxTQUFTUjtRQUN6QkEsS0FBS1MsVUFBVSxHQUFHQyxzQkFBc0JWO1FBQ3hDQSxLQUFLVyxjQUFjLEdBQUdDLFFBQVFaO1FBQzlCQSxLQUFLYSxnQkFBZ0IsR0FBR0MsWUFBWWQ7UUFFcEMsa0NBQWtDO1FBQ2xDZSxVQUFVZjtRQUVWLDRDQUE0QztRQUM1QyxJQUFJZ0IsV0FBV2hCLEtBQUtJLE1BQU0sQ0FBQ2EsSUFBSSxDQUFDO1FBQ2hDLElBQUlDLFNBQVNsQixLQUFLTSxJQUFJLENBQUNXLElBQUksQ0FBQztRQUU1Qiw0Q0FBNEM7UUFDNUMsSUFBSSxDQUFDRCxVQUFVO1lBQ2JBLFdBQVcsdUJBQXVCbkI7UUFDcEM7UUFFQSwwQ0FBMEM7UUFDMUMsSUFBSSxDQUFDcUIsUUFBUTtZQUNYQSxTQUFTLHFCQUFxQnJCO1FBQ2hDO1FBRUEsbUNBQW1DO1FBQ25DRyxLQUFLSSxNQUFNLENBQUNhLElBQUksQ0FBQyxNQUFNRDtRQUN2QmhCLEtBQUtJLE1BQU0sQ0FBQ2EsSUFBSSxDQUFDLGlCQUFpQkM7UUFDbENsQixLQUFLSSxNQUFNLENBQUNhLElBQUksQ0FBQyxpQkFBaUI7UUFDbENqQixLQUFLSSxNQUFNLENBQUNhLElBQUksQ0FBQyxpQkFBaUI7UUFFbEMsNEJBQTRCO1FBQzVCakIsS0FBS0ksTUFBTSxDQUFDVixJQUFJLENBQUMsMkJBQTJCdUIsSUFBSSxDQUFDLGVBQWU7UUFFaEUsb0NBQW9DO1FBQ3BDLElBQUlqQixLQUFLSSxNQUFNLENBQUNlLElBQUksQ0FBQyxlQUFlLFVBQVU7WUFDNUMsOEJBQThCO1lBQzlCbkIsS0FBS0ksTUFBTSxDQUFDYSxJQUFJLENBQUMsUUFBUTtZQUV6QixzREFBc0Q7WUFDdEQsSUFBSSxDQUFDakIsS0FBS0ksTUFBTSxDQUFDYSxJQUFJLENBQUMsYUFBYTtnQkFDakNqQixLQUFLSSxNQUFNLENBQUNhLElBQUksQ0FBQyxZQUFZO1lBQy9CO1FBQ0Y7UUFFQSxpQ0FBaUM7UUFDakNqQixLQUFLTSxJQUFJLENBQUNXLElBQUksQ0FBQyxNQUFNQztRQUNyQmxCLEtBQUtNLElBQUksQ0FBQ1csSUFBSSxDQUFDLG1CQUFtQkQ7UUFFbENoQixLQUFLTyxLQUFLLENBQUNaLElBQUksQ0FBQyxTQUFVeUIsR0FBRyxFQUFFQyxJQUFJO1lBQ2pDOzs7O1NBSUMsR0FDRCxJQUFJLENBQUNBLEtBQUtDLFlBQVksQ0FBQyxhQUFhRCxLQUFLRSxZQUFZLENBQUMsWUFBWTtZQUVsRSx3RUFBd0U7WUFDeEUsY0FBYztZQUNkLElBQUkvRCxrQ0FBa0NnRSxJQUFJLENBQUNILEtBQUtJLElBQUksR0FBRztnQkFDckRKLEtBQUtLLGdCQUFnQixDQUFDLFNBQVNDLE1BQU1DLElBQUksQ0FBQyxNQUFNNUI7WUFDbEQ7UUFDRjtRQUVBLG9CQUFvQjtRQUNwQkEsS0FBS0YsRUFBRSxDQUFDK0IsR0FBRyxDQUFDeEQ7UUFDWjJCLEtBQUtJLE1BQU0sQ0FBQ3lCLEdBQUcsQ0FBQ3hEO1FBRWhCLElBQUkyQixLQUFLOEIsR0FBRyxFQUFFO1lBQ1o5QixLQUFLOEIsR0FBRyxDQUFDRCxHQUFHLENBQUN4RDtRQUNmO1FBQ0EsSUFBSTBELGlCQUFpQkMsWUFBWWhDLE1BQU16QztRQUV2QyxJQUFJWSxZQUFZO1lBQ2Q2QixLQUFLRixFQUFFLENBQUNtQyxFQUFFLENBQUNoRCxjQUFjaUQsd0JBQXdCbEM7UUFDbkQ7UUFDQSxJQUFJLENBQUM3QixZQUFZO1lBQ2YsMERBQTBEO1lBQzFELElBQUlILE9BQU87Z0JBQ1RnQyxLQUFLbUMsUUFBUSxHQUFHO2dCQUNoQlIsTUFBTTNCO1lBQ1I7WUFDQSxJQUFJQSxLQUFLRSxNQUFNLENBQUNrQyxLQUFLLEVBQUU7Z0JBQ3JCcEMsS0FBS0ksTUFBTSxDQUFDNkIsRUFBRSxDQUFDckQsaUJBQWlCeUQsc0JBQXNCckM7WUFDeEQ7WUFDQUEsS0FBS0YsRUFBRSxDQUFDbUMsRUFBRSxDQUFDakQsWUFBWStDO1lBQ3ZCL0IsS0FBS0YsRUFBRSxDQUFDbUMsRUFBRSxDQUFDdEQsY0FBYzJELDJCQUEyQnRDO1lBQ3BEQSxLQUFLRixFQUFFLENBQUNtQyxFQUFFLENBQUN2RCxlQUFlNkQsNEJBQTRCdkM7WUFFdERBLEtBQUtJLE1BQU0sQ0FBQzZCLEVBQUUsQ0FBQ2xELGNBQWNnRDtZQUM3Qi9CLEtBQUtJLE1BQU0sQ0FBQzZCLEVBQUUsQ0FBQ3RELGNBQWM2RCx5QkFBeUJ4QztZQUV0REEsS0FBSzhCLEdBQUcsR0FBRzlCLEtBQUtGLEVBQUUsQ0FBQzJDLE9BQU8sQ0FBQztZQUMzQnpDLEtBQUs4QixHQUFHLENBQUNHLEVBQUUsQ0FBQ2pELFlBQVkrQztRQUMxQjtJQUNGO0lBRUE7O0tBRUMsR0FDRCxTQUFTaEIsVUFBVWYsSUFBSTtRQUNyQix5Q0FBeUM7UUFDekMsSUFBSTBDLFNBQVNDLE9BQU8zQyxLQUFLRixFQUFFLENBQUM4QyxHQUFHLENBQUM7UUFDaEM1QyxLQUFLNkMsT0FBTyxHQUFHSCxXQUFXakUsaUJBQWlCaUUsV0FBV2pFLGdCQUFnQjtRQUN0RXVCLEtBQUtFLE1BQU0sR0FBRztZQUNaa0MsT0FBT3BDLEtBQUtGLEVBQUUsQ0FBQ21CLElBQUksQ0FBQyxrQkFBa0IsVUFBVSxDQUFDN0M7WUFDakQwRSxPQUFPOUMsS0FBS0YsRUFBRSxDQUFDbUIsSUFBSSxDQUFDO1FBQ3RCO0lBQ0Y7SUFFQSxTQUFTaUIsd0JBQXdCbEMsSUFBSTtRQUNuQyxPQUFPLFNBQVUrQyxHQUFHLEVBQUVDLE9BQU87WUFDM0JBLFVBQVVBLFdBQVcsQ0FBQztZQUN0QmpDLFVBQVVmO1lBQ1ZnRCxRQUFRL0MsSUFBSSxLQUFLLFFBQVFBLEtBQUtEO1lBQzlCZ0QsUUFBUS9DLElBQUksS0FBSyxTQUFTMEIsTUFBTTNCLE1BQU07Z0JBQUNpRCxXQUFXO1lBQUk7UUFDeEQ7SUFDRjtJQUVBLFNBQVNqQixZQUFZaEMsSUFBSSxFQUFFa0QsVUFBVTtRQUNuQyxPQUFPcEYsU0FBUyxTQUFVaUYsR0FBRztZQUMzQixJQUFJL0MsS0FBS0MsSUFBSSxJQUFLOEMsT0FBT0EsSUFBSUksSUFBSSxLQUFLLFdBQVk7Z0JBQ2hELE9BQU94QixNQUFNM0IsTUFBTTtvQkFBQ2tEO2dCQUFVO1lBQ2hDO1lBQ0FqRCxLQUFLRDtRQUNQO0lBQ0Y7SUFFQSxTQUFTQyxLQUFLRCxJQUFJO1FBQ2hCLElBQUlBLEtBQUtDLElBQUksRUFBRTtZQUNiO1FBQ0Y7UUFFQW1ELFlBQVlwRDtRQUNaQSxLQUFLQyxJQUFJLEdBQUc7UUFDWkQsS0FBS00sSUFBSSxDQUFDK0MsUUFBUSxDQUFDL0U7UUFDbkIwQixLQUFLSSxNQUFNLENBQUNpRCxRQUFRLENBQUMvRTtRQUNyQjBCLEtBQUtJLE1BQU0sQ0FBQ2EsSUFBSSxDQUFDLGlCQUFpQixTQUFTLE9BQU87UUFDbEQxQyxHQUFHK0UsS0FBSyxDQUFDLEdBQUd0RCxLQUFLRixFQUFFLENBQUMsRUFBRTtRQUN0QnBELFFBQVE2RyxNQUFNLENBQUNDLEVBQUU7UUFFakIseURBQXlEO1FBQ3pEeEQsS0FBSzZDLE9BQU8sSUFBSTdDLEtBQUtGLEVBQUUsQ0FBQzhDLEdBQUcsQ0FBQyxXQUFXbkUsZ0JBQWdCO1FBRXZELGtDQUFrQztRQUNsQyxJQUFJZ0YsV0FBVy9HLFFBQVF1QixHQUFHLENBQUM7UUFDM0IsSUFBSSxDQUFDRSxZQUFZO1lBQ2ZlLEtBQUsrQyxFQUFFLENBQUNsRCxjQUFjaUIsS0FBS1csY0FBYztRQUMzQztRQUNBLElBQUlYLEtBQUttQyxRQUFRLElBQUksQ0FBQ3NCLFVBQVU7WUFDOUJ6RCxLQUFLRixFQUFFLENBQUNtQyxFQUFFLENBQUNuRCxpQkFBaUJrQixLQUFLUyxVQUFVO1FBQzdDO1FBQ0EsSUFBSVQsS0FBS21DLFFBQVEsSUFBSXNCLFVBQVU7WUFDN0J2RSxLQUFLK0MsRUFBRSxDQUFDcEQsZ0JBQWdCbUIsS0FBS2EsZ0JBQWdCO1FBQy9DO1FBRUEsdUJBQXVCO1FBQ3ZCNkMsT0FBT0MsWUFBWSxDQUFDM0QsS0FBSzRELE9BQU87SUFDbEM7SUFFQSxTQUFTakMsTUFBTTNCLElBQUksRUFBRSxFQUFDaUQsU0FBUyxFQUFFQyxVQUFVLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDbEQsS0FBS0MsSUFBSSxFQUFFO1lBQ2Q7UUFDRjtRQUVBLHVEQUF1RDtRQUN2RCxJQUFJRCxLQUFLRSxNQUFNLENBQUNrQyxLQUFLLElBQUlwQyxLQUFLbUMsUUFBUSxJQUFJLENBQUNlLFlBQVk7WUFDckQ7UUFDRjtRQUVBbEQsS0FBS0ksTUFBTSxDQUFDYSxJQUFJLENBQUMsaUJBQWlCO1FBRWxDakIsS0FBS0MsSUFBSSxHQUFHO1FBQ1osSUFBSUMsU0FBU0YsS0FBS0UsTUFBTTtRQUN4QjNCLEdBQUdzRixLQUFLLENBQUMsR0FBRzdELEtBQUtGLEVBQUUsQ0FBQyxFQUFFO1FBRXRCLDBDQUEwQztRQUMxQ1osS0FBSzJDLEdBQUcsQ0FBQzlDLGNBQWNpQixLQUFLVyxjQUFjO1FBQzFDekIsS0FBSzJDLEdBQUcsQ0FBQ2hELGdCQUFnQm1CLEtBQUthLGdCQUFnQjtRQUM5Q2IsS0FBS0YsRUFBRSxDQUFDK0IsR0FBRyxDQUFDL0MsaUJBQWlCa0IsS0FBS1MsVUFBVTtRQUU1Qyx1QkFBdUI7UUFDdkJpRCxPQUFPQyxZQUFZLENBQUMzRCxLQUFLNEQsT0FBTztRQUVoQyw4QkFBOEI7UUFDOUIsSUFBSSxDQUFDMUQsT0FBTzRDLEtBQUssSUFBSUcsV0FBVztZQUM5QixPQUFPakQsS0FBS1EsUUFBUTtRQUN0QjtRQUVBLHlDQUF5QztRQUN6Q1IsS0FBSzRELE9BQU8sR0FBR0YsT0FBT0ksVUFBVSxDQUFDOUQsS0FBS1EsUUFBUSxFQUFFTixPQUFPNEMsS0FBSztJQUM5RDtJQUVBLFNBQVN0RDtRQUNQTixLQUFLUSxJQUFJLENBQUNyQixXQUFXc0IsSUFBSSxDQUFDLFNBQVVFLENBQUMsRUFBRUMsRUFBRTtZQUN2Q2xDLEVBQUVrQyxJQUFJaUUsY0FBYyxDQUFDL0U7UUFDdkI7SUFDRjtJQUVBLFNBQVNvRSxZQUFZcEQsSUFBSTtRQUN2QixJQUFJZ0UsT0FBT2hFLEtBQUtGLEVBQUUsQ0FBQyxFQUFFO1FBQ3JCVixXQUFXTyxJQUFJLENBQUMsU0FBVUUsQ0FBQyxFQUFFb0UsS0FBSztZQUNoQyxJQUFJQyxTQUFTdEcsRUFBRXFHO1lBQ2YsSUFBSUMsT0FBT0MsRUFBRSxDQUFDSCxTQUFTRSxPQUFPRSxHQUFHLENBQUNKLE1BQU1LLE1BQU0sRUFBRTtnQkFDOUM7WUFDRjtZQUNBSCxPQUFPSCxjQUFjLENBQUMvRTtRQUN4QjtJQUNGO0lBRUEsU0FBUzRCLFFBQVFaLElBQUk7UUFDbkIsNkNBQTZDO1FBQzdDLElBQUlBLEtBQUtXLGNBQWMsRUFBRTtZQUN2QnpCLEtBQUsyQyxHQUFHLENBQUM5QyxjQUFjaUIsS0FBS1csY0FBYztRQUM1QztRQUVBLGtDQUFrQztRQUNsQyxPQUFPN0MsU0FBUyxTQUFVaUYsR0FBRztZQUMzQixJQUFJLENBQUMvQyxLQUFLQyxJQUFJLEVBQUU7Z0JBQ2Q7WUFDRjtZQUNBLElBQUlxRSxVQUFVMUcsRUFBRW1GLElBQUl3QixNQUFNO1lBQzFCLElBQUlELFFBQVE3QixPQUFPLENBQUMsc0JBQXNCNEIsTUFBTSxFQUFFO2dCQUNoRDtZQUNGO1lBQ0EsSUFBSUcsMEJBQ0Y1RyxFQUFFNkcsT0FBTyxDQUFDekUsS0FBS0YsRUFBRSxDQUFDLEVBQUUsRUFBRXdFLFFBQVFJLE9BQU8sQ0FBQ3JHLGdCQUFnQixDQUFDO1lBQ3pELElBQUlvRixXQUFXL0csUUFBUXVCLEdBQUcsQ0FBQztZQUMzQixJQUFJdUcseUJBQXlCO2dCQUMzQixJQUFJZixVQUFVO29CQUNaLElBQUlrQix1QkFDRkwsUUFBUUksT0FBTyxHQUFHTCxNQUFNLEtBQUssS0FDN0JDLFFBQVFJLE9BQU8sQ0FBQyxPQUFPTCxNQUFNLEtBQUs7b0JBQ3BDLElBQUlPLHlCQUF5Qk4sUUFBUUksT0FBTyxDQUMxQyxxQ0FDQUwsTUFBTTtvQkFDUixJQUFJTSx3QkFBd0JDLHdCQUF3Qjt3QkFDbEQ7b0JBQ0Y7Z0JBQ0Y7Z0JBQ0FqRCxNQUFNM0I7WUFDUjtRQUNGO0lBQ0Y7SUFFQSxTQUFTUSxTQUFTUixJQUFJO1FBQ3BCLE9BQU87WUFDTEEsS0FBS00sSUFBSSxDQUFDdUUsV0FBVyxDQUFDdkc7WUFDdEIwQixLQUFLSSxNQUFNLENBQUN5RSxXQUFXLENBQUN2RztZQUV4QixzQ0FBc0M7WUFDdEMwQixLQUFLNkMsT0FBTyxJQUFJN0MsS0FBS0YsRUFBRSxDQUFDOEMsR0FBRyxDQUFDLFdBQVc7UUFDekM7SUFDRjtJQUVBLFNBQVNQLHNCQUFzQnJDLElBQUk7UUFDakMsT0FBTztZQUNMQSxLQUFLbUMsUUFBUSxHQUFHO1lBQ2hCbEMsS0FBS0Q7UUFDUDtJQUNGO0lBRUEsU0FBU1Usc0JBQXNCVixJQUFJO1FBQ2pDLE9BQU87WUFDTEEsS0FBS21DLFFBQVEsR0FBRztZQUVoQixtREFBbUQ7WUFDbkQsZ0NBQWdDO1lBQ2hDLElBQUksQ0FBQ25DLEtBQUtPLEtBQUssQ0FBQzRELEVBQUUsQ0FBQyxXQUFXO2dCQUM1QnhDLE1BQU0zQjtZQUNSO1FBQ0Y7SUFDRjtJQUVBLFNBQVNjLFlBQVlkLElBQUk7UUFDdkIsT0FBT2xDLFNBQVMsU0FBVWlGLEdBQUc7WUFDM0IsSUFBSSxDQUFDL0MsS0FBS0MsSUFBSSxFQUFFO2dCQUNkO1lBQ0Y7WUFDQSxJQUFJcUUsVUFBVTFHLEVBQUVtRixJQUFJd0IsTUFBTTtZQUMxQixJQUFJQywwQkFDRjVHLEVBQUU2RyxPQUFPLENBQUN6RSxLQUFLRixFQUFFLENBQUMsRUFBRSxFQUFFd0UsUUFBUUksT0FBTyxDQUFDckcsZ0JBQWdCLENBQUM7WUFDekQsSUFBSW1HLHlCQUF5QjtnQkFDM0IsSUFBSUkseUJBQXlCTixRQUFRSSxPQUFPLENBQzFDLHFDQUNBTCxNQUFNO2dCQUNSLElBQUlTLHdCQUF3QlIsUUFBUUksT0FBTyxDQUN6QywyQkFDQUwsTUFBTTtnQkFDUixJQUFJVSxpQkFBaUJuSCxFQUFFO2dCQUN2QixJQUFJb0gsc0JBQ0ZELGVBQWVyRixJQUFJLENBQUMsMEJBQTBCMkUsTUFBTSxJQUNwRFUsZUFBZXJGLElBQUksQ0FBQywyQkFBMkIyRSxNQUFNO2dCQUN2RCxJQUNFTywwQkFDQUUseUJBQ0FFLHFCQUNBO29CQUNBO2dCQUNGO2dCQUNBaEYsS0FBS21DLFFBQVEsR0FBRztnQkFDaEJSLE1BQU0zQjtZQUNSO1FBQ0Y7SUFDRjtJQUVBLFNBQVNzQywyQkFBMkJ0QyxJQUFJO1FBQ3RDLE9BQU8sU0FBVStDLEdBQUc7WUFDbEIsbUVBQW1FO1lBQ25FLElBQUk1RSxjQUFjLENBQUM2QixLQUFLQyxJQUFJLEVBQUU7Z0JBQzVCO1lBQ0Y7WUFFQSxxRUFBcUU7WUFDckUsK0RBQStEO1lBQy9ERCxLQUFLRyxXQUFXLEdBQUdILEtBQUtPLEtBQUssQ0FBQzBFLEtBQUssQ0FBQzlGLFNBQVMrRixhQUFhO1lBRTFELGdDQUFnQztZQUNoQyxPQUFRbkMsSUFBSW9DLE9BQU87Z0JBQ2pCLEtBQUt0SSxVQUFVUSxJQUFJO29CQUFFO3dCQUNuQixJQUFJLENBQUMyQyxLQUFLQyxJQUFJLEVBQUU7d0JBRWhCRCxLQUFLRyxXQUFXLEdBQUc7d0JBQ25CaUYsa0JBQWtCcEY7d0JBRWxCLE9BQU8rQyxJQUFJc0MsY0FBYztvQkFDM0I7Z0JBRUEsS0FBS3hJLFVBQVVTLEdBQUc7b0JBQUU7d0JBQ2xCLElBQUksQ0FBQzBDLEtBQUtDLElBQUksRUFBRTt3QkFFaEJELEtBQUtHLFdBQVcsR0FBR0gsS0FBS08sS0FBSyxDQUFDOEQsTUFBTSxHQUFHO3dCQUN2Q2Usa0JBQWtCcEY7d0JBRWxCLE9BQU8rQyxJQUFJc0MsY0FBYztvQkFDM0I7Z0JBRUEsS0FBS3hJLFVBQVVLLE1BQU07b0JBQUU7d0JBQ3JCeUUsTUFBTTNCO3dCQUNOQSxLQUFLSSxNQUFNLENBQUNrRixLQUFLO3dCQUVqQixPQUFPdkMsSUFBSXdDLGVBQWU7b0JBQzVCO2dCQUVBLEtBQUsxSSxVQUFVRyxXQUFXO2dCQUMxQixLQUFLSCxVQUFVSSxVQUFVO29CQUFFO3dCQUN6QitDLEtBQUtHLFdBQVcsR0FBR3FGLEtBQUtDLEdBQUcsQ0FDekJ6RixLQUFLTyxLQUFLLENBQUM4RCxNQUFNLEdBQUcsR0FDcEJyRSxLQUFLRyxXQUFXLEdBQUc7d0JBR3JCaUYsa0JBQWtCcEY7d0JBRWxCLE9BQU8rQyxJQUFJc0MsY0FBYztvQkFDM0I7Z0JBRUEsS0FBS3hJLFVBQVVDLFVBQVU7Z0JBQ3pCLEtBQUtELFVBQVVFLFFBQVE7b0JBQUU7d0JBQ3ZCaUQsS0FBS0csV0FBVyxHQUFHcUYsS0FBS0UsR0FBRyxDQUFDLENBQUMsR0FBRzFGLEtBQUtHLFdBQVcsR0FBRzt3QkFDbkRpRixrQkFBa0JwRjt3QkFFbEIsT0FBTytDLElBQUlzQyxjQUFjO29CQUMzQjtZQUNGO1FBQ0Y7SUFDRjtJQUVBLFNBQVNELGtCQUFrQnBGLElBQUk7UUFDN0IsSUFBSUEsS0FBS08sS0FBSyxDQUFDUCxLQUFLRyxXQUFXLENBQUMsRUFBRTtZQUNoQ0gsS0FBS08sS0FBSyxDQUFDUCxLQUFLRyxXQUFXLENBQUMsQ0FBQ21GLEtBQUs7UUFDcEM7SUFDRjtJQUVBLFNBQVM5Qyx5QkFBeUJ4QyxJQUFJO1FBQ3BDLCtCQUErQjtRQUMvQiw4QkFBOEI7UUFDOUIsSUFBSTJGLFVBQVUzRCxZQUFZaEMsTUFBTXpDO1FBRWhDLE9BQU8sU0FBVXdGLEdBQUc7WUFDbEIsSUFBSTVFLFlBQVk7WUFFaEIseUNBQXlDO1lBQ3pDLHVDQUF1QztZQUN2QyxJQUFJLENBQUM2QixLQUFLQyxJQUFJLEVBQUU7Z0JBQ2QsT0FBUThDLElBQUlvQyxPQUFPO29CQUNqQixLQUFLdEksVUFBVUUsUUFBUTtvQkFDdkIsS0FBS0YsVUFBVUksVUFBVTt3QkFBRTs0QkFDekIsT0FBTzhGLElBQUl3QyxlQUFlO3dCQUM1QjtnQkFDRjtZQUNGO1lBRUEsT0FBUXhDLElBQUlvQyxPQUFPO2dCQUNqQixLQUFLdEksVUFBVU0sS0FBSztnQkFDcEIsS0FBS04sVUFBVU8sS0FBSztvQkFBRTt3QkFDcEJ1STt3QkFDQTVDLElBQUl3QyxlQUFlO3dCQUNuQixPQUFPeEMsSUFBSXNDLGNBQWM7b0JBQzNCO1lBQ0Y7UUFDRjtJQUNGO0lBRUEsU0FBUzlDLDRCQUE0QnZDLElBQUk7UUFDdkMsT0FBT2xDLFNBQVMsU0FBVWlGLEdBQUc7WUFDM0IsSUFBSSxFQUFDNkMsYUFBYSxFQUFFckIsTUFBTSxFQUFDLEdBQUd4QjtZQUM5QixJQUFJOEMsU0FBUzdGLEtBQUtGLEVBQUUsQ0FBQyxFQUFFO1lBQ3ZCOzs7O1NBSUMsR0FDRCxJQUFJZ0csb0JBQ0ZELE9BQU9FLFFBQVEsQ0FBQ0gsa0JBQWtCQyxPQUFPRSxRQUFRLENBQUN4QjtZQUNwRCxJQUFJLENBQUN1QixtQkFBbUI7Z0JBQ3RCbkUsTUFBTTNCO1lBQ1I7WUFDQSxPQUFPK0MsSUFBSXdDLGVBQWU7UUFDNUI7SUFDRjtJQUVBLGdCQUFnQjtJQUNoQixPQUFPeEg7QUFDVCJ9

}),

}]);