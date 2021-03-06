/**
 * Nova Creator Boostrap Data Grid Extension: filters
 *
 */

(function ($) {
    'use strict'; // jshint ignore:line

    var addOptionToSelectControl = function(selectControl, value, text) {
        value = $.trim(value);
        selectControl = $(selectControl.get(selectControl.length - 1));
        if(!existOptionInSelectControl(selectControl, value)) {
            selectControl.append($("<option></option>")
                .attr("value", value)
                .text($('<div />').html(text).text()));
        }
    };

    var sortSelectControl = function(selectControl) {
        var $opts = selectControl.find('option:gt(0)');
        $opts.sort(function (a, b) {
            a = $(a).text().toLowerCase();
            b = $(b).text().toLowerCase();
            if($.isNumeric(a) && $.isNumeric(b)) {
                // Convert numerical values from string to float.
                a = parseFloat(a);
                b = parseFloat(b);
            }
            return a > b ? 1 : a < b ? -1 : 0;
        });

        selectControl.find('option:gt(0)').remove();
        selectControl.append($opts);
    };

    var existOptionInSelectControl = function(selectControl, value) {
        var options = selectControl.get(selectControl.length - 1).options;
        for(var i = 0; i < options.length; i++) {
            if(options[i].value === value.toString()) {
                //The value is not valid to add
                return true;
            }
        }
        //If we get here, the value is valid to add
        return false;
    };

    var fixHeaderCSS = function(that) {
        that.$tableHeader.css('height', '77px');
    };

    var getCurrentHeader = function(that) {
        var header = that.$header;
        if(that.options.height) {
            header = that.$tableHeader;
        }
        return header;
    };

    var getCurrentSearchControls = function(that) {
        var searchControls = 'select, input';
        if(that.options.height) {
            searchControls = 'table select, table input';
        }
        return searchControls;
    };

    var getCursorPosition = function(el) {
        if(isIEBrowser()) {
            if($(el).is('input')) {
                var pos = 0;
                if('selectionStart' in el) {
                    pos = el.selectionStart;
                } else if('selection' in document) {
                    el.focus();
                    var sel = document.selection.createRange();
                    var selLength = document.selection.createRange().text.length;
                    sel.moveStart('character', -el.value.length);
                    pos = sel.text.length - selLength;
                }
                return pos;
            } else {
                return -1;
            }
        } else {
            return -1;
        }
    };

    var setCursorPosition = function(el, index) {
        if(isIEBrowser()) {
            if(el.setSelectionRange !== undefined) {
                el.setSelectionRange(index, index);
            } else {
                $(el).val(el.value);
            }
        }
    };

    var copyValues = function(that) {
        var header = getCurrentHeader(that);
        var searchControls = getCurrentSearchControls(that);

        that.options.valuesShowFilter = [];

        header.find(searchControls).each(function () {
            that.options.valuesShowFilter.push({
                field: $(this).closest('[data-field]').data('field'),
                value: $(this).val(),
                position: getCursorPosition($(this).get(0))
            });
        });
    };

    var setValues = function(that) {
        var field = null;
        var result = [];
        var header = getCurrentHeader(that);
        var searchControls = getCurrentSearchControls(that);

        if(that.options.valuesShowFilter.length > 0) {
            header.find(searchControls).each(function (index, ele) {
                field = $(this).closest('[data-field]').data('field');
                result = $.grep(that.options.valuesShowFilter, function(valueObj) {
                    return valueObj.field === field;
                });

                if(result.length > 0) {
                    $(this).val(result[0].value);
                    setCursorPosition($(this).get(0), result[0].position);
                }
            });
        }
    };

    var collectBootstrapCookies = function cookiesRegex() {
        var cookies = [];
        var foundCookies = document.cookie.match(/(?:bs.table.)(\w*)/g);

        if(foundCookies) {
            $.each(foundCookies, function (i, cookie) {
                if(/./.test(cookie)) {
                    cookie = cookie.split(".").pop();
                }

                if($.inArray(cookie, cookies) === -1) {
                    cookies.push(cookie);
                }
            });
            return cookies;
        }
    };

    var initFilterSelectControls = function(that) {
        //var data = that.options.data;
        var data = that.columns;
        //var itemsPerPage = that.pageTo < that.options.data.length ? that.options.data.length : that.pageTo;

        var isColumnSearchableViaSelect = function(column) {
            return column.showFilter && column.showFilter.toLowerCase() === 'select' && column.searchable;
        };

        var isFilterDataNotGiven = function(column) {
            return column.filterData === undefined || column.filterData.toLowerCase() === 'column';
        };

        var hasSelectControlElement = function(selectControl) {
            return selectControl && selectControl.length > 0;
        };

        var z = that.options.pagination ? (that.options.sidePagination === 'server' ? that.pageTo : that.options.totalRows) : that.pageTo;

        if(that.header) {
            //$.each(that.header.fields, function(j, field) {
            $.each(that.columns, function(j, column) {                
                var selectControl = $('.tablear-filter-control-' + escapeID(column.field));

                if(isColumnSearchableViaSelect(column) && isFilterDataNotGiven(column) && hasSelectControlElement(selectControl)) {
                	selectControl.html(""); //clear
                    if(selectControl.get(selectControl.length - 1).options.length === 0) {
                        //Added the default option
                        addOptionToSelectControl(selectControl, '', '');
                    }
                    var uniqueValues = {};
                    for(var i = 0; i < that.rows.length; i++) {
                        //Added a new value
                        var fieldValue = that.rows[i][column.field];
                        //var formattedValue = calculateObjectValue(that.header, that.header.formatters[j], 
                          //  [ fieldValue, that.rows[i], i ], fieldValue);
                        //uniqueValues[formattedValue] = fieldValue;
                        uniqueValues[fieldValue] = fieldValue;
                    }
                    for(var key in uniqueValues) {
                        addOptionToSelectControl(selectControl, uniqueValues[key], key);
                    }
                    sortSelectControl(selectControl);
                }
            });
        }
    };

    var escapeID = function(id) {
        return String(id).replace( /(:|\.|\[|\]|,)/g, "\\$1" );
    };

    var createControls = function(that, header) {
        var addedShowFilter = false;
        var isVisible;
        var html;
        var timeoutId = 0;

        $.each(that.columns, function(i, column) {
            isVisible = 'hidden';
            html = [];

            if(!column.visible) {
                return;
            }

            if(!column.showFilter) {
                html.push('<div style="height: 34px;"></div>'); //just space
            } else {
                html.push('<div style="margin: 0 2px 2px 2px;" class="showFilter">');
                var nameControl = column.showFilter.toLowerCase();
                if(column.searchable && that.options.filterTemplate[nameControl]) {
                    addedShowFilter = true;
                    isVisible = 'visible';
                    html.push(that.options.filterTemplate[nameControl](that, column.field, isVisible));
                }
            }

            $.each(header.children().children(), function(i, tr) {
                tr = $(tr);
                if(tr.data('columnId') === column.id) {
                    tr.append(html.join(''));
                    return false;
                }
            });

            if(column.filterData !== undefined && column.filterData.toLowerCase() !== 'column') {
                var filterDataType = getFilterDataMethod(filterDataMethods, column.filterData.substring(0, column.filterData.indexOf(':')));
                var filterDataSource;
                var selectControl;

                if(filterDataType !== null) {
                    filterDataSource = column.filterData.substring(column.filterData.indexOf(':') + 1, column.filterData.length);
                    selectControl = $('.tablear-filter-control-' + escapeID(column.field));
                    addOptionToSelectControl(selectControl, '', '');
                    filterDataType(filterDataSource, selectControl);
                } else {
                    throw new SyntaxError('Error. You should use any of these allowed filter data methods: var, json, url.' + ' Use like this: var: {key: "value"}');
                }

                var variableValues;
                var key;
                switch(filterDataType) {
                    case 'url':
                        $.ajax({
                            url: filterDataSource,
                            dataType: 'json',
                            success: function(data) {
                                for(var key in data) {
                                    addOptionToSelectControl(selectControl, key, data[key]);
                                }
                                sortSelectControl(selectControl);
                            }
                        });
                        break;
                    case 'var':
                        variableValues = window[filterDataSource];
                        for(key in variableValues) {
                            addOptionToSelectControl(selectControl, key, variableValues[key]);
                        }
                        sortSelectControl(selectControl);
                        break;
                    case 'json':
                        variableValues = JSON.parse(filterDataSource);
                        for(key in variableValues) {
                            addOptionToSelectControl(selectControl, key, variableValues[key]);
                        }
                        sortSelectControl(selectControl);
                        break;
                }
            }
        });

        if(addedShowFilter) {
            header.off('keyup', 'input').on('keyup', 'input', function(event) {
            clearTimeout(timeoutId);
                timeoutId = setTimeout(function() {
                    that.onColumnSearch(event);
                }, that.options.searchTimeOut);
            });

            header.off('change', 'select').on('change', 'select', function(event) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(function() {
                    that.onColumnSearch(event);
                }, that.options.searchTimeOut);
            });

            header.off('mouseup', 'input').on('mouseup', 'input', function(event) {
                var $input = $(this),
                oldValue = $input.val();

                if(oldValue === "") {
                    return;
                }

                setTimeout(function() {
                    var newValue = $input.val();
                    if(newValue === ""){
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(function() {
                            that.onColumnSearch(event);
                        }, that.options.searchTimeOut);
                    }
                }, 1);
            });

            if(header.find('.date-filter-control').length > 0) {
                $.each(that.columns, function(i, column) {
                    if(column.showFilter !== undefined && column.showFilter.toLowerCase() === 'datepicker') {
                        header.find('.date-filter-control.tablear-filter-control-' + 
                            column.field).datepicker(column.filterDatepickerOptions).on('changeDate', function (e) {
                                //Fired the keyup event
                                $(e.currentTarget).keyup();
                            });
                    }
                });
            }
        } else {
            header.find('.showFilter').hide();
        }
    };

    var getDirectionOfSelectOptions = function(alignment) {
        alignment = alignment === undefined ? 'left' : alignment.toLowerCase();
        switch (alignment) {
            case 'left':
                return 'ltr';
            case 'right':
                return 'rtl';
            case 'auto':
                return 'auto';
            default:
                return 'ltr';
        }
    };

    var filterDataMethods = {
        'var': function(filterDataSource, selectControl) {
            var variableValues = window[filterDataSource];
            for(var key in variableValues) {
                addOptionToSelectControl(selectControl, key, variableValues[key]);
            }
            sortSelectControl(selectControl);
        },
        'url': function(filterDataSource, selectControl) {
            $.ajax({
                url: filterDataSource,
                dataType: 'json',
                success: function (data) {
                    for(var key in data) {
                        addOptionToSelectControl(selectControl, key, data[key]);
                    }
                    sortSelectControl(selectControl);
                }
            });
        },
        'json': function(filterDataSource, selectControl) {
            var variableValues = JSON.parse(filterDataSource);
            for(var key in variableValues) {
                addOptionToSelectControl(selectControl, key, variableValues[key]);
            }
            sortSelectControl(selectControl);
        }
    };

    var getFilterDataMethod = function(objFilterDataMethod, searchTerm) {
        var keys = Object.keys(objFilterDataMethod);
        for(var i = 0; i < keys.length; i++) {
            if(keys[i] === searchTerm) {
                return objFilterDataMethod[searchTerm];
            }
        }
        return null;
    };

    $.extend($.fn.tablear.Constructor.defaults, {
        showFilter: false,
        onColumnSearch: function(field, text) {
            return false;
        },
        filterShowClear: false,
        alignmentSelectControlOptions: undefined,
        filterTemplate: {
            input: function(that, field, isVisible) {
                return sprintf('<input type="text" class="form-control tablear-filter-control tablear-filter-control-%s" style="width: 100%; visibility: %s">', field, isVisible);
            },
            select: function(that, field, isVisible) {
                return sprintf('<select class="form-control tablear-filter-control-%s" style="width: 100%; visibility: %s" dir="%s"></select>',
                    field, isVisible, getDirectionOfSelectOptions(that.options.alignmentSelectControlOptions));
            },
            datepicker: function(that, field, isVisible) {
                return sprintf('<input type="text" class="form-control date-filter-control tablear-filter-control-%s" style="width: 100%; visibility: %s">', field, isVisible);
            }
        },
        //internal variables
        valuesShowFilter: []
    });

    $.extend($.fn.tablear.Constructor.columnDefaults, {
        showFilter: undefined,
        filterData: undefined,
        filterDatepickerOptions: undefined,
        filterStrictSearch: false,
        filterStartsWithSearch: false
    });

    $.extend($.fn.tablear.Constructor.EVENTS, {
        'column-search.bs.table': 'onColumnSearch'
    });

    $.extend($.fn.tablear.Constructor.defaults.css, {
        clearFilter: 'glyphicon-trash icon-clear'
    });

    $.extend($.fn.tablear.Constructor.locales, {
        formatClearFilters: function () {
            return 'Clear Filters';
        }
    });
    $.extend($.fn.tablear.Constructor.defaults, $.fn.tablear.Constructor.locales);

    var _init = $.fn.tablear.Constructor.prototype.init;
    $.fn.tablear.Constructor.prototype.init = function () {
        //Make sure that the showFilter option is set
        if(this.options.showFilter) {
            var that = this;

            // Compatibility: IE < 9 and old browsers
            if(!Object.keys) {
                objectKeys();
            }

            //Make sure that the internal variables are set correctly
            this.options.valuesShowFilter = [];

            this.$element.on('reset-view.bs.table', function () {
                //Create controls on $tableHeader if the height is set
                if(!that.options.height) {
                    return;
                }
                //Avoid recreate the controls
                if(that.$tableHeader.find('select').length > 0 || that.$tableHeader.find('input').length > 0) {
                    return;
                }
                createControls(that, that.$tableHeader);
            }).on('post-header.bs.table', function () {
                setValues(that);
            }).on('post-body.bs.table', function () {
                if(that.options.height) {
                    fixHeaderCSS(that);
                }
            }).on('column-switch.bs.table', function() {
                setValues(that);
            });
        }
        _init.apply(this, Array.prototype.slice.apply(arguments));
    };

    var _initExtensionsToolbar = $.fn.tablear.Constructor.prototype.initExtensionsToolbar;
    $.fn.tablear.Constructor.prototype.initExtensionsToolbar = function () {
        this.showToolbar = this.options.showFilter;
        _initExtensionsToolbar.apply(this, Array.prototype.slice.apply(arguments));
        if(this.options.showFilter) {
            var $btnGroup = this.$extensionsToolbar;
            var $btnClear = $btnGroup.find('.filter-show-clear');

            if(!$btnClear.length) {
                $btnClear = $([
                    '<div class="filter btn-group">',
                    '<button class="btn btn-default filter-show-clear" ',
                    sprintf('type="button" title="%s">', this.options.formatClearFilters()),
                    sprintf('<i class="%s %s"></i> ', this.options.css.icon, this.options.css.clearFilter),
                    '</button>',
                    '</div>'                    
                ].join('')).appendTo($btnGroup);

                $btnClear.off('click').on('click', $.proxy(this.clearShowFilter, this));
            }
        }
    };

    var _initHeader = $.fn.tablear.Constructor.prototype.initHeader;
    $.fn.tablear.Constructor.prototype.initHeader = function() {
        _initHeader.apply(this, Array.prototype.slice.apply(arguments));
        if(!this.options.showFilter) {
            return;
        }
        createControls(this, this.$header);
        initFilterSelectControls(this);
    };
    
    //call this on tablear("initFilterSelectControls") if you need to reset filtering manually
    $.fn.tablear.Constructor.prototype.initFilterSelectControls = function() {
    	initFilterSelectControls(this);
    }
    
    //override
    var _append = $.fn.tablear.Constructor.prototype.append;
    $.fn.tablear.Constructor.prototype.append = function() {
        _append.apply(this, Array.prototype.slice.apply(arguments));
        initFilterSelectControls(this);    	
    };
    var _clear = $.fn.tablear.Constructor.prototype.clear;
    $.fn.tablear.Constructor.prototype.clear = function() {
    	_clear.apply(this, Array.prototype.slice.apply(arguments));
    	initFilterSelectControls(this);
    };
    var _reload = $.fn.tablear.Constructor.prototype.reload;
    $.fn.tablear.Constructor.prototype.reload = function() {
    	_reload.apply(this, Array.prototype.slice.apply(arguments));
    	initFilterSelectControls(this);
    };
    var _remove = $.fn.tablear.Constructor.prototype.remove;
    $.fn.tablear.Constructor.prototype.remove = function() {
    	_remove.apply(this, Array.prototype.slice.apply(arguments));
    	initFilterSelectControls(this);
    };
    
    $.fn.tablear.Constructor.prototype.onColumnSearch = function(event) {
        var that = this;
        if($.inArray(event.keyCode, [37, 38, 39, 40]) > -1) {
            return;
        }
        copyValues(this);
        this.options.pageNumber = 1;
        this.current = 1;
        //executeSearch.call(this, $.trim($(event.currentTarget).val()));
        var column = this.getColumnById($(event.currentTarget).parents("th").data("columnId"));
        if(column) {
            column.filterValue = $.trim($(event.currentTarget).val());
        }
        loadData.call(this);
    };

    $.fn.tablear.Constructor.prototype.clearShowFilter = function() {
        if(this.options.showFilter) {
            var that = this;
            var cookies = collectBootstrapCookies();
            var header = getCurrentHeader(that);
            var table = header.closest('table');
            var controls = header.find(getCurrentSearchControls(that));
            var timeoutId = 0;

            $.each(that.options.valuesShowFilter, function(i, item) {
                item.value = '';
            });
            setValues(that);
            $.each(that.columns, function (i, column) {
                if(column.showFilter) {
                    column.filterValue = '';
                }
            });
 
            if(controls.length > 0) {
                $(controls[0]).trigger(controls[0].tagName === 'INPUT' ? 'keyup' : 'change');
            } else {
                return;
            }

            that.$actionBar.find('.search-field').val("");

            // use the default sort order if it exists. do nothing if it does not
            if(that.options.sortName !== table.data('sortName') || that.options.sortOrder !== table.data('sortOrder')) {
                var sorter = header.find(sprintf('[data-field="%s"]', $(controls[0]).closest('table').data('sortName')));
                if(sorter.length > 0) {
                    that.onSort(table.data('sortName'), table.data('sortName'));
                    $(sorter).find('.sortable').trigger('click');
                }
            }

            // clear cookies once the filters are clean
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function () {
                if(cookies && cookies.length > 0) {
                    $.each(cookies, function (i, item) {
                        if(that.deleteCookie !== undefined) {
                            that.deleteCookie(item);
                        }
                    });
                }
            }, that.options.searchTimeOut);
        }
    };
})(jQuery);