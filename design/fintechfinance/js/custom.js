$(window).load(function(){
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
		$('body').addClass('ios');
	};
	$('body').removeClass('loaded');
});
$(function(){

    if($.browser.msie){
		   $('input[placeholder]').each(function(){

				var input = $(this);

				$(input).val(input.attr('placeholder'));

				$(input).focus(function(){
					 if (input.val() == input.attr('placeholder')) {
						 input.val('');
					 }
				});

				$(input).blur(function(){
					if (input.val() == '' || input.val() == input.attr('placeholder')) {
						input.val(input.attr('placeholder'));
					}
				});
			});

		};
		if($.browser.msie){
		   $('textarea[placeholder]').each(function(){

				var input = $(this);

				$(input).val(input.attr('placeholder'));

				$(input).focus(function(){
					 if (input.val() == input.attr('placeholder')) {
						 input.val('');
					 }
				});

				$(input).blur(function(){
					if (input.val() == '' || input.val() == input.attr('placeholder')) {
						input.val(input.attr('placeholder'));
					}
				});
			});

		};

	$('input, textarea').each(function(){
		var placeholder = $(this).attr('placeholder');
		$(this).focus(function(){ $(this).attr('placeholder', ''); return false;});
		$(this).focusout(function(){
			$(this).attr('placeholder', placeholder);
			return false;
		});
	});

	$('.button-menu').click(function(){
		$(this).toggleClass('active'),
        $(".js-list-language").fadeOut(0);
		$('nav').slideToggle();
		return false;
	});


    $('.box-language__link').click(function(){
        $(this).parents('header').find('.js-list-language').fadeToggle(100),
        $('.box-language__link').toggleClass('active');
        $(".ios nav").fadeOut(0);
        return false;
    });

	$(".list-languages__link").click(function(){
        var name = $(this).html();
        $(".box-language__link").html(name);
        $(".js-list-language").fadeOut(100);
		$('.list-languages__item').removeClass("active");
		$('.box-language__link').removeClass("active");
		$(this).parent().addClass("active");
        return false;
    });

	$(document).click(function(e){
		if ($(e.target).parents().filter('.js-list-language:visible').length != 1) {
			$('.js-list-language').hide();
		}
	});

    if($('.js-styled').length) {
        $('.js-styled').styler();
    };

    $('.list-sections-faq__link').click(function(){
        $(this).parent().toggleClass('open');
        $(this).parent().find('.list-faq').slideToggle();
        $(this).parent().siblings().removeClass('open');
        $(this).parent().siblings().find('.list-faq').slideUp();
        return false;
    });
    $('.list-faq__link').click(function(){
        $(this).parent().toggleClass('open');
        $(this).parent().find('.list-faq__drop').slideToggle();
        $(this).parent().siblings().removeClass('open');
        $(this).parent().siblings().find('.list-faq__drop').slideUp();
        return false;
    });

		if($('.fancybox').length) {
        $('.fancybox').fancybox({
					padding: 0,
					fitToView: false,
					helpers: {
						overlay: {
						  locked: false
						}
					  }
				});
    };

		if($('.styled').length) {
        $('.styled').styler();
    };

});

var handler2 = function(){

	var height_footer = $('footer').height();
	$('.content').css({'padding-bottom':height_footer+0});

}
$(window).bind('load', handler2);
$(window).bind('resize', handler2);
