/**
 * Nova Creator Boostrap Data Grid Extension: resizable
 *
 */

(function ($) {
    'use strict';

    var initResizable = function (that) {
        //Deletes the plugin to re-create it
        that.$element.colResizable({disable: true});

        //Creates the plugin
        that.$element.colResizable({
            liveDrag: that.options.liveDrag,
            fixed: that.options.fixed,
            headerOnly: that.options.headerOnly,
            minWidth: that.options.minWidth,
            hoverCursor: that.options.hoverCursor,
            dragCursor: that.options.dragCursor,
            onResize: that.onResize,
            onDrag: that.options.onResizableDrag
        });
    };

    $.extend($.fn.tablear.Constructor.defaults, {
        resizable: false,
        liveDrag: false,
        fixed: true,
        headerOnly: false,
        minWidth: 15,
        hoverCursor: 'e-resize',
        dragCursor: 'e-resize',
        onResizableResize: function() {
            return false;
        },
        onResizableDrag: function() {
            return false;
        }
    });

    var _initHeader = $.fn.tablear.Constructor.prototype.initHeader;
    $.fn.tablear.Constructor.prototype.initHeader = function() {
        _initHeader.apply(this, Array.prototype.slice.apply(arguments));
        var that = this;
        _resetView.apply(this, Array.prototype.slice.apply(arguments));
        if(this.options.resizable) {
            // because in fitHeader function, we use setTimeout(func, 100);
            setTimeout(function () {
                initResizable(that);
            }, 100);
        }
    };
})(jQuery);