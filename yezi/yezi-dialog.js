;
//http://s0.yangfan.deving.3322.org/core/js/others/formater/formater.js
var Formater = function(template, patten) {
	this.template = template;
	this.patten = patten || /{([^{}]+)}/gm;
	this.Store = [];
	this.data = {};
	var me = this;
	this.exec = exec;
	this.build = build;
	this.build();
	return this;

	function exec(collection) {
		this.data = collection || {};
		return this.Store.join("");
	}
	function build(newTemplate, newPatten) {
		if (newTemplate) {
			this.template = newTemplate;
		}
		if (newPatten) {
			this.patten = newPatten;
		}
		if (this.template) {
			this.Store.length = 0;
			var tmp =  this.template
				,lastLastIndex = 0
				,flags =	(this.patten.ignoreCase ? "i" : "") +
							(this.patten.multiline  ? "m" : "") +
							(this.patten.sticky     ? "y" : "")
				,separator = RegExp(this.patten.source, flags + "g");
			while(match = separator.exec(tmp)){
				var lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser
				this.Store.push(tmp.slice(lastLastIndex,match.index));
				lastLastIndex = lastIndex;
				if (match) {
					this.Store.push(new struct(match[1]));
				}
				if (match && separator.lastIndex === match.index)
				separator.lastIndex++; // avoid an infinite loop
			}
			if(lastLastIndex<tmp.length){
				this.Store.push(tmp.slice(lastLastIndex));
			}
		}
	}

	// defined
	function struct(str) {
		this.str = str;
		this.toString = function() {
			return me.data[this.str] || "";
		}
	}


}

;(function($){
/*

性能指标:(ie下比较有限制)
以一次全选一组为标准:
1 请求返回的数据量;(其实就是生成的dom对象的量)
2 每个分组的联系人最高数量;
1,2要结合
==============================

目前测试了数据量为896个联系人,
最多的一个分组有730个联系人(不重复计算),
分组中有部分重复[总大小:100k左右]
[ie6,7加载数据量最好不要超过300(未测),会出现各种操作都很卡的现象]

全选
ie6: 20,有点延迟, 1600~2000ms
ie7: 50,有点延迟, 1500~2200ms
ie8: 630, 有点延迟, 1400ms~2000ms
遨游3: 50,ie7的水平
--------------------------------------
ff3.6: 730, 有点延迟, 900~1300ms
ff7.0: 730, 有那么一丁点延迟, 400~900ms
opera11.52: 730, 有那么一丁点延迟, 400~900ms
chrome14: 730, 有那么一丁点延迟, 400~800ms
===============================

综合考虑之后,决定:
ie6,7每个分组最多显示50人.这样单次全选的性能可以得到提升
ie6就可以单次全选50人.有点延迟,但可接受

*/

	$.fn.contactsDialog =function(setting){
		var defaults={
			contacts_get : ["http://i.shequ.10086.cn/ajax.php?_act=groupChinaMobile&callback=?","jsonp"],//"jsonss.js",
			contacts_search : ["http://i.shequ.10086.cn/ajax.php?_act=searchChinaMobile&callback=?","jsonp"],//搜索联系人的ajax url
			contacts_selected : [],
			css_skin : "",//作为skin的class使用
			num_max : 100,
			templateStr : "<i><\/i><p title=\"{text}\">{text}<\/p>",
			submitBack : function(){},//确定后的事件
			cancelBack : function(){}//取消后的事件
		};
		
		var dialog_str = "<div class=\"contacts-box-dialog\" id=\"contacts-box-dialog\" style=\"display:none;\">"
			+"<table cellspacing=\"5\"><tr><td colspan=\"2\">"//此处使用cellspacing是因为ie不识别border-spacing,不知道为什么
					+"<div class=\"contacts-box-title\">请选择联系人<\/div>"
				+"<\/td><\/tr><tr><td>"
				+"<div class=\"contacts-box-searchBar clearfix\">"
					+"<span class=\"contacts-box-btnSearch\" id=\"contacts-box-btnSearch\"><\/span>"
					+"<input type=\"text\" value=\"拼音、姓名、手机号\" id=\"contacts-box-inputTips\" \/>"
					+"<input type=\"text\" value=\"\" class=\"contacts-box-realInput\" id=\"contacts-box-inputSearch\" style=\"display:none;\" \/>"
				+"<\/div>"
			+"<\/td><td>"
				+"<div class=\"contacts-box-status clearfix\" id=\"contacts-box-status\">"
					+"<div class=\"contacts-box-btnClear\" id=\"contacts-box-btnClear\">清空所选<\/div>"
					+"<div class=\"contacts-box-numbers\">"
						+"<i class=\"contacts-box-selectedNum\" id=\"contacts-list-selectedNum\">0<\/i>/<i class=\"contacts-box-maxNum\" id=\"contacts-box-maxNum\"><\/i>人"
					+"<\/div>"
				+"<\/div>"
			+"<\/td><\/tr><tr><td>"
				+"<div class=\"contacts-box-twoTree\" id=\"contacts-box-twoTree\">"
					+"<div class=\"contacts-box-twoTreeInner clearfix\" >"
						+"<div class=\"contacts-box-cTree\" id=\"contacts-box-cTree\">"
						+"<\/div>"
						+"<div class=\"contacts-box-cSearch\" id=\"contacts-box-cSearch\" style=\"display:none;\">"
						+"<\/div>"
					+"<\/div>"
				+"<\/div>"
			+"<\/td><td>"
				+"<div class=\"contacts-box-selectedWrap\">"
					+"<ul id=\"contacts-box-cSelected\">"
					+"<\/ul>"
				+"<\/div>"
			+"<\/td><\/tr><tr><td colspan=\"2\">"
				+"<div class=\"contacts-box-btmBar clearfix\">"
					+"<div class=\"contacts-box-tips\">"
						
					+"<\/div>"
					+"<div class=\"contacts-box-btmBtns\">"
						+"<span class=\"contacts-box-btnCancel\" id=\"contacts-box-btnCancel\">取消<\/span>"
						+"<span class=\"contacts-box-btnSubmit\" id=\"contacts-box-btnSubmit\">确认<\/span>"
					+"<\/div>"
				+"<\/div>"
			+"<\/td><\/tr><\/table><\/div>";
			
		window.Dialog_Times=0;//为了防止js延时而导致的可多次点击
		this[0].mySetting = new Object($.extend(defaults,setting));
		this[0].mySetting.that = this;
		$(this).bind("click",function(){
			if(Dialog_Times!=0){return false;}
			Dialog_Times=1;
			
			$(".contacts-list-groupWrap").not(".hidden").addClass("hidden");
			$(".contacts-list-listDrop").hide().html('');
			if(!$("#contacts-box-dialog")[0]){
				initialize();
			};
			
			var $c_dialog = $("#contacts-box-dialog");
			var $c_search = $("#contacts-box-cSearch",$c_dialog);
			var $c_selected = $("#contacts-box-cSelected",$c_dialog);
			var $c_tree = $("#contacts-box-cTree",$c_dialog);
			var $btn_search = $("#contacts-box-btnSearch",$c_dialog);
			var $input_search = $("#contacts-box-inputSearch",$c_dialog);
			
			this.mySetting.template = new Formater(this.mySetting.templateStr);
			var o = $c_dialog[0].mySetting = this.mySetting;
			$("#contacts-box-maxNum").text(o.num_max);
			$c_tree.text("联系人列表加载中...");
			$c_dialog.addClass(o.css_skin);
			resetPosition();
			if ( is_lt_IE(8) ){
				$c_dialog.show();
				loadContacts(o);
			}else{
				$c_dialog.fadeIn(200,function(){loadContacts(o)});
			};
			
		});
		
		//重置对话框内容
		function resetDialog(){
			$("#contacts-box-cTree").css({"marginLeft":0}).text('').data("withOutGroup",{});
			$("#contacts-box-cSelected").text('').data("selected",[]);
			$("#contacts-box-inputSearch").val('').hide();
			$("#contacts-box-btnSearch").removeClass("stopSearch");
			$("#contacts-box-inputTips").show();
			$("#contacts-box-cSearch").data("searched",{});
			$("#contacts-list-selectedNum").text('0');
		};
		
		//重置宽高
		function resetPosition(){
			var $c_dialog = $("#contacts-box-dialog");
			$("#dialog-iframe,#dialog-shadow").hide();
			var w_c = $c_dialog.width();
			var h_c = $c_dialog.height();
			var w_w = $(window).width();
			var h_w = $(document).height();
			var h_b = $("body").height();
			if( h_c >= h_w ){
				$c_dialog.css({"top" : 0,"marginTop" : 0,"marginLeft" : -w_c/2});
			}else{
				$c_dialog.css({"top" : "50%","marginTop" : -h_c/2,"marginLeft" : -w_c/2});
			}
			$("#dialog-iframe,#dialog-shadow").css({"width" : w_w,"height" : (h_w>h_b?h_w:h_b)}).show();
			
		};
		
		//初始化左边列表
		function loadContacts(o){
			if( o._data && o._data[0] ){
				setContactsTree(o,o._data);
			}else{
				$.ajax({
					type:"GET",
					url: o.contacts_get[0],
					dataType: o.contacts_get[1],
					success: function(data){
						$(o.that)[0].mySetting._data=data;
						setContactsTree(o,data);
					}
				});
			}
		};
		
			//设置联系人树
		function setContactsTree(o,data){
			//已选中的
			if( o.contacts_selected && o.contacts_selected[0] ){
				var selectedIDs = [].concat(o.contacts_selected[0].data(o.contacts_selected[1]));//创建新数组
				if(!selectedIDs){return;}
				var $c_selected = $("#contacts-box-cSelected");
				var c_selectedStr = '';
				var c_ids = '';
				for( var i=0 , j=selectedIDs.length; i<j ; i++ ){
					var c_json = selectedIDs[i];
					var c_id = c_json["id"];
					c_ids += "#contacts-box-cTree .C_"+c_id+",";
					c_selectedStr += "<li c_id=\""+c_id+"\" class=\"C_"+c_id+"\">"+o.template.exec(c_json)+"<\/li>";
				}
				$c_selected.data("selected",selectedIDs);
				c_ids = c_ids.substring(0,(c_ids.length-1));
				$c_selected.html(c_selectedStr)
			};
			if( !!data && data[0] ){
				var $c_tree = $("#contacts-box-cTree");
				var allContacts = {};
				var c_htmlStr = '';
				for( var i=0 , n=data.length , y=0; i<n ; i++ ){
					var c_i = data[i];
					var items_i = c_i["items"];
					c_htmlStr+="<div class=\"contacts-box-group\"><h4 class=\"clearfix\"><i><\/i><p title=\""+c_i["text"]+"\">"+c_i["text"]+"<\/p><\/h4><ul>";
					for( var j=0 , m=items_i.length; j<m ; j++ ,y++){
						if(is_lt_IE(8) && j>50){break;}
						var c_json = items_i[j];
						var c_id = c_json["id"].toString();
						c_htmlStr+="<li c_id=\""+c_id+"\" class=\"C_"+c_id+"\">"+o.template.exec(c_json)+"<\/li>";
						
						//无分组列表
						allContacts[c_id]=c_json;
					}
					c_htmlStr+="<\/ul><\/div>";
					if(is_lt_IE(8) && y>400){break;}
				};
				$c_tree.data("withOutGroup",allContacts);
				$c_tree.html(c_htmlStr);
				if( is_lt_IE(8) ){
					$(".contacts-box-tips").attr("title","想获取更多联系人?请使用版本较高的浏览器!").html("每组最多显示50人，更多请使用搜索");
				}
				
				if( !!c_ids ){
					$(c_ids).addClass("checked");
				}
				groupCheck();
				
			}
		};
		//判断分组是否全选
		function groupCheck(){
			$("#contacts-box-cTree>.contacts-box-group").each(function(){
				var $thisG = $(this);
				var $thisH = $thisG.children("h4");
				var allLi = $thisG.children("ul").children("li");
				var L_allLi = allLi.length;
				var L_checked = allLi.filter(".checked").length;
				if( L_checked>=L_allLi ){
					$thisH.removeClass("checksome").not(".checked").addClass("checked");
				}else if( L_checked>0 ){
					$thisH.removeClass("checked").not(".checksome").addClass("checksome");
				}else if( L_checked<=0 ){
					$thisH.removeClass("checked checksome");
				}
			});
			//还剩多少个可以选
			var selected_num = $("#contacts-box-cSelected").children("li").length;
			var num_remain = $("#contacts-box-maxNum").text() - selected_num;
			$("#contacts-box-status").attr("num_remain",num_remain);
			$("#contacts-list-selectedNum").text(selected_num);
		};
		function is_lt_IE(v){
			if( $.browser.msie && parseInt($.browser.version)<v ){
				return true;
			}else{
				return false;
			}
		};
		function is_valuable_key(keycode) {
			if ((keycode >= 48 && keycode <= 90) || // 0-1a-z
			(keycode >= 96 && keycode <= 111) || // numpad 0-9 + - / * .
			(keycode >= 186 && keycode <= 192) || // ; = , - . / ^
			(keycode >= 219 && keycode <= 222) || // ( \ ) '
			(keycode == 32) || (keycode == 229) ||
			(keycode == 8) || (keycode == 13) ||(keycode == 40)
			) {
				return true;
			} else {
				return false;
			}
		};
		//初始化
		function initialize(){
			$("body").append(dialog_str);
			var $c_dialog = $("#contacts-box-dialog");
			var $tree_two = $("#contacts-box-twoTree",$c_dialog);
			var $c_search = $("#contacts-box-cSearch",$c_dialog);
			var $c_selected = $("#contacts-box-cSelected",$c_dialog);
			var $c_tree = $("#contacts-box-cTree",$c_dialog);
			var $btn_search = $("#contacts-box-btnSearch",$c_dialog);
			var $btn_clearAll = $("#contacts-box-btnClear",$c_dialog);
			var $input_search = $("#contacts-box-inputSearch",$c_dialog);
			var $input_tips = $("#contacts-box-inputTips",$c_dialog);
			//初始化data
			$c_tree.data("withOutGroup",{});
			$c_search.data("searched",{});
			$c_selected.data("selected",[]);
			
			(function shadow(){
				var cssOpt = {"display":"none","left": 0,"top": 0,"position": "absolute","width" : $(window).width(),"height" : $(document).height()};
				var $shadow = $("<div id=\"dialog-shadow\"><\/div>").css(cssOpt).css({"opacity" : 0.2,"backgroundColor" : "#000","zIndex" : 99991}).appendTo(document.body);
				var w = $c_dialog.width() , h = $c_dialog.height();
				$c_dialog.css({"marginLeft" : -w/2,"marginTop" : -h/2,"zIndex" : 99992});
				
				if ( is_lt_IE(7) ){
					var $iframe = $("<iframe id=\"dialog-iframe\" src=\"about:blank\" frameBorder=\"0\"><\/iframe>").css(cssOpt).css({"opacity": 0,"zIndex": 99990}).appendTo(document.body);
				};
			})();
				
			(function addEvents(){
				
				var _temp={ _timer : '', _ajax : '' };
					//搜索ajax
				function catchjson(val){
					if(val==""){
						if ( is_lt_IE(9) ){
							$c_tree.css({"marginLeft":0});
						}else{
							$c_tree.animate({"marginLeft":0},300);
						};
						$c_search.html('').hide();
						$btn_search.removeClass("stopSearch");
						return;
					};
					$btn_search.addClass("stopSearch");
					var o = $c_dialog[0].mySetting;
					_temp._ajax = $.ajax({
						type : "GET",
						url : o.contacts_search[0],
						data : {q:val},
						dataType : o.contacts_search[1],
						success: function(_jsons){
							_temp._ajax=undefined;
							if(!!_jsons && _jsons.length>0){
								setList(o,_jsons);
								var searchedContacts = $c_search.data("searched");
								for( var i=0 , n =_jsons.length ; i<n ; i++ ){
									var _id=_jsons[i]["id"].toString();
									searchedContacts[_id] = _jsons[i];
								}
							}else{
								$c_search.html("<div style=\"padding:5px 0;text-align:center;\">找不到结果...<\/div>").show();
								if ( is_lt_IE(9) ){
									$c_tree.css({"marginLeft":-$c_tree.outerWidth()});
								}else{
									$c_tree.animate({"marginLeft":-$c_tree.outerWidth()},300);
								};
							};
						}
					});
				};
				//搜索列表
				function setList(o,jsons){
					var jsonSelected = $c_selected.data("selected");
					var c_ids ='';
					var c_searchStr = '<div class=\"contacts-box-group clearfix\"><ul>';
					for( var i=0 , n=jsons.length ; i<n ; i++ ){
						var c_json = jsons[i];
						var c_id = c_json["id"];
						c_searchStr+="<li c_id=\""+c_id+"\" class=\"C_"+c_id+"\">"+o.template.exec(c_json)+"<\/li>";
					}
					c_searchStr+="<\/div><\/ul>";
					$c_search.html(c_searchStr).show();
					if( jsonSelected.length>0 ){
						for( var i=0 , n=jsonSelected.length ; i<n ; i++ ){
							var _id = jsonSelected[i]["id"];
							c_ids+=".C_"+_id+",";
						}
						c_ids = c_ids.substring(0,(c_ids.length-1));
						$c_search.find(c_ids).addClass("checked");
					};
					if ( is_lt_IE(9) ){
						$c_tree.css({"marginLeft":-$c_tree.outerWidth()});
					}else{
						$c_tree.animate({"marginLeft":-$c_tree.outerWidth()},300);
					};
					
				};
				
				
				$input_search.unbind("keyup").bind("keyup",function(e,_e){
					var code = 0;
					if( !!e.keyCode ){
						code = e.keyCode
					}else if( !!_e && !!_e.keyCode ){
						code = _e.keyCode
					}else{
						return;
					}
					if( !is_valuable_key(code) ) {return;}
					var _val = $(this).val();
					if(!!_temp._ajax){_temp._ajax.abort();};
					if(!!_temp._timer){clearTimeout(_temp._timer);};
					_temp._timer = setTimeout(function(){catchjson(_val)},300);

				});
			
				$input_search.bind("blur",function(){
						var input_this = $(this);
						if(input_this.val()==''){
							$(this).hide();
							$input_tips.show();
						}
					});
				$btn_search.bind("click",function(){
					var $_this = $(this);
					if( $_this.is(".stopSearch") ){
						$input_search.val('').trigger("keyup",[{keyCode:40}]).blur();
					}else{
						$input_search.trigger("keyup",[{keyCode:40}])
					}
				});
				$input_tips.bind("focus",function(){
					$(this).hide();
					$input_search.show().trigger("focus");
				});
				//删除已选中
				$c_selected.bind("click",function(e){
					var $_this = $(e.target);
					if( $_this.is("i") ){
						var $this_li = $_this.parent("li");
						var id = $this_li.attr("c_id");
						var jsonSelected = $c_selected.data("selected");
						
						for( var i=0 , n = jsonSelected.length ; i<n ; i++ ){
							if( jsonSelected[i]["id"] == id ){
								jsonSelected.splice(i,1);
								break;
							}
						}
						$this_li.remove();
						$("#contacts-box-twoTree .C_"+id).removeClass("checked");
						groupCheck();
					}
				});
					
				//分组全选
				$tree_two.bind("click",function(e){
					var $_this = $(e.target);
					if( !$_this.is("i") ){return;}
					
					var o = $c_dialog[0].mySetting;
					var $_parent = $_this.parent();
					var num_remain = $("#contacts-box-status").attr("num_remain") || 0;
					var jsonSelected = $c_selected.data("selected") || [];
					
					if( $_parent.is("li") ){
						//check单个联系人
						var c_id = $_parent.attr("c_id");
						if( !$_parent.is(".checked") && num_remain>0){//判断是否选中且剩下可选数为0
							if( !$(".C_"+c_id,$c_selected)[0] ){
								if( !!$_parent.closest("#contacts-box-cTree")[0] ){
									jsonSelected.push($c_tree.data("withOutGroup")[c_id]);
								}else{
									jsonSelected.push($c_search.data("searched")[c_id]);
								};
								$_parent.clone().removeClass("checked").appendTo($c_selected);
							}
							$("#contacts-box-twoTree .C_"+c_id).addClass("checked");
						}else{
							var $selectedLi = $(".C_"+c_id,$c_selected);
							if( jsonSelected[0] ){
								for( var i=0 , n=jsonSelected.length ; i<n ; i++ ){
									if( jsonSelected[i]["id"] == c_id ){
										jsonSelected.splice(i,1);
										break;
									}
								}
							}
							$("#contacts-box-twoTree .C_"+c_id).removeClass("checked");
							$selectedLi.remove();
						}
						groupCheck();
					}else if( $_parent.is("h4") ){
						//分组全选
						var $thisUl = $_parent.next("ul");
						//如果是半选中或未选中,且剩余可选人数不为0 时.再点击一下则全选中
						if( !$_parent.is(".checked") && num_remain>0){
							var $notCheck = $thisUl.find("li").not(".checked");
							var c_ids = '';
							var c_ids_str='';
							var i=0;
							var allContacts = $c_tree.data("withOutGroup");
							var $selected = $("#contacts-box-cSelected");
							$notCheck.each(function(){
								if(i>=num_remain){return false;}
								var $_this=$(this);
								var c_id = $_this.attr("c_id").toString();
								if($selected.find(".C_"+c_id).length<=0){
									var c_json = allContacts[c_id];
									c_ids +="#contacts-box-cTree li.C_"+c_id+",";
									c_ids_str+= "<li c_id=\""+c_id+"\" class=\"C_"+c_id+"\">"+o.template.exec(c_json)+"<\/li>";
									jsonSelected.push(c_json);
									i++;
								}
							});
							c_ids = c_ids.substring(0,(c_ids.length-1));
							$c_selected.append(c_ids_str);
							$(c_ids).not(".checked").addClass("checked");
						}else{
							var $checked = $("li.checked",$thisUl);
							var c_ids = '';
							var c_ids_str = '';
							$checked.each(function(){
								var c_id = $(this).attr("c_id").toString();
								c_ids+="li.C_"+c_id+",";
								for( var i=0 , n=jsonSelected.length ; i<n ; i++ ){
									if( jsonSelected[i]["id"] ==c_id ){
										jsonSelected.splice(i,1);
										break;
									}
								}
							});
							c_ids = c_ids.substring(0,(c_ids.length-1));
							$("#contacts-box-cTree").find(c_ids).removeClass("checked");
							
							for( var j=0 , m=jsonSelected.length; j<m ; j++ ){
								var c_json = jsonSelected[j];
								var c_id = c_json["id"];
								c_ids_str+= "<li c_id=\""+c_id+"\" class=\"C_"+c_id+"\">"+o.template.exec(c_json)+"<\/li>";
							}
							$c_selected.html(c_ids_str);
							
						}
						groupCheck();
					}
				});
				//组显示隐藏
				$c_tree.find("h4").live("click",function(e){
					if( !$(e.target).is("i") ){
						$(this).next("ul").toggle();
					}
				});
				
				$btn_clearAll.bind("click",function(){
					$c_selected.text('').data("selected",[]);
					$("#contacts-box-twoTree li.checked").removeClass("checked");
					groupCheck();
				});
				
					
				//针对不同的list返回不同的callback
				$("#contacts-box-btnSubmit,#contacts-box-btnCancel").bind("click",function(){
					var o = $c_dialog[0].mySetting;
					$("#contacts-box-dialog").removeClass(o.css_skin).add("#dialog-iframe,#dialog-shadow").hide();
					var data = $("#contacts-box-cSelected").data("selected");
					if($(this).is("#contacts-box-btnSubmit")){
						typeof(o.submitBack) === "function" ? o.submitBack(data) : o.submitBack;
					}else{
						typeof(o.cancelBack) === "function" ? o.cancelBack(data) : o.cancelBack;
					}
			
					//重置对话框内容
					(function resetDialog(){
						$("#contacts-box-cTree").css({"marginLeft":0});
						$("#contacts-box-cSelected").text('');
						$("#contacts-box-inputSearch").val('').hide();
						$("#contacts-box-btnSearch").removeClass("stopSearch");
						$("#contacts-box-inputTips").show();
						$("#contacts-list-selectedNum").text('0');
					})();
					Dialog_Times=0;
				});
					
				
			})();
		};
		
		
	};
})(jQuery);