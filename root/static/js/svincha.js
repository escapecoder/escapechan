function loadSvincha() {
	$('.wg-cap-container').addClass('wg-cap-dialog__active');
}

$('#wg-cap-btn-control').click(loadSvincha);

$('#wg-cap-wrap-drag').css({height:'300px'});
$('.wg-cap-wrap__footer.slide_footer').hide();