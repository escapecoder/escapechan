let ctlgItemHovered = false;
var Catalog = {
	cdata: [],
	cfound: [],
	onlytags: false,
	min: 3,
	_query: '',
	_filter: 'standart',
	init: function() {
		this.onlytags = $('#js-tags').prop('checked');
		$('.box-header').on('change', '#js-tags', function() {
			var onlytags = $(this).prop('checked');
			Catalog.toggleTags(onlytags);
		});
		$('#js-filter').val(Store.get('other.catalog.filter', 'standart'));
		$('#js-csearch').on('input', function() {
			Catalog._query = this.value;
			Catalog.debounce(100, Catalog.search, this.value);
		});
		this.getdata(this.onloadsearch, Store.get('other.catalog.filter', 'standart'));
	},
	toggleTags: function(onlytags) {
		this.onlytags = onlytags;
		this.search(this._query);
	},
	sortby: function(field, reverse, primer) {
		var key = function(x) {
			return primer ? primer(x[field]) : x[field]
		};
		return function(a, b) {
			var A = key(a),
				B = key(b);
			return ((A < B) ? -1 : ((A > B) ? 1 : 0)) * [-1, 1][+!!reverse];
		}
	},
	debounce: function(delay, fn, args) {
		setTimeout(function() {
			Catalog.search(args)
		}, delay);
	},
	search: function(query) {
		var that = this;
		if (!query) {
			this.display();
		} else {
			this.cfound = [];
			$.each(this.cdata, function(index, thread) {
				if ((thread.comment.toLowerCase().search(query) !== -1 && !that.onlytags) || thread.tags.toLowerCase().search(query) !== -1) {
					Catalog.cfound.push(thread);
				}
			});
			this.display(this.cfound);
		}
	},
	onloadsearch: function() {
		this._query = Store.get('catalog-search-query');
		if (typeof this._query !== "undefined") {
			if (this._query) {
				$('#js-csearch').val(this._query.toLowerCase());
				$('#js-tags').prop('checked', true);
				this.onlytags = true;
			}
		}
		Store.del('catalog-search-query');
		Catalog.search(this._query);
	},
	getdata: function(callback, filter) {
		if (filter == 'standart') {
			var url = '/' + board + '/catalog.json';
		} else {
			var url = '/' + board + '/catalog_num.json';
		}
		$.getJSON(url, function(data) {
			Catalog.cdata = [];
			$.each(data.threads, function(index, thread) {
				Catalog.cdata.push(thread.posts[0])
			});
		}).then(function() {
			Catalog.onloadsearch();
		});
	},
	display: function(data) {
		data = data || this.cdata;
		var htmlcode = '';
		var tag;
		$.each(data, function(index, thread) {
			htmlcode += '<div class="ctlg__thread" data-num="' + thread.num + '" id="js-thread-' + thread.num + '">';
			htmlcode += '<div class="ctlg__img">';
			htmlcode += '<a href="/' + board + '/res/' + thread.num + '.html">';
			htmlcode += '<img id="thread_' + thread.num + '" class="thumb" src="' + thread.files[0].thumbnail + '" width="' + thread.files[0].tn_width + '" height="' + thread.files[0].tn_height + '">';
			htmlcode += '</a>'
			htmlcode += '</div>';
			htmlcode += '<div class="ctlg__info">';
			htmlcode += '<div class="ctlg__meta">';
			switch (thread.trip) {
				case '!!%adm%!!':
					htmlcode += '<span class="adm">## Admin ##<\/span>';
					break;
				case '!!%mod%!!':
					htmlcode += '<span class="mod">## Mod ##<\/span>';
					break;
				case '!!%Inquisitor%!!':
					htmlcode += '<span class="inquisitor">## Applejack ##<\/span>';
					break;
				case '!!%coder%!!':
					htmlcode += '<span class="mod">## Coder ##<\/span>';
					break;
				default:
					htmlcode += '<span class="postertrip">' + thread.trip + '<\/span>';
			}
			htmlcode += '<span>' + lang.board_catalog_posts + ': ' + thread.posts_count + ' / ' + lang.board_catalog_files + ': ' + thread.files_count + '</span> ';
			if (thread.tags) {
				tag = ' /' + thread.tags + '/';
			}
			if (thread.subject && subj) {
				htmlcode += '<div class="ctlg__title">' + thread.subject + (thread.tags ? `<span class="orange">${tag}</span>` : '') + '</div>';
			}
			htmlcode += '</div>';
			htmlcode += '<div class="ctlg__comment">';
			htmlcode += thread.comment;
			htmlcode += '</div>';
			htmlcode += '</div>'
			htmlcode += '</div>';
		});
		$('#js-threads').html(htmlcode);
	},
};
$('#js-threads').on('mouseenter', '.ctlg__thread', (e) => {
	let el = e.target.closest('.ctlg__thread');
	if (!checkOverflow(el)) return;
	if (ctlgItemHovered) return;
	ctlgItemHovered = true;
	let box = el.getBoundingClientRect();
	let newel = el.cloneNode(true);
	newel.classList.add('ctlg__thread_abs');
	newel.style.top = box.top + window.pageYOffset + 'px';
	let left = box.left + window.pageXOffset;
	newel.style.left = left + 'px';
	if (window.innerWidth > 640 && left - 80 < 0) newel.style.left = '80px';
	if (window.innerWidth > 640 && left - 80 + 380 > window.innerWidth) {
		newel.style.left = 'auto';
		newel.style.right = 0;
	}
	newel.id = '';
	el.style.visibility = 'hidden';
	$(newel).appendTo('#js-threads');
});
$('#js-threads').on('mouseleave', '.ctlg__thread_abs', (e) => {
	document.querySelector(`.ctlg__thread_abs`).remove();
	let el = e.target.closest('.ctlg__thread');
	let num = el.dataset['num'];
	document.getElementById(`js-thread-${num}`).style.visibility = 'visible';
	ctlgItemHovered = false;
});
$('#js-filter').on('change', (e) => {
	if ($('#js-filter').val() == 'num') {
		Store.set('other.catalog.filter', 'num');
		Catalog.getdata(Catalog.onloadsearch, 'num');
	} else if ($('#js-filter').val() == 'standart') {
		Store.set('other.catalog.filter', 'standart');
		Catalog.getdata(Catalog.onloadsearch, 'standart');
	}
})

function checkOverflow(el) {
	let overflowed = false;
	let imgh = el.querySelector('.ctlg__img').offsetHeight;
	let infoh = el.querySelector('.ctlg__info').offsetHeight;
	if (imgh + infoh > 400) overflowed = true;
	return overflowed;
}