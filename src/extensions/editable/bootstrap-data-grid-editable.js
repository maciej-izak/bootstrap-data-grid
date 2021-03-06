/**
 * Nova Creator Boostrap Data Grid Extension: editable
 *
 */

(function ($) {
    'use strict'; // jshint ignore:line

    // noinspection JSUnusedLocalSymbols
	$.extend($.fn.tablear.Constructor.defaults, {
        editable: true,
        onEditableInit: function (){
            return false;
        },
        onEditableSave: function(field, row, oldValue, $el) {
            return false;
        },
        onEditableShown: function(field, row, $el, editable) {
            return false;
        },
        onEditableHidden: function(field, row, $el, reason) {
            return false;
        }
    });

    $.extend($.fn.tablear.Constructor.EVENTS, {
        'editable-init.bs.table': 'onEditableInit',
        'editable-save.bs.table': 'onEditableSave',
        'editable-shown.bs.table': 'onEditableShown',
        'editable-hidden.bs.table': 'onEditableHidden'
    });

    var _initExtension = $.fn.tablear.Constructor.prototype.initExtension;
    $.fn.tablear.Constructor.prototype.initExtension = function () {
        var that = this;
        _initExtension.apply(this, Array.prototype.slice.apply(arguments));

        if(!this.options.editable) {
            return;
        }

        var identifier;
        $.each(this.columns, function (i, column) {
        	if(column.identifier) {
        		identifier = column.id;
            	return false;
        	}
        });

        $.each(this.columns, function (i, column) {
            if(!column.editable) {
                return;
            }

            var editableOptions = {};
            var editableDataMarkup = [];
            var editableDataPrefix = 'editable-';

            var processDataOptions = function(key, value) {
            	// Replace camel case with dashes.
            	var dashKey = key.replace(/([A-Z])/g, function($1) {
            		return "-" + $1.toLowerCase();
            	});
            	if(dashKey.slice(0, editableDataPrefix.length) === editableDataPrefix) {
            		var dataKey = dashKey.replace(editableDataPrefix, 'data-');
            		editableOptions[dataKey] = value;
            	}
            };

            $.each(that.options, processDataOptions);

            var _formatter = column.formatter;
            column.formatter = function(value, row, index) {
                //var result = _formatter ? _formatter(value, row, index) : value;
	            var result = _formatter ? _formatter(value, row, index) : row[value.field];
	            if(result && (typeof result === 'string' || result instanceof String)) {
	            	result = result.replace(/"/g, "&quot;"); //escape quote
	            }

                $.each(column, processDataOptions);

	            editableDataMarkup = [];
                $.each(editableOptions, function(editableKey, editableValue) {
                    editableDataMarkup.push(' ' + editableKey + '="' + editableValue + '"');
                });

                return ['<a href="javascript:void(0)"',
                    ' data-name="' + column.field + '"',
                    ' data-pk="' + row[identifier] + '"',
                    //' data-value="' + result + '"',
	                (result ? (' data-value="' + result + '"') : ''),
                    editableDataMarkup.join(''),
                    '>' + '</a>'
                ].join('');
            };
        });
    };

    var _afterRowsRendered = $.fn.tablear.Constructor.prototype.afterRowsRendered;
    $.fn.tablear.Constructor.prototype.afterRowsRendered = function () {
        var that = this;
        _afterRowsRendered.apply(this, Array.prototype.slice.apply(arguments));

        if(!this.options.editable) {
            return;
        }

        var numberOfColumns = this.columns.length;
        var lastVisibleColumn = -1;
        for(var index = numberOfColumns - 1; index >= 0; index--) {
        	if(this.columns[index].visible) {
        		lastVisibleColumn = index;
        		break;
        	}
        }
        $.each(this.columns, function(columnIndex, column) {
            if(!column.editable) {
                return;
            }
            
            //there's a bug that prevents transmitting the minYear, maxYear parameters directly through data- tags
            // so a bit of help is needed            
            var aElements = that.$element.find('a[data-name="' + column.field + '"]');
            aElements.each(function() {
            	var combodateData = {};
            	var maxYear = $(this).data("maxYear");
            	maxYear && (combodateData["maxYear"] = maxYear);
            	var minYear = $(this).data("minYear");
            	minYear && (combodateData["minYear"] = minYear);
            	var yearDescending = $(this).data("yearDescending");
            	if(typeof yearDescending != 'undefined') {
            		combodateData["yearDescending"] = yearDescending;
            	}
            	var placement = 'top';
            	if(columnIndex === lastVisibleColumn) {
            		placement = 'left';
            	}
            	$(this).editable({ combodate: combodateData, placement: placement });
            });
            aElements.off('save').on('save', that, function(e, params) {
            	var Grid = e.data;
            	var columnId = $(e.currentTarget).data('name');
            	//var column = Grid.getColumnById(columnId);
            	var row = Grid.getRowById($(e.currentTarget).data('pk'));
            	if(!row) {
            		row = Grid.getRowById(0);
            	}
            	$(this).data('value', params.submitValue);
            	var oldValue = row[columnId];
            	row[columnId] = params.submitValue;
            	Grid.options.onEditableSave(columnId, row, oldValue, $(this));
            });
            aElements.off('shown').on('shown', that, function(e, editable) {
            	var Grid = e.data;
            	var columnId = $(e.currentTarget).data('name');
            	var row = Grid.getRowById($(e.currentTarget).data('pk'));
            	if(!row) {
            		row = Grid.getRowById(0);
            	}
            	Grid.options.onEditableShown(columnId, row, $(this), editable);
            });
            aElements.off('hidden').on('hidden', that, function(e, reason) {
            	var Grid = e.data;
            	var columnId = $(e.currentTarget).data('name');
            	var row = Grid.getRowById($(e.currentTarget).data('pk'));
            	if(!row) {
            		row = Grid.getRowById(0);
            	}
            	Grid.options.onEditableHidden(columnId, row, $(this), reason);            	
            });
        });
    };
})(jQuery);