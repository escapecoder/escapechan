saveEntity = async (e) => {
	var formElement = document.getElementById('entity-form');
	var actionURL = formElement.attributes.action.value;
	
	$('#entity-form [type=submit]').prop('disabled', true);
	
	let response = await fetch(actionURL, {
		method: 'POST',
		body: new FormData(formElement)
	});
	
	let result = await response.json();
	
	if(result.result == 0) {
		$('#entity-form [type=submit]').prop('disabled', false);
	
		alert(result.error.message);
	} else {
		location.href = result.redirect_url;
	}
}

savePostMenu = async (e) => {
	var formElement = document.getElementById('post-menu-form');
	var actionURL = formElement.attributes.action.value;
	
	$('#post-menu-form [type=submit]').prop('disabled', true);
	
	let response = await fetch(actionURL, {
		method: 'POST',
		body: new FormData(formElement)
	});
	
	let result = await response.json();
	
	if(result.result == 0) {
		$('#post-menu-form [type=submit]').prop('disabled', false);
	
		alert(result.error.message);
	} else {
		location.href = result.redirect_url;
	}
}

processPostsAction = async (e) => {
	var formElement = document.getElementById('posts-action-form');
	var actionURL = formElement.attributes.action.value;
	var action = $('[name=action]').val();
	
	$('#posts-action-form [type=submit]').prop('disabled', true);
	
	let response = await fetch(actionURL, {
		method: 'POST',
		body: new FormData(formElement)
	});
	
	let result = await response.json();
	
	if(result.result == 0) {
		$('#posts-action-form [type=submit]').prop('disabled', false);
	
		alert(result.error.message);
	} else {
		window.parent.postsActionCallback(Object.fromEntries(new FormData(formElement)));
	}
}

function initSpamlist() {
	if(moderFormSpamlist.length > 0) {
		moderFormSpamlist.forEach(function callback(word, index) {
			addSpamlistWord(word['value'], word['type']);
		});
	}
}

function addSpamlistWord(value = '', type = '') {
	var spamlistTemplate = $('#spamlist-template').html();
	
	$('#spamlist').append(spamlistTemplate);
	$('#spamlist .row').last().find('input').val(value);
	$('#spamlist .row').last().find('select').val(type);
	
	buildSpamlistJson();
}

function removeSpamlistWord(element) {
	$(element).closest('.row').remove();
	
	buildSpamlistJson();
}

function buildSpamlistJson() {
	moderFormSpamlist = [];
	
	$('#spamlist .row').each(function() {
		var el = $(this);
		var value = el.find('input').val();
		var type = el.find('select').val();
		
		moderFormSpamlist.push({'value':value,'type':type});
	});
	
	$('#spamlist-input').val(JSON.stringify(moderFormSpamlist));
}

function initReplacements() {
	if(moderFormReplacements.length > 0) {
		moderFormReplacements.forEach(function callback(word, index) {
			addReplacement(word['source'], word['result']);
		});
	}
}

function addReplacement(source = '', result = '') {
	var replacementTemplate = $('#replacement-template').html();
	
	$('#replacements').append(replacementTemplate);
	$('#replacements .row').last().find('input').eq(0).val(source);
	$('#replacements .row').last().find('input').eq(1).val(result);
	
	buildReplacementsJson();
}

function removeReplacement(element) {
	$(element).closest('.row').remove();
	
	buildReplacementsJson();
}

function buildReplacementsJson() {
	moderFormReplacements = [];
	
	$('#replacements .row').each(function() {
		var el = $(this);
		var source = el.find('input').eq(0).val();
		var result = el.find('input').eq(1).val();
		
		moderFormReplacements.push({'source':source,'result':result});
	});
	
	$('#replacements-input').val(JSON.stringify(moderFormReplacements));
}

function initBanReasons() {
	if(moderFormBanReasons.length > 0) {
		moderFormBanReasons.forEach(function callback(banReason, index) {
			addBanReason(banReason['value']);
		});
	}
}

function addBanReason(value = '') {
	var banReasonTemplate = $('#ban-reason-template').html();
	
	$('#ban-reasons-list').append(banReasonTemplate);
	$('#ban-reasons-list .row').last().find('input').val(value);
	
	buildBanReasonsJson();
}

function removeBanReason(element) {
	$(element).closest('.row').remove();
	
	buildBanReasonsJson();
}

function buildBanReasonsJson() {
	moderFormBanReasons = [];
	
	$('#ban-reasons-list .row').each(function() {
		var el = $(this);
		var value = el.find('input').val();
		
		moderFormBanReasons.push({'value':value});
	});
	
	$('#ban-reasons-input').val(JSON.stringify(moderFormBanReasons));
}

function initMenuSections() {
	if(moderFormMenuSections.length > 0) {
		moderFormMenuSections.forEach(function callback(data, index) {
			addMenuSection(data);
		});
	}
}

function addMenuSection(data) {
	if(!data) {
		data = {"sectionName": "", "links": []};
	}
	
	var menuSectionTemplate = $('#menu-section-template').html();
	
	$('#menu-sections-list').append(menuSectionTemplate);
	$('#menu-sections-list .menu-section-wrapper').last().find('.menu-section-name').val(data.sectionName);
	
	var el = $('#menu-sections-list .menu-section-wrapper').last();
	
	data.links.forEach(function callback(link, index) {
		addMenuLink(el, link);
	});
	
	buildMenuSectionsJson();
	reInitMenuSortable();
}

function removeMenuSection(element) {
	$(element).closest('.menu-section-wrapper').remove();
	
	buildMenuSectionsJson();
	reInitMenuSortable();
}

function addMenuLink(element, data) {
	if(!data) {
		data = {"label": "", "url": ""};
	}
	
	var menuLinkTemplate = $('#menu-link-template').html();
	
	$(element).closest('.menu-section-wrapper').find('.menu-section-links').append(menuLinkTemplate);
	$(element).closest('.menu-section-wrapper').find('.menu-section-links .row').last().find('.menu-link-label').val(data.label);
	$(element).closest('.menu-section-wrapper').find('.menu-section-links .row').last().find('.menu-link-url').val(data.url);
	$(element).closest('.menu-section-wrapper').find('.menu-section-links .row').last().find('.menu-link-danger').val(data.danger);
	
	buildMenuSectionsJson();
	reInitMenuSortable();
}

function removeMenuLink(element) {
	$(element).closest('.row').remove();
	
	buildMenuSectionsJson();
	reInitMenuSortable();
}

initializedSortables = [];

function reInitMenuSortable() {
	initializedSortables.forEach(function callback(s, index) {
		s.destroy();
	});
	
	initializedSortables = [];
	
	var nestedSortables = [].slice.call(document.querySelectorAll('.nested-sortable'));

	for (var i = 0; i < nestedSortables.length; i++) {
		initializedSortables[i] = new Sortable(nestedSortables[i], {
			group: 'nested-' + i,
			handle: '.la',
			animation: 150,
			fallbackOnBody: true,
			swapThreshold: 0.65,
			onEnd: function() {
				buildMenuSectionsJson();
			}
		});
	}
}

function buildMenuSectionsJson() {
	moderFormMenuSections = [];
	moderFormDangerMenuSections = [];
	
	$('#menu-sections-list .menu-section-wrapper').each(function() {
		var el = $(this);
		var value = el.find('.menu-section-name').val();
		
		var links = [];
		var dlinks = [];
		
		el.find('.menu-section-links .row').each(function() {
			var el2 = $(this);
			var label = el2.find('.menu-link-label').val();
			var url = el2.find('.menu-link-url').val();
			var danger = el2.find('.menu-link-danger').val();
			
			if(danger == '0') {
				links.push({'label':label,'url':url,'danger':danger});
			}
			
			dlinks.push({'label':label,'url':url,'danger':danger});
		});
		
		if(links.length > 0) {
			moderFormMenuSections.push({'sectionName':value,'links':links});
		}
		
		if(dlinks.length > 0) {
			moderFormDangerMenuSections.push({'sectionName':value,'links':dlinks});
		}
	});
	
	$('#menu-sections-input').val(JSON.stringify(moderFormMenuSections));
	
	$('#danger_menu-sections-input').val(JSON.stringify(moderFormDangerMenuSections));
}

function initModerEdit() {
	moderFormPermissions.forEach(function callback(permission, index) {
		addModerPermission(permission['board'], permission['thread']);
	});
}

function addModerPermission(board = '', thread = '') {
	var permissionsTemplate = $('#permissions-template').html();
	
	$('#permissions-list').append(permissionsTemplate);
	$('#permissions-list .row').last().find('select').val(board);
	$('#permissions-list .row').last().find('input').val(thread);
	
	buildModerPermissionsJson();
}

function removeModerPermission(element) {
	$(element).closest('.row').remove();
	
	buildModerPermissionsJson();
}

function buildModerPermissionsJson() {
	moderFormPermissions = [];
	
	$('#permissions-list .row').each(function() {
		var el = $(this);
		var board = el.find('select').val();
		var thread = el.find('input').val();
		
		moderFormPermissions.push({'board':board,'thread':thread});
	});
	
	$('#permissions-input').val(JSON.stringify(moderFormPermissions));
}

function openPostsActionModal(action, boardNum = false) {
	var ids = '';
	
	if(boardNum) {
		ids = boardNum;
	}
	
	document.getElementById('mod-modal').showModal();
	document.getElementById('mod-frame').src='/moder/posts/action?ids=' + ids + '&action=' + action;
}

function closePostsActionModal() {
	document.getElementById('mod-modal').close();
	document.getElementById('mod-frame').src='about:blank';
}

function postsActionCallback(formData) {
	if(formData.action == 'pin' || formData.action == 'unpin' || formData.action == 'close' || formData.action == 'open' || formData.action == 'endless' || formData.action == 'finite') {
		location.reload();
		return;
	}
	
	closePostsActionModal();
	
	if(location.pathname.endsWith('/posts/single')) {
		location.reload();
	} else if(location.pathname.endsWith('/posts')) {
		$('#posts-table').DataTable().page('first').draw('page');
	}
}

function resizeModModal() {
	var height = $('body').outerHeight();
	
	window.parent.document.getElementById('mod-frame').height = height;
}

function delay(fn, ms) {
	let timer = 0
	return function(...args) {
		clearTimeout(timer)
		timer = setTimeout(fn.bind(this, ...args), ms || 0)
	}
}

$(function() {
	var params = new URLSearchParams(location.search.substring(1));
	var msg = params.get('msg');
	var message = '';
	
	if(msg != null) {
		if(msg == 'MODER_SAVED') {
			message = lang.moderation_moder_saved;
		}
		
		if(msg == 'BOARD_SAVED') {
			message = lang.moderation_board_saved;
		}
		
		if(msg == 'POST_MENU_SAVED') {
			message = 'Меню поста успешно сохранено.';
		}
		
		if(msg == 'PASSCODE_SAVED') {
			message = 'Пасскод успешно сохранён.';
		}
		
		if(msg == 'ARTICLE_SAVED') {
			message = lang.moderation_article_saved;
		}
		
		if(msg == 'CONFIG_SAVED') {
			message = lang.moderation_config_saved;
		}
		
		if(msg == 'BOARDS_CACHE_UPDATED') {
			message = lang.moderation_boards_cache_updated;
		}
		
		if(msg == 'THREADS_CACHE_UPDATED') {
			message = lang.moderation_threads_cache_updated;
		}
		
		$('#success-alert').removeClass('d-none').html(message);
		
		var hrefWithoutMsg = location.href.split(location.href.indexOf('&msg=') > 0 ? '&msg=' : '?msg=')[0];
		
		history.replaceState(null, "", hrefWithoutMsg);
	}
});