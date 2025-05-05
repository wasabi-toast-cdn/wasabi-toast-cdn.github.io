var timer_interval = false;
var time_left = 0;
var game_interval = false;
var animation_timer = 0;

var score = 0;

var current_ship = 0;

var calc_value = '';
var calc_value_prev = '';

var sounds = [];
var sounds_loaded = [];
var sound_files = ['sfx_laser2', 'sfx_explode', 'sfx_lose', 'music_fun'];
var audio_on = true;

var IE = false;
//@cc_on IE = true;

var deviceAgent = navigator.userAgent.toLowerCase();
var iOS = deviceAgent.match(/(iphone|ipod|ipad)/);

var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

if (typeof document.oncontextmenu != 'undefined') document.oncontextmenu = ce;
else document.onclick = nrc;
//if (typeof document.onselectstart != 'undefined') document.onselectstart = ce;
//if (typeof document.ondragstart != 'undefined') document.ondragstart = ce;

function init() {
    $('#result_popup').hide();
    $('#greyout').hide();
    $('#frontpage_div').show();
    $('#game_div').hide();
    $('#timer_div').html('');

    load_audio();

    if (mobile) show_keypad();

    $('#shoot_angle').on("keypress", function(e) {
        if (e.which == 13) {
            check_answer();
        }
    });

    resize_screen();
    window.onresize = resize_screen;
}

function resize_screen() {
    viewport_size = get_viewport();

    var bg_width = 800;
    var bg_height = 600;

    game_area_width = viewport_size[0];
    game_area_height = viewport_size[1];

    if (game_area_width > game_area_height) //LANDSCAPE MODE
    {
        screen_zoom = (game_area_height - 0) / bg_height;

        if (bg_width * screen_zoom > game_area_width) {
            screen_zoom = (game_area_width - 0) / bg_width;
        }
    } else //PORTRAIT MODE
    {
        screen_zoom = (game_area_width - 0) / bg_width;
    }

    $('#main_div').css({
        transform: 'scale(' + screen_zoom + ', ' + screen_zoom + ')',
        transformOrigin: 'left top',
        top: 0,
        left: (game_area_width - (bg_width * screen_zoom)) / 2
    });

    game_area_left = 0; //parseInt(game_area.style.left);
}

function get_viewport() {
    var viewPortWidth;
    var viewPortHeight;

    if (typeof window.innerWidth != 'undefined') {
        viewPortWidth = window.innerWidth,
            viewPortHeight = window.innerHeight
    } else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
        viewPortWidth = document.documentElement.clientWidth,
            viewPortHeight = document.documentElement.clientHeight
    } else {
        viewPortWidth = document.getElementsByTagName('body')[0].clientWidth,
            viewPortHeight = document.getElementsByTagName('body')[0].clientHeight
    }

    return [viewPortWidth, viewPortHeight];
}

function show_keypad(event, ui) {
    $('#calculator_div').show();
}

function calc(key_pressed) {
    if (calc_value == '0') calc_value = '';

    if (key_pressed == Math.floor(key_pressed) || (key_pressed == '.' && calc_value.indexOf('.') < 0)) calc_value = calc_value + '' + key_pressed;

    if (key_pressed == 'clear') {
        calc_value = 0;
        calc_value_prev = 0;
    }

    if (key_pressed == 'delete' && calc_value + "".length > 1) calc_value = (calc_value + "").slice(0, -1);

    if (key_pressed == 'enter') {
        check_answer();
        calc_value = '';
        return;
    }

    if (calc_value != parseFloat(calc_value)) calc_value = 0;

    var calc_value_text = (calc_value + "").substr(0, 3);

    calc_value = parseFloat(calc_value_text);

    $('#shoot_angle').text(calc_value_text);
}

function start_game() {
    $('#result_popup').hide();

    $('#game_div').show();
    for (var i = 0; i < 4; i++) {
        $('#enemy_ship_' + i).css({
            top: -200,
            left: random(750)
        });
    }
    current_ship = -1;

    score = 0;

    update_score();

    playing = true;

    level = 0;
    play_sound(3)
    levelup();
    show_popup("Thank you for playing modded Angle Invaders! \n From The Modder - Jamison", 5000)
}

var level = 0;

function levelup() {
    level++;

    if (level == 1) next_ship();

    if (level > 5) {
        game_over();
    } else {
        show_popup('Level ' + level, 2000);
        $('#level_div').html('Level: ' + level);
        show_angles();
        rotate_ship();
    }
}

function show_angles() {
    $('#angles').html('<img src="images/protractor.png" style="position:absolute;top:246px;left:223px;">');

    for (var i = 0; i <= 180; i += 45) {
        var xdist = 300;
        var ydist = 300;
        var angle = 180 - i;
        var x = 400 + (Math.cos(angle * Math.PI / -180) * xdist);
        var y = 440 + (Math.sin(angle * Math.PI / -180) * ydist);

        if ((i == 45 && level > 1) || (i == 135 && level > 2)) {} else {
            //$('#angles').append('<div style="position:absolute;top:' + y + 'px;left:' + x + 'px;width:53px;text-align:center;">' + i + '</div>');
        }
    }
}

var playing = false;

function game_over() {
    playing = false;
    $('#result_popup').html('Well Done!<br>You have completed all of the levels<br><span class="large orange button" onclick="start_game();">PLAY AGAIN</span>').show();
}

function update_score() {
    $('#score_div').html('Score: ' + score);
}

function next_ship() {
    current_ship++;

    if (current_ship > 5) current_ship = 0;

    $('#player_ship').css('transform', 'rotate(0deg)').fadeIn();
    $('#enemy_ship_' + current_ship).css({
        top: 10,
        left: random(750)
    }).fadeOut(1).fadeIn();

    clear_shoot_angle();

    $('.enemy_ship').removeClass('first');
    $('#enemy_ship_' + current_ship).addClass('first');
    $('#player_ship').addClass('second');

    shooting = false;

    show_angle();

    move_ship();
}

function move_ship() {
    if (!playing) return;

    if (!shooting) {
        var new_left = getpos($('#enemy_ship_' + current_ship).css('left')) - -x_move;
        var new_top = getpos($('#enemy_ship_' + current_ship).css('top')) - -y_move;

        $('#enemy_ship_' + current_ship).css({
            left: new_left,
            top: new_top
        });

        if (new_top < 330) {
            setTimeout(move_ship, 50);
        } else {
            explode(0, 0);
            show_popup('Too Late!', 2000);
            setTimeout(next_ship, 2000);
        }
    } else {
        var dist = 15;
        var angle = 180 - (entered_angle);
        var x = Math.cos(angle * Math.PI / -180) * dist;
        var y = Math.sin(angle * Math.PI / -180) * dist;

        $('#missile').css({
            'left': '+=' + x + 'px',
            'top': '+=' + y + 'px'
        });

        var ship_x = getpos($('#enemy_ship_' + current_ship).css('left'));
        var ship_y = getpos($('#enemy_ship_' + current_ship).css('top'));
        var ship_width = $('#enemy_ship_' + current_ship).width();
        var ship_height = $('#enemy_ship_' + current_ship).height();

        var missile_x = getpos($('#missile').css('left'));
        var missile_y = getpos($('#missile').css('top'));

        var angle_diff = Math.round(Math.abs(correct_angle - entered_angle));

        var max_angle_diff = [0, 6, 4, 4];

        if (missile_x > ship_x && missile_x < ship_x + ship_width && missile_y > ship_y && missile_y < ship_y + ship_height && angle_diff <= max_angle_diff[level]) {
            explode(0, 1);
            $('#missile').css({
                top: -80
            });
            shooting = false;
            score += (7 - angle_diff);
            update_score();

            if ((level == 1 && score >= 60) || (level == 2 && score >= 120) || (level == 3 && score >= 180) || (level == 4 && score >= 280)) setTimeout(levelup, 3250);

            setTimeout("show_popup('Well Done!<br>You were " + (angle_diff) + " degrees out!', 2000);", 1000);
            setTimeout(next_ship, 3000);
        } else {
            if (missile_y < -20 || missile_x < -20 || missile_x > 800 ) {
                play_sound(2);
                shooting = false;
                show_popup('Incorrect!<br>You were ' + (angle_diff) + ' degrees out!', 2000);
            }
            setTimeout(move_ship, 50);
        }
    }
}

function explode(frame, ship) {
    if (frame == 0) {
        play_sound(1);

        if (ship == 1) {
            $('#explosion').css({
                top: parseInt($('#enemy_ship_' + current_ship).css('top')) - 50,
                left: parseInt($('#enemy_ship_' + current_ship).css('left')) - 50
            }).fadeIn();
        } else {
            $('#explosion').css({
                top: parseInt($('#player_ship').css('top')) - 45,
                left: parseInt($('#player_ship').css('left')) - 45
            }).fadeIn();
            $('#player_ship').fadeOut();
            $('#missile').fadeOut();
        }

        $('#enemy_ship_' + current_ship).fadeOut();
    }

    $('#explosion').css('backgroundPosition', '-' + (182 * frame) + 'px 1px');

    frame++;

    if (frame < 9) {
        setTimeout('explode(' + frame + ');', 70);
    } else {
        $('#explosion').fadeOut(1);
    }
}

var x_move, y_move, correct_angle;

function getpos(pxval) {
    return parseFloat(pxval);
}

function rotate_ship() {
    var ship_scale = [0, 1, 0.9, 0.8][level];
    $('.enemy_ship').css('transform', 'rotate(' + (correct_angle - 90) + 'deg) scale(' + ship_scale + ', ' + ship_scale + ')');
}

function show_angle() {
    $('#missile').css({
        top: 430,
        left: 425,
        transform: 'rotate(0deg)'
    }).fadeIn();

    $('.step').remove();

    var f = $('.first');
    var s = $('.second');

    f.each(function(i) {
        var f2 = f.eq(i);
        var s2 = s.eq(i);
        var xdist = getpos(s2.css('left')) - getpos(f2.css('left'));
        var ydist = getpos(s2.css('top')) - getpos(f2.css('top'));
        var dist = Math.sqrt(xdist * xdist + ydist * ydist);
        var num_steps = Math.round(dist / 50) - 1;

        correct_angle = -Math.atan2(xdist, ydist) * 180 / Math.PI;
        correct_angle += 90;

        rotate_ship();

        var enemy_speed = 1000 - (score * 5);

        x_move = xdist / enemy_speed;
        y_move = ydist / enemy_speed;

        var stepX, stepY;

        for (var l = 0; l < num_steps; l++) {
            stepX = xdist / (num_steps + 1) * (l + 1) + f2.width() / 2 + getpos(f2.css('left'));
            stepY = ydist / (num_steps + 1) * (l + 1) + f2.height() / 2 + getpos(f2.css('top'));
            $('<div></div>').addClass('step').appendTo($('#game_div')).css('left', stepX + 'px').css('top', stepY + 'px');
        }
    });
}

function check_answer() {
    if (shooting || !playing) return;
    entered_angle = parseInt($('#shoot_angle').text());
    show_Popup("DEBUG: "+entered_angle, 1000)
    if (Number.isNan(entered_angle) == true) {
        clear_shoot_angle();
        shooting = false;
        return;
    }
    show_Popup("DEBUG: "+entered_angle, 1000)
    $('#player_ship,#missile').css('transform', 'rotate(' + (entered_angle - 90) + 'deg)');
    play_sound(0);
    $('#missile').css({
        top: 430,
        left: 425
    });

    shooting = true;

    clear_shoot_angle();
}

function clear_shoot_angle() {
    $('#shoot_angle').text('');

    if (!mobile) $('#shoot_angle').focus();

    calc_value = '';
}

function show_popup(message, delay) {
    $('#result_popup').html(message).show();
    setTimeout(hide_popup, delay);
}

function hide_popup() {
    $('#result_popup').hide();
}

function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function rand_range(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function random(maximum) {
    return Math.floor(Math.random() * maximum);
}

function start_timer() {
    time_left = 0;
    timer_interval = setInterval(update_timer, 40);
}

function stop_timer() {
    clearInterval(timer_interval);
}

function update_timer() {
    time_left += 0.04;

    var milliseconds = parseInt((time_left - parseInt(time_left)) * 100);
    var seconds = parseInt(time_left) % 60;
    var minutes = (parseInt(time_left) - seconds) / 60;
    if (seconds <= 0) seconds = '00';
    else if (seconds < 10) seconds = '0' + seconds;
    if (milliseconds <= 0) milliseconds = '00';
    else if (milliseconds < 10) milliseconds = '0' + milliseconds;

    document.getElementById('timer_div').innerHTML = minutes + ':' + seconds + ':' + milliseconds;
}

function play_sound(sound_number) {
    //if (audio_on)
    {
        if (!sounds_loaded[sound_number]) {
            sounds[sound_number].load();
            sounds_loaded[sound_number] = true;
        }

        sounds[sound_number].play();
    }
}

function stop_sound(sound_number) {
    try {
        sounds[sound_number].pause();
        sounds[sound_number].currentTime = 0;
    } catch (e) {}
}

function mute(sid) {
    sid.pause();
}

function load_audio() {
    try {
        sounds[0] = new Audio("");
        sound_type = 'html5';
    } catch (err) {
        sound_type = 'ie';
    }

    sound_extension = 'ogg';

    for (var i = 0; i < sound_files.length; i++) {
        if (sound_type == 'html5') {
            sounds[i] = new Audio("");
            sounds[i].src = 'sounds/' + sound_files[i] + '.' + sound_extension;
        } else {
            sounds[i] = new audio('sounds/' + sound_files[i] + sound_extension);
        }

        if (IE) sounds_loaded[i] = true;
    }
}

function leftClick(e) {
    window.focus();
    if (!e) e = event;
    return ((typeof e.which == 'undefined') ? (e.button == 1) : (e.which == 1 || e.button == 0));
}

function nrc(e) {
    if (leftClick(e) == false) {
        return ce(e);
    }
}

function cp(e) {
    if (!e) e = event;
    if (e.stopPropagation) e.stopPropagation();
    else if (typeof e.cancelBubble != 'undefined') e.cancelBubble = true;
}

function ce(e) {
    if (!e) e = event;

    if (typeof e.preventDefault != 'undefined') {
        e.preventDefault();
    } else if (typeof e.cancelBubble != 'undefined') {
        e.returnValue = 0;
        e.cancelBubble = true;
    }

    return false;
}
