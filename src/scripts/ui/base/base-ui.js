/**
 *
 * User Interface widgets to be used to render surveys in readonly
 * mode. Make sure that Utils are loaded before and that ORSurveyMain is
 * defined in the global scope
 *
 * @author Manlio Barajas
 * @company OverResponse
 *
 */
import ORBaseUIStrings from './languages/en-us'

export default function(jQueryObject, utils) {

	// Assign the jQuery object
	var $ = jQueryObject;

	// Pointer to self
	var ui = this;

	// Items that may responde to hide event, neet to be notified
	$(window).on({
		'click.ORBaseUI': function(event) {
			// Avoid triggering the event from this classes
			if ($(event.target).closest('.uiDropDown, .ORLayoutLeft, .ORLayoutRight').length == 0) {
				$('.uiGeneric').trigger('ORHide');
			}
		}
	});

	this.base = function(options) {
		var base = this;
		var settings = $.extend({
			id : utils.randomId(),
			toolbarId : 'NotAvailable',
			container : undefined,
			label : '',
			suffix : '',
			description : 'Description of the command',
			command : 'javascript:void(0)',
			enabled : true,
			positionX : undefined,
			positionY : undefined,
			labelWidth : 0,
			width : 0,
			height : 0,
			layout : 'Bottom',
			'class' : undefined,
			events: {
				valueSet: function() {}
			}
		}, options);
		// Events will be stored in this variable
		this.events = settings.events;
		this.id = settings.id;

		var itemHTML = '';
		var item;

		itemHTML += '<div class="UiItem" id="' + settings.id + '">';
		if (settings.label != '')
			itemHTML += '<div class="Label">' + settings.label + '</div>';
		itemHTML += '<div class="ORInput"></div>';
		if (settings.suffix != '')
			itemHTML += '<div class="Suffix">' + settings.suffix + '</div>';
		itemHTML += '<div style="clear: both;"></div>';
		itemHTML += '</div>';

		if (settings.container != undefined)
			item = $(itemHTML).appendTo(settings.container);
		else
			item = $(itemHTML).appendTo('#' + settings.toolbarId + ' .Fields');

		if (settings['class'] != undefined) {
			item.addClass(settings['class']);
		}

		if (settings.labelWidth != 0)
			item.find('.Label').width(settings.labelWidth + "em");

		// Position
		if (settings.positionX != undefined || settings.positionY != undefined)
			item.css('position', 'absolute');
		if (settings.positionX != undefined)
			item.css('left', settings.positionX);
		if (settings.positionY != undefined)
			item.css('top', settings.positionY);

		this.item = item;

		this.getItemId = function() {
			return this.id;
		}

		this.getValue = function() {
			//utils.console({ text: "Base - Get Value Not implemented" });
			return 0;
		};

		this.setValue = function() {
			//utils.console({ text: "Base - Set Value Not implemented" });
		};

		this.reset = function() {
			utils.console({ text: "Base - Reset Not implemented" });
		};

		this.activate = function() {
			//utils.console({ text: "Base - Activate Not implemented" });
		};

		this.deactivate = function() {
			//utils.console({ text: "Base - Deactivate Not implemented" });
		};

		// Set the default value
		if (typeof settings.value != 'undefined') {
			this.setValue(settings.value, { skipEvents: true });
		}

	};

	this.tooltip = function(options) {
		var options = $.extend({
			container: $('body'),
			position: 'right',
			text: 'OverResponse Help Tooltip',
			monitorInput: false,
			offset: 3,
			delay: 500
		}, options);

		this.showTip = function(event) {
			var showPosition = {
				of: options.container
			};

			if (options.position != 'mouse') {
				switch (options.position) {
					case 'top':
						showPosition.my = 'center bottom';
						showPosition.at = 'center top';
						showPosition.offset = '0 -' + options.offset;
						break;
					case 'mouse':
						showPosition.my = 'center bottom';
						showPosition.at = 'center top';
						showPosition.offset = '0 -' + options.offset;
					default:
						showPosition.my = 'left center';
						showPosition.at = 'right center';
				}
				// Avoid tooltips to stay in incorrect positions because of container animations
				if (options.container.is('input')) {
					tooltip.tip.stop(true, true).show().position(showPosition).hide().fadeIn('normal');
				} else {
					options.container.queue(function(next){
						tooltip.tip.stop(true, true).delay(options.delay).queue(function(next) {
							$(this).show().position(showPosition).hide();
							next();
						}).fadeIn('normal');
						next();
					});
				}
			} else {
				tooltip.tip.stop(true, true).css({
					top: mousePosition.y,
					left: mousePosition.x
				}).fadeIn('normal');
			}
		};

		this.hideTip = function(event) {
			if (!options.monitorInput || options.monitorInput && !options.container.find('input').is(':focus'))
				tooltip.tip.stop(true, true).fadeOut('fast');
		};

		var tooltip = this;

		this.tipWrap = $('<div class="ORRespondant"></div>').appendTo('body');
		this.tip = $('<div class="ToolTip"></div>').appendTo(this.tipWrap);
		this.tipContent = $('<div class="TipContent">' + options.text + '</div>').appendTo(this.tip);

		if (options.container.is('input')) {
			// Case where tooltip will appear in a input element
			options.container.on({
				focus: tooltip.showTip,
				blur: tooltip.hideTip
			});
		} else {
			tooltip.tip.addClass('NoInput');
			options.container.on({
				mouseenter: tooltip.showTip,
				mouseleave: tooltip.hideTip
			});

			// When monitoring inputs inside container, attach effects
			if (options.monitorInput) {
				options.container.find('input').on({
					focus: tooltip.showTip,
					blur: tooltip.hideTip
				});
				$('body').on('click', tooltip.hideTip);
			}

			// Hide tip when user clicks it
			options.container.on('click', tooltip.hideTip)
		}

	};

	this.button = function(options) {
		$.extend(this, new ui.base(options));
		var settings = $.extend({
			id : 'NotAvailable',
			toolbarId : 'NotAvailable',
			title : '',
			text : '',
			description : 'Description of the command',
			command : function() {
			},
			href : '',
			enabled : true,
			horizontal : true,
			positionX : '5px',
			positionY : '10px',
			width : 0,
			height : 0,
			enableIcon: true,
			texturePositionX : 0,
			texturePositionY : 0
		}, options);

		var button = undefined;
		var buttonItem = this.item.find('.ORInput');
		var buttonEvents = {
			"click" : settings.command
		};

		this.setEnabled = function(enable) {
			button.find('.Icon').css('background-position', (settings.texturePositionX - ( enable ? 0 : 50)) + 'px ' + settings.texturePositionY + 'px');
			if (enable) {
				button.parent().on(buttonEvents);
        button.addClass('Enabled');
			} else {
				button.parent().off(buttonEvents);
        button.removeClass('Enabled');
			}
		};

		if(settings.title == '')
			settings.title = settings.text;

		var buttonHTML = '';
		buttonHTML += '<div class="" style="width: 100%; height: 100%;">';
		buttonHTML += '<a class="Button ' + (settings.enabled ? 'Enabled ' : '') +  (settings.horizontal == true ? 'Horizontal' : 'Vertical') + '" ' + (settings.href != '' ? 'href="' + settings.href  +'"' : '') + '>';

		if (settings.enableIcon)
			buttonHTML += '<div class="Icon ORFontIcon Iconset"></div>';

		if (settings.text != '')
			buttonHTML += '<div class="Label">' + settings.text + '</div>';

		buttonHTML += '</a></div>';

		button = $(buttonHTML).appendTo(buttonItem.addClass('ButtonItem'));

		if (settings.width !== 0)
			buttonItem.css('width', settings.width);
		if (settings.height !== 0)
			buttonItem.css('height', settings.height);

		// Background Icon
		// If item is not enabled, apply offset to texture
		button.find('.Icon').css('background-position', (settings.texturePositionX - (settings.enabled ? 0 : 50)) + 'px ' + settings.texturePositionY + 'px');

		// Events
		if(settings.enabled)
			button.parent().on(buttonEvents);

		button.find('.Button').css('width', '100%')
		if (settings.horizontal == false) {
			button.find('.Button').css('height', '100%')
		}
	};

	this.dropDown = function(options) {
		var currentItem = this;
		$.extend(this, new ui.base(options));

		var options = $.extend({
			defaultLabel: ORBaseUIStrings['DROPDOWN_NEW_OPTION']
		}, options);

		// Store for the current value of the dropdown
		this.value = '';
		// Internal variable to store the status of the dropdown
		this.collapsed = true;

		/** Appends new option to list **/
		this.createOption = function(options) {
			var settings = $.extend({
				label : ORBaseUIStrings['DROPDOWN_NEW_OPTION'],
				value : '',
				selected : false
			}, options);
			// Create and bind the event for inline editing. Also, enable row deletion
			var optionHTML = ''
				+ '<li class="Option">'
				+ '  <div class="OptionContent Rounded8px">'
				+ '    <div class="Legend">' + settings.label + '</div>'
				+ '  </div>'
				+ '</li>';
			return $(optionHTML).appendTo(this.optionsContainer.children('ul')).on({
				'click' : currentItem.optionClickEvent
			}).data({
				'label' : settings.label,
				'value' : settings.value
			});
		};

		this.reset = function() {
			currentItem.value = undefined;
			currentItem.currentContainer.children('.text').html(options.defaultLabel);
		};

		/** Select item **/
		this.optionClickEvent = function(event) {
			currentItem.setValue($(this).data('label'));
			// Collapse the dropdown
			currentItem.collapse();

			currentItem.events.valueSet({
				value: currentItem.value,
				caller: currentItem.currentContainer, // Used to indicate which UIItem is invoking caller
				relatedItemId: currentItem.getItemId() // The Id of the related item
			});

		};

		/** Set a value **/
		this.setValue = function(newValue) {
			currentItem.value = newValue;
			currentItem.currentContainer.children('.text').html(newValue);
		};

		/** Set a value **/
		this.getValue = function() {
			return currentItem.value;
		};

		/** Toggle the dropdown for selection **/
		this.activate = function() {
			currentItem.expand();
		};

		/** Toggle the dropdown for selection **/
		this.deactivate = function() {
			currentItem.collapse();
		};

		/** Show the dropdown **/
		this.expand = function() {

			currentItem.optionsContainer.css({
				top : container.height()
			});

			$(currentItem.currentContainer).addClass('selected');
			currentItem.optionsContainer.slideDown('fast');

			currentItem.collapsed = false;
		};

		/** Hide the dropdown **/
		this.collapse = function() {
			// Triggered manually to hide selectors
			$(currentItem.currentContainer).removeClass('selected');
			currentItem.optionsContainer.slideUp('fast');

			currentItem.collapsed = true;
		};

		this.toggleCollapse = function() {
			if (currentItem.collapsed)
				currentItem.expand();
			else
				currentItem.collapse();
		};

		var settings = $.extend({
			type : 'Notification',
			options : [{
				label : "Sample Option A",
				value : 0
			}, {
				label : "Sample Option B",
				value : 1
			}, {
				label : "Sample Option C",
				value : 2
			}],
			selectedOption : 0,
			onSelect : undefined,
			randomize: false,
			editOptions : {
				enableSorting : true
			}
		}, options);

		var target = this.item.children('.ORInput');
		// Main container for the Item
		var container = $('<div class="uiDropDown uiMultiOption uiGeneric"></div>').appendTo(target);
		this.currentContainer = container;

		// Label of dropdown
		$('<div class="text">' + options.defaultLabel + '</div>').appendTo(container);
		// Small arrow on the right of the dropdown
		$('<div class="arrow"></div>').appendTo(container);
		// Down list with options
		this.optionsContainer = $('<div class="Options"><ul></ul></div>').appendTo(container);
		this.optionsContainer.on({
			'click' : function(event) {
				event.stopPropagation();
			},
			'mousedown' : function(event) {
				event.stopPropagation();
			}
		});

		this.currentContainer.on('click', function(event) {
			// Show or hide the list with options
			currentItem.toggleCollapse();

			if (typeof options.events.activate != 'undefined') {
				options.events.activate(currentItem.currentContainer);
			}

			// Check binding on container click event
			// Example: selecting parent item on editor when clicking
			if (typeof options.containerClickCommand != 'undefined')
				options.containerClickCommand();

		}).on('ORHide', function(event) {
			currentItem.collapse();
		});

		// If option randomize is enabled, then Shaka shaka!
		if (settings.randomize) {
			utils.randomizeArray(settings.options);
		}

		// Insert all items
		$.each(settings.options, function(index, element) {
			currentItem.createOption({
				label : element.label,
				value : element.value
			});
		});

		container.on({
			'mouseenter' : function() {
				$(this).addClass('hover');
			},
			'mouseleave' : function() {
				$(this).removeClass('hover');
			}
		});

	};

	this.listChoice = function(options) {
		var currentItem = this;
		var options = $.extend({
			type: 'RadioText',
			randomize: false,
			multiSelect: false,
			other: {
				show: false
			}
		}, options);
		this.type = options.type;
		this.parentType = 'Radio';
		this.multiSelect = options.multiSelect;

		if (options.type.match(/List/i)) {
			this.parentType = 'List';
		} else if (options.type.match(/Binary/i)) {
			this.parentType = 'Binary';
		}

		$.extend(this, new ui.base(options));
		// Store for the current value of the dropdown
		this.value = '';

		/** Appends new option to list **/
		this.createOption = function(options) {
			var settings = $.extend({
				label : ORBaseUIStrings['DROPDOWN_NEW_OPTION'],
				value : '',
				extra : '',
				selected : false,
				other: {
					show: false
				}
			}, options);

			var optionCellLabel = '<div class="Legend">' + settings.label + '</div>';
			// Cell Label
			if (currentItem.type == 'RadioImage' || currentItem.type == 'ListImage') {
				optionCellLabel = ''
					+ '<div class="Image"><img src="' + settings.extra + '"></div>'
					+ optionCellLabel;
			} else if (currentItem.type == 'RadioVideo' || currentItem.type == 'ListVideo') {
				var videoIFrame = '';
				if (settings.extra[0] === 'YouTube') {
					videoIFrame = '<iframe width="320" height="180" src="http://www.youtube.com/embed/' + settings.extra[1] + '?rel=0" frameborder="0" allowfullscreen></iframe>';
				} else {
					videoIFrame = '<iframe src="http://player.vimeo.com/video/' + settings.extra[1] +'" width="320" height="180" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
				}
				optionCellLabel = ''
					+ '<div class="Video">' + videoIFrame + '</div>'
					+ optionCellLabel;
			}

			// Create and bind the event for inline editing. Also, enable row deletion
			var optionHTML = ''
				+ '<li class="Option ' + (settings.other.show ? ' Other' : '') + '">'
				+ '  <div class="OptionContent Rounded8px">'
				+ '    <div class="CellCheck"><div class="CheckMark ORFontIcon"></div></div>'
				+ '    <div class="CellLabel">' + optionCellLabel + '</div>'
				+ (settings.other.show ? '    <div class="OtherInput"></div>' : '')
				+ '  </div>'
				+ '</li>';

			// Get the last LI
			var lastListItem = this.optionsContainer.children('ul').children('li').last();

			// Check if it is the OtherOption
			var targetSpace = $(lastListItem).hasClass('OtherOption') ? lastListItem.prev() : lastListItem;
			var newOption =  (lastListItem.length > 0 ? $(optionHTML).insertAfter(targetSpace) : $(optionHTML).appendTo(this.optionsContainer.children('ul'))).on({
				'click' : currentItem.optionClickEvent
			}).data({
				'label' : settings.label,
				'value' : settings.value,
				'extra' : settings.extra
			});
			// Add the text field
			if (settings.other.show) {
				new ui.input({
					container: newOption.find('.OtherInput'),
					label: settings.other.hint
				});
			}
			return newOption;
		};

		/** Select item **/
		this.optionClickEvent = function(event) {
			// This avoids hiding the Dropdown when activating
			event.stopPropagation();

			if (options.multiSelect) {
				$(this).toggleClass('Selected');
			} else {
				currentItem.setValue($(this).data('label'));
				currentItem.optionsContainer.children('ul').children('li').not(this).removeClass('Selected');
				$(this).addClass('Selected');
			}

			var eventValue = currentItem.getValue();

			if (typeof currentItem.events.activate != 'undefined') {
				currentItem.events.activate(currentItem.currentContainer);
			}
			utils.console("currentItem.type " + currentItem.type);
			var listPattern = /^List/;
			currentItem.events.valueSet({
				value: eventValue,
				caller: currentItem.currentContainer, // Used to indicate which UIItem is invoking caller
				relatedItemId: currentItem.getItemId(),  // The Id of the related item
				remainInItem: listPattern.test(currentItem.type) && currentItem.type != 'ListCheck'
			});
		};

		/** Get the current value of the list **/
		this.getValue = function() {
			if (options.multiSelect && currentItem.type == 'ListCheck') {
				return currentItem.optionsContainer.children('ul').children().first().hasClass('Selected') ? 'On' : '';
			}
			var seletedValues = currentItem.optionsContainer.children('ul').children('li.Selected').get().map(function(element, index) {
				return $(element).find('.Legend').first().text();
			});
			return currentItem.multiSelect ? seletedValues : seletedValues.length == 0 ? '' : seletedValues[0];
		};

		/** Unselect all items **/
		this.reset = function() {
			currentItem.optionsContainer.children('ul').children('li').each(function() {
				$(this).removeClass('Selected');
			});
		};

		/** Set a value **/
		this.setValue = function(newValue) {
			currentItem.value = newValue;
			currentItem.currentContainer.children('.text').html(newValue);
		};

		/** Add or remove the Other field **/
		this.setOther = function(addOther) {
			// Create the OTHER field
			if (addOther && currentItem.parentType == 'Radio') {
				currentItem.createOption({
					label: options.other.label,
					other: options.other
				});
			}
		};

		var settings = $.extend({
			type : 'Notification',
			selectedOption : 0,
			onSelect : undefined
		}, options);


		var target = this.item.children('.ORInput');
		// Main container for the Item
		var container = $('<div class="uiRadioChoice uiMultiOption uiGeneric ui' + this.parentType + ' ui' + this.type + '"></div>').appendTo(target);
		this.currentContainer = container;

		// Radio list with options
		this.optionsContainer = $('<div class="Options ' + (options.showIcon == false ? 'IconLess' : '') + '"><ul></ul></div>').appendTo(container);

		// Populate for common binary templates
		if (this.parentType == 'Binary') {
			// By default, if item had another type, we will remove any existing option
			// (Currently, doing this avoids continously repeating items)
			settings.options = [];
			if (options.type == 'BinaryYesNo') {
				settings.options.push({
					label: '<div class="Icon ORFontIcon OptionYes"></div><div class="IconText">' + ORBaseUIStrings['BINARY_YES'] + '</div>',
					Value: 'Yes'
				});
				settings.options.push({
					label: '<div class="Icon ORFontIcon OptionNo"></div><div class="IconText">' + ORBaseUIStrings['BINARY_NO'] + '</div>',
					Value: 'No'
				});
			} else if (options.type == 'BinaryGender') {
				settings.options.push({
					label: '<div class="Icon ORFontIcon OptionFemale"></div><div class="IconText">' + ORBaseUIStrings['BINARY_FEMALE'] + '</div>',
					Value: 'Female'
				});
				settings.options.push({
					label: '<div class="Icon ORFontIcon OptionMale"></div><div class="IconText">' + ORBaseUIStrings['BINARY_MALE'] + '</div>',
					Value: 'Male'
				});
			} else if (options.type == 'BinaryTrueFalse') {
				settings.options.push({
					label: '<div class="Icon ORFontIcon OptionTrue"></div><div class="IconText">' + ORBaseUIStrings['BINARY_TRUE'] + '</div>',
					Value: 'True'
				});
				settings.options.push({
					label: '<div class="Icon ORFontIcon OptionFalse"></div><div class="IconText">' + ORBaseUIStrings['BINARY_FALSE'] + '</div>',
					Value: 'False'
				});
			}
		}

		// If option randomize is enabled, then Shaka shaka!
		if (settings.randomize) {
			utils.randomizeArray(settings.options);
		}

		// Insert all items
		$.each(settings.options, function(index, element) {
			currentItem.createOption({
				label : element.label,
				value : element.value,
				extra : element.extra
			});
		});

		this.setOther(options.other.show);

	};

	this.rank = function(options) {
		var rank = currentItem = this;
		var options = $.extend({
			type: 'RadioText',
			options: [],
			randomize: false,
			headerStyle: 'TwoLabels',
			headerLabels: '',
			headerCategory: ORBaseUIStrings['SORTRANK_HEADER'],
			levels: 5
		}, options);
		this.options = options;
		this.type = this.options.type;

		$.extend(this, new ui.base(options));
		// Store for the current value of the dropdown
		this.value = '';

		/** Appends new option to list **/
		this.createOption = function(options) {
			var settings = $.extend({
				label : ORBaseUIStrings['DROPDOWN_NEW_OPTION'],
				value : '',
				extra : '',
				selected : false
			}, options);

			var optionCellLabel = '<div class="Legend">' + settings.label + '</div>';
			// Cell Label
			// Note: This code was copied from listChoice
			// Note: In the future we may will want to keep Lists and Grouped List appart
			// TODO: Evaluate if, at the moment, better to integrate
			if (currentItem.type == 'RateRadioImage') {
				optionCellLabel = ''
					+ '<div class="Image"><img src="' + settings.extra + '"></div>'
					+ optionCellLabel;
			} else if (currentItem.type == 'RateRadioVideo') {
				var videoIFrame = '';
				if (settings.extra[0] === 'YouTube') {
					videoIFrame = '<iframe width="320" height="180" src="http://www.youtube.com/embed/' + settings.extra[1] + '?rel=0" frameborder="0" allowfullscreen></iframe>';
				} else {
					videoIFrame = '<iframe src="http://player.vimeo.com/video/' + settings.extra[1] +'" width="320" height="180" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
				}
				optionCellLabel = ''
					+ '<div class="Video">' + videoIFrame + '</div>'
					+ optionCellLabel;
			}

			// Create and bind the event for inline editing. Also, enable row deletion
			var optionHTML = ''
				+ '<li class="Option Content">'
				+ '  <div class="OptionContent Rounded8px">'
				+ '    <div class="CellLabel">' + optionCellLabel + '</div>'
				+ '    <div class="CellCheckGroup"><table><tr></tr></table></div>'
				+ '  </div>'
				+ '</li>';

			var optionList = $(optionHTML).appendTo(this.optionsContainer.children('ul')).data({
				'label' : settings.label,
				'value' : settings.value,
				'extra' : settings.extra
			});

			// Generate checkboxes array
			rank.setLevels(rank.options.levels, optionList);

			return optionList;
		};

		/**
		 * Allows changing the number of checkboxes per row
		 */
		this.setLevels = function(levels, optionList) {
			if (typeof optionList == 'undefined')
				optionList = rank.optionsContainer.children('ul').children('li:not(.Header)');

			$(optionList).each(function() {
				var rowContainer = $(this).find('.CellCheckGroup tr').empty();
				for (var i = 0; i < levels; ++i) {
					$('<td class="Rounded5px "><div class="CellCheck"><span class="CheckMark ORFontIcon"></span></div></td>').appendTo(rowContainer).on({
						'click' : rank.optionClickEvent
					});
				}
			});

			if (levels != rank.options.levels) {
				rank.options.levels = levels;
				// Refresh the header to style to adjust to the new number of levels
				rank.setHeaderStyle(rank.options.headerStyle);
			}

		};

		/**
		 * Set the layout of the heading row
		 */
		this.setHeaderStyle = function(selectedValue) {
			// Get a pointer to the heading row list element
			var heading = this.optionsContainer.children('ul').children('li').first();

			// To avoid erasing previous header content, check is style changes
			var styleChanged = selectedValue != rank.options.headerStyle;
			var rowContainer = heading.find('.CellHeadings tr');

			if (styleChanged || rowContainer.size() == 0) {
				rowContainer = $('<table><tr></tr></table>').appendTo(heading.find('.CellHeadings').empty()).find('tr');
				styleChanged = true;
			}

			// If the number of headears and columns are equal, then mark a flag
			var currentCells = rowContainer.children().size();
			rank.useHeaderAsLabels = rank.options.levels === currentCells;

			switch (selectedValue)
			{
				case 'EachCell':
				case 'OneToN':
					// Estimate difference between current cells and desired
					var cellDifference = currentCells - rank.options.levels;
					// When we are NOT inserting the item, add the ThreeLabels instead
					if (currentCells != 0 || rank.options.levels != 3) {
						// First, remove possible extra cells or add missing ones
						if (cellDifference > 0) {
							for (var i = 0; i < cellDifference; ++i) {
								rowContainer.children(':last').remove();
							}
						} else if (cellDifference < 0) {
							for (var i = 0; i < -cellDifference; ++i) {
								rowContainer.append('<td>' + (selectedValue != 'EachCell' ? (i + currentCells + 1) : '.') + '</td>');
							}
						}
						break;
					}
				case 'TwoLabels':
				case 'ThreeLabels':
					// Only apply if user changed the style
					if (styleChanged) {
						$('<td class="HeadingLeft">' + ORBaseUIStrings['SORTRANK_HEADER_GENERIC_LEFT'] + '</td>').appendTo(rowContainer);
						if (selectedValue == 'ThreeLabels' || selectedValue == 'EachCell')
							$('<td class="HeadingCenter">' + ORBaseUIStrings['SORTRANK_HEADER_GENERIC_CENTER'] + '</td>').appendTo(rowContainer);
						$('<td class="HeadingRight">' + ORBaseUIStrings['SORTRANK_HEADER_GENERIC_RIGHT'] + '</td>').appendTo(rowContainer);
					}
					break;
			}
			rank.options.headerStyle = selectedValue;
		};

		/**
		 * Set the content of the heading row
		 */
		this.setHeaderLabels = function(labels) {
			this.optionsContainer.children('ul').children('li').first().find('.CellHeadings').html(labels)
		};

		/**
		 * Set the content of the item category
		 */
		this.setHeaderCategory = function(label) {
			this.optionsContainer.children('ul').children('li').first().find('.CellLabel').html(label)
		};

		/**
		 * Returns object with the relevant object data for storing to db
		 */
		this.getRateData = function() {
			utils.console("Getting Rate data");
			return {
				levels: rank.options.levels,
				headerStyle: rank.options.headerStyle,
				headerLabels: this.optionsContainer.children('ul').children('li').first().find('.CellHeadings').html(),
				headerCategory: this.optionsContainer.children('ul').children('li').first().find('.CellLabel').html()
			}
		};

		/** Select item **/
		this.optionClickEvent = function(event) {
			$(this).closest('table').find('.CellCheck').removeClass('Selected');
			$(this).find('.CellCheck').addClass('Selected');

			// Set the value for a single option element
			var optionLabel = $(this).closest('.Option.Content').data('label');
			// Get the index of the selected value for the atribute
			var optionIndex = $(this).parent().find('.CellCheck').get().map(function() {
				return $(this).hasClass('Selected');
			}).get().indexOf(true) + 1;

			// Check is item has the same number of labels and colums. If so, update
			// option index with the column label
			if (rank.useHeaderAsLabels) {
				optionIndex = rank.optionsContainer.children('ul').children('li').first()
					.find('.CellHeadings tr > td').eq(optionIndex - 1).html();
			}

			// This fixes the problem that, since the first is this scroll and later the activation,
			// the item scroll was not being applied (first scrolling to next item, immediatly scrolling
			// to the clicked item
			event.stopPropagation();

			if (typeof currentItem.events.activate != 'undefined') {
				currentItem.events.activate(currentItem.currentContainer);
			}

			currentItem.events.valueSet({
				value: {
					label: optionLabel,
					index: optionIndex
				},
				caller: rank.currentContainer, // Used to indicate which UIItem is invoking caller
				relatedItemId: currentItem.getItemId(), // The Id of the related item
				remainInItem: !currentItem.hasValue()
			});
		};

		this.hasValue = function() {
			return rank.optionsContainer.children('ul').children('li').slice(1).find('.CellCheckGroup').filter(function() {
				return $(this).find('.Selected').size() > 0;
			}).size() == (rank.optionsContainer.children('ul').children('li').size() - 1);
		};

		/** Get the full value of the rank item, as an array **/
		this.getValue = function() {
			// First, get each of the options of the rank element
			utils.console("Getting rank value");
			var newValue = { };
			rank.optionsContainer.children('ul').children('li').slice(1).each(function(index) {
				newValue[$(this).data('label')] = $(this).find('.CellCheck').get().map(function() {
					return $(this).hasClass('Selected');
				}).get().indexOf(true);
			});
			return newValue;
		};

		/** Unselect all items **/
		this.reset = function() {
			rank.optionsContainer.children('ul').children('li').slice(1).each(function() {
				$(this).find('.CellCheck').removeClass('Selected');
			});
		};

		/** Set the full value of the rank item, as an array **/
		this.setValue = function(newValue) {
			rank.value = newValue;
		};

		var settings = $.extend({
			type : 'Notification',
			selectedOption : 0,
			onSelect : undefined
		}, options);

		var target = this.item.children('.ORInput');
		// Main container for the Item
		var container = $('<div class="uiRadioChoice uiMultiOption uiGeneric ui' + this.type + ' uiCellCheckGroup"></div>').appendTo(target);
		this.currentContainer = container;

		// Radio list with options
		this.optionsContainer = $('<div class="Options"><ul></ul></div>').appendTo(container);

		// Header row
		var headerHTML = ''
			+ '<li class="Option Header">'
			+ '  <div class="OptionContent Rounded8px">'
			+ '    <div class="CellLabel"></div>'
			+ '    <div class="CellHeadings"></div>'
			+ '    <div class="CellClose"></div>'
			+ '  </div>'
			+ '</li>';
		$(headerHTML).appendTo(this.optionsContainer.children('ul'));

		// If option randomize is enabled, then Shaka shaka!
		if (settings.randomize) {
			utils.randomizeArray(settings.options);
		}

		// Insert all items
		$.each(settings.options, function(index, element) {
			rank.createOption({
				label : element.label,
				value : element.value,
				extra : element.extra
			});
		});

		// Small hack to change the height of containing table
		this.optionsContainer.on({
			mouseenter: function() {
				// Each option may have a different height
				$(this).find('li').each(function() {
					// Get the height of the option
					var height = $(this).find('.OptionContent').innerHeight();
					// Select the table where boxes are, and apply the height
					$(this).find('table').css({
						height: height
					});
				});
			}
		});

		// Apply the corresponding header and labels
		this.setHeaderLabels(this.options.headerLabels);
		this.setHeaderCategory(this.options.headerCategory);
		this.setHeaderStyle(this.options.headerStyle);
	};

	this.selector = function(options) {
		$.extend(this, new ui.base(options));
		// To allow global access to current object
		var item = this.item;
		var selector = this;

		var settings = $.extend({
			id : 'NotAvailable',
			description : 'Description of the command',
			enabled : true,
			horizontal : true
		}, options);

		// Once item is created, var item is filled with self item object
		this.options = settings.options;
		// This variable will hold the current selected value
		this.selectedValue;

		this.setSelectedItem = function(value, options) {
			var changeOptions = $.extend({
				skipEvents: false
			}, options);

			for (var i = 0; i < this.options.length; ++i) {
				if (value == this.options[i].value) {
					item.find('.SelectedItem').text(this.options[i].label);
					selector.selectedValue = this.options[i].value;
					break;
				}
			}
			if (!changeOptions.skipEvents && typeof settings.command != 'undefined') {
				settings.command(value);
			}
		};

		this.loadData = function() {
			var dropdownList = item.find('.DropDownOptions ul');

			// Clear current list
			dropdownList.empty();

			// Insert all items
			for (var i = 0; i < selector.options.length; ++i) {
				var dropdownOption;
				var specialOption = false;
				if (typeof selector.options[i] !== "object") {
					selector.options[i] = {
						html: selector.options[i],
						label: selector.options[i],
						value: selector.options[i] };
				} else if (selector.options[i].value == 'SEPARATOR') {
					selector.options[i] = {
						html: '<div class="Separator Rounded5px">' + selector.options[i].label + '</div>',
						label: 'Separator',
						value: 0
					};
					specialOption = true;
				} else if (selector.options[i].value == undefined) {
					selector.options[i].value = selector.options[i].label;
				}
				dropdownOption = $('<li>' + selector.options[i].html + '</li>').data('value', selector.options[i].value).data('label', selector.options[i].label).appendTo(dropdownList);

				if (specialOption == false) {
					dropdownOption.on('click', function(event) {
						var selectedValue = $(this).data('value');
						selector.setSelectedItem(selectedValue);
						// Bind the provided command handler
						//if (typeof settings.command != 'undefined') {
						//	settings.command(selectedValue);
						//}
						item.find('.DropDownContainer').slideToggle('fast');
						event.stopPropagation();
					});
				} else {
					dropdownOption.addClass('Special');
				}
			}
		};

		this.getValue = function() {
			return selector.selectedValue;
		};

		this.setValue = function(newValue, options) {
			selector.setSelectedItem(newValue, options);
		};

		this.getLabel = function() {
			return item.find('.SelectedItem').first().text();
		};

		var itemHTML = '';
		itemHTML += '<div class="Selector"><table><tr>';

		itemHTML += '<td><div class="SelectedItem"></div></td>';

		itemHTML += '<td class="DropDownArrowCell"><div class="DropDownArrow Icon">';
		itemHTML += '</div></td>';

		itemHTML += '</tr></table></div>';
		// Closes Selector
		itemHTML += '<div class="DropDownContainer InputShadow"><div class="DropDownOptions Scrollable"><ul></ul></div></div>';

		item.addClass('SelectorItem').children('.ORInput').append(itemHTML);

		var dropDownContainer = item.find(".DropDownContainer");
		// Load DropDown data
		this.loadData();

		// Set selected input,
		if (this.options.length > 0) {
			if (settings.value != undefined) {
				this.setSelectedItem(settings.value, { skipEvents: true });
			} else {
				this.setSelectedItem(this.options[0].value, { skipEvents: true } );
			}
		}

		// Apply some options to dropdown
		item.find(".DropDownContainer").on({
			'click' : function(event) {
				event.stopPropagation()
			},
			'dblclick' : function(event) {
				event.stopPropagation()
			}
		});

		// Mouse events to display dropdown options
		item.find(".ORInput").on('click', function(event) {
			// Hide all containers, excluding current
			$('.DropDownContainer').not(item.find('.DropDownContainer')).slideUp('fast');
			item.find('.DropDownContainer').slideToggle('fast');
			event.stopPropagation();
		});

		// Set the default value
		if (typeof settings.value != 'undefined') {
			this.setValue(settings.value, { skipEvents: true });
		}

	};

	this.checkbox = function(options) {
		$.extend(this, new ui.base(options));
		var settings = $.extend({
			id: 'Unset',
			description: 'Description of the command',
			command: undefined,
			value: false
		}, options);

		var checkbox = this;
		var item = this.item;

		this.toggleSelection = function(event, data) {
			utils.console('Selecting box ' + settings.id);
			checkbox.setValue(!item.find('.BoxMark').hasClass('Selected'));
		};

		/** Uncheck box **/
		this.reset = function() {
			return item.find('.BoxMark').removeClass('Selected')
		};

		this.getValue = function() {
			return item.find('.BoxMark').hasClass('Selected')
		};

		this.setValue = function(newValue, options) {
			var changeOptions = $.extend({
				skipEvents: false
			}, options);

			var boxMark = item.find('.BoxMark');

			if (newValue)
				boxMark.addClass('Selected')
			else
				boxMark.removeClass('Selected')

			// Bind the provided command handler
			if (!changeOptions.skipEvents && typeof settings.command != 'undefined') {
				settings.command(checkbox.getValue());
			}

		};

		// Add the BooleanItem class, and remove the Input container
		item.addClass('BooleanItem').find('.ORInput').remove();
		// Insert checkbox mark before label
		item.prepend('<div class="BoxMark"><div class="CheckMark ORFontIcon"></div></div>');
		item.children().wrapAll('<div class="Checkbox" />');
		item.append('<div style="clear: both;" />');

		// Position
		if (typeof settings.positionY != 'undefined') {
			item.css({
				position : 'absolute',
				'left' : settings.positionX,
				'top' : settings.positionY
			});
		}
		// Event handler for click, to mark box
		item.on({
			click : this.toggleSelection
		});

	};

	this.label = function(options) {
		$.extend(this, new ui.base(options));
		var settings = $.extend({
			id : 'NotAvailable'
		}, options);

		// Remove input container
		this.item.addClass('LabelItem').children('.ORInput').remove();
	};

	this.input = function(options) {
		$.extend(this, new ui.base(options));
		var options = $.extend({
			id: utils.randomId(),
			size: '',
			defaultValue: '',
			placeholder: '',
			controlClass: '',
			description : 'Description of the command'
		}, options);
		var input = this;
		var item = this.item;
		this.defaultValue = options.defaultValue;

		// Event behaviors for default value
		this.defaultValueEvents = {
			focus: function() {
				// Direct access to avoid the input to report a "valid" value (empty, if this is true)
				if (item.children('.ORInput').children('.InputField').attr('value') == input.defaultValue) {
					input.setValue('');
				}
			},
			blur: function() {
				if (input.getValue() == '') {
					input.setValue(input.defaultValue);
				}
			}
		};

		this.getValue = function() {
			var inputValue = item.children('.ORInput').children('.InputField').val();
			if (inputValue != input.defaultValue)
				return inputValue;
			return '';
		};

		/** Clear or set default value textbox **/
		this.reset = function() {
			item.children('.ORInput').children('.InputField').val(input.defaultValue);
		};

		this.setValue = function(newValue, options) {
			var changeOptions = $.extend({
				skipEvents: false
			}, options);

			var field = item.children('.ORInput').children('.InputField');
			field.attr('value', newValue);
			// Check if value assigned is other than the default
			if (newValue != input.defaultValue) {
				field.addClass('HasValue');
			} else {
				field.removeClass('HasValue');
			}

			if (!changeOptions.skipEvents) {
				input.events.valueSet({
					value: newValue,
					caller: input.currentContainer, // Used to indicate which UIItem is invoking caller
					relatedItemId: input.getItemId() // The Id of the related item
				});
			}

			return item;
		};

		/**
		 * Allows setting a default value for input, such that it will remain
		 * unless user provides its own content
		 */
		this.setDefaultValue = function(newValue) {
			input.defaultValue = newValue;
			input.setValue(newValue);

			// If user provides empty default, then event should be removed
			if (newValue != '') {
				item.children('.ORInput').children('.InputField').on(input.defaultValueEvents);
			} else {
				item.children('.ORInput').children('.InputField').off(input.defaultValueEvents);
			}
		}

		// Add the InputItem class, and insert input text
		item.addClass('InputItem').children('.ORInput').append('<input class="InputField ' + options.controlClass + '" id="Text' + options.id + '" ' + (typeof options.placeholder != 'undefined' ? 'placeholder="' + options.placeholder + '" ' : '' ) + ' type="text" />');

		// Add the specified size
		item.addClass(options.size);

		// Apply default value helper
		if (this.defaultValue != '') {
			this.setDefaultValue(this.defaultValue);
		}

		// Bind the on change handler (so we can store the new value)
		item.children('.ORInput').children('.InputField').on({
			change: function() {
				input.setValue($(this).val());
			}
		});

		// Set the default value
		if (typeof options.value != 'undefined') {
			this.setValue(options.value, { skipEvents: true });
		}

	};

	this.textArea = function(options) {
		var options = $.extend({
			controlClass: '',
			placeholder: '',
			id: utils.randomId()
		}, options);
		var textarea = this;

		// The base item is the input
		$.extend(this, new ui.input(options));

		// Add the InputItem class, and insert input text
		this.item.removeClass('InputItem').addClass('TextAreaItem').children('.ORInput').empty().append('<textarea class="InputField ' + options.controlClass + '" id="TextArea' + options.id + '" placeholder="' + options.placeholder + '" />');

		// Bind the on change handler (so we can store the new value)
		this.item.find('textarea').on({
			change: function() {
				textarea.setValue($(this).val());
			}
		});

		/** Clear or set default value textbox **/
		this.reset = function() {
			textarea.item.find('textarea').attr('value', textarea.defaultValue);
		};

		// Apply default value helper
		if (this.defaultValue != '') {
			this.setDefaultValue(this.defaultValue);
		}
	};

	this.textEditor = function(options) {
		$.extend(this, new ui.base(options));
		var settings = $.extend({
			id : utils.randomId(),
			size: '',
			defaultValue: '',
			height: 120
		}, options);
		var item = this.item;
		var textEditor = this;
		this.defaultValue = settings.defaultValue;

		// Event behaviors for default value
		this.defaultValueEvents = {
			focus: function(event) {
				// Direct access to avoid the input to report a "valid" value (empty, if this is true)
				if (item.editor.instanceById('TextArea' + settings.id).getContent() == textEditor.defaultValue) {
					textEditor.setValue('');
				}
			},
			blur: function() {
				if (textEditor.getValue() == '') {
					textEditor.setValue(textEditor.defaultValue);
				}
			}
		};

		this.setDefaultValue = function(newValue) {
			textEditor.setValue(newValue);
			textEditor.defaultValue = newValue;

			// If user provides empty default, then event should be removed
			if (newValue != '') {
				item.find('.ORInput .nicEdit-main').on(textEditor.defaultValueEvents);
			} else {
				item.find('.ORInput .nicEdit-main').off(textEditor.defaultValueEvents);
			}
		}

		this.getValue = function() {
			var textEditorValue =  item.editor.instanceById('TextArea' + settings.id).getContent();
			if (textEditorValue != textEditor.defaultValue && textEditorValue != '<br>')
				return textEditorValue;
			return '';
		};

		this.setValue = function(newValue) {
			utils.console("textEditor - Setting value to " + newValue);
			return item.editor.instanceById('TextArea' + settings.id).setContent(newValue);
		};

		// Add the TextEditor class, and insert input text
		this.item.addClass('TextEditor').children('.ORInput').append('<textarea id="TextArea' + settings.id + '"></textarea>');
		// Add the specified size
		item.addClass(settings.size);

		$(function() {
			utils.console("textEditor - Creating");
			//var width = item.find('.ORInput').width();
			var width = '100%';
			item.editor = new nicEditor({
				height : settings.height,
				maxHeight : settings.height,
				iconsPath : '/scripts/nicedit/nicEditorIcons.gif'
			}).panelInstance('TextArea' + settings.id);

			// Add rounded corners
			utils.console("textEditor - Width is " + width);
			var editorElements = item.find('.ORInput').first().children();
			editorElements.eq(0).css('width', width);
			editorElements.eq(1).css('width', width);
			editorElements.eq(0).children().first().css('border-color', '').css('border-width', '').addClass('EditorToolbar');
			editorElements.eq(1).css('border-color', '').css('border-width', '').addClass('EditorArea');

			// Events, to highlight field when selected
			item.find('.ORInput .nicEdit-main').width(width).on({
				focus: function() {
					item.find('.ORInput').first().addClass('Selected')
				},
				blur: function() {
					item.find('.ORInput').first().removeClass('Selected')
				},
				mousedown: utils.stopPropagation, // This should be used only if a parent is draggable
				click: utils.documentClick
			});

			// Apply default value helper
			if (textEditor.defaultValue != '') {
				utils.console("textEditor - Setting balue " + textEditor.defaultValue);
				textEditor.setDefaultValue(textEditor.defaultValue);
			}
		});
	};

	this.spinner = function(options) {
		$.extend(this, new ui.base(options));
		var settings = $.extend({
			id : 'NotAvailable',
			displayTime : false,
			maxValue : undefined,
			minValue : undefined,
			increment : 1,
			fastIncrement : 5,
			value : 0,
			zeroIsUnlimeted : true,
			repeatDelay : 200,
			format : 'numeric',
			zeroLabel : ORBaseUIStrings['UNLIMITED']
		}, options);
		var item = this.item;
		var spinner = this;
		this.value = settings.value;
		this.currentIntervalIncrement = 0;
		this.currentIntervalDecrement = 0;

		this.incrementHandler = function(event, data) {
			spinner.changeValue(settings.increment);
		};

		this.incrementPressedHandler = function(event, data) {
			spinner.currentIntervalIncrement = setInterval(function(){
				spinner.changeValue(settings.fastIncrement * settings.increment);
				}, settings.repeatDelay);
		};

		this.incrementReleasedHandler = function() {
			clearInterval(spinner.currentIntervalIncrement);
		};

		this.decrementHandler = function(event, data) {
			spinner.changeValue(-settings.increment);
		};

		this.decrementPressedHandler = function(event, data) {
			spinner.currentIntervalDecrement = setInterval(function(){
				spinner.changeValue(-settings.fastIncrement * settings.increment);
				}, settings.repeatDelay);
		};

		this.decrementReleasedHandler = function() {
			clearInterval(spinner.currentIntervalDecrement);
		};

		this.wheelHanlder = function(event, delta) {
			spinner.changeValue(settings.increment * delta);
			return false;
		};

		this.changeValue = function(delta) {
			var currentValue = spinner.getInputValue();
			var newValue = currentValue + delta;
			// Validate min value
			if (settings.minValue != undefined) {
				if (newValue < settings.minValue)
					newValue = settings.minValue;
			}
			// Validate max value
			if (settings.maxValue != undefined) {
				if (newValue > settings.maxValue)
					newValue = settings.maxValue;
			}
			spinner.setValue(newValue);
		};

		this.getInputValue = function() {
			var input = item.find('input');
			var currentLegend = input.attr('value');
			// Spinner may have the unlimited legend
			if (currentLegend == settings.zeroLabel) {
				return currentValue = 0;
			} else if (settings.format == 'time') {
				var time = currentLegend.split(/\:/);
				var hours = Number(time[0]);
				var minutes = Number(time[1]);
				var seconds = Number(time[2]);
				utils.console('Time stepper:  ' + hours + '_' + minutes + '_' + seconds);
				return 3600 * hours + 60 * minutes + seconds;
			} else {
				return parseInt(currentLegend);
			}
		}

		this.setValue = function(value, options) {
			var changeOptions = $.extend({
				skipEvents: false
			}, options);
			var newLegend;
			if (value == 0 && settings.zeroIsUnlimeted) {
				newLegend = settings.zeroLabel;
			} else {
				if (settings.format == 'time') {
					var hours = parseInt(value / 3600);
					var minutes = parseInt(value / 60) % 60;
					var seconds = value % 60;
					newLegend =  hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
					utils.console('Current val ' + value);
				} else {
					newLegend = value;
				}
			}
			item.find('input').attr('value', newLegend);

			if (!changeOptions.skipEvents) {
				item.find('input').trigger('change');

				// Call the provided command handler
				if (typeof settings.command != 'undefined') {
					settings.command(value);
				}
			}

			return spinner;
		};

		this.getValue = function() {
			return spinner.getInputValue();
		};

		item.addClass('Spinner').find('.ORInput').append('<table><tr><td class="Less"><div class="Icon"></div></td><td class="Field"><div><input type="text" /></div></td><td class="More"><div class="Icon"></div></td></tr></table>');
		// Add class to identify when user focus the field
		item.find('input').on({
			click: function(event) {
				$(this).select();
				},
			focus: function(event) {
				item.find('.ORInput .Field div').addClass('Selected');
				},
			blur: function(event) {
				item.find('.ORInput .Field div').removeClass('Selected');
				}
		});
		// Events for arrows
		item.find('.ORInput .Less').on({
			click : this.decrementHandler,
			mousedown : this.decrementPressedHandler,
			mouseup : this.decrementReleasedHandler,
			mouseleave : this.decrementReleasedHandler
		});
		item.find('.ORInput .More').on({
			click : this.incrementHandler			,
			mousedown : this.incrementPressedHandler,
			mouseup : this.incrementReleasedHandler,
			mouseleave : this.incrementReleasedHandler
		});
		item.find('.ORInput').on('mousewheel', this.wheelHanlder);
		// Set current value
		this.setValue(this.value, { skipEvents: true });
	};

	this.dateTime = function(options) {
		$.extend(this, new ui.input(options));
		var settings = $.extend({
			id : 'NotAvailable',
			displayTime : false,
			controlClass: ''
		}, options);
		var item = this.item;

		item.addClass('DateTimeSelector').find('.ORInput').append('<input type="text" class="' + settings.controlClass + '" id="Time' + settings.id + '" />');
		// Add class to identify when using datetime or just date
		item.find('.ORInput').addClass('DateTime');
		var dateField = item.find('.ORInput').children('input').eq(0).addClass('DateField');
		var timeField = item.find('.ORInput').children('input').eq(1).addClass('TimeField');

		$(function() {
			dateField.datepicker({
				showAnim : 'slideDown',
				duration : 200
			});
			timeField.timepicker({
				showAnim : 'slideDown',
				duration : 200,
				defaultTime: '00:00'
			});
		});

		this.getValue = function() {
			if (dateField.datepicker('getDate')) {
				var date = dateField.datepicker('getDate');
				date.setHours(timeField.timepicker('getHour'));
				date.setMinutes(timeField.timepicker('getMinute'));
				return date.toString();
			}
			return undefined;
		};

		/**
		 *
		 * Note that we assume time is already un UTC format, so
		 * no kind of operations are done
		 *
		 */
		this.setValue = function(newValue) {
			if (newValue) {
				var date = new Date(newValue);
				dateField.datepicker('setDate', date);
				timeField.timepicker('setTime', date.getHours() + ':' + date.getMinutes());
			}
		};
	};

}
