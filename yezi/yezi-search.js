;(function($){
	//声明
	_temp={  _timer : '', _ajax : '' };
	$.fn.getSearch = function(opt){
		return this.each(function(){
			$.getSearch(this,opt);
		});
	};
		
	$.getSearch = function(thisobj,setting){
		if(!thisobj || typeof thisobj !=="object"){return;}
		var defaults={
				container : null,
				num_max_search : 10,//列表的下拉数量
				contacts_search : ["http://i.shequ.10086.cn/ajax.php?_act=searchChinaMobile&callback=?","jsonp"],//"search-as.js",
				afterKeyup : function(){}
			};
		
		var KEY = {
			TAB : 9,
			ESC : 27,//未使用
			LEFT : 37,//未使用
			UP : 38,
			RIGHT : 39,//未使用
			DOWN : 40,
			ENTER : 13,
			SPACEBAR : 32,//未使用
			BACKSPACE : 8,//未使用
			DELETE : 46//未使用
		};
		
		var o = $.extend(defaults,setting || {});
		var $c_container = o.container;
		var $c_list_wrap = $(".contacts-list-listDrop",$c_container);
		var $input_search = $(thisobj,$c_container);
		var $c_data =$c_container.find(".contacts-list-data");
		
		//搜索联系人
		$input_search.bind("focus" , function(){
				var $_this = $(this);
				$_this.parent().addClass("focus");
			}).bind("blur" , function(){
				var $_this = $(this);
				$_this.parent().removeClass("focus");
				if(!!_temp._ajax){_temp._ajax.abort();};
			}).bind("keyup",function(e){
				var _val = $(this).val().toLowerCase()
				var key = e.keyCode;
				var $list = $c_list_wrap.children("ul");
				
				if( is_valuable_key(key) || (key == KEY.DOWN && !$list[0]) ){
					if(!!_temp._ajax){_temp._ajax.abort();};
					if(!!_temp._timer){clearTimeout(_temp._timer);};
					if(key==KEY.ENTER && $c_list_wrap.find("li.hover")[0]){
						$c_list_wrap.find("li.hover").trigger("click");
						return;//$c_list_wrap.find("li.hover")
					}
					if(key != KEY.ENTER || ( key != KEY.DOWN && _val!="")){
						typeof o.afterKeyup==="function" ? o.afterKeyup() : null;
					};
					if(_val==""){
						$c_list_wrap.hide().text('').data("searchContacts",[]);
					}else{
						if( beforeAjax(_val) ){return false;};
						_temp._timer = setTimeout(function(){doSearch(_val)},400);
					}
				}
				cancel_bubble(e);
			}).bind("keydown",function(e){
				var $_this = $(this);
				
				if(!$(".contacts-list-listDrop").is(":visible") || !$(".contacts-list-listDrop").children("ul")[0]){ return; }
					
				var $curUl = $(".contacts-list-listDrop").children("ul");
				var $curLi = $curUl.children("li.hover");
				switch(e.keyCode){
					case KEY.TAB : //tab
						$(".contacts-list-listDrop").hide().html("").data("searchContacts",[]);
						break;
					/* case KEY.LEFT : //37 left
						break;
					case KEY.RIGHT : //39 right
						break; */
					case KEY.UP : //8 up
						if($curLi[0]){
							var preLi = $curLi.prev();
							if( preLi[0] ){
								preLi.trigger("mouseover");
								KEYDOWN(false,preLi)
							}else{
								//第一个li hover的时候
								$curUl.find("li").trigger("mouseout");
								KEYDOWN(true);
							};
						}else{
							//当没有li hover的时候
							$curUl.find("li:last").trigger("mouseover");
								KEYDOWN(false,$curUl.find("li:last"))
						};
						break;
					case KEY.DOWN : //40 down
						if($curLi[0]){
							var nextLi = $curLi.next();
							if(nextLi[0]){
								nextLi.trigger("mouseover");
								KEYDOWN(false,nextLi)
							}else{
								//最后一个li hover的时候
								$curUl.find("li").trigger("mouseout");
								KEYDOWN(true);
							}
						}else{
							//当没有li hover的时候
							$curUl.find("li:first").trigger("mouseover");
							KEYDOWN(false,$curUl.find("li:first"))
						};break;
					/* case KEY.ENTER : //13 enter
						$(".titlebar").text($(".titlebar").text()+"-down")
						if($curLi[0]){
						$(".titlebar").text($(".titlebar").text()+"-true")
							$curLi.trigger("click");
						}
						break; */
				};
				function KEYDOWN(is_original,obj){
					if( is_original ){
						$_this.val($_this[0]._old_val ? $_this[0]._old_val : '');
					}else{
						var i = $curUl.children().index(obj);
						var val = $c_list_wrap.data("searchContacts")[i]["text"];
						$_this.val(val);
					}
				}
			});
		
		//drop list事件
		$c_list_wrap.find("li").live("click",function(){
			var $_this = $(this);
			var index_this = $c_list_wrap.find("li").index($_this);
			var data_this = $c_list_wrap.data("searchContacts")[index_this];
			var isHad = $c_data.addContact({ data : data_this , noAlert : false});
			if(!!isHad){$c_data.val("");return false};
			$c_list_wrap.hide().html('').data("searchContacts",[]);
			$input_search.val('').focus();
			return false;
		}).live("mouseover",function(){
			$(this).addClass("hover").siblings("li").removeClass("hover");
		}).live("mouseout",function(){
			$(this).removeClass("hover");
		});
		
		function beforeAjax(_val){
			var _this = $input_search[0];
			if( _this.temp_result ){
				var _temp =  _this.temp_result[_val];
				if( !!_temp ){
					listDropDown(_val,_temp);
					return true;
				}
			}
			
		}
		
		//搜索联系人ajax
		function doSearch(_val){
			if( !beforeSearch(_val)){return false};
			
			$c_list_wrap.html('<div class=\"tips\"><p>搜索中...<\/p><\/div>').show();
			
			_temp._ajax = $.ajax({
				type : "GET",
				url : o.contacts_search[0],
				data : {q:_val},
				dataType : o.contacts_search[1],
				success: function(_jsons){
					_temp._ajax=undefined;
					if(_jsons && _jsons[0]){
						listDropDown(_val,_jsons);
					}else if( isMobile(_val) ){
						if( isChinaMobile(_val) ){
							$c_list_wrap.html('<div class=\"tips\"><p>他还不是您的联系人<\/p><\/div>').show();
							
						}else{
							$c_list_wrap.html('<div class=\"tips\"><p>您暂时无法向非移动号发送短信<\/p><\/div>').show();
						}
						
					}else{
						$c_list_wrap.html('<div class=\"tips\"><p>找不到结果<\/p><\/div>').show();
					}
				},
				error : function(){
					$c_list_wrap.hide().html('').data("searchContacts",[]);
				}
			});
		};
		//drop list搜索联系人下拉事件
		function listDropDown(_val,jsons){
			if($c_list_wrap.children("ul")[0]){ return; }
			
			var _this = $input_search[0];
			if( !_this.temp_result ){ _this.temp_result = {}; }
			_this._old_val = _val;
			_this.temp_result[_val] = jsons;
			$c_list_wrap.data("searchContacts",jsons)
			
			var max = o.num_max_search;
			$(".contacts-list-groupWrap").not(".hidden").addClass("hidden");
			var _dropStr = "<ul>";
			var _jsons_l = jsons.length;
			for( var i=0 , n=_jsons_l>=max ? max : _jsons_l ; i<n ; i++ ){
				var i_c = jsons[i];
				_dropStr+="<li class=\"\" c_id=\""+i_c["id"]+"\"><em>"+i_c["text"]+"<\/em><p>"+i_c["mobile"]+"<\/p><\/li>";
			}
			_dropStr+="<\/ul>";
			if( _jsons_l>=max ){
				_dropStr+="<div class=\"tips\"><p>只列出前"+max+"个结果，请输入更详细信息以获取更精确结果<\/p><\/div>"
			}
			//$(".contacts-list-listDrop").not($c_list_wrap).hide().text('');//.data("searchContacts",[]);
			$c_list_wrap.html(_dropStr).show();
		};
		//e.keycode是否有效
		function is_valuable_key(keycode) {
			if ((keycode >= 48 && keycode <= 90) || // 0-1a-z
			(keycode >= 96 && keycode <= 111) || // numpad 0-9 + - / * .
			(keycode >= 186 && keycode <= 192) || // ; = , - . / ^
			(keycode >= 219 && keycode <= 222) || // ( \ ) '
			(keycode == 32) || (keycode == 229) ||
			(keycode == 8) || (keycode == 13)
			) {
				return true;
			} else {
				return false;
			}
		}
		function beforeSearch(val) {
			var isNum = /^[0-9]*[1-9][0-9]*$/.test(val);//不全为0
			if (val.length < 3 && isNum) return false;
			return true;
		}
		//判断是否移动号码
		function isChinaMobile(val) {
			if (/^1(3[4-9]|5[012789]|8[78])\d{8}$/.test(val)) {
				return true;
			} else {
				return false;
			}
		}
		//判断是否正常号码
		function isMobile(val){
			if (/^1[3|5|8][0-9]{0,8}/.test(val) && val.length==11) {
				return true;
			} else {
				return false;
			}
		};
		
		//取消冒泡
		function cancel_bubble(e){
			var e = e||event;
			e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true ;
		};
		
		$(document).bind("click",function(e){
			var $_target = $(e.target);
			if (!$_target.closest(".contacts-list-container")[0]) {
				var val = $input_search.val();
				if( isChinaMobile(val) ){
					var _data = {};
					_data["id"] = _data["text"] = _data["mobile"] = val;
					var isHad = $c_data.addContact({data: _data,noAlert:true});
					if(!!isHad){$c_data.val("");};
					$c_list_wrap.hide().html('').data("searchContacts",[]);
					$input_search.val('').focus();
				};
			};
		});
		
		
		
	};

	
		
})(jQuery);
	
$(function(){

	//只绑定一次document事件
	$(document).bind("click",function(e){
			var $_target = $(e.target);
			//if (!$_target.closest(".contacts-list-groupWrap")[0] && !$_target.closest(".contacts-list-listDrop")[0]) {
				$(".contacts-list-wrap").not($_target.closest(".contacts-list-wrap")).find(".contacts-list-groupWrap").not(".hidden").addClass("hidden");
			//};
			if (!$_target.closest(".contacts-list-listDrop")[0]) {
				if(!!_temp._ajax){_temp._ajax.abort();};
				$(".contacts-list-listDrop").hide().html('').data("searchContacts",[]);
			};
		});

	
});