const CFG =  {
    CAPTCHA_KEY           : '',
    CAPTCHALOAD_TIMEOUT   : 30000, //ТАЙМАУТ В МИЛЛИСЕКУНДАХ ФУНКЦИИ ЗАГРУЗКИ КАПЧИ
    CAPTCHA_TTL           : 120, //таймаут в секундах жизни 2ch капчи
    CAPTCHARESET_TIMEOUT  : 180, //таймаут в секундах перед рефрешем ушедшей в таймаут сервера капчи
    TITLE                 : document.title,
    TWITTER_AUTOEXPAND    : 4, //сколько твиттеров раскрывать автоматически
    HIDE_TIMEOUT          : 7,  //сколько дней хранить скрытые треды/посты
    MODAUTH               : getCookie('moder'),
    TZ_OFFSET             : +3, //часовой пояс сервера
    STORE_LIMIT           : 1024*1024, //лимит хранилища байт, после которого надо чистить мусор
    NIGHTMODE             : _CFG.NIGHTMODE,
    GETJSON_TIMEOUT       : 10000, //ТАЙМАУТ В МИЛЛИСЕКУНДАХ ФУНКЦИИ ЗАГРУЗКИ НОВЫХ ПОСТОВ С СЕРВЕРА
    GETJSON_ATTEMPTS      : 3, //количество попыток fetchPosts() в случае ошибки
    GETJSON_INTERVAL      : 2000,  //интервал между попытками fetchPosts() в случае ошибки
    AUTOUPDATE_FOCUS_INTERVAL: 15, //интервал между обновлениями в секундах для вкладки в фокусе
    AUTOUPDATE_BLUR_INTERVAL: 35, //интервал между обновлениями в секундах для вкладки НЕ в фокусе
    FAVICON_DEFAULT       : '<link id="favicon" rel="shortcut icon" href="/favicon.ico"/>', //Дефолтная иконка
    FAVICON_NEW_POSTS      : '<link id="favicon" rel="shortcut icon" href="/favicon_newposts.ico"/>', //Иконка для оповещения о новых постах
    FAVICON_DELETED       : '<link id="favicon" rel="shortcut icon" href="/favicon_deleted.ico"/>', //Иконка для оповещения о удалённом треде
    FAV_MIN               : 15, //МИНИМАЛЬНЫЙ ПРОМЕЖУТОК ПРОВЕРКИ В СЕКУНДАХ
    FAV_MAX               : 60*60*12, //МАКСИЛЬМАНЫЙ ПРОМЕЖУТОК ПРОВЕРКИ В СЕКУНДАХ
    FAV_MULTIPLIER        : 2, //МНОЖИТЕЛЬ ВРЕМЕНИ ПРОВЕРОК. ПРИ НОВЫХ ПОСТАХ СБРАСЫВАЕТСЯ НА INTERVAL_MIN
    FAV_RETRY             : 60*2, //ВРЕМЯ В СЕКУНДАХ, ЧЕРЕЗ КОТОРОЕ НАДО ПОВТОРИТЬ ПОСЛЕ ОШИБКИ
    FAV_DEL_RECHECK       : 60*10, //ВРЕМЯ В СЕКУНДАХ, ЧЕРЕЗ КОТОРОЕ НАДО ПРОВЕРИТЬ УДАЛЁН ЛИ ТРЕД НА САМОМ ДЕЛЕ
    FAV_LOCK              : 60*5, //БЛОКИРУЮЩИЙ ИНТЕРВАЛ ДЛЯ ВНУТРЕННЕГО ИСПОЛЬЗОВАНИЯ
    STATS_TIMEOUT         : 60,//КАК ЧАСТО ОБНОВЛЯТЬ ДАННЫЕ
    STATS_RETRY           : 10,//ЧЕРЕЗ СКОЛЬКО СЕКУНД ПОВТОРИТЬ ЗАПРОС, ЕСЛИ БЫЛА ОШИБКА
    STATS_CONNECT_TIMEOUT : 30000,//ТАЙМАУТ ДЛЯ ПОДКЛЮЧЕНИЯ В MSF
    STATS_COUNT           : 10,//СКОЛЬКО ТРЕДОВ ПОКАЗЫВАТЬ
    POSTFORM_SHORTCUT     : Store.get('postform.format_shortcut', true),
    MEDIA_CLEAR_EXIF	  : Store.get('media.clear_exif', true),
    MEDIA_READ_WEBM_META  : Store.get ('media.read_webm_meta_title', true),
    MEDIA_NAME_TYPE		  : Store.get('media.name_type', true),
    MEDIA_FULLEXPAND	  : Store.get('other.fullscreen_expand',true),
    MEDIA_NAVBUTTONS      : Store.get('media.mediaviewer_nav', true),
    MEDIA_SMOOTHNAV       : Store.get('media.smooth_nav', false),
    MOBILE_DONT_EXPAND    : Store.get('mobile.dont_expand_images',false),
    W_WIDTH               : document.documentElement.clientWidth,
    W_HEIGHT              : document.documentElement.clientHeight,
    ISMOBILE720           : window.matchMedia("only screen and (max-width: 720px)").matches,
    ISMOBILE480           : window.matchMedia("only screen and (max-width: 480px)").matches,//document.documentElement.clientWidth <= 480 || document.documentElement.clientHeight <= 480,
}

CFG.BOARD = _CFG.BOARD;
CFG.CUSTOMSTYLES = _CFG.CUSTOMSTYLES;
CFG.MYBOARDS = _CFG.MYBOARDS;


const MEDIA = new Map();
const MEDIABYID = new Map();

const _ = {
    id(id) {
        return document.getElementById(id);
    },
    q(name, root = document) {
        return root.querySelector(name);
    },
    qAll(name, root = document) {
        return root.querySelectorAll(name);
    },
    newTempl(html) {
        let templ = document.createElement('template');
        html = html.trim();
        templ.innerHTML = html;
        return templ.content.firstChild;
        //for sibling els template.content.childNodes;
    },
    newTemplMult(html) {
        let templ = document.createElement('template');
        html = html.trim();
        templ.innerHTML = html;
        return templ.content.childNodes;
    },
    newEl(html) {
        var div = document.createElement('div');
        div.innerHTML = html.trim();

        // Change this to div.childNodes to support multiple top-level nodes
        return div.firstElementChild;
    },
    isArch() {
        return location.pathname.split(/\//)[2] == 'arch';
    },
    threadJson(board, num) {
        return CFG.BOARD.MODERVIEW ? `/moder/full/${board}/${num}/json` : ((_.isArch() && board == CFG.BOARD.NAME && num == CFG.BOARD.THREADID) ?
            location.pathname.split('.').slice(0, 1).concat('json').join('.') :
            `/${board}/res/${num}.json`);
    },
    pageJson(board, page) {
        return `/${board}/${page == 0 ? 'index' : page }.json`
    },
    isAndroid() {
        const ua = navigator.userAgent.toLowerCase();
        return ua.indexOf("android") > -1;
    }
}

window.MMyModule = (function () {
    var _private = '';

    var _helper = {
        some() {

        }
    }

    var _module = {
        publicVar: '',
        publicMethod() {
            _helper.some();
            //...
        }
    };

    return _module;

})();

window.Media = {
    processors: [],
    generators: {},
    unloaders: {},
    thumbnailers: {},
    meta: {},

    //функция добавления нового "провайдера"
    //type - текст, пример "youtbe"
    //substr - текст, который должен быть в ссылке, чтоб испытывать на ней регулярку
    //regexp - текст, регулярное выражение для парсинга
    //fields - объект вида {id: 0, album: 1} тогда из регулярки будет возвращено {id: res[0], album: res[1]}
    add(type, substr, regexp, fields) {
        var regobj = new RegExp(regexp, 'i');
        this.processors.push([type, substr, regobj, fields]);
    },

    //добавление генератора плеера
    //type - текст, имя провайдера, пример "youtbe"
    //func - коллбек генератор, получает fields из регулярки и должен вернуть HTML текст плеера
    addGenerator(type, func) {
        this.generators[type] = func;
    },

    //добавить удалялку плеера при закрытии его кнопкой
    //type - текст, имя провайдера, пример "youtbe"
    //func - коллбек, получающий jQuery эллемент обработанной ссылки (<a href...)
    addUnloader(type, func) {
        this.unloaders[type] = func;
    },

    //добавить превью
    //type - текст, имя провайдера, пример "youtbe"
    //func - коллбек генератор, получает fields из регулярки и должен вернуть HTML текст плеера
    //должно вернуть HTML код превью (<img> например)
    addThumbnailer(type, func) {
        this.thumbnailers[type] = func;
    },

    //добавить генератор названия
    //type - текст, имя провайдера, пример "youtbe"
    //func - коллбек генератор, получает fields из регулярки и коллбек, который он должен вызвать с названием после того, как его вычислит
    addTitler(type, func) {
        this.titler.solvers[type] = func;
    },

    //добавить иконку и название сервиса
    //пример Media.addMeta('youtube', {name: 'YouTube', icon: ''});
    addMeta(type, meta) {
        this.meta[type] = meta;
    },

    //обработчик ссылок, определяющий есть ли в ссылке медиа и возвращающий её fields если есть
    parse(url) {
        var proc_len = this.processors.length;
        var ret;

        for(var i=0;i<proc_len;i++) {
            var proc = this.processors[i];
            if(url.indexOf(proc[1]) < 0) continue; //proc[1] это текст, который будет искаться в ссылке

            ret = this.getValues(url, proc);
            if(ret) break;
        }

        return ret;
    },

    //фнкция для получения fields из ссылки
    getValues(url, proc) {
        var type = proc[0];
        var regexp = proc[2];
        var fields = proc[3];
        var values = {type: type};

        var reg_result = regexp.exec(url);
        if(!reg_result) return false;

        for(var field_name in fields) {
            if(!fields.hasOwnProperty(field_name)) continue;
            if(!reg_result.hasOwnProperty(fields[field_name])) return false;

            values[field_name] = reg_result[fields[field_name]];
        }

        return values;
    },

    //внутренняя функция для получения HTML плеера
    getEmbedCode(type, id, cb) { //переписать если вдруг появится что-то кроме ID. Не хочу пачкать "data-" ради совместимости
        this.generators[type]({id: id}, cb);
    },

    //внутренняя функция для обработки сырых <a href...>
    //поиска медиа ссылок
    //рендера кнопок для них
    processLinks(el) {
        return;
		el.each(function(){
            var $el = $(this);
            var url = $el.text();
            var obj = Media.parse(url); //если ничего не вернуло, значит это не медиа ссылка
            if(!obj) return;            //пропускаем
            var $post = el.closest('.post');

            var $button_expand = $('<span href="#" class="media-expand-button">[' + lang.board_expand_media + ']</span>');
            var $button_hide = $('<span href="#" class="media-hide-button">[' + lang.board_close_media + ']</span>');
            var $button_loading = $('<span class="media-expand-loading">[' + lang.board_loading_media + ']</span>');

            //разбираемся с превьюшкой
            if(Media.thumbnailers.hasOwnProperty(obj.type) && Store.get('old.media_thumbnails', true)) {
                var on_hover = Store.get('old.media_thumbnails_on_hover', true);
                var thumbnail = $('<div class="media-thumbnail">' + Media.thumbnailers[obj.type](obj) + '</div>');

                //если в настройках выставлен показ при наводе мыши
                if(on_hover) {
                    $el.hover(function(e){
                        thumbnail.css({
                            position: 'absolute',
                            display: 'block',
                            'z-index': '999',
                            top: e.pageY + 'px',
                            left: e.pageX + 'px'
                        });
                        $('body').append(thumbnail);
                    });
                    $el.mouseout(function(){
                        thumbnail.hide();
                    });
                    $el.mousemove(function(e){
                        thumbnail
                            .css({
                                top: (e.pageY - 10) + 'px',
                                left: (e.pageX + 30) + 'px'
                            });
                    });
                }else{
                    $button_expand.append(thumbnail);
                }
            }
            $el.after($button_expand);
            $button_expand.click(function(){
                if(obj.type == 'youtube' || obj.type == 'coub' || obj.type == 'vimeo' || obj.type == 'rutube') {
                    Media.getEmbedCode(obj.type, obj.id, function(html) {

                        MediaViewer.openYoutube(html, obj);
                        return false;
                    });
                } else {
                    $button_expand.hide();
                    Media.getEmbedCode(obj.type, obj.id, function(html) {
                        if(!html) return $button_expand.show();
                        var embed = $('<br>' + html + '<br>');

                        $el.after(embed);
                        $el.after($button_hide);

                        $button_hide.click(function() {
                            embed.remove();
                            $button_hide.remove();
                            $button_expand.show();
                            if(Media.unloaders.hasOwnProperty(obj.type)) Media.unloaders[obj.type]($el); //костыль

                            return false;
                        });

                        return false;
                    });
                }

                return false;
            });

            Media.titler.solve($el, obj);
            //костыли костылики для открытия твиттов после загрузки,
            if(obj.type == 'twitter' && CFG.TWITTER_AUTOEXPAND-- > 0) $button_expand.click();
        });
    },

    //целый объект для работы с тайтлами медий
    titler: {
        solvers: {},
        queue: {},
        active_workers: 0,

        solve($href, media) {
            if(!this.solvers[media.type]) return;
            var title = Store.get('_cache.media.' + media.type + '.' + media.id + '.title', false);
            if(title !== false) return this.renderTitle($href, title, media);
            if(this.queue[media.type+media.id]) {
                this.queue[media.type+media.id]['hrefs'].push($href);
            }else{
                this.queue[media.type+media.id] = {media: media, hrefs: [$href]};
                this.prepareNewWorker();
            }
        },

        prepareNewWorker() {
            if(this.active_workers >= Store.get('other.media.titler.max_workers', 2)) return;

            for(var key in this.queue) {
                if(!this.queue.hasOwnProperty(key)) continue;
                if(this.queue[key].active) continue;
                return this.startWorker(key);
            }
        },

        startWorker(queue_key) {
            this.active_workers++;
            this.queue[queue_key].active = true;
            var media = this.queue[queue_key].media;
            var solver = this.solvers[media.type];
            var worker = this;

            solver(media, function(title) {
                worker.active_workers--;
                if(title) {
                    worker.processHrefs(queue_key, title);
                    Store.set('_cache.media.' + media.type + '.' + media.id + '.title', title);
                    Store.set('_cache.media.' + media.type + '.' + media.id + '.created', Math.ceil((+new Date)/1000));
                }
                delete worker.queue[queue_key];
                worker.prepareNewWorker();
            });
        },

        processHrefs(queue_key, title) {
            var hrefs = this.queue[queue_key]['hrefs'];
            for(var i=0;i<hrefs.length;i++) this.renderTitle(hrefs[i], title, this.queue[queue_key].media);
        },

        renderTitle($href, name, media) {
            var meta = Media.meta[media.type];
            if(meta) {
                $href.before(meta.icon);
                $href.html('[' + meta.name + '] ' + name);
            }else{
                $href.html(name);
            }
        }
    }
};

//система избранных тредов
window.Favorites = {
    /* Структура избранных тредов:
     board - строка, название борды, в которой тред
     title - строка, заголовок
     last_post - число, номер последнего поста
     next_check - число, таймстамп, когда нужно проверить тред на новые посты
     last_interval - число, время в минутах, которое надо будет выставиь в next_check и умножить на множитель из конфига
     new_posts - число, количество новых сообщений
     deleted - bool, true если тред удалён. При следующей проверке, если он на самом деле удалён, он будет удалён из списка
     */
    timer: 0,
    current: null,
    busy: false,
    visible: false,
    gevent_num: false,
    gevent: false,

    isFavorited(num) {
        return !!Store.get('favorites.' + num, false);
    },

    //удалить тред из избранного
    remove(num) {
        if(!this.isFavorited(num)) throw new Error('Вызов Favorites.remove(' + num + ') для несуществующего треда');
        Store.del('favorites.' + num);
        if(!this.busy) this.reset();

        this.render_remove(num);
        Gevent.emit('fav.remove', num);
    },

    //добавить тред в избранное
    add(num) {
        if(this.isFavorited(num)) {
            return this.remove(num);
        }
        //if(this.isFavorited(num)) throw new Error('Вызов Favorites.add(' + num + ') для существующего треда');
        var data;
        var isPost;
        var watch = [];
        var post = Post(num);

        if (!post.isThread()) {
            isPost = true;
            watch.push(num);
            num = post.getThread();
            post = Post(num);  //если добавлялся  в избранное пост, то переменную post переставляем на номер треда, в котором этот пост
        }

        if(this.isFavorited(post.getThread())) {
            var current_posts = Store.get('favorites.' + num + '.posts', false);
            if(current_posts) {
                Store.set('favorites.' + num + '.posts', current_posts.concat(watch));
            } else {
                Store.set('favorites.' + num + '.posts', watch);
            }
            return;
        }//проверку на тот же пост не забыть

        var title = post.getTitle();
        var last = post.last().num;
        data = {
            board: CFG.BOARD.NAME,
            title: title,
            last_post: last,
            posts: isPost?watch:false, //
            replies: [], //
            //allreplies: [], //
            last_replies: 0, //
            next_check: Math.floor((+new Date)/1000)+CFG.FAV_MIN,
            last_interval: CFG.FAV_MIN
        };
        console.log(data);

        Store.set('favorites.' + num, data);
        this.render_add(num, data);
        Gevent.emit('fav.add', [num, data]);

        if(!CFG.BOARD.THREADID) this.reset();
    },

    //сбросить текущую цель и выбрать новую (тред для проверки новых постов)
    reset() {
        this.resetCurrent();
        if(this.current) this.timerRestart();

        this.busy = false;
    },
    timerStop() {
        if(!this.timer) return;
        clearTimeout(this.timer);
        this.timer = null;
    },
    timerRestart() {
        this.timerStop();
        var currentMins = Math.floor((+new Date)/1000);
        var delta = this.getCurrent().next_check-currentMins;
        var ms;
        var that = this;

        if(delta < 1) {
            ms = 1;
        }else{
            ms = delta*1000;
        }

        this.timer = setTimeout(function(){
            that.preExecuteCheck();
        }, ms);
    },
    getCurrent() {
        return Store.get('favorites.' + this.current, false);
    },

    //функция выбора цели для проерки новых постов
    resetCurrent() {
        this.current = null;
        var favlist = Store.get('favorites', {});
        var del_behavior = Store.get('favorites.deleted_behavior', 2);

        for(var key in favlist) {
            if(!favlist.hasOwnProperty(key)) continue;
            if(key == CFG.BOARD.THREADID) continue;
            if(!favlist[key].hasOwnProperty('next_check')) continue;
            if(this.isLocked(key)) continue;
            if(!this.current || favlist[this.current].next_check > favlist[key].next_check) {
                if(favlist[key].deleted && del_behavior == 0) continue;
                this.current = key;
            }
        }
    },

    //костыль для того, чтоб опросить другие вкладки о треде
    preExecuteCheck() {
        var that = this;
        this.busy = true;

        this.render_refreshing(this.current);

        Gevent.onceNtemp('fav.abortExec' + this.current, 1000, function(){
            that.setNextCheck(that.current, CFG.FAV_LOCK);
            that.render_refreshing_done(that.current);
            that.reset();
        }, function() {
            that.executeCheck();
        });

        Gevent.emit('fav.preExecuteCheck', this.current);
    },

    //выполнить проверку новых постов
    executeCheck() {
        var old_current = this.getCurrent().next_check;
        var old_current_num = this.current;
        Store.reload();
        if(this.isLocked() || old_current != this.getCurrent().next_check){
            this.render_refreshing_done(old_current_num);
            return this.reset();
        }

        this.lock();

        var current = this.getCurrent();
        var fetch_opts = {
            thread: this.current,
            from_post: current.last_post+1,
            board: current.board,
        };
        var that = this;
        var myposts = Store.get('myposts');
        var postsArr = [];
        if ( myposts ) {
            postsArr = myposts[current.board] ? myposts[current.board][this.current] : [] ;
        }

        Post(1).fetchPosts(fetch_opts, function(res) {
            if(res.hasOwnProperty('error')) {
                if(res.error == 'server' && res.errorCode == -404) {
                    that.deleted(that.current);
                }else{
                    that.setNextCheck(that.current, CFG.FAV_RETRY);
                }
            }else if(res.data.length) {
                that.setNewPosts(res.data.length);
                that.setLastPost(res.data);
                that.setNextCheck(that.current, CFG.FAV_MIN);

                if ( postsArr && postsArr.length) {
                    var replies = [];
                    try {
                        for(var i = 0; i < postsArr.length; i++ ) {
                            if ( Post(postsArr[i]).exists() ) {
                                replies.push.apply(replies, Post(postsArr[i]).getReplies());
                            }
                        }
                    }
                    catch(err) {
                        console.log(err)
                    }
                    if(replies.length > 0) that.setReplies(that.current, replies);
                }

                //if(Store.get('favorites.show_on_new', true)) that.show();
                if(Store.get('styling.favorites.minimized', true)) that.newItems();
            }else {
                //that.setNextCheck(that.current, current.last_interval * CFG.FAV_MULTIPLIER);
                let next_check = current.last_interval * CFG.FAV_MULTIPLIER;
                // фикс последствий бага, повредившего избранное куче людей 11.09.2021
                // если последний пост в избранном выше текущего в треде, то сбросить его
                // либо это багованный пост из архива, либо последний пост удалили (что не страшно)
                if(current.last_post > res.last_post) {
                    Store.set('favorites.' + that.current + '.last_post', res.last_post);
                    next_check = 1; // Проверим через минуту
                }
                that.setNextCheck(that.current, next_check);
            }

            that.unlock();
            that.render_refreshing_done(that.current);
            return that.reset();
        });

    },
    setReplies(num, replies) {
        var current = this.getCurrent();
        //var newprelies = $.unique(current.replies.concat(replies));
        replies = replies.filter(function (element, index, array) {
            return (element > current.last_seen);
        })
        //replies.push.apply(current.replies, replies);
        Store.set('favorites.' + num + '.replies', replies); //unique потому что до обновление страницы реплаи добавляются, и может получиться дублирование

        this.setLastReplies(num, replies.length);

        this.render_newreplies(this.current, replies.length);

        Gevent.emit('fav.newreplies', [this.current, replies.length]);
    },
    setNextCheck(num, mins) {
        var thread = Store.get('favorites.' + num);

        if(mins < CFG.FAV_MIN) mins = CFG.FAV_MIN;
        if(mins > CFG.FAV_MAX) mins = CFG.FAV_MAX;

        thread.next_check = Math.floor((+new Date)/1000)+mins;
        thread.last_interval = mins;

        Store.set('favorites.' + num + '.next_check', thread.next_check);
        Store.set('favorites.' + num + '.last_interval', thread.last_interval);
    },
    forceRefresh(num) {
        Store.set('favorites.' + num + '.next_check', 0);
        Store.set('favorites.' + num + '.last_interval', CFG.FAV_MIN);
        if(!this.busy) this.reset();
    },
    deleted(num) {
        if(!this.isFavorited(num)) return; // удалять уже нечего
        //favorites.deleted_behavior int 0-не удалять, 1-удалять сразу, 2-проверять перед удалением
        var behavior = Store.get('favorites.deleted_behavior', 2);
        var path = 'favorites.' + num + '.deleted';

        if(behavior == 1) return this.remove(num);
        if(behavior == 2 && Store.get(path, false)) return this.remove(num);

        Store.set(path, true);
        this.resetNewPosts(num);
        this.render_deleted(num);
        this.setNextCheck(num, CFG.FAV_DEL_RECHECK);

        Gevent.emit('fav.deleted', num);
    },
    setLastPost(arr, num) {
        if(!num) num = this.current;
        var last = 0;
        var len = arr.length;
        for(var i=0;i<len;i++) {
            if(arr[i]['num'] > last) last = arr[i]['num'];
        }
        if(!last) return;

        Store.set('favorites.' + num + '.last_post', parseInt(last));
    },
    setLastReplies(num, repliesnum) {
        Store.set('favorites.' + num + '.last_replies', repliesnum);
    },
    setLastSeenPost(thread, last) {
        if(!last) return Store.del('favorites.' + thread + '.last_seen');
        Store.set('favorites.' + thread + '.last_seen', last);
    },
    setNewPosts(count) {
        var current = this.getCurrent();
        var was = current.new_posts||0;
        current.new_posts = was+count;

        Store.set('favorites.' + this.current + '.new_posts', current.new_posts);

        if(!was) this.setLastSeenPost(this.current, current.last_post);
        this.render_newposts(this.current, current.new_posts);
        Gevent.emit('fav.newposts', [this.current, current.new_posts]);
    },
    //сброс кол-ва новых псто
    resetNewPosts(num) {
        if(!this.isFavorited(num)) return;
        Store.set('favorites.' + num + '.new_posts', 0);
        //if(!this.busy) this.reset();

        this.setLastSeenPost(this.current, 0);
        this.render_reset_newposts(num);
        Gevent.emit('fav.reset_newposts', num);
    },
    //сброс кол-ва новых ответов
    resetNewReplies(num) {
        if(!this.isFavorited(num)) return;
        Store.set('favorites.' + num + '.replies', []);
        Store.set('favorites.' + num + '.last_replies', 0);

        //if(!this.busy) this.reset();

        this.render_reset_newreplies(num);
        Gevent.emit('fav.reset_newreplies', num);
    },
    lock(num) {
        if(!num) num = this.current;
        var lock_time = Math.floor((+new Date)/1000)+CFG.FAV_LOCK;

        Store.set('favorites.' + num + '.lock', lock_time);
    },
    unlock(num) {
        if(!num) num = this.current;

        Store.del('favorites.' + num + '.lock');
    },
    isLocked(num) {
        if(!num) num = this.current;
        var max_lock_time = Math.floor((+new Date)/1000);
        var current_lock = Store.get('favorites.' + num + '.lock', 0);

        return current_lock > max_lock_time;
    },
    show() {
        MBottomBox.toggle(true); //todo возможно выпилить лишнюю прослойку
    },
    newItems() {
        MBottomBox.newFav(true);
    },
    debug() {
        var favlist = Store.get('favorites', {});

        for(var key in favlist) {
            console.log(key + ':' + Math.round(favlist[key].next_check-((+new Date)/1000)) + 's');
        }
    },
    renderAllItems() {
        var favorites = Store.get("favorites");
        var $fav_body = $('#favorites-table');
        for(var key in favorites) {
            if(!favorites.hasOwnProperty(key)) continue;
            var thread = favorites[key];
            if(typeof(thread) != 'object' || !thread.hasOwnProperty('last_post')) continue;
            var thread_row = Favorites.render_get_html(key, thread);

            $fav_body.append(thread_row);
        }
    },
    render_get_html(num, thread) {
        var thread_row = '<div id="fav-row' + num + '" class="bb__row">';
        //добавочно класс fav-row-deleted если тред удалён
        //добавочно класс fav-row-updated если есть новые посты
        //todo иконки ниже переделать классы
        thread_row += '<svg xmlns="http://www.w3.org/2000/svg" data-num="' + num + '" class="icon fav__fa fav__fa_type_remove"><use xlink:href="#icon__delete"></use></svg>';
        thread_row += '<svg xmlns="http://www.w3.org/2000/svg" data-num="' + num + '" class="icon fav__fa fav__fa_type_update" id="fav-row-update' + num + '"><use xlink:href="#icon__update"></use></svg>';
        if(thread.new_posts) {
            thread_row += '<span class="fav__new" id="fav-row-newposts' + num + '">' + thread.new_posts + '</span>';
        } else {
            thread_row += '<span class="fav__new" id="fav-row-newposts' + num + '"></span>';
        }
        if(typeof thread.posts != "undefined" && typeof thread.replies != "undefined" && thread.replies.length > 0 ) { //thread.last_replies
            thread_row += '<span class="fav__new" id="fav-row-newreplies' + num + '">' + thread.replies.length  + '</span>';
        } else {
            thread_row += '<span class="fav__new" id="fav-row-newreplies' + num + '"></span>';
        }
        thread_row += '<a href="/' + thread.board + '/res/' + num + '.html#' + (thread.last_seen||thread.last_post) + '" id="fav-row-href' + num + '" class="fav__title' + (thread.new_posts?' fav__title_type_updated':'') + (thread.deleted?' fav__title_type_deleted':'') + '">';
        thread_row += '<span>/' + thread.board + '/</span>';
        thread_row += '<span>' + num + '</span>';
        thread_row += '<span> - </span>';
        thread_row += '<span>' + (thread.title||'<i>Без названия</i>') + '</span>';
        thread_row += '</a>';
        thread_row += '</div>';

        return thread_row;
    },
    render_remove(num) {
        $('#fav-row' + num).remove();
        this.render_switch(num, false);
    },
    render_add(num, data) {
        var html = this.render_get_html(num, data);
        $('#favorites-table').append(html);
        this.render_switch(num, true);
        this.show();
    },
    render_switch(num, favorited) {
        var $star = $('#fa-star' + num);
        if(favorited) {
            $star.addClass('icon_type_active');
            $('#postbtn-favorite-bottom').html('Отписаться');
        }else{
            $star.removeClass('icon_type_active');
            $('#postbtn-favorite-bottom').html('Подписаться');
        }
    },
    render_refreshing(num) {
        $(`#fav-row-update${num}`).addClass('icon_type_spin');
        // _.id('fav-row-update' + num).classList.add('icon_type_spin');
    },
    render_refreshing_done(num) {
        $(`#fav-row-update${num}`).removeClass('icon_type_spin');
        // _.id('fav-row-update' + num).classList.remove('icon_type_spin');
    },
    render_newposts(num, posts) {
        $('#fav-row-href' + num).addClass('fav__title_type_updated');
        $('#fav-row-newposts' + num).html(posts);
    },
    render_reset_newposts(num) {
        $('#fav-row-href' + num).removeClass('fav__title_type_updated');
        $('#fav-row-newposts' + num).html('');
    },
    render_newreplies(num, repliesnum) {
        $('#fav-row-href' + num).addClass('fav__title_type_updated');
        $('#fav-row-newreplies' + num).html(repliesnum);
    },
    render_reset_newreplies(num) {
        //$('#fav-row-href' + num).removeClass('fav-row-updated'); -- это закоменчено, так как при отсутствии новых реплаев снимало "жирный" текст при наличии новых ответов во время обновления авто/руками
        $('#fav-row-newreplies' + num).html('');
    },
    render_deleted(num) {
        $('#fav-row-href' + num).addClass('fav__title_type_deleted');
    },
    init() {
        var current_favorited = CFG.BOARD.THREADID&&this.isFavorited(CFG.BOARD.THREADID);
        if(current_favorited) {
            //this.mark_replies_in_thread(CFG.BOARD.THREADID);
            this.resetNewPosts(CFG.BOARD.THREADID);
            this.resetNewReplies(CFG.BOARD.THREADID);
            Gevent.on('fav.preExecuteCheck', function(num){
                if(num == CFG.BOARD.THREADID) Gevent.emit('fav.abortExec' + CFG.BOARD.THREADID);
            });
        }

        var that = this;
        var $threads = $('.thread');
        for (var i = 0; i < $threads.length; i++) { //todo check var i vezde
            var num = $threads[i].id.substr(7);
            if(Favorites.isFavorited(num)) that.render_switch(num, true);
        }
        this.renderAllItems();
        if(!_.isArch()) this.reset();
    },
};

//система настроек
window.Settings = {
    categories: [],
    settings: {},
    editors: {},
    visible: false,
    _editor_onsave: null,

    //перерендерить окно настроек
    reload() {
        var that = this;
        var $body = $('#settings-body');
        $body.html('');

        this.renderCategories($body, function(cat, cat_body){
            that.renderSettings(cat, cat_body);
        });
    },

    //добавить новую категорию в настройки
    //id - строка с системным именем
    //name - строка с именем для отображения
    addCategory(id, name) {
        this.categories.push([id, name]);
        this.settings[id] = {};
    },

    //добавить новую настройку в категорию
    //category - строка с системным именем категории
    //path - адрес в Store для настройки
    //obj - объект настройки, смотри как оно работат на практике
    addSetting(category, path, obj) {
        this.settings[category][path] = obj;
    },
    getSetting(category, path) {
        return this.settings[category][path];
    },

    //добавить редактор настройки (например textarea для CSS или система для правил скрытия постов)
    addEditor(name, showcb, savecb) {
        this.editors[name] = [showcb, savecb];
    },

    //legend
    //settings-category-name - preferences

    renderCategories(body, cb) {
        var that = this;
        for(var i=0;i<this.categories.length;i++) (function(i){
            var cat = that.categories[i];

            var $btn_expand = $('<span>+ </span>');
            var $btn_contract = $('<span style="display: none">- </span>');
            var $cat_label = $('<div class="settings__header">' + cat[1] + '</div>');
            var $cat_body = $('<div class="settings__prefs" id="settings-category' + cat[0] + '" style="display: none"></div>');

            $cat_label.prepend($btn_contract);
            $cat_label.prepend($btn_expand);

            var $wrapper = $('<div></div>')
            $wrapper.append($cat_label);
            $wrapper.append($cat_body);
            body.append($wrapper);

            $cat_label.click(function(){
                $cat_body.toggle();
                $btn_contract.toggle();
                $btn_expand.toggle();
            });

            cb(cat[0], $cat_body);
        })(i);
    },
    renderSettings(cat_id, cat_el) {
        for(var key in this.settings[cat_id]) {
            if(!this.settings[cat_id].hasOwnProperty(key)) continue;
            var setting = this.settings[cat_id][key];

            var $setting_row = $('<div class="settings__row"></div>');
            var $setting_label = $('<span class="settings__label"><label>' + setting.label + '</label></span>');

            if(setting.multi) {
                var select_box = $('<select class="settings__multibox mselect"></select>');
                select_box.data('path', key);
                select_box.data('category', cat_id);

                for(var i=0;i<setting.values.length;i++) {
                    select_box.append('<option value="' + setting.values[i][0] + '">' + setting.values[i][1] + '</option>');
                }

                select_box.val(Store.get(key, setting.default));

                $setting_label.append(select_box);
                $setting_row.append($setting_label);
                cat_el.append($setting_row);
            }else{
                var checkbox = $('<input type="checkbox" class="settings__checkbox"/>');
                checkbox.data('path', key);
                checkbox.data('category', cat_id);
                checkbox.prop("checked", !!Store.get(key, setting.default));

                $setting_label.prepend(checkbox);
                $setting_row.append($setting_label);
                cat_el.append($setting_row);
            }


            //////////////////// editor ////////////////
            if(setting.hasOwnProperty('edit')) (function(that, setting){
                var edit = setting.edit;
                var $edit_btn = $('<span class="settings__edit a-link-emulator" title="' + edit.label + '"></span>');

                $edit_btn.click(function() {
                    if(!that.editors.hasOwnProperty(edit.editor)) return false;
                    that._editor_onsave = Settings.editors[edit.editor][1];
                    that._editor_show = Settings.editors[edit.editor][0];
                    that._editor_path = edit.path;
                    that._editor_default_val = edit.default;

                    var val = Store.get(edit.path, edit.default);
                    $('#settings-btn-save').click();

                    if(edit.hasOwnProperty('importable')) {
                        $('#setting-editor-btn-export').show();
                        $('#setting-editor-btn-import').show();
                    }else{
                        $('#setting-editor-btn-export').hide();
                        $('#setting-editor-btn-import').hide();
                    }

                    if(edit.hasOwnProperty('saveable')) {
                        $('#setting-editor-btn-save').show();
                    }else{
                        $('#setting-editor-btn-save').hide();
                    }

                    $('#setting-editor-title').html(edit.title);
                    $('#setting-editor-body').html('');

                    $('#setting-editor-window').show();

                    that.editors[edit.editor][0](val, edit.path, edit.default);

                    return false;
                });

                $setting_row.append($edit_btn);
            })(this, setting);
            ////////////////////////////////////////////////
        }
    },

    toggle() {
        if(this.visible) {
            this.hide();
        }else{
            this.show();
        }
    },
    show() {
        this.reload();
        $('#settings-window').show();
        this.visible = true;
    },
    hide() {
        $('#settings-window').hide();
        this.visible = false;
    }
};

//самая забагованная херовина
//велосипед передачи сообщений между вкладками
window.Gevent = {
    last_id: 1,
    listeners: {},
    expire_time: 1000, //сколько ms считать событие валидным

    init() {
        if(typeof(localStorage) == 'undefined') return; //todo cookie
        if(!localStorage.gevent_last || !localStorage.gevents) {
            localStorage.gevents = "[]";
            localStorage.gevent_last = 1;
            return;
        }
        this.last_id = localStorage.gevent_last;

        this._deleteExpired();

        var that = this;
        window.addEventListener('storage', function(e){
            if(e.key != 'gevent_last') return;
            if(e.newValue <= that.last_id) return;

            that._changed(localStorage.gevent_last, localStorage.gevents);
        }, false);
    },

    _deleteExpired() {
        try { //удаляем протухшие эвенты
            var events = JSON.parse(localStorage.gevents);
            var initial_len = events.length;
            var random_delta = (Math.random()*(10*this.expire_time)+(10*this.expire_time)); //рандомное время чтоб 15 вкладок не схватили

            for(var i=0;i<events.length;i++) {
                var event = events[i];
                var etime = event[1];
                if(((+new Date)-etime) > random_delta) {
                    events.splice(i,1);
                    i--;
                }
            }

            if(initial_len != events.length) localStorage.gevents = JSON.stringify(events);
        }catch(e){}
    },

    on(name, callback) {
        if(!this.listeners.hasOwnProperty(name)) this.listeners[name] = [];
        this.listeners[name].push(callback);

        return callback;
    },

    off(name, callback) {
        if(!callback) throw new Error('Gevent.off no callback passed');
        if(!this.listeners.hasOwnProperty(name)) return false;
        var index = this.listeners[name].indexOf(callback);
        if(index < 0) return false;
        this.listeners[name].splice(index,1);

        return true;
    },

    once(name, callback) {
        var that = this;
        var proxycb = function(msg){
            that.off(name, proxycb);
            callback(msg);
        };
        this.on(name, proxycb);

        return proxycb;
    },

    onceNtemp(name, time, callback, timeout_callback) {
        var that = this;

        var proxy_cb;
        var timeout_timer = setTimeout(function(){
            that.off(name, proxy_cb);
            if(timeout_callback) timeout_callback();
        }, time);

        proxy_cb = this.once(name, function(msg) {
            clearTimeout(timeout_timer);
            callback(msg);
        });

        return proxy_cb;
    },

    emit(name, msg) {
        if(typeof(localStorage) == 'undefined') return; //todo cookie
        if(!msg) msg = "";
        this.last_id++;
        var events = JSON.parse(localStorage.gevents);
        events.push([this.last_id, (+new Date), name, msg]);
        //console.log('emit Gevent: ' +  this.last_id + ', ' + (+new Date) + ', ' + name + ', ' + msg); //todo -debug

        localStorage.gevents = JSON.stringify(events);
        localStorage.gevent_last = this.last_id;

        this._watchExpire(this.last_id);
    },

    _watchExpire(id) { //убираем за собой. Что не успеем убрать, уберёт init
        var that = this;
        setTimeout(function(){
            that._removeExpired(id);
        }, this.expire_time);
    },

    _removeExpired(id) {
        var events = JSON.parse(localStorage.gevents);
        var old_len = events.length;

        for(var i=0;i<events.length;i++) {
            var event = events[i];
            var eid = event[0];
            if(eid == id) {
                events.splice(i,1);
            }
        }
        if(events.length == old_len) return; //не нашли

        localStorage.gevents = JSON.stringify(events);
    },

    _changed(gevent_last, json) {
        if(gevent_last == this.last_id) return;
        var events = JSON.parse(json);
        events.sort(function(a,b){
            return a.id-b.id;
        });

        for(var i=0;i<events.length;i++) {
            var event = events[i];
            var eid = event[0];
            var etime = event[1];
            if(eid <= this.last_id) continue;
            if((+new Date)-etime > this.expire_time) continue;

            this._handleEvent.apply(this, event);
        }
    },

    _handleEvent(id, time, name, msg) {
        this.last_id = id;
        if(!this.listeners.hasOwnProperty(name)) return;
        var list = this.listeners[name];

        //console.log('recv Gevent: ' + id + ', ' + time + ', ' + name + ', ' + msg); //todo -debug

        //фикс неприятной штуки с удалением .once из массива, над которым работает for
        var list_copy = [];
        for(var i=0;i<list.length;i++) list_copy.push(list[i]);

        for(var j=0;j<list_copy.length;j++) list_copy[j](msg);
    }
};

//сердце макабы
//система работы с постами
(function(){
    var posts = {};
    //thread        - number, ID треда, в котором находится пост
    //threadPosts   - array, массив номеров постов в треде
    //repliesTo     - array, массив номеров постов, на которые отвечает пост
    //replies       - array, массив номеров постов, которые отвечают на пост
    //rendered      - bool, true, если пост есть на странице
    //ajax          - object, если поста нет на странице, а мы его получили по ajax, то тут будет объект из JSON
    //notfound      - bool, true, если мы запрашивали тред, а пост там не нашли, о котором знали из какого-то источника (ответ на пост?)
    //el            - object, элемент поста jquery. Создаётся и возвращается el() для кэширования
    //preloaded     - number, последний загруженный (не isGhost) num поста
    //downloadCallbacks - array, массив коллбеков, вызываемых после загрузки. Присутствие этого свойства, означает, что тред в процессе загрузки
    //cache         - object, объект кэшированных icon,email,name,trip,subject,comment (если отрендерен и нет ajax)

    var PostQuery = function(num) {
        this.num = parseInt(num);

        return this;
    };

    let prev = null;

    PostQuery.prototype = {

        //записать тред за постом и отметить, если он отрендерен на странице
        setThread(num, rendered) {
            num = parseInt(num);
            if(!posts.hasOwnProperty(this.num)) posts[this.num] = {}; //создается объект поста, если его не было, для первого поста в треде это пост-тред
            var post = posts[this.num];
            var thread = posts[num];

            if(CFG.BOARD.THREADID && num == CFG.BOARD.THREADID && (!thread.preloaded || this.num > thread.preloaded)) thread.preloaded = this.num;

            if(post.thread) return this;
            post.thread = num;

            if(!posts.hasOwnProperty(post.thread)) Post(post.thread).setThread(post.thread); //если какой-то пост в треде ссылается на пост из другого треда, о котором мы ничего не знаем
            if(!posts[post.thread].hasOwnProperty('threadPosts')) posts[post.thread].threadPosts = [];
            ////////////////////// сортируем новый пост, ибо кто-то ленивый не может это сделать в сервере и по JSONу они приходят вразброс
            var sorted = posts[post.thread].threadPosts;
            var slen = sorted.length;
            var min = sorted[0];
            var max = sorted[slen-1];

            if(!slen || this.num <= min) {
                sorted.unshift(this.num);
            } else if(this.num >= max) {
                sorted.push(this.num);
            } else {
                for(var i=1;i<slen;i++) {
                    if(this.num < sorted[i]) {
                        sorted.splice(i, 0, this.num);
                        break;
                    }
                }
            }
            //////////////////////

            return this;
        },
        getThread() {
            var post = posts[this.num];
            return post.thread;
        },
        isThread() {
            var post = posts[this.num];
            return this.num == post.thread;
        },
        threadPosts() {
            var post = posts[this.num];

            return posts[post.thread].threadPosts;
        },
        last() {
            var posts = this.threadPosts();
            this.num = posts[posts.length-1];

            return this;
        },
        exists() { //не забудь про isGhost()
            return posts.hasOwnProperty(this.num);
        },
        //генерациия превью поста
        previewHTML() {
            var num = this.num;
            var post = posts[num];
            var html;

            if(post.notfound){
                html = 'Пост не найден';
            } else {
                html = PostF._generatePostBody(post.ajax);
            }

            return html;
        },
        fetchPosts(param, callback, attempt = 1) {
            //@param
            //from
            //thread
            //board
            //update
            //page
            var board;
            var thread;
            var from_post;
            var post;
            //var render = false;
            var page = -1;
            var that = this;

            // Защита от двойного вызова коллбека
            let completed = false;
            let complete = (obj) => {
                if(completed) return;
                completed = obj;
                clearTimeout(timeoutTimer);
                callback(obj);
            };
            // Защита от зависания запроса
            let timeoutTimer = setTimeout(() => {
                if(completed) return;
                return complete({error:'server', errorText: 'Таймаут ответа', errorCode: -2});
            }, CFG.GETJSON_TIMEOUT+1000);

            if(param['update']) {
                post = posts[this.num];
                var _thread = posts[post.thread];
                from_post = _thread.preloaded ? _thread.preloaded+1 : post.thread;
                thread = post.thread;
                board = CFG.BOARD.NAME;
            }else if (param['page']) {
                page = param['page'];
                board = param['board'];
                //render = true;
            } else {
                from_post = param['from_post'];
                thread = param['thread'];
                board = param['board'];
                //render = true;
            }
            var onsuccess = function( data ) {
                if(completed) return;
                if(data.hasOwnProperty('Error')) return complete({error:'server', errorText:'API ' + data.Error + '(' + data.Code + ')', errorCode:data.Code});
                var posts = [];
                try {
                    var parsed = JSON.parse(data);

                    let last_post = 0;

                    if(page == -1) {
                        //console.log('post ' + post + ', from_post ' + from_post + ', thread '+ thread )
                        var all_posts = parsed['threads'][0]['posts'];
                        //записываем текущие посты из памяти
                        var known_posts = [];
                        //если его нет в памяти, то игнорируем иначе сломаем избранное
                        if(Post(thread).exists()) {
                            known_posts = Post(thread).threadPosts().filter(function(post_id){
                                return !Post(post_id).isNotFound();
                            });
                        }
                        for(var i=0; i < all_posts.length; i++) {
                            var post = all_posts[i];
							
							var cachedPost = false;
							
							try {
								cachedPost = Post(post.num).getJSON()
							} catch(e){};
							
							if(!cachedPost || post.lasttouch > cachedPost.lasttouch) {
								if(cachedPost) {
									Post(post.num).setJSON(post);
								}
                                
                                var menuhtml = '';
                                
                                if(post.menu.length > 0) {
                                    menuhtml += '<br>';
                                    
                                    for(var index = 0; index < post.menu.length; index++) {
                                        var section = post.menu[index];
                                        
                                        menuhtml += '<br><strong>' + escapeHTML(section.sectionName) + '</strong><br><div class="thread-menu-block">';
                                        
                                        for(var index2 = 0; index2 < section.links.length; index2++) {
                                            var link = section.links[index2];
                                            
                                            menuhtml += ' <div class="thread-menu-cell"><a href="' + escapeHTML(link.url) + '" class="reply to-button"><span>' + escapeHTML(link.label) + '</span></a></div>';
                                        }
                                        
                                        menuhtml += '</div>';
                                    }
                                }
								
								$('#m' + post.num + ' .comment-data').html(post.comment + menuhtml);
								
								if(CFG.BOARD.LIKES) {
									$('#like-count' + post.num).html(post.likes);
									$('#dislike-count' + post.num).html(post.dislikes);
								}
				
								if(CFG.BOARD.REACTIONS) {
									var reactionshtml = '';
									reactionshtml += '<div class="post__reactions_wrapper' + (post.reactions_count > 0 ? ' has_reactions' : '') + '" id="reactions-' + post.num + '" data-num="' + post.num + '">';
									
                                    if(post.reactions !== null) {
                                        for(index = 0; index < post.reactions.length; index++) {
                                            if(post.reactions[index].count > 0) {
                                                reactionshtml += '<div class="post__reactions_button' + (post.reactions[index].count > 0 ? ' has_reactions' : '') + '" onclick="doReactPost(this, \'' + post.reactions[index].icon + '\', event);">';
                                                reactionshtml += '<img src="/static/img/reactions/' + post.reactions[index].icon + '?v=8">';
                                                reactionshtml += '<span>' + post.reactions[index].count + '</span>';
                                                reactionshtml += '</div>';
                                            }
                                        }
									}
									
									reactionshtml += '</div>';
									
									$('#reactions-' + post.num).replaceWith(reactionshtml);
				
									var floatingreactionshtml = '';
									floatingreactionshtml += '<div class="post__floating_reactions_wrapper" id="reactions-floating-' + post.num + '" data-num="' + post.num + '"></div>';
									
									$('#reactions-floating-' + post.num).replaceWith(floatingreactionshtml);
								}
								
								if(post.enable_poll == 1) {
									for(vote = 0; vote < post.answers.length; vote ++) {
										$('#poll-' + post.num + '-vote-' + vote + '-bar').css({width: post.poll_results_percent[vote] + '%'});
										$('#poll-' + post.num + '-vote-' + vote + '-percent').html(post.poll_results_percent[vote] + '% (' + post.poll_results_exact[vote] + ')');
									}
									
									$('#poll-total-' + post.num).html(post.total_poll_votes);
								}
							}
							
							var $links = $('.post__message').find('a').not('.post-reply-link');
							Media.processLinks($links);
							
                            if(post.num >= from_post) posts.push(post);
                            if(post.num > last_post) last_post = post.num;

                            //удаляем посты из копии памяти, которые пришли с сервера
                            //если что-то осталось, значит на сервере его уже нет, значит его удалили
                            var all_posts_pos = known_posts.indexOf(post.num);
                            if(all_posts_pos > -1) known_posts.splice(all_posts_pos, 1);
                        }
                        //удаляем посты, которые были в памяти, но в новом JSON их уже нет
                        for(i=0; i < known_posts.length; i++) {
                            Post(known_posts[i])._notFound();
                        }

                        //заполняем карту
                        //c тпмпост мы создает отдельные экземляр поста который перебираем, изначальный пост this с номером не меняется.
                        //а меняя that используем изначальный экземпляр, так удобнее, нужно держать в голове что при переборе итоговый num у Post изменится на номер последнего поста в треде
                        //var tmpost = Post(1);

                        for(var i = 0; i < posts.length; i++) {
                            that.num = posts[i].num;
                            that.setThread(thread).setJSON(posts[i]);
                            //console.log(posts[i]);
                        }
                        complete({updated: posts.length, data:posts, favorites: all_posts[0]['favorites'], deleted: known_posts, last_post});
                    } else {
                        //var tmpost = Post(1);
                        let data = parsed['threads'] || [];
                        for(var i = 0; i < data.length; i++) {
                            var cur = data[i].posts;
                            thread = parseInt(data[i].thread_num);
                            for(var j = 0; j < cur.length; j++) {
                                that.num = parseInt(cur[j].num);
                                that.setThread(thread).setJSON(cur[j]);
                            }
                        }

                        if(!parsed) return complete({fail_to_fetch: true});
                        if(!parsed.threads || !parsed.threads.length) return complete({no_more_threads: true});
                        complete(parsed.threads);
                    }

                }catch(e){
                    console.log(e + e.stack);
                    return complete({error:'server', errorText: 'Ошибка парсинга ответа сервера', errorCode: -1});
                }
                //
                //if(param.update) that._findRemovedPosts();
            };

            var onerror = function(jqXHR, textStatus) {
                if(completed) return;
                clearTimeout(timeoutTimer);
                attempt++;
                // Защита от случайного 404 чтоб не помечать тред удалённым сразу, а пару раз перепроверить
                if(attempt <= CFG.GETJSON_ATTEMPTS) {
                    setTimeout(() => {
                        console.log(`Re-trying fetchPosts() attempt ${attempt}/${CFG.GETJSON_ATTEMPTS}` +
                            ` due to error. jqXHR.status=${jqXHR.status}, textStatus=${textStatus}`);
                        that.fetchPosts(param, complete, attempt);
                    }, CFG.GETJSON_INTERVAL);
                }else{
                    if(jqXHR.status == 404) return complete({error:'server', errorText: 'Тред не найден', errorCode: -404});
                    if(jqXHR.status == 0) return complete({error:'server', errorText: 'Браузер отменил запрос (' + textStatus + ')', errorCode: 0});
                    complete({error:'http', errorText:textStatus, errorCode: jqXHR.status});
                }
            };

            $.ajax(page == -1 ? _.threadJson(board, thread) : _.pageJson(board, page), {
                dataType: 'html',
                timeout: CFG.GETJSON_TIMEOUT,
                success: onsuccess,
                error: (a, b) => { try { onerror(a, b) } catch(e) { console.log(e+e.stack); complete({error:'client', errorText: 'Обшибка ajax.error', errorCode: -3}) } }
            });

            return this;
        },

        //если на пост из не загруженного треда кто-то ссылался и мы знали о посте только тред и номер
        //потом мы загрузили JSON треда и проверяем нашли ли мы там посты, о которых мы знали только их номер
        //если не нашли, значит таких постов уже нет в треде
        _findRemovedPosts() {
            var post = posts[this.num];
            var thread = posts[post.thread];
            if(!thread.preloaded) throw new Error('_findRemovedPosts вызван для !preloaded треда. Ошибка выше в коде'); //@todo такого быть уже не может, прелоадед есть изначально даже не для ренереных постов в треде

            var tmp = Post(1);
            $.each( thread.threadPosts, function( key, val ) { //все не найденные отмечаем в notfound
                tmp.num = val; //создавать новый Post в 13 раз медленнее
                if(tmp.isGhost()) tmp._notFound();
            });
        },

        //true, если мы загрузили JSON этого треда
        isAjax() {
            var post = posts[this.num];

            return post.hasOwnProperty('ajax');
        },

        //true, если тред отрендерен на странице
        isRendered() {
            var post = posts[this.num];

            return !!post.rendered;
        },

        //true, если мы ничего про номера треда и номера поста не знаем о посте
        isGhost() {
            var post = posts[this.num];

            return !post.hasOwnProperty('ajax') && !post.rendered && !post.notfound;
        },

        //true, если мы загрузили тред, а этого поста там нет
        isNotFound() {
            var post = posts[this.num];

            return post.notfound;
        },

        //выставить notfound
        _notFound() {
            var post = posts[this.num];

            post.notfound = true;

            return this;
        },

        //записать JSON и отметить, что тред отрендерен, если он отрендерен (при раскрытии треда с главной например)
        setJSON(obj) {
            var post = posts[this.num];
            post.ajax = obj;
            //MediaObject generation?

            this._processRepliesHTML(obj.comment);
            const m = [];
            if(obj.files) {
                for (let i = 0; i < obj.files.length; i++) {
                    let mo = new MediaObject(obj.files[i], this.num, prev)
                    m.push(mo)
                    MEDIABYID.set(`img-${this.num}-${mo.hash?mo.hash:mo.sticker}`, mo); //можно убрать ${this.num} ?
                    prev = mo;
                }
            }
            MEDIA.set(this.num, m);

            return this;
        },
        getJSON() {
            var post = posts[this.num];

            if(!post.hasOwnProperty('ajax')) return false;

            return post.ajax;
        },
        //штука для разбора какой пост кому отвечает и кто на кого ссылается для сырого HTML (который хранится в JSON)
        //отслеживает все известные данные по всем тредам. Запоминает ответы из одного треда в другой
        _processRepliesHTML(html) {
            //var tmp = Post(1);
            //console.log('precesspreliesHtml' + this.num)
            //console.time('pogchamp');
            if(html.indexOf('class="post-reply-link"') >= 0) {
                var match = html.match(/class="post-reply-link" data-thread="([0-9]*)" data-num="([0-9]*)"/g);
                var that = this;

                for (var i = match.length - 1; i >= 0; i--) {
                    var replyMatch = match[i].match(/class="post-reply-link" data-thread="([0-9]*)" data-num="([0-9]*)"/);
                    if(replyMatch && replyMatch.hasOwnProperty('2')) {
                        var thread_num = parseInt(replyMatch[1]);
                        var num = parseInt(replyMatch[2]);
                        var parent = that.getThread();
                        that.addReplyTo(num);
                        //console.log(that.num + ' addReplyTo ' + num);
                        var tmpnum = that.num;
                        that.num = num;
                        //console.log(that.num + ' addReply ' + tmpnum);
                        //that.setThread(thread_num).addReply(tmpnum);
                        if(!posts[that.num]) {
                            that.setThread(thread_num).addReply(tmpnum);
                            that.num = tmpnum;
                            continue;
                        }
                        //if(!posts[that.num] && thread_num == parent) continue;
                        that.addReply(tmpnum);
                        that.num = tmpnum;
                    }
                }
            }
            //console.timeEnd('pogchamp');
        },
        //записать в память ответ из текущего поста в какой-то
        addReplyTo(reply_to_num) {
            var post = posts[this.num];
            if(!post.hasOwnProperty('repliesTo')) post.repliesTo = [];
            post.repliesTo.push(reply_to_num);

            return this;
        },
        //записать в память ответ какого-то поста на текущий
        addReply(reply_num) {
            var post = posts[this.num];
            //console.log('addReply' + this.num)
            if(!post.hasOwnProperty('replies')) post.replies = [];
            if(post.replies.indexOf(reply_num) >= 0) return this;

            post.replies.push(reply_num);
            //if(post.rendered) this._renderReply(reply_num);
            //this._renderReply(reply_num);

            return this;
        },
        //сгенерировать HTML ответов на этот пост
        getReplyLinks() {
            var post = posts[this.num];
            var text = '';
            if(!post.hasOwnProperty('replies')) return text;

            for(var i=0;i<post.replies.length;i++) {
                text += this._generateReplyLink(post.replies[i]);
            }

            return text;
        },
        _generateReplyLink(reply_num) {
            var reply_thread = posts[reply_num].thread;

            return  '<a ' +
                'class="post-reply-link" ' +
                'data-num="' + reply_num + '" ' +
                'data-thread="' + reply_thread + '" ' +
                'href="/' + CFG.BOARD.NAME + '/res/' + reply_thread + '.html#' + reply_num + '">' +
                '&gt;&gt;' + reply_num +
                '</a> ';
        },
        //получить массив номеров ответов на этот пост
        getReplies() {
            var post = posts[this.num];
            return post.replies || [];
        },
        getPostsObj() {
            return posts;
        },
        purgePostsObj() {
            posts = {};
            return this;
        },
        el() {
            var post = posts[this.num];
            if(!post.el) post.el = $('#post-' + this.num);

            return post.el;
        },
        hide(store, reason) {
            if(this.isThread()) {
                this._renderHideThread(reason);
            }else{
                this._renderHidePost(reason);
            }

            if(store) this._storeHide();

            return this;
        },
        unhide() {
            if(this.isThread()) {
                this._renderUnHideThread();
            }else{
                this._renderUnHidePost();
            }

            this._storeUnHide();

            return this;
        },
        _storeHide() {
            Store.set('board.' + CFG.BOARD.NAME + '.hidden.' + this.num, getTimeInDays());

            return this;
        },
        _storeUnHide() {
            Store.del('board.' + CFG.BOARD.NAME + '.hidden.' + this.num);

            return this;
        },
        _renderHideThread(reason) {
            var num = this.getThread();
            var post = Post(num);
            var $el = $('#thread-' + num);
            var title = post.getTitle();

            var hiddenBox = $('<div></div>');
            hiddenBox.addClass('thread');
            hiddenBox.addClass('thread_hidden');
            hiddenBox.attr('id', 'hidden-thread-n' + num);
            hiddenBox.data('num', num);
            hiddenBox.html('<div>Скрытый тред <span class="hidden-thread-num">№'+ num + '</span><i> (' + title + ')</i>' + (reason? '<span class="post-hide-reason">(' + reason + ')</span></div>' : '</div>'));
            //if(reason) hiddenBox.append('');

            $el.before(hiddenBox);
            $el.hide();

            //_.id('thread-' + num).style.display = 'none';

        },
        _renderUnHideThread() {
            var num = this.getThread();
            var $el = $('#thread-' + num);

            $('#hidden-thread-n' + num).remove();
            $el.show();
            //_.id('thread-' + num).style.display = 'block';
        },
        _renderHidePost(reason) {

            if(reason) {
                const r =  _.newTempl(`<span class="post__detailpart">#${reason}</span>`)
                _.id(`post-details-${this.num}`).appendChild(r)
            }

            const hidePost = _.id(`post-${this.num}`);
            hidePost.classList.add('post_type_hidden');
        },
        _renderUnHidePost() {
            var $hidePost = _.id('post-' + this.num);
            $hidePost.classList.remove('post_type_hidden');
        },
        scrollTo() {
            if(CFG.MEDIA_SMOOTHNAV) document.documentElement.style.scrollBehavior = 'smooth';
            scrollTo(0, window.pageYOffset + this.el()[0].getBoundingClientRect().top - Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)/2);
            //this.highlight();
            document.documentElement.style.scrollBehavior = 'auto';
        },
        //функция для подсветки, но она мало где используется, обычно прописывается класс post_type_highlight
        //для подсветки лучше было бы сделать отдельную систему, она слишком много где используется
        highlight() {
            $('.post_type_highlight').removeClass('post_type_highlight');
            $('#post-' + this.num).addClass('post_type_highlight');
        },
        highlight_myposts() {
            $('#post-' + this.num).removeClass('post_type_watched');
            $('#post-' + this.num).addClass('post_type_watched');
        },
        highlight_myposts_replies(p) {
            $('#post-' + this.num).removeClass('post_type_replied');
            $('#post-' + this.num).addClass('post_type_replied');
            //console.log(post.repliesTo);
            _.q(`.post-reply-link[data-num="${p}"]`, this.el()[0]).textContent = `>>${p} (You)`;
        },
        //функция для генерации заголовка
        getTitle() {
            var element = this.el();
            var title = $.trim(element.find('.post__title').text());
            if(!title) title = $.trim(element.find('.post__message:first').text());
            if(title.length > 50) title = title.substr(0,50) + '...';

            return escapeHTML(title);
        },
        raw() { //мало ли кому это надо будет
            return posts[this.num];
        },

        //функции _c для кэширования данных для системы скрытия постов
        _cGet(objparam, htmlclass) {
            var post = posts[this.num];
            if(post.hasOwnProperty('ajax')) return post.ajax[objparam];
            if(!post.rendered) throw new Error('Вызов oGet для поста без ajax||rendered. Ошибка выше по коду.');
            if(!post.hasOwnProperty('cache')) post.cache = {};
            if(!post.cache.hasOwnProperty(objparam) && htmlclass) post.cache[objparam] = this.el().find('.' + htmlclass).html();

            return post.cache[objparam];
        },
        _cCacheNameMail() {
            var post = posts[this.num];
            if(post.hasOwnProperty('ajax')) return;
            if(!post.rendered) throw new Error('Вызов oCacheNameMail для поста без ajax||rendered. Ошибка выше по коду.');
            if(!post.hasOwnProperty('cache')) post.cache = {};
            if(post.cache.hasOwnProperty('name') || post.cache.hasOwnProperty('email')) return;

            var name_el = this.el().find('.post__anon');
            if(name_el.length) {
                post.cache.name = name_el.html();
                post.cache.email = null;
            }else{
                var el = this.el().find('.post__email');
                post.cache.name = el.html();
                post.cache.email = el.attr('href');
            }
        },
        cGetIcon:function() {
            return this._cGet('icon', 'post__icon');
        },
        cGetEmail:function() {
            this._cCacheNameMail();
            return this._cGet('email');
        },
        cGetName:function() {
            this._cCacheNameMail();
            return this._cGet('name');
        },
        cGetTrip:function() {
            return this._cGet('trip', 'post__trip');
        },
        cGetSubject:function() {
            return this._cGet('subject', 'post__title');
        },
        cGetComment:function() {
            return this._cGet('comment', 'post__message');
        }
    };

    window.Post = function(num) {
        num = parseInt(num);
        return (new PostQuery(num));
    };
})();

class AntiShipe {
    constructor (post) {
        this.rules = Store.get('other.hide_rules.list',[]);
        this.hidden = Store.get('board.' + CFG.BOARD.NAME + '.hidden', {});
        this.hideShipeEnabled = Store.get('other.hide_wipe', true);
        this.hideRulesEnabled = Store.get('other.hide_rules.enabled', false);
        this._tmp = Post(1);
        //@todo move to Post class obj
    }

    checkPost(post) {
        //const c = POSTS.get(post).comment;
        if(CFG.BOARD.NAME != 'b' && parseInt(this._tmp.getPostsObj()[post].ajax.parent) != 0) {
            const c = this._tmp.getPostsObj()[post].ajax;
            const r = this._processRules(c);
            if (r[0]) {
                Post(post).hide(false, r[1]);
                return true;
            }
        }
        // const c = Post(1).getPostsObj()[post].ajax.comment;
        // const r = this._processRules(c);
        //    if (r[0]) {
        //    	Post(post).hide(false, r[1]);
        //    	return true;
        //    }
        this.hideByList(post);
        this.hideByRules(post);
    }

    _processRules(post) {
        if(!this.hideShipeEnabled) return false;
        if(post.autohide == 1) {
            return [true, 'soft ban']
        } else if(post.comment.split('post-reply-link').length - 1 >= 5) {
            return [true, 'wipe massreply']
        } else if(this._checkSameLines(post.comment)) {
            return [true, 'wipe samelines']
        } else if(this._checkSameWords(post.comment)) {
            return [true, 'wipe samewords']
        } else if(this._checkLongWords(post.comment)) {
            return [true, 'wipe longwords']
        } else if(this._checkSymbols(post.comment)) {
            return [true, 'wipe symbols']
        //} else if(this._checkCapslock(post.comment)) {
        //    return [true, 'wipe capslock']
        } else if(this._checkNumbers(post.comment)) {
            return [true, 'wipe numbers']
        } else if(this._checkWhitespace(post.comment)) {
            return [true, 'wipe whitespaces']
        } else {
            return false;
        }
    }

    _checkWhitespace(post) {
        if(/(?:\n\s*){10}/i.test(post)) {
            return true;
        }
        return false;
    }
    _checkNumbers(post) {
        const _txt = post.replace(/\s+/g, ' ').replace(/>>\d+|https*:\/\/.*?(?: |$)/g, '');
        const len = _txt.length;
        const x = len - _txt.replace(/\d/g, '').length;
        if(len > 30 && ( x / len) > 0.4) {
            return true;
        }
        return false;
    }

    _checkCapslock(post) {
        const arr = post.replace(/[\s.?!;,-]+/g, ' ').trim().split(' ');
        if(arr.length > 2) {
            let n = 0;
            let capsw = 0;
            let casew = 0;
            for(let i = 0; i < arr.length; ++i) {
                const x = arr[i];
                if((x.match(/[a-zа-я]/ig) || []).length < 5) {
                    continue;
                }
                if((x.match(/[A-ZА-Я]/g) || []).length > 2) {
                    casew++;
                }
                if(x === x.toUpperCase()) {
                    capsw++;
                }
                n++;
            }
            if(capsw / n >= 0.2 && n > 2) {
                return true;
            } else if(casew / n >= 0.2 && n > 4) {
                return true;
            }
        }
        return false;
    }

    _checkSymbols(post) {
        const _txt = post.replace(/\s+/g, '');
        const x = _txt.replace(/[0-9a-zа-я.?!,]/ig, '').length;
        if(_txt.length > 30 && ( x / _txt.length) > 0.4) {
            return true;
        }
        return false;
    }

    _checkLongWords(post) {
        const arr = post.replace(/<\/?[^>]+(>|$)/g, "").replace(/https*:\/\/.*?(\s|$)/g, '').replace(/[\s.?!,>:;-]+/g, ' ').split(' ');
        const len = arr.length;
        if(arr[0].length > 50 || (len > 1 && arr.join('').length / len > 15)){
            return true;
        }
        return false;
    }

    _checkSameWords(post) {
        const arr = post.replace(/[\s.?!,>]+/g, ' ').toUpperCase().split(' ');
        const len = arr.length;
        if(len  > 3) {
            arr.sort();
            let keys = 0;
            let pop = 0;
            for(let i = 0, n = len / 4; i < len; keys++) {
                const x = arr[i];
                let j = 1;
                while(arr[++i] === x) {
                    j++;
                }
                if(len > 25) {
                    if(j > pop && x.length > 2) {
                        pop = j;
                    }
                    if(pop >= n) {
                        return true;
                    }
                }
            }
            const r = keys / len;
            if(r < 0.25) {
                return true;
            }
        }
        return false;
    }


    _checkSameLines(post) {
        const arr = post.replace(/>/g, '').split(/\s*\n\s*/);
        const len = arr.length;
        if(len  > 5) {
            arr.sort();
            for(let i = 0, n = len / 4; i < len;) {
                const x = arr[i];
                let j = 0;
                while(arr[++i] === x) {
                    j++;
                }
                if(j > 4 && j > n && x) {
                    return true;
                }
            }
        }
        return false;
    }

    hideByList(num = 0) {
        const tmpost = Post(1);
        if ( num ) {
            if(!this.hidden.hasOwnProperty(num)) return;
            if(num == CFG.BOARD.THREADID) return;
            tmpost.num = num;
            if(tmpost.exists() && tmpost.isRendered()) tmpost.hide();
        } else {
            // for(let num in this.hidden) {
            // 	tmpost.num = num;
            // 	if(tmpost.exists() && tmpost.isRendered() && tmpost.isThread() && CFG.BOARD.THREADID ) return;
            //        if(tmpost.exists() && tmpost.isRendered()) tmpost.hide();
            // };
        }



    }

    _test(regexp, text) {
        try {
            return new RegExp(regexp, 'i').test(text);
        }catch(e){
            return false;
        }
    }

    hideByRules(post) {
        if(!this.hideRulesEnabled) return;
        //if(posts.length > 1000) return;
        const tmpost = Post(1);
        try {
            //for (let i = posts.length - 1; i >= 0; i--) {
            //tmpost.num = posts[i].dataset['num'];
            tmpost.num = post;

            for(let j=0;j<this.rules.length;j++) {
                let title = this.rules[j][0];
                let tnum = this.rules[j][1];
                let icon = this.rules[j][2];
                let email = this.rules[j][3];
                let name = this.rules[j][4];
                let trip = this.rules[j][5];
                let subject = this.rules[j][6];
                let comment = this.rules[j][7];
                let disabled = !!this.rules[j][8];
                if(disabled) continue;
                if(tnum && tmpost.num != tnum) continue;
                if(icon && !this._test(icon, tmpost.cGetIcon())) continue;
                if(email && !this._test(email, tmpost.cGetEmail())) continue;
                if(name && !this._test(name, tmpost.cGetName())) continue;
                if(trip && !this._test(trip, tmpost.cGetTrip())) continue;
                if(subject && !this._test(subject, tmpost.cGetSubject())) continue;
                if(comment && !this._test(comment, tmpost.cGetComment())) continue;

                tmpost.hide(false, 'Правило #' + (j+1) + ' ' + title);
                break;
            }
            //}
        } catch(e) {
            console.log(tmpost.getPostsObj());
            console.log(e + ', номер поста ' + tmpost.num);
        }
    }
}

//система стадий загрузки
(function(){
    var dom_ready = false;
    var conf_queue = [];
    var dom_queue = [];
    var debug_html = '';
    window.sc_stages = [];
    window.sc_time = 0;


    //вывод дебага внизу страницы
    $('body').append('<div id="bmark_debug" style="display: none">' + debug_html + '</div>');

    //добавление новой страдии загрузки
    //смотри на практике как оно работает
    window.Stage = function(name, id, type, cb){
        window.sc_stages.push([id, name]);
        if(id != 'store' && Store.get('debug_disable_stage.' + id, false)) {
            append_debug('<span style="color: #0066FF">skip) ' + name + '</span><br>');
            return;
        }
        name = 'Стадия ' + name;
        bmark(name, cb);
    };
    //benchmark
    var bmark = function(name, cb) {
        var start = (+new Date);
        //if(!CFG.BOARD.NAME) return;
        try {
            cb();
        } catch(err) {
            console.log('На стадии' + name + ' произошла ошибка: ');
            console.log(err);
            console.log(err['stack']);
            return false;
        }

        var end = (+new Date);
        var delta = end-start;
        window.sc_time += delta;

        $('#bmark_debug').append(delta + 'ms) ' + name + '<br>');
    };
    var append_debug = function(text) {
        if(dom_ready) {
            $('#bmark_debug').append(text);
        }else{
            debug_html += text;
        }
    };
})();

$.fn.clearValue = function(){
    return this.each(function(){
        var el = $(this);
        el.wrap('<form>').closest('form').get(0).reset();
        el.unwrap();
    });
};
const as = new AntiShipe();
Stage('Наполнение карты постов',                'mapfill',      Stage.INSTANT,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    //обертка для операций с постами и тредами, расширения для postquery по сути, чтобы не хранить
    //тонну функций расбросанных
    window.PostF = {
        _postshtml: '',
        _cache: [],
        _renderLoading() {
            $alert('Лоадинг, плис вейт...', 'wait');
        },
        _postLoad() {
            //@postLoad
            Favorites.init();
            var hash = window.location.hash.substr(1);
            if(hash && !isNaN(hash)) {
                if(Post(hash).exists() && !Post(hash).isThread()) Post(hash).highlight();
                //_.id(hash.substr(1)).scrollIntoView();
            }
            //MHidePosts.hideByList();
            //MHidePosts.hideByRules($('.post'));
        },
        _renderLoaded() {
            $close($id('alert-wait')); //@todo document getlementbyid --> $id
            $alert('Загружено');

        },
        _append(data, expand) {
            //console.time("append");
            var tmpost = Post(1);
            for(var i = 0; i < data.length; i++) {
                tmpost.num = data[i].num;
                if(!expand) {
                    if(tmpost.isRendered()) continue;
                }
                tmpost.raw().rendered = true;
                if(!parseInt(data[i].parent)) {
                    this._appendThread(data[i]);
                } else {
                    this._appendPost(data[i]);
                }
            }
            //console.log('last');

            //console.timeEnd("append");
        },
        _appendPost(post) {
            if(!post.hasOwnProperty('num')) return false; //это какой-то неправильный пост
            let withImg = post.comment && post.files;
            //this._postshtml += `<div class="post post_type_reply ${withImg ? 'post_withimg' : ''}" id="post-${post.num}" data-num="${post.num}">`;
            this._postshtml += `<div class="post post_type_reply" id="post-${post.num}" data-num="${post.num}">`;
            this._postshtml += this._generatePostBody(post);
            this._postshtml += '</div>';
            let el = _.newTempl(this._postshtml);
            _.id('thread-' + (parseInt(post.parent) || post.num)).appendChild(el);
            this._postshtml = '';

            if(!CFG.BOARD.THREADID) window._hide_long_post($('#m' + post.num));
            Media.processLinks($('#post-' + post.num + ' a'));
            //MHidePosts.hideByRules($('#post-' + post.num));
            //MHidePosts.hideByList(post.num);
            as.checkPost(post.num);
            return true;
        },
        _appendThread(thread) {
            var postshtml = '';
            var num = thread.num;
            var postObj = thread;
            console.log('_appendThread');

            var postsCount = thread.posts_count || -1; //default value for expand
            var filesCount = thread.files_count;
            postshtml += '<div id="thread-' + num + '" class="thread">';
            postshtml += '<div class="post post_type_oppost" id="post-' + num + '" data-num="' + num + '">';
            postshtml += this._generatePostBody(postObj);
            postshtml += '<div class="oppost-options-mob mobile">';
            postshtml += '<div>'
            if(!CFG.BOARD.THREADID && postsCount != -1) postshtml += '<span class="mess-post-mob"><strong>Пропущено ' + postsCount + ' постов </strong><br>' + (filesCount ? filesCount + ' с картинками':'') + '.</span>';
            postshtml += '</div>'
            postshtml += '<div class="hide-view">';
            postshtml += '<a href="/' + CFG.BOARD.NAME + '/res/' + num + '.html" class="button_mob">В тред</a> ';
            postshtml += '<a class="button_mob postbtn-hide-mob" data-num="' + num + '">Скрыть</a>';
            postshtml += '</div>';
            postshtml += '</div>';

            // postshtml += '</div>';
            postshtml += '</div>';
            if(!CFG.BOARD.THREADID && postsCount != -1) postshtml += `<div class="thread__missed desktop"><svg xmlns="http://www.w3.org/2000/svg" class="post__btn post__btn_type_expand icon desktop" data-num="${num}"><use xlink:href="#icon__expand"></use></svg> Пропущено  ${postsCount}  постов ${filesCount ? ', ' + filesCount + ' с картинками' :''}.</div>`;
            postshtml += '</div>';

            if(!CFG.BOARD.THREADID && _.id('post-' + num)) {
                //for expand
                $(postshtml).insertAfter('#thread-' + num);
                let newMissMessage = _.id('thread-' + num).getElementsByClassName('thread__missed')[0].cloneNode(true);
                console.log(num);
                _.id('thread-' + num).id = 'thread-collapsed-' + num;
                _.id('thread-collapsed-' + num).style.display = 'none';
                $(newMissMessage).insertAfter('#thread-' + num + ' .post_type_oppost');
                _.q(`#thread-${num} .post__btn_type_expand`).classList.replace('post__btn_type_expand','post__btn_type_collapse');
                return;
            } else {
                $('#js-posts').append(postshtml);
            }


            Media.processLinks($('#post-' + num + ' a'));
            if(!CFG.BOARD.THREADID) window._hide_long_post($('#m' + num));
            //MHidePosts.hideByRules($('#post-' + num));
            //MHidePosts.hideByList(num);
            as.checkPost(num);
            return true;
        },
        _renderReplies(data, render) {
            var tmpost = Post(1);
            var replyhtml = '';

            for (var i = 0; i < data.length; i++) {
                tmpost.num = data[i].num;
                if(render) tmpost.raw().rendered = true;
                replyhtml = tmpost.getReplyLinks();
                if(replyhtml) {
                    var refmap = _.id('refmap-' + tmpost.num);
                    if(refmap) {
                        refmap.style.display = 'block';
                        refmap.innerHTML = replyhtml;
                    }
                }
            }
        },
        loadPage(page, render) {
            var tmpost = Post(1);
            //var page = page || 'index';
            var params = {'page':page,'board':CFG.BOARD.NAME};
            var that = this;
            this._renderLoading();

            tmpost.fetchPosts(params, function(data){
                if(data.error) return $alert('Ошибка: ' + data.errorText);
                if(render) window.appendRekl(); //@todo
                for (var i = 0; i < data.length; i++) {
                    var thread_num = data[i].thread_num;
                    var thread = Post(thread_num);
                    if(thread.exists() && thread.isRendered()) continue; //!!!!!!!!!!!!
                    if(render) {
                        that._append(data[i].posts);
                    } else {
                        that._renderReplies(data[i].posts, true);
                    }

                }
                //@todo переделать
                //запускается только на нулевой и только при прямо загрузке, автоподгрузка сама режет при рендере
                //возможно стоит только оппосты проверять так как у обычных есть ограничение по высоте и так
                if(!render) {
                    var $posts = $('.post__message');
                    for (var i = 0; i < $posts.length; i++) {
                        if ( $posts[i].id == 'm4651' || $posts[i].id == 'm148831' || $posts[i].id == 'm649638' || $posts[i].id == 'm574324' || $posts[i].id == 'm53058' || $posts[i].id == 'm605208' || $posts[i].id == 'm393465' || $posts[i].id == 'm318803' || $posts[i].id == 'm2136669' ||$posts[i].id == 'm152005' || $posts[i].id == 'm47092' || $posts[i].id == 'm1015374' || $posts[i].id == 'm43816') continue;
                        
                        if($($posts[i]).data('has-menu') == '0') {
                            window._hide_long_post($($posts[i]));
                        }
                    }
                    that._postLoad(); //дублированные вызовы исправлены
                }

                that._renderLoaded();
            });
        },
        loadThread(thread) {
            var params = {'from_post':thread,'thread':thread,'board':CFG.BOARD.NAME};
            var tmpost = Post(1);
            var that = this;

            //var t1 = performance.now();
            this._renderLoading();
            tmpost.fetchPosts(params, function(res){
                //var tmpost = Post(1);
                if(res.error) return $alert('Ошибка: ' + res.errorText);
                //@ по собранной карте постов проходимся циклом вторым, отмечаем посты рендеренными и выводим ответы.
                //console.time('render');
                that._renderReplies(res.data, true);
                //console.timeEnd('render')
                that._postLoad();
                that._renderLoaded();
                that._markPosts(CFG.BOARD.THREADID, true);
            });
        },
        expandThread(thread) {
            var params = {'from_post':thread,'thread':thread,'board':CFG.BOARD.NAME};
            var tmpost = Post(1);
            var that = this;
            this._renderLoading();
            tmpost.fetchPosts(params, function(res){
                if(res.error) return $alert('Ошибка: ' + res.errorText);
                //_.id('thread-' + num).style.display.
                that._append(res.data, true);
                that._renderLoaded();
                //that._markPosts(CFG.BOARD.THREADID, true);
            });

        },
        collapseThread(thread) {
            _.id('thread-' + thread).parentNode.removeChild(_.id('thread-' + thread));
            _.id('thread-collapsed-' + thread).style.display = 'flex';
            _.id('thread-collapsed-' + thread).id = 'thread-' + thread;
            //_.id('thread-' + thread).getElementsByClassName('post__btn_type_collapse')[0].classList.replace('post__btn_type_collapse','post__btn_type_expand');
        },
        updateThread() {
            //функция обновления треда, которая вызывается по кнопке "обновить тред"
            $alert('Загрузка...', 'wait');

            this.updatePosts(function(data) {
                $close($id('alert-wait'));

                if(data.updated) {
                    $alert('Новых постов: ' + data.updated);
                    if(Favorites.isFavorited(CFG.BOARD.THREADID)) Favorites.setLastPost(data.data, CFG.BOARD.THREADID);
                } else if(data.error) {
                    $alert('Ошибка: ' + data.errorText);
                } else {
                    $alert('Нет новых постов');
                }
            });
        },
        updatePosts(callback) {
            var that = this;
            var replyhtml = '';
            var todel = '';
            Post(CFG.BOARD.THREADID).fetchPosts({update: true}, function( data ) {
                if(data.hasOwnProperty('error')) return callback && callback(data);
                //if(!data.list.length && !data.deleted.length) return callback && callback({updated:0, list:[], deleted:[], data: [], favorites:data.favorites});
                //console.log(data)
                var tmpost = Post(1);
                var origHeight = window.pageYOffset;
                //удаление постов
                if(data.deleted) {
                    for(var i=0;i<data.deleted.length;i++) {
                        todel += '#post-' + data.deleted[i] + ', ';
                        //$('#post-' + data.deleted[i]).remove();
                    }
                    $(todel.slice(0, -2)).remove();
                }
                var origAfterDelHeight = window.pageYOffset;
                var afterDelDiff = origHeight - origAfterDelHeight;
                //window.scrollBy(0, -afterDelDiff);
                //render
                that._append(data.data);
                //var updHeight = window.pageYOffset;
                //var dif = updHeight - origHeight;
                window.scrollTo(0, origHeight-afterDelDiff);

                //console.time("append");
                for(var i = 0; i < data.updated; i++) {
                    tmpost.num = data.data[i].num;
                    var repliesTo = tmpost.raw().repliesTo;
                    if (repliesTo) {
                        for (var j = 0; j < repliesTo.length; j++) {
                            tmpost.num = repliesTo[j];
                            replyhtml = tmpost.getReplyLinks();
                            if(replyhtml) {
                                var refmap = _.id('refmap-' + tmpost.num);
                                if( refmap ) {
                                    refmap.style.display = 'block';
                                    refmap.innerHTML = replyhtml;
                                }
                            }
                        }
                    }

                }
                //console.timeEnd("append");

                //higlight_myposts подсветка ответов после обновления
                //var myposts = Store.get('myposts.' +  CFG.BOARD.NAME + '.' + CFG.BOARD.THREADID, []);
                that._markPosts(CFG.BOARD.THREADID, true);
                if(CFG.BOARD.NAME == 'math') MathJax.Hub.Queue(['Typeset',MathJax.Hub]);

                if(callback) callback(data);
            });
        },
        _generatePostBody(post, noreplies = false) {
            //если !parseInt(post.parent) то это ОП-пост
			
			var reactionshtml = '';
			
			if(CFG.BOARD.REACTIONS && !noreplies) {
				reactionshtml += '<div class="post__reactions_wrapper' + (post.reactions_count > 0 ? ' has_reactions' : '') + '" id="reactions-' + post.num + '" data-num="' + post.num + '">';
				
                if(post.reactions !== null) {
                    for(index = 0; index < post.reactions.length; index++) {
                        if(post.reactions[index].count > 0) {
                            reactionshtml += '<div class="post__reactions_button' + (post.reactions[index].count > 0 ? ' has_reactions' : '') + '" onclick="doReactPost(this, \'' + post.reactions[index].icon + '\', event);">';
                            reactionshtml += '<img src="/static/img/reactions/' + post.reactions[index].icon + '?v=8">';
                            reactionshtml += '<span>' + post.reactions[index].count + '</span>';
                            reactionshtml += '</div>';
                        }
                    }
				}
				
				reactionshtml += '</div>';
			}
			
			var floatingreactionshtml = '';
			
			if(CFG.BOARD.REACTIONS && !noreplies) {
				floatingreactionshtml += '<div class="post__floating_reactions_wrapper" id="reactions-floating-' + post.num + '" data-num="' + post.num + '"></div>';
			}
			
			var pollhtml = '';
			
			if(post.enable_poll == 1) {
				pollhtml += '<div class="post__poll_wrapper" id="poll-' + post.num + '">';
				pollhtml += '<div class="post__poll_label">' + lang.board_poll_answers + ' <span style="opacity:0.4;">' + (post.enable_multiple_votes == 1 ? lang.board_poll_multiple : lang.board_poll_single) + '</span></div>';
				pollhtml += '<div class="post__poll_answers">';
				
				for(index = 0; index < post.answers.length; index++) {
					pollhtml += '<div class="post__poll_answer" onclick="doVotePollAnswer(' + post.num + ', ' + index + ')">';
					pollhtml += '<div class="post__poll_answer_percent" style="width:' + post.poll_results_percent[index] + '%;" id="poll-' + post.num + '-vote-' + index + '-bar"></div>';
					pollhtml += '<span>' + post.answers[index] + '</span>';
					pollhtml += '<span id="poll-' + post.num + '-vote-' + index + '-percent">' + post.poll_results_percent[index] + '% (' + post.poll_results_exact[index] + ')</span>';
					pollhtml += '</div>';
				}
				
				pollhtml += '</div>';
				pollhtml += '<div class="post__poll_total">' + lang.board_poll_total + ' <b id="poll-total-' + post.num + '">' + post.total_poll_votes + '</b></div>';
				pollhtml += '</div>';
			}
			
            var postshtml = '';

            postshtml += '<div class="post__details" id="post-details-' + post.num + '">';
            postshtml += '<input type="checkbox" name="delete"  class="turnmeoff" value="' + post.num + '" /> ';
            if(post.subject && CFG.BOARD.SUBJECT) {
                postshtml += '<span class="post__detailpart">';
                postshtml += '<span class="post__title">';
                postshtml +=  post.subject + (post.tags?' /'+ post.tags + '/':'');
                postshtml += '</span> ';
                postshtml += '</span>';
            }
            postshtml += '<span class="post__detailpart">';
            var hathtml = '';
            if(post.hat != '') {
                hathtml = '<img src="/static/img/hats/' + post.hat + '.png" class="hat-img">';
            }
            if(post.email) {
                postshtml += '<a href="' + post.email + '" class="post__email">' + hathtml + post.name + '</a> ';
            }else{
                postshtml += '<span class="post__anon">' + hathtml + post.name + '</span> ';
            }
            if(post.icon) {
                postshtml += '<span class="post__icon">' + post.icon + '</span> ';
            }
            if(post.client == 'dashchan') {
                postshtml += '<span><b>D</b></span> ';
            }
            switch (post.trip) {
                case '!!%coder%!!':        postshtml += '<span class="post__coder">## Coder ##<\/span> '; break;
                case '!!%adm%!!':        postshtml += '<span class="post__adm">## Admin ##<\/span> '; break;
                case '!!%mod%!!':        postshtml += '<span class="post__mod">## Mod ##<\/span> '; break;
                case '!!%junior%!!':        postshtml += '<span class="post__junior">## Junior Mod ##<\/span> '; break;
                default:
                    if(post.trip_style) {
                        postshtml += '<span class="' + post.trip_style + '">' + post.trip + '</span> ';
                    } else {
                        postshtml += '<span class="post__trip">' + post.trip + '</span> ';
                    };
            }
            if(post.op == 1) {
                postshtml += '<span class="post__ophui"># OP</span>';
            }

            postshtml += '</span>';


            postshtml += `<span class="post__detailpart"><span class="post__time">${window.correctTZ?window.correctTZ(post.date):post.date}</span> </span> `;
			
			if(post.autodeletion_timestamp > 0) {
				postshtml += `<span class="post__detailpart"><span title="${post.autodeletion_date}" onclick="alert('${post.autodeletion_date}');"><b>ТАЙМЕР</b> </span> </span> `;
			}
			
			//postshtml += '<span class="post__detailpart post__edited"' + (post.edited > 0 ? '' : 'style="display:none;"') + '>' + lang.board_edited + '</span> '
			//postshtml += '<span class="post__detailpart post__edited_by_mod"' + (post.edited_by_mod > 0 ? '' : 'style="display:none;"') + '>' + lang.board_edited_by_mod + '</span> '
			
		    postshtml += `<span class="post__detailpart">
		    			  	<a href="/${CFG.BOARD.NAME}/res/${parseInt(post.parent)||post.num}.html#${post.num}" id="${post.num}" class="post__reflink">№</a><a href="/${CFG.BOARD.NAME}/res/${parseInt(post.parent)||post.num}.html#${post.num}" id="${post.num}" class="js-post-reply-btn post__reflink"  data-num="${post.num}">${post.num}</a>
		    			 `;
			
            if(CFG.BOARD.THREADID) postshtml += '<span class="post__number">' + post.number + '</span>';
            postshtml += '</span> ';
            postshtml += '<span class="post__detailpart desktop">';
            if(!parseInt(post.parent)) {
                postshtml += '<svg xmlns="http://www.w3.org/2000/svg" class="post__btn post__btn_type_favorite icon" data-num="' + post.num + '" id="fa-star' + post.num + '"><use xlink:href="#icon__star"></use></svg> ';
                //if(!CFG.BOARD.THREADID) postshtml += '<svg xmlns="http://www.w3.org/2000/svg" class="post__btn post__btn_type_expand icon" data-num="' + post.num + '"><use xlink:href="#icon__expand"></use></svg>';
                if(!CFG.BOARD.THREADID) postshtml += '<svg xmlns="http://www.w3.org/2000/svg" class="post__btn post__btn_type_hide icon desktop" data-num="' + post.num + '"><use xlink:href="#icon__hide"></use></svg>';
            }
            //postshtml += '<svg xmlns="http://www.w3.org/2000/svg" class="post__btn post__btn_type_report icon desktop" data-num="' + post.num + '"><use xlink:href="#icon__report"></use></svg>';
            postshtml += '<svg xmlns="http://www.w3.org/2000/svg" class="post__btn post__btn_type_menu icon desktop" data-num="' + post.num + '"><use xlink:href="#icon__addmenu"></use></svg>';
            postshtml += '<span data-num="' + post.num +'" onclick="addAdminMenu(this); return false;" style="display:flex;" onmouseout="removeAdminMenu(event); return false;"><svg xmlns="http://www.w3.org/2000/svg" style="display:none" class="post__btn post__btn_type_adm icon"><use xlink:href="#icon__report"></use></svg></span>';

            if(!parseInt(post.parent)) {
                //postshtml += '<span class="post__status">';
                if(post.sticky) postshtml += '    <svg xmlns="http://www.w3.org/2000/svg" class="post__btn  icon icon_type_active "><use xlink:href="#icon__pinned"></use></svg>';
                if(post.endless) postshtml += '    <svg xmlns="http://www.w3.org/2000/svg" class="post__btn  icon icon_type_active "><use xlink:href="#icon__infinity"></use></svg>';
                if(post.closed) postshtml += '    <svg xmlns="http://www.w3.org/2000/svg" class="post__btn  icon icon_type_active"><use xlink:href="#icon__closed"></use></svg>';
                //postshtml += '</span>';
            }

            postshtml += '		</span>';
            if(CFG.BOARD.LIKES) {
                postshtml += '<div id="like-div' + post.num + '" class="post__detailpart post__rate post__rate_type_like">';
                postshtml += '    <svg xmlns="http://www.w3.org/2000/svg" class="post__rate-icon icon" style="transform:rotate(180deg);"><use xlink:href="#icon__thunder"></use></svg>';
                postshtml += '    <span id="like-count' + post.num + '" class="">' + (post.likes>0?post.likes:'0') + '</span>';
                postshtml += '</div> ';
                postshtml += '<div id="dislike-div' + post.num + '" class="post__detailpart post__rate post__rate_type_dislike">';
                postshtml += '    <svg xmlns="http://www.w3.org/2000/svg" class="post__rate-icon icon"><use xlink:href="#icon__thumbdown"></use></svg>';
                postshtml += '    <span id="dislike-count' + post.num + '" class="">' + (post.dislikes>0?post.dislikes:'0') + '</span>';
                postshtml += '</div>';
            }
            if(!parseInt(post.parent) && !CFG.BOARD.THREADID) postshtml += '	<span class="post__detailpart desktop"> <a data-thread="' + post.num + '" href="/' + CFG.BOARD.NAME + '/res/' + post.num + '.html">' + lang.board_reply_post + '</a></span>';
            // postshtml += '	<br class="turnmeoff" />';
            postshtml += '</div>';


            if(post.files && post.files.length > 0) {
                postshtml += '<div class="post__images ' + ((post.files && post.files.length==1)?'post__images_type_single':'') + ((post.files && post.files.length>1)?'post__images_type_multi':'') + '">';
                var len = post.files.length;
                for(var i=0;i<len;i++) {
                    var file = post.files[i];
                    var is_webm = file.type == 6 || file.type == 10;
                    var is_audio = file.type == 20;
                    var is_sticker = file.type == 100;
                    postshtml += '<figure class="post__image">';
                    postshtml += '				<figcaption class="post__file-attr">';
                    postshtml += '					<a class="desktop" target="_blank" href="' + (is_sticker?file.install:file.path) + '" title="' + file.fullname + '">' + file.displayname + '</a>'; //deleted id="title-' + post.num + '-' + file.md5 + '">
                    if(!is_audio) {
                        postshtml += '					<svg xmlns="http://www.w3.org/2000/svg" class="icon js-post-findimg desktop"><use xlink:href="#icon__findimg"></use></svg>';
                    }
                    postshtml += '          <svg xmlns="http://www.w3.org/2000/svg" class="icon js-post-saveimg desktop" data-url="' + file.path + '" data-name="' + file.fullname + '"><use xlink:href="#icon__saveimg"></use></svg>';
                    postshtml += '					<span class="post__filezise">' + file.size + 'Kb' + (!is_audio?', ' + file.width + 'x' + file.height:'') + (is_webm?', ' + file.duration:'') + (is_audio?', ' + file.duration:'') + '</span>';
                    postshtml += '				</figcaption>';
                    postshtml += '				';
                    postshtml += '				<a class="post__image-link" href="' + file.path + '" onclick="return false;">';
                    postshtml += '					<img src="' + file.thumbnail + '" width="' + file.tn_width + '" height="' + file.tn_height + '" alt="' + file.size + '" class="post__file-preview' + (is_webm?' post__file-webm':'') + (is_audio?' post__file-webm':'') + (post.nsfw?' post__file-nsfw':'') + '"data-title="' + file.fullname + '" data-type="' + file.type + '" data-width="' + file.width + '" data-height="' + file.height + '" data-md5="' + post.num + '-' + (file.md5?file.md5:file.sticker) + '" data-src="' + file.path + '" id="img-' + post.num  + '-' + (file.md5?file.md5:file.sticker) + '" />';
                    postshtml += '				</a>';
                    postshtml += '			</figure>';
                }
                postshtml += '</div>';
            } else if(post.video) {
                postshtml += '		<div style="float: left; margin: 5px; margin-right:10px">';
                postshtml += '			' + post.video;
                postshtml += '		</div>';
            }
            postshtml += '<article id="m' + post.num + '" class="post__message ' + (!parseInt(post.parent)?'post__message_op':'') + '">';
            postshtml += '<div class="comment-data">' + post.comment + '</div>';
            postshtml += floatingreactionshtml;
            postshtml += reactionshtml;
            postshtml += pollhtml;
            postshtml += '</article>';
			var replyhtml = '';
			
			if(!noreplies) {
				replyhtml = Post(post.num).getReplyLinks();
			}
            //console.log(replyhtml);
            postshtml += '<div id="refmap-' + post.num + '" class="post__refmap" style="' + (replyhtml?'':'display: none;') + '">' + replyhtml + '</div>';
            //postshtml += '<div id="refmap-' + post.num + '" class="post__refmap" style="display: none;"></div>';

            return postshtml;
        },

        _markPosts(thread,mark_replies) {
            var posts = Store.get('myposts.' +  CFG.BOARD.NAME + '.' + thread, []);
            for(var i=0;i<posts.length;i++) {
                var post = posts[i];
                try {//обработка возможно удаленных постов
                    var replies = Post(post).getReplies();
                    Post(post).highlight_myposts();

                    if(mark_replies) {
                        for(var j=0;j<replies.length;j++) {
                            Post(replies[j]).highlight_myposts_replies(post);
                        }
                    };
                }
                catch(err) {
                    console.log(err);
                    var index = posts.indexOf(post);
                    if (index !== -1) posts.splice(index, 1);
                    console.log(post + ' has gone and deleted!');
                }
            }
            if(posts.length) Store.set('myposts.' +  CFG.BOARD.NAME + '.' + thread, posts);
        },
    }

    //карта новая из треда
    if(CFG.BOARD.THREADID) {
        PostF.loadThread(CFG.BOARD.THREADID);
        loadJson()
    } else {
        var match = new RegExp(/\/.*\/([0-9]+)\.(html)$/i).exec(window.location.pathname);
        PostF.loadPage(match?match[1]:'index', false);
        loadJson(null, CFG.BOARD.NAME, match?match[1]:0)
    }
});
Stage('Загрузка window.Gevent',                 'gevent',       Stage.INSTANT,      function(){
    Gevent.init();

    Gevent.on('fav.add', function(arg){
        Favorites.render_add(arg[0], arg[1]);
    });
    Gevent.on('fav.remove', function(num){
        Favorites.render_remove(num);
    });
    Gevent.on('fav.reset_newposts', function(num){
        Favorites.render_reset_newposts(num);
    });
    Gevent.on('fav.reset_newreplies', function(num){
        Favorites.render_reset_newreplies(num);
    });
    Gevent.on('fav.newposts', function(arg){
        Favorites.render_newposts(arg[0], arg[1]);
    });
    Gevent.on('fav.reset_deleted', function(num){
        Favorites.render_deleted(num);
    });
});
Stage('Загрузка Media провайдеров',             'media',        Stage.INSTANT,      function(){
    Media.add('youtube', 'youtube.com', "https?://(?:www\\.)?(?:youtube\\.com/).*(?:\\?|&)v=([\\w-]+)", {id: 1});
    Media.add('youtube', 'youtu.be', "https?://(?:www\\.)?youtu\\.be/([\\w-]+)", {id: 1});
    Media.add('vimeo', 'vimeo.com', "https?://(?:www\\.)?vimeo\\.com/([\\d]+)", {id: 1});
    Media.add('liveleak', 'liveleak.com', "https?://(?:www\\.)?(?:liveleak\\.com/).*(?:\\?|&)i=([\\w]+_\\d+)", {id: 1});
    Media.add('dailymotion', 'dailymotion.com', "https?://(?:www\\.)?dailymotion\\.com/video/([\\w]+)", {id: 1});
    Media.add('twitter', 'twitter.com', "https?://(?:www\\.)?twitter\\.com/.+/status/([\\d]+).*", {id: 1});
    Media.add('coub', 'coub.com', "https?://(?:www\\.)?coub\\.com/view/([\\w]+).*", {id: 1});
    Media.add('rutube', 'rutube.ru', "https?:\\/\\/(?:www\\.)?rutube\\.ru\\/(?:video|play\\/embed)\\/([\\w-]+).*", {id: 1});
    Media.add('vocaro', 'voca.ro', "https?:\\/\\/(?:www\\.)?(?:voca|vocaroo)\\.(?:ro|com)\\/([\\w]+)", {id: 1});
    Media.add('vocaro', 'vocaroo.com', "https?:\\/\\/(?:www\\.)?(?:voca|vocaroo)\\.(?:ro|com)\\/([\\w]+)", {id: 1});

    Media.addGenerator('youtube', function(obj, cb){
        cb('<iframe src="https://www.youtube.com/embed/' + obj.id + '?autoplay=1" width="1920" height="1080" style="width:100%;height:100%" frameborder="0" allowfullscreen></iframe>');
    });
    Media.addGenerator('vimeo', function(obj, cb){
        cb('<iframe src="https://player.vimeo.com/video/' + obj.id + '?autoplay=1" width="1920" height="1080" style="width:100%;height:100%" frameborder="0" allowfullscreen></iframe>');
    });
    Media.addGenerator('liveleak', function(obj, cb){
        $.get( 'hhttp://mobile.liveleak.com/view?i=' + obj.id + '&ajax=1', function( data ) {
            var regexp = /generate_embed_code_generator_html\('(\w+)'\)/i;
            var match = regexp.exec(data);
            if(!match || !match.hasOwnProperty('1')) return cb();
            cb('<iframe src="http://www.liveleak.com/ll_embed?f=' + match[1] + '&autostart=true" width="640" height="360" frameborder="0" allowfullscreen></iframe>');
        })
            .fail(function(){
                cb();
            });
    });
    Media.addGenerator('dailymotion', function(obj, cb){
        cb('<iframe width="640" height="360" src="https://www.dailymotion.com/embed/video/' + obj.id + '?autoplay=1" frameborder="0" allowfullscreen></iframe>');
    });
    Media.addGenerator('twitter', function(obj, cb){
        var onsuccess = function( data ) {
            cb(data.html);
        };
        var onfail = function(){
            cb();
        };
        $.ajax( {
            url: 'https://api.twitter.com/1/statuses/oembed.json?lang=ru&maxwidth=700&id=' + obj.id + '&callback=?',
            dataType: 'json',
            timeout: 5000,
            success: onsuccess,
            error: onfail
        });
    });
    Media.addGenerator('rutube', function(obj, cb){
        cb('' +
            '<iframe ' +
            'src="https://rutube.ru/play/embed/' + obj.id + '" ' +
            'width="1920" ' +
            'height="1080" ' +
            'frameborder="0" ' +
            'allow="clipboard-write; autoplay" ' +
            'style="width:100%; height:100%" ' +
            'webkitAllowFullScreen ' +
            'mozallowfullscreen ' +
            'allowFullScreen' +
            '></iframe>');
    });
    Media.addGenerator('vocaro', function(obj, cb){
        cb(
            '<iframe ' +
            'width="300" ' +
            'height="60" ' +
            'src="https://vocaroo.com/embed/' + obj.id + '?autoplay=0" ' +
            'frameborder="0" ' +
            'allow="autoplay"' +
            '></iframe>'
        );
    });

    Media.addGenerator('coub', function(obj, cb){
        cb('<iframe width="1920" height="1080" style="width:100%;height:100%" src="https://coub.com/embed/' + obj.id + '?muted=false&autostart=true&originalSize=false&startWithHD=false" frameborder="0" allow="autoplay" allowfullscreen></iframe>');
    });

    Media.addUnloader('twitter', function(el){
        $(el).closest('.post__message').find('.twitter-tweet').remove();
    });

    Media.addThumbnailer('youtube', function(obj){
        return '<img src="https://i.ytimg.com/vi/' + obj.id + '/mqdefault.jpg" width="320" height="180">';
    });
    Media.addThumbnailer('rutube', function(obj){
        const link = `https://rutube.ru/api/video/${obj.id}/thumbnail/?redirect=1`;
        return '<img src="'+ link +'" width="320" height="180">';
    });

    Media.addTitler('youtube', function(media, cb) {
        var jqxhr = $.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + media.id + "&key=AIzaSyAwWUvABX9ZwKqyYvnG6weQC1EOqTdqLEo", function(data) {
            if(!data) return cb(false);
            if(!data.items) return cb(false);
            if(!data.items[0]) return cb(false);
            if(!data.items[0].snippet) return cb(false);
            cb(data.items[0].snippet.title);
        });

        jqxhr.fail(function() {
            cb(false);
        })
    });
    Media.addMeta('youtube', {name: 'YouTube', icon: '<svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#icon__youtube"></use></svg>'});
});
Stage('Обработка Media ссылок',                 'mediapeocess', Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    if($('.post__message').length < 1000) {
        var $links = $('.post__message').find('a').not('.post-reply-link');
        Media.processLinks($links);
    }
});
Stage('Загрузка системы скруллинга',            'scrollcb',     Stage.INSTANT,      function(){
    window.scrollcb_array = [];
    var timer = 0;
    var win = $(window);

    win.scroll(function(){
        if(timer) clearTimeout(timer);

        timer = setTimeout(function(){
            timer = 0;
            var pos = win.scrollTop();

            for(var i=0;i<window.scrollcb_array.length;i++) window.scrollcb_array[i](pos);
        },100);
    });
});
Stage('Init функции',                     'initialisation',     Stage.DOMREADY,      function(){
    //это забрано из юзерспейс функции newakaba fastload()
    if($('#usercode-input')) $('.usercode-input,.qr-usercode-input').val(getCookie('passcode_auth'));
    //makaka captcha
    let f = _.qAll('.postform');
    let i1 = _.newTempl('<input type="hidden" class="js-makaka-id" name="makaka_id" value="">');
    let i3 = _.newTempl('<input type="hidden" class="js-makaka-answer" name="makaka_answer" value="">');
    f[0].append(i1,i3);
    f[1].append(i1.cloneNode(),i3.cloneNode());
    //
    var style = document.createElement('style');
    if(Store.get('other.auto_expand_spoiler', false)) {
        style.type = 'text/css';
        if(style.styleSheet){
            style.styleSheet.cssText = '.spoiler {color: var(--theme_default_text);} .spoiler a {color: var(--theme_default_link);}';
        }else{
            style.appendChild(document.createTextNode('.spoiler {color: var(--theme_default_text);} .spoiler a {color: var(--theme_default_link);}'));
        }
        document.getElementsByTagName('head')[0].appendChild(style);
    }

});
Stage('Top navigation',                     'topnav',     Stage.DOMREADY,      function(){
    if(!CFG.BOARD.NAME) return;
    if(window.matchMedia("(max-width: 480px)").matches) return;
    var navbar = document.getElementsByClassName('header__opts')[0];
    var pseudo = document.getElementsByClassName('header__menu')[0];
    window.addEventListener('scroll', function() {
        if (window.pageYOffset >= 58) {
            navbar.classList.add("header__opts_sticky");
            pseudo.style.marginBottom = '28px';
            //navbar.style.transition = "transform 0.2s";
        } else {
            navbar.style.transition = '';
            pseudo.style.marginBottom = '0px';
            navbar.classList.remove('header__opts_sticky');
        }
    });
    navbar.addEventListener('mouseover', function(e) {navbar.classList.add('header__opts_hovered')});
    navbar.addEventListener('mouseout', function(e) {
        var from = e.relatedTarget || e.toElement;
        if (from) {
            navbar.classList.remove('header__opts_hovered')
        }
    });
});
Stage('Сборщик мусора',                         'gc',           Stage.DOMREADY,     function(){
    if(!window.localStorage) return;
    if(!localStorage.store) return;

    if(localStorage.store.length < CFG.STORE_LIMIT) return;
    Store.del('boardstats');
    Store.del('_cache');

    if(localStorage.store.length < CFG.STORE_LIMIT) return;
    throw new Error('GC failed (' + localStorage.store.length + 'b left)');
});
Stage('Переключение разделов на мобилках',      'boardswitch',  Stage.DOMREADY,     function(){
    var $box = $('#js-mob-nav');
    $box.val('/' + CFG.BOARD.NAME +  '/');
    $box.change(function(){
        var newval = $(this).val();
        window.location.href = newval;
    });
});
Stage('Переключение стилей',                    'styleswitch',  Stage.DOMREADY,     function(){
    var current = Store.get('styling.style');
    var $el = $('#SwitchStyles');

    var switchTo = function(theme_path) {
        var css_link = $('#dynamic-style-link');
        if(!theme_path) {
            if(css_link.length) css_link.remove();
            return;
        }

        if(!css_link.length) {
            css_link = $('<link href="' + theme_path + '" id="dynamic-style-link" type="text/css" rel="stylesheet">');
            $('head').append(css_link);

            return;
        }

        css_link.attr('href', theme_path);
    };

    var onChange = function(){
        var selected = $el.val();

        if(!selected) {
            Store.del('styling.style');
        }else{
            Store.set('styling.style', selected);
            current = selected;
        }
        var path =  CFG.CUSTOMSTYLES[selected];
        switchTo(path);
    };

    $el.change(onChange);

    if(current) {
        $el.val(current);
    }
});

class Captcha2ch {
    constructor() {
        this.TTL = 0; // Время до конца жизни капчи в секундах
        this.busy = false;
    }

    // Загрузить новую капчу
    loadCaptcha(force) {
        if(this.TTL > 1 && !force) return;
        this.requestCaptchaKey();
    }

    requestCaptchaKey() {
        let url = `/api/captcha/default/id?board=${CFG.BOARD.NAME}&thread=${CFG.BOARD.THREADID}`;
        let abort = false;

        if(this.busy) return;
        this.busy = true;

        let abortTimer = setTimeout(() => {
            this.busy = false;
            abort = true;
            this.renderCaptcha('Таймаут');
        },  CFG.CAPTCHALOAD_TIMEOUT);

        this.renderLoadingMessage();

        $.get(url, ( data ) => {
            this.busy = false;
            if(abort) return;

            clearTimeout(abortTimer);

            if(data['warning']) {
                return this.renderCaptcha({ warning: data['warning']});
            } else if(data['banned']) {
                return this.renderCaptcha({ banned: data['banned']});
            } else if(data['result'] == -1) {
                return this.renderCaptcha('TIMEOUT');
            } else if(data['result'] == 0) {
                return this.renderCaptcha('VIPFAIL');
            } else if(data['result'] == 2) {
                return this.renderCaptcha('VIP');
            } else if(data['result'] == 3) {
                return this.renderCaptcha('DISABLED');
            } else if(data['result'] == 4) {
                return this.renderCaptcha('TIMEOUT');
            } else if(data['result'] == 1) {
                return this.preloadCaptcha({key: data['id'], img: data['img']}); //this.renderCaptcha({key: data['id']});
            }
            else return this.renderCaptcha(data);
        })
            .fail((jqXHR, textStatus) => {
                if(abort) return;
                this.busy = false;
                clearTimeout(abortTimer);
                this.renderCaptcha(textStatus);
            });
    }

    // Пытаемся загрузить картинку капчи за 3 секунды, если нет, то отдаём как есть. Будет грузиться как на дайлапе сверху вниз
    preloadCaptcha(data) {
        this.busy = true;
        let done = false;
        let start = (+new Date);

        this.resetTTL();
        let timeout = setTimeout(() => {
            done = true;
            this.busy = false;
            this.renderCaptcha(data)
        }, 3000);

        let $img = $('<img>');
        $img.one('load', () => {
            if(done) return;
            clearTimeout(timeout);

            // Eсли загрузится быстрее 500мс, то подождать чтоб надпись загрузки успела повисеть для красоты
            let wait = 500;
            let end = (+new Date);
            let delta = end-start;
            if(delta < wait) {
                setTimeout(() => {
                    this.busy = false;
                    this.renderCaptcha(data);
                }, wait-delta);
            }else{
                this.busy = false;
                this.renderCaptcha(data);
            }
        });
        $img.attr('src', data.img);
    }

    renderLoadingMessage() {
        $('.captcha__image').html('<span class="captcha__loadtext">Загрузка...</span>');
    }

    renderCaptcha(data) {
		if(!data.key) {
            if(data.warning) {
                generateWarning('warning', data.warning, function() {
                    $("#warningponyal").click(function(){
                        $.get('/api/captcha/message', function() {
                            loadCaptcha2ch();
                        })
                        return false;
                    });
                });
            }else if(data.banned) {
                generateWarning('banned', data.banned, function() {
                    delCookie('op_' + CFG.BOARD.NAME + '_' + CFG.BOARD.THREADID); //??WTF
                });
            }else if(data == 'VIP') {
                $('.captcha').html('Вы - пасскодобоярин.');
                Store.set('renewneeded',0);
            }else if(data == 'TIMEOUT') {
                $('.captcha__image').html(`
                    <span class="captcha__timeouttext">
                        Таймаут капчи.<br/>
                        Осталось:&nbsp;<span class="captcha_timeout">${CFG.CAPTCHARESET_TIMEOUT}</span>&nbsp;секунд
                    </span>
                `);
                (() => {
                    if (this.busy) return;
                    this.busy = true;
                    let interval = null;
                    let timerValue = CFG.CAPTCHARESET_TIMEOUT;

                    (function captchaTimeoutStep() {
                        if (!interval && timerValue > 0) {
                            interval = setInterval(captchaTimeoutStep.bind(this), 1000);
                        } else if (timerValue <= 0) {
                            clearInterval(interval);
                            this.busy = false;
                            loadCaptcha2ch(true);
                        } else {
                            timerValue--;
                            $('.captcha_timeout').html(timerValue);
                        }
                    }).bind(this)()
                }).bind(this)();
                Store.set('renewneeded',0);
            }else if(data == 'VIPFAIL') {
                $('.captcha').html('Капча временно отключена.');
                Store.set('renewneeded',1);
            }else if(data == 'DISABLED') {
                $('.captcha').html('');
                $('.captcha').hide();
            }else{
                $('.captcha__image').html(`Ошибка: ${data} <button class="captcha__loadtext ">Обновить</button>`);
            }
        }else{
            $('.captcha__key').val(data.key);
            $('.captcha__val').val('');
            $('.captcha__image').html(`<img src="${data.img}">
            	 <button class="captcha__loadtext js-captcha-load" style="display:none">Обновить</button>
                 <span class="captcha__timer" style="display:none">60</span>
                `);
            this.showTTL();
        }
    }

    renderTTL(remain) {
        if(remain == 0) {
            $('.captcha__timer').hide();
            //$('.js-captcha-load').show();
            if(document.hasFocus()) {
                this.loadCaptcha(true);
            } else {
                $('.js-captcha-load').show();
            }
            //e.currentTarget.nextElementSibling.focus();
        }else{
            $('.captcha__timer').text(this.TTL);
        }
    }

    showTTL() {
        $('.captcha__timer').show();
        this.renderTTL(this.TTL);
    }

    resetTTL() {
        this.TTL = CFG.CAPTCHA_TTL;
        if(this.TTLinterval) clearInterval(this.TTLinterval);
        this.TTLinterval = setInterval(()=>this.tickTTL(), 1000);
    }

    tickTTL() {
        this.TTL--;
        this.renderTTL(this.TTL);
        if(this.TTL == 0) {
            clearInterval(this.TTLinterval);
            this.TTLinterval = null;
        }
    }
    static async updateLimits() {

        let response = await fetch('/api/captcha/default/id');
        let data = null;
        if(response.ok) {
            data = await response.json();
            if(data['result'] == 2) {
				data['maxFilesSize'] = CFG.BOARD.MAXFILESSIZE
				data['maxFiles'] = 4
				$('.captcha').html('Вы - пасскодобоярин.');
			} else {
				return
			}
        } else {
            throw new Error('HTTP error');
        }
        CFG.BOARD.MAXFILESSIZE = FormFiles.max_files_size = data['maxFilesSize'];
        CFG.BOARD.MAXFILECOUNT = FormFiles.max = data['maxFiles'];

    }
}

function loadCaptcha2ch(force) {
     //if(!window.catcha2chInstance) window.catcha2chInstance = new Captcha2ch();
     //window.catcha2chInstance.loadCaptcha(force);
}

Stage('Управление полями загрузки картинок',    'uploadfields', Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    if(!window.FileReader) return; //HTML5
    if(!window.FormData) return; //HTML5
    //@todo delete Store.get('other.max_files_size') and Store.get('other.max_files')
    var FormFiles = window.FormFiles = {
        vip: true,
        max_files_size: CFG.BOARD.MAXFILESSIZE,
        max: 4,
        inputsContainer: null,
        count: 0,
        files_size: 0,
        filtered: [], //тут файлы, которые фактически пойдут на сервер(удаленные удаляются)

        async init(){
            if(getCookie('passcode_auth') || getCookie('moder')) {
                await Captcha2ch.updateLimits();
            }
            if(CFG.BOARD.NAME == 'd') {
                //this.max  = 0;
            }
            //var premium = Store.get('jsf34nfk3jh') && !Store.get('renewneeded');
            $('.postform__limits').html(`${this.max_files_size / 1024 }Mb / ${this.max} ${this.max > 4 || this.max == 0 ? 'файлов' : 'файла'} / <span class="postform__len">${CFG.BOARD.MAXCOMMENT}</span>`);
            // if(premium) {
            // 	if(premium) $('.filer__limits').html('Макс объем: ' + this.max_files_size + 'Кб, макс кол-во файлов: ' + this.max);
            // }
            $('.filer__input').change(this.onInputChangeMulti);
            $('.filer__thumbnails').on('click','.filer__delete', this.onDeleteMulti);

            var drag = $('.js-filer-input');
            var postform = $('.board-body');
            drag.on('drag dragstart dragend dragover dragenter dragleave drop', this.fileDragHover)
                .on('drop', this.fileSelectHandler)
                .on('click', function() { $('#formimages').click(); });
            postform.on('paste', this.onClipboardPaste);

            this.draggable();
        },

        draggable() {
            var in_drag = false;
            $('.filer__thumbnails').on('mousedown','.filer__img',function(e){
                if(in_drag) return;
                if(e.which != 1) return;
                e.preventDefault();

                in_drag = $(this).closest('.filer__thumb').data('id');
            });
            $('.filer__thumbnails').on('mouseover','.filer__thumb',function(e){
                if(!in_drag) return;
                var this_id = $(this).data('id');
                if(in_drag == this_id) return;
                if(Math.abs(in_drag-this_id) > 1) return;

                FormFiles.swap(in_drag, this_id);
                in_drag = this_id;
            });

            $(window).mouseup(function(){
                if(!in_drag) return;
                in_drag = false;
            });
        },

        onClipboardPaste(e) {
            var items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.kind === 'file') {
                    var blob = item.getAsFile();
                    //console.log(blob);
                    FormFiles.addMultiFiles([blob]);

                }
            }
        },

        onInputChangeMulti(e) {
            if(!this.files || !this.files[0]) return;
            if(FormFiles.count >= FormFiles.max || this.files.length > FormFiles.max) {
                alert('Вы можете загрузить не более ' + FormFiles.max + ' файлов!');
                this.value='';
                return;
            }
            FormFiles.addMultiFiles(this.files);
            //console.log(this.files);
        },

        fileSelectHandler(e) {
            FormFiles.fileDragHover(e);
            e.dataTransfer = e.originalEvent.dataTransfer;
            var files = e.target.files || e.dataTransfer.files;
            if(FormFiles.count >= FormFiles.max || files.length > FormFiles.max) {
                alert('Вы можете загрузить не более ' + FormFiles.max + ' файлов!');
                this.value='';
                return;
            }
            FormFiles.addMultiFiles(files);
        },

        fileDragHover(e) {
            e.stopPropagation();
            e.preventDefault();
            e.target.className = 'filer__drag-area';
            $(e.target).addClass(e.type == 'dragover' ? 'filer__drag-area_hover' : '');
        },

        onDeleteMulti() {
            var el = $(this);
            var id = el.closest('.filer__thumb').data('id');
            var uid = el.closest('.filer__thumb').data('uid');
            FormFiles.removeFileMulti(id, uid);
        },
        async addMultiFiles(files) {
            let fileab;
            let preview = '/static/img/video-icon.png';
            let name = Store.get('media.name_type', 0);
            for(var i=0;i<files.length;i++) {
                const uid = Math.random().toString(16).slice(2); // уникальный ID для удаления файлов
                files[i].uid = uid;
                this.files_size += files[i].size / 1024;
                console.log(this.files_size);
                if(this.files_size > this.max_files_size) {
                    alert('Превышен макс. объем данных для отправки, кол-во доступных для загрузки файлов - ' + i);
                    this.files_size -= files[i].size;
                    break;
                }
                if(files[i].type.substr(0,5) == 'image') {
                    try {
                        fileab = await this.readAsArrayBufferAsync(files[i]);
                        preview = `data:${files[i].type};base64,${window.btoa(new Uint8Array(fileab[0]).reduce((data, byte) => data + String.fromCharCode(byte), ''))}`; //get preview from bytes?
                        if(Store.get('media.clear_exif', true) && CFG.BOARD.NAME != 'ai') {
                            fileab = new MediaDataParser(fileab[0]).removeExif();
                        }
                        let file = new File(fileab, (name == 0 ? files[i].name : 'image'), {type: files[i].type, lastModified: files[i].lastModified}); //files[i].name опции для имен
                        file.uid = uid;
                        console.log(file.uid);
                        if(!file.uid) return console.error('Браузер не поддерживает измненеие свойств. Сообщите в /d/');
                        this.filtered.push(file);
                    } catch(err) {
                        console.log(err);
                    }
                }else{
                    if(!files[i].uid) return console.error('Браузер не поддерживает измненеие свойств. Сообщите в /d/');
                    this.filtered.push(files[i]);
                }
                //пишем файлы в массив, он потом идет в formdata
                this.processFile({name: files[i].name,size: files[i].size,type: files[i].type,preview: preview, uid: uid});
                FormFiles.count++;
            }
        },
        readAsArrayBufferAsync(file) { //to global?
            return new Promise((resolve, reject) => {
                let reader = new FileReader();

                reader.onload = () => {
                    resolve([reader.result]);
                };

                reader.onerror = reject;

                reader.readAsArrayBuffer(file);
            })
        },

        removeFileMulti(id, uid) {
            var name = $('.js-filer-thumb-c-' + id + ' .filer__img img').attr('title');

            $('.js-filer-thumb-c-' + id).remove();
            for(var i=id;i<=this.count;i++) {
                this.rename(i, i-1);
            }
            this.count--;

            var filesArr = Array.prototype.slice.call(FormFiles.filtered);
            for(var i=0;i<filesArr.length;i++) {
                if(filesArr[i].uid === uid) {
                    this.files_size -= filesArr[i].size;
                    filesArr.splice(i,1);
                    break;
                }
            }
            this.filtered = filesArr;
        },

        rename(old_id, new_id) {
            $(`.js-filer-thumb-c-${old_id}`)
                .removeClass(`js-filer-thumb-c-${old_id}`)
                .addClass(`js-filer-thumb-c-${new_id}`)
                .data('id', new_id);
        },

        swap(id1, id2) {
            if(Math.abs(id1-id2) > 1) return;
            if(id1 == id2) return;

            let $boxex = $(`.js-filer-thumb-c-${id1}`);
            let $boxex2 = $(`.js-filer-thumb-c-${id2}`);

            for(var i=0;i<$boxex.length;i++) {
                if(id1 < id2) $($boxex2[i]).after($boxex[i]);
                else $($boxex2[i]).before($boxex[i]);
            }

            this.rename(id1, 'temp');
            this.rename(id2, id1);
            this.rename('temp', id2);

            let tmp = this.filtered[id1];
            this.filtered[id1] = this.filtered[id2];
            this.filtered[id2] = tmp;
        },

        processFile(file) {
            //console.log(file);
            var width= 100, height = 100;
            $('.filer__thumbnails').append('<div class="filer__thumb js-filer-thumb-c-' + this.count + '"  data-id="' + this.count + '" data-uid="' + file.uid + '">' +                '<div class="filer__img"><img src="' + file.preview + '" style="max-width:' + width + 'px;max-height:' + height + 'px" title="' + file.name + '"></div>' +
                '<div class="filer__meta">' +
                '<span class="filer__size">' + getReadableFileSizeString(file.size) + '</span> ' +
                '<span class="filer__delete"><svg xmlns="http://www.w3.org/2000/svg"class="icon"><use xlink:href="#icon__delete"></use></svg></span>' +
                '</div>' +
                '<span class="filer__nsfw" style="display:none;">' + '<label for="img_nsfw">nsfw: </label><input type="checkbox" id="img_nsfw" name="image' + this.count + '_nsfw" value="1">' + '</span> ' +  // CFG.BOARD.NAME=='pa'
                '</div>' +
                (this.count==4?'<br>':''));
            if(CFG.BOARD.NAME=='pa') {
                $('.filer__nsfw').show();
            }
        },

        reset() {
            $('.filer__thumbnails').html('');
            //$('#form-files-input-inputs-container').html('');
            this.count = 0;
            this.filtered = [];
            this.files_size = 0;
        },

        // appendToForm(form) {
        //     $(form).append($('#form-files-input-inputs-container'));
        // },
    };

    if(FormFiles.max) FormFiles.init();

});
Stage('Обработка и отправка постов на сервер',  'postsumbit',   Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    var request;
    var busy = false;
    var valid = false;
    var $qr = $('#qr');
    var $forms =  $('#postform,#qr-postform');
    var $submit_buttons = $('#qr-submit,#submit');
    let errCount = 0;
    //todo просмотреть, можно ли ускорить кешируя ссылки на $("qr-blabla") в переменную
    var sendForm = function(form) {
        //@сафари

        $('.filer__input').val('');
        var formData = new FormData(form);

        busy = true;

        //эта пипка для подмены пикч, если из мультиселекта было что-то удалено
        //if(FormFiles.vip) {
        if (typeof formData.delete === "function") formData.delete('file[]');
        for(var i=0, len=FormFiles.filtered.length; i<len; i++) {
            formData.append('file[]', FormFiles.filtered[i]);
        }
        formData.delete('formimages[]');
        //}

        // var keys = [], vals = [];
        // for (var value of formData.values()) {
        //    vals.push(value);
        // }
        // for (var key of formData.keys()) {
        //    keys.push(key) ;
        // }
        // for(let i = 0; i < keys.length; i++) {
        // 	console.log(keys[i] + ': ' + vals[i]);
        // }

        request = $.ajax({
            url: ' /user/posting?nc=1',  //Server script to process data
            type: 'POST',
            dataType: 'json',
            xhr() {  // Custom XMLHttpRequest
                var myXhr = $.ajaxSettings.xhr();
                if(myXhr.upload){ // Check if upload property exists
                    myXhr.upload.addEventListener('progress', progressHandling, false); // For handling the progress of the upload
                }
                return myXhr;
            },
            //Ajax events
            success: on_send_success,
            error: on_send_error,
            // Form data
            data: formData,
            //Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });

        renderSending();
    };
    window.sendForm = sendForm;

    var renderSending = function(){
        /*var inputs = forms.find('input,select,textarea').not('[type=submit]');
         inputs.attr('disabled','disabled');*/
        $submit_buttons.attr('value', 'Отправка...');
    };

    var renderSendingDone = function(){
        /*var inputs = forms.find('input,select,textarea').not('[type=submit]');
         inputs.removeAttr('disabled');*/
        $submit_buttons.attr('value', 'Отправить');
    };

    var progressHandling = function(e) {
        var percent = 100/e.total*e.loaded;
        if(percent >= 99) return $submit_buttons.attr('value', 'Обработка...');

        var bpercent = ( (Math.round(percent*100))/100 ).toString().split('.');
        if(!bpercent[1]) bpercent[1] = 0;
        bpercent = (bpercent[0].length==1?'0'+bpercent[0]:bpercent[0]) + '.' + (bpercent[1].length==1?bpercent[1]+'0':bpercent[1]);

        $('#qr-progress-bar').attr('value', e.loaded).attr('max', e.total);
        $submit_buttons.attr('value', bpercent + '%');
    };

    var on_send_error = function(request) {
        if(request.statusText == 'abort') {
            $alert(lang.board_posting_canceled);
        }else{
            $alert(lang.board_posting_error + ' ' + request.statusText);
        }

        on_complete();
    };

    var on_send_success = function(data) {

        if(data.result == 1 ) {
            if( data.num ) {
                $alert(lang.board_posting_post_created);
				restartCaptcha();
				doCancelPoll();
                //console.log(data);
                let curPosts;
                var num;
                //Favorites если тред && other.autowatchmyposts, то авто-подпись на пост
                if(Store.get('other.autowatchmyposts', true) && CFG.BOARD.THREADID) {
                    if(!Favorites.isFavorited(CFG.BOARD.THREADID)) {
                        Favorites.add(CFG.BOARD.THREADID);
                    }
                    curPosts = Store.get('favorites.' + CFG.BOARD.THREADID + '.posts', false);
                    if(curPosts) {
                        Store.set('favorites.' + CFG.BOARD.THREADID + '.posts', curPosts.concat(data.num));
                    } else {
                        Store.set('favorites.' + CFG.BOARD.THREADID + '.posts', [data.num]);
                    }
                }

                //сохранить номер поста и тред, если включа настройка higlight_myposts
                if(Store.get('other.higlight_myposts',true)) {
                    //не сработает если постилось в тред с нулевой при включенной опции "не перенаправлять в тред"
                    curPosts = Store.get('myposts.' + CFG.BOARD.NAME + '.' + CFG.BOARD.THREADID, []);
                    Store.set('myposts.' + CFG.BOARD.NAME + '.' + CFG.BOARD.THREADID, curPosts.concat(data.num));
                }

                if(Store.get('other.qr_close_on_send', true)) $('#qr').hide();

                if(!CFG.BOARD.THREADID) { //костыль
                    const behavior = Store.get('other.on_reply_from_main', 1);
                    if(behavior == 1) {
                        window.location.href = '/' + CFG.BOARD.NAME + '/res/' + $('#qr-thread').val() + '.html#' + data.num;
                    }
                }else{
                    const highlight_num = data.num;
                    PostF.updatePosts(function(data){
                        if(Favorites.isFavorited(CFG.BOARD.THREADID)) Favorites.setLastPost(data.data, CFG.BOARD.THREADID);
                        Post(highlight_num).highlight();
                    });
                }
                resetInputs();
            } else {
                console.log(data);
                const num = data.thread;
                $alert(lang.board_posting_thread_created);

                //костылик, при создании треда для автодобавления в избранное, если есть настройка autowatchmythreads
                if(Store.get('other.autowatchmythreads', false)) Store.set('other.mythread_justcreated', true);

                window.location.href = '/' + CFG.BOARD.NAME + '/res/' + num + '.html';
            }

        } else {
            //errror
            // if(data.Id) {
            //           $alert(data.Reason + '<br><a href="/ban?Id=' + data.Id + '" target="_blank">Подробнее</a>', 'wait');
            //       }else{
				
			restartCaptcha();

            if( data.error.code == -5 ) {
                errCount++;
                if (errCount >= 1) {
                    loadCaptcha2ch(true);
                    errCount = 0
                }
            }
            $alert(`${lang.board_posting_error} ${data.error.message}`)
        }


        on_complete();
    };

    var on_complete = function() {
        busy = false;
        renderSendingDone();
    };

    var resetInputs = function() {
        $('#subject').val('');
        $('#timer, #qr-timer').val('0');
        $('#shampoo, #qr-shampoo').val('');
        $('.postform__len').html(CFG.BOARD.MAXCOMMENT);
        if(window.FormFiles) window.FormFiles.reset();
        $('.oekaki-image').val(''); //очистка оекаки
        $('.oekaki-metadata').val(''); //очистка оекаки
        $('.oekaki-clear').prop('disabled', true);
        $('.postform__sticker-prev').html(''); // sticker
        $('.sticker-input').remove();
        loadCaptcha2ch(true);
    };

    var saveToStorage = function() {
        Store.set('thread.postform.hat', $('#hat').val());
        Store.set('thread.postform.name', $('#name').val());
        Store.set('thread.postform.trip', $('#trip').val());
        Store.set('thread.postform.email', $('#e-mail').val());
        Store.set('thread.postform.op', $('#op').prop('checked'));
        Store.set('thread.postform.force_geo', $('#force_geo').prop('checked'));
        var icon = $('.js-icon-select').val();
        if(icon) Store.set('thread.postform.icon.' + CFG.BOARD.NAME, icon);
    };

    var validator_error = window.postform_validator_error = function(id, msg) {
        var $el = $('#' + id);
        var $qr_el = $('#qr-' + id);

        if(msg) $alert(msg);

        $el.addClass('error');
        $qr_el.addClass('error');
        (activeForm.attr('id') == 'qr-shampoo') ? $qr_el.focus() : $el.focus();
    };

    var validateForm = function(is_qr) {
        var $c_id    = $('.captcha__key');
        var len = unescape(encodeURIComponent($('#shampoo').val())).length;
        var max_len = parseInt(CFG.BOARD.MAXCOMMENT);

        //if($('input[name=thread]').val()=='0' && window.FormFiles && window.FormFiles.max && !window.FormFiles.count && !is_qr && !CFG.BOARD.OEKAKI) return $alert('Для создания треда загрузите картинку');
        if($('input[name=thread]').val()=='0' && $('input[name=subject]').val()=='' && CFG.BOARD.NAME == 'news') return $alert('Для создания треда заполните поле "Тема"');  //вкл. обязательное поле "тема" в news
        if($('input[name=thread]').val()=='0' && $('input[name=tags]').val()=='' && ( CFG.BOARD.NAME == 'vg' || CFG.BOARD.NAME == 'tv' )) return $alert('Для создания треда заполните поле "Теги"'); //вкл. обязательное поле "теги" в vg
        if(!len && window.FormFiles && window.FormFiles.max && !window.FormFiles.count && !FormFiles.oekaki && !FormFiles.sticker) return validator_error('shampoo', 'Вы ничего не ввели в сообщении'); //не проверять оекаки
        //if(!/[а-яё]/i.test($('#shampoo').val()) && CFG.BOARD.NAME == 'b') return $alert('Error occured');
        if(len > max_len) return validator_error('shampoo', 'Максимальная длина сообщения ' + max_len + ' <b>байт</b>, вы ввели ' + len);

        if(CFG.BOARD.NAME == 'news') {
            if ( $('input[name=thread]').val()=='0' ) {
                let s = $('input[name=subject]').val();
                $('input[name=subject]').val(s.replace(/[^\x00-\u04FF]/g, ""));
            }


        }

        return true;
    };

    var renderCaptchaResolve = function(){
        /*var inputs = forms.find('input,select,textarea').not('[type=submit]');
         inputs.attr('disabled','disabled');*/
        $submit_buttons.attr('value', 'Капча...');
    };

    $forms.on('submit', function(){
        if(typeof FormData == 'undefined') return; //старый браузер
        if(busy) {
            request.abort();
            return false;
        }
        //window.FormFiles.appendToForm(this);
        var form = $(this);

        saveToStorage();

        //if(validateForm(form.attr('id') == 'qr-postform')) sendForm(form[0]);
        try {
            if(validateForm(form.attr('id') == 'qr-postform')) sendForm(form[0]);
        } catch(e) {
            console.log(e)
            $alert('Что-то пошло не так, перезагрузите страницу и попробуйте снова.')
        }

        return false;
    });

    $('#qr-cancel-upload').click(function(){
        request.abort();
    });

});

Stage('Обработка нажатий клавиш',               'keypress',     Stage.DOMREADY,     function(){
    var ctrl = false;
    $(window).keydown(function(e) {
        if(e.keyCode == 17) ctrl = true;
        if(e.keyCode == 32 && ctrl) {
            if(!Store.get('other.qr_hotkey', true)) return;
            var $qr = $('#qr');
            if($qr.is(':visible')) {
                $qr.hide();
            }else{
                $qr.show();
                loadCaptcha2ch();
            }
        }
    })
        .keyup(function(e) {
            if(e.keyCode == 17) ctrl = false;
        })
        .blur(function() {
            ctrl = false;
        });

    $('#qr-shampoo,#shampoo').keydown(function(e) {
        if(e.keyCode == 13 && ctrl && Store.get('old.ctrl_enter_submit', true)) {
            if(window.activeForm.attr('id') == 'qr-shampoo') {
                $('#qr-submit').click();
            }else{
                $('#submit').click();
            }
        }
        if(CFG.POSTFORM_SHORTCUT) {
            if(e.keyCode == 66 && ctrl ) {
                doAddTags('[b]','[/b]','qr-shampoo');
            } else if (e.keyCode == 73 && ctrl) {
                doAddTags('[i]','[/i]','qr-shampoo');
            } else if (e.keyCode == 85 && ctrl) {
                doAddTags('[u]','[/u]','qr-shampoo');
            } else if (e.keyCode == 79 && ctrl) {
                doAddTags('[o]','[/o]','qr-shampoo');
            } else if (e.keyCode == 83 && ctrl) {
                doAddTags('[s]','[/s]','qr-shampoo');
            }
        }
    });

});
Stage('Enable debug',                           'enabledebug',  Stage.DOMREADY,     function(){
    if(!Store.get('debug',false)) return;
    $('#bmark_debug').attr('style','inline-block');
    $('.debug').removeClass('debug');
});
Stage('NSFW',                                   'nsfw',         Stage.DOMREADY,     function(){
    var enabled = Store.get('styling.nsfw',false);

    var turn_on = function() {
        enabled = true;
        $('head').append('<style type="text/css" id="nsfw-style">' +
            '.post__file-preview, .mmm__img{opacity:0.05}' +
            '.post__file-preview:hover, .mmm__img:hover{opacity:1}' +
            '</style>');
    };
    var turn_off = function() {
        enabled = false;
        $('#nsfw-style').remove();
    };

    $('#nsfw').click(function(){
        if(enabled) {
            Store.del('styling.nsfw');
            turn_off();
        }else{
            Store.set('styling.nsfw',true);
            turn_on();
        }
    });

    if(enabled) turn_on();
});
Stage('Мои доски',                              'myboards',     Stage.DOMREADY,     function(){
    $('.header__myboards').on('click', '#edit-boards', function(e) {
        var newBoards = prompt(lang.board_custom_list_boards, CFG.MYBOARDS.join(' '));
        if(newBoards === null || typeof newBoards == 'undefined') return;
        newBoards = newBoards.split(' ');
        Store.set('other.myboards.boards', newBoards);
        renderBoards(newBoards);
        return false;
    });
});
Stage('Скрывабщиеся блоки снизу',                 'bottomboxes',   Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return;
    window.MBottomBox = (function () {

        let _helper = {
            show() {
                document.getElementsByClassName('bb__panels')[0].style.display = 'block';
                Store.set('styling.bb.minimized', false);
            },
            hide() {
                document.getElementsByClassName('bb__panels')[0].style.display = 'none';
                Store.del('styling.bb.minimized');
            },
            enable() {
                document.getElementsByClassName('bb')[0].style.display = 'block';
            }
        }

        let _module = {
            init() {
                Store.del('styling.favorites.minimized'); //clear old
                Store.del('styling.boardstats.minimized');
                Store.del('styling.favorites.new');
                let enabled = Store.get('other.bb', true);
                if( enabled ) { //enale box
                    _helper.enable();
                }

                let minimized = Store.get('styling.bb.minimized', true);
                if( minimized ) _helper.hide();
            },
            newFav(newfav) {
                if ( !newfav ) {
                    Store.del('styling.bb.new');
                    _.id('bb-header').classList.remove('bb__header_new');
                } else {
                    Store.set('styling.bb.new', true);
                    _.id('bb-header').classList.add('bb__header_new');
                }
            },
            toggle(forceopen) {
                if(forceopen) return _helper.show();
                let minimized = Store.get('styling.bb.minimized', true);
                if(!minimized) {
                    _helper.hide();
                }else{
                    _helper.show();
                    this.newFav();
                }
            },
            tabClick(e) {
                let tab = e.target.dataset['tab'];
                if ( tab == 'favorites' ) {
                    _.id('favorites-body').style.display = 'block';
                    _.id('boardstats-body').style.display = 'none';
                } else {
                    _.id('boardstats-body').style.display = 'block';
                    _.id('favorites-body').style.display = 'none';

                }
                $('.bb__tab').removeClass('bb__tab_active');
                e.target.classList.add('bb__tab_active');
            }
        };

        return _module;

    })();

    window.MBoardStat = (function () {
        let _busy = false;
        let _timer = 0;
        let $boardstats_update_el = $('.bb__update');

        const _helper = {
            fetchThreads(cb) {
                let onError = function(){
                    cb(false);
                };

                let onSuccess = function(data) {
                    if(!data) return cb(false);
                    if(!data.hasOwnProperty) return cb(false);
                    if(!data.hasOwnProperty('threads')) return cb(false);

                    data['threads'].splice(10,data['threads'].length);
                    data['threads'].sort(function(a,b){
                        return b['score']-a['score'];
                    });

                    cb(data['threads']);
                };

                $.ajax({
                    url: '/' + CFG.BOARD.NAME + '/threads.json',
                    type: 'GET',
                    dataType: 'json',
                    success: onSuccess,
                    error: onError,
                    timeout: CFG.STATS_CONNECT_TIMEOUT
                });
            },
            reset(time, announce) {
                if(!time) time = CFG.STATS_TIMEOUT;
                time = time*5000;
                if(_timer) clearTimeout(_timer);
                if(_busy) _busy = false;
                $boardstats_update_el[0].classList.remove('icon_type_spin');

                _timer = setTimeout( () =>  { this.update() } , time);
            },
            render(threads) {
                let $table = $('#boardstats-table');
                let rendered = 0;
                let html = '';
                $table.html(html);
                for(let i=0; i<threads.length; i++) {
                    let thread = threads[i];
                    if(!thread) break;
                    if(parseInt(thread.sticky)) continue;
                    if(parseInt(thread.bump_limit)) continue;
                    let subject = thread.subject || 'Без названия';
                    html += `<div class="bb__row">
		                <span class="bb__bstitle"><a href="/${CFG.BOARD.NAME}/res/${thread.num}.html">${subject}</a></span>
		                <span>&nbsp; <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#icon__posts"></use></svg>&nbsp;&nbsp; ${thread.posts_count}</span></div>`;
                    rendered++;
                    if(rendered >= CFG.STATS_COUNT) break;
                }
                $table.html(html);
            },
            update() {
                clearTimeout(_timer);

                _busy = true;
                $boardstats_update_el[0].classList.add('icon_type_spin');

                this.fetchThreads((data) => {
                    if(!data) return this.reset(CFG.STATS_RETRY);
                    this.reset();

                    Store.set('boardstats.' + CFG.BOARD.NAME, {time:(+new Date), data:data});

                    this.render(data);
                })
            }
        }

        const _module = {
            public: '',
            init() {
                let cached = Store.get('boardstats.' + CFG.BOARD.NAME, false);
                if(cached && cached.data) {
                    _helper.render(cached.data);
                } else {
                    _helper.update();
                }

                $boardstats_update_el.click(() => { if(!_busy) _helper.update(); return false; });

            },
        };

        return _module;

    })();

    ///////

    MBoardStat.init();

    //////

    document.getElementsByClassName('bb')[0].addEventListener('click', function(e) {
        if (e.target &&  e.target.matches('.bb__tab')) {
            MBottomBox.tabClick(e);
        }
    })
    var $box_header = $('#bb-header');

    MBottomBox.init();

    $box_header.click(() => { MBottomBox.toggle() });


    var $fav_body = $('#favorites-table');

    $fav_body.on('click', '.fav__fa_type_remove', function(){
        var num = $(this).data('num');
        Favorites.remove(num);
    });

    $fav_body.on('click', '.fav__fa_type_update', function(){
        var num = $(this).data('num');
        Favorites.forceRefresh(num);
    });

    $('.cntnt__main').on('click', '.post__btn_type_favorite,#postbtn-favorite-bottom', function(){
        var num = $(this).data('num') || CFG.BOARD.THREADID;
        Favorites.add(num);
    });

    //
    $('#qr-fav-autowatchmyposts').change(function() {
        Store.set('other.autowatchmyposts', this.checked)

    });
    $('#qr-fav-autowatchmythreads').change(function() {
        Store.set('other.autowatchmythreads', this.checked)
    });

    $('#qr-fav-autowatchmyposts').prop('checked', Store.get('other.autowatchmyposts', true));
    $('#qr-fav-autowatchmythreads').prop('checked', Store.get('other.autowatchmythreads', false));

    //автодобавления тред в избранное
    if(Store.get('other.autowatchmythreads', false) && Store.get('other.mythread_justcreated', false)) {
        Favorites.add(CFG.BOARD.THREADID);
        Store.del('other.mythread_justcreated');
    }

});
Stage('Скрывающиеся блоки фикс. меню',                 'fmboxes',   Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return;
    var vsblt = true;
    var vsbltg = true;
    //Store.del('styling.fm');

    var data = Store.get('styling.fm.minimized', []);
    if(data.length) {
        for(var i = 0; i < data.length; i++) {
            _.id('fm__' + data[i]).style.display = 'none';
        }
    }

    $('#fmenu').on('click', '.fm__header', function(e){
        var item = _.id('fm__' + this.dataset.header);
        vsblt = item.style.display;
        if(vsblt == 'none') {
            var index = data.indexOf(this.dataset.header);
            if (index !== -1) data.splice(index, 1);
            //Store.del('styling.fm.' + this.dataset.header + '.minimized');
            item.style.display = 'block';
        } else {
            data.push(this.dataset.header)
            item.style.display = 'none';
        }
        Store.set('styling.fm.minimized', data);
    })

    $('.cntnt').on('click', '#js-hidefm', function(e) {
        var item = document.getElementsByClassName('cntnt__aside')[0];
        var itemRoot = document.getElementsByClassName('cntnt')[0];
        vsbltg = item.style.display;
        if( itemRoot.classList.contains('cntnt_type_center') ) itemRoot.classList.toggle('cntnt_nosidebar');
        if(vsbltg == 'none') {
            Store.del('styling.fm.collapsed');
            item.style.display = 'block';
            e.target.innerHTML = '<<';
        } else {
            Store.set('styling.fm.collapsed', true);
            item.style.display = 'none';
            e.target.innerHTML = '>>';
        }
    })

});
Stage('Обработка скрытия тредов и постов',      'posthide',     Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    //if(CFG.BOARD.THREADID) return;
    var hide_buttons = '.post__btn_type_hide,.postbtn-hide-mob';
    if(!$(hide_buttons.length)) return;

    // window._hide_by_list = function(num) {
    //     if(!hidden.hasOwnProperty(num)) return;
    //     if(num == CFG.BOARD.THREADID) return;
    //     var post = Post(num);
    //     if(post.exists() && post.isRendered()) post.hide();
    //     console.log('_hide_by_list');
    // };

    var cleanup = function() {
        var boards = Store.get('board', {});
        var time = getTimeInDays();

        for(var board in boards) {
            if(!boards.hasOwnProperty(board)) continue;
            if(!boards[board].hasOwnProperty('hidden')) continue;
            var threads = boards[board].hidden;
            for(var num in threads) {
                if(!threads.hasOwnProperty(num)) continue;
                var added_time = threads[num];

                if($('#post-' + num).length){
                    Post(num)._storeHide(); //обновляем время, чтоб не удалить тред
                }else if(time-added_time >= CFG.HIDE_TIMEOUT) {
                    Post(num)._storeUnHide();
                }
            }
        }
    };

    $('#js-posts').on('click',hide_buttons,function(){
        var num = $(this).data('num');
        Post(num).hide(true);

        return false;
    });

    $('#js-posts').on('click', '.thread_hidden,.post_type_hidden', function(){
        var num = $(this).data('num');
        //var thread = $('#thread-' + num);
        Post(num).unhide();
    });

    //var hidden = Store.get('board.' + CFG.BOARD.NAME + '.hidden', {});
    //for(var num in hidden) window._hide_by_list(num);
    cleanup();

    return false;
});

Stage('Скрытие длинных постов',                 'hidelongpost', Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    (function($) {

        // Matches trailing non-space characters.
        var chop = /(\s*\S+|\s)$/;

        // Return a truncated html string.  Delegates to $.fn.truncate.
        $.truncate = function(html, options) {
            return $('<div></div>').append(html).truncate(options).html();
        };

        // Truncate the contents of an element in place.
        $.fn.truncate = function(options) {
            if ($.isNumeric(options)) options = {length: options};
            var o = $.extend({}, $.truncate.defaults, options);

            return this.each(function() {
                var self = $(this);

                if (o.noBreaks) self.find('br').replaceWith(' ');

                var text = self.text();
                var excess = text.length - o.length;

                if (o.stripTags) self.text(text);

                // Chop off any partial words if appropriate.
                if (o.words && excess > 0) {
                    excess = text.length - text.slice(0, o.length).replace(chop, '').length - 1;
                }

                if (excess < 0 || !excess && !o.truncated) return;

                // Iterate over each child node in reverse, removing excess text.
                $.each(self.contents().get().reverse(), function(i, el) {
                    var $el = $(el);
                    var text = $el.text();
                    var length = text.length;

                    // If the text is longer than the excess, remove the node and continue.
                    if (length <= excess) {
                        o.truncated = true;
                        excess -= length;
                        $el.remove();
                        return;
                    }

                    // Remove the excess text and append the ellipsis.
                    if (el.nodeType === 3) {
                        $(el.splitText(length - excess - 1)).replaceWith(o.ellipsis);
                        return false;
                    }

                    // Recursively truncate child nodes.
                    $el.truncate($.extend(o, {length: length - excess}));
                    return false;
                });
            });
        };

        $.truncate.defaults = {

            // Strip all html elements, leaving only plain text.
            stripTags: false,

            // Only truncate at word boundaries.
            words: false,

            // Replace instances of <br> with a single space.
            noBreaks: false,

            // The maximum length of the truncated html.
            length: Infinity,

            // The character to use as the ellipsis.  The word joiner (U+2060) can be
            // used to prevent a hanging ellipsis, but displays incorrectly in Chrome
            // on Windows 7.
            // http://code.google.com/p/chromium/issues/detail?id=68323
            ellipsis: '\u2026' // '\u2060\u2026'

        };

    })(jQuery);
    var line_len = 150; //длина строки, после которой считается переход на новую
    var max_lines = 10; //сколько строк максимум

    var makeExpand = function(original, shrink) {
        var num = original.attr('id').substr(1);

        original.wrapInner('<div id="original-post' + num + '" style="display:none"></div>');

        var $shrinked = $('<div id="shrinked-post' + num + '">' + shrink + '</div>');
        original.append($shrinked);

        var $unhide = $('<span class="expand-large-comment a-link-emulator">Показать текст полностью</span>');
        $shrinked.after($unhide);
        $unhide.click(function(){
            $unhide.remove();
            $shrinked.remove();
            $('#original-post' + num).show();
        });
    };

    window._hide_long_post = function(el){
        var html = el.html();

        var lines_count = 0;
        var line_arr = html.replaceAll("\t", "").replaceAll("\n", "").split('<br>');
        for(var i=0;i<line_arr.length;i++) {
            var text = $('<p>' + line_arr[i] + '</p>').text().trim();
            var lines_in_line = Math.ceil((text.length+1)/line_len); //1 символ для переноса
            lines_count += lines_in_line;
            var excess_lines = lines_count - max_lines;
            console.log(lines_count, excess_lines, Array.from(text));
            if (excess_lines > 0) {
                line_arr[i] = $.truncate(line_arr[i], (lines_count - excess_lines)*line_len);
                line_arr.splice(i+1);
                makeExpand(el, line_arr.join('<br>'));
                break;
            }
        }
    };
});
Stage('Обработка формы ответа',                 'formprocess',  Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    var active_id = '';
    var $label_top = $('.newpost__label_top, .js-newpost-top'); //@todo delete newpost__label_top
    var $label_bot = $('.newpost__label_bot, .js-newpost-bot');
    var text_open = $label_top.first().text();
    var text_close = lang.board_posting_close;
    var $postform = $('#postform');

    $('.board-body').on('click', '.newpost__label_top, .js-newpost-top', function(){
        if(active_id == 'bot') $label_bot.text(text_open);

        if(active_id == 'top') {
            $postform.hide();
            $label_top.text(text_open);
            active_id = '';
        }else{
            $('#TopNormalReply').after($postform);
            $postform.show();
            $label_top.text(text_close);
            active_id = 'top';
            if(!CFG.BOARD.THREADID) $('input[name=thread]').val(0);
        }
        return false;
    });

    $('.board-body').on('click', '.newpost__label_bot, .js-newpost-bot', function(){
        if(active_id == 'top') $label_top.text(text_open);

        if(active_id == 'bot') {
            $postform.hide();
            $label_bot.text(text_open);
            active_id = '';
        }else{
            $('#BottomNormalReply').after($postform);
            $postform.show();
            $label_bot.text(text_close);
            active_id = 'bot';
            if(!CFG.BOARD.THREADID) $('input[name=thread]').val(0);
        }
        return false;
    });

    window.appendPostForm = function(num) {
        if(active_id == 'top') $label_top.text(text_open);
        if(active_id == 'bot') $label_bot.text(text_open);
        if(active_id == num) {
            active_id = '';
            $postform.hide();
            return false;
        }

        var post = Post(num);
        post.el().after($postform);
        $postform.show();
        if(!CFG.BOARD.THREADID) $('input[name=thread]').val(post.getThread());
        active_id = num+'';

        return true;
    };
});
const MAutoUpdate = (function () {
    var _timeout = document.hasFocus() ? CFG.AUTOUPDATE_FOCUS_INTERVAL : CFG.AUTOUPDATE_BLUR_INTERVAL;
    var _remain = 0;
    var _currentIcon;
    var newPosts = [];

    const _helper = {
        setFavicon(icon) {
            if(icon == _currentIcon) return;
            if(_currentIcon == CFG.FAVICON_DELETED) return;
            _currentIcon = icon;

            $('#favicon').replaceWith(icon);
        },
        notifyNewPosts() {
            var count = newPosts.length;
            if(count) {
                document.title = `(${count}) ${CFG.TITLE}`;
                this.setFavicon(CFG.FAVICON_NEW_POSTS);
            }else{
                document.title = CFG.TITLE;
                this.setFavicon(CFG.FAVICON_DEFAULT);
            }
        },
        threadDeleted() {
            this.setFavicon(CFG.FAVICON_DELETED);
            $('.autorefresh-countdown').html(' остановлено');
        },
        setNewTimeout: function(newTimeout) {
            if (newTimeout < 0) _remain = _timeout;
            _remain = newTimeout;
            $('.autorefresh-countdown').html('через ' + _remain);
        },
        setUpdateInterval: function(newInterval) {
            _timeout = newInterval;
            if(_remain > _timeout) {
                _remain = _timeout;
                _helper.setNewTimeout(_remain);
            }
        },
        reposRedLine() {
            var $line = $('.post_type_last');
            if($line.length) $line.removeClass('post_type_last');
            this.notifyNewPosts();
            if(newPosts.length) {
                $(`#post-${newPosts[0]}`).addClass('post_type_last');
            }

        },
        bindUI() {
            var isWindowFocused = true;
            $(window).blur(() => {
                isWindowFocused = false;
                this.setUpdateInterval(CFG.AUTOUPDATE_BLUR_INTERVAL);
                this.reposRedLine();
            });
            $(window).focus(() => {
                isWindowFocused = true;
                if(newPosts.length) $(window).scroll();
                this.setUpdateInterval(CFG.AUTOUPDATE_FOCUS_INTERVAL);
                if(!$('.autorefresh-checkbox').is(':checked')) return;
            });

            //@todo уведомления браузерные
            //MScrollCb.scrollcbArray.push((scroll_top) => {
            window.scrollcb_array.push((scroll_top) => {
                if(!newPosts.length) return;

                var scroll = scroll_top+$(window).height();
                for(var i=0;i<newPosts.length;i++) {
                    if(scroll >= _.id(`post-${newPosts[i]}`).offsetTop) {
                        newPosts.splice(i, 1);
                        i--;
                    }
                }
                if(!newPosts.length) this.reposRedLine();
            });

            $('.autorefresh-checkbox').click(function(){
                var checked = $(this).is(':checked');
                if(checked) {
                    _module.start();
                }else{
                    _module.stop();
                }
                Store.set('thread.autorefresh', !!checked);
            });

            $('.autorefresh').css('display', 'inline-block');
        }
    }

    const _module = {
        enabled: false,
        interval: null,
        start() {
            if(this.enabled) return false;
            this.enabled = true;
            //var that = this;

            $('.autorefresh-checkbox').attr('checked','checked');

            this.interval = setInterval(() => {
                var $autorefresh_el = $('.autorefresh-countdown');
                _remain--;
                if(_remain >= 0) $autorefresh_el.html(`через ${_remain}`);
                if(_remain != 0) return;
                $autorefresh_el.html(' выполняется...');

                //MPostFuncs.updatePosts((data) => {
                PostF.updatePosts((data) => {
                    if(data.error) {
                        if(data.error == 'server' && data.errorCode == -404) return _helper.threadDeleted();
                        $alert(`Ошибка автообновления: ${data.errorText}`);
                    }else{
                        if(data.updated){
                            var len = data.updated;
                            for(var i=0;i<len;i++) {
                                newPosts.push(data.data[i].num);
                            }
                            _helper.reposRedLine();
                        }
                        if(Favorites.isFavorited(CFG.BOARD.THREADID)) Favorites.setLastPost(data.data, CFG.BOARD.THREADID);
                    }
                    _remain = _timeout;
                });

            }, 1000);

            _helper.setNewTimeout(_timeout);
        },
        stop() {
            if(!this.enabled) return false;
            this.enabled = false;

            $('.autorefresh-checkbox').removeAttr('checked');

            clearInterval(this.interval);
            $('.autorefresh-countdown').html('');
        },

    };

    if(CFG.BOARD.NAME) _helper.bindUI();

    return _module;

})();

Stage('Клонирование форм',                      'cloneform',    Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    var fields = ['e-mail', 'name', 'trip', 'shampoo', 'timer'];
    var maxlen = parseInt(CFG.BOARD.MAXCOMMENT);
    var len = fields.length;

    var newlen = function(str) {
        var len = unescape(encodeURIComponent(str)).length;
        var remain = maxlen-len;
        if(remain < 0) remain = 0;
        $('.postform__len').html(remain);
    };

    for(var i=0;i<len;i++) {
        var field = fields[i];
		
		if(document.getElementById(field)) {
			(function(field){
				$('#' + field).keyup(function(){
					var val = $('#' + field).val();
					$('#qr-' + field).val(val);
					if(field == 'shampoo') newlen(val);
				});

				$('#qr-' + field).keyup(function(){
					var val = $('#qr-' + field).val();
					$('#' + field).val(val);
					if(field == 'shampoo') newlen(val);
				});
				
				$('#' + field).change(function(){
					var val = $('#' + field).val();
					$('#qr-' + field).val(val);
					if(field == 'shampoo') newlen(val);
				});

				$('#qr-' + field).change(function(){
					var val = $('#qr-' + field).val();
					$('#' + field).val(val);
					if(field == 'shampoo') newlen(val);
				});
			})(field);
		}
    }

    $('.js-icon-select').change(function(){
        var val = $(this).val();
        $('.js-icon-select').val(val);
    });
});
Stage('Отслеживание фокуса форм',               'formfocus',    Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    window.activeForm = $('#shampoo');

    window.activeForm.focus(function(){
        window.activeForm = $(this);
    });

    $('#qr-shampoo').focus(function(){
        window.activeForm = $(this);
    });
});
Stage('click эвенты',                           'clickevents',  Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    var lastselected = '';
    var selectednum = 0;

    $('.captcha__reload').click((e) => {
        loadCaptcha2ch(true);
        e.currentTarget.nextElementSibling.focus();
    });
    
    $('#js-posts').on('mouseenter mousedown pointerenter pointerdown', '.post', function() {
        var curr = $.trim($(this).find('.post__floating_reactions_wrapper').html());
        
        if(curr == '') {
            $(this).find('.post__floating_reactions_wrapper').html($('#floating-reactions-template').html());
        }
    });
    
    $('#js-posts').on('mouseleave pointerleave', '.post', function() {
        //$(this).find('.post__floating_reactions_wrapper').html('');
    });

    $('#js-posts').on('mouseup','.post',function(e){
        if (e.which != 1) return;
        var num = $(this).data('num');
        var node;
        try {
            node = window.getSelection ? window.getSelection().focusNode.parentNode:document.selection.createRange().parentElement();
        }catch(e){
            return;
        }

        if($(node).closest('.post').data('num') != num) return;

        var text = "";
        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }
        text = text + '';

        if(!text){
            selectednum = 0;
            lastselected = '';
            return;
        }
        lastselected = text;
        selectednum = num;
        lastselected = '>' + lastselected.split("\n").join("\n>");
    });

    $('.newpost__label').click(function(){
        loadCaptcha2ch();
    });

    $('#ed-toolbar').html(edToolbar('shampoo'));

    $('#qr-close').click(function(){
		$('#postform .captcha').append($('.wg-cap-root'));
        $('#qr').hide();
    });
	
	$('#js-posts').on('click', '.secret-text', function() {
		var el = $(this);
		var encrypted = $(this).data('encrypted');
		var userkeys = ($(this).data('keys')).split(',');
		var usercode = getCookie('usercode_auth') || '';
		var realKey = '';
		var realText = '';
		
		var hasAccess = false;
		
		for(i = 0; i < userkeys.length; i++) {
			userkey = userkeys[i];
			
			realKey = decryptSecretText(userkey, usercode);
			
			if(realKey != '') {
				hasAccess = true;
				break;
			}
		}
		
		if(hasAccess) {
			realText = decryptSecretText(encrypted, realKey);
			
			if(realText == '') {
				hasAccess = false;
			}
		}
		
		if(!hasAccess) {
			alert('Это не для вас написано.');
		} else {
			el.replaceWith('<span>' + realText + '</span>');
		}
	});

    $('#js-posts').on('click','.js-post-reply-btn', function(e) {
        var num = e.target.dataset.num;
        var str = '>>' + num + '\n';
		
		setTimeout(function() {
			$('#qr-postform .captcha').append($('.wg-cap-root'));
		}, 10);

        //вставляем цатату
        if(selectednum == num) {
            str += lastselected + '\n';
            selectednum = 0;
        }

        if(Store.get('old.append_postform',false)) {
            if(appendPostForm(num)) insert(str);
            loadCaptcha2ch();
        } else {
            insert(str);
        }

        if(CFG.BOARD.THREADID) return false;

        var thread = Post(num).getThread();
        $('#qr-thread').val(thread);

        return false;
    });

    //expand
    $('#js-posts').on('click', '.post__btn_type_expand', function(e) {
        var num = e.target.dataset.num || e.target.parentNode.dataset.num;
        PostF.expandThread(num);
    })
    //collapse
    $('#js-posts').on('click', '.post__btn_type_collapse', function(e) {
        var num = e.target.dataset.num || e.target.parentNode.dataset.num;
        PostF.collapseThread(num);
    })
    $('#js-posts').on('click', '.post__btn_type_expandimg', function(e) {
        MediaViewer.expandAllPics();
    })

    $('.cntnt__main').on('click', '.js-update-thread', (e) => { e.preventDefault(); PostF.updateThread(); })


    //jscatalog: запоминаем запрос при клике на спец. ссылку
    // $(".hashlink").on('mousedown',function() {
    // 	Store.set('catalog-search-query',$(this).attr('title'));
    // 	return true;
    // });
    $('.tti').on('mousedown', (event) => {
        const target = $(event.target);
        if (target.hasClass('hashlink') && !!target.attr('title')) {
            Store.set('catalog-search-query', target.attr('title'));
        }
    })
    $('#js-posts').on('mousedown', (event) => {
        const target = $(event.target);
        if (target.hasClass('hashlink') && !!target.attr('title')) {
            Store.set('catalog-search-query', target.attr('title'));
        }
    })


    var posts = [];
    $('.turnmeoff').change(function() {
        if(!$('.replypage')) return;
        if(this.checked) {
            posts += this.value + ', ';
            $('#report-form-posts').val(posts);
        } else {

        }
    });

    //tags - eng only + remove slash
    $("#tags").on('input',function(e) {
        var newstr = $(this).val().replace(/\/|\\|#/g, '');
        //newstr = newstr.replace(/\\/g, '');
        var map = [
            ["ӓ", "a"], ["ӓ̄", "a"], ["ӑ", "a"], ["а̄", "a"], ["ӕ", "ae"], ["а́", "a"], ["а̊", "a"], ["ә", "a"], ["ӛ", "a"], ["я", "a"], ["ѫ", "a"], ["а", "a"], ["б", "b"], ["в", "v"], ["ѓ", "g"], ["ґ", "g"], ["ғ", "g"], ["ҕ", "g"], ["г", "g"], ["һ", "h"], ["д", "d"], ["ђ", "d"], ["ӗ", "e"], ["ё", "e"], ["є", "e"], ["э", "e"], ["ѣ", "e"], ["е", "e"], ["ж", "zh"], ["җ", "zh"], ["ӝ", "zh"], ["ӂ", "zh"], ["ӟ", "z"], ["ӡ", "z"], ["ѕ", "z"], ["з", "z"], ["ӣ", "j"], ["и́", "i"], ["ӥ", "i"], ["і", "i"], ["ї", "ji"], ["і̄", "i"], ["и", "i"], ["ј", "j"], ["ј̵", "j"], ["й", "j"], ["ќ", "k"], ["ӄ", "k"], ["ҝ", "k"], ["ҡ", "k"], ["ҟ", "k"], ["қ", "k"], ["к̨", "k"], ["к", "k"], ["ԛ", "q"], ["љ", "l"], ["Л’", "l"], ["ԡ", "l"], ["л", "l"], ["м", "m"], ["њ", "n"], ["ң", "n"], ["ӊ", "n"], ["ҥ", "n"], ["ԋ", "n"], ["ԣ", "n"], ["ӈ", "n"], ["н̄", "n"], ["н", "n"], ["ӧ", "o"], ["ө", "o"], ["ӫ", "o"], ["о̄̈", "o"], ["ҩ", "o"], ["о́", "o"], ["о̄", "o"], ["о", "o"], ["œ", "oe"], ["ҧ", "p"], ["ԥ", "p"], ["п", "p"], ["р", "r"], ["с̀", "s"], ["ҫ", "s"], ["ш", "sh"], ["щ", "sch"], ["с", "s"], ["ԏ", "t"], ["т̌", "t"], ["ҭ", "t"], ["т", "t"], ["ӱ", "u"], ["ӯ", "u"], ["ў", "u"], ["ӳ", "u"], ["у́", "u"], ["ӱ̄", "u"], ["ү", "u"], ["ұ", "u"], ["ӱ̄", "u"], ["ю̄", "u"], ["ю", "u"], ["у", "u"], ["ԝ", "w"], ["ѳ", "f"], ["ф", "f"], ["ҳ", "h"], ["х", "h"], ["ћ", "c"], ["ҵ", "c"], ["џ", "d"], ["ч", "c"], ["ҷ", "c"], ["ӌ", "c"], ["ӵ", "c"], ["ҹ", "c"], ["ч̀", "c"], ["ҽ", "c"], ["ҿ", "c"], ["ц", "c"], ["ъ", "y"], ["ӹ", "y"], ["ы̄", "y"], ["ѵ", "y"], ["ы", "y"], ["ь", "y"], ["", ""], ["Ӓ", "a"], ["Ӓ̄", "a"], ["Ӑ", "a"], ["А̄", "a"], ["Ӕ", "ae"], ["А́", "a"], ["А̊", "a"], ["Ә", "a"], ["Ӛ", "a"], ["Я", "a"], ["Ѫ", "a"], ["А", "a"], ["Б", "b"], ["В", "v"], ["Ѓ", "g"], ["Ґ", "g"], ["Ғ", "g"], ["Ҕ", "g"], ["Г", "g"], ["Һ", "h"], ["Д", "d"], ["Ђ", "d"], ["Ӗ", "e"], ["Ё", "e"], ["Є", "e"], ["Э", "e"], ["Ѣ", "e"], ["Е", "e"], ["Ж", "zh"], ["Җ", "zh"], ["Ӝ", "zh"], ["Ӂ", "zh"], ["Ӟ", "z"], ["Ӡ", "z"], ["Ѕ", "z"], ["З", "z"], ["Ӣ", "j"], ["И́", "i"], ["Ӥ", "i"], ["І", "i"], ["Ї", "ji"], ["І̄", "i"], ["И", "i"], ["Ј", "j"], ["Ј̵", "j"], ["Й", "j"], ["Ќ", "k"], ["Ӄ", "k"], ["Ҝ", "k"], ["Ҡ", "k"], ["Ҟ", "k"], ["Қ", "k"], ["К̨", "k"], ["К", "k"], ["ԛ", "q"], ["Љ", "l"], ["Л’", "l"], ["ԡ", "l"], ["Л", "l"], ["М", "m"], ["Њ", "n"], ["Ң", "n"], ["Ӊ", "n"], ["Ҥ", "n"], ["Ԋ", "n"], ["ԣ", "n"], ["Ӈ", "n"], ["Н̄", "n"], ["Н", "n"], ["Ӧ", "o"], ["Ө", "o"], ["Ӫ", "o"], ["О̄̈", "o"], ["Ҩ", "o"], ["О́", "o"], ["О̄", "o"], ["О", "o"], ["Œ", "oe"], ["Ҧ", "p"], ["ԥ", "p"], ["П", "p"], ["Р", "r"], ["С̀", "s"], ["Ҫ", "s"], ["Ш", "sh"], ["Щ", "sch"], ["С", "s"], ["Ԏ", "t"], ["Т̌", "t"], ["Ҭ", "t"], ["Т", "t"], ["Ӱ", "u"], ["Ӯ", "u"], ["Ў", "u"], ["Ӳ", "u"], ["У́", "u"], ["Ӱ̄", "u"], ["Ү", "u"], ["Ұ", "u"], ["Ӱ̄", "u"], ["Ю̄", "u"], ["Ю", "u"], ["У", "u"], ["ԝ", "w"], ["Ѳ", "f"], ["Ф", "f"], ["Ҳ", "h"], ["Х", "h"], ["Ћ", "c"], ["Ҵ", "c"], ["Џ", "d"], ["Ч", "c"], ["Ҷ", "c"], ["Ӌ", "c"], ["Ӵ", "c"], ["Ҹ", "c"], ["Ч̀", "c"], ["Ҽ", "c"], ["Ҿ", "c"], ["Ц", "c"], ["Ъ", "y"], ["Ӹ", "y"], ["Ы̄", "y"], ["Ѵ", "y"], ["Ы", "y"], ["Ь", "y"], ["№", ""], ["\'", ""], ["\"", ""], [";", ""], [":", ""], [",", ""], [".", ""], [">", ""], ["<", ""], ["?", ""], ["!", ""], ["@", ""], ["#", ""], ["$", ""], ["%", ""], ["&", ""], ["^", ""], ["(", ""], [")", ""], ["*", ""], ["+", ""], ["~", ""], ["|", ""], ["{", ""], ["}", ""], ["|", ""], ["[", ""], ["]", ""], ["/", ""], ["`", ""], ["=", ""], ["+", ""], ["_", ""], ["/[^A-Za-z0-9\-]", ""]
        ];
        for(var i=0; i<map.length; i++){
            newstr = newstr.replace(map[i][0], map[i][1]);
        };

        $(this).val(newstr.trim().toLowerCase());

        return true;
    });

    $('.mod-mark-box').change(function() {
        if(this.checked) alert('Вы добавили мод-тег!');
    });

    $('.adm-mark-box').change(function() {
        if(this.checked) alert('Вы добавили админ-тег!');
    });

    $(".nb__switcher").on('click', 'a',function(e) {
        var block = $(this).data('switch');

        News.render(News[block]);

        $('.nb__switcher').find('a').removeClass('nb__switcher_active');
        $(this).addClass('nb__switcher_active');
        return false;
    });

    $('#js-header-more').on('click', function(e) {
        e.currentTarget.style.display = 'none';
        document.getElementsByClassName('header__exp')[0].style.display = 'inline-block';
    })

    window.News = {
        hour: [],
        day: [],
        latest: [],
        getdata() {
            var that = this;
            $.get('/news.json',	function(data){
                that.hour = data.news_hour;
                that.day = data.news_day;
                that.latest = data.news_latest;
                that.render(that.latest);
            });
        },
        render(data) {
            if (!data) return;
            var html = '';
            for(var i = 0; i < data.length; i++) {
                html += '<div class="nb__item">&#8226; <a href="/news/res/' + data[i].num + '.html">' + data[i].subject + '</a></div>';
            }
            $('.nb__data').html(html);
        }
    };

    News.getdata(); //@todo это и выше вынести отдельно

    _.id('js-nightmode').addEventListener('click', (e) => {
        if ( CFG.NIGHTMODE ) {
            Store.set('styling.nightmode', false);
            delete document.documentElement.dataset.theme;
            document.getElementsByClassName('nm__bullet')[0].style.left = '2px';
            CFG.NIGHTMODE = false;
        } else {
            Store.set('styling.nightmode', true);
            document.documentElement.dataset.theme = 'nightmode';
            document.getElementsByClassName('nm__bullet')[0].style.left = '18px';
            CFG.NIGHTMODE = true;
        }
    });

    _.q('#js-posts').addEventListener('click', (e) => {
        const {target} = e;
        if (!target.matches('.js-post-saveimg')) {
            return;
        }
        const {name,url} = target.dataset;
        MediaDownloader.downloadFile(url, name); //mediaobject передавать
    })

});
Stage('oekaki',                          'oekaki',  Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    //==================================================================================================
    //lcanvas
    $('#qr-oekaki-close').click(function(){
        lc.clear(); //очищаем рисунок
        $('#qr-oekaki-body').html('');
        $('#qr-oekaki').hide(); //прячем рисовалку
    });

    $('.oekaki-draw').click(function(e){
        var width = $('.oekaki-width').val();
        var height = $('.oekaki-height').val();
        oekakiInit(width, height);
    });

    $('.qr-oekaki-accept').on('click', function() {
        var lcanvasdata = lc.getImage().toDataURL().split(',')[1];
        $('.oekaki-image').val(lcanvasdata);
        $('.oekaki-metadata').val(new Date($.now()));
        $('.oekaki-clear').prop('disabled', false);
        $('.form-files-input').prop('disabled', true); //если есть оекаки картинка, то простые грузить нельзя
        $('.filer__thumbnails').html(''); //текущие загруженные игнорим
        lc.clear(); //очищаем рисунок
        $('#qr-oekaki-body').html(''); //удаляем плагин
        $('#qr-oekaki').hide(); //прячем рисовалку
        FormFiles.oekaki = 1; //для FormValidate
    });
    $('.oekaki-clear').click(function(){
        lc.clear();
        $('#qr-oekaki-body').html('');
        $('#qr-oekaki').hide();
        $('.oekaki-image').val('');
        $('.oekaki-metadata').val('');
        $(this).prop('disabled', true);
        $('.form-files-input').prop('disabled', false);
        FormFiles.oekaki = 0;
    });
});
Stage('stickers',                          'stickers',  Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    //ПРОВЕРКА УДАЛЕННОГО СТИКЕРА + СУТОЧНАЯ СИНХРОНИЗАЦИЯ + INSTALL
    var stickers = '/api/stickers/';
    var mystickers;
    var freqSticker;

    var updateStickers = function(id) {
        $.get('/api/sticker/show/' + id, function( data ) {
            Store.del('other.sticker.packs.' + id);
            if(data.pack.id) Store.set('other.sticker.packs.' + id, data); //перезаписываем только норм ответ
        })

    }

    var deleteStickers = function(id) {
        if (confirm(`Вы хотите удалить пак?`)) {
            _.q(`#pack-${id}`).remove();
            Store.del('other.sticker.packs.' + id);
        }
    }

    var getFreqStickers = function() {
        var freqHtml = '';
        freqSticker =  Store.get('other.sticker.last', []);
        for (var i = freqSticker.length - 1; i >= 0; i--) {
            freqHtml += '<img class="sticker__img" data-sticker="' + freqSticker[i].id  + '" src="' + freqSticker[i].url + '">';
        }
        return freqHtml;
    };

    var setFreqStickers = function(sticker, url) {
        freqSticker.push({'id': sticker,'url': url});
        for (var i = 0; i < freqSticker.length - 1; i++) {
            if(freqSticker[i].id == sticker) {
                freqSticker.splice(i, 1);
            }
        }
        if(freqSticker.length > 20) {
            freqSticker.splice(0, 1);
        }
        Store.set('other.sticker.last', freqSticker);
    };

    $('#postform').add('#qr-postform').on('click', '.js-sticker-btn', function() {
        $('#qr-sticker').show();
        //Store.reload(); //чтобы меж вкладок обновлялся сразу store
        mystickers = Store.get('other.sticker.packs');
        if(!mystickers) return;
        if(mystickers) var reversed  = Object.keys(mystickers).reverse();
        var html = '';
        html += '<div class="sticker__pack">';
        html += '<div class="sticker__name">Часто используемые</div>';
        html += getFreqStickers();
        html += '</div>';

        //for(var i in mystickers) { //todo посмотреть воз-ть переделать в массив объектов ; todo try catch
        for( var i = 0; i < reversed.length; i++) {
            html += '<div class="sticker__pack">';
            html += '<div class="sticker__name">' + mystickers[reversed[i]].pack.name;
            html += '<a href="#" title="Обновить" class="sticker__update" data-id="' + mystickers[reversed[i]].pack.id + '">[U]</a> ';
            html += '<a href="#" title="Удалить" class="sticker__delete" data-id="' + mystickers[reversed[i]].pack.id + '">[U]</a>';
            html += '</div>';
            var lenght = mystickers[reversed[i]].stickers.length;
            for( var j = 0; j <  lenght; j++) {
                html += '<img class="sticker__img" data-sticker="' + mystickers[reversed[i]].pack.id + '_' + mystickers[reversed[i]].stickers[j].id + '" src="' + mystickers[reversed[i]].stickers[j].thumbnail + '">';
                if( j % 5 === 4 ) {html += '<br>'}
            }
            html += '</div>';
        }
        $('#qr-sticker-body').html('')
        $('#qr-sticker-body').append(html);
    });
    //постим
    $('#qr-sticker').on('click', 'img', function(e) {
        var sticker = $(this).data('sticker');
        var url = e.target.src;
        $('.postform').append('<input type="hidden" name="sticker0" value="' +  sticker + '" class="' +  sticker + ' sticker-input">'); //todo на Id бы..
        $('.postform__sticker-prev').html('<img class="postform__sticker-img" src="' + url + '" class="'  +  sticker + '">');
        FormFiles.sticker = 1;
        setFreqStickers(sticker, url); //запоминаем стикер
        $('#qr-sticker').hide();
    });
    //удаляем превью
    $('.postform__sticker-prev').on('click', 'img', function(e) {
        var sticker = e.target.className;
        $('.' + sticker).remove();
    });
    //обновляем пак
    $('#qr-sticker').on('click', '.sticker__update', function(e) {
        var id = e.target.dataset['id'];
        updateStickers(id);
        return false;
    });
    //удаляем пак
    $('#qr-sticker').on('click', '.sticker__delete', function(e) {
        var id = e.target.dataset['id'];
        deleteStickers(id);
        return false;
    });
    $('#qr-sticker-close').click(function(){
        $('#qr-sticker').hide();
    });
});
Stage('Превью постов',                          'postpreview',  Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    if(($(window).width() < 480 || $(window).height() < 480 )) return; //не запускаем на мобильных
    //==================================================================================================
    // POST PREVIEW BY >>REFLINKS
    //скопировано из старого кода
    var pView;
    var busy = false;
    var dForm = $('#js-posts')[0];
    let animate = Store.get('other.post_preview_animation', true);

    var delPostPreview = function(e) {
        pView = e.relatedTarget;
        if(!pView) return;

        while(1) {
            if(/^preview/.test(pView.id)) break;

            else {
                pView = pView.parentNode;

                if(!pView) break;
            }
        }

        setTimeout(function() {
            if(animate) {
                if(!pView) {
                    $each($t('div'), function(el) {
                        if(/^preview/.test(el.id)) $(el).animate({ 'opacity': 0}, 160, () => { $del(el); });
                    });
                } else {
                    let ns = pView.nextSibling;
                    let close = () => {
                        if(ns) {
                            $(ns).animate({ 'opacity': 0}, 160, () => { $del(ns); close(); });
                        }
                    }
                    close();
                }
            } else {
                if(!pView) $each($t('div'), function(el) {
                    if(/^preview/.test(el.id)) $del(el);
                });
                else while(pView.nextSibling) $del(pView.nextSibling);
            }
        }, 400); //Store.get('other.hide_post_preview_delay', 200)
    };

    var funcPostPreview = function(htm) {
        if(!pView) return;

        pView.innerHTML = htm;
    };

    var showPostPreview = function(e, pNum, tNum) {
        var link = e.target;
        var scrW = document.body.clientWidth || document.documentElement.clientWidth;
        var scrH = window.innerHeight || document.documentElement.clientHeight;
        var x = $offset(link, 'offsetLeft') + link.offsetWidth/2;
        var y = $offset(link, 'offsetTop');

        if(e.clientY < scrH*0.75) y += link.offsetHeight;
        //let withImg = _.id(`post-${pNum}`).classList.contains('post_withimg')
        pView = $new('div',
            {
                'id': 'preview-' + pNum,
                'data-num': pNum,
                'class': `post post_type_reply  post_preview`, //${withImg ? 'post_withimg' : ''}
                'html': '<span class="engine-icn-wait">&nbsp;</span>&nbsp;Загрузка...',
                'style':
                    ('position:absolute; z-index:300; border:1px solid grey; /*display: flex; flex-direction: column;*/'
                        + (x < scrW/2 ? 'left:' + x : 'right:' + parseInt(scrW - x + 2)) + 'px; '
                        + (e.clientY < scrH*0.75 ? 'top:' + y : 'bottom:' + parseInt(scrH - y - 4)) + 'px')
            },
            {
                'mouseout': delPostPreview,
                'mouseover': () => { if(!pView) pView = this; }
            });

        var post = Post(pNum);
        if(!post.exists() || post.isGhost()) {
            console.log(post.num);

            post.fetchPosts({update: true}, function(res){
                if(res.errorText) return funcPostPreview('Ошибка: ' + res.errorText);
                //funcPostPreview(post.previewHTML());
                funcPostPreview(Post(pNum).previewHTML());
                PostF._renderReplies(res.data); //@todo проверить на терроризм
                if(!post.isRendered()) Media.processLinks($('#m' + pNum + ' a'));
            });
            console.log(post.num)
        }else{
            funcPostPreview(post.previewHTML());
        }
        $del($id(pView.id)); //удаляет старый бокс поста
        //dForm.appendChild(pView);
        if(animate) {
            $(pView).hide().appendTo(dForm).fadeIn(160);
        } else {
            pView.style.display = 'block';
            dForm.appendChild(pView);
        }

        if(!post.isRendered()) {
            Media.processLinks($('#m' + pNum + ' a'));
        }else{
            //todo костыль. Надо что-то с этим делать.
            var $preview_box = $('#preview-' + pNum);
            $preview_box.find('.media-expand-button').remove();
            Media.processLinks($preview_box.find('a'));
        }
    };

    var timers = {};
    var clearTimer = function(num){
        if(timers.hasOwnProperty(num)) {
            clearTimeout(timers[num]);
            delete timers[num];
        }
    };
    var timer_ms = Store.get('other.show_post_preview_delay', 50);

    //@todo обертку для аналога on()
    _.id('js-posts').addEventListener('mouseover', function(e) {
        if (e.target && e.target.matches('.post-reply-link')) {
            var el = e.target;
            var num = el.dataset['num'];
            var thread = el.dataset['thread'];

            if(timer_ms) {
                timers[num] = setTimeout(function(){
                    clearTimer(num);
                    showPostPreview(e, num, thread);
                }, timer_ms);
            }else{
                showPostPreview(e, num, thread);
            }
        }
    });


    $('#js-posts').on('mouseover', '.post-reply-link', function(e){
        // var $el = $(this);
        // var num = $el.data('num');
        // var thread = $el.data('thread');

        // if(timer_ms) {
        //     timers[num] = setTimeout(function(){
        //         clearTimer(num);
        //         showPostPreview(e, num, thread);
        //     }, timer_ms);
        // }else{
        //     showPostPreview(e, num, thread);
        // }
    })
        .on('mouseout', '.post-reply-link', function(e){
            var $el = $(this);
            var num = $el.data('num');
            clearTimer(num);

            delPostPreview(e);
        })
        .on('click', '.post-reply-link', function(){
            var $el = $(this);
            var num = $el.data('num');
            Post(num).highlight();
        });
});
Stage('Опции постов',                           'postoptions',  Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    //опции постов

    var active = 0;

    var updatePostText = function(num) {
		var formData = new FormData(document.getElementById('edit' + num));
		
            $.ajax({
                method: "POST",
                url:'/user/edit',
                data: formData,
                success(data) {
                    if(data.result == 1) {
						$('#m' + num).html(data.message);
						
						//$('#post-' + num).find('.post__edited').show();
					} else  if(data.result == 2) {
						$('#m' + num).html(data.message);
						
						//$('#post-' + num).find('.post__edited_by_mod').show();
					} else {
						$alert(data.error.message);
					}
                },
                contentType: false,
                processData: false
            })
	}
	
    var fillMenu = function(menu, num) {
        var post = Post(num);
        /////////////////////////////////////////////////////////
        var $replyRow = $('<a href="#">Ответить</a>');

        $replyRow.click(function(){
            $(_.id(num).nextElementSibling).click();
            hideMenu();
            return false;
        });
        menu.append($replyRow);
        /////////////////////////////////////////////////////////
        var $hideRow = $('<a href="#">Скрыть</a>');
        $hideRow.click(function(){
            post.hide(true);
            hideMenu();
            return false;
        })
        menu.append($hideRow);
        /////////////////////////////////////////////////////////
        var $reportRow = $('<a href="#">Зарепортить</a>');
        $reportRow.click(function(){
            var thread = post.getThread();
            var data;
            var el = $(this);
            var pos = genPos(el);

            hideMenu();
            var old = active;
            active = num;
            if(old == num) {
                active = 0;
                return false;
            }
            var comment = prompt('Введите причину');
            if(comment == '' || comment === null) return false;
            //var XHR = new XMLHttpRequest();
            var formData = new FormData();
            var data = {'board': CFG.BOARD.NAME, 'thread': thread, 'post': num, 'comment': comment};
            for ( var key in data ) {
                formData.append(key, data[key]);
            }

            $alert( "Работаем..." );
            $.ajax({
                method: "POST",
                url:'/user/report',
                data: formData,
                success() {
                    $alert( "Накляузничано." );
                    //hideMenu();
                },
                contentType: false,
                processData: false
            })
            return false;
        });
        menu.append($reportRow);
        /////////////////////////////////////////////////////////
        var $editRow = $('<a href="#">Редактировать</a>');
        $editRow.click(function(){
            var thread = post.getThread();
            var data;
            var el = $(this);
            var pos = genPos(el);

            hideMenu();
            var old = active;
            active = num;
            if(old == num) {
                active = 0;
                return false;
            }

            var formData = new FormData();
            var data = {'board': CFG.BOARD.NAME, 'thread': thread, 'post': num};
            for ( var key in data ) {
                formData.append(key, data[key]);
            }

            $.ajax({
                method: "POST",
                url:'/user/edit/check',
                data: formData,
                success(data) {
                    if(data.result == 1) {
						$('#m' + num).html('<form id="edit' + num + '" onsubmit="return false;"><input type="hidden" name="board" value="' + CFG.BOARD.NAME + '"><input type="hidden" name="thread" value="' + thread + '"><input type="hidden" name="post" value="' + num + '"><div><textarea name="comment" id="comment-textarea-' + num + '" style="width:100%;background-color:var(--theme_default_altbtnbg);color:var(--theme_default_inputtext);outline:medium;border-radius:10px;padding:8px 10px;" rows="5">' + data.message + '</textarea></div><div class="postform__mu-wrapper" style="margin:3px 0 5px 0;word-wrap:initial;word-break:initial;"><button class="postform__mu postform__mu_type_b" type="button" onclick="doAddTags(\'[b]\',\'[/b]\',\'comment-textarea-' + num + '\')">B</button><button class="postform__mu postform__mu_type_i" type="button" onclick="doAddTags(\'[i]\',\'[/i]\',\'comment-textarea-' + num + '\')">I</button><button class="postform__mu postform__mu_type_q" type="button" onclick="doAddTags(\'>\',\'\',\'comment-textarea-' + num + '\')">&gt;</button><button class="postform__mu postform__mu_type_u" type="button" onclick="doAddTags(\'[u]\',\'[/u]\',\'comment-textarea-' + num + '\')">U</button><button class="postform__mu postform__mu_type_o" type="button" onclick="doAddTags(\'[o]\',\'[/o]\',\'comment-textarea-' + num + '\')">O</button><button class="postform__mu postform__mu_type_sp" type="button" onclick="doAddTags(\'[spoiler]\',\'[/spoiler]\',\'comment-textarea-' + num + '\')"><span class="spoiler">??</span></button><button class="postform__mu postform__mu_type_s" type="button" onclick="doAddTags(\'[s]\',\'[/s]\',\'comment-textarea-' + num + '\')">S</button><button class="postform__mu" type="button" onclick="doAddTags(\'[sup]\',\'[/sup]\',\'comment-textarea-' + num + '\')">A<sup>a</sup></button><button class="postform__mu" type="button" onclick="doAddTags(\'[sub]\',\'[/sub]\',\'comment-textarea-' + num + '\')">A<sub>a</sub></button><button class="postform__mu" style="width:auto;" type="button" onclick="doAddTags(\'[secret]\',\'[/secret]\',\'comment-textarea-' + num + '\')">Приват</sub></button></div><div><button type="button" class="button button-comment-edit-submit">Сохранить текст поста</button</div></form>');
						$('#edit' + num).find('.button-comment-edit-submit').on('click', function() {
							updatePostText(num);
						});
					} else {
						alert(data.error.message);
					}
                },
                contentType: false,
                processData: false
            })
            return false;
        });
        menu.append($editRow);
        /////////////////////////////////////////////////////////
        var $deleteRow = $('<a href="#">Удалить</a>');
        $deleteRow.click(function(){
            var thread = post.getThread();
            var data;
            var el = $(this);
            var pos = genPos(el);

            hideMenu();
            var old = active;
            active = num;
            if(old == num) {
                active = 0;
                return false;
            }
            if(!confirm('Вы уверены, что хотите удалить этот пост?')) return false;
            //var XHR = new XMLHttpRequest();
            var formData = new FormData();
            var data = {'board': CFG.BOARD.NAME, 'thread': thread, 'post': num};
            for ( var key in data ) {
                formData.append(key, data[key]);
            }

            $.ajax({
                method: "POST",
                url:'/user/delete',
                data: formData,
                success(data) {
                    if(data.result == 1) {
						$alert('Пост удалён.');
	
						if(CFG.BOARD.THREADID > 0) {
							PostF.updatePosts(null);
						} else {
							location.reload();
						}
					} else {
						alert(data.error.message);
					}
                },
                contentType: false,
                processData: false
            })
            return false;
        });
        menu.append($deleteRow);
		
        var $images =  $('#post-' + num).find('.post__file-preview');
        if(($images.length == 1) && (CFG.BOARD.OEKAKI==1)) {
            var $redrawRow = $('<a href="#">Перерисовать</a>');
            var $imagesPreviews =  $('#post-' + num ).find('.post__file-preview');
            $redrawRow.click(function(){
                var multiplier = 1;
                var h_p = $imagesPreviews.attr('height');
                var w_p = $imagesPreviews.attr('width'); //размеры превью

                var imgsize = $imagesPreviews.attr('alt').split('x'); //оригинальные размеры

                var win_width = $( window ).width();
                var win_height = $( window ).height();

                var w_scale = Math.floor(win_width/imgsize[0]*10)/10; //коэф. сжатия
                var h_scale = Math.floor(win_height/imgsize[1]*10)/10;

                if(imgsize[0] > (win_width - 100) || imgsize[1] > (win_height - 100)) {
                    multiplier = w_scale<h_scale ? w_scale : h_scale;
                }
                oekakiInit(imgsize[0]*multiplier,imgsize[1]*multiplier);

                var newImage = new Image();
                newImage.src = $images.data('src');
                lc.saveShape(LC.createShape('Image', {scale: multiplier, x: 0, y: 0, image: newImage}));
                $(document.getElementsByName(num)).click();
                return false;
            });
            menu.append($redrawRow);
        }
    };

    var genPos = function(el) {
        var ret = {};
        var pos = el.offset();

        ret.left = (pos.left + el.outerWidth()) + 'px';
        ret.top = pos.top + 'px';

        return ret;
    };

    var hideMenu = function(num) {
        if(!active) return;
        active = 0;
        $('#engine-select').remove();
    };

    $('body').click(hideMenu);

    $('body').on('click', '.post__btn_type_menu', function(){
        var el = $(this);
        var num = el.data('num');
        var old = active;
        hideMenu(num);
        active = num;
        if(old == num) {
            active = 0;
            return false;
        }

        var $menu = $('<span></span>');
        $menu.attr('id', 'engine-select');
        $menu.attr('class', 'modal');
        $menu.css(genPos(el));
        fillMenu($menu, num);
        $menu.click(hideMenu);
        $('body').append($menu);
        return false;
    });

    $('.board-body').on('click', '#engine-select',function(e){
        e.stopPropagation();
    });
});
Stage('renderStore',                            'renderstore',  Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    renderStore();

    if(Store.get('styling.disable_bytelen_counter',false)) $('.postform__len').hide();
    if(Store.get('styling.portform_format_panel',true)) {
        $('.js-postform-mu').html(edToolbar('shampoo'));
        $('.js-postform-mu-qr').html(edToolbar('qr-shampoo'));
    }
});
Stage('Кнопки перемотки страницы',              'scrollbtns',   Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    if(!Store.get('other.scroll_btns',true)) return;

    var border = 300;
    var $up_bnt = $('#up-nav-arrow');
    var $down_bnt = $('#down-nav-arrow');
    var up_visible = false;
    var down_visible = false;

    var up_show = function(){
        if(up_visible) return;
        up_visible = true;
        $up_bnt.css('display','block');
    };
    var up_hide = function(){
        if(!up_visible) return;
        up_visible = false;
        $up_bnt.css('display','none');
    };
    var down_show = function(){
        if(down_visible) return;
        down_visible = true;
        $down_bnt.css('display','block');
    };
    var down_hide = function(){
        if(!down_visible) return;
        down_visible = false;
        $down_bnt.css('display','none');
    };

    window.scrollcb_array.push(function(scroll_top){
        if(scroll_top > border){
            up_show();
        }else{
            up_hide();
            down_show();
            return;
        }
        var max_scroll = $(document).height()-$(window).height();
        var delta = max_scroll - scroll_top;

        if(delta > border){
            down_show();
        }else{
            down_hide();
            up_show();
        }
    });

    $('.board-body').on('click', '#up-nav-arrow', function(){
        $(window).scrollTop(0).scroll();
    });

    $('.board-body').on('click', '#down-nav-arrow', function(){
        $(window).scrollTop($(document).height()).scroll();
    });
    //добавляет 1000мс в треде на 3500 постов
    //if($(document).height() != $(window).height()) down_show();
    down_show();
});
Stage('Загрузка плавающих окон',                'qrload',       Stage.DOMREADY,     function(){
    draggable_qr('qr', 'left');
    draggable_qr('reacted-posters-window', 'center');
    draggable_qr('settings-window', 'center');
    draggable_qr('setting-editor-window', 'center');
    draggable_qr('qr-oekaki', 'center');
    draggable_qr('qr-sticker', 'center');
});
Stage('Юзеропции',                              'settings',     Stage.DOMREADY,     function(){
    Settings.addCategory('favorites', 'Избранное');
    Settings.addCategory('old', 'Раньшебылолучше');
    Settings.addCategory('media', 'Медиа');
    Settings.addCategory('other', 'Другое');
    Settings.addCategory('mobile', 'Мобильная версия');
    Settings.addCategory('hide', 'Скрытие');

    Settings.addSetting('favorites',    'favorites.show_on_new', {
        label: 'Показывать избранное при новом сообщении',
        default: true
    });
    Settings.addSetting('favorites',    'favorites.deleted_behavior', {
        label: 'При удалении треда на сервере',
        multi: true,
        values: [
            ['0', 'Не удалять из избранного'],
            ['1', 'Повторно проверять перед удалением'],
            ['2', 'Удалять из избранного сразу']
        ],
        default: 1
    });
    Settings.addSetting('old',          'styling.qr.disable_if_postform', {
        label: 'Не выводить плавающую форму если развёрнута другая форма',
        default: false
    });
    Settings.addSetting('old',          'styling.qr.disable', {
        label: 'Не выводить плавающую форму при клике на номер поста',
        default: false
    });
    Settings.addSetting('old',          'styling.disable_bytelen_counter', {
        label: 'Не показывать счётчик байт в форме постинга',
        default: false
    });
    Settings.addSetting('old',        'styling.portform_format_panel', {
        label: 'Показ панели разметки текста в форме',
        default: true
    });
    Settings.addSetting('old',        'postform.format_shortcut', {
        label: 'Горячие клавиши разметки',
        default: true
    });
    Settings.addSetting('old',        'old.append_postform', {
        label: 'Показ формы постинга под постом при ответе',
        default: false
    });
    Settings.addSetting('old',        'old.ctrl_enter_submit', {
        label: 'Отправка поста по Ctrl+Enter',
        default: true
    });
    Settings.addSetting('old',        'old.media_thumbnails', {
        label: 'Показ превью видео',
        default: true
    });
    Settings.addSetting('old',  'old.media_thumbnails_on_hover', {
        label: 'Показ превью видео только при наводе мыши на ссылку',
        default: true
    });
    Settings.addSetting('old',          'other.fullscreen_expand', {
        label: 'Разворачивать картинки в центре экрана',
        default: true
    });
    Settings.addSetting('media',          'media.clear_exif', {
        label: 'Удалять eXif',
        default: true
    });
    Settings.addSetting('media',          'media.read_webm_meta_title', {
        label: 'Читать title Webm из метаданных',
        default: true
    });
    Settings.addSetting('media',          'media.screenshot_mode', {
        label: 'Режим тредшота ( shift + s + click по посту )',
        default: false
    });
    Settings.addSetting('media',          'media.imgfind_popup_click', {
        label: 'Меню поиска картинок по клику',
        default: false
    });
    Settings.addSetting('media',          'media.name_type', {
        label: 'Имена картинок',
        multi: true,
        values: [
            ['0', 'Ничего не делать'],
            ['1', 'Удалять'],
        ],
        default: 0
    });
    Settings.addSetting('media',          'media.mediaviewer_nav', {
        label: 'Кнопки навигации при открытии медиа',
        default: true
    });
    Settings.addSetting('media',          'media.smooth_nav', {
        label: 'Плавная навигация ( отключить на некропука )',
        default: false
    });
    Settings.addSetting('other',        'other.on_reply_from_main', {
        label: 'При ответе с главной в тред',
        multi: true,
        values: [
            ['0', 'Ничего не делать'],
            ['1', 'Перенаправлять в тред'],
        ],
        default: 1
    });
    /*
    Settings.addSetting('other',        'other.enable_snowflakes', {
        label: 'Включить снежинки',
        default: true
    });
    Settings.addSetting('other',        'other.snowflakes_count', {
        label: 'Количество единовременных снежинок на экране',
        multi: true,
        values: [
            ['10', '10'],
            ['30', '30'],
            ['60', '60'],
            ['100', '100']
        ],
        default: 30
    });
    Settings.addSetting('other',        'other.enable_snowballs', {
        label: 'Включить сугробы и снегоуборочную коляску',
        default: true
    });
    */
    Settings.addSetting('other',        'other.qr_close_on_send', {
        label: 'Закрывать плавающую форму после ответа',
        default: true
    });
    Settings.addSetting('other',        'other.custom_css.enabled', {
        label: 'Пользовательский CSS',
        default: false,
        edit: {
            label: 'Редактировать',
            title: 'Редактировать СSS',
            editor: 'textarea',
            path: 'other.custom_css.data',
            //importable: true, //если true, то выводить кнопки импорта и экспорта
            saveable: true,
            default: ''
        }
    });
    Settings.addSetting('other',        'other.show_post_preview_delay', {
        label: 'Задержка показа ответа при наводе мыши на номер поста',
        multi: true,
        values: [
            ['0', 'Нет'],
            ['50', '50мс'],
            ['100', '100мс'],
            ['200', '200мс'],
            ['300', '300мс'],
            ['400', '400мс'],
            ['500', '500мс']
        ],
        default: 50
    });
    Settings.addSetting('other',        'other.hide_post_preview_delay', {
        label: 'Задержка скрытия ответа',
        multi: true,
        values: [
            ['100', '100мс'],
            ['200', '200мс'],
            ['500', '500мс'],
            ['800', '800мс'],
            ['1000', '1000мс'],
            ['1500', '1500мс'],
            ['2000', '2000мс'],
            ['3000', '3000мс'],
            ['5000', '5000мс']
        ],
        default: 200
    });
    Settings.addSetting('other',        'other.post_preview_animation', {
        label: 'Анимация ответов',
        default: true
    });
    Settings.addSetting('other',        'other.expand_autoscroll', {
        label: 'При сворачивании длинной пикчи фокусироваться на пост',
        default: true
    });
    Settings.addSetting('other',        'other.scroll_btns', {
        label: 'Показ кнопок перемотки страницы',
        default: true
    });
    Settings.addSetting('other',          'other.qr_hotkey', {
        label: 'Выводить плавающую форму по Ctrl+Space',
        default: true
    });
    Settings.addSetting('other',          'other.bb', {
        label: 'Показывать избранное/топ тредов',
        default: true
    });
//    Settings.addSetting('other',          'other.fav_stats', {
//        label: 'Показывать количество подписок на треды',
//        default: false
//    });
    Settings.addSetting('other',          'other.myboards.enabled', {
        label: 'Показывать Мои доски',
        default: true
    });
    Settings.addSetting('other',          'other.correcttz', {
        label: 'Коррекция часового пояса',
        default: true
    });
    // Settings.addSetting('other',        'other.captcha_provider', {
    //     label: 'Капча',
    //     multi: true,
    //     values: [
    //         ['google', 'google'],
    //         ['2chaptcha', '2chaptcha'],
    //     ],
    //     default: 'google'
    // });
    Settings.addSetting('other',        'other.navigation', {
        label: 'Бесконечная прокрутка',
        multi: true,
        values: [
            ['page', 'Отключено'],
            ['scroll', 'Автоматически'],
        ],
        default: 'scroll'
    });
    Settings.addSetting('other',        'other.media.titler.max_workers', {
        label: 'Загрузка названий видео',
        multi: true,
        values: [
            ['0', 'Отключено'],
            ['1', '1 поток'],
            ['2', '2 потока'],
            ['3', '3 потока'],
            ['4', '4 потока'],
            ['5', '5 потоков'],
            ['6', '6 потоков'],
            ['7', '7 потоков'],
            ['8', '8 потоков'],
            ['9', '9 потоков'],
            ['10', '10 потоков']
        ],
        default: '2'
    });

    Settings.addSetting('other',        'other.higlight_id', {
        label: 'Подсветка постов по ID',
        default: true
    });

    Settings.addSetting('other',        'other.higlight_myposts', {
        label: 'Помечать ваши посты',
        default: true
    });

    Settings.addSetting('other',        'other.higlight_myposts_replies', {
        label: 'Помечать ответы на мои посты',
        default: true
    });

    Settings.addSetting('other',        'other.auto_expand_spoiler', {
        label: 'Разворачивать спойлеры',
        default: false
    });

    Settings.addSetting('mobile',       'mobile.dont_expand_images', {
        label: 'Открывать пикчи в новом окне',
        default: false
    });
    Settings.addSetting('mobile',       'mobile.hide_qr', {
        label: 'Отключить плавающую форму',
        default: false
    });

    Settings.addSetting('hide',        'other.hide_rules.enabled', {
        label: 'Правила скрытия постов',
        default: false,
        edit: {
            label: 'Редактировать',
            title: 'Редактировать правила скрытия',
            editor: 'hiderules',
            path: 'other.hide_rules.list',
            importable: true,
            default: []
        }
    });
    Settings.addSetting('hide',       'other.hide_wipe', {
        label: 'Скрывать вайп автоматически',
        default: true
    });
    /////////////////////////////////////////////////////////////////////////////////////
    Settings.addEditor('textarea', function(val){
        var $body = $('#setting-editor-body');
        var textarea = $('<textarea id="setting-editor-textarea-textarea"></textarea>');
        textarea.val(val);
        $body.append(textarea);
    }, function(){
        //save
        return $('#setting-editor-textarea-textarea').val();
    });
    /////////////////////////////////////////////////////////////////////////////////////
    Settings.addEditor('singleinput', function(val){
        var $body = $('#setting-editor-body');
        var input = $('<span id="setting-editor-singleinput-text">Укажите список разделов через запятую.<br>Приммер: b,fag,po<br></span><input type="text" id="setting-editor-singleinput-input" />');
        input.val(val);
        $body.append(input);
    }, function(){
        //save
        return $('#setting-editor-singleinput-input').val();
    });
    /////////////////////////////////////////////////////////////////////////////////////
    var rules = [];
    Settings.addEditor('hiderules', function(val){
        var that = this;
        var last_rule = 0;
        var append_row = function(title,tnum,icon,email,name,trip,subject,comment,disabled) {
            var empty_cell = '<span>.*</span>';

            table.append('<tr id="hiderules-table-row' + i + '" class="' + '">' +
                '<td class="ah__cell">№' + last_rule + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(title) || '') + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(tnum) || empty_cell) + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(icon) || empty_cell) + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(email) || empty_cell) + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(name) || empty_cell) + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(trip) || empty_cell) + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(subject) || empty_cell) + '</td>' +
                '<td class="ah__cell">' + (escapeHTML(comment) || empty_cell) + '</td>' +
                '<td>' +
                '<input type="button" value="Экспорт" class="ah__export hiderules-table-row-export-btn" data-num="' + i + '">' +
                '<input type="button" value="Удалить" class="ah__del hiderules-table-row-delete-btn" data-num="' + i + '">' +
                '</td>' +
                '</tr>');
        };

        var $body = $('#setting-editor-body');
        var table = $('<table id="hiderules-table" class="ah">' +
            '<thead>' +
            '<tr class="ah__header">' +
            '<td class="ah__cell">№</td>' +
            '<td class="ah__cell">Название</td>' +
            '<td class="ah__cell">#треда</td>' +
            '<td class="ah__cell">Иконка</td>' +
            '<td class="ah__cell">Email</td>' +
            '<td class="ah__cell">Имя/ID</td>' +
            '<td class="ah__cell">Трипкод</td>' +
            '<td class="ah__cell">Тема</td>' +
            '<td class="ah__cell">Сообщение</td>' +
            '<td class="ah__cell">Управление</td>' +
            '</tr>' +
            '</thead>' +
            '</table>');
        rules = val;
        $body.html('');

        for(var i=0;i<rules.length;i++) {
            last_rule = i+1;
            var title = rules[i][0];
            var tnum = rules[i][1];
            var icon = rules[i][2];
            var email = rules[i][3];
            var name = rules[i][4];
            var trip = rules[i][5];
            var subject = rules[i][6];
            var comment = rules[i][7];
            var disabled = !!rules[i][8];

            append_row.apply(this, rules[i]);
        }

        table.append(
            '<tr id="hiderules-add-form">' +
            '<td class="ah__cell">№' + (i+1) + '</td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-title"    class="ah__input input error"></td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-tnum"     class="ah__input input"></td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-icon"     class="ah__input input" placeholder=".*"></td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-email"    class="ah__input input" placeholder=".*"></td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-name"     class="ah__input input" placeholder=".*"></td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-trip"     class="ah__input input" placeholder=".*"></td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-subject"  class="ah__input input" placeholder=".*"></td>' +
            '<td class="ah__cell"><input type="text" id="hiderules-add-input-comment"  class="ah__input input" placeholder=".*"></td>' +
            '<td class="ah__cell"><input id="hiderules-add-submit-btn" type="button" value="Добавить" disabled="disabled"></td>' +
            '</tr>');

        var add_form = $(
            '<div id="hiderules-add-form">' +
            '<div><span>Правило:</span>  <input type="text"  class="input" id="hiderules-add-json-input" placeholder="Можно вставить сохранённое ранее"></div>' +
            'В полях указываются регулярные выражения.<br>' +
            'Для конвертации строк в регулярки используйте конвертер:<br>' +
            '<input type="text" class="input" id="hiderules-add-converter-str"> -> <input type="text" class="input" id="hiderules-add-converter-regex" readonly="readonly"><br>' +
            '</div>');

        $body.append(table);
        $body.append(add_form);
        $body.append('<div id="hiderules-bottom">Нижние кнопки импорта и экспорта импортируют/экспортируют ВСЕ правила</div>');
        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        $('.ah__export').click(function(){
            var num = $(this).data('num');
            var rule =  Store.get('other.hide_rules.list.' + num);
            prompt('Скопируйте', JSON.stringify(rule));
        });
        $('.ah__del').click(function(){
            var num = $(this).data('num');
            var rules =  Store.get('other.hide_rules.list');
            rules.splice(num,1);
            Store.set('other.hide_rules.list', rules);
            Settings._editor_show(rules);
        });
        $('#hiderules-add-converter-str').keyup(function(){
            var val = $.trim($(this).val());
            var json = String(val).replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&');
            $('#hiderules-add-converter-regex').val(json);
        });
        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        var check_errors = function() {
            var err = false;
            for(var i=0;i<el.length;i++) {
                var el_name = el[i][0];
                var el_el = el[i][1];
                if(el_name == 'title') if(!el_el.val()) {
                    err = true;
                    el_el.addClass('error');
                    continue;
                }else{
                    el_el.removeClass('error');
                    continue;
                }

                try{
                    new RegExp(el_el.val());
                    el_el.removeClass('error');
                }catch(e){
                    el_el.addClass('error');
                }
            }

            return err;
        };

        var el = [];
        el.push(['title', $('#hiderules-add-input-title')]);
        el.push(['tnum', $('#hiderules-add-input-tnum')]);
        el.push(['icon', $('#hiderules-add-input-icon')]);
        el.push(['email', $('#hiderules-add-input-email')]);
        el.push(['name', $('#hiderules-add-input-name')]);
        el.push(['trip', $('#hiderules-add-input-trip')]);
        el.push(['subject', $('#hiderules-add-input-subject')]);
        el.push(['comment', $('#hiderules-add-input-comment')]);

        var $submit_btn = $('#hiderules-add-submit-btn');
        var $json_input = $('#hiderules-add-json-input');

        $('.ah__input').keyup(function(){
            var arr = [];
            for(var i=0;i<el.length;i++) arr.push(el[i][1].val());
            $json_input.val( JSON.stringify(arr) );

            if(check_errors()) {
                $submit_btn.attr('disabled','disabled');
            }else{
                $submit_btn.removeAttr('disabled','disabled');
            }

            $json_input.removeClass('error');
        })
            .focus(function(){
                $(this).attr('size', '25');
            })
            .blur(function(){
                $(this).removeAttr('size');
            });
        $json_input.keyup(function(){
            var arr;
            try {
                arr = JSON.parse($json_input.val());
            }catch(e){
                $json_input.addClass('error');
                return;
            }
            if(!arr.length || (arr.length != 8 && arr.length != 9)) {
                $json_input.addClass('error');
                return;
            }
            for(var i=0;i<8;i++) {
                el[i][1].val( arr[i] );
            }
            $json_input.removeClass('error');
            check_errors();
        });

        $submit_btn.click(function(){
            var arr = [];
            for(var i=0;i<el.length;i++) arr.push($.trim(el[i][1].val()));
            var c_arr = Store.get('other.hide_rules.list',[]);
            c_arr.push(arr);
            Store.set('other.hide_rules.list', c_arr);
            last_rule++;
            //append_row.apply(that,arr);
            Settings._editor_show(c_arr);
        });
    }, function(){
        //save
        //return $('#setting-editor-textarea-textarea').val();
    });
    /////////////////////////////////////////////////////////////////////////////////////

    $('#settings').click(function(){
        Settings.toggle();
        return false;
    });
    $('#settings-btn-close,#qr-settings-window-close').click(function(){
        Settings.hide();
        return false;
    });
    $('#settings-btn-export').click(function(){
        // https://stackoverflow.com/questions/2897619/using-html5-javascript-to-generate-and-save-a-file
        const download = (filename, text) => {
            var pom = document.createElement('a');
            pom.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
            pom.setAttribute('download', filename);
            if (document.createEvent) {
                var event = document.createEvent('MouseEvents');
                event.initEvent('click', true, true);
                pom.dispatchEvent(event);
            }
            else {
                pom.click();
            }
        }

        const d = new Date();
        const month = ('' + (d.getMonth() + 1)).padStart(2, '0');
        const day = ('' + d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        const filename = `Escapechan settings ${day}.${month}.${year}.json`;

        download(filename, Store.export());
    });
    $('#settings-btn-import').click(function(){
        var pom = document.createElement('input');
        pom.setAttribute('type', 'file');
        pom.setAttribute('accept', '.json');
        pom.addEventListener('change', (event) => {
            const fileList = event.target.files;
            const reader = new FileReader();
            reader.onload = function(event)
            {
                const json = event.target.result.toString();
                try {
                    JSON.parse(json);
                }catch(e){
                    return $alert('Неверный формат файла');
                }

                localStorage.store = json;

                Store.reload();
                Settings.hide();
                $alert('Для применения настроек обновите страницу');
                if(confirm("Обновить страницу?")) window.location.reload();
            };

            reader.readAsText(fileList[0]);
        });
        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }

    });
    $('#settings-btn-save').click(function(){
        var changed = [];

        $('.settings__checkbox').each(function(){
            var $box = $(this);
            var category = $box.data('category');
            var path = $box.data('path');
            var setting = Settings.getSetting(category, path);
            var current_value = Store.get(path, setting.default);
            var new_value = $box.is(':checked');
            if(current_value == new_value) return;

            changed.push(path);
            if(new_value == setting.default) {
                Store.del(path);
            }else{
                Store.set(path, new_value);
            }
        });

        $('.settings__multibox').each(function(){
            var $box = $(this);
            var category = $box.data('category');
            var path = $box.data('path');
            var setting = Settings.getSetting(category, path);
            var current_value = Store.get(path, setting.default);
            var new_value = $box.val();
            if(current_value == new_value) return;

            changed.push(path);
            if(new_value == setting.default) {
                Store.del(path);
            }else{
                Store.set(path, new_value);
            }
        });

        if(changed.length) $alert('Для применения настроек обновите страницу');
        Settings.hide();
    });

    $('#setting-editor-btn-save').click(function(){
        var newval = Settings._editor_onsave();
        //var currentval = Store.get(Settings._editor_path, Settings._editor_default_val);
        if(newval == Settings._editor_default_val) {
            Store.del(Settings._editor_path);
        }else{
            Store.set(Settings._editor_path, newval);
        }
        $('#setting-editor-window').hide();
    });

    $('#setting-editor-btn-close').click(function(){
        $('#setting-editor-window').hide();
    });

    $('#setting-editor-btn-export').click(function(){
        prompt('Скопируйте и сохраните', JSON.stringify(Store.get(Settings._editor_path, {})));
    });

    $('#setting-editor-btn-import').click(function(){
        var json = prompt('Вставьте сохранённое');
        var obj;
        if(!json) return;

        try {
            obj = JSON.parse(json);
        }catch(e){
            return $alert('Неверный формат');
        }

        Store.set(Settings._editor_path, obj);
        $('#setting-editor-window').hide();
    });
});
Stage('Взрослые разделы',                      'adultcheck',    Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    //18 years old validate
    var ageallow = getCookie('ageallow');
    if(ageallow != 1) {
        if (top.location.pathname.startsWith('/nsfw/') || top.location.pathname.startsWith('/mad/')) {
            generateWarning('agebox');
        }
    }
    $("#ageboxallow").click(function(){
        setCookie("ageallow", 1, 365);
        $('.warningcover, .warningbox').remove();
        return false;
    });
    //
});
Stage('Плашка',                      'abuplashque',    Stage.DOMREADY,     function(){
    return;
	const active = true;
    const activeMob = true;
    //const mob = window.matchMedia("only screen and (max-width: 280px)").matches;
    const mob = CFG.ISMOBILE480;
    if(!active && !mob) return;
    if(!activeMob && mob) return;
    let content = '';
    //delCookie('plashque');
    const $el = $('html');
    const show = getCookie('plashque');
    if(!mob) {
        //content = 'Аноны, CS2 вышел! В честь этого мы разыграем 50 Prime-статусов для новой каэсочки среди подписчиков телеграм-канала VG/Двач - <a href="https://t.me/ru2chvg/7771">кликай сюда</a> и подписывайся.<br /> Набор в модераторы окончен, по всем одобренным заявкам были разосланы инвайты на контактные данные, указанные в заявке, проверяйте.';
        content = 'Новости о видеоиграх, мемы, обсуждение с анонами — подписывайся на главный канал о видеоиграх в телеграме <a href="https://t.me/ru2chvg">@ru2chvg</a><br>';
    } else {
        //АРХИВ И ГЛАВНАЯ
        let link = '';
        let banner = ''
        if(window.location.pathname == "/" || location.pathname.split(/\//)[2] == 'arch') {
            banner = "/banners/0LyqzyvkiidLWqqm.jpg";
            link = "https://t.me/dvachannel";
        } else {
            banner = CFG.BOARD.ADVIMG;
            link = CFG.BOARD.ADVLINK;
        }
        content = '<a href="' + link + '"><img class="mob-banner" src="' + banner + '"></a>';
    }
    const plashque = `<div id="${!mob ? 'js-plashque' : 'js-plashque-mob'}" class="${!mob ? 'plashque' : 'plashque_mob'}">${content}<span id="js-plashque-close" class="plashque__close">X</span></div>`
    if(show != 1) {
        $el.append(plashque);
    }
    $("#js-plashque-close").click(() => {
        setCookie("plashque", 1, 1);
        if(!mob) {
            $('#js-plashque').slideUp();
        } else {
            $('#js-plashque-mob').slideUp();
        }
        return false;
    });
});

Stage('Удалятель ссылок, уродливый, как твоя мамаша','linkremover',    Stage.DOMREADY,     function(){
    return; //@todo beta поправить
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    //link remover
    window.linkremover = function() {
        if(CFG.BOARD.NAME=='b') {
            var x = $("a[href^='http']:not([href*='store.steampowered.com/app/444520']):not([href*='2ch.pm']):not([href*='2ch.hk']):not([href*='2ch.pm']):not([href*='twitch.tv/abu1nyasha']):not([href*='2chtv.ru']):not([href*='telegram.me/twochannel']):not([href*='telegram.me/dvachannel']):not([href*='change.org']):not([href*='vk.com/ru2ch']):not([href*='itunes.apple.com']):not([href*='youtube.com']):not([href*='youtu.be']):not([href*='twitter.com']):not([href*='2channel.hk'])").contents().unwrap();
        }
    };
    linkremover();

    var trackOutboundLink = function(url) {
        ga('send', 'event', 'outbound', 'click', url, {
            'transport': 'beacon',
            'hitCallback'(){/*document.location = url;*/}
        });
    }

    function cl(link){
        var img = new Image(1,1);
        img.src = 'https://www.liveinternet.ru/click?*' + link;
    }
    var linkUpdater = function() {
        if(CFG.BOARD.NAME=='b') {
            var list = "a[href^='http']:[href*='twitter.com'][href*='youtu.be'][href*='youtube.com'][href*='itunes.apple.com'][href*='vk.com/ru2ch']" +
                "[href*='change.org'][href*='telegram.me/dvachannel'][href*='telegram.me/twochannel'][href*='2channel.hk'][href*='twitch.tv/abu1nyasha'][href*='life.ru'][href*='/banners/']";
            var $links = $(list);
            var len = $links.length;
            for(var i = 0; i < len; i++) {
                $links[i].onclick = function () {
                    //trackOutboundLink(this.href);  analitics
                    cl(this);
                }
            }
        } else {
            var list = "a[href^='http']:not([href*='life.ru']):not([href*='2ch.pm']):not([href*='2ch.hk']):not([href*='2ch.pm']):not([href*='twitch.tv/abu1nyasha']):not([href*='2channel.hk'])" +
                ":not([href*='telegram.me/twochannel']):not([href*='telegram.me/dvachannel'])" +
                ":not([href*='change.org']):not([href*='vk.com/ru2ch']):not([href*='itunes.apple.com'])" +
                ":not([href*='youtube.com']):not([href*='youtu.be']):not([href*='twitter.com'])";
            //var x = $(list).each(function() {
            //});
            var $links = $(list);
            var len = $links.length;
            for(var i = 0; i < len; i++) {
                $links[i].onclick = function () {
                    //trackOutboundLink(this.href);  analitics
                    cl(this);
                }
            }
        }
    }();

});
Stage('Бесконечная прокрутка',                  'escroll',      Stage.DOMREADY,     function(){
    if(CFG.BOARD.THREADID) return; //do not run on thread
    if(!CFG.BOARD.NAME) return;
    var navigation = Store.get('other.navigation', 'scroll');
    if(navigation == 'page') return;
    var enabled = true;
    var active_page = 1;
    var max_page = 0;
    var busy = false;
    var done = false;
    var navigation = Store.get('other.navigation', 'scroll');
    var $currentBanner = $('.cntnt__bottom .mmm').html();

    var rekls = 0;
    window.appendRekl = function() { //если что перенести в глобальный скоуп
        var postshtml = '';
		
		/*
        postshtml += '<hr class="pre-rekl" style="display:none;">';  //prev
        postshtml += '<section class="mmm">' + $currentBanner + '</section>';
        postshtml += '<hr>';
		*/

        $('#js-posts').append(postshtml);

        window.relapTasks = window.relapTasks || [];
        window.relapTasks.push(function(relapAPI) {
            // relapAPI стало доступно внутри данной функции
            relapAPI.addWidgets();
        });

        return true;
    };

    var onScroll = function(top) {
        if(CFG.BOARD.THREADID) return;
        if(!enabled) return;
        if(done) return;
        if(busy) return;
        if(!top) top = $(window).scrollTop();
        if($(document).height() - (top+$(window).height()) > 300) return;

        PostF.loadPage(active_page++, true);
        //linkremover();
    };

    if(navigation != 'page') window.scrollcb_array.push(onScroll);

    var $pager = $('.pager');
    $pager.find('a').each(function(){
        var page = parseInt($(this).text());
        if(page > max_page) max_page = page;
        return true;
    });
    $pager.hide();
});
Stage('Подсветка постов по ID',                'highlight_id', Stage.DOMREADY,     function(){
    if(!Store.get('other.higlight_id', true)) return;

    $('#js-posts').on('click', '.post__anon', function() {
        var post_el = $(this).closest('.post');
        var hadclass = post_el.hasClass('post_type_highlight');
        $('.post_type_highlight').removeClass('post_type_highlight');
        if(hadclass) return;

        var num = post_el.data('num');
        var post = Post(num);
        var posts = post.threadPosts();
        var tmpost = Post(1);
        var name = post.cGetName();

        if(name.indexOf('id="id_tag_') < 0) return;

        for(var i=0;i<posts.length;i++) {
            tmpost.num = posts[i];
            if(!tmpost.isRendered()) continue;
            if(tmpost.cGetName() != name) continue;

            $('#post-' + posts[i]).addClass('post_type_highlight');
        }
    });
});
Stage('Подсветка личных постов',                'higlight_myposts', Stage.DOMREADY,     function(){
    //@todo перенести все это в объект PostF
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    if(!CFG.BOARD.THREADID) return; //не запускаем на нулевой
    if(!Store.get('other.higlight_myposts', true)) return;

    var thread = CFG.BOARD.THREADID; //вот из-за этого на нулевой не светит :с
    var myposts = Store.get('myposts.' + CFG.BOARD.NAME + '.' + thread, []);
    var today = new Date().toLocaleDateString();

    //проверка на старые посты и удаление из myposts, раз в сутки, если чт вынести в глобал
    var checkToDel = function(thread) {
        Post(1).fetchPosts({thread: thread,from_post: thread, board: CFG.BOARD.NAME}, function(res) {
            if(res.hasOwnProperty('error')) {
                if(res.error == 'server' && res.errorCode == -404) {
                    Store.del('myposts.' + CFG.BOARD.NAME + '.' + thread);
                }
            }
        });
    }

    if(!(Store.get('other.check_deleted_myposts') == today)) {
        var mythreads = Store.get('myposts.' + CFG.BOARD.NAME, {});
        for(var thread in mythreads) {
            if (mythreads.hasOwnProperty(thread)) {
                checkToDel(thread);
            }
        }
        Store.set('other.check_deleted_myposts', today);
    }

});
Stage('Система лайков',                         'likes',        Stage.DOMREADY,     function(){
    if(!CFG.BOARD.NAME) return; //не запускаем на главной
    if(!CFG.BOARD.LIKES) return; //отключено
    var liked = Store.get('_cache.liked', []);
    var disliked = Store.get('_cache.disliked', []);
    var $postroot = $('#js-posts'); //возможно стоит сделать глобал, часто юзается
    var $like = $('.post__rate_type_like');
    var $dislike = $('.post__rate_type_dislike');

    var like = function(num, el, dislike) {
        var task = dislike?'dislike':'like';
        let action = dislike?'/api/dislike':'/api/like';
        var store_name = dislike?'_cache.disliked':'_cache.liked';

        var onsuccess = function( data ) {
            if(!data) return $alert('Ошибка лайка: нет ответа');
            if(data.result != 1 ) return $alert(`Ошибка! Код ${data.error.code}, ${data.error.message}`);

            if(dislike) {
                disliked.push(CFG.BOARD.NAME + num);
                Store.set(store_name, disliked);
            } else {
                liked.push(CFG.BOARD.NAME + num);
                Store.set(store_name, liked);
            }

            renderClicked(el, dislike, num);

            var count_el = $('#' + task + '-count' + num);
            var count = parseInt(count_el.text()) || 0;
            count++;
            count_el.html(count);
        };

        var onerror = function(jqXHR, textStatus) {
            $alert('Ошибка лайка: ' + jqXHR.status + '(' + textStatus + ')');
        };

        $.ajax( action + '?board=' + CFG.BOARD.NAME + '&num=' + num, {
            dataType: 'json',
            timeout: 5000,
            success: onsuccess,
            error: onerror
        });
    };

    var renderClicked = function(el, dislike, num) {
        if(dislike) {
            el.addClass('post__rate_disliked');
            //$('#like-div' + num).addClass('post__rate_disliked');
        }else{
            el.addClass('post__rate_liked');
            //$('#dislike-div' + num).addClass('post__rate_liked');
        }
    };

    //@todo тест скорости и оптимизация
    $like.each(function() {
        var id = this.id.substr(8);
        if(liked.indexOf(CFG.BOARD.NAME + id) < 0) return;
        renderClicked($(this), false, id);
    });

    $dislike.each(function() {
        var id = this.id.substr(11);
        if(disliked.indexOf(CFG.BOARD.NAME + id) < 0) return;
        renderClicked($(this), true, id);
    });

    $postroot.on('click', '.post__rate_type_like', function() {
        var el = $(this);
        if(el.hasClass('post__rate_liked')) return;
        if(el.hasClass('post__rate_disliked')) return;
        like(this.id.substr(8), el);

        //$(document.documentElement).append(neechosee);setTimeout(function() { $('.neechoosee').remove();}, 1000);
    });

    $postroot.on('click', '.post__rate_type_dislike', function() {
        var el = $(this);
        if(el.hasClass('post__rate_disliked')) return;
        if(el.hasClass('post__rate_liked')) return;
        like(this.id.substr(11), el, true);

        //$(document.documentElement).append(chosee); setTimeout(function() { $('.choosee').remove();}, 1000); ;
    });
});
Stage('[debug]Stage controller',                'debug_sc',     Stage.DOMREADY,     function(){
    if(!Store.get('debug', false)) return;
    Settings.addCategory('sc_menu', '[debug] Отключение стадий');
    for(var i=0;i<window.sc_stages.length;i++) {
        var id = window.sc_stages[i][0];
        var name = window.sc_stages[i][1];
        var path = 'debug_disable_stage.' + id;

        Settings.addSetting('sc_menu',    path, {
            label: 'Отключить: ' + name,
            default: false
        });
    }
    $('#bmark_debug').append('<b>Total: ' + window.sc_time + 'ms</b><br>');
});



function showQrForm(qr_box) {
    if(!qr_box) qr_box = $('#qr');
    if(Store.get('styling.qr.disable', false)) return;
    if(Store.get('styling.qr.disable_if_postform', false) && $('#postform').is(':visible')) return;

    qr_box.show();
    loadCaptcha2ch();
}
function insert(myValue) {
    //переписанный insert
    var form = window.activeForm;
    var area = form[0];

    var $qr_form = $('#qr-shampoo');
    var qr_area = $qr_form[0];
    var $qr_box = $('#qr');

    var $win = $(window);

    if(!$qr_box.is(':visible')) {
        if(($win.width() >= 480 && $win.height() >= 480) || !Store.get('mobile.hide_qr',false)) {
            showQrForm($qr_box);
        }
    }

    if (document.selection) { // IE
        qr_area.focus();
        var sel = document.selection.createRange();
        sel.text = myValue;
        qr_area.focus();
    } else if (area.selectionStart || area.selectionStart == '0') { // Real browsers
        var startPos = area.selectionStart;
        area.selectionStart = 0;
        //var scrollTop = area.scrollTop;
        //area.value = area.value.substring(0, startPos) + myValue + area.value.substring(endPos, area.value.length);
        qr_area.value = area.value.substring(0, startPos) + myValue + area.value.substring(startPos);
        qr_area.focus();
        qr_area.selectionStart = startPos + myValue.length;
        qr_area.selectionEnd = startPos + myValue.length;
        //area.scrollTop = scrollTop;
    } else {
        qr_area.value += myValue;
        qr_area.focus();
    }

    $qr_form.keyup();
}
function getTimeInDays() {
    return Math.ceil((+new Date)/1000/60/60/24);
}
function renderStore() {
    $('#hat, #qr-hat').val(Store.get('thread.postform.hat',''));
    $('#name, #qr-name').val(Store.get('thread.postform.name',''));
    $('#trip, #qr-trip').val(Store.get('thread.postform.trip',''));
    $('#op, #op_qr').prop('checked', Store.get('thread.postform.op',''));
    $('#force_geo, #force_geo_qr').prop('checked', Store.get('thread.postform.force_geo',''));

    var email = Store.get('thread.postform.email','');
    $('#qr-e-mail,#e-mail').val(email);
    $('#sagecheckbox').prop('checked', (email=='sage'));

    var watermark = !!Store.get('thread.postform.watermark',false);
    $('#makewatermark').prop('checked', watermark);

    var icon = Store.get('thread.postform.icon.' + CFG.BOARD.NAME, false);
    if(icon) $('.js-icon-select').val(icon);

    if(!CFG.BOARD.THREADID) return false;

    var autorefresh = !!Store.get('thread.autorefresh',false);
    var $autorefresh_el = $('.autorefresh-checkbox');
    $autorefresh_el.prop('checked', autorefresh);
    if(autorefresh) MAutoUpdate.start();
}
function scrollToPost(num) {
    //$('html, body').animate({ scrollTop: $('#post-' + num).offset().top }, 'slow');
    $(document).scrollTop($('#post-' + num).offset().top);
}
function escapeHTML(str) {
    return (str+'')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function draggable_qr(id, pos) {
    //функция плавающих окон с записыванием их положения в хранилище
    var inDrag = false;
    var lastCursorX = 0;
    var lastCursorY = 0;
    var cursorInBoxPosX = 0;
    var cursorInBoxPosY = 0;

    var $form = $('#' + id);
    var formX = 0;
    var formY = 0;

    var moveForm = function(x, y) {
        var win = $(window);
        var windowWidth = win.width();
        var windowHeight = win.height();
        var formWidth = $form.innerWidth();
        var formHeight = $form.innerHeight();

        if(x+formWidth > windowWidth) x = windowWidth-formWidth;
        if(y+formHeight > windowHeight) y = windowHeight-formHeight;
        if(x<0) x = 0;
        if(y<0) y = 0;


        $form.css('top', y + 'px');
        $form.css('left', x + 'px');

        formX = x;
        formY = y;
    };

    $('#' + id + '-header').mousedown(function(e){
        e.preventDefault();

        var win = $(window);
        lastCursorX = e.pageX - win.scrollLeft();
        lastCursorY = e.pageY - win.scrollTop();

        cursorInBoxPosX = lastCursorX-formX;
        cursorInBoxPosY = lastCursorY-formY;

        inDrag = true;
    });

    $(document).mousemove(function(e){
        if(!inDrag) return;
        var win = $(window);
        var mouseX = e.pageX - win.scrollLeft();
        var mouseY = e.pageY - win.scrollTop();
        lastCursorX = mouseX;
        lastCursorY = mouseY;

        moveForm(mouseX-cursorInBoxPosX, mouseY-cursorInBoxPosY);
    });

    $(document).mouseup(function(){
        if(!inDrag) return;

        Store.set('styling.' + id + '.x', formX);
        Store.set('styling.' + id + '.y', formY);

        inDrag = false;
    });

    $( window ).resize(function(){
        moveForm(formX, formY);
    });

    var win = $(window);

    //обернул для багфикса (иначе страница не успеет отрендериться)
    $(function(){
        var store_x = Store.get('styling.' + id + '.x', false);
        var store_y = Store.get('styling.' + id + '.y', false);

        if(typeof(store_x) == 'number' && typeof(store_y) == 'number') {
            moveForm(store_x, store_y);
        }else{
            if(pos == 'center') {
                moveForm((win.width()-$form.width())/2, Math.floor(win.height()/3-$form.height()/2));
            }else{
                moveForm(win.width()-$form.width(), Math.floor(win.height()/3-$form.height()/2));
            }

        }
    });
}
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
function getReadableFileSizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = ['Kb', 'Mb', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}
function oekakiInit(w,h) {
    $('#qr-oekaki').show();
    $('#qr-oekaki-body').width(parseInt(w) + 61); //467
    $('#qr-oekaki-body').height(parseInt(h) + 31); //461   (-24, когда min-height auto)
    window.lc = LC.init($('#qr-oekaki-body').get(0), {
        imageURLPrefix: '/makaba/templates/js/lcanvas/img',
        backgroundColor: '#fff',
        imageSize: {width: w, height: h},
    });
    return lc;
}

//warning
//@todo CASE!
function generateWarning(type, data, callback) {
    var body;
    var buttons;
    var head = '<div class="warningcover"></div><div class="warningbox">';
    var audio = '<audio loop autoplay><source src="/makaba/templates/img/monkey.mp3?1" type="audio/mpeg" ></audio>'
    if(type=='warning') {
        buttons = '<a href="#" id="warningponyal">Я понел(((</a>';
        body    = '<div><img src="/makaba/templates/img/makaka.gif" alt="tsok tsok tsok tsok tsok tsok..."></div>' +
            '<div>' + decodeURIComponent(data['message']) + ' За этот пост <a href="' + data['path'] + '" target="_blank" >это</a></div>' + audio;
    }else if(type=='banned') {
        buttons = '<a href="#" id="warningponyal">Я понел(((</a>';
        body    = '<div><img src="/makaba/templates/img/makaka.gif" alt="tsok tsok tsok tsok tsok tsok..."></div>' +
            '<div>' + data['message'] + 'Вот за <a href="' + data['path'] + '" target="_blank" >это</a></div>' +
            '<div>Купить пасскод и получить мгновенный разбан можно <a href="/market.html" target="_blank">тут</a></div>' + audio;
    }else if(type=='agebox') {
        buttons = '<a href="#" id="ageboxallow">Я согласен и подтверждаю, что мне есть 18 лет</a><br><a  id="ageboxdisallow" href="/">Уйти отсюда</a>';
        body    = '<span>Получая доступ ко взрослым разделам вы осознаете и соглашаетесь со следующими пунктами:<ul class="warningbox__ul"><li>Содержимое этого сайта предназначено только для лиц, достигших совершеннолетия. Если вы несовершеннолетний, покиньте эту страницу.</li>' +
            '<li>Сайт предлагается вам "как есть", без гарантий (явных или подразумевающихся). Нажав на "Я согласен", вы соглашаетесь с тем, что сайт не несет ответственности за любые неудобства, которые может понести за собой использование вами сайта, ' +
            'а также что вы понимаете, что опубликованное на сайте содержимое не является собственностью или созданием сайта, однако принадлежит и создается пользователями.</li>' +
            '<li>Существенным условием вашего присутствия на сайте в качестве пользователя является согласие с "Правилами" сайта, ссылка на которые представлена на главной странице. Пожалуйста, прочтите <a href="/rules.html" target="_blank">Правила</a> ' +
            'внимательно, так как они важны.</li></ul></span>';
    }else if(type=='unban') {
        buttons = '<a href="#" id="warningponyal">Закрыть</a>';
        body    = '<div class="warningbox__header">Реквест разбана</div>';
        body   += '<div class="unban">';
        body   += '<div class="unban__left">';
        body   += '<input class="input" id="unban-ban-num-input" value="" autocomplete="off" type="text" placeholder="Номер бана">';
        body   += '<textarea rows="2" id="unban-comment-input" class="input"  placeholder="Замечательная история получения бана"></textarea>';
        body   += '<div><input name="2chaptcha_id" value="" type="hidden"  class="input" id="unban-captcha-val"><div id="unban-captcha-div"></div><label for="unban-ban-num-input">Введите капчу:</label>' +
            '<input type="text" class="input" id="unban-captcha-input" value="" autocomplete="off"/></div>' +
            '<input onclick="UnbanSubmit(); return false;" class="button" value="Отправить запрос" type="submit">';
        body   += '</div>';
        body   += '<div class="unban__right">';
        body   += 'Нет надежды на кровавую модерацию? Устал ждать разбана? Просто купи разбан всего за 149.99р! <br>';
        body   += '<input id="unban-ban-num-input-buy" class="input" value="" autocomplete="off" placeholder="EMAIL|номер бана" type="text"><input style="" value="Замолить грехи" id="unban-buy-submit" type="submit">';
        body   += '</div>';
        body   += '</div>';

    }else if(type=='dead') {
        buttons = '<a href="#" id="warningponyal">Я понел(((</a>';
        body    = '<div><img src="/makaba/templates/img/makaka.gif" alt="tsok tsok tsok tsok tsok tsok..."></div>' +
            '<div>У нас небольшие техработы, постинг будет доступен через 10 минут.</div>';
    }
    var foot = '<div class="warningboxbutton">' + buttons + '</div></div>';

    var output = head + body + foot;
    $('.board-body').append(output);
    $("#warningponyal").click(function(){
        $('.warningcover').add('.warningbox').remove();
        return false;
    });
    if(callback) callback();
    return false;
}

//cookie funcs
function getCookie(name){
    var regexp = new RegExp('(^|;\\s+)' + name + '=(.*?)(;|$)');
    var hit = regexp.exec(document.cookie);

    if(hit && hit.length > 2) return unescape(hit[2]);
    else return null;
}
function getSCookie(cname) {
    var name = cname;// + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(c.indexOf('=') + 1,c.length);
        }
    }
    return null;
}

function setCookie(key, value, days) {
    if(days)
    {
        var date=new Date();
        date.setTime(date.getTime() + days*24*60*60*1000);
        var expires = '; expires=' + date.toGMTString();

    }
    else expires = '';

    document.cookie = key + '=' + value + expires + '; path=/';
}

function delCookie(key) {
    document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
    return !getCookie(key);
}

//some newakaba funcs
function $alert(txt, id) {
    //var html = '<div class="alert" id="alert-' + id + '">' + txt + '</div>';
    var e = document.createElement("div");
    e.classList.add('alert');
    e.innerHTML = txt;
    e.id = 'alert-' + id;
    $id('js-posts').appendChild(e);
    if(id != 'wait') setTimeout(function(){
        $close(e);
    }, 6000);
}
function $id(id) {
    return _.id(id);
}
function $n(id) {
    return document.getElementsByName(id)[0];
}
function $t(id, root) {
    return (root || document).getElementsByTagName(id);
}
function $c(id, root) {
    return (root || document).getElementsByClassName(id);
}
function $each(arr, fn) {
    for(var el, i = 0; el = arr[i++];)
        fn(el);
}
function $html(el, htm) {
    var cln = el.cloneNode(false);
    cln.innerHTML = htm;
    el.parentNode.replaceChild(cln, el);
    return cln;
}
function $attr(el, attr) {
    for(var key in attr) {
        if(key == 'text') {
            el.textContent = attr[key];
            continue;
        }

        if(key == 'value') {
            el.value = attr[key];
            continue;
        }

        if(key == 'html') {
            el.innerHTML = attr[key];
            continue;
        }

        el.setAttribute(key, attr[key]);
    }

    return el;
}
function $event(el, events) {
    for(var key in events) {
        if(!events.hasOwnProperty(key)) continue;
        if(el.addEventListener) {
            el.addEventListener(key, events[key], false);
        }else{
            el.attachEvent(key,events[key]);
        }
    }
}
function $before(el, nodes) {
    for(var i = 0, len = nodes.length; i < len; i++)
        if(nodes[i]) el.parentNode.insertBefore(nodes[i], el);
}
function $after(el, nodes) {
    var i = nodes.length;

    while(i--) if(nodes[i]) el.parentNode.insertBefore(nodes[i], el.nextSibling);
}
function $new(tag, attr, events) {
    var el = document.createElement(tag);

    if(attr) $attr(el, attr);

    if(events) $event(el, events);

    return el;
}
function $disp(el) {
    el.style.display = el.style.display == 'none' ? '' : 'none';
}
function $del(el) {
    if(!el) return;
    if(el.parentNode) el.parentNode.removeChild(el);
}
function $offset(el, xy) {
    var c = 0;

    while(el) {
        c += el[xy];
        el = el.offsetParent;
    }

    return c;
}
function $close(el) {
    if(!el) return;
    $del(el);
}
function $show(el) {
    var i = 0;
    var showing = setInterval(function(){
        if(!el || i++ > 8) {
            clearInterval(showing);
            return;
        }

        var s = el.style;
        s.opacity = i/10;
        s.paddingTop = parseInt(s.paddingTop) + 1 + 'px';
        s.paddingBottom = parseInt(s.paddingBottom) + 1 + 'px';
    }, 35);
}

//раскрытие всех пикч в тредю
function expandAllPics()
{
    window.expand_all_img = true;
    var Pic = document.getElementsByClassName('image-link');

    for(var i = 0; i < Pic.length; i++)
    {
        if(Pic[i].getElementsByTagName("img")[0].className.indexOf("webm-file")==12) {
            continue;
        } else {
            Pic[i].getElementsByTagName('a')[0].click();
        }
    }
    delete window.expand_all_img;
}


function ToggleSage() {
    if($("#e-mail").val() == "sage"){
        $("#e-mail").val('');
        $("#sagecheckbox").prop('checked', false);;
    }else {
        $("#e-mail").val('sage');
        $("#sagecheckbox").prop('checked', true);;
    }
}
var ToolbarTextarea;
function edToolbar(obj) {
    var ret = '';
    ret += `
    	<div class="postform__mu-wrapper">
    	<button class="postform__mu postform__mu_type_b" type="button" onclick="doAddTags('[b]','[/b]','${obj}')">B</button>
    	<button class="postform__mu postform__mu_type_i" type="button" onclick="doAddTags('[i]','[/i]','${obj}')">I</button>
    	<button class="postform__mu postform__mu_type_q" type="button" onclick="doAddTags('>','','${obj}')">></button>
    	<button class="postform__mu postform__mu_type_u" type="button" onclick="doAddTags('[u]','[/u]','${obj}')">U</button>
    	<button class="postform__mu postform__mu_type_o" type="button" onclick="doAddTags('[o]','[/o]','${obj}')">O</button>
    	<button class="postform__mu postform__mu_type_sp" type="button" onclick="doAddTags('[spoiler]','[/spoiler]','${obj}')"><span class="spoiler">??</span></button>
    	<button class="postform__mu postform__mu_type_s" type="button" onclick="doAddTags('[s]','[/s]','${obj}')">S</button>
    	<button class="postform__mu" type="button" onclick="doAddTags('[sup]','[/sup]','${obj}')">A<sup>a</sup></button>
    	<button class="postform__mu" type="button" onclick="doAddTags('[sub]','[/sub]','${obj}')">A<sub>a</sub></button>
    	<button class="postform__mu" style="width:auto;" type="button" onclick="doAddTags('[secret]','[/secret]','${obj}')">Приват</button>
    `
	
	if(obj == 'shampoo') {
		ret += '<button class="postform__mu postform__mu_type_poll_add" style="width:auto;" type="button" onclick="doAddPoll()">' + lang.board_posting_poll_enable + '</button>';
		ret += '<button class="postform__mu postform__mu_type_poll_cancel" style="display:none;width:auto;" type="button" onclick="doCancelPoll()">' + lang.board_posting_poll_disable + '</button>';
	}
	
	ret += '</div>';
	
    return ret;
}
function doAddPoll() {
	doAddPollAnswer();
	doAddPollAnswer();
	$('[name=enable_poll]').val('1');
	$('#postform__poll').show();
	$('#pollVoteAdder').show();
	$('.postform__mu_type_poll_add').hide();
	$('.postform__mu_type_poll_cancel').show();
	$('.poll-allow-multiple-checkbox').show();
}
function doCancelPoll() {
	$('#pollAnswers').html('');
	$('[name=enable_poll]').val('0');
	$('#postform__poll').hide();
	$('.postform__mu_type_poll_add').show();
	$('.postform__mu_type_poll_cancel').hide();
	$('.poll-allow-multiple-checkbox').hide();
}
function doAddPollAnswer() {
	var pollAnswerTemplate = $('#pollAnswerTemplate').html();
	$('#pollAnswers').append(pollAnswerTemplate);
	
	$('#pollAnswers [name="poll_answers[]"]').last().focus();
	
	var addedAnswersCount = $('#pollAnswers [name="poll_answers[]"]').length;
	
	if(addedAnswersCount >= 10) {
		$('#pollVoteAdder').hide();
	}
}
function doRemovePollAnswer(el) {
	var addedAnswersCount = $('#pollAnswers [name="poll_answers[]"]').length;
	
	if(addedAnswersCount > 2) {
		$(el).closest('.poll-answer').remove();
		$('#pollVoteAdder').show();
	}
}
function doVotePollAnswer(num, vote) {
	$.get('/api/polls/vote?board=' + CFG.BOARD.NAME + '&num=' + num + '&vote=' + vote, function(response) {
		if(response.result == 1) {
			$alert(lang.board_poll_accepted, 'poll');
			
			PostF.updatePosts(null);
		} else {
			$alert(lang.board_poll_error + ' ' + response.error.message, 'poll');
		}
	});
}
var reactDblClickTimeout = null;
function doReactPost(el, icon, event) {
	var num = $(el).closest('.post').data('num');
    
    if (event.detail === 2) {
		clearTimeout(reactDblClickTimeout);
		getReactedPosters(num, icon);
	} else {
		reactDblClickTimeout = setTimeout(function() {
		$.get('/api/react?board=' + CFG.BOARD.NAME + '&num=' + num +  '&icon=' + icon, function(response) {
			if(response.result == 1) {
				$alert(lang.board_reaction_accepted, 'reaction');
				
				PostF.updatePosts(null);
			} else {
				$alert(lang.board_reaction_error + ' ' + response.error.message, 'poll');
			}
		});
		}, 500);
	}
}
function getReactedPosters(num, icon) {
	$.get('/api/mobile/v2/post/' + CFG.BOARD.NAME + '/' + num +  '/reacted?icon=' + icon, function(response) {
		if(response.result == 1) {
			var html = '<div style="display:flex;flex-direction:column;gap:3px;background-color:var(--theme_default_bg);max-width:700px;max-height:500px;overflow:auto;">';
			
			if(response.posts != null) {
				for(i = 0; i < response.posts.length; i++) {
					var postRaw = response.posts[i];
					var postHtml = PostF._generatePostBody(postRaw, true)
					html += '<div style="background:var(--theme_default_postbg);padding:5px 7px;">' + postHtml + '</div>';
				}
			}
			
			html += '</div>';
			
			
			$('#reacted-posters-body').html(html);
			$('#reacted-posters-window').show();
		}
	});
}
function doAddTags(tag1,tag2,obj) {
    ToolbarTextarea = $id(obj);
    if (document.selection)
    {
        var sel = document.selection.createRange();
        sel.text = tag1 + sel.text + tag2;
    }
    else
    {
        var len = ToolbarTextarea.value.length;
        var start = ToolbarTextarea.selectionStart;
        var end = ToolbarTextarea.selectionEnd;
        var scrollTop = ToolbarTextarea.scrollTop;
        var scrollLeft = ToolbarTextarea.scrollLeft;
        var sel = ToolbarTextarea.value.substring(start, end);
        var rep = tag1 + sel + tag2;

        ToolbarTextarea.value =  ToolbarTextarea.value.substring(0,start) + rep + ToolbarTextarea.value.substring(end,len);
        ToolbarTextarea.scrollTop = scrollTop;
        ToolbarTextarea.scrollLeft = scrollLeft;
        ToolbarTextarea.focus();
        ToolbarTextarea.setSelectionRange(start+tag1.length, end+tag1.length);
    }

    $('#' + obj).keyup();
}

//////////
/////////
////////
//////
////
//
//screenshot mode

const MScreenshotMode = (function () {
    let _active = false;
    let _binded = false;
    let _exception = [];

    const _helper = {
        blur(num) {
            let id;
            const nodes = _.q('.cntnt__main').querySelectorAll('.post, .thread__missed');
            if(_exception.includes(num)) {
                for (let i = nodes.length - 1; i >= 0; i--) {
                    nodes[i].style.filter = 'none';
                }
                _exception = [];
                return false;
            }
            _exception.push(num);
            for (let i = nodes.length - 1; i >= 0; i--) {
                nodes[i].style.filter = 'none';
                id = nodes[i].dataset.num;
                if(_exception.includes(id)) continue;
                nodes[i].style.filter = 'blur(4px)';
            }
            return false;
        },
        bindUI() {
            document.addEventListener('keydown', (e) => {
                //let key = e.which || e.keyCode;
                let key = e.key.toLowerCase();
                if( key == 's' || key == 'ы' ) {
                    _active = true;
                }
            });
            document.addEventListener('keyup', (e) => {
                let key = e.key.toLowerCase();
                if( key == 's' || key == 'ы' ) {
                    _active = false;
                }
            });
            _.q('.cntnt__main').addEventListener('click', (e) => { //js-posts
                let target = e.target.closest('.post');
                let num = null;
                if (e.shiftKey && _active && target) {
                    e.preventDefault();
                    num = target.dataset.num;
                    document.getSelection().removeAllRanges();
                    this.blur(num);
                }
                return false;
            });
        }
    }

    const _module = {
        get binded() { return _binded; },
        init() {
            if(_binded) return false;
            _binded = true;
            _helper.bindUI();
        }
    };

    if(Store.get('media.screenshot_mode', false)) _module.init();

    return _module;

})();

class MediaDataParser {
    constructor(data) {
        const EBML = 0x1a45dfa3;
        const SEGMENT = 0x18538067;
        const SEGINFO = 0x1549a966;
        this.data = data;
    }
    getWebmTitle() {
        let title = '';
        let data = new Uint8Array(this.data);
        //console.time('getWebmTitle')
        for( let i = 0; i < data.length; ++i ) {
            //mandatory muxingapp to skip reading header ( title placed before muxinap)
            if( data[i] === 0x4D && data[i+1] === 0x80) {
                //console.log('exit no title')
                break;
            }
            if(data[i] === 0x15 && data[i + 1] === 0x49 && data[i + 2] === 0xA9 && data[i + 3] === 0x66 &&
                data[i + 19] === 0x7B && data[i + 20] === 0xA9
            ) {
                i += 21;
                for(let end = (data[i++] & 0x7F) + i; i < end; ++i) {
                    title += String.fromCharCode(data[i]);
                }
                break;
            }

        }
        title = decodeURIComponent(escape(title));
        console.log(title);
        //console.timeEnd('getWebmTitle')
        return title;
    }
    removeExif() {
        let len;
        let dv = new DataView(this.data);
        let dvuint = new Uint8Array(this.data);
        let bytearray = this.data;
        let offset = 0, recess = 0;
        let pieces = [];
        let i = 0;
        if (dv.getUint16(offset) == 0xffd8){ // its jpeg
            offset += 2;
            let app1 = dv.getUint16(offset);
            offset += 2;
            while (offset < dv.byteLength){
                if (app1 == 0xffe1){
                    pieces[i] = {recess:recess,offset:offset-2};
                    recess = offset + dv.getUint16(offset);
                    i++;
                }
                else if (app1 == 0xffda){
                    break;
                }
                offset += dv.getUint16(offset);
                app1 = dv.getUint16(offset);
                offset += 2;
            }
            if (pieces.length > 0){
                let newPieces = [];
                pieces.forEach((v) => {
                    newPieces.push(bytearray.slice(v.recess, v.offset));
                }, this);
                newPieces.push(bytearray.slice(recess));
                return newPieces;
                //return URL.createObjectURL(br);
            } else {
                return [dvuint]; //return original image if no exif was found
            }
        }
        // seems png
        if(dvuint[0] === 0x89 && dvuint[1] === 0x50) {
            // end 49 45 4e 44 ae 42 60 82
            for(i = 0, len = dvuint.length - 7; i < len && (
                dvuint[i] !== 0x49 ||
                dvuint[i + 1] !== 0x45 ||
                dvuint[i + 2] !== 0x4E ||
                dvuint[i + 3] !== 0x44
            ); ++i);
            i += 8;
            if(i !== len) {
                dvuint = dvuint.slice(0, i);
            }
            return [dvuint];
        }
        // seems gif
        if(dvuint[0] === 0x47 && dvuint[1] === 0x49 && dvuint[2] === 0x46) {
            //0x003B
            i = len = dvuint.length;
            while(i && dvuint[--i - 1] !== 0x00 && dvuint[i] !== 0x3B);
            if(++i !== len) {
                dvuint = dvuint.slice(0, i);
            }
            return [dvuint];
        }
        //webp
        if(dvuint[0] === 0x52 && dvuint[1] === 0x49 && dvuint[2] === 0x46) {
            return [dvuint]
        }
        return [dvuint] //если нихуя не подошло возвращаем оригинал
    }
}

//new MediaDataParser(await MediaDownloader.getMediaData('') ).getWebmTitle()
const MediaDownloader = {
    downloadThread() {

    },
    async getMediaData (url, range = 0) { //512
        let headers = {};
        if ( range ) {
            headers = {'Range':`bytes=0-${range}`}
        }
        let r = await fetch(url, {headers: headers}); // header param
        let data = await r.arrayBuffer();
        //let view = new Uint8Array(data);
        //return view;
        return data;
    },
    downloadFile(url, name) {
        const link = document.createElement('a');
        const fname = url.split("/").slice(-1).pop();

        const resultname = name && /^.+\..+$/.test(name) ?
            name.split('.').slice(0, -1).concat(fname.split('.').slice(-1).pop()).join('.') : fname;
        link.download = resultname;
        link.href = url;

        link.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: window}));
    }
}


class PopUp {
    constructor(type, el) { //info, adult, ban, menu
        this.position = '';
        this.type = type;
        this.el = el;
        let html;
        switch(type) {
            case 'imgfindmenu':
                html = this.generateImgFindMenu(); break;
            default:
                html = 'Чел тя пукнули';
        }
        let c = el.getBoundingClientRect();
        let t = c.top + window.pageYOffset + c.height;
        let l = c.left + window.pageXOffset - 2;
        let popup = $new('div', {'class': `modal modal_type_${type}`, 'style': `top:${t}px; left:${l}px;`,  'html': html});
        this.popup = popup;
        document.body.appendChild(popup);
        popup.addEventListener('mouseout', this, true);
        popup.addEventListener('mouseover', this, true);
        popup.addEventListener('click', this);
    }
    handleEvent(e) {
        switch(e.type) {
            case 'mouseover':
                clearTimeout(PopUp.t);
                break;
            case 'mouseout':
                let rt = e.relatedTarget;
                if(this.popup.contains(rt) || rt == this.el) return;
                PopUp.t = setTimeout(() => {
                    this._destroy();
                    PopUp.active = false;
                }, 300);
                break;
            case 'click':
                this._destroy();
                PopUp.active = false;
                break;
        }
    }
    position() {

    }
    _destroy() {
        $del(_.q(`.modal_type_${this.type}`));
    }
    _parseEl() {
        //type check later for menus
        let src;
        let post = this.el.closest('.post__image');
        let m = _.q('.post__file-preview', post);
        let t = m.dataset['type'];
        if(t == 6 || t == 10) {
            src = m.src;
        } else {
            var host = location.host;
			src = `https://${host}${m.dataset['src']}`;
        }
        return src;
    }
    generateImgFindMenu() {
        let url = this._parseEl();
        return `
    		<a href="https://lens.google.com/uploadbyurl?url=${url}" target="_blank">Искать в Google</a>
    		<a href="https://yandex.com/images/search?rpt=imageview&url=${url}" target="_blank">Искать в Yandex</a>
    		<a href="https://saucenao.com/search.php?url=${url}" target="_blank">Искать в Saucenao</a>
    		<a href="https://iqdb.org/?url=${url}" target="_blank">Искать в iqdb</a>
    	`
    }
}

PopUp.active = false;
PopUp.t = null;


const MImgSearch = (function () {
    const _helper = {
        bindUI() {
            let d = null;
            let cl = Store.get('media.imgfind_popup_click', false);
            //бинд на клик(наведение) по иконке поиска в handleEvent'е у класса Поста
            _.q('.board-body').addEventListener(cl ? 'click' : 'mouseover', (e) => {
                if(PopUp.active) return;
                if(!e.target.closest('.js-post-findimg')) return;
                PopUp.active = true;
                let el = e.target;
                return new PopUp('imgfindmenu', el);
            });
            _.q('.board-body').addEventListener('mouseout', (e) => {
                let el = e.target;
                if(!el.classList.contains('js-post-findimg')) return;
                if(PopUp.active) !_.q(".modal_type_imgfindmenu").dispatchEvent(new MouseEvent('mouseout', {bubbles: true}))
                return false;
            });
        }
    }

    const _module = {
        init() {
            _helper.bindUI()
        },
    };

    _module.init();
    return _module;

})();

//////

////// Reply thread
//в треде сохраяются "свои" посты, данный класс получает тред, берет массив "своих" постов из треда, проверяет у каждого из них наличие ответа и выводит в отдельном окне дисскуссию, состоящую только из твоих постов и ответов на твои посты ( вероятно нужно выводить полную цепочку, но не уверен )
class Discuss {
    constructor(thread) {
        let p = Store.get(`myposts.${CFG.BOARD.NAME}.${CFG.BOARD.THREADID}`, []);
    }

}

//MEDIA = new Map();
// for (const [key, value] of myMap.entries()) {
//   console.log(key, value);
// }
//MEDIA.set(2, [{'x':2}, {'g': 3}])

class MediaObject {
    constructor(data, post, prev) {

        ({md5: this._md5, fullname: this._title, width: this._imgW, height: this._imgH, tn_width: this._thumbW, tn_height: this._thumbH, thumbnail: this._thumbSrc, path: this._src, type: this._type, sticker: this._sticker} = data);
        if (this._type  == 100 ) {
            this._title = 'Sticker';
        }
        this._post = post;
        this.next = null;
        this.prev = prev;
        if(prev) {
            prev.next = this;
        }
        //mp4 = 10, webm = 6, mp3 = 7, sticker 100
        this.target = null; //target expanded element
        this.opened = null; //opened in post when expand all clicked
    }
    get post()    { return this._post; }
    get el()      { return _.q(`#img-${this._post}-${this._md5}`); }
    get type()    { return this._type; }
    get src()     { return this._src; }
    get h()       { return this._imgH; }
    get w()       { return this._imgW; }
    get th()      { return this._thumbH; }
    get tw()      { return this._thumbW; }
    get title()   { return this._title; }
    get hash()    { return this._md5; }
    get thumb()   { return this._thumbSrc; }
    get sticker() { return this._sticker; }
    get isVideo() { return (this._type  == 6) || (this._type  == 10) || (this._type  == 7) }
    get isAudio() { return (this._type  == 20) }
    abortWebmDownload() {
        const {target} = this;
        if (!target) return;

        target.pause(0);
        target.src = '';
        target.load();
        target.remove();
    }
    updateVol() {
        const {target} = this;
        let vol = target.volume;
        if (target.muted) vol = 0;
        Store.set('other.webm_vol', vol);
        return;
    }
    show() {
        if(!CFG.MEDIA_FULLEXPAND) {
            this.showOld()
            return;
        }

        let {viewer} = MediaObject;
        if(!viewer) {
            MediaObject.viewer =  new MediaViewer(this)
            return;
        }
        if(viewer.data === this) {
            //this.abortWebmDownload();
            viewer.close()
            //MediaObject.viewer = null;
            return;
        }
        viewer.update(this);
        return;
    }
    showOld() {
        let el = null;
        const pview = _.q(`#preview-${this.post}`)
        if(pview) {
            el = _.q('.post__file-preview', pview);
        } else {
            ({ el } = this);
        }

        if(!this.isVideo) {
            if (this.opened) {
                el.src = this.thumb;
                el.style.cssText = '';
                this.opened = false;
            } else {
                el.src = this.src;
                el.style.cssText = `max-width: 100%;max-height: 100%;width: auto;height: auto;`;
                this.opened = true;
            }
        } else {
            if(this.isVideo) {
                let html = '';
                if( this.type == 7 ) {
                    html = `<div class="" style="position: relative;"><audio controls><source src="${this.src}" type="audio/mpeg"></audio><div id="html5videoclose" class="post__file-close">X</div></div>`;
                } else {
                    html = `<div class="" style="position: relative;">
					<video id="html5video" data-state="full" name="media" loop="1" controls="" autoplay="" height="100%" width="100%"><source class="video" height="100%" width="100%" type="${this.type == 10 ?'video/mp4':'video/webm'}" src="${this.src}"></source></video>
					<div id="html5videoclose" class="post__file-close">X</div></div>`;
                }
                const m = _.newTempl(html);
                const vid = m.firstElementChild;
                this.target = vid;
                vid.addEventListener('volumechange', () => { this.updateVol() } );
                vid.volume = _.isAndroid() ? 0.5 : Store.get('other.webm_vol', 0.4);
                m.lastElementChild.addEventListener('click', () => {
                    el.style.display = '';
                    el.parentNode.classList.toggle('post__image-link_exp');
                    m.remove();
                })
                el.parentNode.appendChild(m);
                el.style.display = 'none';
            }
        }


        el.parentNode.classList.toggle('post__image-link_exp');
    }
}
MediaObject.viewer = null;

//есть объект медиафайла со своими свойствами медиафайла
//есть объект медиа и объект вьювера. Они связаны друг с другом. Вызов "показа" на объекте медиа создает вьювер и показывает картинку
class MediaViewer {
    constructor(data) {
        if (!data) throw new Error('No data to display');
        this.main    = _.newTempl('<div class="mv__main" id="js-mv-main"><div class="mv__meta"></div></div>');
        MediaViewer.container.appendChild(this.main);
        this._mult    = 1;
        this._oldMult = 1;
        this._dragged = false;
        this._x       = 0;
        this._y       = 0;
        this.data     = null;

        this.main.addEventListener('mousemove', this);
        this.main.addEventListener('onwheel' in document ? 'wheel' : 'mousewheel', this)
        this._open(data);
        draggable(this.main, this.main, true);
        if(CFG.MEDIA_NAVBUTTONS && !CFG.ISMOBILE720) this.btns = MediaViewer.Nav();
    }
    get isDragged() { return this._dragged; }
    set setDragged(b) { this._dragged = b; }
    async _open(data) {
        this._x       = 0;
        this._y       = 0;
        this._mult    = 1;
        this._oldMult = 1;

        this.data = data; //привязываем объект медиа к текущему вьюверу
        
        let viewerW = data.w;
        let viewerH = data.h;

        let media;
        if (data.isAudio) {
            this.main.insertAdjacentHTML('beforeend', '<audio id="js-mv-player" class="mv__player" name="media" loop="1" controls="" autoplay="" height="100%" width="100%"><source class="audio" height="100%" width="100%" type="' + (data.src.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg') + '" src="' + data.src + '"></source></audio >');
            media = this.main.lastElementChild; //for safari
            media.volume = _.isAndroid() ? 0.5 : Store.get('other.webm_vol', 0.4); //android volume fix
            this.data.target = media;
            media.addEventListener('volumechange', () => { this.data.updateVol() });
        } else if (data.isVideo) {
            this.main.insertAdjacentHTML('beforeend', '<video id="js-mv-player" class="mv__player" name="media" loop="1" controls="" autoplay="" height="100%" width="100%"><source class="video" height="100%" width="100%" type="' + (data.type == 10 ? 'video/mp4' : 'video/webm') + '" src="' + data.src + '"></source></video>');
            media = this.main.lastElementChild; //for safari
            media.volume = _.isAndroid() ? 0.5 : Store.get('other.webm_vol', 0.4); //android volume fix
            this.data.target = media;
            media.addEventListener('volumechange', () => { this.data.updateVol() });
        } else {
            media = _.newTempl(`<img src="${data.src}" width="100%" height="100%" />`);
        }

        this.main.appendChild(media);
        
        if (data.isAudio) {
            /*
            const rect = document.getElementById('js-mv-player').getBoundingClientRect();
            console.log(rect);
            viewerW = rect.width;
            viewerH = rect.height;
            */
            
            viewerW = 300;
            viewerH = 60;
        }

        this.main.style.cssText = `top: ${((CFG.W_HEIGHT - viewerH) / 2) - 8}px; left: ${((CFG.W_WIDTH - viewerW) / 2) - 8}px; background-color: ${data.type == 100 ? 'transparent' : ''}; width:${viewerW}px; height: ${!(data.type == 7) ? `${viewerH}px`: '200px'}`;
        if (data.isAudio) {
            this.main.dataset.mediainfo = `${data.title}`;
        } else {
            this.main.dataset.mediainfo = `${data.title} ( ${data.w}x${data.h} )`;
        }
        $(MediaViewer.container).fadeIn(60);

        this.scale();

        if (data.type == 6 && CFG.MEDIA_READ_WEBM_META) {
            let title = new MediaDataParser(await MediaDownloader.getMediaData(data.src, 512)).getWebmTitle();
            if (title) {
                this.main.dataset.metainfo = title;
                this.main.classList.add('mv__main_withmeta');
            }
        }

        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1 && data.isVideo) {
            //@todo global brower twiks
            $(this.main).append('<div id="html5videofixer" style="position:absolute;top:0;left:0;width:100%;height: calc(100% - ' + (this.main.dataset.metainfo ? 68 : 50) + 'px);background: transparent;"></div>');
        }
    }
    update(data) {
        //data.cancelWebmDownload()
        this.main.textContent = '';
        this._open(data);
    }
    scale() {
        if (this.data.w > CFG.W_WIDTH || this.data.h > CFG.W_HEIGHT) {
            let multW = Math.round((CFG.W_WIDTH - 8 * 2) / this.data.w * 100) / 100; // 8 - border
            let multH = Math.round((CFG.W_HEIGHT - 8 * 2) / this.data.h * 100) / 100;
            if (multW < 0.1)
                multW = 0.1;
            if (multH < 0.1)
                multH = 0.1;
            this.resize(multW < multH ? multW : multH, true);
        }
    }
    resize(m,c) { //multiplier, center
        this._mult = m;
        //сохраняем текущий мультиплаер, если его перед скролам уже уменьшили при ресайзе большой картинки
        let dm = (this._mult - this._oldMult) / this._oldMult;
        this.repos(dm, c);
        this.main.style.cssText +=  `; width: ${this.data.w * this._mult}px; height: ${this.data.h * this._mult}px;`;
    }
    repos(dm, c) { //deltamultiplier, center
        let st = window.scrollY;
        let sl = window.scrollX;
        let offset = this.main.getBoundingClientRect();
        let cx;
        let cy;
        if (c) {
            cx = this.data.w / 2;
            cy = this.data.h / 2;
        } else {
            cx = (this._x - offset.left);
            cy = (this._y - offset.top);
        }
        let dt = dm * cy; //delta top
        let dl = dm * cx; //detta left
        this.main.style.cssText += `; left: ${offset.left - dl}px; top: ${offset.top - dt}px;`;
    }
    navigate(fwd) {

        const d = fwd ? this.data.next : this.data.prev;

        if(!d) return;

        if (CFG.MEDIA_FULLEXPAND) {
            this.update(d);
            const p = Post(this.data.post);
            p.scrollTo();
        } else {
            //_module.openOld(imgs[newIndex]);
        }

    }
    close() {
        $(MediaViewer.container).fadeOut(60);
        if(this.data.isVideo) this.data.abortWebmDownload();
        MediaViewer.container.textContent = '';
        MediaObject.viewer = null; //отсоединяем вьювер от медиа
    }
    handleEvent(e) {
        let moved = 0;
        let px, py; //last_x last_y
        switch(e.type) {
            case 'mousemove':
                this._x = e.clientX;
                this._y = e.clientY;

                return;
            case 'wheel':
            case 'onwheel':
                e.preventDefault();
                let delta = e.deltaY ? e.deltaY * (-40) : e.wheelDelta;
                this._oldMult = this._mult;
                this._mult = (delta > 0) ? this._mult + 0.3 : this._mult - 0.3;
                if (this._mult > 10 || this._mult < 0.01) {
                    this._mult = this._oldMult;
                    return;
                }
                this.resize(this._mult);
                return;
        }
    }
    static expandAllPics() {
        if (!CFG.BOARD.THREADID)
            return;

        for (const [k, v] of MEDIABYID.entries()) {
            if (v.isVideo) {
                continue;
            } else if (v.isAudio) {
                continue;
            } else {
                v.showOld();
            }
        }
    }
    static openYoutube(html, obj) {
        const main    = _.newTempl('<div class="mv__main" id="js-mv-main"><div class="mv__meta"></div></div>');
        MediaViewer.container.appendChild(main);
        const w = '80'; //vw
        const title = Store.get('_cache.media.' + obj.type + '.' + obj.id + '.title');
        const wpx = CFG.W_WIDTH*w/100;
        const hpx = wpx*9/16;
        $(main).html(html)
            .css('top', `${(CFG.W_HEIGHT - hpx - 8 * 2)/2}px`)
            .css('left', `${(CFG.W_WIDTH - wpx - 8 * 2)/2}px`)
            .attr('data-mediainfo', title)
            .width(`${wpx}px`)
            .height(`${hpx}px`)

        $(MediaViewer.container).fadeIn(60);

        MediaObject.viewer = 'youtube'
    }
}
MediaViewer.Init = function () {
    MediaViewer.container = _.newTempl('<div class="mv"></div>');
    $('body').append(MediaViewer.container);
    document.addEventListener('click', (e) => {
        if(e.target && (e.target.matches('.post__file-preview'))) { //click on preview
            let p = e.target.id;
            if(CFG.ISMOBILE480 && CFG.MOBILE_DONT_EXPAND) return window.open(MEDIABYID.get(p).src,'_blank');
            MEDIABYID.get(p).show()
        } else {
            if(MediaObject.viewer && e.button === 0) {
                if(MediaObject.viewer == 'youtube') {
                    $(MediaViewer.container).fadeOut(60);
                    MediaViewer.container.textContent = '';
                    MediaObject.viewer = null;
                    return;
                }
                if(MediaObject.viewer.isDragged) {
                    e.preventDefault();
                    MediaObject.viewer.setDragged = false;
                    return;
                }

                MediaObject.viewer.close()
            }

        }
        return;
    })
    document.addEventListener('keyup', (e) => {
        if (!MediaObject.viewer)
            return;
        let d;
        const code = e.keyCode || e.which;
        if (code == 37 || code == 65 || code == 97 || code == 1092) {
            d = 0;
        } else if (code == 39 || code == 68 || code == 100 || code == 1074) {
            d = 1;
        } else if (code == 27) {
            return MediaObject.viewer.close();
        } else {
            return;
        }

        MediaObject.viewer.navigate(d);
    });
}
MediaViewer.Nav = function() {
    let chtml = `<div>
		<div class="mv__nav mv__nav_r" id="js-mv-r"><svg xmlns="http://www.w3.org/2000/svg" class="icon mv__icon"><use xlink:href="#icon__naup"></use></svg></div>
		<div class="mv__nav mv__nav_l" id="js-mv-l"><svg xmlns="http://www.w3.org/2000/svg" class="icon mv__icon"><use xlink:href="#icon__naup"></use></svg></div>
		</div>
	`
    let btns = _.newTempl(chtml);
    MediaViewer.container.append(btns)
    let [fwd,back] = [...btns.children];
    let t = null;
    fwd.addEventListener('click', (e)=>{
        //e.preventDefault();
        e.stopPropagation();
        return MediaObject.viewer.navigate(true);
    })
    back.addEventListener('click', (e)=>{
        //e.preventDefault();
        e.stopPropagation();
        return MediaObject.viewer.navigate(false);
    })
    document.addEventListener('mousemove', (e) => {
        if(!MediaObject.viewer) return;
        if (fwd.matches(':hover') || back.matches(':hover')) {clearTimeout(t); return btns;}
        clearTimeout(t);
        fwd.style.display = 'block';
        back.style.display = 'block';
        t = setTimeout(() => {
            fwd.style.display = 'none';
            back.style.display = 'none';
        }, 2000)
    })
    return btns;
}
MediaViewer.Init();


////// draggable
function draggable(el, box, mv = false) { //(name, win, head)
    el.addEventListener('mousedown', {
        _px     : 0,
        _py     : 0,
        _x      : 0,
        _y      : 0,
        _z      : 3,
        _moved  : 0,
        handleEvent(e) {
            let { clientX: cx, clientY: cy } = e;
            switch(e.type) {
                case 'mousedown':
                    this._px = cx;
                    this._py = cy;
                    // this._X = Cfg[name + 'WinX'];
                    // this._Y = Cfg[name + 'WinY']; saved coords
                    document.addEventListener('mouseleave', this);
                    document.addEventListener('mousemove', this);
                    document.addEventListener('mouseup', this);
                    e.preventDefault();
                    return;
                case 'mousemove': {
                    let mx = window.innerWidth - box.offsetWidth; //window.innerHeight - maybe in cfg?
                    let my = window.innerHeight - box.offsetHeight ;
                    let cr = box.getBoundingClientRect();
                    let x = cr.left + cx - this._px;
                    let y = cr.top + cy - this._py;
                    // this._x = x >= mx || cx > this._px && x > mx ? 'right: 0' :
                    //  	x < 0 || cx < this._px && x < 0 ? 'left: 0' :
                    //  	`left: ${ x }px`;
                    // this._y = y >= my || cy > this._py && y > my ? 'bottom: 0' :
                    // 	y < 0 || cy < this._py && y < 0 ? 'top: 0' :
                    // 	`top: ${ y }px`;
                    this._x = `left: ${ x }px`;
                    this._y = `top: ${ y }px`;
                    box.style.cssText += `; ${ this._x }; ${ this._y }; z-index: ${ this._z }`; //
                    this._moved += Math.abs(cx - this._px) + Math.abs(cy - this._py);
                    this._px = cx;
                    this._py = cy;
                    console.log()
                    if(mv && this._moved > 6) {
                        MediaObject.viewer.setDragged = true;
                    }
                    return;
                }
                case 'mouseleave':
                case 'mouseup':
                    console.log('drag up');
                    document.removeEventListener('mouseleave', this);
                    document.removeEventListener('mousemove', this);
                    document.removeEventListener('mouseup', this);
                    this._moved = 0;
                // saveCfg(name + 'WinX', this._X);
                // saveCfg(name + 'WinY', this._Y);
            }
        }
    });
}


////// posts


const POSTS = new Map();
const THREADS = new Map();

async function loadJson(num = CFG.BOARD.THREADID, board = CFG.BOARD.NAME, page = null) {
    const url = page != null ? _.pageJson(board, page) : _.threadJson(board, num);
    let response = await fetch(url);//@todo error handling, 404 / bad json
    if(response.ok) {
        let rawjson = await response.json();
        let rawthreads = rawjson['threads'];
        //let rawposts = rawjson['threads']['0']['posts']; //page rawjson['threads']['NUM'][posts]
        for (let i = 0; i < rawthreads.length; ++i) {
            new _Thread(rawthreads[i]);
        }
    } else {
        throw new Error('HTTP error');
    }

    //console.log(rawposts);
}

class _Thread {
    constructor (threadobj) {
        //this.num = parseInt(num);
        //Object.assign(this, threadobj);
        this.num = ( threadobj.thread_num === undefined ) ? parseInt(threadobj.posts[0].num) : parseInt(threadobj.thread_num);
        this.isFav = false;
        this.isHidden = false;
        this.postsnum = 0;
        this.el = _.id(`thread-${this.num}`); //
        THREADS.set(this.num, this);
        let posts = threadobj.posts;
        for(let i = 0; i < posts.length; ++i) {
            new _Post(posts[i])
        }
    }
    handleEvent(e) {
        let el = e.target;
        if(e.type == 'click') {
            switch(el.className) {
                case 'bb__header':
                    //expand
                    break;
                case 'bb__tab':
                    //update
                    break;
            }
            //return;
        }
    }
}

class _Post {
    constructor (postobj) {
        //Object.assign(this, postobj);
        this.num = parseInt(postobj.num);
        this.raw = postobj; //for debug
        this.comment = postobj.comment;
        this.isOp = !parseInt(postobj.parent);
        this.isHidden = false;
        this.el = _.id(`post-${this.num}`); //?
        this.thread = THREADS.get(this.num); // link to Thread obj
        this.refmap = [];
        this.repliesTo = [];
        POSTS.set(this.num, this);
        this.parseReplies(this.comment);
        as.checkPost(this.num); //AntiShipe check on page or thread initial load, checks wipe and hidden by hand
        //pByNum.set(num, this); add Post to posts map, map can be stored in Thread.posts static 
    }
    parseReplies(message) {
        if(message.indexOf('class="post-reply-link"') >= 0) {
            let match = message.match(/class="post-reply-link" data-thread="([0-9]*)" data-num="([0-9]*)"/g);

            for (let i = match.length - 1; i >= 0; i--) {
                let replyMatch = match[i].match(/class="post-reply-link" data-thread="([0-9]*)" data-num="([0-9]*)"/);
                if(replyMatch && replyMatch.hasOwnProperty('2')) {
                    let thread = parseInt(replyMatch[1]); //тред, в который отвечают
                    let num = parseInt(replyMatch[2]); //номер поста, на который отвечают
                    this.repliesTo.push(num);
                    if(POSTS.get(num)) POSTS.get(num).addReply(this.num);

                }
            }
            return
        } else {
            return [];
        }
    }
    addReply(num) {
        this.refmap.push(num);
        return this.refmap;
    }
    scrollToAndHighlight(el) { //scrollToPost(num) static?
        scrollTo(0, window.pageYOffset + el.getBoundingClientRect().top - Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)/2);
        //this.highlight();
    }
    hide() {

    }
    static Pview() {

    }
}


//arch 
if(location.pathname.split(/\//)[2]=='arch') {
    //arch fixer
    if(location.pathname.split(/\//)[2]=='arch') {
        var arch_mark = '<h3 class="archive-thread">Тред в архиве!</h3>';
        $('.logo').append(arch_mark);
    }
}

$('#postform input, #postform textarea, #postform button, #postform .filer').on('mousedown touchstart', function() {
	$('#postform .captcha').append($('.wg-cap-root'));
});

$('#qr-postform input, #qr-postform textarea, #qr-postform button, #qr-postform .filer').on('mousedown touchstart', function() {
	$('#qr-postform .captcha').append($('.wg-cap-root'));
});

$('#force_geo_qr').change(function() {
	$('#force_geo').prop('checked', $(this).prop('checked'));
});

$('#force_geo').change(function() {
	$('#force_geo_qr').prop('checked', $(this).prop('checked'));
});

$('#op_qr').change(function() {
	$('#op').prop('checked', $(this).prop('checked'));
});

$('#op').change(function() {
	$('#op_qr').prop('checked', $(this).prop('checked'));
});

$('#qr-hat').change(function() {
	$('#hat').val($(this).val());
});

$('#hat').change(function() {
	$('#qr-hat').val($(this).val());
});

function decryptSecretText(ciphertext, key) {
    if (!ciphertext || !key) {
        return ciphertext;
    }

    try {
        const decodedBytes = atob(ciphertext);
        
        if (decodedBytes.length < 32) {
            return '';
        }
        
        const storedHash = decodedBytes.slice(0, 32);
        const encryptedData = decodedBytes.slice(32);

        let result = '';
        for (let i = 0; i < encryptedData.length; i++) {
            result += String.fromCharCode(
                encryptedData.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }

        const computedHashHex = sha256(result);

        let storedHashHex = '';
        for (let i = 0; i < storedHash.length; i++) {
            storedHashHex += storedHash.charCodeAt(i).toString(16).padStart(2, '0');
        }

        if (computedHashHex !== storedHashHex) {
            return '';
        }

        return Base64.decode(result);
    } catch (error) {
        return '';
    }
}

function sha256(s){
 
    var chrsz   = 8;
    var hexcase = 0;
 
    function safe_add (x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }
 
    function S (X, n) { return ( X >>> n ) | (X << (32 - n)); }
    function R (X, n) { return ( X >>> n ); }
    function Ch(x, y, z) { return ((x & y) ^ ((~x) & z)); }
    function Maj(x, y, z) { return ((x & y) ^ (x & z) ^ (y & z)); }
    function Sigma0256(x) { return (S(x, 2) ^ S(x, 13) ^ S(x, 22)); }
    function Sigma1256(x) { return (S(x, 6) ^ S(x, 11) ^ S(x, 25)); }
    function Gamma0256(x) { return (S(x, 7) ^ S(x, 18) ^ R(x, 3)); }
    function Gamma1256(x) { return (S(x, 17) ^ S(x, 19) ^ R(x, 10)); }
 
    function core_sha256 (m, l) {
        var K = new Array(0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2);
        var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
        var W = new Array(64);
        var a, b, c, d, e, f, g, h, i, j;
        var T1, T2;
 
        m[l >> 5] |= 0x80 << (24 - l % 32);
        m[((l + 64 >> 9) << 4) + 15] = l;
 
        for ( var i = 0; i<m.length; i+=16 ) {
            a = HASH[0];
            b = HASH[1];
            c = HASH[2];
            d = HASH[3];
            e = HASH[4];
            f = HASH[5];
            g = HASH[6];
            h = HASH[7];
 
            for ( var j = 0; j<64; j++) {
                if (j < 16) W[j] = m[j + i];
                else W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
 
                T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
                T2 = safe_add(Sigma0256(a), Maj(a, b, c));
 
                h = g;
                g = f;
                f = e;
                e = safe_add(d, T1);
                d = c;
                c = b;
                b = a;
                a = safe_add(T1, T2);
            }
 
            HASH[0] = safe_add(a, HASH[0]);
            HASH[1] = safe_add(b, HASH[1]);
            HASH[2] = safe_add(c, HASH[2]);
            HASH[3] = safe_add(d, HASH[3]);
            HASH[4] = safe_add(e, HASH[4]);
            HASH[5] = safe_add(f, HASH[5]);
            HASH[6] = safe_add(g, HASH[6]);
            HASH[7] = safe_add(h, HASH[7]);
        }
        return HASH;
    }
 
    function str2binb (str) {
        var bin = Array();
        var mask = (1 << chrsz) - 1;
        for(var i = 0; i < str.length * chrsz; i += chrsz) {
            bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i%32);
        }
        return bin;
    }
 
    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
 
        for (var n = 0; n < string.length; n++) {
 
            var c = string.charCodeAt(n);
 
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
 
        }
 
        return utftext;
    }
 
    function binb2hex (binarray) {
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for(var i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
            hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
        }
        return str;
    }
 
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
 
}

/*
$(function() {
    var enable_snowflakes = Store.get('other.enable_snowflakes', true);
    var snowflakes_count = Store.get('other.snowflakes_count', 30);
    var enable_snowballs = Store.get('other.enable_snowballs', true);
    
    if(enable_snowflakes) {
        new Snow({showSnowBalls:enable_snowballs,countSnowflake:snowflakes_count});
    }
});
*/

(() => {
const box = document.createElement("div");
box.style.cssText = `
position: fixed;
display: none;
width: 340px;
background: #111;
color: #fff;
z-index: 99999;
font-family: sans-serif;
font-size: 14px;
overflow: hidden;
pointer-events: none;
`;
document.body.appendChild(box);

const img = document.createElement("img");
img.style.width = "100%";
box.appendChild(img);

const title = document.createElement("div");
title.textContent = "Загрузка…";
box.appendChild(title);

const cache = new Map();
let currentId = null;

function getIdFromHref(href) {
try {
const u = new URL(href);
if (href.includes("/shorts/")) return u.pathname.slice(1).split('/')[1];
if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
if (u.searchParams.has("v")) return u.searchParams.get("v");
} catch {}
return null;
}

document.addEventListener("mousemove", e => {
if (!currentId) return;
box.style.left = e.clientX + 20 + "px";
box.style.top = e.clientY + 20 + "px";
});

document.addEventListener("mouseover", e => {
const link = e.target.closest("a[href]");
if (!link) return;

const id = getIdFromHref(link.href);
if (!id || id === currentId) return;

currentId = id;
box.style.display = "block";
img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

if (cache.has(id)) {
title.textContent = cache.get(id);
return;
}

title.textContent = "Загрузка…";

fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
.then(r => r.ok ? r.json() : null)
.then(d => {
if (!d || currentId !== id) return;
cache.set(id, d.title);
title.textContent = d.title;
})
.catch(() => {
title.textContent = "";
});
});

document.addEventListener("mouseout", e => {
if (!e.relatedTarget || !e.relatedTarget.closest?.("a")) {
currentId = null;
box.style.display = "none";
}
});
})();