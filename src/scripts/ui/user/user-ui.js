
// TODO: Get hashes directly from the server
import ORBaseUIStrings from './../base/languages/en-us'
import ORUserUIStrings from './languages/en-us'
import ORBaseUI from './../base/base-ui'
import editorStrings from './languages/en-us'
import {
	surveyStatusOptions,
	deliveryStrategyOptions,
	scrollingOptions,
	surveyThemeOptions,
	surveyTemplateOptions
} from './options'

export default function(jQueryObject, utils) {

	// Assign the jQuery object
	var $ = jQueryObject;

	// Extend base UI
	$.extend(this, new ORBaseUI($, utils));

	var ui = this;

	// Indicate we are using the editor
	$(window).off('click.ORBaseUI');

	// Flag to indicate whether DOM has been loaded
	var domReady = false;
	$(function() {
		domReady = true;
	});

	// Local store for current mouse position (for tooltip)
	var mousePosition = {x: 0, y: 0};
	$(window).on({
		'click': function() {
			// Events for unfocusing items
			$('.DropDownContainer').slideUp('fast');
		},
		'mousemove': function(event) {
			mousePosition = {
				x: event.pageX,
				y: event.pageY
			};
		},
		'scroll': function(event) {
			$('.ToolTip').stop(true, true).fadeOut('fast');
		}
	});
	// Two editor instances, for each toolbar
	var inlineEditor;
	var inlineEditorFull;
	// This queues store inline editors to add
	var inlineEditorQueue = [];
	var inlineEditorFullQueue = [];

	this.toolbarGroup = function(options) {
		var settings = $.extend({
			id : 'unset',
			color : '#990000',
			title : 'Toolbar',
			width : '20%',
			visible : true
		}, options);
		var toolbarId = settings.id;
		$('<div class="Container"><div class="Group" id="' + toolbarId + '"></div></div>').appendTo('#SurveyEditorToolbar');
		$('#' + toolbarId).parent().width(settings.width);
		$('<div class="Title"><span>' + settings.title + '</span></div>').appendTo('#' + toolbarId);
		$('<div class="Fields"></div>').appendTo('#' + toolbarId);
		if(!settings.visible)
			$('#' + toolbarId).hide();
	};

	this.toolbar = function(options) {
		var settings = $.extend({
			color : '#990000',
			scrollable : true
		}, options);

		// Set survey editor toolbar fixed when moved
		if ($('#SurveyEditorToolbar').size() > 0) {
			$('#SurveyEditorToolbar').css('width', $('#SurveyEditorToolbar').width());
			$(window).scroll(function() {
				var toolbar = $('#SurveyEditorToolbar');
				// TODO: Find a reliable way to remove scroll watcher when Angular controller
				// is unloaded
				if (toolbar.size() > 0) {
					var offset = toolbar.parent().position().top;
					if ($(window).scrollTop() > offset && toolbar.css('position') != 'fixed') {
						toolbar.addClass('Floated');
					} else if($(window).scrollTop() <= toolbar.parent().position().top) {
						toolbar.removeClass('Floated');
					}
				}
			});
		}
	};

	/**
	 *
	 * Allows user to edit directly DIV data, with NiceEdit
	 *
	 */
	this.inlineEdit = function(options) {
		// Take as base label
		$.extend(this, new ui.label(options));
		var itemId = 'Inline' + utils.randomId();
		this.item.children('.Label').attr('id', itemId);

		ui.floatedEditor({
			id: itemId,
			htmlMode: false
		});

		this.item.children('.Label').on({
			click: function(event) {

        // If text is yet the default, click should select all text
        if ($(this).html() == editorStrings['LABEL_DEFAULT']) {
          $(this).selText();
        }

				$('#InlineEditPanel').show().position({
					my: 'left bottom',
					at: 'left top',
					offset: '-15px -5px',
					of: $(this)
				});
			},
			blur: function() {
				$('#InlineEditPanel').hide();
			},
			mousedown: utils.stopPropagation,
			mousemove: utils.stopPropagation,
			mouseup: utils.stopPropagation
		});

		// Later elements are used to avoid draggable behavior


	};

	this.floatedEditor = function(options) {
		var options = $.extend({
			id: 'Unset',
			htmlMode: false,
			events: {
				change: function() {},
				beforeChange: function() {}
			}
		}, options)
		var instanceId = options.id;

		var editorConfigText = {
			buttonList: ['bold','italic','underline','left','center','right','justify','fontSize','fontFamily','fontFormat','forecolor','bgcolor']
		};
		var editorConfigHTML = {
			fullPanel: true
		};

		// If inline edit has not been loaded before, set it
		this.loadInlinePanel = function() {
			utils.console('loadInlinePanel ' + $('#InlineEditPanel').size());
			if ($('#InlineEditPanel').size() == 0) {
				var inlineEditorContent, inlineEditorFullContent;
				inlineEditor = new nicEditor(editorConfigText);
				inlineEditorFull = new nicEditor(editorConfigHTML);

				$('<div id="InlineEditPanel" style="width: 470px;"></div>').appendTo('body');
				$('<div id="InlineEditPanelFull" style="width: 470px;"></div>').appendTo('body');

				inlineEditor.setPanel('InlineEditPanel');
				inlineEditorFull.setPanel('InlineEditPanelFull');

				inlineEditor.addEvent('focus', function() {
					ui.floatedEditor.inlineEditorContent = inlineEditor.selectedInstance.getContent();
					utils.console("EDITOR - events.beforeChange() - " +  (options.events.beforeChange));
					options.events.beforeChange();
				});
				inlineEditor.addEvent('blur', function() {
					ui.floatedEditor.onChange(options.events.change);
				});

				// Rounded corners and shadow
				$("#InlineEditPanel, #InlineEditPanelFull").children().css({
					'-moz-border-radius': '5px',
					'-webkit-border-radius': '5px',
					'border-radius': '5px',
					'-moz-box-shadow': '0px 0px 2px 2px #999',
					'-webkit-box-shadow': '0px 0px 2px 2px #999',
					'box-shadow': '0px 0px 2px 2px #999'
				})

				// Load instances in queue
				var editorEvents = {
					mousedown: utils.stopPropagation,
					mousemove: utils.stopPropagation,
					mouseup: utils.stopPropagation
				};

				$.each(inlineEditorQueue, function() {
					inlineEditor.addInstance(this);
					$("#" + this).on(editorEvents);
				});
				$.each(inlineEditorFullQueue, function() {
					inlineEditorFull.addInstance(this);
					$("#" + this).on(editorEvents);
				});

				// Hide when clicking almost anywhere (except in self)
				$(document).on({
					click: function() {
						if ($('.nicEdit-selected').size() == 0) {
							ui.floatedEditor.hide();
						}
					}
				});
			}
		};

		runOrWhenDOMReady(this.loadInlinePanel);

		if (domReady) {
			if (!options.htmlMode)
				inlineEditor.addInstance(instanceId);
			else
				inlineEditorFull.addInstance(instanceId);

			$("#" + instanceId).on({
				mousedown: utils.stopPropagation,
				mousemove: utils.stopPropagation,
				mouseup: utils.stopPropagation
			});
		} else {
			if (!options.htmlMode)
				inlineEditorQueue.push(instanceId)
			else
				inlineEditorFullQueue.push(instanceId)
		}

	};

	/**
	 *
	 * Async = true will force the execute the blur functionality inline. This is
	 * required by the beforeDrag (onmousedown) functionality of the list choices,
	 * since be need this operation to be completed. Also, the
	 * change handler must be provided
	 *
	 */
	this.floatedEditor.hide = function(async, changeEvent) {
		$('#InlineEditPanel, #InlineEditPanelFull').hide();
		if (typeof async == 'undefined' || async === true) {
			$('.LabelItem .Label, .CellLabel .Legend').blur();
		} else {
      utils.console("Manual inline hide event");
			ui.floatedEditor.onChange(changeEvent);
		}
	};

	/**
	 *
	 * This handler may be called outside from the scope of the floated editor.
	 * (see floatedEditor.hide). This will check that a change has happened in the text
	 *
	 */
	this.floatedEditor.onChange = function(changeEvent) {
		var inlineEditorContent = ui.floatedEditor.inlineEditorContent;
		if (typeof inlineEditorContent != 'undefined' && typeof inlineEditor.selectedInstance != 'undefined' && inlineEditor.selectedInstance != null && inlineEditorContent !== inlineEditor.selectedInstance.getContent()) {
      utils.console("EDITOR - events.change() - " + (changeEvent));
			ui.floatedEditor.inlineEditorContent = inlineEditor.selectedInstance.getContent();
			changeEvent();
		}
	};

	/**
	 * Common methods for editable choice items: Dropdown, Radios and Lists
	 */
	this.choiceEditable = function(options) {
		var options = $.extend({
			events: {}
		}, options);
		var currentItem = this;
		// Used as handler for the before dragging an option
		var mouseDownForOption = function() {
			// Hide first the editor (this will trigger the addUndo trigger)
      utils.console("Hiding floated editor");
			ui.floatedEditor.hide(false, options.events.sortComplete);
			// Call the beforeChange to save the current state
			if (typeof options.events.beforeChange != 'undefined') {
        utils.console("Triggering before change");
				options.events.beforeChange();
			}
		}

		/** Handle to the delete button for each option **/
		this.deleteOption = function(event) {
			// Call the handler for the Change event
			if (typeof options.events.update != 'undefined') {
				options.events.update();
			}
			$(this).closest('li').empty().remove();
			// We should avoid click to continue since we could end up
			// selecting wronly and item
			event.stopPropagation();
		};

    /** Handles click of the AddOption button **/
    this.addOption = function(event) {
      if (typeof options.events.addOption != 'undefined') {
        options.events.addOption();
      }
      currentItem.convertOptionToEditableOption(currentItem.createOption());
    };

		/** Override to disable click selection **/
		this.optionClickEvent = function(event) {
		};

		/** Add or remove the Other field **/
		this.setOther = function(addOther) {
			// Create the OTHER field
			if (addOther && currentItem.parentType == 'Radio') {
				currentItem.convertOptionToEditableOption(currentItem.createOption({
					label: options.other.label,
					other: options.other
				}));
			} else {
				currentItem.optionsContainer.children('ul').children('li.Option.Other').remove();
			}
		};

		this.convertOptionToEditableOption = function(option) {
			$(option).unbind('click').on('click', this.optionClickEvent)
				.find('.Legend').empty()
				.prepend($(option).data('label'));

			// If type is image, add the corresponding upload elements
			if (options.type == 'RadioImage' || options.type == 'ListImage' || options.type == 'RateRadioImage') {
				$(option).children('.OptionContent').children('.CellLabel').addClass('Rounded3px').addClass('RadioImageElement').addClass('RadioMediaElement')
					.empty().append('<div class="Image"></div><div class="Legend">' + ($(option).data('label') || ORBaseUIStrings['DROPDOWN_NEW_OPTION']) + '</div>');

				// Create the uploader
				new ui.imageUploader({
					container: $(option).children('.OptionContent').children('.CellLabel').children('.Image'),
					image: $(option).data('extra')
				})
			} else if (options.type == 'RadioVideo' || options.type == 'ListVideo' || options.type == 'RateRadioVideo') {
				$(option).children('.OptionContent').children('.CellLabel').addClass('Rounded3px').addClass('RadioVideoElement').addClass('RadioMediaElement')
					.empty().append('<div class="Video"></div><div class="Legend">' + ($(option).data('label') || ORBaseUIStrings['DROPDOWN_NEW_OPTION']) + '</div>');

				new ui.videoUploader({
					container: $(option).children('.OptionContent').children('.CellLabel').children('.Video'),
					video: $(option).data('extra')
				})
			}

			// Add and bind the delete event
			$('<div class="CellClose"><div class="Close"></div></div>').appendTo($(option).children('.OptionContent')).on({
				'click' : currentItem.deleteOption
			});

			// Since this will called usually before dragging an option, record the current state for undo
			$(option).on({
				mousedown: mouseDownForOption
			});

			$(option).find('.Legend, .OtherInput .Label').each(function() {
				var newId = utils.randomId();
				$(this).attr('id', newId);
				ui.floatedEditor({
					id: newId,
					htmlMode: options.type == 'RadioHTML' || options.type == 'ListHTML' || options.type == 'RateRadioHTML'
				});
				$(this).on({
          keypress: function(event) {
            if (event.keyCode == 13) {
              // When user presses enter, new behaviour is to add a new option
              currentItem.addOption();
              // And focus in the new option
              currentItem.optionsContainer.children('ul').children('li').find('.Legend, .OtherInput .Label').click();
              // Finally, stop propagation to avoid the input to add linebreaks
              event.preventDefault();
            }
          },
					click: function() {
						var elementToHide, elementToShow;
						if (options.type != 'RadioHTML' && options.type != 'ListHTML' && options.type != 'RateRadioHTML') {
							elementToHide = '#InlineEditPanelFull';
							elementToShow = '#InlineEditPanel';
						} else {
							elementToHide = '#InlineEditPanel';
							elementToShow = '#InlineEditPanelFull';
						}
						// Setup the NiceEdit
						$(elementToHide).hide();
						$(elementToShow).show().position({
							my: 'left bottom',
							at: 'left top',
							offset: '-15px -8px',
							of: $(this).closest('ul')
						});
						// If text is yet the default, click should select all text
						if ($(this).html() == ORBaseUIStrings['DROPDOWN_NEW_OPTION']) {
							$(this).selText();
						}
					}
				});
			});
		};

		this.makeEditable = function() {
			// Rebind on click event. Convert each option to editable format
			this.optionsContainer.children('ul').children('li').not('.Header').each(function() {
				currentItem.convertOptionToEditableOption(this);
			});

			// For items with header, convert to editable
			this.optionsContainer.children('ul').children('li.Header').children('.OptionContent').each(function() {
				var newId = utils.randomId();
				$(this).attr('id', newId);
				ui.floatedEditor({
					id: newId,
					htmlMode: false
				});

				$(this).on({
					click: function() {
						var elementToHide, elementToShow;
						elementToHide = '#InlineEditPanelFull';
						elementToShow = '#InlineEditPanel';
						// Setup the NiceEdit
						$(elementToHide).hide();
						$(elementToShow).show().position({
							my: 'left bottom',
							at: 'left top',
							offset: '-15px -8px',
							of: $(this).closest('ul')
						});
					}
				});
			});

			// Enable Sorting and
			this.optionsContainer.children('ul').sortable({
				distance: 5,
				items: "li:not(.Other)",
				update: options.events.sortComplete
			});
			// Since .live method is no longer recommended, we will add this handler
			// usually used when starting to drag elements, so we can appy undo
			this.optionsContainer.children('ul').children('li:not(.Other)').on({
				mousedown: mouseDownForOption
			});

			// Check for edit Options
			var commandBar = $('<div class="OptionCommands">'
				+ '<a class="SortAsc"><div>&nbsp;</div></a> '
				+ '<a class="SortDesc"><div>&nbsp;</div></a> &nbsp;&nbsp;&nbsp;&nbsp;'
				+ '<a class="Add"><div>' + ORBaseUIStrings['DROPDOWN_ADD_OPTION'] + '</div></a> '
				+ '</div>').appendTo(this.optionsContainer);

			// Sort used for list elements of list
			var sortFunction = function(event) {
				// Call the handler for the Change event
				options.events.update();
				// The use of not is because Rate items which may have a heading row li
				var sortedList = currentItem.currentContainer.find('.Option:not(.Header, .Other)').sort(function(a, b) {
					// Please note this parameter must be provided to sort in direction ascending
					if (event.data.ascending === true)
						return ($(b).text()) < ($(a).text()) ? 1 : -1;
					return ($(b).text()) > ($(a).text()) ? 1 : -1;
				});

				// In the case there is option Other, insert ordered list before it
				var otherOption = currentItem.currentContainer.find('.Option.Other');
				if (otherOption.size()) {
					sortedList.insertBefore(otherOption);
				} else {
					sortedList.appendTo(currentItem.currentContainer.find('ul'));
				}
			};
			commandBar.find('.SortAsc').on('click', { ascending: true }, sortFunction);
			commandBar.find('.SortDesc').on('click', { ascending: false }, sortFunction);
			commandBar.find('.Add').on('click', this.addOption);
		};

	};

	this.listChoiceEditable = function(options) {
		$.extend(this, new ui.listChoice(options));
		this.addEditableOptions = ui.choiceEditable;
		this.addEditableOptions(options);
		this.makeEditable();
	}

	this.dropDownEditable = function(options) {
		$.extend(this, new ui.dropDown(options));
		this.addEditableOptions = ui.choiceEditable;
		this.addEditableOptions(options);
		this.makeEditable();
	};

	/**
	 * This item type support edition for 3 different types of
	 * open ended question. The main adition with respect to standard
	 * ui elements is the adequate selection of input, and default
	 * text during edition
	 */
	this.openEndedEditable = function(options) {
		var options = $.extend({
			type: 'OpenSingleLine'
		}, options);

		var baseObject;
		var baseSettings;
		switch (options.type) {
			case 'OpenRichText':
			case 'OpenMultipleLine':
			default:
				baseSettings = {
					container: options.container,
					size: options.open.size,
					defaultValue: options.defaultText // System default value
				};

				if (options.type == 'OpenMultipleLine') {
					baseObject = new ui.textArea(baseSettings);
				} else if (options.type == 'OpenRichText') {
					baseObject = new ui.textEditor(baseSettings);
				} else {
					baseObject = new ui.input(baseSettings);
				}
		}
		// Extend properties and functions from the base UI element
		// Such as GetValue()
		$.extend(this, baseObject);

		// Place user's default text (validate that it is not empty, since it will cause)
		// replacing system's default
		if (options.open.defaultText != '')
			this.setValue(options.open.defaultText);
	};

	/**
	 * Has two modalities. The fist, rows of radios are used to grade
	 * an attribute. Then, is the 'distinct' flag is on, value must be unique
	 */
	this.rankEditable = function(options) {
		var rankEditable = this;
		var options = $.extend({
			htmlMode: false,
			options: [],
			levels: 5
		}, options);

		$.extend(this, new ui.rank({
			options: options.options,
			container: options.container,
			type: options.type,
			levels: options.levels,
			headerStyle: options.headerStyle,
			headerLabels: options.headerLabels,
			headerCategory: options.headerCategory
		}));
		this.addEditableOptions = ui.choiceEditable;
		this.addEditableOptions(options);
		this.makeEditable();

	};

	/**
	 * Allows user to select a video from VIMEO or YOUTUBE
	 * Only the video id is stored
	 */
	this.videoUploader = function(options) {
		var videoUploader = this;
		var options = $.extend({
			container: $('body'),
			video: ''
		}, options);

		/** Process current URL to show video preview **/
		this.processVideoURL = function() {
			var value = videoUploader.inputField.getValue();
			var videoId;
			var videoHost;
			if (value.match(/youtube.com/i)) {
				videoId = value.match(/v=([^\&]+)/i);
				videoHost = 'YouTube';
			} else if (value.match(/vimeo.com/i)) {
				videoId = value.match(/vimeo.com\/([^\&\?\/]+)/i)
				videoHost = 'Vimeo';
			}
			if (videoId) {
				videoId = videoId[1];
        utils.console("Video source " + videoHost + " / id " + videoId);
				// Launch video preview
				videoUploader.previewVideo(videoHost, videoId);
			}
		};

		/** Show the video preview **/
		this.previewVideo = function(host, id) {
			var videoIFrame = '';
			if (host === 'YouTube') {
				videoIFrame = '<iframe width="320" height="180" src="http://www.youtube.com/embed/' + id + '?rel=0" frameborder="0" allowfullscreen></iframe>';
			} else {
				videoIFrame = '<iframe src="http://player.vimeo.com/video/' + id +'" width="320" height="180" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
			}
			// Attach data to container
			videoUploader.inputForm.filter('.VideoPreview').empty().show().append(videoIFrame).parent().data({
				host: host,
				id: id
			});
		};

		var inputField = ''
			+ '<div class="VideoInput">'
			+ '</div>'
			+ '<div class="VideoPreview">'
			+ '</div>';

		this.inputForm = $(inputField).appendTo(options.container);
		this.inputField = new ui.input({
			container: this.inputForm.filter('.VideoInput'),
			label: ORUserUIStrings['VIDEO_URL'] + ':'
		});
		this.inputField.setValue('http://');

		// Check is video data is present (edit mode)
		if (options.video !== '') {
			this.previewVideo(options.video[0], options.video[1]);
			if (options.video[0] == 'YouTube') {
				this.inputField.setValue('http://www.youtube.com/?v=' + options.video[1]);
			} else {
				this.inputField.setValue('http://www.vimeo.com/' + options.video[1]);
			}
		}

		// Bind the keypress event, for later extracting video id
		$(this.inputField.field).on({
			keyup: function() {
				videoUploader.processVideoURL();
			}
		});
	}

	/**
	 * Allows uploading content to image hosting provider
	 */
	this.imageUploader = function(options) {
		var imageUploader = this;
		var options = $.extend({
			container: $('body'),
			image: '',
			uploadURI: 'http://api.imgur.com/2/upload.json',
			hoster: 'imgur'
		}, options);

		this.upload = function() {
			var file = this.fileInput.files[0];
			if (!file || !file.type.match(/image.*/)) {
				this.onError("Only image files can be uploaded");
				return;
			}
			// Switch to upload view
			$(this.fileInput).css({
				display: 'none'
			});
			imageUploader.setProgress(0);

			var fd = new FormData();
			// https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
			fd.append("image", file);
			if (options.hoster == 'S3') {
				utils.console("S3 upload no longer supported. Using imgur.")
			}
			fd.append("key", "b77379394c5ae907613023b8dd5b77bf");

			var xhr = new XMLHttpRequest();
			xhr.open("POST", options.uploadURI);

			xhr.onload = function() {
				try {
					var res = JSON.parse(xhr.responseText);
				} catch(e) {
					return imageUploader.onError();
				}
				imageUploader.onUploaded(res.upload);
			}.closure(this);
			xhr.onerror = imageUploader.onError.closure(this);
			xhr.upload.onprogress = function(e) {
				imageUploader.setProgress(e.loaded / e.total);
			}.closure(this);
			xhr.send(fd);
		};

		this.setProgress = function(progress) {
			imageUploader.progressBarContainer.show().progressbar({
				value: parseInt(progress * 100)
			});
      utils.console("Upload progress: " + progress);
		};

		this.onError = function() {
      utils.console("Error upload image");
		};

		this.onUploaded = function(response) {
			if (options.hoster == 'imgur') {
				var src = response.links.original;
				var thumb = response.links.small_square;
				var large_thumb = response.links.large_thumbnail;
				imageUploader.inputForm.filter('.UploadedImage').append('<img src="' + thumb + '" />').parent().data('imgSrc', thumb);
			}
			imageUploader.inputForm.filter('.UploadedImage').show();
			imageUploader.progressBarContainer.hide();
      utils.console("image uploaded");
		};

		this.deleteImage = function() {
			$(imageUploader.fileInput).show();
			imageUploader.inputForm.filter('.UploadedImage').hide();
			imageUploader.inputForm.filter('.UploadedImage').children('img').remove();
			imageUploader.progressBarContainer.parent().data('imgSrc', '')
		};

		var inputField = ''
			+ '<div class="UploadInput">'
			+ '	<form enctype="multipart/form-data" method="post">'
			+ '		<input type="file" />'
			+ '	</form>'
			+ '</div>'
			+ '<div class="UploadedImage">'
			+ '	<div class="CommandBar"><button class="Delete">' + ORUserUIStrings['IMAGE_REMOVE'] + '</button></div>'
			+ '</div>'
			+ '<div class="ProgressBar"></div>';

		this.inputForm = $(inputField).appendTo(options.container);
		this.fileInput = this.inputForm.filter('.UploadInput').children('form').children('input').get(0);
		this.progressBarContainer = this.inputForm.filter('.ProgressBar');

		if (options.image !== '') {
			this.inputForm.filter('.UploadedImage').append('<img src="' + options.image + '" />');
			$(this.fileInput).hide();
			this.progressBarContainer.parent().data('imgSrc', options.image);
			this.inputForm.filter('.UploadedImage').show();
		}

		// Bind the replace button event
		this.inputForm.filter('.UploadedImage').children('.CommandBar').children('.Delete').on({
			click: imageUploader.deleteImage
		});

		$(this.fileInput).on({
			change: function() {
				imageUploader.upload();
			}
		});
	};

	this.treeSelector = function(options) {
		var settings = $.extend({
			id : 'NotAvailable',
			toolbarId : 'NotAvailable',
			title : '',
			description : 'Description of the command',
			items : [],
			enabled : true,
			positionX : '5px',
			positionY : '10px',
			width : 40,
			height : 0,
			texturePositionX : '0px',
			texturePositionY : '0px',
			events: {
				clickNode: function(event) {
					alert(event.itemType);
				}
			}
		}, options);

		this.createTreeNode = function(options, level) {
			// Expansion of the node data (type, {settings}, [subnodes])
			var currentNode = $.extend({
				type : 'NotAvailable',
				settings : {
					id : 'NotAvailable',
					title : 'NotAvaible'
				},
				events: {
					clickNode: function() {
					}
				},
				items : []
			}, options);


			// Expansion of elements of interest from parent item
			var parentItemSettings = $.extend({
				id : 'NotAvailable',
				title : ''
			}, currentNode.settings);

			if (parentItemSettings.title == '')
				parentItemSettings.title = currentNode.type;

			// This is the Id used to identify a row of items
			var rowId = 'ItemRow' + parentItemSettings.id;
			// Container for single row of items
			$('<div class="ItemRow Level' + level + '" id="' + rowId + '"></div>').appendTo('#' + itemContainerId);
			// Row offset according to level * height
			$('#' + rowId).css('top', level * $('#' + rowId).height());
			// Update offset and size
			itemRowOffset[rowId] = 0;
			itemRowSize[rowId] = currentNode.items.length;

			for (var i = 0; i < currentNode.items.length; ++i) {
				// Expansion of item settings
				var itemSettings = $.extend({
					id : 'NotAvailable',
					title : '',
					description : 'Description of the command',
					enabled : true,
					texturePositionX : '0px',
					texturePositionY : '0px'
				}, currentNode.items[i].settings);

				if (itemSettings.title == '')
					itemSettings.title = currentNode.items[i].type;

				var itemHTML = '' + '<div id="' + itemSettings.id + 'Container">' +
                    '<div class="Item Iconset" style="background-position: ' + itemSettings.texturePositionX + ' ' + itemSettings.texturePositionY + '" id="' + itemSettings.id + '">' +
                    '<div class="Label">' + itemSettings.title + '</div><div class="InsertNewItem">' + itemSettings.id + '</div>' +
                    (itemSettings.enabled !== true ? '<div class="Pro">' + editorStrings['PRO'] + '</div>' : '') +
                    '</div>' +
                    '</div>';

				// Add to DOM
				$(itemHTML).appendTo('#' + rowId);

				// Attach event handlers
				var itemData = {
					children : currentNode.items[i].items.length,
					itemId : itemSettings.id,
					itemTitle : itemSettings.title,
					row : rowId,
					parentItemTitle : parentItemSettings.title
				};
				$('#' + itemSettings.id).on("click", itemData, function(event) {
					if (event.data.children > 0) {
						var scrollItemContainer = -scrollSizeY;
						$('#' + event.data.row).children().each(function(index, element) {
							var elementId = $('#' + element.id).children(':first').attr('id');
							var targetRowId = 'ItemRow' + elementId;
							if(elementId == event.data.itemId) {
								currentRowToScroll = targetRowId;
								// Hide all rows at the same level, to avoid wrong mapping of events
								$('.Level' + (level + 1)).hide();
								// Show the row that will appear
								$('#' + targetRowId).show();
								// Remove last element of path
								var pathNodeId = "PathNode" + elementId;

								// Convert previous item in link
								$('#' + pathId).children().filter(':last').remove();

								$('<div class="PathNode"><a href="javascript:void(0);" id="' + pathNodeId + '">' + event.data.parentItemTitle + '</a></div>').appendTo('#' + pathId);
								$('<div class="PathSeparator">/</div><div class="PathNode">' + event.data.itemTitle + '</div>').appendTo('#' + pathId);
								$('#' + pathNodeId).on('click', function(event) {
									var currentLevel = currentItemContainerScrollY / scrollItemContainer;
									var targetLevel = level;
									for(var i = level; i < currentLevel; ++i) {
										$('#' + pathId).children().filter(':last').remove();
										$('#' + pathId).children().filter(':last').remove();
									}

									$('#' + pathId).children().filter(':last').html($('#' + pathId).children().filter(':last').text());
									currentItemContainerScrollY = scrollItemContainer * level;
									$('#' + itemContainerId).animate({
										top : (currentItemContainerScrollY / 10) + 'em'
									});
									currentRowToScroll = rowId;
								});
							} else {
								$('#' + targetRowId).hide()
							}
						});

						if (scrollItemContainer != 0) {
							currentItemContainerScrollY += scrollItemContainer;
							$('#' + itemContainerId).animate({
								top : (currentItemContainerScrollY / 10) + 'em'
							});
						}
					} else {
						// If current node has no children, then insert at the end
						currentNode.events.clickNode({
							itemType: event.data.itemId
						});
					}
				}).on('mouseover', itemData, function(event) {
					if(event.data.children > 0) {
						// $('#' + event.data.itemId).css('cursor', 'pointer');
					} else {
						// $('#' + event.data.itemId).css('cursor', 'move');
					}
				});

                if (itemSettings.enabled) {
                    // Drag and drop support
                    $('#' + itemSettings.id).draggable({
                        appendTo : 'body',
                        containment : $('body'),
                        cursorAt: {
                            top: 40,
                            left: 50
                        },
                        distance: 10,
                        cursor : 'move',
                        revert : 'invalid',
                        revertDuration : 300,
                        zIndex : 41,
                        helper : function(event) {
                            // Trick: Extract the icon from the toolbar
                            return ''
                                + '<div class="SurveyDraggingItem">' + $('#' + this.id).parent().html()
                                + '<div class="Legend">' + tr(ORUserUIStrings['DRAGGING_NEW'], this.id) + '</div>'
                                + '</div>';
                        }
                    });
                }

				// Add tooltip to node
				new ui.tooltip({
					container: $('#' + itemSettings.id),
					text: itemSettings.enabled ? (itemData.children > 0 ? ORUserUIStrings['TIP_CLICK_TO_VIEW_SUBITEMS'] : ORUserUIStrings['TIP_CLICK_TO_INSERT']) : editorStrings['PRO_ITEM_DETAIL'],
					position: 'top',
					delay: 500
				});

				// Recurse over child nodes
				this.createTreeNode($.extend({
					events: currentNode.events
				}, currentNode.items[i]), level + 1);
			}
		}
		var treeId = settings.id;
		var pathId = treeId + "Path";
		var scrollSizeX = 54;
		var scrollSizeY = 54;
		var scrollStep = 5;

		var currentItemContainerScrollY = 0;
		// This stores selected row
		var currentRowToScroll = 'ItemRowRoot';
		// Here it is stored the 'left' attribute of each item row
		var itemRowOffset = new Array();
		// To store total items in row
		var itemRowSize = new Array();

		var treeHTML = '';
		var itemContainerId = 'itemContainer' + settings.id;
		var leftArrowId = 'leftArrow' + settings.id;
		var rightArrowId = 'rightArrow' + settings.id;

		treeHTML += '<div class="GenericItem">';
		treeHTML += '<div class="Path" id="' + pathId + '"><div class="PathNode">All Items</div></div>';
		treeHTML += '<div class="TreeView" id="' + settings.id + '">';
		treeHTML += '</div></div>';
		$(treeHTML).appendTo('#' + settings.toolbarId + ' .Fields');
		$('#' + settings.id).width(settings.width);
		if(settings.height != 0)
			$('#' + settings.id).height(settings.height);

		// Position
		$('#' + settings.id).parent().css('left', settings.positionX).css('top', settings.positionY);

		// Add menu items
		$('<div class="ItemScroll"><div class="ItemContainer" id="' + itemContainerId + '"></div>').appendTo('#' + settings.id);
		$('<div class="ItemNavigation"><div class="Arrow Iconset" id="' + rightArrowId + '"></div><div class="Arrow Iconset" id="' + leftArrowId + '"></div></div>').appendTo('#' + settings.id);
		$('#' + rightArrowId).css('background-position', '-123px -6px');
		$('#' + leftArrowId).css('background-position', '-123px -56px');

		// Create virtual node to recurse on
		var treeMenuArray = {
			type : "Root",
			settings : {
				id : "Root",
				title : "All Items"
			},
			items : settings.items,
			events : settings.events
		};
		this.createTreeNode(treeMenuArray, 0);

		// Events for left arrow
		$('#' + leftArrowId).click(function() {
			var itemsRemaining = -1 * itemRowOffset[currentRowToScroll] / scrollSizeX;
			var currentScrollStep = scrollStep;
			if(itemsRemaining < scrollStep)
				currentScrollStep = itemsRemaining;
			if(itemRowOffset[currentRowToScroll] < 0) {
				itemRowOffset[currentRowToScroll] += scrollSizeX * currentScrollStep;
				$('#' + currentRowToScroll).animate({
					left : (itemRowOffset[currentRowToScroll] / 10) + 'em'
				});
			}
		});

		// Events for right arrow
		$('#' + rightArrowId).click(function() {
			var itemsRemaining = itemRowSize[currentRowToScroll] + itemRowOffset[currentRowToScroll] / scrollSizeX;
			var currentScrollStep = scrollStep;
			if(itemsRemaining - 5 < scrollStep)
				currentScrollStep = itemsRemaining - 5;
			if(itemRowOffset[currentRowToScroll] > -scrollSizeX * (itemRowSize[currentRowToScroll] - 5)) {
				itemRowOffset[currentRowToScroll] -= scrollSizeX * currentScrollStep;
				$('#' + currentRowToScroll).animate({
					left : (itemRowOffset[currentRowToScroll] / 10) + 'em'
				});
			}
		});

	};
	// Closes TreeSelector

	/**
	 *
	 * Creates a tab layout
	 *
	 */
	this.createTabContainer = function(options) {
		var settings = $.extend({
			id : 'NotAvailable',
			position : 'inline',
			target : 'body',
			height : '100%',
			width : '100%',
			tabs : [
				{
					title : 'Tab 1',
					content : $('<div>Content 1 Content 1 Content 1 Content 1 Content 1 </div>')
				},
				{
					title : 'Tab 2',
					content : $('<div>Content 2 Content 2 Content 2 Content 2 Content 2</div>')
				}
			],
			selectedTab : 0
		}, options);
		var currentTabContainer = this;

		this.handleClick = function(event) {
			currentTabContainer.selectTab($(this).data('index'));
		};

		this.selectTab = function(tabIndex) {
			var currentTab = tabContainer.children('.Tabs').children('.Tab').eq(settings.selectedTab);
			var targetTab = tabContainer.children('.Tabs').children('.Tab').eq(tabIndex);

			// Check first if click element is not itself
			if (currentTab.data('index') != targetTab.data('index')) {
				// Unselect all tabs
				tabContainer.children('.Tabs').children('.Tab').removeClass('Selected')
				// Create pointer to objects to be scrolled
				var currentContent = tabContainer.children('.Contents').children('.Content').eq(currentTab.data('index'));
				var targetContent = tabContainer.children('.Contents').children('.Content').eq(targetTab.data('index'));
				// Get tab width
				var direction = 'right';
				// Determine direction
				if (currentTab.data('index') < targetTab.data('index')) {
					// This case corresponds to a element to the right.
					// So, old element should go to the left, and the new enter from the right
					direction = 'left';
				}
				currentContent.hide('slide', { direction : direction }, 250);
				targetContent.show('slide', { direction : (direction == 'left' ? 'right' : 'left' ) }, 250);
				settings.selectedTab = targetTab.data('index');
				// Set target as selected
				targetTab.addClass('Selected');
			}
		};

		var tabContainer = "";
		var currentTab = settings.selectedTab;
		// Implementation of tabs for inline position
		if (settings.position == 'inline') {
			tabContainer = $('<div class="TabContainer" id="' + settings.id + '">'
			+ '<div class="Tabs"></div>'
			+ '<div class="Contents"></div>'
			+ '</div>').appendTo(settings.target);
		} else {
			// TODO: Support for absolute positioning
		}

		$.each(settings.tabs, function(index, element) {
			var tab = $('<a class="Tab RoundedButtonMedium">' + this.title + '</a>').appendTo(tabContainer.children('.Tabs'));
			tab.data('index', index);
			var content = this.content.appendTo($('<div class="Content"></div>').appendTo(tabContainer.children('.Contents')));

			// Attach handler for tab transitions
			tab.on('click', currentTabContainer.handleClick);
		});

		// Display first tab
		this.selectFirstTab = function() {
			utils.console('Showing first tab');
			tabContainer.children('.Contents').children('.Content').eq(settings.selectedTab).show();
			tabContainer.children('.Tabs').children('a.Tab').eq(settings.selectedTab).addClass('Selected');
		}

		runOrWhenDOMReady(this.selectFirstTab);

	};

	/**
	 *
	 * This handles right click menu on provided "container". Event handlers
	 * may be supplied on events part of options. Dimensions are controller
	 * in CSS files. Commands array represent items. Special item has label
	 * 'Divisor', which will insert a line separator for items.
	 *
	 * Each command has: Label, which is displayer, Command, which is called
	 * on click, and Condition, which is used to enable or disable items
	 *
	 */
	this.contextMenu = function(options) {
		var options = $.extend({
			container: $('body'),
			commands: [
				{ label: 'Copy', command: unbinded },
				{ label: 'Paste', command: unbinded },
				{ label: 'Delete', command: unbinded }
			],
			events: {
				onShow: $.noop
			}
		}, options);
		var contextMenu = this;
		this.hide = function() {
			//$('.ContextMenu .SubMenu').hide();
			contextMenu.menu.fadeOut(200);
		};

		this.buildSubMenus = function(command, menuItem, hide) {
			if (command !== undefined) {
				var submenu = $('<ul class="SubMenu"></ul>').appendTo(menuItem);
				if (hide)
					submenu.hide();
				$.each(command, function(index) {
					var menuItem = $('<li><a>' + this.label + '</a></li>').appendTo(submenu);
					var currentCommand = this;

					// Disable command if condition is marked
					if (currentCommand.condition !== undefined) {
						// If so, check it
						if (currentCommand.condition()) {
							menuItem.removeClass('Disabled');
						} else {
							menuItem.addClass('Disabled');
						}
					}

					menuItem.on('click', function(event) {
						if (currentCommand.subcommands === undefined) {
							if (currentCommand.condition === undefined || currentCommand.condition()) {
								currentCommand.command(currentCommand.data);
								// If command does not have children, hide menu
								contextMenu.hide();
							}
						} else {
							menuItem.children('ul').slideToggle(150);
							event.stopPropagation();
						}
					});
					// Recursively, build sublevels
					contextMenu.buildSubMenus(this.subcommands, menuItem, true);
				});
			}
		};

		this.menu = $('<div class="ContextMenu"></div>').appendTo('body');
		this.commands = $('<div class="Commands"></div>').appendTo(this.menu);

		options.container.on('contextmenu', function(event) {
			// Hide others
			$('.ContextMenu').hide();

			// Recursively, build sublevels
			contextMenu.buildSubMenus(options.commands, contextMenu.commands.empty(), false);

			contextMenu.menu.show();
			contextMenu.menu.position({
				my: "left top",
				of: event,
				collision: "none"
			});
			// Custom events
			options.events.onShow();
			return false;
		});

		$('body').on('click', function(event) {
			contextMenu.hide();
		});
	};

	/**
	 *
	 * Creates a modal dialog
	 *
	 */
	this.dialog = function(options) {
		var currentDialog = this;
		var settings = $.extend({
			title : 'Settings',
			width: 800,
			height: 500,
			container: 'body',
			content : '',
			commands : {
				left : [],
				right : [
					{ label : 'Save', 'class' : 'SaveCommand', command : function(){ alert('Unbinded'); } },
				]
			},
			id : 0
		}, options);

		this.show = function(options) {
			this.dialogDOM.find('.modal-dialog').css({
				'width': '80%',
        'margin-left': 'auto',
        'margin-right': 'auto',
				'max-width': settings.width + 'px'
				});
			this.dialogDOM.modal('show');
		};

		this.hide = function() {
			this.dialogDOM.modal('hide');
		};

		this.getContentPlaceholder = function() {
			return this.dialogDOM.find('.Content').first();
		};

		var newDialog = $(''
			+ '<div class="modal fade ORModal" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">'

			+ '<div class="modal-dialog">'
			+ '<div class="modal-content">'

			+ '<div class="modal-header">'
			+ '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'
			+ '<h3>' + settings.title + '</h3>'
			+ '</div>'

			+ '<div class="modal-body">'
			+ '<div class="Content">' + settings.content + '</div>'
			+ '</div>'

			+ '<div class="modal-footer">'
			+ '<div class="left"></div><div class="right"></div><div class="clear-float"></div>'
			+ '</div>'

			+ '</div>' // Closes modal-content
			+ '</div>' // Closes modal-dialog

			+ '</div>').hide().prependTo(settings.container);

		// If there are no commands, remove the commandbar row
		if ((settings.commands.left.length + settings.commands.right.length) == 0) {
			newDialog.find('modal-footer').remove();
		}

		var commandBar = newDialog.find('.modal-footer');
		$.each(settings.commands.left, function() {
			$('<button class="btn ' + (this.primary ? 'btn-primary' : '') + ' btn-lg">' + this.label + '</button>').appendTo(commandBar.find('.left')).on({
				click : this.command
			});

		});
		$.each(settings.commands.right.reverse(), function() {
			$('<button class="btn ' + (this.primary ? 'btn-primary' : '') + ' btn-lg" ' + (this.ngDisabled ? 'ng-model="button" ng-disabled="' + this.ngDisabled + '"' : '') + '>' + this.label + '</button>').appendTo(commandBar.find('.right')).on({
				click : this.command
			});
		});

		this.dialogDOM = newDialog;
	};

	/**
	 *
	 * The settings dialog is the one that appears in the survey editor when clicking
	 * the settings button. The reason is here is because it was though that settings could be
	 * editted without accessing the editor
	 *
	 */
	this.settingsDialog = function(options) {
		var settings = $.extend({
			id : '',
			title: 'Settings',
			commitChanges: false
		}, options);
		var dialog;
		var settingsDialog = this;
		this.items = {};
		var items = this.items;
		// Store user ID to allow saving from any page (outside editor)
		this.surveyId;
		// Record the values of the items;
		this.settingsState = {};
		// For efficiency, record when changes have been done
		this.hasChanged = false;

		this.getContent = function(tab) {
			var content = $('<div class="TabContent SettingsDialog"></div>');
			switch(tab) {
				case 'Presentation':
					var titleAndMessages = $('<div id="TitleAndMessagesPane"></div>').appendTo(content);
					items.title = new ui.input({
						id : 'SurveyTitle',
						container : titleAndMessages,
						label : editorStrings['SETTINGS_TITLE'],
						description : 'Description of the command',
						controlClass : 'form-control'
					});
					items.introText = new ui.textEditor({
						id : 'SurveyIntro',
						container : titleAndMessages,
						label : editorStrings['SETTINGS_INTRO_TEXT'],
						description : 'Description of the command'
					});
					items.closingText = new ui.textEditor({
						id : 'SurveyClosing',
						container : titleAndMessages,
						label : editorStrings['SETTINGS_CLOSING_TEXT'],
						description : 'Description of the command'
					});
					break;
				case 'Delivery':
					var deliverySettings = $('<div id="DeliveryPane"></div>').appendTo(content);
					var publicationSettings = $('<div class="Publication"></div>').appendTo(deliverySettings);
					new ui.label({
						id : 'PublicationLabel',
						container : publicationSettings,
						label : editorStrings['SETTINGS_LABEL_PUBLICATION']
					});
					items.startDate = new ui.dateTime({
						id : 'StartDeliveryOn',
						container : publicationSettings,
						label : editorStrings['SETTINGS_START_DATE'],
						description : 'Description of the command',
						controlClass : 'form-control'
					});
					items.endDate = new ui.dateTime({
						id : 'EndDeliveryOn',
						container : publicationSettings,
						label : editorStrings['SETTINGS_END_DATE'],
						description : 'Description of the command',
						controlClass : 'form-control'
					});
					items.status = new ui.selector({
						id : 'StatusSelector',
						container : publicationSettings,
						options: surveyStatusOptions,
						label : editorStrings['SETTINGS_SURVEY_STATUS'],
						description : 'Description of the command'
					});

					var servingSettings = $('<div class="Serving"></div>').appendTo(deliverySettings);
					new ui.label({
						id : 'ServingLabel',
						container : servingSettings,
						label : editorStrings['SETTINGS_LABEL_SERVING']
					});
					items.enableItemRandomize = new ui.checkbox({
						id : 'EnableItemRandomize',
						container : servingSettings,
						label : editorStrings['SETTINGS_ENABLE_ITEM_RANDOMIZE'],
						description : 'Description of the command'
					});
					items.enableOptionRandomize = new ui.checkbox({
						id : 'EnableOptionRandomize',
						container : servingSettings,
						label : editorStrings['SETTINGS_ENABLE_OPTION_RANDOMIZE'],
						description : 'Description of the command'
					});
					items.showHiddenItemsAsDisabled = new ui.checkbox({
						id : 'ShowHiddenItemsAsDisabled',
						container : servingSettings,
						label : editorStrings['SETTINGS_ENABLE_HIDDEN_ITEMS_VISIBLE'],
						description : 'Description of the command'
					});

					var navigation = $('<div class="Navigation"></div>').appendTo(deliverySettings);
					new ui.label({
						id : 'NavigationLabel',
						container : navigation,
						label : editorStrings['SETTINGS_LABEL_NAVIGATION']
					});
					items.scrollingMode = new ui.selector({
						id : 'ScrollingMode',
						container : navigation,
						options: scrollingOptions,
						label : editorStrings['SETTINGS_SCROLLING_MODE'],
						description : 'Description of the command'
					});

					items.visibleItems = new ui.spinner({
						id : 'SmartScrollingVisibleItems',
						container : navigation,
						minValue : 1,
						fastIncrement : 5,
						label : editorStrings['SETTINGS_VISIBLE_ITEMS'],
						value : 15
					});

					var appearance = $('<div class="Appearance"></div>').appendTo(deliverySettings);
					new ui.label({
						id : 'AppearanceLabel',
						container : appearance,
						label : editorStrings['SETTINGS_LABEL_APPEARANCE']
					});
          items.template = new ui.selector({
            id: 'SurveyTemplate',
            container: appearance,
            options: surveyTemplateOptions,
            label: editorStrings['SETTINGS_TEMPLATE']
          });
          items.theme = new ui.selector({
            id: 'SurveyTheme',
            container: appearance,
            options: surveyThemeOptions,
            label: editorStrings['SETTINGS_THEME']
						// TODO: Check how to update theme from settings
            // command: editor.handleChangeTheme
          });

					var objectives = $('<div class="Objectives"></div>').appendTo(deliverySettings);
					new ui.label({
						id : 'ObjectivesLabel',
						container : objectives,
						label : editorStrings['SETTINGS_LABEL_OBJECTIVES']
					});
					items.maxResponsesPerDay = new ui.spinner({
						id : 'MaxResponsesPerDay',
						container : objectives,
						zeroIsUnlimeted : true,
						minValue : 0,
						maxValue : 1000,
						fastIncrement : 10,
						label : editorStrings['SETTINGS_MAX_RESPONSES_PER_DAY'],
						suffix : editorStrings['SETTINGS_RESPONSES']
					});
					items.maxResponsesTotal = new ui.spinner({
						id : 'MaxResponsesTotal',
						container : objectives,
						zeroIsUnlimeted : true,
						minValue : 0,
						maxValue : 10000,
						fastIncrement : 100,
						label : editorStrings['SETTINGS_MAX_RESPONSES_TOTAL'],
						suffix : editorStrings['SETTINGS_RESPONSES']
					});
					items.deliveryStrategy = new ui.selector({
						id : 'DeliveryStrategy',
						container : objectives,
						options: deliveryStrategyOptions,
						label : editorStrings['SETTINGS_DELIVERY_STRATEGY']
					});

					break;

				default:
					$('<div class="ComingSoon">Coming soon...</div>').appendTo(content);
					break;
			}
			return content;
		};

		/**
		 *
		 * Loads all elements of the settings dialog
		 *
		 */
		this.loadUI = function() {
			dialog = new ui.dialog({
				width: 800,
				height: 250,
				title: settings.title,
				content : '',
				commands : {
					left : [
						{
							label : ORUserUIStrings['DISCARD'],
							'class' : 'CancelCommand',
							command : settingsDialog.discard
						}
					],
					right : [
						{
							label : settings.commitChanges ? ORUserUIStrings['SAVE'] : ORUserUIStrings['DONE'],
							primary : true,
							'class' : 'SaveCommand',
							command : settingsDialog.save }
					]
				}
			});
			var contentPlaceholder = dialog.getContentPlaceholder();
			var tabContainer = new ui.createTabContainer({
				id : 'SettingsTabs',
				target : contentPlaceholder,
				tabs : [
					{
						title : 'Presentation',
						content : settingsDialog.getContent('Presentation')
					},
					{
						title : 'Delivery',
						content : settingsDialog.getContent('Delivery')
					}
				],
				selectedTab : 0
			});
		}

		this.show = function() {
			dialog.show();
		};

		/**
		 *
		 * Receive settings data, and update GUI elements
		 *
		 */
		this.load = function(settings) {
			// Get all keys from hash with pointer to all form elements of dialog box
			// that are relevant
			var keys = getObjectKeys(settings);
      utils.console({ text: "LOADING SETTINGS: " });
			$.each(keys, function() {
				// Write each settings state calling the setValue to each
				// form element, reading data directly from settings
				if (typeof items[this] !== 'undefined') {
					utils.console("" + this + ": " + settings[this]);
					items[this].setValue(settings[this]);
				} else {
					utils.console({error: true, text: "Cant set " + this + " as " + settings[this]});
				}
			});
		};


		/**
		 *
		 * Updates content of settingsDialog.settingsState with the current
		 * content of UI items in dialog
		 *
		 */
		this.updateState = function() {
			// Get all keys from hash with pointer to all form elements of dialog box
			// that are relevant
			var keys = getObjectKeys(items);
			$.each(keys, function() {
				// Write each settings state calling the getValue from form elements
				settingsDialog.settingsState[this] = items[this].getValue();
				utils.console("" + this + " - val: " + settingsDialog.settingsState[this]);
			});

		};

		/**
		 *
		 * Will read values from all form fields in dialog, and submit it to the
		 * update settings service
		 *
		 */
		this.save = function(event) {
			utils.console('Saving settings...');

			settingsDialog.updateState();

			if (settings.commitChanges) {
				var jsonData = JSON.stringify(settingsState);
				$.ajax({
					url: "/api/survey/settings/" + surveyId,
					cache: false,
					type: "POST",
					data: jsonData,
					contentType: 'application/json; charset=utf-8',
					statusCode: {
						202 /* Updated */: function(data) {
							$(editorStrings['SAVE_SUCCESS']).notify({
								autoHide: 3000
							});
							// On success save, hide dialog
							settingsDialog.hasChanged = false;
							dialog.hide();
						},
						200 /* Record does not exist */: function(data) {
							$().notify({
								title: editorStrings['SAVE_ERROR'],
								autoHide: 3000,
								message: data,
								type: 'Error'
							});
						}
					},
					error: function(jqxhr,textstatus,errorthrown) {
						alert('Service call failed: ' + jqxhr + ' - ' + textstatus + ' - ' + errorthrown);
					}
				});
			} else {
				settingsDialog.hasChanged = true;
				// Just hide the dialog, since state has been updated
				dialog.hide();
			}
		};

		this.discard = function(event, data) {
			dialog.hide();
		};
	}
}
