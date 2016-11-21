"use strict";
var http = require('http');
var fs = require('fs');
var path = require('path');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
/**虎扑论坛的网址 */
var baseUrl = 'http://bbs.hupu.com';
/**论坛板块的地址 */
var blockUrl = 'http://bbs.hupu.com/bxj';
/**保存图片的文件夹 */
var folder = 'images';
/**要爬取的页数 */
var pageNum = 10;

/**
 * 获取论坛的页面
 * @param url - 页面的地址
 * @param folderPath - 保存图片的文件夹
 * @param num - 向后搜索的页数
 */
var getPages = function (url, folderPath, num) {
    http.get(url, function (res) {
        var html = '';
        res.on('data', function (data) {
            html += iconv.decode(data, 'gb2312');
        });
        res.on('end', function () {
            var $ = cheerio.load(html);
            getTopics(url, folderPath, getImages);
            if (num > 1) {
                var nexthref = $('.page a.next').attr('href');
                var nextUrl = baseUrl + nexthref;
                getPages(nextUrl, folderPath, num - 1);
            }
        });
        res.on('error', function (error) { });
    });
};
/**
 * - 获取步行街指定页面的所有主题帖的链接
 * @param url - 指定页面的地址
 * @param folderPath - 保存图片的文件夹
 * @param callBack - 搜索到帖子之后的处理
 */
var getTopics = function (url, folderPath, callBack) {
    http.get(url, function (res) {
        var html = '';
        res.on('data', function (data) {
            html += iconv.decode(data, 'gb2312'); // 虎扑的编码是gb2312           
        });
        res.on('end', function () {
            var $ = cheerio.load(html);
            $('.bbstopic .p_title a').each(function (index, ele) {
                var href = $(ele).attr('href');
                if (href != undefined) {
                    var nextUrl = baseUrl + href;
                    callBack(nextUrl, folderPath);
                }
            });
        });
        res.on('error', function (error) { });
    });
};
/**
 * 获取图片
 * @param url - 帖子的地址
 * @param folderPath - 保存图片的文件夹路径（相对于当前目录，如果不存在，将在当前目录下新建）
 */
var getImages = function (url, folderPath) {
    http.get(url, function (res) {
        var result = '';
        res.on('data', function (data) {
            result += iconv.decode(data, 'gb2312');
        });
        res.on('end', function () {
            var $ = cheerio.load(result);
            $('.case .subhead~p img').each(function (index, ele) {
                var url = $(ele).attr('src');
                var imageName = path.basename(url).split('@')[0];
                if (imageName != 'placeholder.png') {
                    downLoadImage(url, folderPath, imageName);
                }
            });
        });
        res.on('error', function (error) { });
    });
};
/**
 * - 从指定url下载图片
 * @param url - 图片的地址
 */
var downLoadImage = function (url, folderPath, imageName) {
    var imageData = '';
    http.get(url, function (res) {
        res.setEncoding('binary');
        res.on('data', function (chunk) {
            imageData += chunk;
        });
        res.on('end', function () {
            console.log('图片下载成功：' + imageName);
            saveImages(folderPath, imageName, imageData);
        });
        res.on('error', function (error) { });
    });
};
/**
 * - 将图片保存到指定文件夹中
 * @param folderPath - 保存图片的文件夹路径（路径相对于当前目录，如果不存在，将在当前目录下新建）
 * @param imageName - 要保存的图片名称
 * @param data - 图片数据
 */
var saveImages = function (folderPath, imageName, data) {
    var fileName = path.join(__dirname, folderPath, imageName);
    fs.writeFile(fileName, data, 'binary', function (err) { });
};
/**
 * 开始爬取
 * @param url - 起始页的地址
 * @param folderPath - 保存图片的文件夹路径（路径相对于当前目录，如果不存在，将在当前目录下新建）
 */
var start = function (url, folderPath, pageNum) {
    getPages(url, folderPath, pageNum);
};
start(blockUrl, folder, pageNum);
//process.on('uncaughtException', function(err){});

