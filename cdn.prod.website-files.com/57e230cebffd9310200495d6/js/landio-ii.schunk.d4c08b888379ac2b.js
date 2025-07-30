
/*!
 * Webflow: Front-end site library
 * @license MIT
 * Inline scripts may access the api using an async handler:
 *   var Webflow = Webflow || [];
 *   Webflow.push(readyFunction);
 */

"use strict";
(self["webpackChunk"] = self["webpackChunk"] || []).push([["471"], {
69078: (function (module, __unused_webpack_exports, __webpack_require__) {
/* global document window */ /**
 * Webflow: Tabs component
 */ 
var Webflow = __webpack_require__(43949);
var IXEvents = __webpack_require__(65134);
Webflow.define('tabs', module.exports = function($) {
    var api = {};
    var tram = $.tram;
    var $doc = $(document);
    var $tabs;
    var design;
    var env = Webflow.env;
    var safari = env.safari;
    var inApp = env();
    var tabAttr = 'data-w-tab';
    var paneAttr = 'data-w-pane';
    var namespace = '.w-tabs';
    var linkCurrent = 'w--current';
    var tabActive = 'w--tab-active';
    var ix = IXEvents.triggers;
    var inRedraw = false;
    // -----------------------------------
    // Module methods
    api.ready = api.design = api.preview = init;
    api.redraw = function() {
        inRedraw = true;
        init();
        inRedraw = false;
    };
    api.destroy = function() {
        $tabs = $doc.find(namespace);
        if (!$tabs.length) {
            return;
        }
        $tabs.each(resetIX);
        removeListeners();
    };
    // -----------------------------------
    // Private methods
    function init() {
        design = inApp && Webflow.env('design');
        // Find all instances on the page
        $tabs = $doc.find(namespace);
        if (!$tabs.length) {
            return;
        }
        $tabs.each(build);
        if (Webflow.env('preview') && !inRedraw) {
            $tabs.each(resetIX);
        }
        removeListeners();
        addListeners();
    }
    function removeListeners() {
        Webflow.redraw.off(api.redraw);
    }
    function addListeners() {
        Webflow.redraw.on(api.redraw);
    }
    function resetIX(i, el) {
        var data = $.data(el, namespace);
        if (!data) {
            return;
        }
        data.links && data.links.each(ix.reset);
        data.panes && data.panes.each(ix.reset);
    }
    function build(i, el) {
        var widgetHash = namespace.substr(1) + '-' + i;
        var $el = $(el);
        // Store state in data
        var data = $.data(el, namespace);
        if (!data) {
            data = $.data(el, namespace, {
                el: $el,
                config: {}
            });
        }
        data.current = null;
        data.tabIdentifier = widgetHash + '-' + tabAttr;
        data.paneIdentifier = widgetHash + '-' + paneAttr;
        data.menu = $el.children('.w-tab-menu');
        data.links = data.menu.children('.w-tab-link');
        data.content = $el.children('.w-tab-content');
        data.panes = data.content.children('.w-tab-pane');
        // Remove old events
        data.el.off(namespace);
        data.links.off(namespace);
        // This role is necessary in the ARIA spec
        data.menu.attr('role', 'tablist');
        // Set all tabs unfocusable
        data.links.attr('tabindex', '-1');
        // Set config from data attributes
        configure(data);
        // Wire up events when not in design mode
        if (!design) {
            data.links.on('click' + namespace, linkSelect(data));
            data.links.on('keydown' + namespace, handleLinkKeydown(data));
            // Trigger first intro event from current tab
            var $link = data.links.filter('.' + linkCurrent);
            var tab = $link.attr(tabAttr);
            tab && changeTab(data, {
                tab,
                immediate: true
            });
        }
    }
    function configure(data) {
        var config = {};
        // Set config options from data attributes
        config.easing = data.el.attr('data-easing') || 'ease';
        var intro = parseInt(data.el.attr('data-duration-in'), 10);
        // eslint-disable-next-line no-self-compare
        intro = config.intro = intro === intro ? intro : 0;
        var outro = parseInt(data.el.attr('data-duration-out'), 10);
        // eslint-disable-next-line no-self-compare
        outro = config.outro = outro === outro ? outro : 0;
        config.immediate = !intro && !outro;
        // Store config in data
        data.config = config;
    }
    function getActiveTabIdx(data) {
        var tab = data.current;
        return Array.prototype.findIndex.call(data.links, (t)=>{
            return t.getAttribute(tabAttr) === tab;
        }, null);
    }
    function linkSelect(data) {
        return function(evt) {
            evt.preventDefault();
            var tab = evt.currentTarget.getAttribute(tabAttr);
            tab && changeTab(data, {
                tab
            });
        };
    }
    function handleLinkKeydown(data) {
        return function(evt) {
            var currentIdx = getActiveTabIdx(data);
            var keyName = evt.key;
            var keyMap = {
                ArrowLeft: currentIdx - 1,
                ArrowUp: currentIdx - 1,
                ArrowRight: currentIdx + 1,
                ArrowDown: currentIdx + 1,
                End: data.links.length - 1,
                Home: 0
            };
            // Bail out of function if this key is not
            // involved in tab management
            if (!(keyName in keyMap)) return;
            evt.preventDefault();
            var nextIdx = keyMap[keyName];
            // go back to end of tabs if we wrap past the start
            if (nextIdx === -1) {
                nextIdx = data.links.length - 1;
            }
            // go back to start if we wrap past the last tab
            if (nextIdx === data.links.length) {
                nextIdx = 0;
            }
            var tabEl = data.links[nextIdx];
            var tab = tabEl.getAttribute(tabAttr);
            tab && changeTab(data, {
                tab
            });
        };
    }
    function changeTab(data, options) {
        options = options || {};
        var config = data.config;
        var easing = config.easing;
        var tab = options.tab;
        // Don't select the same tab twice
        if (tab === data.current) {
            return;
        }
        data.current = tab;
        /**
       * The currently active tab.
       * Will be referenced to manage focus after
       * TabLink attributes are changed
       * @type {HTMLAnchorElement}
       */ var currentTab;
        // Select the current link
        data.links.each(function(i, el) {
            var $el = $(el);
            // Add important attributes at build time.
            if (options.immediate || config.immediate) {
                // Store corresponding pane for reference.
                var pane = data.panes[i];
                // IDs are necessary for ARIA relationships,
                // so if the user did not create one, we create one
                // using our generated identifier
                if (!el.id) {
                    el.id = data.tabIdentifier + '-' + i;
                }
                if (!pane.id) {
                    pane.id = data.paneIdentifier + '-' + i;
                }
                el.href = '#' + pane.id;
                // Tab elements must take this role
                el.setAttribute('role', 'tab');
                // Tab elements must reference the unique ID of the panel
                // that they control
                el.setAttribute('aria-controls', pane.id);
                // Tab elements must report that they are not selected
                // by default
                el.setAttribute('aria-selected', 'false');
                // Panes must take on the `Tabpanel` role
                pane.setAttribute('role', 'tabpanel');
                // Elements with tabpanel role must be labelled by
                // their controlling tab
                pane.setAttribute('aria-labelledby', el.id);
            }
            if (el.getAttribute(tabAttr) === tab) {
                // This is the current tab. Store it.
                currentTab = el;
                $el.addClass(linkCurrent).removeAttr('tabindex').attr({
                    'aria-selected': 'true'
                }).each(ix.intro);
            } else if ($el.hasClass(linkCurrent)) {
                $el.removeClass(linkCurrent).attr({
                    tabindex: '-1',
                    'aria-selected': 'false'
                }).each(ix.outro);
            }
        });
        // Find the new tab panes and keep track of previous
        var targets = [];
        var previous = [];
        data.panes.each(function(i, el) {
            var $el = $(el);
            if (el.getAttribute(tabAttr) === tab) {
                targets.push(el);
            } else if ($el.hasClass(tabActive)) {
                previous.push(el);
            }
        });
        var $targets = $(targets);
        var $previous = $(previous);
        // Switch tabs immediately and bypass transitions
        if (options.immediate || config.immediate) {
            $targets.addClass(tabActive).each(ix.intro);
            $previous.removeClass(tabActive);
            // Redraw to benefit components in the hidden tab pane
            // But only if not currently in the middle of a redraw
            if (!inRedraw) {
                Webflow.redraw.up();
            }
            return;
        } else {
            // Backwards compatible hack to prevent focus from scrolling
            var x = window.scrollX;
            var y = window.scrollY;
            currentTab.focus();
            window.scrollTo(x, y);
        }
        // Fade out the currently active tab before intro
        if ($previous.length && config.outro) {
            $previous.each(ix.outro);
            tram($previous).add('opacity ' + config.outro + 'ms ' + easing, {
                fallback: safari
            }).start({
                opacity: 0
            }).then(()=>fadeIn(config, $previous, $targets));
        } else {
            // Skip the outro and play intro
            fadeIn(config, $previous, $targets);
        }
    }
    // Fade in the new target
    function fadeIn(config, $previous, $targets) {
        // Clear previous active class + styles touched by tram
        // We cannot remove the whole inline style because it could be dynamically bound
        $previous.removeClass(tabActive).css({
            opacity: '',
            transition: '',
            transform: '',
            width: '',
            height: ''
        });
        // Add active class to new target
        $targets.addClass(tabActive).each(ix.intro);
        Webflow.redraw.up();
        // Set opacity immediately if intro is zero
        if (!config.intro) {
            return tram($targets).set({
                opacity: 1
            });
        }
        // Otherwise fade in opacity
        tram($targets).set({
            opacity: 0
        }).redraw().add('opacity ' + config.intro + 'ms ' + config.easing, {
            fallback: safari
        }).start({
            opacity: 1
        });
    }
    // Export module
    return api;
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYmZsb3ctdGFicy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgZG9jdW1lbnQgd2luZG93ICovXG5cbi8qKlxuICogV2ViZmxvdzogVGFicyBjb21wb25lbnRcbiAqL1xuXG52YXIgV2ViZmxvdyA9IHJlcXVpcmUoJy4uL0Jhc2VTaXRlTW9kdWxlcy93ZWJmbG93LWxpYicpO1xudmFyIElYRXZlbnRzID0gcmVxdWlyZSgnLi4vQmFzZVNpdGVNb2R1bGVzL3dlYmZsb3ctaXgyLWV2ZW50cycpO1xuXG5XZWJmbG93LmRlZmluZShcbiAgJ3RhYnMnLFxuICAobW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoJCkge1xuICAgIHZhciBhcGkgPSB7fTtcbiAgICB2YXIgdHJhbSA9ICQudHJhbTtcbiAgICB2YXIgJGRvYyA9ICQoZG9jdW1lbnQpO1xuICAgIHZhciAkdGFicztcbiAgICB2YXIgZGVzaWduO1xuICAgIHZhciBlbnYgPSBXZWJmbG93LmVudjtcbiAgICB2YXIgc2FmYXJpID0gZW52LnNhZmFyaTtcbiAgICB2YXIgaW5BcHAgPSBlbnYoKTtcbiAgICB2YXIgdGFiQXR0ciA9ICdkYXRhLXctdGFiJztcbiAgICB2YXIgcGFuZUF0dHIgPSAnZGF0YS13LXBhbmUnO1xuICAgIHZhciBuYW1lc3BhY2UgPSAnLnctdGFicyc7XG4gICAgdmFyIGxpbmtDdXJyZW50ID0gJ3ctLWN1cnJlbnQnO1xuICAgIHZhciB0YWJBY3RpdmUgPSAndy0tdGFiLWFjdGl2ZSc7XG4gICAgdmFyIGl4ID0gSVhFdmVudHMudHJpZ2dlcnM7XG5cbiAgICB2YXIgaW5SZWRyYXcgPSBmYWxzZTtcblxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gTW9kdWxlIG1ldGhvZHNcblxuICAgIGFwaS5yZWFkeSA9IGFwaS5kZXNpZ24gPSBhcGkucHJldmlldyA9IGluaXQ7XG5cbiAgICBhcGkucmVkcmF3ID0gZnVuY3Rpb24gKCkge1xuICAgICAgaW5SZWRyYXcgPSB0cnVlO1xuICAgICAgaW5pdCgpO1xuICAgICAgaW5SZWRyYXcgPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgYXBpLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAkdGFicyA9ICRkb2MuZmluZChuYW1lc3BhY2UpO1xuICAgICAgaWYgKCEkdGFicy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgJHRhYnMuZWFjaChyZXNldElYKTtcbiAgICAgIHJlbW92ZUxpc3RlbmVycygpO1xuICAgIH07XG5cbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8vIFByaXZhdGUgbWV0aG9kc1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIGRlc2lnbiA9IGluQXBwICYmIFdlYmZsb3cuZW52KCdkZXNpZ24nKTtcblxuICAgICAgLy8gRmluZCBhbGwgaW5zdGFuY2VzIG9uIHRoZSBwYWdlXG4gICAgICAkdGFicyA9ICRkb2MuZmluZChuYW1lc3BhY2UpO1xuICAgICAgaWYgKCEkdGFicy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgJHRhYnMuZWFjaChidWlsZCk7XG4gICAgICBpZiAoV2ViZmxvdy5lbnYoJ3ByZXZpZXcnKSAmJiAhaW5SZWRyYXcpIHtcbiAgICAgICAgJHRhYnMuZWFjaChyZXNldElYKTtcbiAgICAgIH1cblxuICAgICAgcmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgICBhZGRMaXN0ZW5lcnMoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgICBXZWJmbG93LnJlZHJhdy5vZmYoYXBpLnJlZHJhdyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkTGlzdGVuZXJzKCkge1xuICAgICAgV2ViZmxvdy5yZWRyYXcub24oYXBpLnJlZHJhdyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVzZXRJWChpLCBlbCkge1xuICAgICAgdmFyIGRhdGEgPSAkLmRhdGEoZWwsIG5hbWVzcGFjZSk7XG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGF0YS5saW5rcyAmJiBkYXRhLmxpbmtzLmVhY2goaXgucmVzZXQpO1xuICAgICAgZGF0YS5wYW5lcyAmJiBkYXRhLnBhbmVzLmVhY2goaXgucmVzZXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkKGksIGVsKSB7XG4gICAgICB2YXIgd2lkZ2V0SGFzaCA9IG5hbWVzcGFjZS5zdWJzdHIoMSkgKyAnLScgKyBpO1xuICAgICAgdmFyICRlbCA9ICQoZWwpO1xuXG4gICAgICAvLyBTdG9yZSBzdGF0ZSBpbiBkYXRhXG4gICAgICB2YXIgZGF0YSA9ICQuZGF0YShlbCwgbmFtZXNwYWNlKTtcbiAgICAgIGlmICghZGF0YSkge1xuICAgICAgICBkYXRhID0gJC5kYXRhKGVsLCBuYW1lc3BhY2UsIHtlbDogJGVsLCBjb25maWc6IHt9fSk7XG4gICAgICB9XG4gICAgICBkYXRhLmN1cnJlbnQgPSBudWxsO1xuICAgICAgZGF0YS50YWJJZGVudGlmaWVyID0gd2lkZ2V0SGFzaCArICctJyArIHRhYkF0dHI7XG4gICAgICBkYXRhLnBhbmVJZGVudGlmaWVyID0gd2lkZ2V0SGFzaCArICctJyArIHBhbmVBdHRyO1xuXG4gICAgICBkYXRhLm1lbnUgPSAkZWwuY2hpbGRyZW4oJy53LXRhYi1tZW51Jyk7XG4gICAgICBkYXRhLmxpbmtzID0gZGF0YS5tZW51LmNoaWxkcmVuKCcudy10YWItbGluaycpO1xuICAgICAgZGF0YS5jb250ZW50ID0gJGVsLmNoaWxkcmVuKCcudy10YWItY29udGVudCcpO1xuICAgICAgZGF0YS5wYW5lcyA9IGRhdGEuY29udGVudC5jaGlsZHJlbignLnctdGFiLXBhbmUnKTtcblxuICAgICAgLy8gUmVtb3ZlIG9sZCBldmVudHNcbiAgICAgIGRhdGEuZWwub2ZmKG5hbWVzcGFjZSk7XG4gICAgICBkYXRhLmxpbmtzLm9mZihuYW1lc3BhY2UpO1xuXG4gICAgICAvLyBUaGlzIHJvbGUgaXMgbmVjZXNzYXJ5IGluIHRoZSBBUklBIHNwZWNcbiAgICAgIGRhdGEubWVudS5hdHRyKCdyb2xlJywgJ3RhYmxpc3QnKTtcblxuICAgICAgLy8gU2V0IGFsbCB0YWJzIHVuZm9jdXNhYmxlXG4gICAgICBkYXRhLmxpbmtzLmF0dHIoJ3RhYmluZGV4JywgJy0xJyk7XG5cbiAgICAgIC8vIFNldCBjb25maWcgZnJvbSBkYXRhIGF0dHJpYnV0ZXNcbiAgICAgIGNvbmZpZ3VyZShkYXRhKTtcblxuICAgICAgLy8gV2lyZSB1cCBldmVudHMgd2hlbiBub3QgaW4gZGVzaWduIG1vZGVcbiAgICAgIGlmICghZGVzaWduKSB7XG4gICAgICAgIGRhdGEubGlua3Mub24oJ2NsaWNrJyArIG5hbWVzcGFjZSwgbGlua1NlbGVjdChkYXRhKSk7XG4gICAgICAgIGRhdGEubGlua3Mub24oJ2tleWRvd24nICsgbmFtZXNwYWNlLCBoYW5kbGVMaW5rS2V5ZG93bihkYXRhKSk7XG5cbiAgICAgICAgLy8gVHJpZ2dlciBmaXJzdCBpbnRybyBldmVudCBmcm9tIGN1cnJlbnQgdGFiXG4gICAgICAgIHZhciAkbGluayA9IGRhdGEubGlua3MuZmlsdGVyKCcuJyArIGxpbmtDdXJyZW50KTtcbiAgICAgICAgdmFyIHRhYiA9ICRsaW5rLmF0dHIodGFiQXR0cik7XG4gICAgICAgIHRhYiAmJiBjaGFuZ2VUYWIoZGF0YSwge3RhYiwgaW1tZWRpYXRlOiB0cnVlfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uZmlndXJlKGRhdGEpIHtcbiAgICAgIHZhciBjb25maWcgPSB7fTtcblxuICAgICAgLy8gU2V0IGNvbmZpZyBvcHRpb25zIGZyb20gZGF0YSBhdHRyaWJ1dGVzXG4gICAgICBjb25maWcuZWFzaW5nID0gZGF0YS5lbC5hdHRyKCdkYXRhLWVhc2luZycpIHx8ICdlYXNlJztcblxuICAgICAgdmFyIGludHJvID0gcGFyc2VJbnQoZGF0YS5lbC5hdHRyKCdkYXRhLWR1cmF0aW9uLWluJyksIDEwKTtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zZWxmLWNvbXBhcmVcbiAgICAgIGludHJvID0gY29uZmlnLmludHJvID0gaW50cm8gPT09IGludHJvID8gaW50cm8gOiAwO1xuXG4gICAgICB2YXIgb3V0cm8gPSBwYXJzZUludChkYXRhLmVsLmF0dHIoJ2RhdGEtZHVyYXRpb24tb3V0JyksIDEwKTtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zZWxmLWNvbXBhcmVcbiAgICAgIG91dHJvID0gY29uZmlnLm91dHJvID0gb3V0cm8gPT09IG91dHJvID8gb3V0cm8gOiAwO1xuXG4gICAgICBjb25maWcuaW1tZWRpYXRlID0gIWludHJvICYmICFvdXRybztcblxuICAgICAgLy8gU3RvcmUgY29uZmlnIGluIGRhdGFcbiAgICAgIGRhdGEuY29uZmlnID0gY29uZmlnO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEFjdGl2ZVRhYklkeChkYXRhKSB7XG4gICAgICB2YXIgdGFiID0gZGF0YS5jdXJyZW50O1xuICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5maW5kSW5kZXguY2FsbChcbiAgICAgICAgZGF0YS5saW5rcyxcbiAgICAgICAgKHQpID0+IHtcbiAgICAgICAgICByZXR1cm4gdC5nZXRBdHRyaWJ1dGUodGFiQXR0cikgPT09IHRhYjtcbiAgICAgICAgfSxcbiAgICAgICAgbnVsbFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaW5rU2VsZWN0KGRhdGEpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgdGFiID0gZXZ0LmN1cnJlbnRUYXJnZXQuZ2V0QXR0cmlidXRlKHRhYkF0dHIpO1xuICAgICAgICB0YWIgJiYgY2hhbmdlVGFiKGRhdGEsIHt0YWJ9KTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlTGlua0tleWRvd24oZGF0YSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRJZHggPSBnZXRBY3RpdmVUYWJJZHgoZGF0YSk7XG4gICAgICAgIHZhciBrZXlOYW1lID0gZXZ0LmtleTtcbiAgICAgICAgdmFyIGtleU1hcCA9IHtcbiAgICAgICAgICBBcnJvd0xlZnQ6IGN1cnJlbnRJZHggLSAxLFxuICAgICAgICAgIEFycm93VXA6IGN1cnJlbnRJZHggLSAxLFxuICAgICAgICAgIEFycm93UmlnaHQ6IGN1cnJlbnRJZHggKyAxLFxuICAgICAgICAgIEFycm93RG93bjogY3VycmVudElkeCArIDEsXG4gICAgICAgICAgRW5kOiBkYXRhLmxpbmtzLmxlbmd0aCAtIDEsXG4gICAgICAgICAgSG9tZTogMCxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBCYWlsIG91dCBvZiBmdW5jdGlvbiBpZiB0aGlzIGtleSBpcyBub3RcbiAgICAgICAgLy8gaW52b2x2ZWQgaW4gdGFiIG1hbmFnZW1lbnRcbiAgICAgICAgaWYgKCEoa2V5TmFtZSBpbiBrZXlNYXApKSByZXR1cm47XG5cbiAgICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIG5leHRJZHggPSBrZXlNYXBba2V5TmFtZV07XG5cbiAgICAgICAgLy8gZ28gYmFjayB0byBlbmQgb2YgdGFicyBpZiB3ZSB3cmFwIHBhc3QgdGhlIHN0YXJ0XG4gICAgICAgIGlmIChuZXh0SWR4ID09PSAtMSkge1xuICAgICAgICAgIG5leHRJZHggPSBkYXRhLmxpbmtzLmxlbmd0aCAtIDE7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZ28gYmFjayB0byBzdGFydCBpZiB3ZSB3cmFwIHBhc3QgdGhlIGxhc3QgdGFiXG4gICAgICAgIGlmIChuZXh0SWR4ID09PSBkYXRhLmxpbmtzLmxlbmd0aCkge1xuICAgICAgICAgIG5leHRJZHggPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0YWJFbCA9IGRhdGEubGlua3NbbmV4dElkeF07XG4gICAgICAgIHZhciB0YWIgPSB0YWJFbC5nZXRBdHRyaWJ1dGUodGFiQXR0cik7XG4gICAgICAgIHRhYiAmJiBjaGFuZ2VUYWIoZGF0YSwge3RhYn0pO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGFuZ2VUYWIoZGF0YSwgb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgIHZhciBjb25maWcgPSBkYXRhLmNvbmZpZztcbiAgICAgIHZhciBlYXNpbmcgPSBjb25maWcuZWFzaW5nO1xuICAgICAgdmFyIHRhYiA9IG9wdGlvbnMudGFiO1xuXG4gICAgICAvLyBEb24ndCBzZWxlY3QgdGhlIHNhbWUgdGFiIHR3aWNlXG4gICAgICBpZiAodGFiID09PSBkYXRhLmN1cnJlbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZGF0YS5jdXJyZW50ID0gdGFiO1xuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIHRhYi5cbiAgICAgICAqIFdpbGwgYmUgcmVmZXJlbmNlZCB0byBtYW5hZ2UgZm9jdXMgYWZ0ZXJcbiAgICAgICAqIFRhYkxpbmsgYXR0cmlidXRlcyBhcmUgY2hhbmdlZFxuICAgICAgICogQHR5cGUge0hUTUxBbmNob3JFbGVtZW50fVxuICAgICAgICovXG4gICAgICB2YXIgY3VycmVudFRhYjtcblxuICAgICAgLy8gU2VsZWN0IHRoZSBjdXJyZW50IGxpbmtcbiAgICAgIGRhdGEubGlua3MuZWFjaChmdW5jdGlvbiAoaSwgZWwpIHtcbiAgICAgICAgdmFyICRlbCA9ICQoZWwpO1xuXG4gICAgICAgIC8vIEFkZCBpbXBvcnRhbnQgYXR0cmlidXRlcyBhdCBidWlsZCB0aW1lLlxuICAgICAgICBpZiAob3B0aW9ucy5pbW1lZGlhdGUgfHwgY29uZmlnLmltbWVkaWF0ZSkge1xuICAgICAgICAgIC8vIFN0b3JlIGNvcnJlc3BvbmRpbmcgcGFuZSBmb3IgcmVmZXJlbmNlLlxuICAgICAgICAgIHZhciBwYW5lID0gZGF0YS5wYW5lc1tpXTtcbiAgICAgICAgICAvLyBJRHMgYXJlIG5lY2Vzc2FyeSBmb3IgQVJJQSByZWxhdGlvbnNoaXBzLFxuICAgICAgICAgIC8vIHNvIGlmIHRoZSB1c2VyIGRpZCBub3QgY3JlYXRlIG9uZSwgd2UgY3JlYXRlIG9uZVxuICAgICAgICAgIC8vIHVzaW5nIG91ciBnZW5lcmF0ZWQgaWRlbnRpZmllclxuICAgICAgICAgIGlmICghZWwuaWQpIHtcbiAgICAgICAgICAgIGVsLmlkID0gZGF0YS50YWJJZGVudGlmaWVyICsgJy0nICsgaTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFwYW5lLmlkKSB7XG4gICAgICAgICAgICBwYW5lLmlkID0gZGF0YS5wYW5lSWRlbnRpZmllciArICctJyArIGk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsLmhyZWYgPSAnIycgKyBwYW5lLmlkO1xuXG4gICAgICAgICAgLy8gVGFiIGVsZW1lbnRzIG11c3QgdGFrZSB0aGlzIHJvbGVcbiAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAndGFiJyk7XG4gICAgICAgICAgLy8gVGFiIGVsZW1lbnRzIG11c3QgcmVmZXJlbmNlIHRoZSB1bmlxdWUgSUQgb2YgdGhlIHBhbmVsXG4gICAgICAgICAgLy8gdGhhdCB0aGV5IGNvbnRyb2xcbiAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtY29udHJvbHMnLCBwYW5lLmlkKTtcbiAgICAgICAgICAvLyBUYWIgZWxlbWVudHMgbXVzdCByZXBvcnQgdGhhdCB0aGV5IGFyZSBub3Qgc2VsZWN0ZWRcbiAgICAgICAgICAvLyBieSBkZWZhdWx0XG4gICAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdhcmlhLXNlbGVjdGVkJywgJ2ZhbHNlJyk7XG4gICAgICAgICAgLy8gUGFuZXMgbXVzdCB0YWtlIG9uIHRoZSBgVGFicGFuZWxgIHJvbGVcbiAgICAgICAgICBwYW5lLnNldEF0dHJpYnV0ZSgncm9sZScsICd0YWJwYW5lbCcpO1xuICAgICAgICAgIC8vIEVsZW1lbnRzIHdpdGggdGFicGFuZWwgcm9sZSBtdXN0IGJlIGxhYmVsbGVkIGJ5XG4gICAgICAgICAgLy8gdGhlaXIgY29udHJvbGxpbmcgdGFiXG4gICAgICAgICAgcGFuZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWxsZWRieScsIGVsLmlkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWwuZ2V0QXR0cmlidXRlKHRhYkF0dHIpID09PSB0YWIpIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBjdXJyZW50IHRhYi4gU3RvcmUgaXQuXG4gICAgICAgICAgY3VycmVudFRhYiA9IGVsO1xuICAgICAgICAgICRlbFxuICAgICAgICAgICAgLmFkZENsYXNzKGxpbmtDdXJyZW50KVxuICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ3RhYmluZGV4JylcbiAgICAgICAgICAgIC5hdHRyKHsnYXJpYS1zZWxlY3RlZCc6ICd0cnVlJ30pXG4gICAgICAgICAgICAuZWFjaChpeC5pbnRybyk7XG4gICAgICAgIH0gZWxzZSBpZiAoJGVsLmhhc0NsYXNzKGxpbmtDdXJyZW50KSkge1xuICAgICAgICAgICRlbFxuICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGxpbmtDdXJyZW50KVxuICAgICAgICAgICAgLmF0dHIoe3RhYmluZGV4OiAnLTEnLCAnYXJpYS1zZWxlY3RlZCc6ICdmYWxzZSd9KVxuICAgICAgICAgICAgLmVhY2goaXgub3V0cm8pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gRmluZCB0aGUgbmV3IHRhYiBwYW5lcyBhbmQga2VlcCB0cmFjayBvZiBwcmV2aW91c1xuICAgICAgdmFyIHRhcmdldHMgPSBbXTtcbiAgICAgIHZhciBwcmV2aW91cyA9IFtdO1xuICAgICAgZGF0YS5wYW5lcy5lYWNoKGZ1bmN0aW9uIChpLCBlbCkge1xuICAgICAgICB2YXIgJGVsID0gJChlbCk7XG4gICAgICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUodGFiQXR0cikgPT09IHRhYikge1xuICAgICAgICAgIHRhcmdldHMucHVzaChlbCk7XG4gICAgICAgIH0gZWxzZSBpZiAoJGVsLmhhc0NsYXNzKHRhYkFjdGl2ZSkpIHtcbiAgICAgICAgICBwcmV2aW91cy5wdXNoKGVsKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZhciAkdGFyZ2V0cyA9ICQodGFyZ2V0cyk7XG4gICAgICB2YXIgJHByZXZpb3VzID0gJChwcmV2aW91cyk7XG5cbiAgICAgIC8vIFN3aXRjaCB0YWJzIGltbWVkaWF0ZWx5IGFuZCBieXBhc3MgdHJhbnNpdGlvbnNcbiAgICAgIGlmIChvcHRpb25zLmltbWVkaWF0ZSB8fCBjb25maWcuaW1tZWRpYXRlKSB7XG4gICAgICAgICR0YXJnZXRzLmFkZENsYXNzKHRhYkFjdGl2ZSkuZWFjaChpeC5pbnRybyk7XG4gICAgICAgICRwcmV2aW91cy5yZW1vdmVDbGFzcyh0YWJBY3RpdmUpO1xuICAgICAgICAvLyBSZWRyYXcgdG8gYmVuZWZpdCBjb21wb25lbnRzIGluIHRoZSBoaWRkZW4gdGFiIHBhbmVcbiAgICAgICAgLy8gQnV0IG9ubHkgaWYgbm90IGN1cnJlbnRseSBpbiB0aGUgbWlkZGxlIG9mIGEgcmVkcmF3XG4gICAgICAgIGlmICghaW5SZWRyYXcpIHtcbiAgICAgICAgICBXZWJmbG93LnJlZHJhdy51cCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIEZvY3VzIGlmIHRoaXMgaXMgbm90IHRoZSBvbi1wYWdlLWxvYWQgY2FsbCB0byBgY2hhbmdlVGFiYFxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIEJhY2t3YXJkcyBjb21wYXRpYmxlIGhhY2sgdG8gcHJldmVudCBmb2N1cyBmcm9tIHNjcm9sbGluZ1xuICAgICAgICB2YXIgeCA9IHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICB2YXIgeSA9IHdpbmRvdy5zY3JvbGxZO1xuICAgICAgICBjdXJyZW50VGFiLmZvY3VzKCk7XG4gICAgICAgIHdpbmRvdy5zY3JvbGxUbyh4LCB5KTtcbiAgICAgIH1cblxuICAgICAgLy8gRmFkZSBvdXQgdGhlIGN1cnJlbnRseSBhY3RpdmUgdGFiIGJlZm9yZSBpbnRyb1xuICAgICAgaWYgKCRwcmV2aW91cy5sZW5ndGggJiYgY29uZmlnLm91dHJvKSB7XG4gICAgICAgICRwcmV2aW91cy5lYWNoKGl4Lm91dHJvKTtcbiAgICAgICAgdHJhbSgkcHJldmlvdXMpXG4gICAgICAgICAgLmFkZCgnb3BhY2l0eSAnICsgY29uZmlnLm91dHJvICsgJ21zICcgKyBlYXNpbmcsIHtmYWxsYmFjazogc2FmYXJpfSlcbiAgICAgICAgICAuc3RhcnQoe29wYWNpdHk6IDB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IGZhZGVJbihjb25maWcsICRwcmV2aW91cywgJHRhcmdldHMpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNraXAgdGhlIG91dHJvIGFuZCBwbGF5IGludHJvXG4gICAgICAgIGZhZGVJbihjb25maWcsICRwcmV2aW91cywgJHRhcmdldHMpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZhZGUgaW4gdGhlIG5ldyB0YXJnZXRcbiAgICBmdW5jdGlvbiBmYWRlSW4oY29uZmlnLCAkcHJldmlvdXMsICR0YXJnZXRzKSB7XG4gICAgICAvLyBDbGVhciBwcmV2aW91cyBhY3RpdmUgY2xhc3MgKyBzdHlsZXMgdG91Y2hlZCBieSB0cmFtXG4gICAgICAvLyBXZSBjYW5ub3QgcmVtb3ZlIHRoZSB3aG9sZSBpbmxpbmUgc3R5bGUgYmVjYXVzZSBpdCBjb3VsZCBiZSBkeW5hbWljYWxseSBib3VuZFxuICAgICAgJHByZXZpb3VzLnJlbW92ZUNsYXNzKHRhYkFjdGl2ZSkuY3NzKHtcbiAgICAgICAgb3BhY2l0eTogJycsXG4gICAgICAgIHRyYW5zaXRpb246ICcnLFxuICAgICAgICB0cmFuc2Zvcm06ICcnLFxuICAgICAgICB3aWR0aDogJycsXG4gICAgICAgIGhlaWdodDogJycsXG4gICAgICB9KTtcblxuICAgICAgLy8gQWRkIGFjdGl2ZSBjbGFzcyB0byBuZXcgdGFyZ2V0XG4gICAgICAkdGFyZ2V0cy5hZGRDbGFzcyh0YWJBY3RpdmUpLmVhY2goaXguaW50cm8pO1xuICAgICAgV2ViZmxvdy5yZWRyYXcudXAoKTtcblxuICAgICAgLy8gU2V0IG9wYWNpdHkgaW1tZWRpYXRlbHkgaWYgaW50cm8gaXMgemVyb1xuICAgICAgaWYgKCFjb25maWcuaW50cm8pIHtcbiAgICAgICAgcmV0dXJuIHRyYW0oJHRhcmdldHMpLnNldCh7b3BhY2l0eTogMX0pO1xuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UgZmFkZSBpbiBvcGFjaXR5XG4gICAgICB0cmFtKCR0YXJnZXRzKVxuICAgICAgICAuc2V0KHtvcGFjaXR5OiAwfSlcbiAgICAgICAgLnJlZHJhdygpXG4gICAgICAgIC5hZGQoJ29wYWNpdHkgJyArIGNvbmZpZy5pbnRybyArICdtcyAnICsgY29uZmlnLmVhc2luZywge1xuICAgICAgICAgIGZhbGxiYWNrOiBzYWZhcmksXG4gICAgICAgIH0pXG4gICAgICAgIC5zdGFydCh7b3BhY2l0eTogMX0pO1xuICAgIH1cblxuICAgIC8vIEV4cG9ydCBtb2R1bGVcbiAgICByZXR1cm4gYXBpO1xuICB9KVxuKTtcbiJdLCJuYW1lcyI6WyJXZWJmbG93IiwicmVxdWlyZSIsIklYRXZlbnRzIiwiZGVmaW5lIiwibW9kdWxlIiwiZXhwb3J0cyIsIiQiLCJhcGkiLCJ0cmFtIiwiJGRvYyIsImRvY3VtZW50IiwiJHRhYnMiLCJkZXNpZ24iLCJlbnYiLCJzYWZhcmkiLCJpbkFwcCIsInRhYkF0dHIiLCJwYW5lQXR0ciIsIm5hbWVzcGFjZSIsImxpbmtDdXJyZW50IiwidGFiQWN0aXZlIiwiaXgiLCJ0cmlnZ2VycyIsImluUmVkcmF3IiwicmVhZHkiLCJwcmV2aWV3IiwiaW5pdCIsInJlZHJhdyIsImRlc3Ryb3kiLCJmaW5kIiwibGVuZ3RoIiwiZWFjaCIsInJlc2V0SVgiLCJyZW1vdmVMaXN0ZW5lcnMiLCJidWlsZCIsImFkZExpc3RlbmVycyIsIm9mZiIsIm9uIiwiaSIsImVsIiwiZGF0YSIsImxpbmtzIiwicmVzZXQiLCJwYW5lcyIsIndpZGdldEhhc2giLCJzdWJzdHIiLCIkZWwiLCJjb25maWciLCJjdXJyZW50IiwidGFiSWRlbnRpZmllciIsInBhbmVJZGVudGlmaWVyIiwibWVudSIsImNoaWxkcmVuIiwiY29udGVudCIsImF0dHIiLCJjb25maWd1cmUiLCJsaW5rU2VsZWN0IiwiaGFuZGxlTGlua0tleWRvd24iLCIkbGluayIsImZpbHRlciIsInRhYiIsImNoYW5nZVRhYiIsImltbWVkaWF0ZSIsImVhc2luZyIsImludHJvIiwicGFyc2VJbnQiLCJvdXRybyIsImdldEFjdGl2ZVRhYklkeCIsIkFycmF5IiwicHJvdG90eXBlIiwiZmluZEluZGV4IiwiY2FsbCIsInQiLCJnZXRBdHRyaWJ1dGUiLCJldnQiLCJwcmV2ZW50RGVmYXVsdCIsImN1cnJlbnRUYXJnZXQiLCJjdXJyZW50SWR4Iiwia2V5TmFtZSIsImtleSIsImtleU1hcCIsIkFycm93TGVmdCIsIkFycm93VXAiLCJBcnJvd1JpZ2h0IiwiQXJyb3dEb3duIiwiRW5kIiwiSG9tZSIsIm5leHRJZHgiLCJ0YWJFbCIsIm9wdGlvbnMiLCJjdXJyZW50VGFiIiwicGFuZSIsImlkIiwiaHJlZiIsInNldEF0dHJpYnV0ZSIsImFkZENsYXNzIiwicmVtb3ZlQXR0ciIsImhhc0NsYXNzIiwicmVtb3ZlQ2xhc3MiLCJ0YWJpbmRleCIsInRhcmdldHMiLCJwcmV2aW91cyIsInB1c2giLCIkdGFyZ2V0cyIsIiRwcmV2aW91cyIsInVwIiwieCIsIndpbmRvdyIsInNjcm9sbFgiLCJ5Iiwic2Nyb2xsWSIsImZvY3VzIiwic2Nyb2xsVG8iLCJhZGQiLCJmYWxsYmFjayIsInN0YXJ0Iiwib3BhY2l0eSIsInRoZW4iLCJmYWRlSW4iLCJjc3MiLCJ0cmFuc2l0aW9uIiwidHJhbnNmb3JtIiwid2lk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

}),

}]);