//* TITLE Bookmarker **//
//* VERSION 1.0 REV C **//
//* DESCRIPTION Dashboard Time Machine **//
//* DEVELOPER STUDIOXENIX **//
//* DETAILS The Bookmarker extension allows you to bookmark posts and get back to them whenever you want to. Just click on the Bookmark icon on posts and the post will be added to your Bookmark List on your sidebar. **//
//* FRAME false **//
//* BETA false **//
//* SLOW true **//

XKit.extensions.bookmarker = new Object({

	running: false,
	bookmarks: new Array(),
	slow: true,

	preferences: {
		new_tab: {
			text: "Open my bookmarks in new tabs",
			default: false,
			value: false
		}
	},

	run: function() {
		this.running = true;
		if (document.location.href.indexOf('http://www.tumblr.com/dashboard') !== -1) {
			XKit.tools.init_css("bookmarker");
			XKit.extensions.bookmarker.load_bookmarks();
			XKit.extensions.bookmarker.init();
			XKit.post_listener.add("bookmarker", XKit.extensions.bookmarker.do);
			XKit.extensions.bookmarker.do();
			if (document.location.href.indexOf("?bookmark=true") !== -1) {
				XKit.extensions.bookmarker.check_bookmark();
			}
		}
	},
	
	check_bookmark: function() {
		
		var str = document.location.href.replace("/?bookmark=true","");
		var str_sub = parseInt(str.substr(str.lastIndexOf("/")+1)) - 1;

		$("#xkit_bookmark_" + str_sub).removeClass("no_push");
		$("#xkit_bookmark_" + str_sub).addClass("selected");

		if ($("#post_" + str_sub).length <= 0) {

			$("#posts").prepend("<div class=\"post\" id=\"xkit-bookmarker-not-found-msg\"><div id=\"xkit-bookmarker-not-found-inner\"><b>Bookmarked post not found.</b>" + 
			"<br/>This might be because the post has been deleted, or because of a temporary Tumblr error. Posts made around the same time as the bookmarked post is listed below.<br/><a href=\"#\" onclick=\"return false\"><div class=\"xkit-button\" id=\"xkit-delete-current-bookmark\">Delete this bookmark</div></a></div></div>");

		} else {

			$("#posts").prepend("<div class=\"post no-error-on-xbookmark\" id=\"xkit-bookmarker-not-found-msg\"><div id=\"xkit-bookmarker-not-found-inner\"><b>You are viewing a bookmark.</b><br/>" + 
			"If you are done with it, you can click the button below to remove it.<br/><div class=\"xkit-button\" id=\"xkit-delete-current-bookmark\">Delete this bookmark</div><a class=\"xkit-button\" href=\"/dashboard/\">Return to my dashboard</a></div></div>");		
		
		}

		$("#xkit-delete-current-bookmark").click(function() {

			XKit.extensions.bookmarker.remove_bookmark(str_sub);
			$("#xkit-bookmarker-not-found-msg").slideUp('fast', function() {
				$(this).remove();	
			});
			// remove_bookmark(str_sub, jQ(this), true);

		});	
		
	},
	
	init: function() {
		
		var m_html = "";
		
		for (var m_obj in XKit.extensions.bookmarker.bookmarks) {
			
			var current_bookmark = XKit.extensions.bookmarker.bookmarks[m_obj];
			m_html = m_html + XKit.extensions.bookmarker.create_bookmark_div(current_bookmark);
			
		}
		
		m_html = '<ul class="controls_section" id="xbookmarks">' + m_html + '</ul>' +
			'<div class="small_links" id="xbookmarker_small_links"><a href="#" onclick="return false;" id="xbookmarker_delete_all">delete all</a><a href="#" onclick="return false;" id="xbookmarker_help">bookmarker help</a></div>';
		
		if (document.location.href.indexOf("?bookmark=true") !== -1) {
			$("#right_column").prepend(m_html);
		} else {
			if ($("#tumblr_radar").length > 0) {
				$("#tumblr_radar").before(m_html);
			} else {
				$("#right_column").append(m_html);
			}
		}
		
		if ($(".xbookmark").length > 0) {
			$("#xbookmarks").slideDown('fast');
			$("#xbookmarker_small_links").slideDown('fast');
			$(".xbookmark_to_slidedown").slideDown('fast');
		}
		
		$("#xbookmarker_help").click(function() {
			
			XKit.window.show("Bookmarker Help","Bookmarker lists your bookmarks on the sidebar.<br/><br/>To rename or delete a bookmark, you can click them while holding the <b>ALT</b> key on your keyboard.<br/><br/>To go back to a bookmarked post, just click on the bookmark. If the post you've bookmarked is deleted, you'll get the posts made around that time.", "info", "<div class=\"xkit-button default\" id=\"xkit-close-message\">OK</div>");
			
		});
		
		$("#xbookmarker_delete_all").click(function() {
		
			XKit.window.show("Delete all bookmarks","You sure about this?", "question", "<div class=\"xkit-button default\" id=\"xkit-bookmarker-delete-all-ok\">OK</div><div class=\"xkit-button\" id=\"xkit-close-message\">Cancel</div>");
				
			$("#xkit-bookmarker-delete-all-ok").click(function() {
					
				XKit.window.close();
				XKit.extensions.bookmarker.remove_all_bookmarks();
					
			});	
			
		});
		
		$(document).on("click", ".xkit_bookmarker_button", function(event){
			
			var post_id = $(this).attr('data-xkit-bookmarker-post-id');
			if ($(this).hasClass("on") === true) {
				$(this).removeClass("on");
				XKit.extensions.bookmarker.remove_bookmark(post_id);
				
			} else {
				$(this).addClass("on");
				XKit.extensions.bookmarker.add_bookmark(post_id);
			}
			
		});	

		
		$(document).on("click", ".xbookmark", function(event){
			
			var post_id = $(this).attr('data-xkit-bookmark-post-id');
			
			var m_object = XKit.extensions.bookmarker.retrieve_bookmark_object(post_id);
			
			if (event.altKey) {
				// Ask for the caption.
				XKit.window.show("Rename/Delete bookmark","What would you like to rename this to? <input id=\"xkit-bookmark-caption\" type=\"text\" class=\"xkit-textbox\" placeholder=\"Write something short here.\">", "question", "<div class=\"xkit-button default\" id=\"xkit-bookmarker-rename-ok\">OK</div><div class=\"xkit-button\" id=\"xkit-bookmarker-delete-ok\">Delete this bookmark</div><div class=\"xkit-button\" id=\"xkit-close-message\">Cancel</div>");
				
				$("#xkit-bookmarker-delete-ok").click(function() {
					
					XKit.window.close();
					XKit.extensions.bookmarker.remove_bookmark(post_id);
					
				});
				
				$("#xkit-bookmarker-rename-ok").click(function() {
				
					var m_value = $("#xkit-bookmark-caption").val();
					m_value = m_value.replace(/<(?:.|\n)*?>/gm, '');
					
					if (jQuery.trim(m_value) === "") {
						// Use date.	
						m_object.caption = "";
					} else {
						// Use user entered thingy.
						m_object.caption = m_value;
					}
					
					$("#xkit_bookmark_" + post_id).find(".bookmark-caption").html(m_object.caption);
					
					XKit.window.close();
					XKit.extensions.bookmarker.save_bookmarks();	
					
				});
				
			} else {
				// Go to the post!	
				post_id = parseInt(post_id);
				if (XKit.extensions.bookmarker.preferences.new_tab.value === true) {
					window.open("/dashboard/100/" + (post_id + 1) + "/?bookmark=true");	
				} else {
					document.location.href = "/dashboard/100/" + (post_id + 1) + "/?bookmark=true";
				}
			}
			
		});	
		
	},
	
	retrieve_bookmark_object: function(post_id) {
		
		for (var i=0;i<XKit.extensions.bookmarker.bookmarks.length; i++) {
			if (XKit.extensions.bookmarker.bookmarks[i].id === post_id) {	
				return XKit.extensions.bookmarker.bookmarks[i];
			}
		}
		
		return false;
		
	},
	
	create_bookmark_div: function(current_bookmark) {
		
		var nowdate = new Date();
		var nowdatem = moment(nowdate);
		
		if (current_bookmark.id === "" || typeof current_bookmark.id === "undefined") {
			return "";
		}
			
		var bookmark_caption = current_bookmark.caption;
		if (bookmark_caption === "" ||typeof bookmark_caption === "undefined") {
			var dt = moment(current_bookmark.date);
			bookmark_caption = dt.from(nowdatem);
		}
	
		return	'<li class="no_push xbookmark xbookmark_to_slidedown" style="display: none;" id="xkit_bookmark_' + current_bookmark.id + '" data-xkit-bookmark-post-id="' + current_bookmark.id + '">' +
				'<a href="#" onclick="return false"><span class="bookmark-caption">' + bookmark_caption + '</span></a>' +
			'</li>';	
		
	},
	
	add_bookmark: function(post_id) {
	
		if (XKit.extensions.bookmarker.retrieve_bookmark_object(post_id) !== false) {
			// Already bookmarked.
			return;
		}
		
		var ts = Math.round((new Date()).getTime() / 1000);
   		var current_bookmark_date = (ts * 1000) - 2000;
   		
   		var m_obj = new Object();
   		m_obj.id = post_id;
   		m_obj.date = current_bookmark_date;
   		m_obj.caption = "";
   		
		XKit.extensions.bookmarker.bookmarks.push(m_obj);
		XKit.extensions.bookmarker.save_bookmarks();	
		
		setTimeout(function() {
			$("#xbookmarks").append(XKit.extensions.bookmarker.create_bookmark_div(m_obj));
			$(".xbookmark_to_slidedown").slideDown('fast');
		}, 250);
		
		$("#xbookmarks").slideDown('fast');
		$("#xbookmarker_small_links").slideDown('fast');	
		
	},
	
	remove_all_bookmarks: function() {
	
		while(XKit.extensions.bookmarker.bookmarks.length>0) {
			XKit.extensions.bookmarker.remove_bookmark(XKit.extensions.bookmarker.bookmarks[0].id);
		}	
		
		XKit.extensions.bookmarker.save_bookmarks();
		
		$(".xbookmark").slideUp('fast', function() {
			$(this).remove();
		});
		
		$("#xbookmarks").slideUp('slow');
		$("#xbookmarker_small_links").slideUp('slow');	
		
	},
	
	remove_bookmark: function(post_id,mass_mode) {
	
		var m_index = -1;
		
		for (var i=0;i<XKit.extensions.bookmarker.bookmarks.length; i++) {
			if (XKit.extensions.bookmarker.bookmarks[i].id == post_id) {	
				m_index = i;
				break;
			}
		}
		
		if (m_index === -1) {
			// Not found, don't bother trying to remove it.
			return;	
		}
		
		var m_index = XKit.extensions.bookmarker.bookmarks.indexOf(post_id);
		XKit.extensions.bookmarker.bookmarks.splice(m_index - 1, 1);	
		
		if (mass_mode === true) {
			return;	
		}
		
		$("#post_" + post_id).find(".xbookmarker_post_icon").removeClass("on");
		
		XKit.extensions.bookmarker.save_bookmarks();
		
		$("#xkit_bookmark_" + post_id).slideUp('fast', function() {
			
			$(this).remove();
			
			if ($(".xbookmark").length <= 0) {
				$("#xbookmarks").slideUp('slow');
				$("#xbookmarker_small_links").slideUp('slow');	
			}	
		});

	},
	
	load_bookmarks: function() {
		
		var m_bookmarks = XKit.storage.get("bookmarks","my_bookmarks","");
		try {
			XKit.extensions.bookmarker.bookmarks = JSON.parse(m_bookmarks);
		} catch(e) {
			XKit.extensions.bookmarker.bookmarks = new Array();
			XKit.extensions.bookmarker.save_bookmarks();
		}
		
	},
	
	save_bookmarks: function() {
	
		XKit.storage.set("bookmarks","my_bookmarks", JSON.stringify(XKit.extensions.bookmarker.bookmarks));	
		
	},
	
	do: function() {
	
		// Create a temp array to look up so to not waste CPU.
		var m_array = new Array();
		for(var i=0;i<XKit.extensions.bookmarker.bookmarks.length;i++) {
			m_array.push(XKit.extensions.bookmarker.bookmarks[i].id);
		}
	
		$(".post").not(".note").not(".xbookmarker_done").each(function() {

			var post_id = $(this).attr('data-post-id');
			$(this).addClass("xbookmarker_done");

			var m_class = "xkit_bookmarker_button";
			if (m_array.indexOf(post_id) !== -1) {
				m_class = "xkit_bookmarker_button on";
			}

			var m_html = "<a class=\"post_control post_control_icon xbookmarker_post_icon " + m_class + "\" data-xkit-bookmarker-post-id=\"" + post_id + "\" onclick=\"return false\"></a>";
			$(this).find(".post_controls").prepend(m_html);
			
		});	
		
	},

	destroy: function() {
		$("#xbookmarks").remove();
		$("#xbookmarker_small_links").remove();
		$(".xbookmarker_post_icon").remove();
		XKit.tools.remove_css("bookmarker");
		XKit.post_listener.remove("bookmarker");
		this.running = false;
	}

});