{{define "base"}}
var moder = {};

moder.permissions = {{ .CurrentModer.Permissions }};
moder.level = {{ .CurrentModer.Level }};
moder.id = {{ .CurrentModer.ID }};

var noPrint = true;
var noCopy = false;
var noScreenshot = true;
var autoBlur = true;

if(CFG.BOARD.NAME == 'o') {
	throw new Error('Board not supported');
}

function openPostsActionModal(action, boardNum = false) {
	var ids = '';
	
	if(boardNum) {
		ids = boardNum;
	}
	
	document.getElementById('mod-modal').showModal();
	document.getElementById('mod-frame').src='/moder/posts/action?ids=' + ids + '&action=' + action;
	
	return false;
}

function closePostsActionModal() {
	document.getElementById('mod-modal').close();
	document.getElementById('mod-frame').src='about:blank';
}

var isLoadingPostsAdditional = false;

function getPostsAdditional() {
	if(!isLoadingPostsAdditional) {
		var nums = [];
		
		$('#js-posts>.thread>.post>.post__details:not(.moder-processed) .turnmeoff').each(function() {
			nums.push($(this).val());
			$('#post-details-' + $(this).val()).addClass('moder-processed');
		});
		
		if(nums.length > 0) {
			isLoadingPostsAdditional = true;
			
			$.get('/moder/posts/additional?board=' + CFG.BOARD.NAME + '&nums=' + nums.join(','), function(response) {
				isLoadingPostsAdditional = false;
				
				if((response.result).length > 0) {
					response.result.forEach(function callback(info, index) {
						if(info.moder_has_access && moder.level > 0) {
							var html = '';
							
							if(info.moder_id > 0) {
								html += '<span class="post__detailpart">MOD (' + info.moder_name + ')</span>';
							}
							
							html += '<span class="post__detailpart">IP: ' + info.ip + '</span>';
							
							if(CFG.BOARD.FLAGS == false && info.ip_country_code != "") {
								html += '<span class="post__detailpart"><span class="class="post__icon"><img hspace="3" src="/static/img/flags/' + info.ip_country_code + '.png" border="0" style="max-width:18px;max-height:12px;"></span></span>';
							}
							
							if(info.ip_country_name != "" || info.ip_city_name != "") {
								var geoParts = [];
								
								if(info.ip_city_name != "") {
									geoParts.push(info.ip_city_name);
								}
								
								if(info.ip_country_name != "") {
									geoParts.push(info.ip_country_name);
								}
								
								html += '<span class="post__detailpart">' + geoParts.join(', ') + '</span>';
							}
							
							$('#post-details-' + info.num).addClass('moder-processed').addClass('moder-processed-post-' + info.num).append(html);
							$('#post-details-' + info.num).find('.turnmeoff').css('display', 'inherit');
						}
					});
				}
			});
		}
	}
}

function addAdminMenu(el) {
	return false;
}

function removeAdminMenu(event) {
	return false;
}

function postsActionCallback(formData) {
	if(formData.action == 'pin' || formData.action == 'unpin' || formData.action == 'close' || formData.action == 'open' || formData.action == 'endless' || formData.action == 'finite' || formData.action == 'move') {
		location.reload();
		return;
	}
	
	$alert('Действие модератора успешно обработано.');
	
	closePostsActionModal();
	
	if(CFG.BOARD.THREADID > 0) {
		PostF.updatePosts(null);
	} else {
		location.reload();
	}
}

$('#js-posts').on('click', '.post__btn_type_menu', function(){
	var el = $(this);
	var num = el.data('num');
	
	var post = POSTS.get(num).raw;
	
	var html = '';
	
	html += '<a href="/moder/posts/single?board=' + CFG.BOARD.NAME + '&num=' + num + '" target="_blank" style="color:#0072d4;">Открыть пост в модерке</a>';
	
	if(post.parent == 0 && !CFG.BOARD.MODERVIEW) {
	html += '<a href="/moder/full/' + CFG.BOARD.NAME + '/' + num + '" target="_blank" style="color:#0072d4;">Открыть в режиме модератора</a>';
	}
	
	html += '<a href="#" style="color:#0072d4;" onclick="return openPostsActionModal(\'note\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Примечание</a>';
	
	if(moder.level > 0) {
		if(post.parent == 0) {
			//if(moder.level > 2) {
				if(post.sticky == 0) {
					html += '<a href="#" style="color:#0072d4;" onclick="return openPostsActionModal(\'pin\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Закрепить тред</a>';
				} else {
					html += '<a href="#" style="color:#0072d4;" onclick="return openPostsActionModal(\'unpin\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Открепить тред</a>';
				}
				
				if(post.endless == 0) {
					html += '<a href="#" style="color:green;" onclick="return openPostsActionModal(\'endless\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Бесконечный тред</a>';
				} else {
					html += '<a href="#" style="color:green;" onclick="return openPostsActionModal(\'finite\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Отменить бесконечность</a>';
				}
			//}
			
			html += '<a href="#" style="color:darkviolet;" onclick="return openPostsActionModal(\'move\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Перенести тред</a>';
			
			if(post.closed == 0) {
				html += '<a href="#" style="color:#b17a15;" onclick="return openPostsActionModal(\'close\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Закрыть тред</a>';
			} else {
				html += '<a href="#" style="color:#b17a15;" onclick="return openPostsActionModal(\'open\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Открыть тред</a>';
			}
		}
	}
	
	html += '<a href="#" style="color:red;" onclick="return openPostsActionModal(\'delete\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Удалить</a>';
	
	if(moder.level > 0) {
		html += '<a href="#" style="color:red;" onclick="return openPostsActionModal(\'ban\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Забанить</a>';
		html += '<a href="#" style="color:red;" onclick="return openPostsActionModal(\'delete_and_ban\', \'' + CFG.BOARD.NAME + ':' + num + '\');">Удалить и забанить</a>';
	}
	
	setTimeout(function() {
		$('#engine-select').append(html);
	}, 10);
});

$(function() {
	document.head.insertAdjacentHTML('beforeend', '<style>.mod-action-delete,.mod-action-ban,.mod-action-delete_and_ban{color:red;}#mod-modal{padding:0;border:3px solid gray;}</style>')
	$('.mod-mark-checkbox').show();
	
	if(moder.level >= 4) {
		$('.adm-mark-checkbox').show();
	}
	
	if(moder.level > 0) {
		$('.tn').append('<span class="mod_actions" style="display:none;"> | <a href="#" class="mod-action-delete">Удалить выбранное</a> | <a href="#" class="mod-action-ban">Забанить выбранное</a> | <a href="#" class="mod-action-delete_and_ban">Удалить выбранное и забанить</a></span>');
	} else {
		$('.tn').append('<span class="mod_actions" style="display:none;"> | <a href="#" class="mod-action-delete">Удалить выбранное</a></span>');
	}
	$('body').append('<dialog id="mod-modal"><iframe src="about:blank" width="500" id="mod-frame" scrolling="no"></iframe></dialog>');
	//$.getScript('/static/js/noprint.js');
	getPostsAdditional();
	setInterval(getPostsAdditional, 1000);
});

$('.tn').on('click', '.mod_actions a', function(e) {
	e.stopPropagation();
	
	var ids = [];
	var action = $(this).attr('class').replace('mod-action-', '');
	
	$('.turnmeoff:checked').each(function() {
		ids.push(CFG.BOARD.NAME + ':' + $(this).val());
	});
	
	openPostsActionModal(action, ids.join(','));
	
	return false;
});

$('.post__details').on('change', '.turnmeoff', function() {
	var checkedCount = $('.turnmeoff:checked').length;
	
	if(checkedCount > 0) {
		$('.mod_actions').show();
	} else {
		$('.mod_actions').hide();
	}
});
{{end}}