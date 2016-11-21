import http = require('http');
import fs = require('fs');
import path = require('path');
import iconv = require('iconv-lite');
import cheerio = require('cheerio');

/**虎扑论坛的网址 */
const baseUrl = 'http://bbs.hupu.com';
/**论坛板块的地址 */
const blockUrl = 'http://bbs.hupu.com/bxj';
/**保存图片的文件夹 */
const folder = 'images';

/**
 * 获取论坛的页面
 * @param url - 页面的地址
 * @param folderPath - 保存图片的文件夹
 * @param num - 向后搜索的页数
 */
let getPages = function (url: string, folderPath: string, num: number) {
    http.get(url, (res) => {
        let html = '';
        res.on('data', (data: Buffer) => {
            html += iconv.decode(data, 'gb2312');
        })
        res.on('end', () => {
            let $ = cheerio.load(html);
            getTopics(url, folderPath, getImages);
            if (num > 1) {
                let nexthref = $('.page a.next').attr('href');
                let nextUrl = baseUrl + nexthref;
                getPages(nextUrl, folderPath, num - 1);
            }
        })
        res.on('error', (error) => { })
    })
}

/**
 * - 获取步行街指定页面的所有主题帖的链接
 * @param url - 指定页面的地址
 * @param folderPath - 保存图片的文件夹
 * @param callBack - 搜索到帖子之后的处理
 */
let getTopics = function (url: string, folderPath: string, callBack: (url: string, folderPath: string) => void): void {
    http.get(url, (res) => {
        let html = '';
        res.on('data', (data: Buffer) => {
            html += iconv.decode(data, 'gb2312');                               // 虎扑的编码是gb2312           
        })
        res.on('end', () => {
            let $ = cheerio.load(html);
            $('.bbstopic .p_title a').each((index, ele) => {
                let href = $(ele).attr('href');
                if (href != undefined) {
                    let nextUrl = baseUrl + href
                    callBack(nextUrl, folderPath);
                }
            })
        })
        res.on('error', (error) => { })
    })
}

/**
 * 获取图片
 * @param url - 帖子的地址
 * @param folderPath - 保存图片的文件夹路径（相对于当前目录，如果不存在，将在当前目录下新建）
 */
let getImages = function (url: string, folderPath: string): void {
    http.get(url, (res) => {
        let result = '';
        res.on('data', (data: Buffer) => {
            result += iconv.decode(data, 'gb2312');
        })
        res.on('end', () => {
            let $ = cheerio.load(result);
            $('.case .subhead~p img').each((index, ele) => {
                let url = $(ele).attr('src');
                let imageName = path.basename(url).split('@')[0];
                if (imageName != 'placeholder.png') {
                    downLoadImage(url, folderPath, imageName);
                }
            })
        })
        res.on('error', (error) => { })
    })
}

/**
 * - 从指定url下载图片
 * @param url - 图片的地址
 */
let downLoadImage = function (url: string, folderPath: string, imageName: string): void {
    let imageData = '';
    http.get(url, (res) => {
        res.setEncoding('binary');
        res.on('data', (chunk) => {
            imageData += chunk;
        })
        res.on('end', () => {
            console.log('图片下载成功：' + imageName);
            saveImages(folderPath, imageName, imageData);
        })
        res.on('error', (error) => { })
    })
}

/**
 * - 将图片保存到指定文件夹中
 * @param folderPath - 保存图片的文件夹路径（路径相对于当前目录，如果不存在，将在当前目录下新建）
 * @param imageName - 要保存的图片名称
 * @param data - 图片数据
 */
let saveImages = function (folderPath: string, imageName: string, data: string): void {
    let fileName = path.join(__dirname, folderPath, imageName);
    fs.writeFile(fileName, data, 'binary', (err) => { });
}

/**
 * 开始爬取
 * @param url - 起始页的地址
 * @param folderPath - 保存图片的文件夹路径（路径相对于当前目录，如果不存在，将在当前目录下新建）
 */
let start = function (url: string, folderPath: string, pageNum: number): void {
    getPages(url, folderPath, pageNum);
}

start(blockUrl, folder, 10);



