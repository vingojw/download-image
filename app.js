var http = require("http");
var https = require("https");
var path = require("path");
var fs = require("fs");
var cheerio = require('cheerio');
var filePath = './files/'; //采集保存的文件夹名

//配置url地址
var urlList=[
	'http://mp.weixin.qq.com/s?__biz=MjM5MDI5OTkyOA==&mid=2665519386&idx=3&sn=be8300e417dcce40e0dc2fe9cad39a94&scene=1&srcid=0531pDcYyD91qWRbWc1ApRXg&key=f5c31ae61525f82e8dba6e941c9ca1af12f8d6396213b25dce580044d04d659b15c1ae09c0aa93340046c1f3797f9662&ascene=0&uin=NTUwNTYyMzc1&devicetype=iMac+MacBookPro11%2C1+OSX+OSX+10.11.4+build(15E65)&version=11020201&pass_ticket=WQjl9GTmqaiP3MBv0SCjeIWXT3Dn7CQG9cwIQNk7KCw5oe%2BB3sge5VyE7edBAXmA',
	'http://mp.weixin.qq.com/s?__biz=MjM5MDI5OTkyOA==&mid=2665519346&idx=2&sn=9ba0bc6d1578180b4e2520fc9e0ec62c&scene=1&srcid=0531E7eUVJS7IUPb9dW0VolP&key=f5c31ae61525f82e62a755d01fe6f9786dcf72432de7e6a47552ab05cebd7f3f76fa1084465908d502b345ac9542bbc0&ascene=0&uin=NTUwNTYyMzc1&devicetype=iMac+MacBookPro11%2C1+OSX+OSX+10.11.4+build(15E65)&version=11020201&pass_ticket=WQjl9GTmqaiP3MBv0SCjeIWXT3Dn7CQG9cwIQNk7KCw5oe%2BB3sge5VyE7edBAXmA',
];

urlList.forEach(function(a){
	go(a,function($,dirName){
	
		/*******这里可以通过$('xx')写jqeury的方式获取*******/

		var imgList = $('img');
		imgList = [].slice.call(imgList);

		imgList = imgList.filter(function(a){
			return $(a).attr('data-src');
		});
		
		for (var i = 0; i < imgList.length; i++) {
			var url = $(imgList[i]).attr('data-src');
			downloadimg(url,dirName,i);
		};

		/**************************************************/

	});
});

//采集图片
function go(url,cb){

	http.get(url,function(res){
		var size = 0;
		var chunks = [];
		res.on('data', function(chunk){
			size += chunk.length;
			chunks.push(chunk);
		})
		res.on('end',function(){
			var data = Buffer.concat(chunks, size);
			$ = cheerio.load(data.toString());
			//取页面title来做文件名
			var fileName = [
				+new Date(),
				$('title').html(),
				(Math.random()+'').slice(-9)
			].join('');

			fileName = fileName.replace(/&#x([a-f0-9]{4});/ig, 
				function(a,b){return String.fromCharCode(parseInt(b, 0x10))});
			//去除\/:*?"<> 字符，创建的文件夹不能包含这些字符
			fileName = fileName.replace(/[\/:*?"<>]/g,'');
			//拿到html
			cb($,fileName);
		})
	});

}

//下载图片
function downloadimg(url,dirName,index){
	var downLoadPath = filePath+dirName;
	mkdirs(downLoadPath,'0777',function(){
		http.get(url, function(res){
			var imgData = "";
			res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
			res.on("data", function(chunk){
				imgData+=chunk;
			});
			res.on("end", function(){
				var t = [
					imgData[0].charCodeAt()['toString'](16).toLowerCase(),
					imgData[1].charCodeAt()['toString'](16).toLowerCase(),
					imgData[2].charCodeAt()['toString'](16).toLowerCase()
				].join('');

				//根据文件头判断后缀名
				var tMap = {
					'ffd8ff':'.jpg',
					'89504e':'.png',
					'474946':'.gif',
				}

				fs.writeFile(downLoadPath+"/"+ index + tMap[t], imgData, "binary", function(err){
				if(err){
					console.log("down fail");
				}
				console.log("down success："+new Date());
				});
			});
		});
	});
}

/*
	递归创建文件夹
	mkdirs('./a/b/c','0777',回调函数)
 */
function mkdirs(dirpath, mode, callback) {
	fs.exists(dirpath, function(exists) {
		if(exists) {
				callback(dirpath);
		} else {
			//尝试创建父目录，然后再创建当前目录
			mkdirs(path.dirname(dirpath), mode, function(){
					fs.mkdir(dirpath, mode, callback);
			});
		}
	});
};