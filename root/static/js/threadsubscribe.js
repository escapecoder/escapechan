var Tracker = {
    boards: [],
    colors: [],
    data: [],
    mode: '',
    filter: 'timestamp',
    nsfw: false,
    limit: 50,
    timeout: 60,
    pause: false,
    init: function() {
        Store.init();
        this.boards = Store.get('other.tracker.boards2', ['b', 'f', 'pol', 'news']);
        this.mode = Store.get('other.tracker.mode', 'Full');
        this.filter = Store.get('other.tracker.filter', 'timestamp');
        this.nsfw = Store.get('other.tracker.nsfw', false);
        this.limit = Store.get('other.tracker.limit', 50);
        $('#toggle-mode').val(this.mode == 'Simple' ? 'Full' : 'Simple');
        $('#toggle-filter').val(this.filter);
        $('#toggle-nsfw').val(this.nsfw);
        $('#limit').val(this.limit);
        this.getdata();
        window.t = window.setInterval(function() {
            Tracker.update()
        }, 1000);
        $('.box__data,.tracker').on('click', '#add-board', function() {
            var board = $('#board').val();
            if (board) Tracker.add(board);
            $('#board').val('');
            $(this).val('Добавлено!');
            var that = this;
            window.setTimeout(function() {
                $(that).val('Добавить');
            }, 1000);
        });
        $('.boards-list').on('click', 'a', function() {
            var board = $(this).data('board');
            if (board) Tracker.del(board);
        });
        $('.box__data,.tracker').on('click', '.update', function(e) {
            e.preventDefault();
            $(this).text('Обновляем...');
            Tracker.forcedUpdate();
            var that = this;
            window.setTimeout(function() {
                $(that).html('Обновить (<span class="counter"></span>)');
            }, 1000);
            return false;
        });
        $('.box__data,.tracker').on('click', '.hide', function() {
            var num = $(this).data('num');
            var board = $(this).data('board');
            Tracker.hide(num, board);
            return false;
        });
        $('.box__data,.tracker').on('click', '.unhide', function() {
            var num = $(this).data('num');
            var board = $(this).data('board');
            Tracker.unhide(num, board);
            return false;
        });
        $('.box__data,.tracker').on('click', '#toggle-timer', function() {
            Tracker.toggleTimer();
        });
        $('.box__data,.tracker').on('click', '#toggle-mode', function() {
            var mode = $(this).val();
            Tracker.toggleMode(mode);
        });
        $('.box__data,.tracker').on('change', '#toggle-filter', function() {
            var filter = $(this).val();
            Tracker.toggleFilter(filter);
        });
        $('.box__data,.tracker').on('change', '#toggle-nsfw', function() {
            var nsfw = $(this).prop('checked');
            Tracker.toggleNsfw(nsfw);
        });
        $('.box__data,.tracker').on('change', '#limit', function() {
            var limit = $(this).val();
            Tracker.limit = limit
            Store.set('other.tracker.limit', limit)
        });
        $(".box__data,.tracker").on('input', '#filter', function(e) {
            var newstr = $(this).val().replace(/\/|\\|#/g, '');
            var map = [
                ["ӓ", "a"],
                ["ӓ̄", "a"],
                ["ӑ", "a"],
                ["а̄", "a"],
                ["ӕ", "ae"],
                ["а́", "a"],
                ["а̊", "a"],
                ["ә", "a"],
                ["ӛ", "a"],
                ["я", "a"],
                ["ѫ", "a"],
                ["а", "a"],
                ["б", "b"],
                ["в", "v"],
                ["ѓ", "g"],
                ["ґ", "g"],
                ["ғ", "g"],
                ["ҕ", "g"],
                ["г", "g"],
                ["һ", "h"],
                ["д", "d"],
                ["ђ", "d"],
                ["ӗ", "e"],
                ["ё", "e"],
                ["є", "e"],
                ["э", "e"],
                ["ѣ", "e"],
                ["е", "e"],
                ["ж", "zh"],
                ["җ", "zh"],
                ["ӝ", "zh"],
                ["ӂ", "zh"],
                ["ӟ", "z"],
                ["ӡ", "z"],
                ["ѕ", "z"],
                ["з", "z"],
                ["ӣ", "j"],
                ["и́", "i"],
                ["ӥ", "i"],
                ["і", "i"],
                ["ї", "ji"],
                ["і̄", "i"],
                ["и", "i"],
                ["ј", "j"],
                ["ј̵", "j"],
                ["й", "j"],
                ["ќ", "k"],
                ["ӄ", "k"],
                ["ҝ", "k"],
                ["ҡ", "k"],
                ["ҟ", "k"],
                ["қ", "k"],
                ["к̨", "k"],
                ["к", "k"],
                ["ԛ", "q"],
                ["љ", "l"],
                ["Л’", "l"],
                ["ԡ", "l"],
                ["л", "l"],
                ["м", "m"],
                ["њ", "n"],
                ["ң", "n"],
                ["ӊ", "n"],
                ["ҥ", "n"],
                ["ԋ", "n"],
                ["ԣ", "n"],
                ["ӈ", "n"],
                ["н̄", "n"],
                ["н", "n"],
                ["ӧ", "o"],
                ["ө", "o"],
                ["ӫ", "o"],
                ["о̄̈", "o"],
                ["ҩ", "o"],
                ["о́", "o"],
                ["о̄", "o"],
                ["о", "o"],
                ["œ", "oe"],
                ["ҧ", "p"],
                ["ԥ", "p"],
                ["п", "p"],
                ["р", "r"],
                ["с̀", "s"],
                ["ҫ", "s"],
                ["ш", "sh"],
                ["щ", "sch"],
                ["с", "s"],
                ["ԏ", "t"],
                ["т̌", "t"],
                ["ҭ", "t"],
                ["т", "t"],
                ["ӱ", "u"],
                ["ӯ", "u"],
                ["ў", "u"],
                ["ӳ", "u"],
                ["у́", "u"],
                ["ӱ̄", "u"],
                ["ү", "u"],
                ["ұ", "u"],
                ["ӱ̄", "u"],
                ["ю̄", "u"],
                ["ю", "u"],
                ["у", "u"],
                ["ԝ", "w"],
                ["ѳ", "f"],
                ["ф", "f"],
                ["ҳ", "h"],
                ["х", "h"],
                ["ћ", "c"],
                ["ҵ", "c"],
                ["џ", "d"],
                ["ч", "c"],
                ["ҷ", "c"],
                ["ӌ", "c"],
                ["ӵ", "c"],
                ["ҹ", "c"],
                ["ч̀", "c"],
                ["ҽ", "c"],
                ["ҿ", "c"],
                ["ц", "c"],
                ["ъ", "y"],
                ["ӹ", "y"],
                ["ы̄", "y"],
                ["ѵ", "y"],
                ["ы", "y"],
                ["ь", "y"],
                ["", ""],
                ["Ӓ", "a"],
                ["Ӓ̄", "a"],
                ["Ӑ", "a"],
                ["А̄", "a"],
                ["Ӕ", "ae"],
                ["А́", "a"],
                ["А̊", "a"],
                ["Ә", "a"],
                ["Ӛ", "a"],
                ["Я", "a"],
                ["Ѫ", "a"],
                ["А", "a"],
                ["Б", "b"],
                ["В", "v"],
                ["Ѓ", "g"],
                ["Ґ", "g"],
                ["Ғ", "g"],
                ["Ҕ", "g"],
                ["Г", "g"],
                ["Һ", "h"],
                ["Д", "d"],
                ["Ђ", "d"],
                ["Ӗ", "e"],
                ["Ё", "e"],
                ["Є", "e"],
                ["Э", "e"],
                ["Ѣ", "e"],
                ["Е", "e"],
                ["Ж", "zh"],
                ["Җ", "zh"],
                ["Ӝ", "zh"],
                ["Ӂ", "zh"],
                ["Ӟ", "z"],
                ["Ӡ", "z"],
                ["Ѕ", "z"],
                ["З", "z"],
                ["Ӣ", "j"],
                ["И́", "i"],
                ["Ӥ", "i"],
                ["І", "i"],
                ["Ї", "ji"],
                ["І̄", "i"],
                ["И", "i"],
                ["Ј", "j"],
                ["Ј̵", "j"],
                ["Й", "j"],
                ["Ќ", "k"],
                ["Ӄ", "k"],
                ["Ҝ", "k"],
                ["Ҡ", "k"],
                ["Ҟ", "k"],
                ["Қ", "k"],
                ["К̨", "k"],
                ["К", "k"],
                ["ԛ", "q"],
                ["Љ", "l"],
                ["Л’", "l"],
                ["ԡ", "l"],
                ["Л", "l"],
                ["М", "m"],
                ["Њ", "n"],
                ["Ң", "n"],
                ["Ӊ", "n"],
                ["Ҥ", "n"],
                ["Ԋ", "n"],
                ["ԣ", "n"],
                ["Ӈ", "n"],
                ["Н̄", "n"],
                ["Н", "n"],
                ["Ӧ", "o"],
                ["Ө", "o"],
                ["Ӫ", "o"],
                ["О̄̈", "o"],
                ["Ҩ", "o"],
                ["О́", "o"],
                ["О̄", "o"],
                ["О", "o"],
                ["Œ", "oe"],
                ["Ҧ", "p"],
                ["ԥ", "p"],
                ["П", "p"],
                ["Р", "r"],
                ["С̀", "s"],
                ["Ҫ", "s"],
                ["Ш", "sh"],
                ["Щ", "sch"],
                ["С", "s"],
                ["Ԏ", "t"],
                ["Т̌", "t"],
                ["Ҭ", "t"],
                ["Т", "t"],
                ["Ӱ", "u"],
                ["Ӯ", "u"],
                ["Ў", "u"],
                ["Ӳ", "u"],
                ["У́", "u"],
                ["Ӱ̄", "u"],
                ["Ү", "u"],
                ["Ұ", "u"],
                ["Ӱ̄", "u"],
                ["Ю̄", "u"],
                ["Ю", "u"],
                ["У", "u"],
                ["ԝ", "w"],
                ["Ѳ", "f"],
                ["Ф", "f"],
                ["Ҳ", "h"],
                ["Х", "h"],
                ["Ћ", "c"],
                ["Ҵ", "c"],
                ["Џ", "d"],
                ["Ч", "c"],
                ["Ҷ", "c"],
                ["Ӌ", "c"],
                ["Ӵ", "c"],
                ["Ҹ", "c"],
                ["Ч̀", "c"],
                ["Ҽ", "c"],
                ["Ҿ", "c"],
                ["Ц", "c"],
                ["Ъ", "y"],
                ["Ӹ", "y"],
                ["Ы̄", "y"],
                ["Ѵ", "y"],
                ["Ы", "y"],
                ["Ь", "y"],
                ["№", ""],
                ["\'", ""],
                ["\"", ""],
                [";", ""],
                [":", ""],
                [",", ""],
                [".", ""],
                [">", ""],
                ["<", ""],
                ["?", ""],
                ["!", ""],
                ["@", ""],
                ["#", ""],
                ["$", ""],
                ["%", ""],
                ["&", ""],
                ["^", ""],
                ["(", ""],
                [")", ""],
                ["*", ""],
                ["+", ""],
                ["~", ""],
                ["|", ""],
                ["{", ""],
                ["}", ""],
                ["|", ""],
                ["[", ""],
                ["]", ""],
                ["/", ""],
                ["`", ""],
                ["=", ""],
                ["+", ""],
                ["_", ""],
                ["/[^A-Za-z0-9\-]", ""]
            ];
            for (var i = 0; i < map.length; i++) {
                newstr = newstr.replace(map[i][0], map[i][1]);
            };
            $(this).val(newstr.trim().toLowerCase());
            return true;
        });
        for (i = 0; i < this.boards.length; i++) {
            this.colors[i] = this.genColor();
        }
    },
    hide: function(num, board) {
        Store.set('board.' + board + '.hidden.' + num, Math.ceil((+new Date) / 1000 / 60 / 60 / 24));
        $('.row_' + num + ' .thread').hide();
        $('.row_' + num + ' .hide').html('Развернуть').addClass('unhide').removeClass('hide');
    },
    unhide: function(num, board) {
        Store.del('board.' + board + '.hidden.' + num);
        $('.row_' + num + ' .thread').show();
        $('.row_' + num + ' .unhide').html('Скрыть').addClass('hide').removeClass('unhide');;
    },
    update: function() {
        var update_el = $('.counter');
        this.timeout--;
        if (this.timeout >= 0) update_el.html(this.timeout);
        if (this.timeout != 0) return;
        this.getdata();
        this.timeout = 60;
    },
    forcedUpdate: function() {
        this.getdata();
        this.timeout = 60;
    },
    toggleTimer: function() {
        if (this.pause) {
            this.pause = false;
            window.t = window.setInterval(function() {
                Tracker.update()
            }, 1000);
            $('#toggle-timer').html('Стоп');
        } else {
            this.pause = true;
            clearTimeout(window.t);
            $('#toggle-timer').html('Пуск');
        }
    },
    toggleMode: function(mode) {
        this.mode = mode;
        Store.set('other.tracker.mode', mode);
        $('#toggle-mode').val(mode == 'Simple' ? 'Full' : 'Simple');
        var output = this.sort(this.filter);
        this.display(output);
    },
    toggleFilter: function(filter) {
        this.filter = filter;
        Store.set('other.tracker.filter', filter);
        $('#toggle-filter').val(filter);
        var output = this.sort(filter);
        this.display(output);
    },
    toggleNsfw: function(nsfw) {
        this.nsfw = nsfw;
        Store.set('other.tracker.nsfw', nsfw);
        $('#toggle-nsfw').val(nsfw);
        if (nsfw) {
            $('head').append('<style type="text/css" id="nsfw-style">' +
                '.box__data .data .row .thumb {opacity:0.05}' +
                '.box__data .data .row .thumb:hover{opacity:1}' +
                '</style>');
        } else {
            $('#nsfw-style').remove();
        }
    },
    add: function(board) {
        var index = this.boards.indexOf(board);
        if (index != -1) return;
        this.boards.push(board);
        this.colors.push(this.genColor());
        $('.boards-list').append('<span style="color:' + this.colors[this.colors.length - 1] + '" class="board-' + board + '"> / ' + board + '  <a href="javascript:void(0);" data-board="' + board + '">x</a></span>');
        Store.set('other.tracker.boards2', this.boards);
    },
    del: function(board) {
        var index = this.boards.indexOf(board);
        this.boards.splice(index, 1);
        this.colors.splice(index, 1);
        $('.boards-list .board-' + board).remove();
        Store.set('other.tracker.boards2', this.boards);
    },
    sortby: function(field, reverse, primer) {
        var key = function(x) {
            return primer ? primer(x.posts[0][field]) : x.posts[0][field]
        };
        return function(a, b) {
            var A = key(a),
                B = key(b);
            return ((A < B) ? -1 : ((A > B) ? 1 : 0)) * [-1, 1][+!!reverse];
        }
    },
    sort: function(filter) {
        var out = this.data;
        out.sort(this.sortby(filter, false, parseInt));
        return out;
    },
    convert_time: function(timestamp) {
        var date = new Date(timestamp * 1000);
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var seconds = "0" + date.getSeconds();
        var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        return formattedTime;
    },
    getdata: function(callback) {
        var boards_count = this.boards.length;
        this.data = [];
        var mode = this.mode;
        var that = this;
        var counter = 0;
        for (i = 0; i < boards_count; i++) {
            (function(i) {
                var current = that.boards[i];
                $.getJSON('/' + current + '/catalog_num.json', function(data) {
					$.each(data.threads, function(index, thread) {
                        thread.board = current;
                        thread.color = that.colors[i];
                        that.data.push(thread);
                    });
                    if (counter == boards_count - 1) {
                        var output = that.sort(that.filter);
						//console.log(output);
                        that.display(output);
                    }
                    counter += 1;
                }).fail(function() {
                    counter += 1;
                })
            })(i);
        }
    },
    display: function(output) {
        //output = output[0].posts;
        var boards = this.boards;
        var htmldata = '';
        var htmlboards = '';
        var limit = (output.length > this.limit ? this.limit : output.length);
        this.toggleNsfw(this.nsfw);
        for (i = 0; i < boards.length; i++) {
            htmlboards += '<span style="color:' + this.colors[i] + '" class="board-' + boards[i] + '"> / ' + boards[i] + '  <a href="javascript:void(0);" data-board="' + boards[i] + '">x</a></span>';
        }
        if (this.mode == 'Full') {
            for (i = 0; i < limit; i++) {
				var hidden = false;
                var h = Store.get('board.' + output[i].posts[0].board + '.hidden');
                if (h) hidden = output[i].posts[0].num in h;
                htmldata += '<div class="row tsthread row_' + output[i].posts[0].num + '">';
                htmldata += '<div class="reply tsthread__meta">';
                htmldata += 'Создан: ' + output[i].posts[0].date + ' | Постов: ' + output[i].posts[0].posts_count + ' | <a href="#" class="' + (hidden ? 'unhide' : 'hide') + '" data-num="' + output[i].posts[0].num + '" data-board="' + output[i].posts[0].board + '">' + (hidden ? 'Развернуть' : 'Скрыть') + '</a> | <a href="/' + output[i].posts[0].board + '/res/' + output[i].posts[0].num + '.html">Ответить</a>';
                htmldata += '</div>';
                htmldata += '<div class="thread tsthread__body" ' + (hidden ? 'style="display:none;"' : '') + '>';
                htmldata += '<div class="img tsthread__img">';
                htmldata += '<a href="/' + output[i].posts[0].board + '/res/' + output[i].posts[0].num + '.html">';
                htmldata += '<img class="thumb tsthread__thumb" src="' + output[i].posts[0].files[0].thumbnail + '" width="' + output[i].posts[0].files[0].tn_width + '" height="' + output[i].posts[0].files[0].tn_height + '">';
                htmldata += '</a>'
                htmldata += '</div>';
                htmldata += '<div class="thread-info">';
                if (output[i].posts[0].tags) {
                    tag = ' /' + output[i].posts[0].tags + '/';
                }
                if (output[i].posts[0].subject && 0) {
                    htmldata += '<br><b>' + output[i].posts[0].subject + (output[i].posts[0].tags ? tag : '') + '</b>';
                }
                htmldata += '</div>';
                htmldata += '<div class="comment tsthread__comment">';
                htmldata += '<span style="color:' + output[i].posts[0].color + '">/' + output[i].posts[0].board + '/</span>: ' + output[i].posts[0].comment;
                htmldata += '</div>';
                htmldata += '</div>';
                htmldata += '</div>';
                if (window.location.pathname != '/') htmldata += '<hr class="dottedhr">';
            }
        } else {
            for (i = 0; i < limit; i++) {
                htmldata += '<div class="row">' + '<span style="color:' + output[i].posts[0].color + '">/' + output[i].posts[0].board + '/</span>' + ' - <a href="/' + output[i].posts[0].board + '/res/' + output[i].posts[0].num + '.html" target="_blank">' + output[i].posts[0].subject + '</a>';
                htmldata += '<span class="date"> [ ' + output[i].posts[0].date + ' ]</span></div>';
            }
        }
        $("#data").html(htmldata);
        $(".boards-list").html(htmlboards);
    },
    genColor: function() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }
};
window.Store = {
    memory: {},
    type: null,
    init: function() {
        if (this.html5_available()) {
            this.type = 'html5';
            this.html5_load();
        } else if (this.cookie_available()) {
            this.type = 'cookie';
            this.cookie_load();
        }
    },
    get: function(path, default_value) {
        var path_array = this.parse_path(path);
        if (!path_array) return default_value;
        var pointer = this.memory;
        var len = path_array.length;
        for (var i = 0; i < len - 1; i++) {
            var element = path_array[i];
            if (!pointer.hasOwnProperty(element)) return default_value;
            pointer = pointer[element];
        }
        var ret = pointer[path_array[i]];
        if (typeof(ret) == 'undefined') return default_value;
        return ret;
    },
    set: function(path, value) {
        if (typeof(value) == 'undefined') return false;
        if (this.type) this[this.type + '_load']();
        var path_array = this.parse_path(path);
        if (!path_array) return false;
        var pointer = this.memory;
        var len = path_array.length;
        for (var i = 0; i < len - 1; i++) {
            var element = path_array[i];
            if (!pointer.hasOwnProperty(element)) pointer[element] = {};
            pointer = pointer[element];
            if (typeof(pointer) != 'object') return false;
        }
        pointer[path_array[i]] = value;
        if (this.type) this[this.type + '_save']();
        return true;
    },
    del: function(path) {
        var path_array = this.parse_path(path);
        if (!path_array) return false;
        if (this.type) this[this.type + '_load']();
        var pointer = this.memory;
        var len = path_array.length;
        var element, i;
        for (i = 0; i < len - 1; i++) {
            element = path_array[i];
            if (!pointer.hasOwnProperty(element)) return false;
            pointer = pointer[element];
        }
        if (pointer.hasOwnProperty(path_array[i])) delete(pointer[path_array[i]]);
        this.cleanup(path_array);
        if (this.type) this[this.type + '_save']();
        return true;
    },
    cleanup: function(path_array) {
        var pointer = this.memory;
        var objects = [this.memory];
        var len = path_array.length;
        var i;
        for (i = 0; i < len - 2; i++) {
            var element = path_array[i];
            pointer = pointer[element];
            objects.push(pointer);
        }
        for (i = len - 2; i >= 0; i--) {
            var object = objects[i];
            var key = path_array[i];
            var is_empty = true;
            $.each(object[key], function() {
                is_empty = false;
                return false;
            });
            if (!is_empty) return true;
            delete(object[key]);
        }
    },
    reload: function() {
        if (this.type) this[this.type + '_load']();
    },
    'export': function() {
        return JSON.stringify(this.memory);
    },
    'import': function(data) {
        try {
            this.memory = JSON.parse(data);
            if (this.type) this[this.type + '_save']();
            return true;
        } catch (e) {
            return false;
        }
    },
    parse_path: function(path) {
        var test = path.match(/[a-zA-Z0-9_\-\.]+/);
        if (test == null) return false;
        if (!test.hasOwnProperty('0')) return false;
        if (test[0] != path) return false;
        return path.split('.');
    },
    html5_available: function() {
        if (!window.Storage) return false;
        if (!window.localStorage) return false;
        try {
            localStorage.__storage_test = 'stortest';
            if (localStorage.__storage_test != 'stortest') return false;
            localStorage.removeItem('__storage_test');
            return true;
        } catch (e) {
            return false;
        }
    },
    html5_load: function() {
        if (!localStorage.store) return;
        this.memory = JSON.parse(localStorage.store);
    },
    html5_save: function() {
        localStorage.store = JSON.stringify(this.memory);
    },
    cookie_available: function() {
        try {
            $.cookie('__storage_test', 'stortest');
            if ($.cookie('__storage_test') != 'stortest') return false;
            $.removeCookie('__storage_test');
            return true;
        } catch (e) {
            return false;
        }
    },
    cookie_load: function() {
        var str = $.cookie('store');
        if (!str) return;
        this.memory = JSON.parse(str);
    },
    cookie_save: function() {
        var str = JSON.stringify(this.memory);
        $.cookie('store', str, 365 * 5);
    }
};