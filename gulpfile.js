const promisify = require('promisify-node');//包裹Node回调函数以返回Promises。
const fs = promisify('fs');
const path = require('path');
const url = require('url');
const isThere = require('is-there');//Check if a file or directory exists in a given path.
const co = require('co');//The ultimate generator based flow-control goodness for nodejs
const mkdirp = require('mkdirp');//用于生成多层的路径，如/tmp/foo/bar/baz
const helper = require('./helper');//自己手写的模块helper.js

const del = require('del');
const browserSync = require('browser-sync').create();
const cssnext = require('postcss-cssnext');//使你可以尽情使用最新的CSS语法。它会将CSS转换成兼容性更好的CSS，这样你就不需要顾虑浏览器的支持性了。

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();

const webpack = require('webpack');//打包JavaScript文件，使得其可以在浏览器端使用
const webpackConfig = require('./webpack.config.js');

const rollup = require('rollup').rollup;//新一代ES6的模块打包机
const buble = require('rollup-plugin-buble');
var cache;

const demosDir = '../ft-interact/demos';
const projectName = path.basename(__dirname);//返回路径的最后一部分

process.env.NODE_ENV = 'dev';


///任务prod:将process.env.NODE_ENV设置为prod
gulp.task('prod',function(done){//疑问：这done是哪里定义的？？？
  process.env.NODE_ENV = 'prod';
  done();
});


///任务dev:将process.env.NODE_ENV设置为dev
gulp.task('dev',function(done){
  process.env.NODE_ENV = 'dev';
  done();
});

///任务html:就是将demos/src/demo.html(包含了demos/src/base.html)和origami.json,通过自己写的helper模块（nunjucks引擎配置）编译为.tmp/toggles.html
gulp.task('html',() => {
  	var embeded = false;//在base.html中，如果embeded值为true，则就要包含`/api/resize-iframe.js` listed in `ftc-components`.

  	return co(function *(){
	    const destDir = '.tmp';
	    if(!isThere(destDir)){//如果'.tmp不存在存在，则生成这个目录
	      mkdirp(destDir,(err) => {
	        if(err){
	           console.log(err);
	        }
	      });
	    }
	    if(process.env.NODE_ENV === 'prod'){//为生产环境时，embeded为true
	    	embeded = true;
	    }

	    const origami = yield helper.readJson('origami.json');//yield 关键字使生成器函数暂停执行，并返回跟在它后面的表达式的当前值. 可以把它想成是 return 关键字的一个基于生成器的版本.疑问：co里面的yield是个怎么个用法？

	    const demos = origami.demos;
	    /**这个demos为包含了一个对象元素的数组：	 
        [{
            "name": "webapp-screenstart",
            "template": "demos/src/demo.html",
            "expanded": true,
            "description": ""
        }
    ]
        */

	    const renderResults = yield Promise.all(demos.map(function(demo){
	    	/**
	    	  * Array.prototype.map():返回一个由原数组中的每个元素调用一个指定方法后的返回值组成的新数组。
	          * 形参demo的实参应该是demos
	          * Promise，简单说就是一个容器，里面保存着某个未来才会结束的事件（通常是一个异步操作）的结果。
	          * Promise.all(Array) 方法返回一个promise，该promise会等iterable参数内的所有promise都被resolve后被resolve，或以第一个promise被reject的原因而reject 。
	          * 这里因为demos是一个数组（虽然目前该数组只有一项），对其map也既是有多个function在执行，故就是多个Promise,故要使用Promise.all
	    	*/
	    	const template = demo.template;//"demos/src/demo.html"
	    	console.log(`Using templating "${template}" for "${demo.name}"`);
	    	const context = {
	    		pageTitle:demo.name,//"webapp-screenstart"
	    		description:demo.description,//""
	    		embeded:embeded//dev环境下是false
	    	};

	    	return helper.render(template,context,demo.name);//模板是template，数据是context,demo.name为"webapp-screenstart"
	    }));//最终应该返回的数组只有一项，就是helper.render返回的{name:destName,content:result}

	    yield Promise.all(renderResults.map(result => {
	    	/** 
	    	  * Arrray.map(callback)的callback 函数会被自动传入三个参数：数组元素，元素索引，原数组本身。
	    	  * 故箭头函数参数result为数组元素，这里renderResults数组只有一个元素
	    	*/
    		console.log(`result:${result}`);
    		const dest = `.tmp/${result.name}.html`;//".tmp/webapp-screenstart.html"
    		return fs.writeFile(dest,result.content,'utf8');
    	}));


  	}).then(function(){
  		browserSync.reload('*.html');//让浏览器实时、快速响应您的文件更改并自动刷新页面。且是同时刷新多个设备上的页面
  	},function(err){
  		console.error(err.stack);
  	});
});


///任务styles:就是将demos/src/demo.scss编译为.tmp/styles/demo.css
gulp.task('styles',function(){
	const DEST = '.tmp/styles';

	return gulp.src('demos/src/*.scss')
		.pipe($.changed(DEST))//只处理改变了的文件
		.pipe($.plumber())//防止管道因为来自gulp插件的错误而导致的中断
		.pipe($.sourcemaps.init({loadMaps:true}))//把一些方法打包，然后这些浏览器端不支持的方法就可以在浏览器端使用了。所有在sourcemaps.init()和sourcemaps.write（）之间的插件需要支持gulp-sourcemaps插件。
		.pipe($.sass({
			outputStyle:'expanded',
			precision:10,
			includePaths:['bower_components']
		}).on('error',$.sass.logError))
		.pipe($.sourcemaps.write('./'))
		.pipe(gulp.dest(DEST))
		.pipe(browserSync.stream({once:true}));
		/** browserSync.reload()和.stream()使用场景对比说明：
		  * 文件改变了得重启编译过程，编译完了才能允许浏览器刷新的（如sass和js)用stream机制
		  * 文件本身改变直接刷新就行了，没有中间操作（如图片、html）用reload机制。
		 */
});

///任务eslint:就是对client/js下的js文件检查语法错误的，这里并没有用上
gulp.task('eslint',() => {//待研究：有空了再研究eslint模块
	return gulp.src('client/js/*.js')
		.pipe($.eslint())//一个基于AST的针对JavaScript的模式检查器,要用到根目录下的.eslintrc.js。
		.pipe($.eslint.format())
		.pipe($.eslint.failAfterError());
});


///任务webpack:就是对demos/src/demo.js打包为.tmp/scripts/demo.js。以webpack.config.js为参数配置文件
gulp.task('webpack',(done) => {//待研究：有空了在研究webpack模块
	if (process.env.NODE_ENV === 'prod'){
		delete webpackConfig.watch;// delete 操作符用来删除一个对象的属性。
	}

	webpack(webpackConfig, function(err,stats){//webpack是模块的打包机。其主要用途是打包JavaScript文件，使得其可以在浏览器端使用，不过它也可以用于对任何资源的转化、捆绑、打包。
		if(err){
			throw new $.util.PluginError('webpack',err);
		}
		$.util.log('[webpack]',stats.toString({
			colors: $.util.colors.supportsColor,
			chunks:false,
			hash:false,
			version:false
		}));
		browserSync.reload('demo.js');
		done();
	})
});

gulp.task('clean',function(){
	return del(['.tmp/**']);
});


///任务serve:并行执行html、styles、webpack任务，即处理生成好.tmp目录，然后启动浏览器展示demo页面
gulp.task('serve',gulp.parallel('html','styles','webpack',() => {

	browserSync.init({
		/**
		  * bs.init(config,cb)就纯粹启动一台静态服务器，自动给你打开浏览器,即localhost，不会发挥浏览器实时同步的作用。要想发挥其实时同步的作用，就得需要reload()或stream()方法
		  * 参数config，类型object
		  ** config的属性server:待研究
		*/
		server:{
			baseDir:['.tmp'],
		 	index:'share.html',//待查证：这个是干嘛的
		 	directory:true,
		 	routes:{
		 		'/bs':'bower_components',
		 		'/st':'static'//一定要在routes里加上其它资源的位置，但位置名称必须以/开头，否则找不到
		 	}
		}
	});

	gulp.watch(['demos/src/*.{html,json}','partials/*.html'],gulp.parallel('html'));//当html,json源文件发生变化时，执行html任务

	gulp.watch('demos/src/*.scss',gulp.parallel('styles'));//当scss源文件发生变化时，执行styles任务
}));


///任务build:同serve，但是只处理文件不启动浏览器展示
gulp.task('build',gulp.parallel('html','styles','webpack'));


///将.tmp目录下所有东西拷贝到../ft-interact/demos/ftc-toggle-wyc
gulp.task('copy',() => {
	const DEST = path.resolve(__dirname,demosDir,projectName);
	/** demosDir为'../ft-interact/demos'
	  * projectName为ftc-toggle-wyc
	*/
	console.log(`Deploying to ${DEST}`);
	return gulp.src('.tmp/**/*')
		.pipe(gulp.dest(DEST));
})


gulp.task('demo',gulp.series('prod','clean','build','copy','dev'));


///任务rollup:直接将src/js/toggle.js打包生成dist/ftc-toggle.js
gulp.task('rollup',() => function(){
	return rollup({//新一代ES6的模块打包机
		entry:'./src/js/toggle.js',
		plugins:[buble()],
		cache:cache,
	}).then(function(bundle){
		cache = bundle;
		return bundle.write({
			format:'life',
			moduleName:'Toggle',
			moduleId:'ftc-toggle-wyc',
			dest:'dist/ftc-toggle.js',
			sourceMap:true,
		});
	});
});