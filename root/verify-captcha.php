<?php
session_name('captchaToken');
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	// Это запрос от Nginx (auth_request)
	if (isset($_SESSION['captcha_passed']) && $_SESSION['captcha_passed'] === true) {
		// Капча пройдена ранее, разрешаем доступ
		http_response_code(200);
		exit;
	} else {
		// Капча не пройдена, запрещаем доступ
		http_response_code(200);
		exit;
	}
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if(isset($_POST['norobot']) && $_POST['norobot'] == '1') {
		// Капча пройдена, сохраняем в сессии
		$_SESSION['captcha_passed'] = true;
		// Редиректим на исходный URL (или на /private-area по умолчанию)
		$redirect = isset($_POST['redirect']) ? $_POST['redirect'] : '/';
		header("Location: $redirect");
		exit;
	} else {
		// Капча не пройдена, показываем ошибку
		http_response_code(403);
		echo "Капча не пройдена, попробуй ещё раз!";
		exit;
	}
}
?>