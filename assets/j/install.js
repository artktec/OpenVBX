/**
 * "The contents of this file are subject to the Mozilla Public License
 *  Version 1.1 (the "License"); you may not use this file except in
 *  compliance with the License. You may obtain a copy of the License at
 *  http://www.mozilla.org/MPL/
 
 *  Software distributed under the License is distributed on an "AS IS"
 *  basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 *  License for the specific language governing rights and limitations
 *  under the License.

 *  The Original Code is OpenVBX, released June 15, 2010.

 *  The Initial Developer of the Original Code is Twilio Inc.
 *  Portions created by Twilio Inc. are Copyright (C) 2010.
 *  All Rights Reserved.

 * Contributor(s):
 **/

if(typeof(OpenVBX) == "undefined") {
	var OpenVBX = {};
}


$(document).ready(function(){

OpenVBX.Installer = {
	LAST_STEP : +$('.step:last').attr('id').replace(/^step-/, ''),
	WIZARD_WIDTH : -700,
	tabsDisabled: true,
	ready : false,
	currentStep : 1,
	validate : function(afterValidation) {
		var step = $('#step-'+OpenVBX.Installer.currentStep);
		var params = $('textarea, input, select', step);
		var result = $.ajax({
			url : OpenVBX.home + 'install/validate',
			data : params,
			success : function(data) {
				$('.invalid').removeClass('invalid');
				if(!data.success) {
					$('.error').text(data.message);
					$('.error').slideDown();
					for(var a in data.errors) {
						$('#'+a+'-'+OpenVBX.Installer.currentStep).addClass('invalid');
					}
				} else {
					if(OpenVBX.Installer.currentStep == OpenVBX.Installer.LAST_STEP-1) {
						OpenVBX.Installer.ready = true;
					}
					
					afterValidation(data);
				}
				return data.success;
			},
			type : 'post',
			async : false,
			dataType : 'json',
			error : function(XMLHttpRequest, textStatus, errorThrown) {
				$('.error').text('An application error occurred.  Please try again.');
				$('.error').slideDown();
			}
		});
		return result;
	},
	prevStep : function(e) {
		if(typeof(e) != "undefined") {
			e.preventDefault();
		}

		if(OpenVBX.Installer.prevStepLock)
			return false;

		OpenVBX.Installer.prevStepLock = true;
		if($('.steps').css('left').replace('px','') > OpenVBX.Installer.WIZARD_WIDTH)
			return false;

		$('.error').slideUp();
		OpenVBX.Installer.currentStep -= 1;
		OpenVBX.Installer.gotoStep(OpenVBX.Installer.currentStep);

		return false;
	},
	nextStep : function(e) {
		OpenVBX.Installer.tabsDisabled = false;
		if(typeof(e) != "undefined") {
			e.preventDefault();
		}

		if(OpenVBX.Installer.nextStepLock)
			return false;

		var afterValidation = function(data) {
			
			OpenVBX.Installer.nextStepLock = true;
			if($('.steps').css('left').replace('px','') <= OpenVBX.Installer.END_WIZARD_WIDTH)
				return false;
			
			$('.error').slideUp();
			OpenVBX.Installer.currentStep += 1;
			
			if(typeof(data.tplvars) != 'undefined' && typeof(data.tplvars.server) != 'undefined') { // then we should do some replacements
				if(typeof(data.tplvars.server.mode) != 'undefined' && data.tplvars.server.mode == 'dev') {
					$('.server_mode').html(data.tplvars.server.name)
				}
			}
			
			if(OpenVBX.Installer.currentStep == OpenVBX.Installer.LAST_STEP && OpenVBX.Installer.ready) {
				OpenVBX.Installer.submit(e);
			} else {
				OpenVBX.Installer.gotoStep(OpenVBX.Installer.currentStep);
			}

		};
		
		OpenVBX.Installer.validate(afterValidation);
		
		return false;
	},
	setButtons : function() {
		if($('.steps').css('left').replace('px','') > OpenVBX.Installer.WIZARD_WIDTH) {
			$('button.prev').attr('disabled', 'disabled');
		} else {
			$('button.prev').removeAttr('disabled');
		}
		
		if($('.steps').css('left').replace('px','') <= OpenVBX.Installer.END_WIZARD_WIDTH) {
			$('button.next').attr('disabled', 'disabled');
		} else {
			$('button.next').removeAttr('disabled');
		}
		switch(OpenVBX.Installer.currentStep) {
			case 1:
				$('button.prev').hide();
				$('button.next').show();
				$('button.submit').hide();
			break;
			default:
				$('button.prev').show();
				$('button.next').show();
				$('button.submit').hide();
				break;
			case(OpenVBX.Installer.LAST_STEP -1):
				$('button.next').hide();
				$('button.submit').show();
				break;
			case OpenVBX.Installer.LAST_STEP:
				$('button').hide();
				break;
		}

		OpenVBX.Installer.nextStepLock = false;
		OpenVBX.Installer.prevStepLock = false;
	},
	gotoStep : function(step) {
		var left = (step * OpenVBX.Installer.WIZARD_WIDTH) + (OpenVBX.Installer.WIZARD_WIDTH * -1); // the * -1 is to make it positive for the rollback.
		$('.steps').animate({'left': left}, 'normal', 'swing', OpenVBX.Installer.setButtons);
		OpenVBX.Installer.currentStep = step;
	},
	toggleError : function() {
		$('.error').slideToggle();
	},
	submit : function(e) {
		if(typeof(e) != "undefined") {
			e.preventDefault();
		}

		if(OpenVBX.Installer.ready)
		{
			$.ajax({
				url : OpenVBX.home + '/install/setup',
				data : $('form input, form select, form textarea'),
				success : function(data) {
					if(!data.success) {
						$('.error')
							.text(data.error)
							.slideDown();
					} else {
						OpenVBX.Installer.gotoStep(OpenVBX.Installer.LAST_STEP);
					}
				},
				type : 'post',
				dataType : 'json',
				error : function(XMLHttpRequest, textStatus, errorThrown) {
					$('.error')
						.text('An application error occurred.  Please try again.')
					.slideDown();
				}
			});
		}

		return false;
	}
};
OpenVBX.Installer.END_WIZARD_WIDTH = ((OpenVBX.Installer.LAST_STEP-1) * OpenVBX.Installer.WIZARD_WIDTH);

$(document).ready(function() {
	if($('.error').text() != '') {
		setTimeout(OpenVBX.Installer.toggleError, 
				   1000);
	}
	
	OpenVBX.Installer.setButtons();
	$('button.next').click(OpenVBX.Installer.nextStep);
	$('button.prev').click(OpenVBX.Installer.prevStep);
	$('.error').click(OpenVBX.Installer.toggleError);
	$('button.submit').click(OpenVBX.Installer.nextStep);
	$('form').submit(function(e) {
		e.preventDefault();
	});
	
	$('fieldset').each(function() { 
		$('input:last', 
		  this).keypress(
			  function(e) {
				  var keyCode = e.keyCode || e.which; 
				  if(keyCode == 9) {
					  e.preventDefault();
					  OpenVBX.Installer.nextStep();
				  }
			  });
	});

	var last_key = false;
	$(window).bind('keydown', function(e) {
		var tabstops = {iDatabasePassword : '', 
						iTwilioToken : '',
						iFromEmail : '',
						iAdminPw2 : ''};

		if($(e.target).attr('id') in tabstops
		   && e.which == 9 && last_key != 16)
			e.preventDefault();

		if(OpenVBX.Installer.tabsDisabled && e.which == 9)
			e.preventDefault();
		last_key = e.which;
	});

	setTimeout(function() {
		$.ajax({ 
			url : OpenVBX.home.replace('index.php', 'support/rewrite'), 
			success : function(data, code) {
				$('input[name=rewrite_enabled]').attr("value", 1);
			}, 
			error : function(data) { 
				$('input[name=rewrite_enabled]').attr("value", 0);
			} 
		});
	}, 1000);

});

});

