/**
 *
 * This file should be included by client to display survey
 * according to provided parameters
 *
 * Order:
 *  1. Load jQuery
 *  2. Load other dependencies
 *  3. Launch Survey
 *
 * @author Manlio Barajas
 * @company OverResponse
 *
 */

import $ from './../3rd-party/cash/cash'
import ORCookie from './jquery.cookie'
import ORTemplates from './templates'
import ORStrings from './languages/en-us'
import ORUtils from './../util'
import ORBaseUI from './../ui/base/base-ui'

// List of all surveys in our App. Available here so
// We can get a survey by its ID, or in the most common case,
// get the only survey
var ORSurveys = {};

export function launchSurvey(surveyData) {
	// Store server address (ex: http://use.overresponse.com)
	var server = '//use.overresponse.com';
	var serverAssets = '//static.overresponse.com';
	/** remove-block **/
	// During development, this will overwrite production path for server
	server = '';
	serverAssets = '';
	/** endremove-block **/

	// The Internet Explorer version
	var ie = (function(){

		var undef,
			v = 3,
			div = document.createElement('div'),
			all = div.getElementsByTagName('i');

		while (
			div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
			all[0]
		);

		return v > 4 ? v : undef;

	}());

	// In memory survey status.
	var surveyStatus = 'active';

	var ORSettings = surveyData || {};
	var ORSurveyId = ORSettings.surveyId;
	var ORContainerId = ORSettings.containerId;

	// Survey UniqID used for multiple porpouses
	var ORUniqId = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);

	// If no container is provided, create it
	if (typeof ORContainerId == 'undefined' && typeof ORSettings.container == 'undefined') {
		ORContainerId = 'ORMainContainer' + ORUniqId;
		document.write('<div class="ORMainContainer" id="' + ORContainerId + '"></div>');
	}

	// A Store for the current state of loaded surveys
	ORSettings.status = ORSettings.status || {};
	ORSettings.alwaysShow = ORSettings.alwaysShow || false;

	// The user may decide to always show the survey, ignoring if the user
	// has already replied (for instance, a contact form)

	// TODO: Reimplement a mechanism to prevent showing the same survey to the same
	//			 without tracking

	// if (!ORSettings.alwaysShow) {
	// 	// If we find a cookie indicating user has already started the survey,
	// 	// then do not launch the survey
	// 	var cookies = document.cookie.split('; ');

	// 	for (var i = 0, parts; (parts = cookies[i] && cookies[i].split('=')); i++) {
	// 		var surveyStatus = '';
	// 		if (parts.shift() === 'ORSurveyStatus' + ORSurveyId) {
	// 			surveyStatus = parts.join('=');
	// 			if (surveyStatus === 'started' || surveyStatus === 'finished') {
	// 				// User did not completed or completed the survey
	// 				// TODO: Allow the user to resume
	// 				return;
	// 			}
	// 		}
	// 	}
	// }

	/**
	 * A Replacement for jQuery $.getScript
	 *
	 * @param {string} source script to load
	 * @param {function} callback function to call after
	 */
	function ORLoadScript(source, callback) {
		if (typeof callback == 'undefined')
			callback = function() {};

		var script = document.createElement('script');
		var prior = document.getElementsByTagName('script')[0];
		script.async = 1;

		script.onload = script.onreadystatechange = function (_, isAbort) {
			if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
				script.onload = script.onreadystatechange = null;
				script = undefined;

				if (!isAbort && callback) setTimeout(callback, 0);
			}
		};

		script.src = source;
		prior.parentNode.insertBefore(script, prior);
	}

	/**
	 *
	 * A Replacement for jQuery $.getScript and $.when
	 *
	 * @param {string} sources array of scripts to load
	 * @param {function} callback function to call after
	 */
	function ORGetScripts(sources, callback) {

		var promises = [];
		for (var i = 0; i < sources.length; i++) {
			promises.push(new Promise(function(resolve) {
				ORLoadScript(sources[i], function() {
					resolve();
				});
			}))
		}

		Promise.all(promises).catch(function(error) {
		}).finally(callback);
	}

	/**
	 * Loads an stylesheet
	 * @param {string} source href to stylysheet
	 */
	function ORGetStylesheet(source) {
		var style = document.createElement("link");
		style.setAttribute("type", "text/css");
		style.setAttribute("rel", "stylesheet");
		style.setAttribute("href", source);
		style.setAttribute("media", "none");
		style.setAttribute("onload", "if(media!='all')media='all'");
		$("head").append(style);
	}

	/**
	 *
	 * Component to show and hide messages to user directly in the response
	 * area (when survey is embedded). It's assumed that the survey is loaded
	 * properly and that jQuery is available.
	 *
	 * TODO: If survey is not loaded, add a message to user's log
	 *
	 */
	var ORNotify = function(options) {
		var options = $.extend({
			type: 'Error',
			message: ORStrings['ERROR_UNKNOWN'],
			autoHide: 0,
			surveyContainer: undefined,
			animationDelay: 300
		}, options);
		var currentMessage = this;

		/***
		 *
		 * Remove the message element from the DOM
		 *
		 */
		this.destroy = function() {
			currentMessage.notifyElement.remove();
		};

		/**
		 *
		 * Both hides and then destroys the element
		 *
		 */
		this.hide = function() {
			currentMessage.notifyElement.hide(0, options.animationDelay / 1.5, function() {
				// finally, remove the element from the DOM
				currentMessage.destroy();
				// Call the drawing to refresh positions
				currentMessage.updatePositions();
			});
		}

		/**
		 *
		 * Used to move element up when new messages are shown
		 *
		 */
		this.updatePositions = function() {
			var currentOffset = 0;
			$('.ORNotify').each(function() {
				var notifyElement = $(this).data('notifyData').notifyElement;
				notifyElement.css({
					"top": currentOffset
				})
				currentOffset += notifyElement.height() + 5;
			});
		};

		var container = options.surveyContainer;

		// Position the note. Estimate the offset before inserting the new element
		var currentOffset = 0;
		$('.ORNotify').each(function() {
			currentOffset += $(this).data('notifyData').notifyElement.height() + 5;
		});

		// Insert the object in the DOM structure. Note that element will be visible,
		// to allow jQuery to calculate the height
		var notify = $(''
			+ '<div class="ORNotify OR' + options.type + '">'
			+ '  <div class="ORNotifyMessage">' + options.message
			+ '    <div class="ORNotifyClose">&#10006;</div>'
			+ '  </div>'
			+ '</div>').appendTo(options.surveyContainer);
		this.notifyElement = notify;

		// Show the message
		notify.css('top', currentOffset + 'px').hide(0).fadeIn(options.animationDelay);

		// Bind the click to close event
		notify.find('.ORNotifyMessage > .ORNotifyClose').on({
			click: function(event) {
				currentMessage.hide(0);
			}
		});

		// Self register this item
		notify.data('notifyData', this);

		// Update position
		this.updatePositions();

		// If user provided an autoHide time, execute it
		if (options.autoHide > 0) {
			// Please not that this will trigger even when the element is no longer available
			window.setTimeout(currentMessage.hide, options.autoHide);
		}
	};

	var ORLaunchSurvey = function(options) {
		var survey = this;
		// Object will hold information and vars for helping the rendering process
		// (remember there can be many surveys in a single page)
		survey.render = {};

		// Default options
		var defaultHandler = function(event) {};
		options.events = $.extend({
			onFirstItemChange: defaultHandler,
      onItemChange: defaultHandler,
      onSurveyFinish: defaultHandler
		}, options.events);

		options = $.extend(true, {
			height: options.minimalSize ||  options.expandable ? 0 : 300, // When minimal size is on, we start with a very low number
			autoHide: true,
			animation: {
				enable: true,
				show: {
					delay: 1000,
					transition: 200
				},
				resize: {
					delay: 0,
					transition: 500
				},
				item: {
					delay: 0,
					transition: 500
				},
				hide: {
					delay: 2000,
					transition: 200
				},
				reject: {
					delay: 500,
					transition: 150
				}
			},
			controlClass: 'ORControl'
		}, options);

		// Let the options available for later use
		survey.options = options;
		// A flag to indicate the current status of the survey
		survey.status = 'loaded';

		// OverResponse common utils
		var utils = new ORUtils($);

		// UI Instance
		this.ui = new ORBaseUI($, utils);

		// Hide parent container by default
		options.container.css({
			opacity: 0
		});

		// Extend jQuery with the mouseScroll events
		// TODO: Mouse Scroll replacement needed

		// Also we need to read cookies
		ORCookie($, window.document);

		/**
		 * Generic error handler for ajax calls
		 */
		this.ajaxErrorHandler = function(jqxhr, textstatus, errorthrown) {
			new ORNotify({
				surveyContainer: survey.container,
				message: ORStrings['NOTIFY_AJAX_ERROR'],
				autoHide: 4500
			});
		};

		/**
		 * Alter an array of items so the the order field get randomized. Please
		 * note the ordering of the elements in the arrays does not change. Only
		 * the order field value.
		 *
		 * TODO: Verify display rules.
		 * TODO: What happens when, instead of the whole survey, only chunks are
		 * processed
		 */
		this.randomizeItems = function(items) {

			function randomizeChildren(parentElement) {
				// Here the order number for elemenets of the same level will be stored
				var orderings = [];
				// Scan array of items for the elements of the same
				$(items).each(function() {
					if (this.parentItemId == parentElement.id) {
						orderings.push(this.order);
					}
				});
				// Shake the array
				utils.randomizeArray(orderings);
				// Now apply the new order
				// Please note that this search is not efficient...
				$(items).each(function(index) {
					if (this.parentItemId == parentElement.id) {
						this.order = orderings[index];

						// Finally, recurse through children
						randomizeChildren(this);
					}
				});
			}

			// Start the recursion with root elements
			randomizeChildren({
				id: '0'
			});
		};

		/**
		 * Assumes survey id has been set, and loads the survey
		 */
		this.loadSurvey = function() {
			// Store for the item UI elements (created from BaseUI.js)
			survey.uiItems = {};

			// Here we will have a copy of the responses of the user
			survey.responses = {};
			if (typeof options.data === 'undefined') {
				// If survey data is not present, go to the server
				fetch(server + "/respondant/" + survey.options.id)
					.then(response => response.json())
					.then(function(res) {

						survey.loaded = true;

						// Store survey responses provided received from server
						survey.settings = res.survey.settings;
						survey.items = res.survey.items;

						// Store the responses session token
						localStorage.setItem('ORResponsesSessionJWT', res.token);
						survey.sessionCookie = res.sessionCookie;

						// Get the real id, necessary to submit responses
						survey._id = res.survey._id;
						// Short id is used for survey cookies
						survey.shortId = res.survey.shortId;

						// Load the template and theme
						survey.theme = options.theme || survey.settings.theme;
						survey.template = options.template || survey.settings.template;
						// Check for template override
						survey.overrideDefaultValue('template', ['Simple', 'Slim', 'Modern', 'ButtonLess', 'Cool']);
						// Get the HTML for the template
						survey.html = options.templates[survey.template].html;

						// If user wants to randomize the items, then shake
						if (survey.settings.enableItemRandomize) {
							survey.randomizeItems(survey.items);
						}

						// Contains flags and variables associated with current survey state
						survey.render = $.extend(res.render, survey.render);
						// Start the rendering process
						survey.loadUserStyleSheets(survey.renderSurvey);
					})
			} else {
				utils.console("- PREVIEW MODE Launching");
				survey.preview = true;

				// Store survey responses provided received from server
				survey.settings = options.data.settings;

				survey.items = options.data.items;
        // Survey appareance
				survey.theme = survey.settings.theme;
				survey.template = survey.settings.template;
				// Check for template override
				survey.overrideDefaultValue('template', ['Simple', 'Slim', 'ButtonLess'], true);
				// Get the HTML for the template
				survey.html = options.templates[survey.template].html;
				// Contains flags and variables associated with current survey state
				survey.render = {
					finished: true
				};

				// Start the rendering process
				survey.loadUserStyleSheets(survey.renderSurvey);
				utils.console("- PREVIEW MODE Launched");
			}

			// Set current item on center offset (used for smart scrolling)
			survey.render.activeChild = 0;
		};

		/**
		 * Accessor for current respondant values
		 */
		 this.getResponses = function() {
			return $.extend(true, {}, survey.responses);
		};

		/**
		 * Reset respondant values
		 */
		 this.resetResponses = function() {
			survey.responses = {};
			$.each(survey.uiItems, function() {
				this.reset();
			});
		};

		/**
		 * Get an item, provided information of it
		 */
		this.getItem = function(searchField, value) {
			$(survey.items).filter(function() {
				if (searchField == 'parent') {
					return this.parentItemId == value.parentItemId && this.order == value.order;
				}
				return false;
			});
		};

		// Some settings overrides
		this.overrideDefaultValue = function(option, validValues, root) {
			if (typeof options[option] != 'undefined') {
				// Make sure user provided a valid scrolling mode
				if (validValues.indexOf(options[option]) >= 0) {
					if (root) {
						survey[option] = options[option];
					} else {
						survey.settings[option] = options[option];
					}
					utils.console(' - Option ' + option + ' <- ' + options[option]);
				} else {
					utils.console('Provided ' + option + ' is not valid');
				}
			}
		}

		this.loadUserStyleSheets = function(onSuccess) {

			// TODO: Determine if item should be displayed, or not
			// Start the setup of the survey

			// Load the theme and template
			// TODO: Show error warning when not loading this

			// Load theme and template
			ORGetStylesheet(serverAssets + '/stylesheets/respondant-'
				+ survey.template.toLowerCase() + '-'
				+ survey.theme.toLowerCase() + '.css');

			onSuccess();
		};


		this.showSurvey = function() {
			survey.options.container.css({opacity: 1});
		}

		this.hideSurvey = function() {
			survey.options.container.css({
				opacity: 0
			});
			if (survey.isAnimated()) {
				// If user rejects, hide at different speed than when he/she completes survey
				var animationSetting = options.animation[surveyStatus === 'rejected' ? 'reject' : 'hide'];
				survey.options.container.css({
					transitionProperty: 'opacity',
					transitionDelay: animationSetting.delay + 'ms',
					transitionDuration: animationSetting.transition + 'ms'
				});
			}
		}

		this.setRejected = function() {
			surveyStatus = 'rejected';
			survey.setCookieStatus('rejected');
		}

		this.isAnimated = function() {
			return survey.options.animation.enable;
		}

		/**
		 * Renders the start of the survey:
		 *  - Determines if survey should be displayed
		 *  - Does the setup for the survey (on the adecuate position)
		 *  - Launches first item (or intro text)
		 */
		this.renderSurvey = function() {
			survey.overrideDefaultValue('scrollingMode', ['Smart', 'Block', 'Classic']);

			// Clear the container to avoid possibly duplicates
			options.container.empty();

			// Load the template
			survey.html = $(survey.html).appendTo(options.container);

			// Desktop platform
			survey.container = $('<div class="ORSurveyContainer'
				+ (survey.isAnimated() ? ' Animated' : '')
				+ ' ORHide"></div>').appendTo(survey.html.find('.ORSurveyContent'));

			// Add main survey area
			survey.main = $('<div class="ORMain"></div>').appendTo(survey.container);

			// Add placeholder for survey items
			survey.content = $('<div class="ORContent"></div>').appendTo(survey.main);
			if (survey.isAnimated()) {
				survey.content.css({
					transitionDelay: options.animation.item.delay + 'ms',
					transitionDuration: options.animation.item.transition + 'ms'
				});
			}
			survey.contentItems = $('<div class="ORContentItems"></div>').appendTo(survey.content);

			// Set the height of the survey
			if (options.height !== 0) {
				survey.container.css({
					height: options.height
				});
			}

			// Add event handlers
			survey.html.find('.ORLeft').on('click', {fromButton: true}, survey.handlePrevious);
			survey.html.find('.ORRight').on('click', {fromButton: true}, survey.handleNext);

			if (survey.settings.scrollingMode != 'Classic') {
				// Add the class needed for smarcrolling
				survey.main.addClass('WithAutoScroll');
			} else {
				survey.content.css('overflow-y', 'auto');
			}

			// And the footer
			survey.footer = $('<div class="ORFooter Rounded5px"><a href="https://overresponse.com" target="_blank">'
				+ '<img width="15" height="12" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAMCAYAAAC9QufkAAAABHNCSVQICAgIfAhkiAAAAUBJREFUKJGN0j9IVQEUx/HPvT7zwRsc/Ee4hjXq+AgHFyfL2VDSxULCRRJ8EdTgfYOTIAhBhE3q4OYgRFCBDeLgJGlLvqkEJcESe93b8K7ivycdONPvfM/vd+AE/qMmuRvyqEznc25iC4+D66ApcmVmE/oDfid8eMHOMT04qgqn4ArymLnByzH2UnkWDzPV4D+8CsjHDD/j9RmpEw/w/kqwSG9EPMBntKMN9zGPvyjh1iVwkZoim0+JMyTO9680cgNcir3NvRrulJguM4p1zOEbPuLnyWxmkq6A5gILEDIU8+M242hFLzbw6aJRUGQlIZ+h45DvWXYT3hQYQRPWUJ/efG5BGPIEyizXMRiQDVlO9V104wDvUEDtqTNElYGlkFxCjMYJ9s+YtOBtuuirypN8OVUj2iLmokrMatWHVWThH253VbQSjCBUAAAAAElFTkSuQmCC" />'
				+ '</a></div>').insertAfter(survey.content);

			// Bind scroll event to mouse for accurate scrolling
			if (options.fullScreen === true) {
				$('body').on('mousewheel', survey.wheelHandler);
			} else {
				survey.container.on('mousewheel', survey.wheelHandler);
			}

			// Add a default closing message to all surveys
			if (typeof survey.settings.closingText == 'undefined' || survey.settings.closingText == '') {
				survey.settings.closingText = ORStrings['DEFAULT_CLOSING_MESSAGE'];
			}

			function applyInitialMargin() {
				var containerHeight = survey.content.parent().height();
				var firstItemHeight = survey.contentItems.find('.ORItemContainer').first().outerHeight(true);
				var targetMargin = (containerHeight - firstItemHeight) / 2;
				if (survey.isAnimated()) {
					// Temporally remove animation
					survey.content.css({transitionProperty: 'none'});
				}
				survey.content.css({
					marginTop: targetMargin + 'px'
				});
				if (survey.isAnimated()) {
					// Add back animation
					setTimeout(function() {
						survey.content.css({transitionProperty: 'margin-top'});
					}, 0);
				}
			}

			// Finally, we're ready to start serving the survey
			if (survey.isAnimated())  {
				setTimeout(function() {
					if (options) {
						if (options.animation.enable) {
							options.container.css({
								transitionProperty: 'opacity',
								transitionDelay: options.animation.show.delay + 'ms',
								transitionDuration: options.animation.show.transition + 'ms'
							});
						}
						survey.renderItems();
						applyInitialMargin();
						survey.showSurvey();
					}
				}, options.animation.show.delay);
			} else {
				survey.renderItems();
				applyInitialMargin();
			}
		};

		/**
		 * Renders the latest response from API server. It may be a simple introduction text
		 * Or a the full survey, if smart scrolling is not enabled and there are no particular
		 * display rules
		 */
		this.renderItems = function() {
			survey.container.addClass('Desktop');

			// Currently we only expand layout, that is, the survey
			// Will occupy all of its container
			survey.container.addClass('Expand');

			// Intro shold only be displayed if its not empty
			if (typeof survey.settings.introText != 'undefined' && survey.settings.introText != '') {
				// The special case of intro text
				survey.renderItem({
					itemType: 'Intro'
				});
			} else {
				survey.render.currentItem = 'First';
				survey.navigate();
			}
		};

		/**
		 * Render a single item, provided that options.itemType contains the type of the
		 * item to render. This assumes the follow the survey model.
		 */
		this.renderItem = function(item) {
			item = $.extend({
				parentItemId: '0'
			}, item);

			var container = $('<div class="ORItemContainer ORItemId' + item.id + ' Rounded5px ' + item.itemType + '"></div>');
			if (item.itemType != 'Intro' && item.itemType != 'Matrix'  && item.itemType != 'Group') {
				// Add layout and orientation
				container.addClass(item.layout, item.orientation);
			}

			// Overwrite the container if it is inside a matrix
			if (item.parentItemId != '0') {
				container = container.appendTo(survey.contentItems
					.find('.ORItemId' + item.parentItemId)
					.find('.ORTableRow').eq(item.cell.y)
					.children('.ORTableCell').eq(item.cell.x));
			} else {
				container = container.appendTo(survey.contentItems);
			}
			var itemContainer;

			if (item.itemType != 'Intro' && item.itemType != 'Label' && item.itemType != 'Matrix'  && item.itemType != 'Group') {
				// Build base layout
				if (item.layout == 'Left' || item.layout == 'Right' || item.layout == 'Bottom')
					container.append('<div class="ORLabel">' + item.label + '</div>');
				itemContainer = $('<div class="OR' + item.itemType + ' ORChoice ORGeneric"></div>').appendTo(container);
				if (item.layout == 'Top')
					container.append('<div class="ORLabel">' + item.label + '</div>');

				// For elements that are inside groups or matrices
				// ASSUMPTION. Items are ordered such that, always, the parent item will be rendered before
				// children elements
			}

			var baseSettings = {
				id: item.id,
				type: item.itemType,
				container: itemContainer,
				required: item.required,
				randomize: survey.settings.enableOptionRandomize,
				controlClass: options.controlClass,
				events: {
					activate: survey.handleActive,
					valueSet: survey.handleNext
				}
			};

			switch (item.itemType)
			{
				case 'Intro':
					// Add the Virtual Flag
					container.addClass('Virtual');
					// Display survey title
					if (typeof survey.settings.title != 'undefined') {
						container.append('<div class="ORSurveyTitle">' + survey.settings.title + '</div>');
					}
					if (typeof survey.settings.introText != 'undefined') {
						container.append('<div class="ORSurveyIntro">' + survey.settings.introText + '</div>');
					}
					var beginButtonContainer = $('<div class="ORCommandButton ORBeginButton"></div>').appendTo(container);
					$('<button class="' + options.controlClass + '">' + ORStrings['BEGIN_SURVEY'] + '</button>').appendTo(beginButtonContainer).on('click', survey.handleStart);
					break;
				case 'Closing':
					// Add the Virtual Flag
					container.addClass('Virtual').addClass('ORHide');
					// Just show the closing message
					container.append('<div class="ORSurveyClosing">' + survey.settings.closingText + '</div>');
					break;
				case 'Finish':
					// Add a finish button
					var beginButtonContainer = $('<div class="ORCommandButton ORBeginButton"></div>').appendTo(container);
					$('<button class="' + options.controlClass + '">' + ORStrings['FINISH_SURVEY'] + '</button>').appendTo(beginButtonContainer).on('click', survey.handleFinish);
					break;
				case 'Empty':
					// Item to render when the survey is empty
					container.append('<div class="ORSurveyEmpty">' + ORStrings['EMPTY_SURVEY'] + '</div>');
					break;
				case 'Label':
					container.append('<div class="ORLabel">' + item.label + '</div>');
					break;
				case 'RadioText':
				case 'RadioImage':
				case 'RadioHTML':
				case 'RadioVideo':
				case 'ListText':
				case 'ListImage':
				case 'ListVideo':
				case 'ListHTML':
				case 'BinaryYesNo':
				case 'BinaryGender':
				case 'BinaryTrueFalse':
				case 'ListCheck':
				case 'DropDown':
					if (item.itemType == 'DropDown') {
						survey.uiItems[item.id] = new survey.ui.dropDown($.extend({
							defaultLabel: ORStrings['SELECT_OPTION'],
							options: item.choice.options,
							other: item.choice.other
						}, baseSettings));
					} else {
						survey.uiItems[item.id] = new survey.ui.listChoice($.extend({
							options: item.choice.options,
							multiSelect: item.choice.multiSelect,
							showIcon: item.choice.showIcon,
							other: item.choice.other
						}, baseSettings));
					}
					break;
				case 'OpenSingleLine':
				case 'OpenMultipleLine':
				case 'OpenRichText':
					baseSettings = $.extend({
						container: itemContainer,
						required: item.required,
						size: item.open.size,
						placeholder: item.open.defaultText
					}, baseSettings);
					if (item.itemType == 'OpenSingleLine') {
						survey.uiItems[item.id] = new survey.ui.input(baseSettings);
					} else if (item.itemType == 'OpenRichText') {
						survey.uiItems[item.id] = new survey.ui.textEditor(baseSettings);
					} else {
						survey.uiItems[item.id] = new survey.ui.textArea(baseSettings);
					}
					break;
				case 'RateRadioText':
				case 'RateRadioImage':
				case 'RateRadioVideo':
				case 'RateRadioHTML':
					survey.uiItems[item.id] = new survey.ui.rank($.extend({
						options: item.choice.options,
						multiSelect: item.choice.multiSelect,
						showIcon: item.choice.showIcon,
						levels: item.rate.levels,
						headerStyle: item.rate.headerStyle,
						headerLabels: item.rate.headerLabels,
						headerCategory: item.rate.headerCategory
					}, baseSettings));
					break;
				case 'Group':
					item.matrix = {
						rows: 1,
						cols: 1
					};
				case 'Matrix':
					// Matrices don't have an UI equilavent. They only need to be rendered as classical tables
					var tableObject = $('<div class="ORTable OR' + item.itemType + 'Table"></div>').appendTo(container);
					for (var row = 0; row < item.matrix.rows; ++row) {
						var rowObject = $('<div class="ORTableRow"></div>').appendTo(tableObject);
						for (var col = 0; col < item.matrix.cols; ++col) {
							var cellObject = $('<div class="ORTableCell"></div>').appendTo(rowObject);
							// Only matrices have dimension atribute
							if (item.itemType == 'Matrix') {
								if (item.matrix.widths[col].dimension > 0) {
									cellObject.css('width', '' + item.matrix.widths[col].dimension + survey.decodeUnit(item.matrix.widths[col].unit))
									// By default, if a single column is in pixels, then the rest of the table is width auto instead of 100%
									if (item.matrix.widths[col].unit == 'Pixels') {
										tableObject.css('width', 'auto');
									}
								}
							}
						}
					}
					break;
				default:
					container.append('<div class="ORSurveyItem">' + item.id + ' ' + item.itemType + ' ' + item.order + ' not implemented</div>');
			}

			// Add a pointer to the item object
			container.data('item', {
				id: item.id,
				itemType: item.itemType,
				parentItemId: item.parentItemId,
				visibility: item.visibility
			});

			// By default, clicking an item actives it. Please note that some of the uiItems
			// stop propagation of click. For that reason, they may have to call this handler
			container.on({
				click: function() {
					survey.handleActive($(this));
				}
			});

			// Store the current item id
			if (item.itemType == 'Intro') {
				survey.render.currentItem = 'First';
			} else if (item.itemType == 'Closing') {
				survey.render.currentItem = 'Last';
			} else {
				survey.render.currentItem = item.id;
			}

			if (item.itemType != 'Intro' && item.itemType != 'Label' && item.itemType != 'Matrix'  && item.itemType != 'Group') {
				// Clear floats:
				container.append('<div class="ORClearFloat" />');
			}
		};

		/**
		 * Based on the visibility rules, it will show or hide items accordingly
		 */
		this.applyRules = function() {
			survey.contentItems.find('.ORItemContainer').each(function() {
				var item = $(this).data('item');
				var container = $(this);

				// Eventually, we could have different behaviors on showing and hiding items
				var operationShow = function() {
					container.css('display', 'block').removeClass('ORInvisible');
				};
				var operationHide = function() {
					container.css('display', survey.settings.showHiddenItemsAsDisabled ? 'block' : 'none').addClass('ORInvisible'); //none
				};

				// jQuery traverses down the DOM. So, if the parent is hidden, then also apply
				// to the current element
				var parentElement = container.parent().closest('.ORItemContainer');
				if (parentElement.length > 0 && parentElement.hasClass('ORInvisible')) {
					operationHide();
					return;
				}

				// Apply rules only to items that have rules
				if (survey.isItemActivable(item) && typeof item.visibility != 'undefined' && item.visibility.rules.length > 0) {

					// Indentity operation for OR
					var ruleSetResult = false;
					// First, iterate in group rules (OR)
					$.each(item.visibility.rules.map(function(rule, index) {
						// Indentity operation for AND
						var ruleResult = true;
						// Then, evaluate each group (AND)
						$.each(Object.keys(rule.ruleSet).map(function(id) {
							var value = rule.ruleSet[id]

							if (typeof survey.responses[id] != 'undefined') {
								// This means a response value has been recorded
								if ($.isArray(value)) {
									// ListCheck items have array format. We have to check arrays are equal
									return utils.areArraysEqual(value, survey.responses[id]);
								} else if (typeof value == 'object') {
									// For the case of multi item objects, check individual keys
									var ruleItemSet = true;
									$.each(value, function(key, itemOption) {
										// Ignore when key should  value -1
										if (itemOption >= 0) {
											ruleItemSet = ruleItemSet && (survey.responses[id][key] == itemOption);
										}
									});
									return ruleItemSet;
								}
								return survey.responses[id] == value;
							}
							// If no response is provided, then return the identity value
							return false;

						}), function(index, value) {
							// Reduce the ruleSet
							ruleResult = ruleResult && value;
						});

						return ruleResult;

					}), function(index, value) {
						// Reduce the rules
						ruleSetResult = ruleSetResult || value;
					});

					utils.console('ruleSet for ' + item.id + ' is ' + ruleSetResult);
					// Finally apply the show of hide action
					if (item.visibility.inverted ? !ruleSetResult : ruleSetResult) {
						operationShow();
					} else {
						operationHide();
					}
				}

			});
		};

		/**
		 * Determines and call for rendering the next items (may be just one, or even none)
		 */
		this.navigate = function() {
			// Increase active child count
			survey.render.activeChild++;

			if (survey.render.currentItem === 'First') {
				// If user selected displaying an intro text, then we have the 'First' string

				survey.contentItems.hide();
				survey.contentItems.empty();
				// Orderly, display all items

				// This function sorts all provided items, so that when children elements
				// of groups and matrices be inserted, the parent element will be already there
				function getAllItemsSorted() {

					// Here we will store the result
					var itemArray = [];
					// Sorting must be in the order of appereance of items, since that is
					// assumed by later functions. For example, if there a matrix in the 3 index,
					// then index 4 has it first children [1,0], [2,0], [3, 0], [9, 3], [10, 3], [4, 0]
					function getItemsFromParent(item) {

						var items = $(survey.items).filter(function() {
							return this.parentItemId == item.id;
						}).get();
						items.sort(function(a, b) {
							if (parseInt(a.cell.y) > parseInt(b.cell.y)) {
								return 1;
							} else if (parseInt(a.cell.y) < parseInt(b.cell.y)) {
								return -1;
							} else if (parseInt(a.cell.x) > parseInt(b.cell.x)) {
								return 1;
							} else if (parseInt(a.cell.x) < parseInt(b.cell.x)) {
								return -1;
							} else if (parseInt(a.order) > parseInt(b.order)) {
								return 1;
							} else {
								return -1
							}
						});

						if (item.id != '0') {
							itemArray = itemArray.concat(item);
						}

						for (var i = 0; i < items.length; ++i) {
							getItemsFromParent(items[i]);
						}
					}

					getItemsFromParent({
						id: '0'
					});
					return itemArray;
				}
				survey.items = getAllItemsSorted();

				survey.displayItems();

				if (survey.hasClosing()) {
					survey.renderItem({
						itemType: 'Closing'
					});
					// When using the classic mode, hide the closing item
					if (survey.settings.scrollingMode === 'Classic') {
							survey.contentItems.find('.Closing').css({
									display: 'none'
							});
					}
				}

				if (survey.items.length == 0) {
					// This means we have an empty survey
					survey.renderItem({
						itemType: 'Empty'
					});
				}

				if (survey.settings.scrollingMode == 'Classic') {
					// If smartscroll is disabled, add a next button
					if (!survey.render.finished) {
						// TODO: When implementing survey chunks
					} else {
						// This means we have an empty survey
						survey.renderItem({
							itemType: 'Finish'
						});
					}
				} else {
					// Add a spacer to allow last elements to be centered
					$('<div class="OREndSpacer" />').appendTo(survey.contentItems);
				}

				// Show content
				survey.contentItems.show();
				survey.adjustContainerHeight();
			} else {
				// For all survey items
				survey.displayItems();
			}

		};

		/**
		 * Adds to the main container the elements that must be rendered
		 */
		this.displayItems = function() {
			// If smart scrolling is off, display as much as possible
			if (survey.settings.scrollingMode == 'Classic')
				survey.settings.visibleItems = 999;
			else
				survey.settings.visibleItems = 15;

			// Render items until visible items matches "display window" or
			// there a no more items to render
			var securityLimit = 25;
			// Get the number of items already rendered
			var visibleItems = survey.countVisibleItems();
			// Get the number of items that will be rendered
			// TODO: Check display rules
			var remainingItems = survey.countRemainingItems();
			// Limit only when smart scrolling
			// TODO: Honor visibleItems < survey.settings.visibleItems
			while (remainingItems > 0 && securityLimit > 0) {
				utils.console("Visible items: " + visibleItems);
				utils.console("Rendering item " + survey.getNextItemToRenderIndex());
				var nextItemIndex = survey.getNextItemToRenderIndex();

				if (nextItemIndex < survey.items.length)
					survey.renderItem(survey.items[nextItemIndex]);

				// Update remaining items count
				remainingItems = survey.countRemainingItems();
				visibleItems = survey.countVisibleItems();
				utils.console("Remaining items: " + remainingItems);

				// Decrease security limit (avoids client browser hung up because of us!)
				--securityLimit;
			}

			// Apply show and hide rules (visibility)
			survey.applyRules();
		};

		/**
		 * When user fills an item, this handler will be fired
		 */
		this.itemAnsweredHandler = function(eventData) {

		};

		/**
		 * Counts the number of items currently on screen (survey.content area)
		 * TODO: Recursively tell visible items, until row level
		 */
		this.countVisibleItems = function() {
			return survey.contentItems.find('.ORItemContainer').length;
		};

		/**
		 * Returns whether the current item is the last one in the survey
		 */
		this.isLastItem = function(previous) {
			if (survey.render.currentItem == 'First' || typeof previous == 'undefined') {
				return false;
			}
			// To check for the last item, better let jquery to do it
			return previous.data('item').id == survey.contentItems.find('.ORItemContainer').not('.Virtual').last().data('item').id;
		};

		/**
		 * Returns whether the current item is the last one in the survey
		 */
		this.isFirstItem = function(previous) {
			return survey.contentItems.find('.ORItemContainer.Active').length === 0;
		};

		/**
		 * Returns whether the current item can be activated
		 */
		this.isItemActivable = function(item) {
			return ['Label', 'Group', 'Matrix', 'Intro', 'Finish'].indexOf(item.itemType) == -1 || (item.itemType == 'Label' && survey.getParentItemType(item) != 'Matrix');
		};

		/**
		 * Returns whether the current item is visible. Remember that parents of the
		 * provided item also must to be checked
		 */
		this.isItemVisible = function(item) {
			return $(survey.container).find('.ORItemId' + item.id).closest('.ORItemContainer.ORInvisible').length === 0;
		};

		/**
		 * Counts the number of remaining items
		 */
		this.countRemainingItems = function() {
			// TODO: Check display rules and ordering
			return survey.items.length - survey.getCurrentItemIndex() - 1;
		};

		/**
		 * Returns the item type of the parent
		 * @param {Item} and item object (not jQuery)
		 */
		this.getParentItemType = function(item) {
			// Find the parent item in the survey items array and return the
			// itemType
			if (item.parentItemId == '0') {
				return 'Root';
			}
			return (survey.getItemById(item.parentItemId)).itemType;
		};

		/**
		 * Returns the item data (in surveyItems) provided the id String
		 */
		this.getItemById = function(itemId) {
			return $(survey.items).filter(function() {
				return this.id === itemId;
			}).get(0);
		};

		/**
		 * Determine the index of survey.items that corresponds to the next item
		 * to render
		 */
		this.getNextItemToRenderIndex = function() {
			// TODO: Check display rules and ordering
			// Just increment current index
			return survey.getCurrentItemIndex() + 1;
		};

		/**
		 * Provided an item ID (or First, Last), get the corresponding index in
		 * survey items array
		 */
		this.getCurrentItemIndex = function() {
			// Consider special cases
			if (survey.render.currentItem === 'First') {
				return -1;
			} else if (survey.render.currentItem === 'Last') {
				return survey.items.length - 1;
			}
			// Create an array containing only the ids from items
			var surveyItemsIds = survey.items.map(function(element, index) {
				return element.id;
			});
			// Now search inside the created index for the value
			return surveyItemsIds.indexOf(survey.render.currentItem);
		};

		/**
		 * Accesor the ORItemContainer of the next element
		 */
		this.getNextItem = function(previous) {
			return survey.getItem(previous, 1);
		};

		/**
		 * Accesor the ORItemContainer of the previous element
		 */
		this.getPreviousItem = function(previous) {
			return survey.getItem(previous, -1);
		};

		/**
		 * Find recursively the next  or previous item, at the same time, it avoids marking a whole
		 * matrix, group or label element as active
		 */
		this.getItem = function(previous, offset) {
			// Create an array containing only the ids from items
			var activeIndex = -1;

			// Find the element wich has the Active token
			$.each(survey.items, function(index, element) {
				if ($(survey.container).find('.ORItemId' + this.id).hasClass('Active')) {
					activeIndex = index;
				}
			});

			// Advance the pointer until element not a label, matrix or group
			// Remembert considering elements that are visible (does not have class ORInvisible)
			var itemOffset = activeIndex + offset
			while (itemOffset >= 0 && itemOffset < survey.items.length && (!survey.isItemActivable(survey.items[itemOffset]) || !survey.isItemVisible(survey.items[itemOffset]))) {
				// Move the pointer
				itemOffset += offset;
			}

			// The the index is not in the array, then we're done
			if (activeIndex + offset === -1 || activeIndex + offset === survey.items.length) {
				return previous;
			}

			// Finally return the element
			return $(survey.container).find('.ORItemId' + survey.items[itemOffset].id);
		};

		this.adjustContainerHeight = function(callback) {
			// A callback is needed to chain respondant animations
			if (typeof callback != 'function') {
				callback = function() {};
			}

			var containerPadding = parseInt(survey.content.css('margin-bottom').replace('px', ''));
			var footerHeight = survey.footer.outerHeight();
			if (survey.isFirstItem() && options.expandable === true) {
				utils.console('Resizing container first item');
				// In this case, set the size of the container as the size of the first item
				var newHeight = survey.contentItems.find('.ORItemContainer').not('.Group, .Matrix').first().outerHeight() + containerPadding + footerHeight;
				survey.container.css({
					height: newHeight + 'px'
				});
				callback(newHeight);
			} else if (options.minimalSize || options.expandable) {
				if (survey.isAnimated()) {
					survey.container.addClass('ORAnimateResize');
					survey.container.css({
						transitionDelay: options.animation.resize.delay + 'ms',
						transitionDuration: options.animation.resize.transition + 'ms'
					});
				}

				// Get the current height
				var currentHeight = survey.container.height();
				// Find the item with the minimal size
				var heights = survey.contentItems.find('.ORItemContainer').not('.Group, .Matrix').get().map(function(element, index) {
					return $(element).outerHeight();
				});
				// Finally the max height
				var maxHeight = Math.max.apply(null, heights) + containerPadding + footerHeight;
				// Apply the new height
				if (maxHeight > currentHeight) {
					// Check for autosize... if true, then update the size
					survey.container.css({
						height: maxHeight
					});
					callback(maxHeight);
				} else {
					// Just resume survey [scrolling]
					callback();
				}
			} else {
				// Just resume survey [scrolling]
				callback();
			}
		};

		this.handleActive = function(target) {
			// Check if this was invoked from the item itself of the respondant wrap ORItemContainer
			if (!target.hasClass('ORItemContainer')) {
				target = target.closest('.ORItemContainer');
			}

			// Don't active items that are now activable
			if (!survey.isItemActivable(target.data('item'))) {
				return;
			}

			// Avoid reactivating the same item
			if (target.hasClass('Active')) {
				return;
			}

			survey.contentItems.find('.ORItemContainer').removeClass('Active');
			target.addClass('Active');

			// If it is the first time the survey clicks the survey,
			// then we considere it as the start point
			if (survey.status == 'loaded') {
				survey.status = 'started';
			}

			if (survey.settings.scrollingMode == 'Smart') {
				survey.scrollSurvey(target);
			}
		};

		/**
		 * Helper method to scroll survey provided direction
		 */
		this.scrollSurvey = function(target, previousTarget, initialHeight, animate) {
			if (target.length == 0) {
				// If scroll target is empty, then nothing must be done
				return;
			}
			// Update survey state
			survey.navigate();

			// Items need to know how much container is height (for SmartScrolling)
			survey.render.containerHeight = initialHeight || survey.content.parent().height();

			var firstItemOffset = survey.contentItems.children('.ORItemContainer').first().position().top;
			// Do the following:
			//  - Remove active item for all items
			//  - Select the target item
			//  - Mark it getParentItemTypeas active
			//  - Invoke the selection handler for the item
			survey.contentItems.find('.ORItemContainer').removeClass('Active');
			var activeItem = target.addClass('Active');
			if (activeItem.hasClass('Closing')) {
				// Fade in the closing message
				activeItem.removeClass('ORHide').addClass('ORShow');
				// Check for autohide
				if (options.autoHide !== false && options.fullScreen === false) {
					survey.hideSurvey();
				}
			}

			if (typeof previousTarget != 'undefined' && previousTarget.hasClass('Closing')) {
				// Fade in the closing message
				previousTarget.removeClass('ORShow').addClass('ORHide');
			}

			// In the case of matrices, the TR container should be used instead
			if (activeItem.data('item').itemType == "Matrix" && typeof activeItem.data('item').parentItemId != 'undefined' && activeItem.data('item').parentItemId !== 0) {
				activeItem = activeItem.closest('.ORTableRow');
			}
			console.log(activeItem)
			console.log(activeItem.position())

			// Get active item Height and relative Offset
			var activeItemHeight = activeItem.outerHeight(true);
			var activeItemOffset = activeItem.position().top;

			var targetMargin = activeItemOffset - (survey.render.containerHeight - activeItemHeight) / 2;
			// Here it is the special case of the last item, which will be a closing type element
			if (activeItem.hasClass('Closing')) {
				targetMargin = activeItemOffset - firstItemOffset;
			}

			var currentMargin = -parseFloat((survey.content.get()[0].style.marginTop || '0').replace('px', ''));
			if (Math.abs(currentMargin - targetMargin) > 3) {
				survey.content.css({
					marginTop: -targetMargin + 'px'
				});
			}

			if (survey.settings.scrollingMode == 'Smart') {
				// Invoke the selection handler some items have: (Ex: DropDown to expand)
				// First, deactivate previous item (optional)
				if (typeof previousTarget != 'undefined') {
					var prevItemId = previousTarget.data('item').id;
					if (typeof survey.uiItems[prevItemId] != 'undefined' && typeof survey.uiItems[prevItemId].deactivate != 'undefined') {
						survey.uiItems[prevItemId].deactivate();
					}
				}

				// Then, activate the new item, if item is activable
				// First, when target item is not an item, it means we come from
				// the intro page
				if (typeof target.data('item') !== 'undefined') {
					var newItemId = target.data('item').id;
					if (typeof survey.uiItems[newItemId] != 'undefined' && typeof survey.uiItems[newItemId].activate != 'undefined') {
						survey.uiItems[newItemId].activate();
					}
				}
			}
		};

		/**
		 * Handler for survey start
		 */
		this.handleStart = function(event) {
			survey.handleNext();
		};

		/**
		 * Handler for survey continue. Please note that if user changes an answer
		 * the result may be the survey going back
		 */
		this.handleNext = function(event) {

			// For the case of using arrows directly, mark the survey status
			survey.status = 'started';

			event = $.extend({
				remainInItem: false // Used to, regarding the selection on an element, to remain on the same item (e.g. Rate)
			}, event);

			if (survey.contentItems.find('.ORItemContainer.Active').length == 0) {
				// If survey has just started, mark first item as active
				survey.contentItems.find('.ORItemContainer').first().addClass('Active');
			}

			// Check if current item holds a valid UIItem
			// If typeof ORSurveyId == 'undefined' then we're in preview mode
			if (typeof survey.uiItems[event.relatedItemId] !== 'undefined' && typeof ORSurveyId !== 'undefined') {

				// Check related item information is in event. If not, extract it manually
				if (typeof event.relatedItemId == 'undefined') {
					event.relatedItemId = survey.render.currentItem;
					event.value = survey.uiItems[event.relatedItemId].getValue();
				}

				// Mark the survey as started
				survey.status = 'started';

				// Check that we're not in preview modee
				if (survey.preview !== true && survey.options.testMode !== true) {

					// Write the cookie to avoid showing the same survey to the same user
					survey.setCookieStatus('started');
					survey.setCookieLastItem(event.relatedItemId);

					// data to send
					var responseData = {
						value: event.value
					};

					// For browsers preventing cookies to leave (IE with privacy settings, old ie)
					responseData.sessionCookie = survey.sessionCookie;

					// Send value to the server
					// $.ajax({
					// 	url: server + "/respondant/submit/" + survey._id + "/" + event.relatedItemId,
					// 	cache: false,
					// 	data: JSON.stringify(responseData),
          //   beforeSend: function(xhr) {
          //     xhr.setRequestHeader("Authorization", "Bearer " + localStorage.getItem('ORResponsesSessionJWT'));
          //   },
					// 	type: "POST",
					// 	contentType: 'application/json; charset=utf-8',
					// 	statusCode: {
					// 		200: function(res) {
					// 			utils.console(utils.tr(ORStrings['SUCCESS_STORING_RESPONSES'], event.relatedItemId));
          //       if (survey.status === "finished") {
          //         localStorage.removeItem('ORResponsesSessionJWT');
          //       } else {
          //         localStorage.setItem('ORResponsesSessionJWT', res.token);
          //       }
					// 		},
					// 		400: function(res) {
					// 			new ORNotify({
					// 				surveyContainer: survey.container,
					// 				message: ORStrings[res.responseText],
					// 				autoHide: 4500
					// 			});
					// 		}
					// 	},
					// 	error: survey.ajaxErrorHandler
					// });
				}

				// Store locally the new response
				survey.responses[event.relatedItemId] = survey.uiItems[event.relatedItemId].getValue();

				// Apply show and hide rules (visibility)
				survey.applyRules();

				// Call any related handler
				// Default returned object
				var eventResult = {
					survey: {
						container: survey.container,
						reject: function() {
							survey.setRejected();
						}
					},
					response: {
						value: survey.responses[event.relatedItemId]
					}
				}

				if (utils.objectSize(survey.responses) == 1) {
					utils.console('Calling onFirstItemChange handler');
					options.events.onFirstItemChange(eventResult);
				}
				// The generic item handler for when item change its value
				options.events.onItemChange(eventResult);
			}

			// Verify we're not in classic mode
			if (survey.settings.scrollingMode == 'Classic' && survey.render.currentItem != 'First' && survey.render.currentItem != 'Last') {
				// If it was invoked with the buttons, then do a fixed amount scrolling
				if (typeof event.data != 'undefined' && event.data.fromButton === true) {
					survey.manualScroll(1);
				}
				return;
			}

			if (surveyStatus === 'active' && event.remainInItem !== true) {
				survey.adjustContainerHeight(function(initialHeight) {
					var scrollTarget = $();
					var previousTarget;

					function selectNextItem(activeItem, previousTarget) {
						// Check for the ending of the survey
						if (activeItem.is(survey.contentItems.find('.ORItemContainer').last())) {
							return false;
						} else if (survey.isLastItem(previousTarget) && survey.settings.scrollingMode == 'Smart') {
							survey.handleFinish();
							scrollTarget = survey.contentItems.find('.ORItemContainer').last();
						} else {
							// If smart scrolling is deactivated, then don't scroll, but mark it as active
							if (survey.settings.scrollingMode != 'Smart') {
								return false;
							} else {
								scrollTarget = survey.getNextItem(previousTarget);
							}
						}
						// This means Go with Scroll
						return scrollTarget;
					}

					var activeItem = survey.contentItems.find('.ORItemContainer.Active');
					// If this is invoked by an UIItem, get the caller to select
					if (typeof event.caller !== 'undefined') {

						previousTarget = $(event.caller).closest('.ORItemContainer');
						// Get the next item
						scrollTarget = selectNextItem(activeItem, previousTarget);
					} else {

						if (activeItem.length > 0) {
							// Pass the current active item
							previousTarget = activeItem.first();
							// Get the next item
							scrollTarget = selectNextItem(activeItem, previousTarget);
						} else {
							// If survey has just started, mark first item as active
							scrollTarget = survey.contentItems.find('.ORItemContainer').first();
						}
					}

					// Finally, apply the scroll
					if (scrollTarget !== false) {
						survey.scrollSurvey(scrollTarget, previousTarget, initialHeight);
					}
				});
			} else if (surveyStatus === 'rejected') {
				survey.hideSurvey()
			}

		};

		/**
		 * Handler for survey back button
		 */
		this.handlePrevious = function(event) {
			// Verify we're not in classic mode
			if (survey.settings.scrollingMode == 'Classic') {
				// If it was invoked with the buttons, then do a fixed amount scrolling
				if (typeof event.data != 'undefined' && event.data.fromButton === true) {
					survey.manualScroll(-1);
				}
				return;
			} else {
				// Prevent survey from hiding when scrolling back
				survey.showSurvey();
			}

			var scrollTarget = $();
			var previousTarget;
			var activeItem = survey.contentItems.find('.ORItemContainer.Active');
			if (activeItem.length > 0) {
				// Pass the current active item
				previousTarget = activeItem.first();

				// Virtual element do not have item data attached
				if (previousTarget.hasClass('Virtual')) {
					if (!activeItem.is(survey.contentItems.find('.ORItemContainer').first())) {
						scrollTarget = previousTarget.prev();
					}
				} else {
					scrollTarget = survey.getPreviousItem(previousTarget);
				}
			} else {
				// If survey has just started, mark first item as active
				scrollTarget = survey.contentItems.find('.ORItemContainer').first();
			}

			survey.scrollSurvey(scrollTarget, previousTarget);
		};

		/**
		 * Handler for survey finish
		 */
		this.handleFinish = function(event) {

      // Trigger the Finish Event
      var eventResult = {
        survey: {
          container: survey.container
        },
        responses: {
          value: survey.responses
        }
      };

      // Finally call the handler
      utils.console('Calling onSurveyFinish handler');
      options.events.onSurveyFinish(eventResult);

      // Set the status cookie to finished
      survey.setCookieStatus('finished');
      // Remove the LastItem{surveyShortId} Cookie
      survey.setCookieLastItem(null);

      // Just in case there is no cookie support
      survey.status = 'finished';

      // We must check we're not already in the last item
			// this avoids playing the close animation (fadeOut) multiple times
			if (survey.render.currentItem != 'Last') {
				survey.render.currentItem = 'Last';

        // Show the closing message if using the classic mode
        if (survey.settings.scrollingMode === 'Classic') {
            survey.contentItems.children('.ORItemContainer:not(.Closing)').fadeOut().hide();
            survey.contentItems.children('.Closing').css('visibility', 'visible').fadeIn();
        }
      }
		};

		this.hasClosing = function() {
			return survey.settings.closingText != 'undefined' && survey.settings.closingText != '';
		};

		/**
		 * Returns the status of the survey according to the cookie
		 */
		this.getStatusFromCookie = function() {
			var statusCookieValue = $.cookie('ORSurveyStatus' + survey.shortId, {
				path: '/'
			});
			if (typeof statusCookieValue !== 'undefined') {
				return statusCookieValue;
			}
			return 'launched';
		};

		/**
		 * Update the survey cookie with the new status
		 */
		this.setCookieStatus = function(newStatus) {
			$.cookie('ORSurveyStatus' + survey.shortId, newStatus, {
				expires: 180,
				path: '/'
			});
		};

		/**
		 * Update the survey cookie with the last item id (for instance, resuming)
		 */
		this.setCookieLastItem = function(itemId) {
			$.cookie('ORSurveyLastItem' + survey.shortId, itemId, {
				expires: 180,
				path: '/'
			});
		};

		/**
		 * Applies a scroll by a fixed amount to the content items container
		 */
		this.manualScroll = function(sign) {
			survey.content.css({
				scrollTop: survey.content.scrollTop  + sign * parseInt(survey.content.height() / 2 )
			});
		};

		/**
		 * Handles the mouse wheel event
		 */
		this.wheelHandler = function(event) {
			// Avoid the issue of some scrolling the survey accidentally
			if (survey.status === 'loaded' && survey.options.ignoreFirstMouseScroll === true) {
				return;
			}

			if (survey.settings.scrollingMode != 'Classic') {
				var delta = event.deltaY;
				// Not sure if this can happen
				if (delta == 0) {
					return;
				}
				if (survey.isMouseWheelScrollInProgress === true) {
					// Prevent too many scroll events consecutively
					return;
				} else {
					survey.isMouseWheelScrollInProgress = true;
					setTimeout(function() {
						survey.isMouseWheelScrollInProgress = false;
					}, 250);
				}
				if (delta > 0) {
					survey.handleNext();
				} else {
					survey.handlePrevious();
				}
				event.preventDefault();
			}
		};

		this.decodeUnit = function(unitName) {
			switch (unitName) {
				case 'Pixels': return 'px';
				case 'Em': return 'em';
				default: return '%';
			}
		}

		// Set initial options
		this.options = options;
		// Load the survey
		this.loadSurvey();
	};

	// Here our exposed methods start (for the API)
	this.start = function() {
		// Select the main survey container
		var ORContainer = ORSettings.container || $('#' + ORContainerId);

		// If we are not in preview, load the survey
		var OROptions = {
			id: ORSurveyId, // SurveyId is global variable which user can modify
			container: ORContainer, // Target container,
			height: ORSettings.height,
			minimalSize: ORSettings.minimalSize,
			expandable: ORSettings.expandable,
			animation: ORSettings.animation || {},
			autoHide: ORSettings.autoHide,
			data:  ORSettings.data,
			testMode:  ORSettings.testMode,
			fullScreen:  ORSettings.fullScreen || false,
			ignoreFirstMouseScroll:  typeof ORSettings.ignoreFirstMouseScroll !== 'undefined' ? ORSettings.ignoreFirstMouseScroll : (ORSettings.fullScreen === true ? false : true),
			scrollingMode: ORSettings.scrollingMode,
			template: ORSettings.template,
			templates: ORSettings.templates || ORTemplates(),
			controlClass: ORSettings.controlClass,
			events: ORSettings.events
		}
		var survey = new ORLaunchSurvey(OROptions);

		// Register this survey in the collection of surveys
		ORSurveys[ORSurveyId] = survey;
	}

	// Backwards style
	this.start();
};

function tryGetSurvey(surveyId) {
	if (Object.keys(ORSurveys).length == 0) {
		throw Error("There are no surveys created. First call 'launchSurvey'");
	} else if (Object.keys(ORSurveys).length == 1) {
		return ORSurveys[Object.keys(ORSurveys)[0]];
	} else if (typeof surveyId === "undefined") {
		throw Error("surveyId was not provided. When there are more than 1 survey, it is required");
	} else if (Object.keys(ORSurveys).indexOf(surveyId) < 0) {
		throw Error("surveyId " + surveyId + " was not found");
	} else {
		return ORSurveys[surveyId];
	}
}

export function getResponses(surveyId) {
	return tryGetSurvey(surveyId).getResponses();
};

export function resetResponses(surveyId) {
	tryGetSurvey(surveyId).resetResponses();
};
