const XLSX = window.require("xlsx")
export const holderTypes = {
    // 这是第一版的数据
    // '1000': '自然人',
    // '1100': '国有自然人',
    // '2000': '非自然人',
    // '2100': '国有非自然人',
    // '2010': '非 RQFII 的 QFII ',
    // '2110': '国有非 RQFII 的 QFII',
    // '2210': '境外非 RQFII 的 QFII',
    // '2020': 'RQFII',
    // '2120': '国有 RQFII',
    // '2220': '境外RQFII',
    // '2001': '证券投资基金 ',
    // '2101': '国有证券投资基金',
    // '2201': '境外证券投资基金',
    // '2002': '私募投资基金',
    // '2102': '国有私募投资基金',
    // '2202': '境外私募投资基金',
    // '机构': '机构',
    // '个人': '个人',
    // 这是第二版的数据
    '1001': '牛散',
    // 如果在牛散和个人里面找不到，都归为个人这一类中
    '1000': '个人',
    '2001': '社保基金',
    '2002': '证金公司',
    '2003': 'QFII',
    '2004': '一般机构法人',
    '2005': '信托产品',
    '2006': '证券投资基金',
    '2007': '基金',
    // 如果以上的机构都找不到，都归为机构这一类中
    '2000': '机构'
}

export const holderAddress = {
    "河北": ["石家庄市", "张家口市", "承德市", "唐山市", "秦皇岛市", "廊坊市", "保定市", "沧州市", "衡水市", "邢台市", "邯郸市"],
    "山西": ["太原市", "大同市", "朔州市", "忻州市", "阳泉市", "晋中市", "吕梁市", "长治市", "临汾市", "晋城市", "运城市"],
    "内蒙古": ["呼和浩特市", "包头市", "乌海市", "赤峰市", "通辽市", "鄂尔多斯市", "呼伦贝尔市", "巴彦淖尔市",	"乌兰察布市"],
    "黑龙江": ["哈尔滨市", "黑河市", "伊春市", "齐齐哈尔市", "鹤岗市", "佳木斯市", "双鸭山市", "绥化市", "大庆市", "七台河市", "鸡西市", "牡丹江市"],
    "吉林": ["长春市", "白城市", "松原市", "吉林市", "四平市", "辽源市", "白山市", "通化市" ],
    "辽宁": ["沈阳市", "大连市", "鞍山市", "抚顺市", "本溪市", "丹东市", "锦州市","营口市","阜新市","辽阳市","盘锦市","铁岭市","朝阳市","葫芦岛市"],
    "江苏": ["南京市" ,"无锡市","徐州市" ,"常州市" ,"苏州市" ,"南通市","连云港市" ,"淮安市" ,"盐城市" ,"扬州市","镇江市 ,泰州市" ,"宿迁市"],
    "浙江": ["杭州市","宁波市","温州市","嘉兴市","湖州市","绍兴市","金华市","衢州市","舟山市","台州市","丽水市"],
    "安徽": [ "合肥市" ,"芜湖市" ,"蚌埠市" ,"淮南市","马鞍山市" ,"淮北市" ,"铜陵市" ,"安庆市" ,"黄山市" ,"滁州市" ,"阜阳市" ,"宿州市" ,"六安市" ,"亳州市" ,"池州市" ,"宣城市"],
    "福建": ["福州市","厦门市","莆田市","三明市","泉州市","漳州市","南平市","龙岩市","宁德市"],
    "江西": ["南昌市","景德镇市","萍乡市","九江市","抚州市","鹰潭市","赣州市","吉安市","宜春市","新余市","上饶市"],
    "山东": ["济南市","青岛市","淄博市","枣庄市","东营市","烟台市","潍坊市","济宁市","泰安市","威海市","日照市","临沂市","德州市","聊城市","滨州市","菏泽市"],
    "河南": ["郑州市","开封市","洛阳市","平顶山市","安阳市","鹤壁市","新乡市","焦作市","濮阳市","许昌市","漯河市","三门峡市","南阳市","商丘市","信阳市","周口市","驻马店市"],
    "湖北": ["武汉市","黄石市","十堰市","宜昌市","襄阳市","鄂州市","荆门市","孝感市","荆州市","黄冈市","咸宁市","随州市"],
    "湖南": ["长沙市","株洲市","湘潭市","衡阳市","邵阳市","岳阳市","常德市","张家界市","益阳市","郴州市","永州市","怀化市","娄底市"],
    "广东": ["广州市","韶关市","深圳市","珠海市","汕头市","佛山市","江门市","湛江市","茂名市","肇庆市","惠州市","梅州市","汕尾市","河源市","阳江市","清远市","东莞市","中山市","潮州市","揭阳市","云浮市"],
    "广西": ["南宁市","柳州市","桂林市","梧州市","北海市","防城港市","钦州市","贵港市","玉林市","百色市","贺州市","河池市","来宾市","崇左市"],
    "海南": ["海口市","三亚市","三沙市","儋州市"],
    "四川": ["成都市","自贡市","攀枝花市","泸州市","德阳市","绵阳市","广元市","遂宁市","内江市","乐山市","南充市"	,"眉山市","宜宾市","广安市","达州市","雅安市","巴中市","资阳市"],
    "贵州": [ "贵阳市","六盘水市" ,"遵义市" ,"安顺市" ,"毕节市" ,"铜仁"],
    "云南": ["昆明市","曲靖市","玉溪市","保山市","昭通市","丽江市","普洱市"	,"临沧市"],
    "西藏": ["拉萨市","日喀则市","昌都市","林芝市","山南市","那曲市"],
    "陕西": ["西安市","铜川市","宝鸡市","咸阳市","渭南市","延安市","汉中市"	,"榆林市"	,"安康市"	,"商洛市"],
    "甘肃": ["兰州市","嘉峪关市","金昌市","白银市","天水市","武威市","张掖市","平凉市","酒泉市","庆阳市","定西市","陇南市"],
    "青海": ["西宁市","海东市"],
    "宁夏": ["银川市","石嘴山市","吴忠市","固原市","中卫市"],
    "新疆": ["乌鲁木齐市","克拉玛依市","吐鲁番市","哈密市"],
    "北京": ["北京市"],
    "重庆": ["重庆市"],
    "天津": ["天津市"],
    "上海": ["上海市"],
    "香港": ["香港"],
    "澳门": ["澳门"]
}

//加法   
Number.prototype.add = function (arg) {
    var r1, r2, m;
    try {
        r1 = this.toString().split(".")[1].length
    } catch (e) {
        r1 = 0
    }
    try {
        r2 = arg.toString().split(".")[1].length
    } catch (e) {
        r2 = 0
    }
    m = Math.pow(10, Math.max(r1, r2))
    return (this.mul(m) + arg.mul(m)) / m;
}

//减法   
Number.prototype.sub = function (arg) {
    return this.add(-arg);
}

//乘法   
Number.prototype.mul = function (arg) {
    var m = 0,
        s1 = this.toString(),
        s2 = arg.toString();
    try {
        m += s1.split(".")[1].length
    } catch (e) {}
    try {
        m += s2.split(".")[1].length
    } catch (e) {}
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
}

/**
 * 按期数从大到小排序
 */
export function sortPeriodByFileInfo(cur, pre) {
    if (!cur.period || !pre.period) {
        return 0;
    }
    if (parseInt(cur.period) > parseInt(pre.period)) {
        return -1;
    } else if (parseInt(cur.period) < parseInt(pre.period)) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * 按数字从大到小排序
 */
export function sortByNumber(cur, pre) {
    if (!cur || !pre) {
        return 0;
    }
    if (parseInt(cur) > parseInt(pre)) {
        return -1;
    } else if (parseInt(cur) < parseInt(pre)) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * 根据持有记录recorder普通股持有数量从大到小排序
 */
export function sortHolderAmount(cur, pre) {
    if (!cur || !pre) {
        return 0;
    }
    if (parseInt(cur.holder_amount) > parseInt(pre.holder_amount)) {
        return -1;
    } else if (parseInt(cur.holder_amount) < parseInt(pre.holder_amount)) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * 根据CreditAmount从大到小排序
 */
export function sortByCreditAmount(cur, pre) {
    if (!cur || !pre) {
        return 0;
    }
    if (parseInt(cur.credit_amount) > parseInt(pre.credit_amount)) {
        return -1;
    } else if (parseInt(cur.credit_amount) < parseInt(pre.credit_amount)) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * 根据amount从大到小排序
 */
export function sortByAmount(cur, pre) {
    if (!cur || !pre) {
        return 0;
    }
    if (parseInt(cur.amount) > parseInt(pre.amount)) {
        return -1;
    } else if (parseInt(cur.amount) < parseInt(pre.amount)) {
        return 1;
    } else {
        return 0;
    }
}


/**
 * 判断股东类型
 */
export function getHolderByType(type = '') {
    type = type.toString();
    return holderTypes[type] || '';
}

/**
 * 获取比率
 * @param o1 分子
 * @param o2 分母
 */
export function getRatio(o1, o2, percent = true) {
    if (isNaN(o1) || isNaN(o2) || parseInt(o2) === 0) {
        if (percent) {
            return '--';
        } else {
            return parseFloat(0).toFixed(2)
        }
    }

    let ratio = ((o1 * 100) / o2 * 100) / 100;
    if (percent) {
        return parseFloat(ratio).toFixed(2) + '%';
    } else {
        return parseFloat(ratio).toFixed(2);
    }
}

/**
 * 求平均数
 * @param {*} o1 分子 
 * @param {*} o2 分母
 */
export function getAverage(o1, o2) {
    if (isNaN(o1) || isNaN(o2) || parseInt(o2) === 0) {
        return parseInt(parseFloat(0).toFixed(0));
    }
    return parseInt(parseFloat((o1 * 1) / (o2 * 1)).toFixed(0));
}


/**
 * 968654 => 968,654
 */
export function formatNumber(num) {
    if (isNaN(num)) {
        return '--'
    }
    num += '';
    if (!num.includes('.')) num += '.';
    return num.replace(/(\d)(?=(\d{3})+\.)/g, function ($0, $1) {
        return $1 + ',';
    }).replace(/\.$/, '');
}

/**
 * 
 * @param {*} data 数据
 * @param {*} prop 
 * @param {*} floa 
 */
export function getSumByPropert(data, prop, floa = false) {
    let sum = 0;
    if (data) {
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            let n = floa ? parseFloat(d[prop]) : parseInt((d[prop]));
            // 如果是数字
            if (!isNaN(n)) {
                sum = sum.add(n);
            }
        }
    }
    return sum;
}

export function strlen(str) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        //单字节加1 
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
            len++;
        }
        else {
            len += 2;
        }
    }
    return len;
}

/**
 * 在数组中根据某个属性找某一项是否存在
 * @param {*} array 
 * @param {*} item 
 * @param {*} property 
 */
export function findInArray(array, item, property) {
    let index = -1;
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        if (element[property] == item[property]) {
            index = i;
            break
        }
    }
    return index;
}

/**
 * 获取变化率
 * @param now 当前值
 * @param pre 前期值
 * @return {string} 如49.23%
 */
export function getChangedRatio(now, pre, prefix = false) {
    if (isNaN(now) || isNaN(pre) || parseInt(pre) === 0) {
        return '0.00';
    }
    let ratio = ((now * 100 - pre * 100) / pre * 100) / 100.0;
    if (prefix && ratio != 0) {
        return ratio.toFixed(2) > 0 ? ratio.toFixed(2) : ratio.toFixed(2);
    }
    return ratio.toFixed(2);
}


export function sortCreditAmount(cur, pre) {
    if (!cur || !pre) {
        return 0;
    }
    if (parseInt(cur.credit_amount) > parseInt(pre.credit_amount)) {
        return -1;
    } else if (parseInt(cur.credit_amount) < parseInt(pre.credit_amount)) {
        return 1;
    } else {
        return 0;
    }
}


/**
 * 导出excel
 * @param {*} firstSheetName 第一个sheet的名称
 * @param {*} selectPeriod 对比的日期
 * @param {*} xlsxName 下载文件的名称
 * @param {*} flag 一种是对比时候，一种是不对比的时候， 默认是不对比的时候
 */
export const onExportToExcel = (firstSheetName, selectPeriod, xlsxName, flag = false) => {
    let eles = document.querySelectorAll(".ant-table table")
    let sheetArr = []
    for(let i = 0; i < eles.length; ++i) {
        let sheet = XLSX.utils.table_to_sheet(eles[i])
        let sheetName
        if (i === 0) {
            sheetName = firstSheetName
        } else {
            sheetName = selectPeriod[i - 1]
        }
        sheetArr.push({
            sheet: sheet,
            sheetName: sheetName
        })
    }
    openDownloadDialog(sheet2blob(sheetArr), `${xlsxName}.xlsx`)
}

// 把字符串转化为二进制
function sheet2blob(sheetArr) {
    sheetArr.forEach((item, i) => {
        item.sheetName = item.sheetName || `sheet${i + 1}`;
    })
    var sheetNameArr = sheetArr.map(item => item.sheetName)
    // 生成excel的配置项
    var workbook = {
        SheetNames: sheetNameArr,
        Sheets: {}
    };
    sheetArr.forEach(item => {
        workbook.Sheets[item.sheetName] = item.sheet;
    })
    var wopts = {
        bookType: 'xlsx', // 要生成的文件类型
        bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
        type: 'binary'
    };
    var wbout = XLSX.write(workbook, wopts);
    var blob = new Blob([s2ab(wbout)], {
        type: "application/octet-stream"
    });
    // 字符串转ArrayBuffer
    function s2ab(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i != s.length; ++i) {
            view[i] = s.charCodeAt(i) & 0xFF;
        }
        return buf;
    }
    return blob;
}

function openDownloadDialog(url, saveName) {
    if (typeof url == 'object' && url instanceof Blob) {
        url = URL.createObjectURL(url); // 创建blob地址
    }
    var aLink = document.createElement('a');
    aLink.href = url;
    // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，file:///模式下不会生效
    aLink.download = saveName || '';
    var event;
    if (window.MouseEvent) {
        event = new MouseEvent('click');
    } else {
        event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    }
    aLink.dispatchEvent(event);
}