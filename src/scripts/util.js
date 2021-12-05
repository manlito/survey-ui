/**
 *
 * Util methods that are used by both BaseUI and the Respondant
 * Loaded before BaseUI. Please note that ORSurveyMain should be
 * defined before in the global scope
 *
 * @author Manlio Barajas
 * @company OverResponse
 *
 */

export default function(jQueryObject) {

	// Make jQuery available in the local scope
	var $ = jQueryObject;

	/**
	 *
	 * Algorithm (fisherYates) to sort randomly items in an array
	 *  Taken from: http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
	 *  Original: http://sedition.com/perl/javascript-fy.html
	 *
	 * @param myArray {Array} The array to shake
	 *
	 */
	this.randomizeArray = function(myArray) {
	  var i = myArray.length, j, tempi, tempj;

	  if (i === 0) return false;
	  while ( --i ) {
		 j = Math.floor( Math.random() * ( i + 1 ) );
		 tempi = myArray[i];
		 tempj = myArray[j];
		 myArray[i] = tempj;
		 myArray[j] = tempi;
	   }
	};

	/**********************************************************
	 *                                                        *
	 * NEXT METHODS ARE PRESENT BOTH IN COMMON AND THIS FILE  *
	 *                                                        *
	 **********************************************************/

	/**
	 * function generating unique Ids from
	 * http://note19.com/2007/05/27/javascript-guid-generator/
	 */
	this.randomId = function() {
		this.S4 = function() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		this.guid = function() {
			return this.S4() + '' + this.S4() + '' + this.S4() + '' + this.S4();
		};
		return this.guid();
	};

	/**
	 * This is used by translation to replace strings. First argument is a label
	 * that may contain %s or %S. Then, the following arguments are the corresponding
	 * replaces
	 */
	this.tr = function(label) {
		var args = Array.prototype.slice.call(arguments, 0);
		var replaces = args.slice(1);
		for (var i = 0; i < replaces.length; ++i) {
			label = label.replace(/\%s/i, replaces[i]);
		}
		return label;
	}

  /**
   * A Wrapper to call the browser log function
   */
  this.c = function(data) {
    if (typeof console != 'undefined' && typeof console.log != 'undefined') {
      console.log(data);
    }
  };
	/**
	 * Handy method for outputing debug information to console, and sending them back as feedback
	 * THIS ITEM IS THE SAME THAT ON OR/SCRIPTS/COMMON.
	 */
	this.console = function(options) {

		this.show = function(show) {
			$.cookie('ORShowDebug', show, { expires: 30, path: '/' });
		};

		if (typeof options == 'string') {
			options = { text: options };
		}

		var settings = $.extend({
			hidden: $.cookie('ORShowDebug') !== 'true' ,
			type: 'Notice'
		}, options);

		var console;
		var messageList;
		var closeButton;
		var cleanButton;
		if ($('#Console').length == 0) {
			console = $('<div id="Console"><div class="clearfix"><div class="btn-group pull-right"></div></div></div>').appendTo('body')
			cleanButton = $('<button type="button" class="btn btn-default">Clean</button>').appendTo(console.find('.btn-group'));
			cleanButton.on({
				'click': function(event) {
					messageList.empty();
				}
			});
      closeButton = $('<button type="button" class="btn btn-default">Close</button>').appendTo(console.find('.btn-group'));
      closeButton.on({
        'click': function(event) {
          console.fadeOut('fast');
        }
      });
      var hideButton = $('<button type="button" class="btn btn-danger">Disable</button>').prependTo(console.find('.btn-group'));
      hideButton.on({
        'click': function(event) {
          $.cookie('ORShowDebug', false);
          closeButton.trigger('click')
        }
      });
			var messageListWrapper = $('<div class="ConsoleArea"></div>').appendTo(console);
			messageList = $('<div class="TextArea"></div>').appendTo(messageListWrapper);
			var commands = $('<div class="btn-group"></div>').appendTo(console);
			$('<button type="button" class="btn btn-default">Send Report</button>').appendTo(commands);
		} else {
			console = $('#Console');
		}
		if (settings.hidden) {
			console.hide();
		} else {
			console.fadeIn('fast');
		}

		console.find('.TextArea').prepend('<div>' + settings.text + '</div>');

	}

	this.objectSize = function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	};

	this.stopPropagation = function(event) {
		event.stopPropagation()
	};

	// Because of matrix elements, some time is needed to fire document click directly
	this.documentClick = function(event) {
		$(document).trigger('click');
	};

	/**
	 * Taken from: http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays
	 */
	this.areArraysEqual = function(arr1, arr2) {
		return $(arr1).not(arr2).length == 0 && $(arr2).not(arr1).length == 0;
	};

};
