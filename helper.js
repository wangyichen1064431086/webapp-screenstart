const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

var env = new nunjucks.Environment(
	/**Environment类用来管理模板。实例化Environment时传入两个参数:
		* 1)loaders,nunjucks会按顺序查找直到找到模板;
		* 2)opts(object),配置包括autoescape、throwOnUndefined、trimBlocks、IstripBlocks
		* 在node端使用FileSystemLoader加载模板，在浏览器端使用WebLoader通过http加载（或使用编译后的模板）
	*/
	new nunjucks.FileSystemLoader(
	/**
		加载器是一个对象，从资源中加载模板。有两个内置加载器，FileSystemLoader和WebLoader。
		* FileSystemLoader只在node端可用，可从文件系统加载模板。
		* 语法：new FileSystemLoader([searchPaths],[opt])
		* 参数searchPath为查找模板的路径，可用是一个也可以是多个，默认为当前工作目录
		* 参数opt为一个对象，包含属性：
							* watch-如果为true,当文件系统上的模板变化了，系统会自动更新
							* noCache-如果为true,不使用缓存，模板每次都会重新编译
	*/
		[
			process.cwd(),//返回当前工作目录
			path.resolve(process.cwd(),'demos/src')//当前工作目录/demos/src
		],
		{
			noCache: true//不使用缓存，每次都重新编译
		}
	),
	{
		autoescape:false//autoescape属性用于控制输出是否被转义
	}
);

function render(template,context,destName){
	return new Promise(function(resolve,reject){
		/**
		  * Promise 对象是一个返回值的代理，这个返回值在promise对象创建时未必已知。
		  * 它允许你为异步操作的成功返回值或失败信息指定处理方法。 
		  * 这使得异步方法可以像同步方法那样返回值：异步方法会返回一个包含了原返回值的 promise 对象来替代原返回值。
		*/

		env.render(template,context,function(err,result){
			/**
			  * 语法：nunjucks.render(name,[context],[callback])
			  * 渲染模式时需要两个参数:模板名name,数据context。
			  * 如果callback存在，当渲染完成后会被调用。callback第一个参数是err，第二个是res(返回的结果)
			*/
			if(err){
				reject(err);
			} else {
				resolve({
					name:destName,
					content:result
				});
			}
		});		
	});
}
///关于这里的Promise怎么用的，还待细研究


function readJson(filename) {
	return new Promise(
		function(resolve,reject) {
			fs.readFile(filename,'utf8',function(err,data){
				if(err){
					console.log('Cannot find file: ' + filename);
					reject(err)
				} else {
					resolve(JSON.parse(data));
				}
			});
		}
	);
}


function readFile(filename){
	return new Promise(
		function(resolve,reject){
			fs.readFile(filename,'utf8',function(err,data){
				if(err){
					console.log('Cannot find file: '+filename);
					reject(err);
				} else{
					resolve(data);
				}
			});
		}
	);
}

module.exports = {
	readJson: readJson,
	readFile: readFile,
	render: render
};