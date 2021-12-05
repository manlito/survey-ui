/**
 *
 * This file contains common plugins an methods for whole OverResponser.com
 * website.
 * jQuery plugins:
 *  -getURLParameter (extract get params from window.location)
 *  -randomId (generates guid like identifiers)
 *  -swap (interchange two jQuery objects)
 *  -notify (present notices to user)
 *  -console (outputs debug information for error reporting)
 *  -selText (cross browser compatible text selector for inputs)
 *
 * Other funtions
 *  -printArray (prints object data (not arrays!))
 *  -getObjectKeys (helper for printArray)
 *
 */

/**
 * JQuery plugin to find cell index provided a table cell
 */
jQuery.fn.getCellIndexes = function() {
	var cellIndexes = {
		x: 0,
		y: 0
	};
	var cell = this;
	cellIndexes.x = cell.parent().children().index(cell);
	var row = cell.parent();
	cellIndexes.y = row.parent().children().index(row);
	return cellIndexes;
};

/**
 * JQuery plugin that will deliver URL parameters
 */
jQuery.fn.getURLParameter = function() {
	var expression = /Unset/;
	switch (this.selector) {
		case 'surveyId':
			expression = /editor\/([^\/]+)/;
	}
	var result = new RegExp(expression).exec(window.location);
	if (result)
		return result[1];
	else
		return '';
};

/**
 *
 * This functions is able to select text of input fields
 * TODO: Verify if $.select() works across browsers
 *
 */
jQuery.fn.selText = function() {
  var $ = jQuery;
	var obj = this[0];
	var selection = obj.ownerDocument.defaultView.getSelection();
	selection.setBaseAndExtent(obj,0,obj,1);

	return this;
}

/**
 * JQuery plugin that allows swapping two elements
 */
jQuery.fn.swap = function(b) {
	// Get a pointer to element that is before the dragged element
	var previousItem = $(b).prev();
	// Move the dragged element before droppable target
	$(b).insertBefore(this);
	// Move the droppable element just before where draggable was
	$(this).insertAfter(previousItem);
};

/**
 * JQuery plugin to display messages
 */
jQuery.fn.notify = function(options) {
	settings = $.extend({
		type: 'Notification',
		message: 'Operation has succeed',
		autoHide: 5000,
		title: '',
		position: 'top',
		layout: 'bottom',
		command: undefined,
		commandLabel: ''
	}, options);

	if (typeof options.autoHide == 'undefined') {
		settings.autoHide = 3000 + settings.message.length * 50;
	}

	if (this.selector != '') {
		settings.message = this.selector;
	}
	settings.message = settings.message;

	// Transform the message type to Noty
	switch(settings.type) {
		case 'Notification': settings.type = 'success'; break;
		case 'Warning': settings.type = 'warning'; break;
		case 'Error': settings.type = 'error'; break;
		default: settings.type = 'alert'; break;
	}
	noty({
		layout: settings.layout,
		dismissQueue: true,
		type: settings.type,
		text: settings.message,
		timeout: settings.autoHide ? settings.autoHide : false
	});
};

function notify(parameters) {
	if (typeof parameters === 'string')
		$.fn.notify({
			message: parameters
		});
	else
		$.fn.notify(parameters);
}
/**
 * Hash Code generator from
 * From:  http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

/**
 * This is used by translation to replace strings. First argument is a label
 * that may contain %s or %S. Then, the following arguments are the corresponding
 * replaces
 * NOTE: THIS ITEM IS DUPLICATED IN RESPONDANT/UTIL.JS
 */
function tr(label) {
	var args = Array.prototype.slice.call(arguments, 0);
	var replaces = args.slice(1);
	for (var i = 0; i < replaces.length; ++i) {
		label = label.replace(/\%s/i, replaces[i]);
	}
	return label;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getKeys(object) {
	return $.map(object, function(value, key) {
		return key;
	});
}

var unbinded = function(event) {
	alert("Not set");
};

function runOrWhenDOMReady(handler) {
	if (document.readyState === 'complete') {
		handler();
	}
	$(document).ready(function() {
		handler();
	});
}

/**
 *
 * DEBUGGING FUNCTIONS
 *
 */

function printArray(object) {
	if ( typeof object !== "object")
		return object;

	var keys = getObjectKeys(object);
	var paste = "";
	for (var i = 0; i < keys.length; ++i) {
		paste += keys[i] + ': ' + printArray(object[keys[i]]) + ",\n";
	}
	return paste;
}

function getObjectKeys(object) {
	var keys = [];
	for (var i in object)
	if (object.hasOwnProperty(i)) {
		keys.push(i);
	}
	return keys;
}

/**
 * Extends Bootstrap Popover with a close button
 * @param {Object} object
 */
function popOver(object) {

    popOverTour([object]);
}

/**
 * Shows a series of steps for help... similar to Bootstrap Tour, but with basic
 * functionality
 *
 * @param steps
 */
function popOverTour(steps) {

    // Destroy all other popOvers
    $('.ORHelp').popover('destroy');

    // All close buttons have the same behavior
    var closeButton = '' +
        '<div style="padding-top: 5px; text-align: right;">' +
        '   <button class="btn btn-default pull-right clearfix" onclick="$(\'.ORHelp\').popover(\'hide\');">' + frontendStrings.commands.close + '</button>' +
        '</div>';

    $.each(steps, function(index, object) {
        var backButton = '';
        var nextButton = '';
        var navigationButtons = '<div class="btn-group pull-left clearfix" style="padding-top: 5px;">';
        var hidePopover = '';
        if (index > 0) {
            hidePopover = "$('.ORHelp:not(" + steps[index - 1].element + ")').popover('hide');";
            // Extract previous element element
            backButton = '   <button class="btn btn-default" onclick="'+ hidePopover + '$(\'' + steps[index - 1].element + '\').popover(\'show\')"><span class="glyphicon glyphicon-chevron-left" /></button>';
            // Add Prev button
            navigationButtons += backButton;
        }
        if (index < steps.length - 1) {
            hidePopover = "$('.ORHelp:not(" + steps[index + 1].element + ")').popover('hide');";
            // Add Next button
            nextButton = '   <button class="btn btn-default" onclick="' + hidePopover +  '$(\'' + steps[index + 1].element + '\').popover(\'show\')">Next</button>';
            navigationButtons += nextButton;
        }
        navigationButtons += '</div>';

        $(object.element).addClass('ORHelp').popover({
            title: object.title,
            content: object.content + '<div class="clearfix">' + navigationButtons + closeButton + '</div>',
            html: true,
            placement: object.placement
        });
    });

    // Now show first popOver
    $(steps[0].element).popover('show');
}

/**
 * Function to compare a pair of objects
 * From: http://stackoverflow.com/questions/1068834/object-comparison-in-javascript
 * @param {x} Object to compare
 * @param {y} Object to compare
 */
function areEqual(x, y)
{
  var p;
  for(p in y) {
      if(typeof(y[p]) != 'undefined' && typeof(x[p]) == 'undefined') { return false; }
  }

  for(p in y) {
      if (y[p]) {
          switch(typeof(y[p])) {
              case 'object':
                  if (!areEqual(y[p],x[p])) { return false; } break;
              case 'function':
                  if (typeof(x[p])=='undefined' ||
                      (p != 'equals' && y[p].toString() != x[p].toString()))
                      return false;
                  break;
              default:
                  if (y[p] != x[p]) { return false; }
          }
      } else {
          if (x[p])
              return false;
      }
  }

  for(p in x) {
      if(typeof(x[p]) != 'undefined' && typeof(y[p]) == 'undefined') { return false;}
  }

  return true;
}
