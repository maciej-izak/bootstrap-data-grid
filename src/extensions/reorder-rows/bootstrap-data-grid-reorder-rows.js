/**
 * Nova Creator Boostrap Data Grid Extension: reorder-rows
 *
 */

(function($) {
    'use strict';

    var isSearch = false;

    var rowAttr = function (row, index) {
        return {
            id: 'customId_' + index
        };
    };

    $.extend($.fn.tablear.Constructor.defaults, {
        reorderableRows: false,
        onDragStyle: null,
        onDropStyle: null,
        onDragClass: "reorder_rows_onDragClass",
        dragHandle: null,
        useRowAttrFunc: false,
        onReorderRowsDrag: function(table, row) {
            return false;
        },
        onReorderRowsDrop: function(table, row) {
            return false;
        },
        onReorderRow: function(newData) {
             return false;
        }
    });

    $.extend($.fn.tablear.Constructor.EVENTS, {
        'reorder-row.bs.table': 'onReorderRow'
    });

    var _init = $.fn.tablear.Constructor.prototype.init;
    var _initSearch = $.fn.tablear.Constructor.prototype.initSearch;
    $.fn.tablear.Constructor.prototype.init = function () {
        if(!this.options.reorderableRows) {
            _init.apply(this, Array.prototype.slice.apply(arguments));
            return;
        }
        var that = this;
        if(this.options.useRowAttrFunc) {
            this.options.rowAttributes = rowAttr;
        }
        var onPostBody = this.options.onPostBody;
        this.options.onPostBody = function() {
            setTimeout(function() {
                that.makeRowsReorderable();
                onPostBody.apply();
            }, 1);
        };

        _init.apply(this, Array.prototype.slice.apply(arguments));
    };

    $.fn.tablear.Constructor.prototype.initSearch = function () {
        _initSearch.apply(this, Array.prototype.slice.apply(arguments));
        if(!this.options.reorderableRows) {
            return;
        }

        //Known issue after search if you reorder the rows the data is not display properly
        //isSearch = true;
    };

    $.fn.tablear.Constructor.prototype.makeRowsReorderable = function() {
        if(this.options.cardView) {
            return;
        }

        var that = this;
        this.$element.tableDnD({
            onDragStyle: that.options.onDragStyle,
            onDropStyle: that.options.onDropStyle,
            onDragClass: that.options.onDragClass,
            onDrop: that.onDrop,
            onDragStart: that.options.onReorderRowsDrag,
            dragHandle: that.options.dragHandle
        });
    };

    $.fn.tablear.Constructor.prototype.onDrop = function(table, droppedRow) {
        var tableBs = $(table);
        var tableBsData = tableBs.data('bootstrap.table');
        var tableBsOptions = tableBs.data('bootstrap.table').options;
        var row = null;
        var newData = [];

        for(var i = 0; i < table.tBodies[0].rows.length; i++) {
            row = $(table.tBodies[0].rows[i]);
            newData.push(tableBsOptions.data[row.data('index')]);
            row.data('index', i).attr('data-index', i);
        }

        tableBsOptions.data = newData;

        //Call the user defined function
        tableBsOptions.onReorderRowsDrop.apply(table, [table, droppedRow]);

        //Call the event reorder-row
        tableBsData.trigger('reorder-row', newData);
    };
})(jQuery);