<?php
//phpinfo(); exit;

//error_reporting(E_ALL);
//ini_set('display_errors', '1');

$dbconn = new mysqli('127.0.0.1', 'root', 'password', 'escapechan');

function sendMessage($uid, $text, $keyboard = false, $buttons = false, $notify=true, $forceHtml=false){
	global $config;
	
	$json=array();
	$json['chat_id']=$uid;
	$json['parse_mode']='Markdown';
	$json['text']=$text;
	$json['disable_web_page_preview']=true;
	if(!$notify){
		$json['disable_notification']=true;
	}
	
	if($keyboard!=false || $buttons!=false){
		$json['reply_markup']=array();
	}
	if($keyboard!=false){
		$json['reply_markup']['resize_keyboard']=true;
		$json['reply_markup']['keyboard']=$keyboard;
	}
	if($buttons!=false){
		$json['reply_markup']['inline_keyboard']=$buttons;
	}
	
	file_put_contents('_bot_log.txt', json_encode($json)."\n\n", FILE_APPEND);
	
	$ch=curl_init();
	curl_setopt($ch, CURLOPT_URL, 'https://api.telegram.org/bot'.$config['tg_token'].'/sendMessage');
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json));
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$output=curl_exec($ch);
	file_put_contents('_bot_log.txt', $output."\n\n", FILE_APPEND);
	$output=json_decode($output, true);
	//var_dump($output); exit;
	if(intval($output['result']['message_id'])==0){
		sleep(2);
		$output=curl_exec($ch);
		file_put_contents('_bot_log.txt', $output."\n\n", FILE_APPEND);
		$output=json_decode($output, true);
		if(intval($output['result']['message_id'])==0){
			sleep(2);
			$output=curl_exec($ch);
			file_put_contents('_bot_log.txt', $output."\n\n", FILE_APPEND);
			$output=json_decode($output, true);
			if(intval($output['result']['message_id'])==0){
				sleep(2);
				$output=curl_exec($ch);
				file_put_contents('_bot_log.txt', $output."\n\n", FILE_APPEND);
				$output=json_decode($output, true);
			}

		}
	}
	curl_close($ch);
	return intval($output['result']['message_id']);
}

$config = [];
$config['tg_token'] = '';
$config['hello_message'] = 'Приветствуем тебя в официальном боте имиджборды! Чтобы отключить капчу, нажми кнопку "Получить пасскод" под этим сообщением.';

$menu = array(array(array('callback_data'=>'get_passcode', 'text'=>'Получить пасскод')));

if(isset($_GET['update_webhook'])) {
	$setWebhook = json_decode(file_get_contents('https://api.telegram.org/bot' . $config['tg_token'] . '/setWebhook?url=https://escapechan.fun/telegram_webhook.php'), true);
	var_dump($setWebhook); exit;
}

$json = file_get_contents('php://input');
file_put_contents('_bot_log.txt', $json . "\n\n", FILE_APPEND);
$json = json_decode($json, true);

$cmd = '';

if(isset($json['callback_query'])) {
	$cmd = trim($json['callback_query']['data']);
	$message = $json['callback_query']['message'];
} else {
	$message = $json['message'];
}

$chat = $message['chat'];

$uid = intval($chat['id']);

$res = $dbconn->query("SELECT * FROM `tg_users` WHERE `id` = " . $uid . ";");

if($res->num_rows > 0) {
	$dbconn->query("UPDATE `tg_users` SET `name` = '" . $dbconn->real_escape_string(trim($chat['first_name'] . ' ' . $chat['last_name'])) . "' WHERE `id` = " . $uid . ";");
} else {
	$dbconn->query("INSERT INTO `tg_users` SET `id` = " . $uid . ", `name` = '" . $dbconn->real_escape_string(trim($chat['first_name'] . ' ' . $chat['last_name'])) . "', `timestamp` = " . time() . ";");
}

$res = $dbconn->query("SELECT * FROM `tg_users` WHERE `id` = " . $uid . ";");
$currentUser = $res->fetch_assoc();

//sendMessage($uid, 'Бот закрыт. Для получения пасскода воспользуйся профильным тредом в /d/.', false, false); exit;

if($message['text'] == '/start') {
	sendMessage($uid, $config['hello_message'], false, $menu);
} else if($cmd == 'get_passcode') {
	if($currentUser['banned'] > 0) {
		sendMessage($uid, 'Вы жабанены, хнык(((', false, false);
	} else {
		$res = $dbconn->query("SELECT * FROM `passcodes` WHERE `tg_id` = " . $uid . " AND `timestamp` >= " . (time() - 60 * 60 * 24 * 30) . " ORDER BY `id` DESC;");
		
		if($res->num_rows > 0) {
			$currentPasscode = $res->fetch_assoc();
			
			sendMessage($uid, "С момента получения предыдущего пасскода прошло меньше месяца. Повтори попытку позже.\n\nТвой нынешний пасскод: `" . $currentPasscode['code'] . "`\n\nЗалогинь его на странице: https://escapechan.ru/user/passlogin\n\nПасскод действует ровно месяц, до *" . date('d.m.Y H:i', $currentPasscode['expires']) . "* МСК. Новый пасскод можно получить не раньше, чем через месяц после предыдущего.", false, false);
		} else {
			$passcode = str_replace(['+', '/', '='], '', base64_encode(random_bytes(32)));
			
			$expires = time() + 60 * 60 * 24 * 30;
			
			$dbconn->query("INSERT INTO `passcodes` SET `tg_id` = " . $uid . ", `code` = '" . $dbconn->real_escape_string($passcode) . "', `timestamp` = " . time() . ", `expires` = " . $expires . ";");
			
			sendMessage($uid, 'Твой пасскод: `' . $passcode . "`\n\nЗалогинь его на странице: https://escapechan.ru/user/passlogin\n\nПасскод действует ровно месяц, до *" . date('d.m.Y H:i', $expires) . "* МСК. Новый пасскод можно получить не раньше, чем через месяц после предыдущего.", false, false);
		}
	}
}

?>