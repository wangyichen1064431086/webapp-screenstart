const $ = require('jquery');

class Startpage{
	/** @startEl= document.getElementById("screenstart")或"#screenstart"
	  * @config
	  ** @config.urlCcodeP= "utm_campaign"
	  ** @config.useFTScroller=0或1，表示是否使用了FT的Scroller
	  ** @config.gNowView = 'fullbody'或, 'storyview', 'adview'或'channel'
	  ** @config.gHomePageStorageKye:一个localStorage的key
	  ** @config.uaForMail
	  ** @config._currentVersion:
	  ** @config.loadType:可为'start'等等
	*/
	constructor(startEl,config){
		///处理参数startEl：保证其是一个HTMLElement
		if(!startEl){
			return;
		} else if(!(startEl instanceof HTMLElement)){
			startEl = document.querySelector(startEl);
		}

		///设置实例属性gStartPageTemplate：指明首页正文要使用的数据文件的路径
	    this.setStartPageTemplate();

		///设置/更新实例属性this.timeStamp：一个包含了各种时间戳的对象
		this.updateTimeStamp();

		///设置实例属性ccode:为当前url中参数名为config.urlCcodeP的参数值
		this.ccode = this.getpvalue(location.href,config.urlCcodeP);
		if(this.ccode){
			this.setCookie("ccode",this.ccode,"","",".ftchinese.com");
		}

		///设置实例属性_currentVersion:
		this._currentVersion = config._currentVersion;

		///设置实例属性username和langmode：都是cookie值
		this.username = this.getCookie('USER_NAME')||'';
		this.langmode = this.getCookie('langmode')||'ch';

		///修改和添加历史记录条目
		if(this.historyAPI() == true){
			const currentHref = location.href;
			window.history.replaceState(null,null,currentHref+'#/home');
			window.history.pushState(null,null,currentHref);
		}

		///如果没有使用FTScroller，则window滚动到(0,0)
		if(config.useFTScroller === 0){
			window.scrollTo(0,0);
		}

		///设置当前body的className为config.gNowView
		document.body.className = config.gNowView;

		///设置实例属性gStartPageStorage:为localStorage中名为config.gHomePageStorageKey的值
		this.gStartPageStorage = localStorage.getItem(config.gHomePageStorageKey)||"";

		///设置实例属性startstartusEl：存储id="startstatus"的元素
		const startstatusEl = document.getElementById("startstatus")||null;
		if(startstatusEl && startEl.contains(startstatusEl)){
			this.startstatusEl = startstatusEl;
		} else {
			this.startstatusEl = null;
		}

		///设置实例属性startbarEl:存储id='startbar'的元素
		const startbarEl = document.getElementById("startbar")||null;
		if(startbarEl && startEl.contains(startbarEl)){
			this.startbarEl = startbarEl;
		} else {
			this.startbarEl = null;
		}
		
		///根据网络状况决定什么时候加载主页，即什么时候执行this.loadHomePage(config.loadType)
		if(this.isOnline()==='no' && this.gStartPageStorage){//如果处于离线状态，且gStartPageStorage为空
			if(startEl.contains(this.startstatusEl)){
				this.startstatusEl.innerHTML = "您没有联网";

				setTimeout(function(){
					this.loadHomePage(config.loadType);
				},2000);
			}

		} else {
			this.loadHomePage(config.loadType);
		}
	}

	///方法testIflocalhost:判断是否是在本地测试
	testIflocalhost(){
		const theHost = location.hostname;
		if (theHost === 'localhost' || theHost.indexOf('192.168') === 0 || theHost.indexOf('10.113') === 0 || theHost.indexOf('127.0') === 0){
			return true;//表示为在本地测试
		} else {
			return false;//表示在线上运行
		}
	}

	///方法setStartPageTemplate:用于设置实例属性gStartPageTemplate,指明首页正文要使用的数据文件的路径
	setStartPageTemplate(){
		let gStartPageTemplate;

		if(this.testIflocalhost()){//如果是本地测试
			if (screen.width >= 700){
				gStartPageTemplate = 'api/homecontentwide.html';
			} else {
				gStartPageTemplate = 'api/homecontent.html';
			}
		} else {
			if(screen.width>=700){
				gStartPageTemplate = '/index.php/ft/channel/phonetemplate.html?channel=nexthome&screentype=wide&';
			} else {
				gStartPageTemplate = '/index.php/ft/channel/phonetemplate.html?channel=nexthome&';
			}
		}

		this.gStartPageTemplate = gStartPageTemplate;
	}

	///方法updateTimeStamp:用于设置/更新实例属性this.timeStamp，这是一个包含了各种时间戳的对象
	updateTimeStamp(){
		const thisday = new Date();
		let themi = thisday.getHours()*10000 + thisday.getMinutes()*100;
		const thed = thisday.getFullYear() * 10000 + thisday.getMonth() * 100 + thisday.getDate();
		themi = thed*1000000 + themi;
		const thisdayunix = Math.round(thisday.getTime()/1000);
		const expiredayunix = thisdayunix + 7776000;

		this.timeStamp = {
			thisday:thisday,
			thed:thed,
			themi:themi,
			thisdayunix:expiredayunix
		}

	}


	///方法getpvalue:用于获取指定url（theurl）中的指定参数名(thep)的参数值。
	getpvalue(theurl,thep){
		theurl = theurl.toLowerCase();
		const thepIndex = theurl.indexOf(thep + "=");
		if(thepIndex>0){
			const valueStart= thepIndex + thep.length + 1;
			return theurl.substring(valueStart).replace(/\&.*/g,"");
		} else {
			return "";
		}
	}

	///方法setCookie:用于设置cookie
	setCookie(name,value,sec,path,domain,secure){
		const argv = arguments;
		const argc = argv.length;
		sec = sec ? 1000 * sec : 51840000000;
		let expires = new Date();
		expires.setTime(expires.getTime() + sec).toGMTString();

		path = (argc > 3) ? argv[3] : null;
		domain = (argc > 4) ? argv[4] : null;
		secure = (argc > 5) ? argv[5] : false;
		document.cookie = name +"=" + encodeURIComponent(value) 
		+ "; expires="+expires+
		+ ((path == null) ? (";path=/"):("; path="+path))
		+((domain == null) ?(""):("; domain=" + domain))
		+((secure == true) ? ";secure":"");
		
	}

	///方法getCookie:用于获取指定cookie名的cookie值
	getCookie(name){
		const cookieName = encodeURIComponent(name);
		const cookieStart = document.cookie.indexOf(cookieName);
		let cookieValue = null;

		if(cookieStart > -1){
			var cookieEnd = document.cookie.indexOf(";",cookieStart);
			if(cookieEnd == -1){
				cookieEnd = document.cookie.length;
			}
			cookieValue = decodeURIComponent(document.cookie.substring(cookieStart+cookieName.length,cookieEnd));
		} 

		return cookieValue;

	}

	///方法historyAPI:用于检测当前浏览器的history接口，如是否有pushState方法等
	historyAPI(){
		const ua = navigator.userAgent||navigator.vendor||"";
		if(/Android 2/i.test(ua)) {
			return false;
		} else if(window.history.pushState){
			return true;
		}
	}

	///方法updateStartStatus：用于给 id=startFeeadback的元素（即“报告问题”a元素的href）指定新的url,
	updateStartStatus(startEl){
		let startFeedBackEl = document.getElementById("startFeedback");
		const uaForMail = navigator.userAgent||navigator.vendor||""+ "%0D%0A%0D%0Amy URL: "+location.href;
		if(startEl.contains(startFeedBack)){
			startFeedBackEl.href = "mailto:ftchinese.feedback@gmail.com?subject=Feedback about FTC Web App - ' +  + '&body=%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0AMy UA String for Your Reference: %0D%0A%0D%0A"+ uaForMail+"%0D%0A%0D%0AResources version: "+this._currentVersion+"%0D%0A%0D%0AScreen Mode: "+screen.width+"X"+screen.height+"%0D%0A%0D%0Amy URL: " + location.href
		}
	}

	isOnline() {//iOS和BB10可以准确判断离线状态，某些Android设备会返回完全错误的信息
	    if (navigator.onLine==false) {//待修改，因为涉及要处理osVersion
	        return "no";
	    }
	    return "possible";
	}

	///方法loadHomePage：移除启动页，打开主页
	loadHomePage(loadType){
		this.updateStartStatus();
		this.updateTimeStamp();

		if(loadType === 'start'){
			this.startstatusEl.innerHTML = "加载最新主页";
		}

		const homePageRequestTime = new Date().getTime();
		$.ajax({
			url:this.gStartPageTemplate + this.timeStamp.themi,
			success: function(data){
				if(this.startstatusEl){
					this.startstatusEl.innerHTML("版面成功加载");
				}
				//const loadToHome = new LoadToHome("")
				$(this.startbarEl).animate(
					{
						width:"100%"
					},
					300,
					function(){
						$(startEl).remove();
					}
				)

			},
			error:function(){
				if(loadType === 'start'){
					this.startstatusEl.innerHTML("服务器开小差了");
				}
			}
		})
	}

};

export default Startpage;