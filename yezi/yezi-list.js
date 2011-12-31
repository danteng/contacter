;(function($){
	$.fn.extend({
		contactList : function(setting){
			var defaults={
					contacts_get : ["http://i.shequ.10086.cn/ajax.php?_act=groupChinaMobile&callback=?","jsonp"],//"jsonss.js",
					contacts_search : ["http://i.shequ.10086.cn/ajax.php?_act=searchChinaMobile&callback=?","jsonp"],//搜索联系人的ajax url
					contacts_selected : [],//初始化已选中的联系人
					skin_dialog : "",
					no_batch_add : false,
					num_to_group : 2,
					maxHeight : 0,
					num_max : 100,
					num_max_search : 10
				};
			
			var o = $.extend(defaults,setting || {});
			
			var $dialog = $(this).addClass("contacts-list-container");
			var $c_wrap = $(".contacts-list-wrap",$dialog);
			var $c_list = $(".contacts-list-list",$dialog);
			var $c_list_Num = $(".contacts-list-num>i",$dialog);
			var $c_abbr = $(".contacts-list-abbrTitle",$dialog);
			var $c_group = $(".contacts-list-groupWrap",$dialog);
			var $c_group_title = $(".contacts-list-groupTitle",$c_group)
			var $c_group_wrap = $(".contacts-list-groupList",$c_group);
			var $Btn_add = $(".contacts-list-btnAdd",$dialog);
			
			var $c_data = $("<input type=\"hidden\" value=\"\" class=\"contacts-list-data\" \/>").appendTo($dialog);
			
			//获取初始值
			var max_width = parseInt($c_abbr.css("width"));
			var ml_add = 6;
			
			
			
			//展示隐藏组
			$c_group_title.bind("click",function(){
				var $t_group = $(this);
				if( $c_group.is(".hidden") ){
					$c_group.removeClass("hidden");
					setHeight();
				}else{
					$c_group.addClass("hidden");
				}
			});
			
			//删除单个联系人
			$c_list.find("li>i").live("click",function(){
				var $thisLi = $(this).parent("li");
				var id_this = $thisLi.attr("c_id");
				var _json = $c_data.data("contactsArray");
				for( var i=0 ,j=_json.length; i<j ; i++ ){
					if( _json[i]["id"] ==id_this){
						_json.splice(i,1);
						break;
					}
				}
				$thisLi.remove();
				putListInto(false);
			});
			
			
			//联系人列表全替换
			function resetSelected(jsons){
				//return;
				var list_str = '';
				if( jsons[0] ){
					for( var i=0 , n=jsons.length; i<n ; i++ ){
						//如果是超过限制人数.则只截取限制人数的长度
						if( i>=o.num_max ){
							jsons=jsons.slice(0,i);
							break;
						}
						var jsons_i = jsons[i];
						if( !!jsons_i && jsons_i["id"]){
							list_str += "<li c_id=\""+jsons_i["id"]+"\"><p>"+jsons_i["text"]+"<\/p><i>X<\/i><\/li>";
						}else{
							//如果有undefined的项.则移除
							jsons.splice(i,1)
							n--;
							i--;
						}
					}
				}
				$c_list.html(list_str);
				$c_data.data("contactsArray",jsons);//此处jsons已移除undefined项
				putListInto(true);
				if(jsons.length>o.num_max){alert("超过上限( "+o.num_max+" )人！\n只取前"+o.num_max+"人。")};
			};
			//添加一个联系人
			function addSelected(json0,noAlert){
				var _jsons = $c_data.data("contactsArray");
				var _length = _jsons.length;
				if( _length >=o.num_max ){
					alert("已达到上限："+o.num_max+"人");
					return false;
				}
				var list_str='';
				for( var j=0 , m = _length ; j<m ; j++ ){
					if( _jsons[j]["id"] == json0["id"] ){
						noAlert ? null : alert("选择了重复的联系人");
						return true;
					}
				}
				list_str = "<li c_id=\""+json0["id"]+"\"><p>"+json0["text"]+"<\/p><i>X<\/i><\/li>";
				$c_data.data("contactsArray").push(json0);
				$c_list.append(list_str);
				putListInto(false);
				return false;
			};
			
			//组标题的字符长度控制
			function titleText(){
				var text_str='';
				$c_list.find("li>p").each(function(){
					text_str += $(this).text()+" , ";
				});
				$c_abbr.text(text_str);
				if(text_str.length<=9){
					text_str = text_str.substring(0,text_str.length-2);
					return;
				}
				var $abbr_copy = $c_abbr.clone().hide().css({"position":"absolute","width":"auto","overflow":"visible"}).insertAfter($c_abbr);
				if( max_width>=$abbr_copy.width() ){
					text_str = text_str.substring(0,text_str.length-2);
					$c_abbr.text(text_str);
				}else{
					if(text_str.length>50){ text_str = text_str.substr(0,50); }
					while (max_width<$abbr_copy.width()) {
						$abbr_copy.text(text_str);
						text_str = text_str.substring(0,text_str.length-2);
					}
					$c_abbr.text(text_str+"...");
				}
				$abbr_copy.remove();
			};
			//设置list的位置:组 or not
			function putListInto(set){
				if( !!o.num_to_group ){
					var length = $c_list.children("li").length;
					var bool = !$c_list.parent().is(".contacts-list-groupList");
					if( length>o.num_to_group && bool ){
						$c_list.appendTo($c_group_wrap);
					}else if( length<=o.num_to_group && !bool ){
						$c_list.prependTo($c_wrap);
					}
					length<=o.num_to_group ? $c_group.hide() : $c_group.show();
					$c_list_Num.text(length);
					set ? $c_group.not(".hidden").addClass("hidden") : $c_group.removeClass("hidden");
					titleText();
				}
				setHeight();
				typeof setWidth === "function" ? setWidth() : null;
			};
			//设置高度
			function setHeight(){
				if(!$.fn.jScrollPane){return;}
				$(".contacts-list-scrollBar").children().hide();
				if( o.maxHeight && $c_list.height()>=o.maxHeight){
					//$c_group_wrap.css({"height" : o.maxHeight});
					$c_list.css({"height" : o.maxHeight});
					$c_list.jScrollPane({scrollbarWidth:8});
				}else{
					$c_list.css({"marginTop" : 0});
					$c_group_wrap.css({"height" : "auto"});
					$c_list.jScrollPaneRemove();
					
				}
				
			}
			//搜索
				var $c_search = $(".contacts-list-inputSearch",$dialog);
				var w_search = parseInt($c_search.css("width"));
				//设置输入框宽度
				function setWidth(){
					var w_wrap = $c_wrap.width();
					$c_search.css("width",!!w_wrap ? (w_search-ml_add-w_wrap) : w_search)
				};
				if( !!$.getSearch ){
					$c_search.children("input").getSearch({
						container : $dialog,
						num_max_search : o.num_max_search,
						contacts_search : o.contacts_search,
						afterKeyup:function(){$(".contacts-list-groupWrap").not(".hidden").addClass("hidden");}
					});
				}else{
					$c_search.children("input").remove();
				};
			
			
				if( (!!$.fn.contactsDialog || !!$.contactsDialog) && !o.no_batch_add ){
					$Btn_add.contactsDialog({
						contacts_get : o.contacts_get,
						contacts_search : o.contacts_search,
						css_skin : o.skin_dialog,
						contacts_selected : [$(".contacts-list-data",$dialog),"contactsArray"],
						num_max : o.num_max,
						submitBack : function(json){
								resetSelected(json);
							}
					});
				}else{
					//未找到dialog.js
					$Btn_add.remove();
					//$dialog.width($dialog.width()-$Btn_add.outerWidth(true));
					//$Btn_add.addClass("btn-grey").attr("title","对不起,批量添加功能尚不能用");
				}
			
			//初始化列表
			function init(){
				$c_data.data("contactsArray",[])//初始化data
				var _jsons = o.contacts_selected;
				if( _jsons.length>0 ){
					resetSelected(_jsons);
				}
			
				$c_data.bind("setContacts" , function(e,data){
						resetSelected(data);
					}).bind("addContact" , function(e,data,noAlert){
						var dd=addSelected(data,noAlert);
						dd ? $(this).val("true") : $(this).val("");//用来确认是否重复添加了联系人
					}).bind("listRecent",function(e,max){
						var _this = $(this);
						var data_old = _this.data("recentContacts") || [];
						var data_new = _this.data("contactsArray");
						for( var i=0 , n = data_old.length ; i<n ; i++ ){	
							for( var j=0 , m = data_new.length ; j<m ; j++ ){
								if(data_old[i]["id"] == data_new[j]["id"]){
									data_old.splice(i,1);
									n--;i--;
									break;
								}
							}
						}
						for( var i=0 , n=data_new.length ; i<n ; i++ ){
							data_old.push(data_new[i]);
						}
						if( data_old.length>max&&max>0 ){
							data_old.splice(0,(data_old.length-max))
						}
						_this.data("recentContacts",data_old);
						
					});
			
			
			};
			init();
			
			
			if ( $.browser.msie && parseInt($.browser.version)<7 ) {
				$c_list.find("li").live("mouseover",function(){
					$(this).addClass("hover");
				}).live("mouseout",function(){
					$(this).removeClass("hover");
				});
			};
			

		},
		getContacts : function(){
			if(!$(this).is(".contacts-list-data")){return false;}
			return $(this).data("contactsArray");
		},
		
		setContacts : function(setting){
			if(!$(this).is(".contacts-list-data")){return false;}
			var defaults={
				data : []
			}
			var o = $.extend(defaults,setting || {});
			$(this).trigger("setContacts",[o.data]);
		},
		
		addContact : function(setting){
			if(!$(this).is(".contacts-list-data")){return false;}
			var defaults={
				data : {},
				noAlert : true
			}
			var o = $.extend(defaults,setting || {});
			var isHad = $(this).trigger("addContact",[o.data,o.noAlert]).val();
			return isHad;
		},
		
		listRecent : function(setting){
			if(!$(this).is(".contacts-list-data")){return false;}
			var defaults = {
				max : 0
			};
			var o = $.extend(defaults,setting || {});
			$(this).trigger("listRecent",[o.max]);
			return $(this).data("recentContacts");
		},
		
		clearRecent : function(){
			if(!$(this).is(".contacts-list-data")){return false;}
			$(this).data("recentContacts",[]);
		}
		
	});
		
		
})(jQuery);