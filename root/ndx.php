<?php
ini_set('default_socket_timeout', 3);

$dbconn = new mysqli('127.0.0.1', 'root', 'A@aB123212321a', '3ch');

$res = $dbconn->query("SELECT COUNT(`id`) as `posts_per_hour` FROM `posts` WHERE `timestamp` >= " . (time() - 60 * 60) . ";");
$row = $res->fetch_assoc();
$postsPerHour = (int) $row['posts_per_hour'];

$res = $dbconn->query("SELECT COUNT(`id`) as `posts_count` FROM `posts`;");
$row = $res->fetch_assoc();
$postsCount = (int) $row['posts_count'];

$res = $dbconn->query("SELECT COUNT(`id`) as `boards_count` FROM `boards` WHERE `enable_posting` = 1;");
$row = $res->fetch_assoc();
$boardsCount = (int) $row['boards_count'];

$boardsJsonFromGo = file_get_contents('http://127.0.0.1:8999/api/mobile/v2/boards');

$boardsList = json_decode($boardsJsonFromGo, true);

if($boardsList) {
	foreach($boardsList as $i => $board) {
		$res = $dbconn->query("SELECT COUNT(`id`) as `speed` FROM `posts` WHERE `board` = '" . $board['id'] . "' AND `timestamp` >= " . (time() - 60 * 60) . ";");
		$row = $res->fetch_assoc();
		$board['speed'] = (int) $row['speed'];

		$res = $dbconn->query("SELECT COUNT(`id`) as `posts_count` FROM `posts` WHERE `board` = '" . $board['id'] . "';");
		$row = $res->fetch_assoc();
		$board['posts_count'] = (int) $row['posts_count'];
		
		$res = $dbconn->query("SELECT COUNT(DISTINCT `ip`) as `unique_posters` FROM `posts` WHERE `board` = '" . $board['id'] . "';");
		$row = $res->fetch_assoc();
		$board['unique_posters'] = (int) $row['unique_posters'];
		
		$boardsList[$i] = $board;
	}
	
	$boardsJson = ['boards' => $boardsList];
	
	file_put_contents('index.json', json_encode($boardsJson, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
	
	$boardsCount = count($boardsList);
}

//echo $postsPerHour; exit;

ob_start();
?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ru" lang="ru">
	<head>
		<title>Escapechan</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<meta name="viewport" content="initial-scale=1">
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">
		<link href="/static/css/font-awesome.min.css" type="text/css" rel="stylesheet">
		<link href="/static/css/index.css?v=6" type="text/css" rel="stylesheet">
		<script type="text/javascript" src="/static/js/jquery.js"></script>
		<script src="/static/js/index.js?v=3"></script>
		<script src="https://code.jquery.com/ui/1.12.0/jquery-ui.js"></script>
		<script type="text/javascript" src="/static/js/threadsubscribe.js?v=17"></script>
		<link href="/static/css/threadsubscribe.css" type="text/css" rel="stylesheet">
		<script>
			(function() {
				    window.st = localStorage.getItem('store') || '{}';
					st = JSON.parse(st);
					
					const nm=e=>{e.hasOwnProperty("styling")?void 0===e.styling.nightmode?window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches&&(document.documentElement.dataset.theme="nightmode"):!0===e.styling.nightmode&&(document.documentElement.dataset.theme="nightmode"):window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches&&(document.documentElement.dataset.theme="nightmode")};nm(st);
				})();
		</script>
        <!--<link href="https://cdn.jsdelivr.net/gh/Alaev-Co/snowflakes/dist/snow.min.css" rel="stylesheet">-->
        <!--<style>
        @keyframes waves {
          0% {filter: brightness(0.3)}
          50% {filter: brightness(1.2)}
          100% {filter: brightness(0.3)}
        }
        @keyframes blink {
          0% {filter: brightness(1.2)}
          100% {filter: brightness(0.3)}
        }
        #tree, #tree > * {width:500px; height:800px;position:relative;}
        #tree > #l1, #tree > #l2 {position:absolute; top:0; left:0;width:100%;animation-name:waves;animation-duration:1s;animation-iteration-count: infinite;}
        #tree {margin: 0px auto;background:url('/static/img/ny/tree3.png');background-size:contain;background-repeat:no-repeat;}
        #l1 {background:url('/static/img/ny/r1.png');background-size:contain;background-repeat:no-repeat;}
        #l2 {background:url('/static/img/ny/r2.png');background-size:contain;background-repeat:no-repeat;animation-delay:0.5s;}
        #gifts {background:url('/static/img/ny/gifts2.png');background-size:contain;background-repeat:no-repeat;background-position:bottom right;width:50%;bottom:0px;right:0px;position:absolute;}
        </style>
        <script>
        function switchlights() {
            let p = [{a:'waves',d:'1s',t:'2s'},{a:'waves',d:'0.5s',t:'1s'},{a:'waves',d:'0.25s',t:'0.5s'},{a:'blink',d:'0.25s',t:'0.5s'},{a:'waves',d:'0s',t:'10s'},{a:'blink',d:'0.15s',t:'0.3s'}];
            let idx = parseInt(document.getElementById('tree').dataset.pat) || 0;
            idx = (idx+1)%p.length;
            document.getElementById('tree').dataset.pat = idx;

            for (let i=1;i<=2;i++) {
                let e = document.getElementById('l'+i);
                e.style.animationName = p[idx].a;
                e.style.animationDelay = i%2==0 ? p[idx].d : '0s';
                e.style.animationDuration = p[idx].t||'1s';
            }
        }
        setInterval(switchlights, 30000);
        </script>-->
	</head>
	<body>
        <!--<script src="https://cdn.jsdelivr.net/gh/Alaev-Co/snowflakes/dist/Snow.min.js"></script>
        <script>
            new Snow();
        </script>-->
		<header class="header" style="padding:20px 0;">
			<img src="/static/img/echlogo.png" height="110">
		</header>
		<main class="main">
			<section class="main__block main__meta">
				<span class="paragraph">Эч</span> - это имиджборд, где возможно свободное общение и культурная дискуссия на различные темы. Ведите себя адекватно и соблюдайте правила и культуру общения.<br><br>
				На данный момент открыто <strong><?php echo $boardsCount; ?></strong> досок. Скорость постинга на имиджборде <strong><?php echo $postsPerHour; ?> п/ч</strong>, за всё время существования было оставлено <strong><?php echo $postsCount; ?></strong> постов.
				<div class="buttons">
				<!--<a class="buttons__button" href="/static/m.html" target="blank">Мобильные приложения</a>--><a class="buttons__button" href="/user/passlogin" target="blank">Получить пасскод</a><a class="buttons__button" href="/b/">Начать общение</a>
				<div>
			</section>
			<!--<section class="main__block">
                <div id="tree">
                <div id="l1"></div>
                <div id="l2"></div>
                <div id="gifts"></div>
                </div>
			</section>-->
			<section class="main__block">
				<header class="main__title">Открытые доски</header>
				<section id="tabbed" class="tabs-wrapper">
					<ul class="tabs-tabs">
						<li><a href="#boards-tab">Доски</a></li>
						<li><a href="#tracker-tab">Трекер</a></li>
					</ul>
					<section id="boards-tab" class="summary">
						<div class="tabheader">
							<a href="#" title="Алфавитный порядок" onclick="cloudBoard.display(cloudBoard.displaytype,'az'); return false;"><i class="fa fa-sort-alpha-asc"></i></a>
							<a href="#" title="По скорости постинга" onclick="cloudBoard.display(cloudBoard.displaytype,'unique_posters'); return false;"><i class="fa fa-line-chart"></i></a>
							<input type="text" placeholder="Фильтр" class="input" id="filter" size="8">
						</div>
						<div class="summary__table">
							<div class="summary__row">
								<div class="summary__cell summary__cell_f summary__cell_sm"><strong>Доска</strong></div>
								<div class="summary__cell "><strong>Название</strong></div>
								<!--<div class="summary__cell summary__cell_sm" title="Количество уникальных IP постеров за 24 часа. Это не просмотры, ридонли IP не учитываются."><strong>Уник IP</strong></div>
								<div class="summary__cell desktop"><strong>Описание</strong></div>-->
								<div class="summary__cell summary__cell_sm"><strong>Постов</strong></div>
							</div>
							<div id="js-summary-body"></div>
						</div>
					</section>
					<section id="tracker-tab" class="tracker">
						<div class="tabheader">
							<input placeholder="доска" id="board" class="input" size="8" type="text">
							<input type="button" value="Добавить" id="add-board" class="button">
							<div>
								Доски: [ <span class="boards-list"></span> ] [ <a href="#" class="update">Обновить (<span class="counter"></span>)</a> ]
							</div>
						</div>
						<div class="tabheader">
							<input type="button" value="Full" class="button" id="toggle-mode">
							<select id="toggle-filter" class="input">
								<option value="timestamp">Времени создания</option>
								<option value="lasthit">Бампам</option>
								<option value="posts_count">Кол-ву постов</option>
							</select>
							<div>Выводить <input placeholder="100" id="limit" class="input" size="3" type="text" value="50"> </div>
							<div><label for="toggle-nsfw"><span title="nsfw">NSFW </span><input type="checkbox" id="toggle-nsfw" name="nsfw"></label></div>
						</div>
						<div id="data" class="tracker__data">
							<script>Tracker.init()</script>
						</div>
					</section>
				</section>
			</section>
		</main>
		<footer>
			<script>tmp_id = null; tmp_board = null;tmp_likes=null;tmp_enable_oekaki = null;tmp_enable_subject = null;tmp_max_files_size = null;tmp_twochannel = 0;	tmp_max_comment = null;	tmp_adv_img = null;tmp_adv_lnk = null;tmp_styles=[];
				window.Store={memory:{},type:null,init:function(){;if(this.html5_available()){this.type='html5';this.html5_load()}else if(this.cookie_available()){this.type='cookie';this.cookie_load()}},get:function(path,default_value){var path_array=this.parse_path(path);if(!path_array)return default_value;var pointer=this.memory;var len=path_array.length;for(var i=0;i<len-1;i++){var element=path_array[i];if(!pointer.hasOwnProperty(element))return default_value;pointer=pointer[element]} var ret=pointer[path_array[i]];if(typeof(ret)=='undefined')return default_value;return ret},set:function(path,value){if(typeof(value)=='undefined')return!1;if(this.type)this[this.type+'_load']();var path_array=this.parse_path(path);if(!path_array)return!1;var pointer=this.memory;var len=path_array.length;for(var i=0;i<len-1;i++){var element=path_array[i];if(!pointer.hasOwnProperty(element))pointer[element]={};pointer=pointer[element];if(typeof(pointer)!='object')return!1} pointer[path_array[i]]=value;if(this.type)this[this.type+'_save']();return!0},del:function(path){var path_array=this.parse_path(path);if(!path_array)return!1;if(this.type)this[this.type+'_load']();var pointer=this.memory;var len=path_array.length;var element,i;for(i=0;i<len-1;i++){element=path_array[i];if(!pointer.hasOwnProperty(element))return!1;pointer=pointer[element]} if(pointer.hasOwnProperty(path_array[i]))delete(pointer[path_array[i]]);this.cleanup(path_array);if(this.type)this[this.type+'_save']();return!0},cleanup:function(path_array){var pointer=this.memory;var objects=[this.memory];var len=path_array.length;var i;for(i=0;i<len-2;i++){var element=path_array[i];pointer=pointer[element];objects.push(pointer)} for(i=len-2;i>=0;i--){var object=objects[i];var key=path_array[i];var is_empty=!0;$.each(object[key],function(){is_empty=!1;return!1});if(!is_empty)return!0;delete(object[key])}},reload:function(){if(this.type)this[this.type+'_load']()},'export':function(){return JSON.stringify(this.memory)},'import':function(data){try{this.memory=JSON.parse(data);if(this.type)this[this.type+'_save']();return!0}catch(e){return!1}},parse_path:function(path){var test=path.match(/[a-zA-Z0-9_\-\.]+/);if(test==null)return!1;if(!test.hasOwnProperty('0'))return!1;if(test[0]!=path)return!1;return path.split('.')},html5_available:function(){if(!window.Storage)return!1;if(!window.localStorage)return!1;try{localStorage.__storage_test='stortest';if(localStorage.__storage_test!='stortest')return!1;localStorage.removeItem('__storage_test');return!0}catch(e){return!1}},html5_load:function(){if(!localStorage.store)return;this.memory=JSON.parse(localStorage.store)},html5_save:function(){localStorage.store=JSON.stringify(this.memory)},cookie_available:function(){try{setCookie('__storage_test','stortest');if(getCookie('__storage_test')!='stortest')return!1;delCookie('__storage_test');return!0}catch(e){return!1}},cookie_load:function(){var str=getCookie('store');if(!str)return;this.memory=JSON.parse(str)},cookie_save:function(){var str=JSON.stringify(this.memory);setCookie('store',str,365*5)}}
						Store.init();
							
						cloudBoard.getdata();
						cloudBoard.getnews();
						
						$( function() {
							$( "#tabbed" ).tabs({ 
								active: Store.get('other.index.active',0),
								activate: function(event, ui){
									Store.set('other.index.active', ui.newTab.index());
								},
							});
						} );
				
						var filterStyle = $('#cloudstyle');
						var htmlstyle;
						$('#filter').on('input', function() {cloudBoard.findb(this.value)} );
					
			</script>
		</footer>
	</body>
</html>
<?php
$html = ob_get_contents();
ob_end_clean();
file_put_contents('index.html', $html);
echo $html;
?>