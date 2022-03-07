import ORUserUIStrings from './languages/en-us'

var surveyStatusOptions = [
	{
		label : 'Deliver',
		html : '<b>Deliver.</b> Survey will be delivered according to publishing rules.'
	},
	{
		label : 'Suspend',
		html : '<b>Suspend.</b> Pause delivery.'
	},
	{
		label : 'Archive',
		html : '<b>Archived.</b> Survey is no longer active.'
	}
];

var deliveryStrategyOptions = [
	{
		label : 'Inmediate',
		html : '<b>Inmediate.</b> Deliver surveys as visitors arrive.'
	}
];

var scrollingOptions = [
	{
		label : 'Smart',
		html : '<b>Smart (Recommended).</b> Survey will scroll automatically when possible.'
	},
	{
		label : 'Block',
		html : '<b>Block.</b> Scrolling is still done per item, but always invoked by user.'
	},
	{
		label : 'Classic',
		html : '<b>Classic.</b> Ordinary mouse scrolling. Buttons advance a fixed amount.'
	}
];

var desktopEmbedLayoutOptions = [
	{
		label : 'Fixed',
		html : '<b>Fixed.</b> Define a specific size for this survey.'
	},
	{
		label : 'Expand',
		html : '<b>Expand.</b> Expand survey to container.'
	},
	{
		label : 'PopUp',
		html : '<b>PopUp.</b> Show survey as a popUp, inside your webpage.'
	},
	{
		label : 'Banner',
		html : '<b>Banner.</b> Provide a banner, where user will click to display survey.'
	}
];

var desktopEmbedUnitOptions = [
	{
		label : '%',
		html : 'Percent (%)',
		value : 'Percent'
	},
	{
		label : 'px',
		html : 'Pixels (px)',
		value : 'Pixels'
	},
	{
		label : 'em',
		html : 'Em units (em)',
		value : 'Em'
	}
];

var itemLayoutOptions = [
	{
		value : 'Right',
		label : 'Left',
		html : 'Label at Left'
	},
	{
		value : 'Left',
		label : 'Right',
		html : 'Label at Right'
	},
	{
		value : 'Bottom',
		label : 'Top',
		html : 'Label at Top'
	},
	{
		value : 'Top',
		label : 'Bottom',
		html : 'Label at Bottom'
	},
	{
		label : 'No Label',
		value : 'NoLabel',
		html : 'Widget with no label'
	}
];

var itemOrientationOptions = [
	{
		label : 'Vertical',
		html : 'List stacked vertically'
	},
	{
		label : 'Horizontal',
		html : 'List stacked horizontally'
	}
];

var itemOpenSize = [
	{
		label : 'Small',
		html : 'Small input'
	},
	{
		label : 'Medium',
		html : 'Medium input'
	},
	{
		label : 'Large',
		html : 'Large input'
	},
	{
		label : 'Maximum',
		html : 'Maximum input'
	}
];

var itemVisibilityOptions = [
	{
		label : 'Visible',
		html : 'Visible'
	}
];

var itemTextAreaSize = [
	{
		label : 'S / S ',
		value : 'Small HSmall',
		html : 'Wide Small, Height Small'
	},
	{
		label : 'S / M',
		value : 'Small HMedium',
		html : 'Wide Small, Height Medium'
	},
	{
		label : 'S / L',
		value : 'Small HLarge',
		html : 'Wide Small, Height Large'
	},
	{
		label : 'M / S',
		value : 'Medium HSmall',
		html : 'Wide Medium, Height Small'
	},
	{
		label : 'M / M',
		value : 'Medium HMedium',
		html : 'Wide Medium, Height Medium'
	},
	{
		label : 'M / L',
		value : 'Medium HLarge',
		html : 'Wide Medium, Height Large'
	},
	{
		label : 'L / S',
		value : 'Large HSmall',
		html : 'Wide Large, Height Small'
	},
	{
		label : 'L / M',
		value : 'Large HMedium',
		html : 'Wide Large, Height Medium'
	},
	{
		label : 'L / L',
		value : 'Large HLarge',
		html : 'Wide Large, Height Large'
	},
	{
		label : 'Max / S',
		value : 'Maximum HSmall',
		html : 'Wide Maximum, Height Small'
	},
	{
		label : 'Max / M',
		value : 'Maximum HMedium',
		html : 'Wide Maximum, Height Medium'
	},
	{
		label : 'Max / L',
		value : 'Maximum HLarge',
		html : 'Wide Maximum, Height Large'
	}
];

var checkGroupHeaderStyles = [
	{
		label : 'Two Labels',
		value : 'TwoLabels',
		html : 'Two Labels'
	},
	{
		label : 'Three Labels',
		value : 'ThreeLabels',
		html : 'Three Labels'
	},
	{
		label : 'Each Cell',
		value : 'EachCell',
		html : 'Each Cell'
	},
	{
		label : 'Attribute Header',
		value : 'OnlyAttributeHeader',
		html : 'Only Attribute Header'
	},
	{
		label : 'No Headings',
		value : 'NoHeadings',
		html : 'No Headings'
	},
	{
		label : 'Common Headings',
		value : 'SEPARATOR'
	},
	{
		label : '1...n',
		value : 'OneToN',
		html : '1, 2, 3 ... n'
	}
];

var surveyThemeOptions = [];

// Build the list of options
surveyThemeOptions = $.map(['Gray', 'Black', 'Red'], function(value, index) {
	return {
		label: value,
		value: value,
		html: '<div class="Theme ' + value + '"></div><div class="ThemeLabel">' + ORUserUIStrings['THEME_' + value] + '</div>'
	}
});

var surveyTemplateOptions = $.map(['Simple', 'Slim', 'ButtonLess'], function(value, index) {
	return {
		label: value,
		value: value,
		html: '<div class="Template ' + value + '"></div>'
	}
});

export {
  surveyStatusOptions,
  deliveryStrategyOptions,
  scrollingOptions,
  desktopEmbedLayoutOptions,
  desktopEmbedUnitOptions,
  itemLayoutOptions,
  itemOrientationOptions,
  itemOpenSize,
  itemVisibilityOptions,
  itemTextAreaSize,
  checkGroupHeaderStyles,
  surveyThemeOptions,
  surveyTemplateOptions
}