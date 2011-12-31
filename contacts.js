$(function(){
	$("#smsBox").contactList({
		skin_dialog : "contactsDialog",
		contacts_get : ["json1.js","json"],
		contacts_search : ["json3.js","json"],
		maxHeight : 56,
		num_max : 50,
		num_max_search : 2,
		num_to_group : 2
	});
	$("#smsBox1").contactList({
		contacts_get : ["json2.js","json"],
		maxHeight : 56,
		num_max : 20,
		num_to_group : 2
	});
	function sendFunc(){
		function listRecent(obj,maxNum,target){
			var data = obj.listRecent({max:maxNum})
			function addContact(data){
				obj.addContact({"data":data,"noAlert":false});
			}
			if(data.length>maxNum){
				data.splice(0,(data.length-maxNum));
			}
			
			var str = "";
			for( var i=data.length-1 ; i>=0 ; i-- ){
				str+="<li class=\"clearfix\"><em>"+(data[i]["text"] ? data[i]["text"] : data[i]["myname"])+"<\/em><\/li>"
			}
			$(target).html(str);
			$(target).find("li").unbind("click").bind("click",function(){
				addContact(data[data.length - 1 - $(target).find("li").index($(this))])
			})
		}
		function list(data){
			var str = "";
			for( var i=0 , n = data.length ; i<n ; i++ ){
				str+="<li class=\"clearfix\"><span>"+i+"<\/span><em>"+(data[i]["text"] ? data[i]["text"] : data[i]["myname"])+"<\/em><p>"+(data[i]["mobile"] ? data[i]["mobile"] : data[i]["fetionID"])+"<\/p><i>"+(data[i]["id"] ? data[i]["id"] : data[i]["mID"])+"<\/i><\/li>"
			}
			$("#list-allContacts").html(str);
		}
		
		$("#btn_clearAll").click(function(){
			$("#smsBox .contacts-list-data").setContacts({data:[]})
		});
		
		$("#btn_send").click(function(){
			var dd = $("#smsBox .contacts-list-data").getContacts();
			list(dd)
			listRecent($("#smsBox .contacts-list-data"),10,"#list-recentContacts");
		});
		
		$("#btn_clearAll1").click(function(){
			$("#smsBox1 .contacts-list-data").setContacts({data:[]})
		});
		
		$("#btn_send1").click(function(){
			var dd = $("#smsBox1 .contacts-list-data").getContacts();
			list(dd)
			listRecent($("#smsBox1 .contacts-list-data"),10,"#list-recentContacts1");
		});
		$("#btn_clearRecent").click(function(){
			$("#smsBox .contacts-list-data").clearRecent();
			$("#list-recentContacts").html('')
		});
		$("#btn_clearRecent1").click(function(){
			$("#smsBox1 .contacts-list-data").clearRecent();
			$("#list-recentContacts1").html('')
		});
		
		$("#btn_recentContact").click(function(){
			var div = $("#recentContact");
			if( div.width()!=0 ){
				$(this).removeClass("arrow_left");
				div.css({"opacity":0}).animate({"width":0},100);
			}else{
				$(this).addClass("arrow_left");
				div.css({"width":0,"opacity":0}).animate({"width":100},100,function(){div.css({"opacity":1});})
			}
		});
		$("#btn_recentContact1").click(function(){
			var div = $("#recentContact1");
			if( div.width()!=0 ){
				$(this).removeClass("arrow_left");
				div.css({"opacity":0}).animate({"width":0},100);
			}else{
				$(this).addClass("arrow_left");
				div.css({"width":0,"opacity":0}).animate({"width":100},100,function(){div.css({"opacity":1});})
			}
		});
	};
	sendFunc();
});