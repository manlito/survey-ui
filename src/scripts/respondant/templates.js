
export default function () {
	return {
		Simple: {
			html: ''
				+ '<div class="ORRespondant ORSimpleContainer">'
				+ '	 <div class="ORLayoutLeft ORLeft ORLeftIcon Rounded5px NonSelectable"></div>'
				+ '	 <div class="ORLayoutCenter">'
				+ '	   <div class="ORSurveyContent"></div>'
				+ '	 </div>'
				+ '	 <div class="ORLayoutRight ORRight ORRightIcon Rounded5px NonSelectable"></div>'
				+ '</div>'
		},
		ButtonLess: {
			html: ''
				+ '<div class="ORRespondant ORButtonLessContainer">'
				+ '	 <div class="ORLayoutCenter">'
				+ '	   <div class="ORSurveyContent"></div>'
				+ '	 </div>'
				+ '</div>'
		},
		Slim: {
			html: ''
				+ '<div class="ORRespondant ORSlimContainer">'
				+ '	 <div class="ORLayoutCenter">'
				+ '	   <div class="ORSurveyContent"></div>'
				+ '	 </div>'
				+ '	 <div class="ORLayoutButtons">'
				+ '	   <div class="ORLayoutButtonRow">'
				+ '      <div class="ORLayoutLeft ORLeft ORLeftIcon Rounded5px NonSelectable"></div>'
				+ '      <div class="ORLayoutRight ORRight ORRightIcon Rounded5px NonSelectable"></div>'
				+ '	   </div>'
				+ '	 </div>'
				+ '</div>'
		}
	}
}
