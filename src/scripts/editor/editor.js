/**
 *
 * Main script file for OverResponse Survey Editor
 * @module SurveyEditor
 *
 */
 import ORBaseUIStrings from './../ui/base/languages/en-us'
 import UserUIStrings from './../ui/user/languages/en-us'
 import ORUtils from './../util'
 import ORUserUI from './../ui/user/user-ui'
 import {
	itemVisibilityOptions,
	itemLayoutOptions,
	itemOrientationOptions,
	itemOpenSize,
	itemTextAreaSize,
	checkGroupHeaderStyles,
	desktopEmbedUnitOptions
 } from './../ui/user/options'
 import editorStrings from './languages/en-us'

 // Globals for the editor
var surveyModel
var survey
var editor
var ui
// For previews, tell this is previewMode
var ORPreviewMode = true

export function startSurveyEditor(surveyData, events) {
	var utils = new ORUtils($);
	// Main survey object
	utils.console('... Booting Survey Editor')
	surveyModel = {}

	// UI must be called at most once
	if (typeof ui == 'undefined') {
		ui = new ORUserUI($, utils)
	}

	utils.console('... Booting controller')
	survey = new surveyController(events)

	utils.console('... Booting survey')
	survey.init()
	survey.id = $('surveyId').getURLParameter()
	survey.shortId = survey.id

	utils.console('... Booting Editor Area')
	editor = new surveyEditor(events)

	utils.console('... Initing Editor Area')

	editor.init()

	utils.console('... Editor Area ready ')
	if (survey.id !== '') {
		// Populating survey into survey editor
		utils.console('... Setting up Survey')
		//survey.load()

	} else {
		utils.console('... Creating New Survey')
	}

};

/**
 *
 * Survey controller handles the creation and loading of surveys. It will
 * interact with server and load survey elements.
 *
 * @class
 *
 */
function surveyController(events) {
	var surveyController = this
	/** Should be false if survey is not saved but for now it is false onlye when survey is new. **/
	this.saved = false
	/** When there are no items loaded, this element is marked as true. **/
	this.firstItem = true
	/** A callback called when an error occurs trying to load or save **/
	this.onLoadError = function () { }
	this.onSaveError = function () { }

	this.init = function () {
		surveyModel.id = ''
		surveyModel.title = editorStrings['NEW_SURVEY_TITLE']
	}

	this.load = function (surveyData) {
		survey.shortId = surveyData.shortId
		editor.loadSurvey(surveyData)
		editor.loadSettings(surveyData.settings)
		// After loaded we can call the init the autosave
		editor.updateAutoSave()
	}

	/**
	 *
	 * Save the current survey
	 *
	 * @param {Callback} onSave a callback to be executed after save has completed
	 * @param {string} fromAutoSave A flag to indicate if this was invoked by the autoSave function
	 *
	 */
	this.save = function (onSave, fromAutoSave) {
		// Call parent component to handle save event
		if (typeof events.onSurveySave === 'function') {
			var surveyData = editor.getSurvey()
			events.onSurveySave(
				surveyData,
				function() {
					if (typeof onSave === 'function') {
						onSave(surveyData)
					}
				},
				function(message) {
					surveyController.onSaveError(message, fromAutoSave)
				}
			);
		}
	}

}

function surveyEditor(events) {
	// Load common utils
	var utils = new ORUtils($)

	// Save status
	this.surveyHasChanged = true

	// Array that contain all selected items
	var ClipboardOptions = {
		none: 0,
		cut: 1,
		copy: 2
	}
	this.selectedItems = []
	this.clipboard = {}
	this.clipboardOption = ClipboardOptions.none

	/** Contains different survey states for undo **/
	this.undoStack = []
	/** Contains different survey states for redo **/
	this.redoStack = []
	/** Here is a temporal variable to store the current survey data **/
	this.currentState

	// Buttons that may be enabled and disabled should be available to other methods
	this.buttons = {}

	// Dialogs also must be available
	this.dialogs = {}

	// Header contains GUI items for name, template and theme
	this.header = {}

	// Common jQuey objects used along the editor
	this.board = $('#SurveyEdition')

	/** A boolean variables that indicates wheter autoSave is on **/
	// TODO: Read setting
	this.autoSave = false

	/** A variable that stores the index in the array for the timer **/
	this.autoSaveTimer = -1

	// An array of all item types
	var itemTypes = ['DropDown', 'RadioText', 'RadioImage', 'RadioVideo', 'RadioHTML', 'ListText', 'ListImage', 'ListVideo', 'ListHTML', 'BinaryYesNo', 'BinaryTrueFalse', 'ListCheck', 'RateRadioText', 'RateRadioImage', 'RateRadioVideo', 'RateRadioHTML', 'OpenSingleLine', 'OpenMultipleLine', 'OpenRichText', 'Label', 'Matrix', 'Group']

	/**
	 * Show help to the user
	 *
	 * @returns {$rootScope.helpFlags|*|number}
	 */
	this.showHelp = function () {
		return false
		// return $rootScope.helpFlags && 0x0010;
	}

	this.init = function () {
		// Create settings dialog
		this.dialogs.surveySettings = new ui.settingsDialog({
			title: 'Survey Settings'
		})
		utils.console("Creating settings dialog")
		this.dialogs.surveySettings.loadUI()
		utils.console("dialog settings loaded.")

		// Create a dialog for survey preview
		this.dialogs.surveyPreview = new ui.dialog({
			title: 'Survey Preview',
			width: 1000,
			height: 600,
			commands: {
				left: [],
				right: []
			}
		})

		// Create a dialog for Code Preview
		this.dialogs.publish = new ui.dialog({
			title: editorStrings['PUBLISH_TITLE'],
			commands: {
				right: [{
					label: editorStrings['DONE'],
					'class': 'SaveCommand',
					primary: true,
					command: function () {
						editor.dialogs.publish.hide()
					}
				}],
				left: []
			}
		})

		// Create a dialog to create and edit display rules
		this.dialogs.displayRules = new ui.dialog({
			title: editorStrings['DISPLAY_RULES_TITLE'],
			commands: {
				right: [{
					label: editorStrings['DONE'],
					'class': 'SaveCommand',
					primary: true,
					command: function () {
						editor.dialogs.displayRules.hide()
					}
				}],
				left: []
			}
		})

		// Restore the editor area to its initial state
		$('#SurveyEditorToolbar, #SurveyEdition').empty()

		ui.toolbar({
			'scrollable': true
		})
		ui.toolbarGroup({
			id: 'File',
			title: editorStrings['MENU_PANEL_SURVEY'],
			width: '20%'
		})
		ui.toolbarGroup({
			id: 'Items',
			title: editorStrings['MENU_PANEL_ITEMS'],
			width: '39%'
		})
		ui.toolbarGroup({
			id: 'Clipboard',
			title: editorStrings['MENU_PANEL_CLIPBOARD'],
			width: '9%'
		})
		ui.toolbarGroup({
			id: 'Properties',
			title: editorStrings['MENU_PANEL_PROPERTIES'],
			width: '32%',
			visible: false
		})

		// Buttons for File
		ui.button({
			id: 'Save',
			toolbarId: 'File',
			text: 'Save',
			command: survey.save,
			horizontal: false,
			width: '3.5em',
			height: '4em',
			positionX: '0.5em',
			positionY: '0.7em',
			texturePositionX: -592,
			texturePositionY: -5
		})
		// The auto save function
		editor.buttons.autoSave = new ui.checkbox({
			id: 'AutoSave',
			toolbarId: 'File',
			label: 'Auto',
			width: '3.5em',
			positionX: '0.2em',
			positionY: '5.2em',
			command: editor.handleAutoSave
		})
		utils.console('editor.autoSave ' + editor.autoSave)
		editor.buttons.autoSave.setValue(editor.autoSave, { skipEvents: true })
		if (survey.id === '') {
			// If the survey that is being inited does not have an id, then is new, so apply the autosave
			editor.updateAutoSave()
		}

		// Shows the setting value
		ui.button({
			id: 'Settings',
			toolbarId: 'File',
			text: 'Settings',
			command: editor.dialogs.surveySettings.show,
			width: '5em',
			positionY: '0.7em',
			positionX: '4.5em',
			texturePositionY: -90
		})
		ui.button({
			id: 'Preview',
			toolbarId: 'File',
			text: 'Preview',
			command: editor.handlePreview,
			width: '5em',
			positionY: '2.8em',
			positionX: '4.5em',
			texturePositionY: -387
		})
		ui.button({
			id: 'GetCode',
			toolbarId: 'File',
			text: editorStrings['MENU_PANEL_GET_CODE'],
			command: editor.handlePublish,
			width: '5em',
			positionY: '4.9em',
			positionX: '4.5em',
			texturePositionY: -417
		})
		editor.buttons.undo = new ui.button({
			id: 'Undo',
			toolbarId: 'File',
			text: 'Undo',
			command: editor.undo,
			enabled: false,
			horizontal: false,
			width: '4em',
			height: '4em',
			positionY: '0.7em',
			positionX: '10.2em',
			texturePositionX: -590,
			texturePositionY: -58
		})
		editor.buttons.redo = new ui.button({
			id: 'Redo',
			toolbarId: 'File',
			text: 'Redo',
			command: editor.redo,
			enabled: false,
			width: '4em',
			positionY: '5.0em',
			positionX: '10.2em',
			texturePositionY: -197
		})

		// Buttons for Clipboard
		ui.button({
			id: 'Cut',
			toolbarId: 'Clipboard',
			text: 'Cut',
			command: editor.handleCut,
			width: '5em',
			positionX: '0.5em',
			positionY: '0.7em',
			texturePositionY: -22
		})
		ui.button({
			id: 'Copy',
			toolbarId: 'Clipboard',
			text: 'Copy',
			command: editor.handleCopy,
			width: '5em',
			positionX: '0.5em',
			positionY: '2.8em',
			texturePositionY: 0
		})
		editor.buttons.paste = new ui.button({
			id: 'Paste',
			toolbarId: 'Clipboard',
			enabled: false,
			text: 'Paste',
			width: '5em',
			positionX: '0.5em',
			positionY: '4.9em',
			texturePositionY: -44
		})

		var itemsMenu = [{
			type: "Choice",
			settings: {
				id: 'Choice',
				texturePositionX: '-186px',
				texturePositionY: '-586px'
			},
			items: [{
				type: "DropDown",
				settings: {
					id: 'DropDown',
					texturePositionX: '-186px',
					texturePositionY: '-5px'
				},
				items: []
			}, {
				type: "Radio",
				settings: {
					id: 'RadioText',
					texturePositionX: '-186px',
					texturePositionY: '-586px'
				},
				items: []
			}, {
				type: "List",
				settings: {
					id: 'ListText',
					texturePositionX: '-286px',
					texturePositionY: '-586px'
				},
				items: []
			}]
		}, {
			type: "Binary",
			settings: {
				id: 'Binary',
				texturePositionX: '-186px',
				texturePositionY: '-88px'
			},
			items: [{
				type: "BinaryYesNo",
				settings: {
					id: 'BinaryYesNo',
					title: 'Yes/No',
					texturePositionX: '-186px',
					texturePositionY: '-88px'
				},
				items: []
			// }, {
			// 	type: "BinaryGender",
			// 	settings: {
			// 		id: 'BinaryGender',
			// 		title: 'Gender',
			// 		texturePositionX: '-286px',
			// 		texturePositionY: '-88px'
			// 	},
			// 	items: []
			}, {
				type: "BinaryTrueFalse",
				settings: {
					id: 'BinaryTrueFalse',
					title: 'True/False',
					texturePositionX: '-386px',
					texturePositionY: '-88px'
				},
				items: []
			}, {
				type: "ListCheck",
				settings: {
					id: 'ListCheck',
					title: 'Check',
					texturePositionX: '-486px',
					texturePositionY: '-88px'
				},
				items: []
			}]
		}, {
			type: "SortRate",
			settings: {
				id: 'SortRate',
				title: 'Sort/Rate',
				texturePositionX: '-286px',
				texturePositionY: '-255px'
			},
			items: []
		}, {
			type: "Open",
			settings: {
				id: 'Open',
				texturePositionX: '-186px',
				texturePositionY: '-170px'
			},
			items: [{
				type: "OpenSingleLine",
				settings: {
					id: 'OpenSingleLine',
					title: '1-Line',
					texturePositionX: '-186px',
					texturePositionY: '-170px'
				},
				items: []
			}, {
				type: "OpenMultipleLine",
				settings: {
					id: 'OpenMultipleLine',
					title: 'Multi-Line',
					texturePositionX: '-286px',
					texturePositionY: '-170px'
				},
				items: []
			}, {
				type: "OpenRichText",
				settings: {
					id: 'OpenRichText',
					title: 'Rich Text',
					texturePositionX: '-386px',
					texturePositionY: '-170px'
				},
				items: []
			}]
		}, {
			type: "Label",
			settings: {
				id: 'Label',
				texturePositionX: '-186px',
				texturePositionY: '-424px'
			},
			items: []
		}, {
			type: "Matrix",
			settings: {
				id: 'Matrix',
				enabled: true,
				texturePositionX: '-186px',
				texturePositionY: '-338px'
			},
			items: []
		}, {
			type: "Group",
			settings: {
				id: 'Group',
				enabled: true,
				texturePositionX: '-186px',
				texturePositionY: '-504px'
			},
			items: []
		}]

		ui.treeSelector({
			id: 'ItemChooser',
			toolbarId: 'Items',
			title: 'Insert Item',
			text: 'Description of Inserting',
			items: itemsMenu,
			width: '29em',
			positionY: '0.5em',
			events: {
				clickNode: editor.handleInsertAtTheEnd
			}
		})

		editor.board.addClass("DragArea")
		editor.createInsert(editor.board, true)

		// Check if editor help must be provided
		if (editor.showHelp()) {
			popOver({
				element: '#Items',
				title: frontendStrings.pages.editor.help.insertItem.title,
				content: frontendStrings.pages.editor.help.insertItem.content,
				placement: 'right'
			})
		}
	}

	/**
	 *
	 * Update data for settings dialog
	 *
	 */
	this.loadSettings = function (surveySettings) {
		this.dialogs.surveySettings.load(surveySettings)
	}

	/**
	 *
	 * Loads the survey name, theme and template (changing appareance if neccesary)
	 *
	 */
	this.loadHeaderAndStyle = function (surveyData) {
		//$scope.surveyName = surveyData.title;
		//$scope.$apply();
	}

	/**
	 *
	 * When user wants to load complete a full survey, this method most be used.
	 *
	 */
	this.loadSurvey = function (surveyData, differential) {
		// Load survey title, template and theme
		editor.loadHeaderAndStyle(surveyData)

		if (surveyData.items.length > 0) {
			editor.startSurveyEdition()

			// For each root item, find and load children
			editor.loadChildren(surveyData)

			// If not differential, remove items which are not in model
			if (differential == undefined) {
				editor.updateDeletedItemsFromModel(surveyData)
			}

			// Move items to the corresponding parent
			editor.updateParentFromModel(surveyData)

			// Sort items
			editor.updateOrderFromModel(surveyData)
		} else {
			// Just remove the all elements except the first insert
			editor.restartSurveyEditor(true)
		}
	}

	/**
	 *
	 * Refresh only items that are selected
	 *
	 */
	this.refreshSelectedItems = function () {
		editor.loadChildren(editor.getSurvey())
	}

	/**
	 *
	 * Insert or updates all childrens of provided element
	 * Parent should be already inserted in this method
	 *
	 */
	this.loadChildren = function (surveyData, parentElement) {
		if (parentElement == undefined) {
			parentElement = {
				id: '0'
			}
		}
		// Recurse through children, which for are Matrix or Group (Cols = Rows = 1)
		$(surveyData.items).filter(function (index) {
			return this.parentItemId == parentElement.id
		}).each(function (index, element) {
			utils.console("Restoring " + element.itemType + ": " + element.cell.y + "," + element.cell.x)
			// Check if item already exist
			var currentItem = editor.board.find('#RenderedItem' + element.id)
			var target = undefined
			var replace = false
			if (currentItem.size()) {
				// If item already exist, go to render it
				replace = true
			} else {
				// Render current item
				if (parentElement.id != '0') {
					utils.console("Loading Element " + element.itemType + " and parent " + parentElement.id)
					target = editor.board.find('#RenderedItem' + parentElement.id).children('.Item').children('.ItemContainer')
						.children('.MatrixTable').children('tbody').children('tr').eq(element.cell.y)
						.children('td').eq(element.cell.x).children('.SurveyInsert').last()
				}
			}
			// Finally render the item
			// Note that 'this' is passed to scan for changes in item and avoid full replacement
			editor.renderItem({
				id: element.id,
				type: element.itemType,
				model: element,
				containingElement: target,
				select: false,
				replace: replace
			}, this)

			// Now recurse
			editor.loadChildren(surveyData, element)
		})

	}

	/**
	 *
	 * Search for all items in survey board. Then delete those which no longer exist
	 *
	 */
	this.updateDeletedItemsFromModel = function (surveyData) {
		var elementIds = $.map(surveyData.items, function (element, index) {
			return element.id
		})
		$('.RenderedItem').each(function (index, element) {
			if ($.inArray($(this).data('itemData').id, elementIds) < 0) {
				editor.removeItem(this, 'skipUndo')
			}
		})
	}
	/**
	 *
	 * This is a prestep for ordering. This will ensure methods are in the correct
	 * cell
	 * with the correct parent. Next step in ordering assumes this holds
	 *
	 */
	this.updateParentFromModel = function (surveyData) {
		$.each(surveyData.items, function (index, element) {
			// Get the actual current element
			var currentElement = editor.board.find('#RenderedItem' + element.id)
			// And assign existing items to the correct cell and parent element
			var currentCell = editor.getItemCell(currentElement)
			if (editor.getParentItemId(currentElement) != element.parentItemId || element.cell.x != currentCell.x || element.cell.y != currentCell.y) {
				var targetInsert = editor.getTableCell(element, 0)
				currentElement.next().insertAfter(targetInsert)
				currentElement.insertAfter(targetInsert)
			}
		})
	}
	/**
	 *
	 * This updates ordering of all elements in itemData object, to reflect
	 * possible item moves
	 *
	 * Sort is doing by swapping elements, and must be done by level, recursively
	 *
	 */
	this.updateOrderFromModel = function (surveyData) {

		$.each(surveyData.items, function (index, element) {
			// Get the actual current element
			var currentElement = editor.board.find('#RenderedItem' + element.id)
			// Search the element placeholder which after this element should come
			var targetInsert = editor.getTableCell(element)
			if (!targetInsert.next().is(currentElement)) {
				// Object is not in place. Swap it.
				$(currentElement).swap(targetInsert.next())
			}
		})
	}

	/**
	 *
	 * By default, an empty survey has a insert item container with a secondary
	 * class to highlight content for a new survey
	 *
	 */
	this.startSurveyEdition = function (surveyData) {
		utils.console("Survey edition has started")
		// Reserved for logic of first inserted item
		editor.board.removeClass('DragArea')
		editor.board.filter('.SurveyInsert').removeClass('SurveyStartLegend')
		survey.firstItem = false
	}

	/**
	 *
	 * If items are deleted until the point that there are no more items, survey
	 * editor must be started. Parameter removeAllElements ensures no renderedItems remain
	 *
	 */
	this.restartSurveyEditor = function (removeAllElements) {
		utils.console("Restarting survey")

		// Reserved for logic of first inserted item
		editor.board.addClass("DragArea")

		// If any remaining element should be deleted also
		if (removeAllElements === true) {
			editor.board.find(':not(.SurveyInsert:first)').remove()
		}

		// Enable again the survey start legend
		editor.board.filter('.SurveyInsert').addClass('SurveyStartLegend')
		survey.firstItem = true
	}

	/**
	 *
	 * This method constructs or update elements on the editor board. When only options
	 * are passed, usually they are intended for building new items. On the other side,
	 * raw itemData may be provided to determine if an item has changed (to use in
	 * conjunction with replace: false;
	 *
	 * @param {Object} options the set of values which are required to create or update items
	 * @param {Object} itemData the raw data in the surveyModel.items format
	 *
	 */
	this.renderItem = function (options, itemData) {
		var renderOptions = $.extend({
			id: "",
			type: "unset",
			containingElement: undefined,
			model: {},
			select: true,
			replace: false
		}, options)

		// If user drags item from parent category (example, choice)
		// map it to a valid item type
		switch (renderOptions.type) {
			case 'Choice':
				renderOptions.type = 'RadioText'
				break
			case 'Radio':
				renderOptions.type = 'RadioText'
				break
			case 'List':
				renderOptions.type = 'ListText'
				break
			case 'Binary':
				renderOptions.type = 'BinaryYesNo'
				break
			case 'Open':
				renderOptions.type = 'OpenSingleLine'
				break
			case 'SortRate':
				renderOptions.type = 'RateRadioText'
				break
		}
		// Use the model to render an already created item
		var model = renderOptions.model

		// Use Id provided in model is available
		if (renderOptions.containingElement == undefined) {
			// If no containing element is provided, just append
			renderOptions.containingElement = editor.board.children('.SurveyInsert').last()
		}
		// Load or create item id
		var itemId = renderOptions.id != "" ? renderOptions.id : utils.randomId()

		// Load item type from model data. If there is no model data, use passed 'type'
		// parameter
		var itemType = model.itemType != undefined ? model.itemType : renderOptions.type

		// The group this item type corresponds
		var itemGroup = editor.parentItemType(itemType)

		// All objects need a container
		var container

		if (renderOptions.replace) {

			// Get a pointer to the container of the item to replace
			container = editor.board.find('#RenderedItem' + itemId)

			if (itemType != 'Matrix') {
				// Check itemData before trying replace to avoid replacing all elements
				if (areEqual(itemData, container.data('itemData'))) {
					utils.console('@ Item does not needs updating')
					return
				}
				container.find('.Item').first().empty()
			} else if (itemType != 'Group') {
				// Special case of matrices and groups, don't delete them, just add or
				// delete columns
				var widget = container.data('widget')
				widget.setRowCount(model.matrix.rows)
				widget.setColumnCount(model.matrix.cols)
				// Also restore widths
				widget.getColumns(widget.getRows().first()).each(function (index) {
					$(this).data('cellDimension', model.matrix.widths[index])
				})
				widget.refreshWidths({
					animate: false
				})
				return
			}
			// Special case: if a object has been moved, make cell data and parent be
			// consistent Not order! just cell and parent. This also apply to root elements
			var currentParentId = $.extend({ id: '0' }, container.parentsUntil('.RenderedItem, #SurveyEdition').data('itemData')).id
			if (currentParentId != model.parentItemId) {
				// Case 1: Object has wrong parent
				// This is the object (and placeholder) to move
				var prevPlaceholder = container.next().detach()
				var currentItem = container.detach()

				if (model.parentItemId != '0') {
					// Subcase 1: Object should be in a matrix. So we know parent has cell elements. Just move to the corresponding cell
					editor.board.find('#RenderedItem' + model.parentItemId).data('widget').getCell(model.cell.y, model.cell.x).append(currentItem).append(prevPlaceholder)
				} else {
					// Subcase 2: Object should be on root. Just append it
					editor.board.find('SurveyEdition').append(currentItem).append(prevPlaceholder)
				}
			} else if (model.parentItemId != '0') {
				// Case 2: Object has correct parent, and is a matrix. We need then assigning the correct cell
				// Preferably, if object did not move, do nothing
				var currentCell = editor.getItemCell(container)
				if (currentCell.x != model.cell.x || currentCell.y != model.cell.y) {
					var prevPlaceholder = container.next().detach()
					var currentItem = container.detach()
					editor.board.find('#RenderedItem' + model.parentItemId).data('widget').getCell(model.cell.y, model.cell.x).append(currentItem).append(prevPlaceholder)
				}
			}

		} else {
			utils.console("Creating item " + itemType)
			container = $('<div class="RenderedItem" id="RenderedItem' + itemId + '"><div class="Item"></div></div>').insertAfter(renderOptions.containingElement)
			// A new placeholder for inserting items
			editor.createInsert(container)
		}
		var item = container.find('.Item')

		if (itemType != 'Matrix' && itemType != 'Group') {
			container.droppable({
				drop: this.handleItemSwap,
				hoverClass: 'ItemContainerHover',
				accept: '.RenderedItem'
			})
		}

		// Setup draggable item to drag distance of 10 to avoid dragging accidentally
		container.draggable({
			distance: 10,
			containment: 'body',
			cursorAt: {
				top: 40,
				left: 50
			},
			cursor: 'move',
			helper: function () {
				// Trick: Extract the icon from the toolbar
				return ''
					+ '<div class="SurveyDraggingItem">' + $('#' + itemType).parent().html()
					+ '<div class="Legend">' + tr(UserUIStrings['DRAGGING_EXISTING'], itemType) + '</div>'
					+ '</div>'
			},
			revert: 'invalid',
			revertDuration: 150,
			zIndex: 10
		})
		container.on('click', {}, function (event) {
			editor.selectItem(this)
			// Avoid items inside the same matrix to unfocus inmediatly
			event.stopPropagation()
			utils.documentClick()
		})

		// Determine the parent of the containing element (used to identify if it is a matrix, group or none)
		var currentParent = $.extend({ id: '0' }, renderOptions.containingElement.closest('.RenderedItem, #SurveyEdition').data('itemData'))

		var defaultLayout = model.layout
		if (defaultLayout == undefined) {
			// For rows and columns of matrix elements (except first row and column), apply the NoLabel layout
			// Note that by default we use the last layout selected by the user
			defaultLayout = typeof editor.lastLayout == 'undefined' ? 'Right' : editor.lastLayout
			if (currentParent.itemType == 'Matrix') {
				// Check that we're not in the first row or column
				var cell = container.closest('td')
				if (cell.prev().length > 0 && cell.closest('tr').prev().length > 0) {
					defaultLayout = 'NoLabel'
				}
			}
		}
		// For binary items, default layout is horizontal
		var defaultOrientation = model.orientation != undefined ? model.orientation : (itemGroup == 'Binary' ? "Horizontal" : "Vertical")
		// Insert the new item using the item template and assigning
		// itemType as class
		var newItem = $('<div class="ItemContainer ' + itemType + ' ' + defaultLayout + ' ' + defaultOrientation + '"></div>').appendTo(item)

		// Finally, some default values to the model
		model = $.extend(true, {
			required: false,
			visibility: {
				inverted: false,
				rules: []
			},
			choice: {
				options: [],
				multiSelect: itemGroup === 'List',
				showIcon: true,
				other: {
					show: false,
					label: ORBaseUIStrings['DROPDOWN_OTHER'],
					hint: ORBaseUIStrings['DROPDOWN_OTHER_SPECIFY']
				}
			},
			open: {
				size: 'Medium HMedium',
				defaultText: ''
			},
			rate: {
				levels: 3,
				headerStyle: 'EachCell',
				headerLabels: '',
				headerCategory: undefined
			}
		}, model)

		switch (itemType) {
			case "Label":
				container.data('widget', new editor.ui.label({
					label: model.label,
					container: newItem
				}))
				break
			case "DropDown":
				model.choice = $.extend({
					options: {}
				}, model.choice)
				container.data('widget', new editor.ui.dropDown({
					label: model.label,
					options: model.choice.options,
					required: model.required,
					container: newItem,
					layout: defaultLayout
				}))
				break
			case "RadioText":
			case "RadioImage":
			case "RadioVideo":
			case "RadioHTML":
			case "ListText":
			case "ListImage":
			case "ListVideo":
			case "ListHTML":
			case "BinaryYesNo":
			// case "BinaryGender":
			case "BinaryTrueFalse":
			case "ListCheck":
				model.choice = $.extend({
					options: []
				}, model.choice)
				container.data('widget', (new editor.ui.listChoice({
					type: itemType,
					label: model.label,
					required: model.required,
					options: model.choice.options,
					container: newItem,
					multiSelect: model.choice.multiSelect,
					showIcon: model.choice.showIcon,
					layout: defaultLayout,
					other: model.choice.other
				})).widget)
				break
			case "Matrix":
			case "Group":
				var defaultRows = 2
				var defaultColumns = 2
				if (itemType == 'Group')
					defaultRows = defaultColumns = 1

				model.matrix = $.extend({
					rows: defaultRows,
					cols: defaultColumns,
					widths: [{ dimension: 0, unit: 'Percent' }, { dimension: 0, unit: 'Percent' }]
				}, model.matrix)

				var matrixSettings = {
					container: newItem,
					rows: model.matrix.rows,
					cols: model.matrix.cols,
					widths: model.matrix.widths
				}

				container.data('widget', new editor.ui.matrix({
					container: newItem,
					rows: model.matrix.rows,
					cols: model.matrix.cols,
					widths: model.matrix.widths,
					showToolbars: itemType == 'Matrix'
				}))
				break
			case 'OpenSingleLine':
			case 'OpenMultipleLine':
			case 'OpenRichText':
				container.data('widget', new editor.ui.open({
					type: itemType,
					label: model.label,
					container: newItem,
					required: model.required,
					open: model.open,
					multipleLine: false,
					richText: false
				}))
				break
			case 'RateRadioText':
			case 'RateRadioImage':
			case 'RateRadioVideo':
			case 'RateRadioHTML':
				model.choice = $.extend({
					options: []
				}, model.choice)
				container.data('widget', (new editor.ui.rank({
					type: itemType,
					label: model.label,
					container: newItem,
					levels: model.rate.levels,
					headerStyle: model.rate.headerStyle,
					headerLabels: model.rate.headerLabels,
					headerCategory: model.rate.headerCategory,
					options: model.choice.options,
					required: model.required
				})).widget)
				break
			default:
				item.html("<div>Item <b>" + itemType + "</b> not implemented</div>")
		}

		// Append a Clear both for items that have float elements
		$('<div style="clear: both"></div>').appendTo(newItem)

		// Add right click menu
		new ui.contextMenu({
			container: container,
			commands: [
				{
					label: 'Cut',
					command: editor.handleCut
				}, {
					label: 'Copy',
					command: editor.handleCopy
				}, {
					label: 'Paste',
					command: editor.handleReplace,
					condition: editor.clipboardSize
				}, {
					label: 'Paste Rules',
					command: editor.handleReplaceRules,
					condition: editor.clipboardSize
				}, {
					label: 'Convert To',
					command: $.noop,
					subcommands: editor.getConvertableCommands(itemType)
				}, {
					label: 'Delete', command: editor.remove
				}
			],
			events: {
				onShow: function (event) {
					editor.selectItem(container)
				}
			}
		})

		// Use current Id, or load a new one
		container.data('itemData', {
			id: itemId,
			itemType: renderOptions.type,
			title: renderOptions.type,
			parentItemId: 0,
			visibility: model.visibility,
			layout: defaultLayout,
			orientation: defaultOrientation,
			required: model.required,
			choice: model.choice,
			open: model.open,
			rate: model.rate
		})

		// Set the new item as selected
		if (renderOptions.select)
			editor.selectItem(container)

		return container
	}

	/**
	 * For each object type, generate a list of subcommands, in ContextMenu
	 * format, of option types that this item may be converted
	 */
	this.getConvertableCommands = function (type) {
		// Where results will be returned
		var subcommands
		// A hash with all item types, in subcommand format

		var itemTypesSubCommands = {}
		$.each(itemTypes, function (index, element) {
			itemTypesSubCommands[element] = {
				label: editorStrings[element + "_NAME"],
				command: editor.handleChangeItemType,
				data: {
					targetType: element
				}
			}
		})

		switch (type) {
			case "Label":
			case "DropDown":
			case "RadioText":
			case "RadioImage":
			case "RadioVideo":
			case "RadioHTML":
			case "ListText":
			case "ListImage":
			case "ListVideo":
			case "ListHTML":
			case "BinaryYesNo":
			// case "BinaryGender":
			case "BinaryTrueFalse":
			case "ListCheck":
				// First build the compatible list item types, excluding
				// its own type
				subcommands = $(itemTypes).filter(function () {
					return this != type && this != 'Matrix' && this != 'Label' && this != 'ListCheck' && this != 'Group' && editor.parentItemType(this) != 'Open'
				}).map(function () {
					return itemTypesSubCommands[this]
				}).get()

		};
		return subcommands
	}

	/**
	 *
	 * Activates or deactivates the autosave feature. It must be noted that
	 * this value is stored in user profile
	 *
	 */
	this.handleAutoSave = function () {
		// Update the editor value for the autoSave
		editor.autoSave = editor.buttons.autoSave.getValue()
		// Apply the new autoSave
		editor.updateAutoSave()
		if (typeof events.onToggleAutoSave === 'function') {
			events.onToggleAutoSave(editor.autoSave)
		}
	}


	/**
	 *
	 * Activates or disables the timer that will trigger the save event
	 *
	 */
	this.updateAutoSave = function () {
		if (editor.autoSave) {
			// Start the timer so autosave is invoked
			editor.autoSaveTimer =  setInterval(function() {
				survey.save(false, true);
			}, 60000);
		} else {
			if (editor.autoSaveTimer >= 0) {
				clearInterval(editor.autoSaveTimer);
			}
		}
	}

	/**
	 * Handles the issued "Convert To" command as indicated by user
	 */
	this.handleChangeItemType = function (item) {
		utils.console("Changing item to " + item.targetType)

		var currentSurveyState = editor.getSurvey()
		var reducedItemsArray = []

		$.each(editor.getSelectedItems(), function (index, element) {
			// Query item data
			var itemId = $(element).data('itemData').id
			// Overwrite it
			reducedItemsArray.push($(currentSurveyState.items).filter(function (index) {
				if (this.id == itemId) {
					currentSurveyState.items[index].itemType = item.targetType
					return true
				}
				return false
			}).get()[0])
		})
		currentSurveyState.items = reducedItemsArray
		// Refresh the view
		editor.loadChildren(currentSurveyState)
		// Refresh properties pane
		editor.showProperties()
	}

	/**
	 * Generate a placeholder for dragging new items
	 */
	this.createInsert = function (target, append) {
		if (target == undefined)
			target = editor.board.children('.RenderedItem').last()

		// HTML content for insert new item area
		var insertHTML = '<div class="SurveyInsert">' + editorStrings['INSERT_NEW_ITEM'] + '<div class="PasteLegend">' + editorStrings['INSERT_NEW_ITEM_PASTE'] + '</div>' + '</div>'
		var newSpacer
		if (append == undefined)
			newSpacer = $(insertHTML).insertAfter(target)
		else
			newSpacer = $(insertHTML).appendTo(target)

		// Add droppable behavior, to accept sorting and new items
		newSpacer.droppable({
			drop: editor.handleItemInsert,
			hoverClass: 'ItemContainerHover',
			accept: '.Item, .RenderedItem'
		})
		newSpacer.on({
			'mouseenter': function (event) {
				if (editor.clipboardSize() > 0)
					$(this).addClass('ShowPaste')
			},
			'mouseleave': function (event) {
				$(this).removeClass('ShowPaste')
			},
			'click': function (event) {
				if (editor.clipboardSize() > 0)
					editor.paste(newSpacer)
			}
		})
		return newSpacer
	}

	/**
	 *
	 * This handle is invoked when items are reordered using mouse
	 *
	 */
	this.handleItemSwap = function (event, ui) {
		// Call the swap routine
		editor.swapItems(ui.draggable, $(this))
	}

	/**
	 *
	 * Receive two items and swap them
	 *
	 */
	this.swapItems = function (itemA, itemB) {
		// Also move properties panels
		$(itemA).swap(itemB)
	}

	/**
	 *
	 * Called when a new item is dragged over a item container. It may be a new
	 * item from toolbar, or an existing item
	 *
	 */
	this.handleItemInsert = function (event, ui) {
		// validate first if is an existing item
		if ($(ui.draggable).hasClass('RenderedItem')) {
			// If target operation is with the same element, just ignore
			if ($(ui.draggable).next().is($(this)) || $(this).next().is(ui.draggable))
				return

			// Move items
			editor.moveItem($(this), ui.draggable)
		} else {
			// Create the a new item. Type is in the ID of the dragged item
			editor.insertItem({
				containingElement: $(this),
				type: ui.draggable.attr('id')
			})
		}
	}

	/**
	 *
	 * Handler that creates a shortcut to insert items using
	 * a single click (without drag). Item will be inserted
	 * at the bottom of the survey. Also, if necesary, editor
	 * will self scroll to that position
	 *
	 */
	this.handleInsertAtTheEnd = function (event) {
		utils.console("Insert Item: " + event.itemType)
		// Add the new item selecting the last survey insert placeholder
		editor.insertItem({
			containingElement: editor.board.children('.SurveyInsert:last'),
			type: event.itemType // Each node returns this to the handler
		})
		// Apply the scrolling direct to the bottom
		$('body').animate({
			scrollTop: $('body').prop('scrollHeight')
		}, {
			queue: false,
			duration: 600,
			easing: 'linear'
		})
	}

	/**
	 *
	 * Moves an existing item to another insert placeholder
	 *
	 */
	this.moveItem = function (targetContainer, item) {
		$(item).next().insertAfter(targetContainer)
		$(item).insertAfter(targetContainer)
	}

	/**
	 *
	 * Called when user drags a new item from toolbar into board. It checks that
	 * current
	 * dragged element
	 *
	 */
	this.insertItem = function (options) {
		// If target object is undefined, take last
		if (options.containingElement == undefined)
			options.containingElement = $('.SurveyInsert').last()

		// Check if this is first item, to remove start leyends and formats
		var showHelpAfterInserting = survey.firstItem
		if (survey.firstItem) {
			editor.startSurveyEdition()
		}

		// Generate Item and add its HTML view
		var newItem = editor.renderItem(options)

		if (showHelpAfterInserting && editor.showHelp()) {
			popOverTour([
				{
					element: '.RenderedItem:first',
					title: frontendStrings.pages.editor.help.selectItem.title,
					content: frontendStrings.pages.editor.help.selectItem.content,
					placement: 'top'
				},
				{
					element: '#Properties',
					title: frontendStrings.pages.editor.help.itemProperties.title,
					content: frontendStrings.pages.editor.help.itemProperties.content,
					placement: 'bottom'
				},
				{
					element: '#GetCode',
					title: frontendStrings.pages.editor.help.publish.title,
					content: frontendStrings.pages.editor.help.publish.content,
					placement: 'bottom'
				}
			])
		}

		return newItem
	}

	/**
	 *
	 * Helper invoked when object is going to be deleted
	 *
	 */
	this.removeItem = function (item) {
		$(item).next().remove()
		$(item).remove()

		// Check if it was the only item, so survey looks agains like new
		if (editor.board.find('.RenderedItem').size() == 0) {
			editor.restartSurveyEditor()
		}
	}

	/**
	 *
	 * When an operation is done, the inverse operation must be stored in the
	 * array of operations for "Undo" operation. Format is: {type:
	 * 'OperationType', data: { Data of Undo } }
	 *
	 */
	this.addUndoOperation = function (useStoredState) {
		// Record the current state of the editor
		// TODO: Use differential scanning to avoid flooding stack
		utils.console("adding undo (stored: " + useStoredState === true + ")")
		editor.undoStack.push(useStoredState === true ? editor.currentState : editor.getSurvey())
		// Enable UNDO button (just when there is one item, to avoid double event
		// mapping)
		if (editor.undoStack.length == 1)
			editor.buttons.undo.setEnabled(true)
	}

	/**
	 *
	 * A special case is operations that may change DOM, so that the undo must be
	 * stored before a change notifications (think of the sortable lists). So, the
	 * storage location will be another temp var
	 *
	 */
	this.storeCurrentState = function () {
		utils.console("Storing current state")
		editor.currentState = editor.getSurvey()
	}

	/**
	 *
	 * Allows registering methods for undo and redo operations (before them)
	 *
	 */
	this.registerMethodForUndoOperation = function (targetFunctionName) {
		var targetFunction = this[targetFunctionName]
		this[targetFunctionName] = (function (targetFunctionName, targetFunction) {
			return function () {
				var returnValue
				if (arguments[arguments.length - 1] !== 'skipUndo') {
					editor.addUndoOperation()
					returnValue = targetFunction.apply(this, arguments)
					editor.surveyChanged()
				} else {
					utils.console("Skipping undo")
					arguments[arguments.length - 1] = undefined
					returnValue = targetFunction.apply(this, arguments)
				}
				return returnValue
			}
		})(targetFunctionName, targetFunction)
	}

	/**
	 *
	 * Take the top element on undo queue, apply the undo operation and move
	 * that element to the redo queue
	 *
	 */
	this.undo = function () {
		if (editor.undoStack.length > 0) {
			// Add current state to the redo stack
			editor.redoStack.push(editor.getSurvey())
			// Extract last state from state
			var lastState = editor.undoStack.pop()
			// Load survey state
			editor.loadSurvey(lastState)
			// Enable REDO button (just when there is one item, to avoid double event
			// mapping)
			utils.console('Redo stack: ' + editor.redoStack.length)
			if (editor.redoStack.length == 1)
				editor.buttons.redo.setEnabled(true)
		}

		// If there are no more items, disable button
		if (editor.undoStack.length == 0)
			editor.buttons.undo.setEnabled(false)

		// Set the properties panel to refresh itself
		editor.showProperties()
	}

	/**
	 *
	 * Take the top element on the redo queue, apply the do operation and return
	 * it to the undo queue
	 *
	 */
	this.redo = function () {
		if (editor.redoStack.length > 0) {
			var previousState = editor.redoStack.pop()
			// Add current state to undo stack
			editor.addUndoOperation()
			// Load survey state
			editor.loadSurvey(previousState)
		}

		// If there are no more items, disable button
		if (editor.redoStack.length == 0)
			editor.buttons.redo.setEnabled(false)

		// Set the properties panel to refresh itself
		editor.showProperties()
	}

	/**
	 *
	 * Certain operations will clear the redo stack
	 *
	 */
	this.clearRedoStack = function () {
		// Delete all redo stack
		editor.redoStack = []
		// Disable redo button
		editor.buttons.redo.setEnabled(false)
	}

	/**
	 *
	 * Add selected item(s) to clipboard
	 *
	 */
	this.handleCut = function () {
		if (editor.getSelectedItems().length > 0)
			editor.cut()
	}

	this.cut = function () {
		editor.clipboardOption = ClipboardOptions.cut
		editor.cutOrCopy()
	}

	this.handleCopy = function () {
		if (editor.getSelectedItems().length > 0)
			editor.copy()
	}

	this.copy = function () {
		editor.clipboardOption = ClipboardOptions.copy
		editor.cutOrCopy()
	}

	this.cutOrCopy = function () {
		editor.updateSurveyModel()
		editor.clipboard = $.map(editor.getSelectedItems(), function (element, index) {
			var itemData = $(element).data('itemData')
			if (editor.clipboardOption == ClipboardOptions.cut)
				editor.removeItem($('#RenderedItem' + itemData.id), 'skipUndo')
			return itemData
		})
		// Enable paste button
		editor.buttons.paste.setEnabled(true)
	}

	/**
	 *
	 * Paste items on clipboard to the target container
	 *
	 */
	this.handlePaste = function (target) {
		if (editor.clipboard.length > 0)
			editor.paste()
	}

	this.paste = function (target) {
		editor.startSurveyEdition()
		$.each(editor.clipboard, function (index, elementData) {
			// render the new item, passign element data as model
			editor.renderItem({
				type: elementData.itemType,
				containingElement: target,
				model: elementData
			})
		})
		// If operation was cut, clean clipboard
		if (editor.clipboardOption == ClipboardOptions.cut) {
			editor.clearClipboard()
		}
	}

	/**
	 *
	 * Used when we're completely sure we want to replace selection
	 * with clipboard contents
	 *
	 */
	this.handleReplace = function () {
		// First if the are items
		if (editor.selectedItems.length > 0) {
			editor.replace()
		}
	}

	/**
	 *
	 * Apply visibility rules to selected items from clipboard item
	 *
	 */
	this.handleReplaceRules = function () {
		$.each(editor.getSelectedItems(), function (index, element) {
			// To the selected item
			$.each(editor.clipboard, function (index, elementData) {
				// Paste the visibility
				$(element).data('itemData').visibility = elementData.visibility
			})
		})

		// Refresh the properties panel (since rules label may changed)
		editor.showProperties()

		// If operation was cut, clean clipboard
		if (editor.clipboardOption == ClipboardOptions.cut) {
			editor.clearClipboard()
		}
	}

	this.replace = function () {
		// Get a pointer to the element before elements to be removed
		var prev = $("#RenderedItem" + editor.selectedItems[0]).prev()
		editor.remove('skipUndo')
		editor.paste(prev, 'skipUndo')
	}

	/**
	 *
	 * Helps cleaning the clipboard contents
	 *
	 */
	this.clearClipboard = function () {
		editor.clipboard = []
		editor.buttons.paste.setEnabled(false)
	}

	this.clipboardSize = function () {
		return editor.clipboard.length
	}

	/**
	 *
	 * Survey changes has two objectives:
	 *  - Tell editor about changes, so that if user tryes to leave without saving we
	 * know it
	 *  - Clear the Redo stack. You can't redo on a changed survey
	 *
	 */
	this.surveyChanged = function () {
		editor.clearRedoStack()
		editor.surveyHasChanged = true
		if (typeof events.onSurveyChanged === 'function') {
			events.onSurveyChanged()
		}
	}

	/**
	 *
	 * Launches a preview of the window in inside a Dialog
	 *
	 */
	this.handlePreview = function () {
		utils.console("Previewing survey")
		var contentPlaceholder = editor.dialogs.surveyPreview.getContentPlaceholder()
		// Survey placeholders must have an Id set
		contentPlaceholder.attr('id', 'surveyPreview' + utils.randomId())
		contentPlaceholder.wrap('<div class="Preview"></div')

		// Make sure Settings state is updated
		editor.dialogs.surveySettings.updateState()
		// Make true to make getSurvey return settings too
		editor.dialogs.surveySettings.hasChanged = true

		// Load a survey in test mode
		var surveyData = {
			testMode: true,
			surveyId: 'surveyPreview' + utils.randomId(),
			containerId: contentPlaceholder.attr('id'),
			height: 290,
			controlClass: 'form-control',
			data: editor.getSurvey(),
			animation: {
				show: {
					delay: 250
				}
			}
		}
		OverResponse.respondant.launchSurvey(surveyData);

		editor.dialogs.surveyPreview.show()
	}

	this.handlePublish = function () {

		// Save the changes on the survey before publishing. If don't
		// a surveyId may not be available
		if (survey.id == '') {
			survey.save(editor.showPublish)
		} else {
			// If an Id is available, then show the dialog directly
			editor.showPublish()
		}

	}

	this.handleEditDisplayRules = function () {
		utils.console("Showing the Display Rules")

		// Select the content placeholder all dialogs have
		var contentPlaceholder = editor.dialogs.displayRules.getContentPlaceholder()
		contentPlaceholder.empty()

		// Add the code for the panel
		$('<h4><div><div id="DisplayRuleMain"></div><div class="DisplayRulesIntro">' + editorStrings['DISPLAY_RULES_MAIN_ACTION'] + '<div></div></h4>').appendTo(contentPlaceholder)
		$('<div class="GenericSpacer" />').appendTo(contentPlaceholder)
		var rulesContainer = $('<div class="RulesContainer"></div>').appendTo(contentPlaceholder)
		var noRulesYet = $('<div class="alert alert-error"><h4>' + editorStrings['DISPLAY_RULES_NONE_TITLE'] + '</h4>' + editorStrings['DISPLAY_RULES_NONE_MSG'] + '</div>').appendTo(contentPlaceholder)
		$('<h4>' + editorStrings['DISPLAY_RULES_SELECT'] + '</h4>').appendTo(contentPlaceholder)
		$('<div id="DisplayRulePreview"></div>').appendTo(contentPlaceholder)

		// Get the item data
		var element = editor.getSelectedItems()[0]
		var itemData = $(element).data('itemData')

		// Create the selector determine if rule is inverted
		var mainSelector = new ui.selector({
			id: 'DisplayRuleMainSelector',
			container: $('#DisplayRuleMain'),
			options: [
				{
					label: editorStrings['DISPLAY_RULES_MAIN_ACTION_SHOW'],
					html: editorStrings['DISPLAY_RULES_MAIN_ACTION_SHOW_DESCRIPTION']
				},
				{
					label: editorStrings['DISPLAY_RULES_MAIN_ACTION_HIDE'],
					html: editorStrings['DISPLAY_RULES_MAIN_ACTION_HIDE_DESCRIPTION']
				}
			],
			command: function (newValue) {
				itemData.visibility.inverted = newValue === 'Hide'
			}
		}).setValue(itemData.visibility.inverted ? 'Hide' : 'Show')

		// Make sure Settings state is updated
		editor.dialogs.surveySettings.updateState()
		// Make true to make getSurvey return settings too
		editor.dialogs.surveySettings.hasChanged = true

		// Load a survey in test modecontentPlaceholder
		var testSurveyId = 'surveyPreview' + utils.randomId()
		var surveyData = {
			testMode: true,
			surveyId: testSurveyId,
			containerId: 'DisplayRulePreview',
			height: 250,
			scrollingMode: 'Classic',
			template: 'ButtonLess',
			hideCommands: true,
			data: editor.getSurvey()
		}
		OverResponse.respondant.launchSurvey(surveyData);

		$('<div class="GenericSpacer" />').appendTo(contentPlaceholder)

		// The ADD Rule button
		$('<div>'
			+ '<div style="float: left"><button id="ResetSingleRuleButton" class="btn btn-small" type="button">' + editorStrings['DISPLAY_RULES_CLEAR_RULE'] + '</button></div>'
			+ '<div style="float: right"><button id="SaveSingleRuleButton" class="btn btn-small btn-primary" type="button">' + editorStrings['DISPLAY_RULES_ADD_RULE'] + '</button></div>').appendTo(contentPlaceholder)
		$('<div class="GenericSpacer" />').appendTo(contentPlaceholder)

		// Draw the current ruleSet bellow the header
		function renderRules() {
			if (itemData.visibility.rules.length == 0) {
				rulesContainer.css('display', 'none')
				noRulesYet.css('display', 'block')
			} else {
				rulesContainer.css('display', 'block')
				noRulesYet.css('display', 'none')
				rulesContainer.empty()
				$.each(itemData.visibility.rules, function (index) {
					var ruleContainer = $('<div class="RuleContainer"><div class="ORCondition"><span class="badge badge-important">' + editorStrings['DISPLAY_RULES_OR'] + '</span></div><div class="RemoveRule Iconset"></div></div>').appendTo(rulesContainer)
					ruleContainer.find('.RemoveRule').click(function () {
						itemData.visibility.rules.splice(index, 1)
						renderRules()
					})
					$.each(this.ruleSet, function (key, value) {
						// Get the label of the item
						var item = editor.getItemByIdFromModel(editor.getSurvey(), key)
						if ($.isArray(value)) {
							// ListCheck items have array format
							value = value.join(', ')
						} else if (typeof value == 'object') {
							// Rate/Group use an object
							value = $.map(value, function (value, key) {
								return key + '/' + (value >= 0 ? value : editorStrings['DISPLAY_RULES_UNASSIGNED'])
							}).join(', ')
						}

						$('<div class="SingleRule">' + tr(editorStrings['DISPLAY_RULES_ITEM'], item.label, value) + '<div class="ORCondition"><span class="badge badge-warning">' + editorStrings['DISPLAY_RULES_AND'] + '</span></div></div>').appendTo(ruleContainer)
					})
				})
			}
			// To refresh the label with the number of rules
			editor.showProperties()
		}
		// For to draw all the rules
		renderRules()

		$('#SaveSingleRuleButton').click(function () {
			var responses = OverResponse.respondant.getResponses(testSurveyId)
			utils.c(responses)
			if ($.map(responses, function (n, i) { return i }).length == 0) {
				notify({
					type: 'Error',
					message: editorStrings['DISPLAY_RULES_EMPTY']
				})
			} else {
				itemData.visibility.rules.push({
					inverted: false,
					ruleSet: responses
				})
				// Reset the selection
				OverResponse.respondant.resetResponses(testSurveyId)
				notify(editorStrings['DISPLAY_RULES_ADDED'])

				// Update item data with new display rules
				$(element).data('itemData', itemData)
			}

			renderRules()
		})

		// Bind the Reset rule action
		$('#ResetSingleRuleButton').click(function () {
			OverResponse.respondant.resetResponses(testSurveyId)
		})

		// Show the dialog
		editor.dialogs.displayRules.show()
	}

	/**
	 *
	 * Shows the publish dialog. Note that it is separated from handle publish
	 * since the later must save changes to the survey
	 *
	 */
	this.showPublish = function () {

		utils.console("Getting the code for survey")

		// Select the content placeholder all dialogs have
		var contentPlaceholder = editor.dialogs.publish.getContentPlaceholder()
		contentPlaceholder.empty()

		// Link to su.rvey.me
		contentPlaceholder.append('<h3><span class="PublishOption">1</span>' + editorStrings['PUBLISH_SHARE_A_LINK'] + '</h3>')
		contentPlaceholder.append('<div><div class="PublishContainer">' + editorStrings['PUBLISH_SHARE_A_LINK_DESCRIPTION'] + '</div></div>')

		var surveyLink = "https://su.rvey.me/" + survey.shortId
		var linkContent = $('<div><div class="PublishContainer"><textarea class="CodePlaceholder PublishLink form-control">' + surveyLink + '</textarea></div></div>').appendTo(contentPlaceholder)
		contentPlaceholder.append('<div><div class="PublishContainer">' + editorStrings['PUBLISH_TRY_SURVEY'] + ': <a href="' + surveyLink + '" target="_blank">' + surveyLink + '</a></div></div>')

		contentPlaceholder.append('<h3><span class="PublishOption">2</span>' + editorStrings['PUBLISH_USE_API'] + '</h3>')
		contentPlaceholder.append('<div><div class="PublishContainer">' + editorStrings['PUBLISH_USE_API_DESCRIPTION'] + ': <a href="//docs.overresponse.com/" target="_blank">docs.overresponse.com</a></h4>'+ '</div></div>')

		// Select the text in the textarea when user clicks on it
		$('.CodePlaceholder').on('click', function () {
			$(this).select()
		})

		// Show the dialog
		editor.dialogs.publish.show()

	}

	this.unselectItems = function (removeProperties) {
		// Trigger blur for any editable textarea
		// $('textarea').trigger('blur');
		// First remove any other selected item
		$('.RenderedItem').removeClass("Selected")
		var propertiesPanel = $('#Properties')
		propertiesPanel.find('.Fields').empty()
		if (removeProperties)
			propertiesPanel.fadeOut(100)
	}

	/**
	 * This method is invoked to select any item on the editor board
	 */
	this.selectItem = function (selectedItem) {
		// If item is already selected, do nothing
		if (!$(selectedItem).hasClass('Selected')) {
			editor.unselectItems(false)

			// Mark selected item as Selected
			$(selectedItem).addClass("Selected")

			// Update array of selected items indices
			editor.selectedItems = []
			editor.selectedItems.push($(selectedItem).data('itemData').id)

			// Call to the method that will setup properties panel
			editor.showProperties(selectedItem)
		}
	}
	// Closes Item Select

	/**
	 * Handles change in layout
	 */
	this.handleLayoutSelect = function (selectedValue) {
		$.each(editor.getSelectedItems(), function (index, element) {
			// Remember that each element in selectedItems is the DOM Element.

			// Query item data
			var itemData = $(element).data('itemData')
			itemData.layout = selectedValue
			// Update item data with new layout
			$(element).data('itemData', itemData)
			// Get the DOM object that is selected
			var targetItem = $(element).find('.ItemContainer:first')

			// If new layout is element at top, chage switch label and selector
			if (!targetItem.hasClass('Top') && selectedValue == 'Top') {
				$(targetItem.find('.UIElement')).swap(targetItem.find('.LabelContainer'))
			} else if (targetItem.hasClass('Top') && selectedValue != 'Top') {
				$(targetItem.find('.LabelContainer')).swap(targetItem.find('.UIElement'))
			}
			// Reset previous layouts
			targetItem.removeClass('Top Bottom Left Right NoLabel')

			targetItem.addClass(selectedValue)
		})

		// Set the last layout as default to new items to be inserted (see renderItem)
		editor.lastLayout = selectedValue
	}

	/**
	 * Handles change in orientation
	 */
	this.handleOrientationSelect = function (selectedValue) {
		$.each(editor.getSelectedItems(), function (index, element) {
			// Remember that each element in selectedItems is the DOM Element.

			// Query item data
			var itemData = $(element).data('itemData')
			itemData.orientation = selectedValue
			// Update item data with new layout
			$(element).data('itemData', itemData)
			// Get the DOM object that is selected
			var targetItem = $(element).find('.ItemContainer')

			// Reset previous layouts
			targetItem.removeClass('Horizontal Vertical')

			targetItem.addClass(selectedValue)
		})
	}

	/**
	 * Handles header style for rank items
	 */
	this.handleHeaderStyleSelect = function (selectedValue) {
		$.each(editor.getSelectedItems(), function (index, element) {
			// Remember that each element in selectedItems is the DOM Element.

			// Query item data
			var itemData = $(element).data('itemData')
			itemData.rate.headerStyle = selectedValue
			// Update item data with new header style
			$(element).data('itemData', itemData)
			// Get the DOM object that is selected
			var targetItem = $(element).find('.ItemContainer')

			// Reset previous layouts
			targetItem.removeClass('TwoLabels ThreeLabels EachCell OnlyAttributeHeader NoHeadings')

			targetItem.addClass(selectedValue)

			$(element).data('itemData').rate.headerStyle = selectedValue
			$(element).data('widget').setHeaderStyle(selectedValue)
		})
	}

	/**
	 * Handles change in size, for Open ended items
	 */
	this.handleChangeSize = function (selectedValue) {
		$.each(editor.getSelectedItems(), function (index, element) {
			// Set the new size
			$(element).data('itemData').open.size = selectedValue
			// Reset previous layouts
			var targetItem = $(element).find('.InputItem:first, .TextAreaItem:first, .TextEditor:first')
			targetItem.removeClass('Small Medium Large Maximum HSmall HMedium HLarge').addClass(selectedValue)
		})
	}


	/**
	 * Handles enable or disable of multi select property for List items
	 * TODO: Validate that selection be only Choice items. If not done, an
	 * error will be triggered
	 */
	this.handleChoiceMultiSelect = function (selectedValue) {
		$.each(editor.getSelectedItems(), function (index, element) {
			// Update item data with the new multiSelect value
			$(element).data('itemData').choice.multiSelect = selectedValue
		})
	}

	/**
	 * Handles enable or disable of required property, common to all item types
	 */
	this.handleRequired = function (selectedValue) {
		$.each(editor.getSelectedItems(), function (index, element) {
			// Update item data with the new multiSelect value
			$(element).data('itemData').required = selectedValue
		})
	}

	/**
	 * Handles enable or disable of icons for binary items
	 * TODO: Validate that selection be only Binary items. If not done, an
	 * error will be triggered
	 */
	this.handleShowHideBinaryIcon = function (selectedValue) {
		$.each(editor.getSelectedItems(), function (index, element) {
			// Update item data with the new showIcon value
			$(element).data('itemData').choice.showIcon = selectedValue
			// Apply the class .Iconless
			var optionsTag = $(element).find('.Options:first')
			if (selectedValue) {
				optionsTag.removeClass('IconLess')
			} else {
				optionsTag.addClass('IconLess')
			}
		})
	}

	/**
	 * Handles when user changes the scale of a group of checkboxes
	 */
	this.handleChangeRateScale = function (selectedValue) {
		var levels = parseInt(selectedValue)
		utils.console("RateScale - New total: " + levels)
		$.each(editor.getSelectedItems(), function (index, element) {
			// First, re-scale checkboxes
			$(element).data('itemData').rate.levels = levels
			$(element).data('widget').setLevels(levels)
		})
	}

	/**
	 * Handles when user changes the scale of a group of checkboxes
	 */
	this.handleHasOther = function (selectedValue) {
		utils.console("Add/Remove Other Field " + selectedValue)
		$.each(editor.getSelectedItems(), function (index, element) {
			// Show or hide other
			$(element).data('itemData').choice.other.show = selectedValue
			$(element).data('widget').setOther(selectedValue)
		})
	}

	this.handleChangeTheme = function (selectedValue) {
		utils.console("Changing theme to " + selectedValue)
		$('head').append('<link rel="stylesheet" type="text/css" href="/stylesheets/respondant/themes/' + selectedValue + '/default.css" />')
	}

	/**
	 * Returns the jquery objects associated with selected items
	 */
	this.getSelectedItems = function () {
		return editor.board.find('.RenderedItem').filter(function () {
			return $.inArray($(this).data('itemData').id, editor.selectedItems) != -1
		})
	}


	/**
	 * Returns the parent item type
	 */
	this.parentItemType = function (itemType) {
		var radioPattern = /^Radio/
		var listPattern = /^List/
		var binaryPattern = /^Binary/
		var openPattern = /^Open/
		var ratePattern = /^Rate/
		if (radioPattern.test(itemType))
			return "Radio"
		if (listPattern.test(itemType))
			return "List"
		if (binaryPattern.test(itemType))
			return "Binary"
		if (openPattern.test(itemType))
			return "Open"
		if (ratePattern.test(itemType))
			return "Rate"

		return itemType
	}

	/**
	 * Populates properties group on toolbar
	 */
	this.showProperties = function (item) {
		if (typeof item === 'undefined') {
			// Temporally, set as selected the last of the items
			// Check that at least one item is selected
			if (editor.getSelectedItems().length > 0) {
				if (editor.getSelectedItems().length == 1) {
					item = (editor.getSelectedItems())[0]
				} else {
					// TODO: Set virtual item of Grouped items
				}
			} else {
				editor.hideProperties()
			}
		}

		// Check the case, after undo or redo, that the selected item was removed
		if (typeof $(item).data('itemData') == 'undefined') {
			editor.selectItem(editor.board.find('.RenderedItem').last())
			return
		}

		// Retrieve the index in survey object where information of current
		// selected item is store (model side)
		var itemData = $(item).data('itemData')
		var itemType = itemData.itemType
		var itemWidget = $(item).data('widget')
		var itemGroup = editor.parentItemType(itemType)

		// Container for fields in properties panel
		var propertiesContainer = $("#Properties").children('.Fields').empty()

		// Items that don't have a layout and other props common to virtual elements
		var isVirtual = itemType == "Matrix" || itemType == "Group" || itemType == "Label"

		// For all items, show the display rules selector
		var layoutSelector = new ui.button({
			id: 'DisplayRulesSelector',
			container: propertiesContainer,
			label: editorStrings['PROPERTIES_DISPLAY_RULES'],
			text: itemData.visibility.rules.length > 0 ? tr(editorStrings['PROPERTIES_DISPLAY_RULES_EDIT'], itemData.visibility.rules.length) : editorStrings['PROPERTIES_DISPLAY_RULES_ADD'],
			options: itemVisibilityOptions,
			command: editor.handleEditDisplayRules,
			class: isVirtual ? 'NoLayout' : undefined,
			texturePositionY: -447
		})
		if (!isVirtual) {
			new ui.selector({
				id: 'LayoutSelector',
				container: propertiesContainer,
				options: itemLayoutOptions,
				label: editorStrings['PROPERTIES_LAYOUT'],
				command: editor.handleLayoutSelect
			}).setValue(itemData.layout, { skipEvents: true })
		}

		if (itemGroup == 'Open') {
			new ui.selector({
				id: 'TextValidator',
				container: propertiesContainer,
				options: itemLayoutOptions,
				label: editorStrings['PROPERTIES_VALIDATOR'],
				command: editor.handleLayoutSelect
			})
			new ui.selector({
				id: 'SizeSelector',
				container: propertiesContainer,
				options: itemType != 'OpenMultipleLine' ? itemOpenSize : itemTextAreaSize,
				command: editor.handleChangeSize
			}).setValue(itemData.open.size, { skipEvents: true })
		}

		if (!isVirtual) {
			// The checkbox to mark fields as required
			new ui.checkbox({
				id: 'RequiredItem',
				container: propertiesContainer,
				label: editorStrings['PROPERTIES_REQUIRED'],
				command: editor.handleRequired
			}).setValue(itemData.required, { skipEvents: true })
		}
		// The select item to switch between horizontal and vertical layout
		if (itemGroup == 'Radio' || itemGroup == 'List' || itemGroup == 'Binary') {
			new ui.selector({
				id: 'OrientationSelector',
				container: propertiesContainer,
				options: itemOrientationOptions,
				command: editor.handleOrientationSelect
			}).setValue(itemData.orientation, { skipEvents: true })
			if (itemGroup == 'Radio') {
				new ui.checkbox({
					id: 'HasOther',
					container: propertiesContainer,
					label: editorStrings['PROPERTIES_HAS_OTHER'],
					command: editor.handleHasOther
				}).setValue(itemData.choice.other.show, { skipEvents: true })
			}
		} else if (itemGroup == 'Rate') {
			new ui.selector({
				id: 'HeaderStyleSelector',
				container: propertiesContainer,
				options: checkGroupHeaderStyles,
				command: editor.handleHeaderStyleSelect
			}).setValue(itemData.rate.headerStyle, { skipEvents: true })
			new ui.spinner({
				id: 'NumberOfValues',
				container: propertiesContainer,
				label: editorStrings['PROPERTIES_NUMBER_OF_GROUPS'],
				command: editor.handleChangeRateScale,
				minValue: 1,
				zeroIsUnlimeted: false
			}).setValue(itemData.rate.levels, { skipEvents: true })
		}

		// The multiSelect checkbox (for List items)
		if (itemGroup == 'List') {
			new ui.checkbox({
				id: 'EnableMultiSelect',
				container: propertiesContainer,
				label: editorStrings['PROPERTIES_MULTISELECT'],
				command: editor.handleChoiceMultiSelect
			}).setValue(itemData.choice.multiSelect, { skipEvents: true })
		}
		// The showIcon checkbox (for Binary items)
		if (itemGroup == 'Binary') {
			new ui.checkbox({
				id: 'EnableBinaryIcon',
				container: propertiesContainer,
				label: editorStrings['PROPERTIES_SHOW_ICON'],
				command: editor.handleShowHideBinaryIcon
			}).setValue(itemData.choice.showIcon, { skipEvents: true })
		}

		// Display properties panel
		$('#Properties').fadeIn(100)
	}

	this.getParentItemId = function (item) {
		var parentItem = $(item).parents('.RenderedItem', '.RenderedItem').first()
		if (parentItem.hasClass('RenderedItem'))
			return parentItem.data('itemData').id
		else
			return '0'
	}

	/**
	 *
	 * Hides the properties panel
	 *
	 */
	this.hideProperties = function () {
		$('#Properties').fadeOut(150)
	}

	/**
	 *
	 * This method will return a pointer the the last Insert Item placeholder
	 * of the provided item, provided X and Y coordinates of table
	 *
	 */
	this.getTableCell = function (itemModel, order) {
		var targetInsert = undefined
		if (order == undefined)
			order = itemModel.order

		if (itemModel.parentItemId != '0') {
			targetInsert = editor.board.find('#RenderedItem' + itemModel.parentItemId).children('.Item').children('table').children('tbody').children('tr').eq(itemModel.cell.y).children('td').eq(itemModel.cell.x).find('.SurveyInsert').eq(order)
		} else {
			targetInsert = editor.board.children('.SurveyInsert').eq(order)
		}
		return targetInsert
	}

	this.getItemCell = function (item) {
		var currentCell = {
			x: 0,
			y: 0
		}
		// If a parent has RenderedItem, then we are in a table
		if ($(item).parents('.RenderedItem').size() > 0) {
			// Update cell
			// For X, search for it in the current row
			// First, get a pointer to the current td (cell)
			var cell = $(item).parent()
			currentCell.x = cell.parent().children().index(cell)
			// For Y, search between rows
			// Get a pointer to the tr element
			var row = cell.parent()
			currentCell.y = row.parent().children().index(row)
		}
		return currentCell
	}

	this.setEditableLabel = function (target, handler) {
		// Get current HTML from Label
		var currentHTML = target.html()
		// Delete its content
		target.empty()
		// Find the element to add, textarea
		var newTextarea = target.prepend('<textarea class="LabelEdition">' + currentHTML + '</textarea>')
		// Do focus INSIDE textarea
		newTextarea.find('textarea').focus()
		// When user blur textarea, time to return new label
		newTextarea.on('focusout', function (event) {
			var newHTML = $(this).find('textarea').val()
			target.empty
			target.html(newHTML)
		})
		// Avoid click bubbles by capturing click event in textarea
		newTextarea.find('textarea').on('click', function (event) {
			event.stopPropagation()
		})
	}

	this.unsetEditableLabel = function () {
		$('textarea.LabelEdition').each(function (index, element) {
			// Extract the container of the textarea
			var target = $(element).parent()
			// For the textarea, extract the value and remove it
			var newHTML = $(this).val()
			target.empty
			target.html(newHTML)
		})
	}

	/**
	 *
	 * Processes a delete event for a given item, that can be the cross on each
	 * item or the delete button on toolbar (for N selected items)
	 *
	 */
	this.remove = function () {
		$.each(editor.getSelectedItems(), function () {
			// Delete Top "Drag Here to Insert" container
			editor.removeItem(this)
		})
	}

	/**
	 *
	 * This updates ordering of all elements in itemData object, to reflect
	 * possible item moves
	 *
	 */
	this.updateSurveyModel = function () {
		// Calculate the order of each element
		editor.board.find('.RenderedItem').each(function (index, element) {
			// Get current item data
			var itemData = $(element).data('itemData')
			var widget = $(element).data('widget')
			var parentItemType = editor.parentItemType(itemData.itemType)

			// Item order relative to parent
			itemData.order = $(element).parent().children('.RenderedItem').index(element)

			// Update parent
			var parentItem = $(element).parents('.RenderedItem')
			if (parentItem.size() > 0) {
				itemData.parentItemId = parentItem.data('itemData').id
			} else {
				itemData.parentItemId = 0
			}

			itemData.cell = editor.getItemCell(element)

			// Update title to match label
			itemData.label = $(this).find('.LabelItem .Label').html()

			// For Matrices, update rows and cols
			if (itemData.itemType == 'Matrix') {
				itemData.matrix = widget.getMatrixData()
			} else if (parentItemType == 'Rate') {
				itemData.rate = widget.getRateData()
			}

			itemData.choice.options = $(element).find('li.Option:not(.Header,.Other)').map(function (index, option) {
				// For option type objects, extract Option items
				var extra = []
				if (itemData.itemType == 'RadioImage' || itemData.itemType == 'ListImage' || itemData.itemType == 'RateRadioImage') {
					extra.push($(this).find('.Image').data('imgSrc'))
				} else if (itemData.itemType == 'RadioVideo' || itemData.itemType == 'ListVideo' || itemData.itemType == 'RateRadioVideo') {
					extra.push($(this).find('.Video').data('host'))
					extra.push($(this).find('.Video').data('id'))
				}
				return {
					label: $(this).find('.Legend').html(),
					value: $(this).find('.Value').text(),
					extra: extra,
					order: index
				}
			}).get()

			// Save the Other Option input
			if ($(element).find('li.Option.Other').size()) {
				itemData.choice.other.label = $(element).find('li.Option.Other .CellLabel').text()
				itemData.choice.other.hint = $(element).find('li.Option.Other .OtherInput .Label').text()
			}

			// Open ended items, add default value
			if (parentItemType == 'Open') {
				itemData.open.defaultText = widget.getValue()
			}

			// Write back data
			$(element).data('itemData', itemData)
		})
	}

	/**
	 *
	 * Retuns the Object that corresponds to the item with id itemId. It is assumed
	 * that the survey model structure is provided (the search is done over survey.items)
	 *
	 */
	this.getItemByIdFromModel = function (surveyModel, itemId) {
		var index = -1
		$(surveyModel.items).each(function (indexInArray) {
			if (this.id == itemId)
				index = indexInArray
		})

		return index >= 0 ? surveyModel.items[index] : undefined
	}

	/**
	 *
	 * Generate the Survey structure, taking the base of survey model and adding
	 * items, wich will living on jQuery data's attribute of .RenderedItem
	 * elements
	 *
	 */
	this.getSurvey = function () {
		// First make sure GUI is updated with model item
		editor.updateSurveyModel()
		// Copy survey base
		var fullSurvey = {}
		//fullSurvey.title = $scope.surveyName;
		fullSurvey.title = "No title"

		// If user changed settings, add it to model
		// Note: if other users are editing the dialog, when changing
		// all user must receive the settings that and turn off this flag
		if (editor.dialogs.surveySettings.hasChanged) {
			fullSurvey.settings = $.extend(true, {}, editor.dialogs.surveySettings.settingsState)
		}

		// Get each element as an array
		fullSurvey.items = $('#SurveyEdition .RenderedItem').map(function (index, element) {
			// Clone data for each element
			return $.extend(true, {}, $(element).data('itemData'))
		}).get()

		return fullSurvey
	}

	// Atthach undo operation to applicable functions
	var currentEditor = this
	// TODO: Events mapped directly to the handler must check that a change ocurred
	$.each(['swapItems', 'moveItem', 'insertItem', 'remove', 'cut', 'paste', 'replace', 'handleReplaceRules', 'handleChangeItemType', 'handleOrientationSelect', 'handleHeaderStyleSelect', 'handleChangeSize', 'handleChoiceMultiSelect', 'handleRequired', 'handleShowHideBinaryIcon', 'handleChangeRateScale', 'handleHasOther', 'handleLayoutSelect'], function () {
		currentEditor.registerMethodForUndoOperation(this)
	})

	/**
	 *
	 * Contain elements that will be part of the editor (different GUI elements)
	 *
	 */
	this.ui = new function () {
		var editorUi = this
		var itemLayouts = {
			right: {
				html: 'Dropdown on right',
				label: 'Right'
			},
			left: {
				html: 'Dropdown on right',
				label: 'Right'
			}

		}

		// Here we define the common events to be called by ui elements,
		// specially good for the undo and redo functionality
		// They're provided as functions since not all variables are available at load
		var defaultEvents = function () {
			return {
				beforeChange: editor.storeCurrentState,
				change: editor.addUndoOperation,
				sortComplete: function () {
					// Parameter true will allow taking the previous state of the survey
					// just before the dragging started
					editor.addUndoOperation(true)
				},
				update: editor.addUndoOperation,
				addOption: editor.addUndoOperation
			}
		}
		// Events that are required by the inline editor for the undo
		// and redo operations
		var editorEvents = function () {
			return {
				beforeChange: function () {
					editor.storeCurrentState()
				},
				change: function () {
					editor.addUndoOperation(true)
				}
			}
		}

		this.base = function (options) {
			// Allows initializing a determined layout
			var labelAndContainer
			if (options.layout !== 'Top') {
				labelAndContainer = '<div class="LabelContainer"></div><div class="UIElement"></div>'
			} else {
				labelAndContainer = '<div class="UIElement"></div><div class="LabelContainer"></div>'
			}
			this.item = $('<div class="ElementStart"></div>' + labelAndContainer).prependTo(options.container)

			// Setup the editable label for this item type
			new ui.inlineEdit({
				container: this.item.filter('.LabelContainer'),
				label: options.label,
				events: editorEvents()
			})

		}

		this.label = function (options) {
			var settings = $.extend({
				container: $('body'),
				label: editorStrings['LABEL_DEFAULT'],
				events: editorEvents()
			}, options)

			$.extend(this, new ui.inlineEdit(settings))
		}

		this.choice = function (options) {
			$.extend(this, new editorUi.base(options))
		}

		this.dropDown = function (options) {
			// Extend choice object
			var options = $.extend({
				container: $('body'),
				label: editorStrings['LABEL_DEFAULT'],
				events: defaultEvents()
			}, options)
			$.extend(this, new editorUi.choice(options))
			var dropDown = this

			var dropDownEditable = new ui.dropDownEditable({
				container: this.item.filter('.UIElement'),
				containerClickCommand: function () { editor.selectItem(dropDown.item.closest('.RenderedItem')) },
				options: options.options,
				events: options.events
			})

			// If the item is new, generate a sample option
			if (options.options.length == 0) {
				dropDownEditable.convertOptionToEditableOption(dropDownEditable.createOption())
			}

		}

		this.listChoice = function (options) {
			// Extend choice object
			var options = $.extend({
				container: $('body'),
				type: 'RadioText',
				label: editorStrings['LABEL_DEFAULT'],
				events: defaultEvents()
			}, options)
			$.extend(this, new editorUi.choice(options))

			var choiceInput
			if (!options.type.match(/Binary/)) {
				choiceInput = new ui.listChoiceEditable({
					type: options.type,
					container: this.item.filter('.UIElement'),
					options: options.options,
					other: options.other,
					events: options.events
				})
				// If the item is new, generate a sample option
				if (options.options.length == 0) {
					var optionData
					if (options.type == 'ListCheck') {
						optionData = {
							value: 'True'
						}
					}
					choiceInput.convertOptionToEditableOption(choiceInput.createOption(optionData))
				}
			} else {
				choiceInput = new ui.listChoice({
					type: options.type,
					container: this.item.filter('.UIElement'),
					options: options.options,
					showIcon: options.showIcon,
					other: options
				})
			}
			this.widget = choiceInput

		}

		/**
		 * Rendering of open ended questions. They can be:
		 *  - Single Line
		 *  - Multiple Lie
		 *     - Rich Tec
		 */
		this.open = function (options) {
			// Extend choice object
			var options = $.extend({
				container: $('body'),
				label: editorStrings['LABEL_DEFAULT']
			}, options)

			$.extend(this, new editorUi.base(options))
			var open = this

			/**
			 * Survey model will require reading current value of input,
			 * which depends on default label
			 */
			this.getValue = function () {
				return open.widget.getValue()
			}

			this.widget = new ui.openEndedEditable({
				type: options.type,
				container: this.item.filter('.UIElement'),
				open: options.open,
				defaultText: editorStrings['OPEN_DEFAULT_TEXT'] // This is the system default, not user's
			})

		}

		/**
		 * Rendering of sort and rank items where radio button are used
		 */
		this.rank = function (options) {
			// Extend choice object
			var options = $.extend({
				container: $('body'),
				options: [],
				label: editorStrings['LABEL_DEFAULT']
			}, options)

			$.extend(this, new editorUi.base(options))
			var rank = this

			this.widget = new ui.rankEditable({
				type: options.type,
				levels: options.levels,
				headerStyle: options.headerStyle,
				headerLabels: options.headerLabels,
				headerCategory: options.headerCategory,
				container: this.item.filter('.UIElement'),
				options: options.options,
				events: defaultEvents()
			})

			// Add a new options when creating new list
			if (options.options.length == 0)
				this.widget.convertOptionToEditableOption(this.widget.createOption())

		}

		/**
		 *
		 * This is the most complext type. Generates a table where with variable rows and headers.
		 * Moreover, tables may be nested.
		 *
		 */
		this.matrix = function (options) {
			var settings = $.extend({
				container: $('body'),
				rows: 2,
				cols: 2,
				widths: [{ dimension: 50, unit: 'Percent' }, { dimension: 50, unit: 'Percent' }],
				showToolbars: true
			}, options)

			var matrix = this
			this.table
			this.latestUnit = desktopEmbedUnitOptions[0].value
			/**
			 *
			 * Generates both row operations and column operations bar. Make
			 * sure is called after a table has been created. Use the new operations
			 * to allow accesing some properties and functions from outside.
			 *
			 */
			this.operationsBar = function () {
				var operationsBar = this
				this.currentCell = {}
				/**
				 *
				 * To display the bar, first it must be determined the "projection" of
				 * a cell on both table first column and first row, by means of the
				 * corresponding cell.
				 *
				 */
				this.getDisplayCell = function (cellIndexes) {
					var displayCells = {}
					displayCells.rowOperations = matrix.table.children('tbody').children('tr').eq(cellIndexes.y).children('td').eq(0)
					displayCells.columnOperations = matrix.table.children('tbody').children('tr').eq(0).children('td').eq(cellIndexes.x)
					return displayCells
				}

				this.handleShowBar = function (event) {
					operationsBar.currentCell = $(this).getCellIndexes()
					var displayCells = operationsBar.getDisplayCell(operationsBar.currentCell)
					event.stopPropagation()
					// Hide all bars
					$('.RowMenu').hide()
					$('.ColumnMenu').hide()
					// Remove highlighting and highlight new Row
					$('.MatrixRow').removeClass('HighlightRow')
					matrix.getRows().eq(operationsBar.currentCell.y).addClass('HighlightRow')
					// Set width data to current cell
					var cellData = matrix.table.children('tbody').children('tr').first().children('td').eq(operationsBar.currentCell.x).data('cellDimension')
					if (cellData != undefined) {
						operationsBar.fields.cellWidth.setValue(cellData.dimension, { skipEvents: true })
						operationsBar.fields.widthUnits.setValue(cellData.unit, { skipEvents: true })
					} else {
						operationsBar.fields.cellWidth.setValue(0, { skipEvents: true })
					}
					rowMenu.show().position({
						my: "right top",
						at: "left top",
						of: displayCells.rowOperations
					})
					columnMenu.show().position({
						my: "left bottom",
						at: "left top",
						of: displayCells.columnOperations
					})
				}

				this.handleHideBar = function (event) {
					rowMenu.hide()
					columnMenu.hide()
				}

				this.addRowUpHandler = function (event) {
					matrix.addRow(operationsBar.currentCell.y)
					operationsBar.currentCell.y++
				}

				this.addRowDownHandler = function (event) {
					matrix.addRow(operationsBar.currentCell.y, true)
				}

				this.addColumnLeftHandler = function (event) {
					matrix.addColumn(operationsBar.currentCell.x)
					operationsBar.currentCell.x++
				}

				this.addColumnRightHandler = function (event) {
					matrix.addColumn(operationsBar.currentCell.x, true)
				}

				this.deleteRowHandler = function (event) {
					matrix.deleteRow(operationsBar.currentCell.y)
				}

				this.deleteColumnHandler = function (event) {
					matrix.deleteColumn(operationsBar.currentCell.x)
				}

				this.moveRowUpHandler = function (event) {
					matrix.moveRow(operationsBar.currentCell.y, true)
					if (operationsBar.currentCell.y > 0)
						operationsBar.currentCell.y--
					else
						operationsBar.currentCell.y = matrix.table.children('tbody').children('tr').size() - 1
				}

				this.moveRowDownHandler = function (event) {
					matrix.moveRow(operationsBar.currentCell.y, false)
					operationsBar.currentCell.y = (operationsBar.currentCell.y + 1) % (matrix.table.children('tbody').children('tr').size())
				}

				this.moveColumnLeftHandler = function (event) {
					matrix.moveColumn(operationsBar.currentCell.x, true)
					if (operationsBar.currentCell.x > 0)
						operationsBar.currentCell.x--
					else
						operationsBar.currentCell.x = matrix.table.children('tbody').children('tr').first().children('td').size() - 1
				}

				this.moveColumnRightHandler = function (event) {
					matrix.moveColumn(operationsBar.currentCell.x, false)
					operationsBar.currentCell.x = (operationsBar.currentCell.x + 1) % (matrix.table.children('tbody').children('tr').first().children('td').size())
				}

				this.changeColumnWidthHandler = function (event) {
					var newWidth = operationsBar.fields.cellWidth.getValue()
					var widthUnits = operationsBar.fields.widthUnits.getValue()
					var units = operationsBar.fields.widthUnits.getValue()
					var currentCell = matrix.table.children('tbody').children('tr').first().children('td').eq(operationsBar.currentCell.x)
					// When using percentages, expand table to container
					if (widthUnits != 'Percent')
						matrix.table.css({ width: 'auto' })
					else
						matrix.table.css({ width: '100%' })
					// If user enters a width grater than zero, apply
					currentCell.data('cellDimension').dimension = newWidth
					// Overwrite units for all
					matrix.latestUnit = widthUnits
					matrix.table.children('tbody').children('tr').first().children('td').data('cellDimension').unit = widthUnits
					matrix.refreshWidths()
				}

				// Add the Insert, Delete and Width Bar
				var rowMenu = $('<div class="RowMenu"></div>').appendTo(settings.container)
				this.rowMenu = rowMenu
				var rowOperations = $('<div class="LeftMenu"></div>').appendTo(rowMenu)
				$('<div class="Operation Move Up Icon Iconset"></div>').appendTo(rowOperations).on('click', this.moveRowUpHandler)
				$('<div class="Operation AddRow Up Icon Iconset"></div>').appendTo(rowOperations).on('click', this.addRowUpHandler)
				$('<div class="Operation Delete Icon Iconset"></div>').appendTo(rowOperations).on('click', this.deleteRowHandler)
				$('<div class="Operation AddRow Down Icon Iconset"></div>').appendTo(rowOperations).on('click', this.addRowDownHandler)
				$('<div class="Operation Move Down Icon Iconset"></div>').appendTo(rowOperations).on('click', this.moveRowDownHandler)

				var columnMenu = $('<div class="ColumnMenu"></div>').appendTo(settings.container)
				this.columnMenu = columnMenu
				// For compatibility, we use a table to avoid the menu to span multiple lines
				var columnOperations = $('<div class="TopMenu"><table class="InvisibleTable"><tr></tr></table></div>').appendTo(columnMenu).find('tr')
				$('<td><div class="Operation Move Left Icon Iconset"></div></td>').appendTo(columnOperations).on('click', this.moveColumnLeftHandler)
				$('<td><div class="Operation AddColumn Left Icon Iconset"></div></td>').appendTo(columnOperations).on('click', this.addColumnLeftHandler)
				$('<td><div class="Operation Delete Icon Iconset"></div></td>').appendTo(columnOperations).on('click', this.deleteColumnHandler)
				$('<td><div class="Operation AddColumn Right Icon Iconset"></div></td>').appendTo(columnOperations).on('click', this.addColumnRightHandler)
				$('<td><div class="Operation Move Right Icon Iconset"></div></td>').appendTo(columnOperations).on('click', this.moveColumnRightHandler)
				var cellWidth = $('<td class="WidthLabel">' + editorStrings['WIDTH'] + '</td><td><div class="CellWidth"></div></td>').appendTo(columnOperations).find('.CellWidth')
				operationsBar.fields = {}
				operationsBar.fields.cellWidth = new ui.spinner({
					container: cellWidth,
					minValue: 0,
					zeroLabel: editorStrings['WIDTH_AUTO']
				})

				var widthUnits = $('<td><div class="CellUnits"></div></td>').appendTo(columnOperations).find('.CellUnits')
				operationsBar.fields.widthUnits = new ui.selector({
					container: widthUnits,
					options: desktopEmbedUnitOptions,
					command: operationsBar.changeColumnWidthHandler
				})

				// Bind on change events
				operationsBar.fields.cellWidth.item.find('input').on({
					change: operationsBar.changeColumnWidthHandler,
					keyup: operationsBar.changeColumnWidthHandler
				})

				// Avoid menu to disappear when over
				matrix.table.parentsUntil('.RenderedItem').on('mouseover', utils.stopPropagation)
			}

			this.addRow = function (index, after) {
				// Generate Undo point
				editor.addUndoOperation()
				// Get a pointer to the object before where new object will be inserted
				var rowBefore = matrix.table.children('tbody').children().eq(index)
				// Insert row
				var newRow = $('<tr class="MatrixRow"></tr>')
				if (after)
					newRow.insertAfter(rowBefore)
				else
					newRow.insertBefore(rowBefore)
				// Add new table cells (as the number of cells fo previous row)
				$.each(rowBefore.children(), function () {
					var newCell = $('<td class="MatrixCell"></td>').appendTo(newRow)
					matrix.initCell(newCell)
					// Animate new row
					newCell.delay(500).addClass('Highlight', 500).delay(1000).removeClass('Highlight', 500)
				})
			}

			this.moveRow = function (index, up) {
				// Generate Undo point
				editor.addUndoOperation()
				var tableRows = matrix.table.children('tbody').children('tr')
				if (up) {
					// Take current element (detach it). If moving up an current index is > 0,
					// Then insert it before previous element.
					// If not, insert it at the end of the table
					if (index > 0)
						tableRows.eq(index).detach().insertBefore(tableRows.eq(index - 1))
					else
						tableRows.eq(index).detach().insertAfter(tableRows.last())
				} else {
					if (index < tableRows.size() - 1)
						tableRows.eq(index).detach().insertAfter(tableRows.eq(index + 1))
					else
						tableRows.eq(index).detach().insertBefore(tableRows.first())
				}
			}

			this.addColumn = function (index, after) {
				// Generate Undo point
				editor.addUndoOperation()

				matrix.table.children('tbody').children('tr').each(function () {
					var newCell = $('<td class="MatrixCell"></td>')
					if (after)
						newCell.insertAfter($(this).children('td').eq(index))
					else
						newCell.insertBefore($(this).children('td').eq(index))
					matrix.initCell(newCell)
					// Animate
					newCell.delay(500).addClass('Highlight', 500).delay(1000).removeClass('Highlight', 500)
				})
			}

			this.moveColumn = function (index, left) {
				// Generate Undo point
				editor.addUndoOperation()

				matrix.table.children('tbody').children('tr').each(function () {
					var cells = $(this).children('td')
					if (left) {
						// Similar logic to moving rows. Detach current cell, and move it
						// Before previous element
						if (index > 0)
							cells.eq(index).detach().insertBefore(cells.eq(index - 1))
						else
							cells.eq(index).insertAfter(cells.last())
					} else {
						if (index < cells.size() - 1)
							cells.eq(index).detach().insertAfter(cells.eq(index + 1))
						else
							cells.eq(index).insertBefore(cells.first())
					}
				})
			}

			this.deleteRow = function (index) {
				// Generate Undo point
				editor.addUndoOperation()
				matrix.table.children('tbody').children('tr').eq(index).remove()
			}

			this.deleteColumn = function (index) {
				// Generate Undo point
				editor.addUndoOperation()
				matrix.table.children('tbody').children('tr').each(function () {
					$(this).children('td').eq(index).remove()
				})
			}

			this.initCell = function (cell) {
				editor.createInsert(cell, true)
				cell.on({
					mouseover: matrix.operationsBar.handleShowBar
				}).data('cellDimension', {
					dimension: 0,
					unit: matrix.latestUnit
				})
			}

			this.refreshWidths = function (options) {
				options = $.extend({
					animate: true
				}, options)
				matrix.table.children('tbody').children('tr').first().children('td').each(function (event) {
					var cellWidth = $(this).data('cellDimension')
					// Decode label
					var widthLabel = $(desktopEmbedUnitOptions).filter(function () {
						return this.value == cellWidth.unit
					}).get(0).label
					//$(this).clearQueue();
					var newWidthData = {
						width: cellWidth.dimension > 0 ? cellWidth.dimension + '' + widthLabel : 'auto'
					}
					// Animation of colum width is always restarting from old value
					// Jquery animation when width is auto won't work
					// if (options.animate !== false && cellWidth.dimension > 0)
					//   $(this).animate(newWidthData)
					// else
					$(this).css(newWidthData)
				})
			}

			this.setColumnCount = function (cols) {
				var currentCols = matrix.getColumnCount()
				var columnDelta = currentCols - cols
				if (columnDelta > 0) {
					// Remove columns
					matrix.getRows().each(function () {
						$(this).children().slice(cols).remove()
					})
				} else if (columnDelta < 0) {
					// Add columns
					matrix.getRows().each(function () {
						for (var i = columnDelta; i < 0; ++i) {
							var cell = $('<td class="MatrixCell"></td>').appendTo(this)
							matrix.initCell(cell)
						}
					})
				}
			}

			this.setRowCount = function (rows) {
				var currentRows = matrix.getRowCount()
				var rowDelta = currentRows - rows
				if (rowDelta > 0) {
					// Remove exceding rows
					matrix.getRows().slice(rows).remove()
				}
				else {
					// Add missing rows
					// Build tr with children
					var newRow = $('<tr class="MatrixRow"></tr>')
					var totalColumns = matrix.getColumnCount()
					for (var i = 0; i < totalColumns; ++i) {
						var cell = $('<td class="MatrixCell"></td>').appendTo(newRow)
						matrix.initCell(cell)
					}
					for (var i = rowDelta; i < 0; ++i) {
						matrix.table.children('tbody').append(newRow.clone(true))
					}
				}
			}

			this.getRows = function () {
				return matrix.table.children('tbody').children('tr')
			}

			this.getColumns = function (row) {
				return row.children()
			}

			this.getRowCount = function () {
				return matrix.getRows().size()
			}

			this.getColumnCount = function () {
				return matrix.getColumns(matrix.getRows().eq(0)).size()
			}

			this.getCell = function (row, col) {
				return matrix.getColumns(matrix.getRows().eq(row)).eq(col)
			}

			this.getMatrixData = function () {
				return {
					rows: matrix.table.children('tbody').children('tr').size(),
					cols: matrix.table.children('tbody').children('tr').first().children('td').size(),
					widths: matrix.table.children('tbody').children('tr').first().children('td').map(function () {
						return $(this).data('cellDimension')
					}).get()
				}
			}

			var table = $('<table class="MatrixTable"></table>').appendTo(settings.container)
			// Record accesor to this table
			this.table = table
			// For Group items, Toolbar must be turned off
			if (settings.showToolbars == true) {
				// Crear operations bar (overwriting it)
				this.operationsBar = new this.operationsBar()
			}

			for (var i = 0; i < settings.rows; ++i) {
				var row = $('<tr class="MatrixRow"></tr>').appendTo(table)
				for (var j = 0; j < settings.cols; ++j) {
					var cell = $('<td class="MatrixCell"></td>').appendTo(row)
					this.initCell(cell)
				}
			}

			// Update initial widths
			$.each(settings.widths, function (index) {
				table.children('tbody').children('tr').first().children('td').eq(index).data('cellDimension', this)
			})
			matrix.refreshWidths()

		}

	} // Closes Survey Editor UI

}// Closes SurveyEditor()
