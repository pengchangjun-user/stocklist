import { sortByNumber } from './common'
const {
    remote
} = window.require("electron")
const fs = window.require('fs')


/**
 * 管理文件存储
 *
 * 数据存储目录userData\data\
 *
 * holder：     证券持有人名册目录t1 t2 t3  例子：userData\data\holder\20181031\t16000000320181031all.a30
 * credit:      信用股东数据目录t5          例子：userData\data\credit\20181031\t56000000320181031all.a30
 */
const DATE_DIR = "\\data\\"; // 数据根目录
const HOLDER_DIR = "holder\\"; // t1 t2 t3文件目录
const CREDIT_DIR = "credit\\"; // t5文件目录
const GROUP = "group\\" //分组数据


/**
 * 获取数据存储目录，目录不存在则创建
 * @returns {string}
 */
export function getDataDir() {
    let path = remote.app.getPath('userData') + DATE_DIR;
    if (fs.existsSync(path)) {
        return path;
    } else {
        fs.mkdirSync(path);
        return path;
    }
}

/**
 * 判断某一期的文件是否存在
 * @param fileInfo
 * @return {boolean}
 */
export function isPeriodExist(fileInfo) {
    let path = null;
    if (fileInfo.file_type === 't5') {
        path = getCreditFilePath(fileInfo.period, false);
    } else {
        path = getHolderFilePath(fileInfo.period, false);
    }
    return path != null;
}

/**
 * 获取指定期数的证券持有人名册目录t5，目录不存在则创建
 * @param period 指定期数，不指定则返回根目录
 * return 目录
 */
function getCreditDir(period) {
    // 获取credit目录
    let creditDirPath = getDataDir() + CREDIT_DIR;
    if (!fs.existsSync(creditDirPath)) {
        fs.mkdirSync(creditDirPath);
    }
    if (period) {
        let path = creditDirPath + period + "\\";
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        return path;
    } else {
        return creditDirPath;
    }
}

/**
 * 获取所有t1 t2 t3文件的期数
 * @return string[]
 */
export function getAllHolderPeriod() {
    let path = getHolderDir(null);
    return fs.readdirSync(path);
}

/**
 * 获取所有t5文件的期数
 * @return string[]
 */
export function getAllCreditPeriod() {
    let path = getCreditDir(null);
    return fs.readdirSync(path);
}

/**
 * 获取所有期数，包括所有文件(t123+t5)
 * @return {any[]}
 */
export function getAllPeriod() {
    // 使用set,是为了去重
    let set = new Set();
    getAllHolderPeriod().forEach(function (p) {
        if (p.indexOf('.') == -1) {
            let path = getHolderDir(p);
            let files = fs.readdirSync(path);
            // 排除空的文件
            if (files.length > 1) {
                set.add(p);
            }
        }
    });
    getAllCreditPeriod().forEach(function (p) {
        if (p.indexOf('.') == -1) {
            let path = getCreditDir(p);
            let files = fs.readdirSync(path);
            if (files.length > 1) {
                set.add(p);
            }
        }
    });
    // Array.from把set转化为数组
    let arr = Array.from(set);
    return arr.sort(sortByNumber);
}


/**
 * 获取指定期数的证券持有人名册目录t1 t2 t3，目录不存在则创建
 * @param period 指定期数，不指定则返回根目录
 * return 目录
 */
function getHolderDir(period) {
    // 获取holder目录
    let holderDirPath = getDataDir() + HOLDER_DIR;
    if (!fs.existsSync(holderDirPath)) {
        fs.mkdirSync(holderDirPath);
    }
    if (period) {
        // 如果指定期数，则获取指定期数目录
        let path = holderDirPath + period + "\\";
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        return path;
    } else {
        return holderDirPath;
    }
}

/**
 * 获取指定期数的证券持有人名册文件t1 t2 t3
 * @param period 指定要某一期的文件，如20181031
 * @param isResult 是否获取分析结果文件 xxx.json
 * return 文件路径或解析后的json
 */
export function getHolderFilePath(period, isResult) {
    let path = getHolderDir(period);
    let files = fs.readdirSync(path);
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let suffixIndex = file.lastIndexOf('.');
        let suffix = file.substr(suffixIndex + 1);
        if (isResult == false) {
            if (suffix === 'xls' || suffix === 'xlsx') {
                return file;
            }
        } else {
            if (file === 'result.json') {
                let data = fs.readFileSync(path + file);
                return JSON.parse(data);
            }
        }
    }
    // 如果是个空文件夹，就返回null
    return null;
}

/**
 * 获取指定期数的证券持有人名册文件t5  如果没有t5文件，那么就从t3文件中取
 * @param period 指定要某一期的文件，如20181031
 * @param isResult 是否获取分析结果文件 xxx.json
 * @return
 */
export function getCreditFilePath(period, isResult, not3 = false) {
    // 如果导入了信用账户数据，从信用账户数据中取
    let path = getCreditDir(period);
    // 返回指定目录下所有文件的名称
    let files = fs.readdirSync(path);
    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let suffixIndex = file.lastIndexOf('.');
        let suffix = file.substr(suffixIndex + 1);
        if (isResult == false) {
            if (suffix === 'xls' || suffix === 'xlsx') {
                return file;
            }
        } else {
            if (suffix === 'json') {
                let data = fs.readFileSync(path + file);
                return JSON.parse(data);
            }
        }
    }
    // 没有t5信用股东的数据 取T3文件中信用股东数据
    if (isResult && !not3) {
        let ret = getHolderFilePath(period, isResult);
        if (ret && ret.recorders) {
            let recorders = ret.recorders.filter((item) => {
                return item.credit_account
            })
            if (recorders.length > 0) {
                let result = {
                    recorders: recorders
                };
                result.personal_account = 0;
                result.org_account = 0;
                result.personal_amount = 0;
                result.org_amount = 0;
                result.credit_amount = ret.credit_amount;
                result.credit_account = ret.credit_account;
                for (let i = 0; i < recorders.length; i++) {
                    const recorder = recorders[i];
                    if (recorder.holder_type.toString()[0] == '1') {
                        result.personal_account++;
                        result.personal_amount += recorder.credit_amount;
                    } else {
                        result.org_account++;
                        result.org_amount += recorder.credit_amount;
                    }
                }
                return result
            }
        }
    }
    return null;
}

/**
 * 获取分组数据目录不存在则创建
 * return 目录
 */
function getGroupDir() {
    // 获取holder目录
    let groupDirPath = getDataDir() + GROUP;
    if (!fs.existsSync(groupDirPath)) {
        fs.mkdirSync(groupDirPath);
    }
    return groupDirPath;
}

/**
 * 写入分组数据
 * @param period 指定要某一期的文件，如20181031
 * @param result 要写入的JSON
 * return 文件路径或解析后的json
 */
export function setGroupFilePath(result) {
    let path = getGroupDir();
    fs.writeFileSync(path + 'group.json', JSON.stringify(result));
    return null;
}

/**
 * 读取分组数据
 * @param period 指定要某一期的文件，如20181031
 * @param result 要写入的JSON
 * return 文件路径或解析后的json
 */
export function getGroupFilePath() {
    let path = getGroupDir();
    let data = null;
    if (fs.existsSync(path + 'group.json')) {
        data = fs.readFileSync(path + 'group.json');
    }
    return data;
}

/**
 * 写入控股股东数据
 * @param period 指定要某一期的文件，如20181031
 * @param result 要写入的JSON
 * return 文件路径或解析后的json
 */
export function setControlFilePath(period, result) {
    let path = getHolderDir(period);
    fs.writeFileSync(path + 'control.json', JSON.stringify(result));
    return null;
}

/**
 * 读取控股股东数据
 * @param period 指定要某一期的文件，如20181031
 * return 文件路径或解析后的json
 */
export function getControlFilePath(period) {
    let path = getHolderDir(period);
    let data = null;
    if (fs.existsSync(path + 'control.json')) {
        data = fs.readFileSync(path + 'control.json');
    }
    return data;
}



/**
 * 导入t1 t2 t3 t5文件和结果
 * @param fileInfo
 * @param result
 */
export function importFileAndResult(fileInfo, result, callback) {
    if (fileInfo.file_type === 't5') {
        // t5
        if (isPeriodExist({
                period: fileInfo.period || result.period,
                file_type: 't5'
            })) {
            callback && callback(new Error('不能重复导入，请删除旧文件!'))
        } else {
            // 如果不存在则创建
            let creditPath = getCreditDir(fileInfo.period || result.period);
            // 拷贝一份文件
            fs.copyFileSync(fileInfo.path, creditPath + fileInfo.filename);
            result.path = creditPath + fileInfo.filename;
            // 把结果写到result.json文件中
            fs.writeFileSync(creditPath + 'result.json', JSON.stringify(result));
            callback && callback(null)
        }
    } else {
        if (isPeriodExist({
                period: fileInfo.period || result.period
            })) {
            callback && callback(new Error('不能重复导入，请删除旧文件!'))
        } else {
            let holderPath = getHolderDir(fileInfo.period || result.period);
            fs.copyFileSync(fileInfo.path, holderPath + fileInfo.filename);
            result.path = holderPath + fileInfo.filename;
            fs.writeFileSync(holderPath + 'result.json', JSON.stringify(result));
            callback && callback(null)
        }
    }
}



/**
 * 文件名解析 fileInfo
 * @param path
 * @returns
 * fileInfo
 * {
 *   market_type: 'sz' 'sh'   市场：深交所文件、上交所文件
 *   path:                    文件路径
 * filename: *,             文件名
 * file_type: string,       文件种类：t1 t2 t3 t5
 *
 * ----------------------以下是上交所文件可以分析出来的结果
 * code: string,            股票代码
 * circulate_type: string, 证券类型：03为非限售流通股 05为限售流通股
 * period: string,          期数，如20160831
 * other: string,           其他：如all t100 t200
 * suffix: string           文件后缀名b30 导入日期 b30代表11月30日
 * }
 */
export function parseFileName(path) {
    if (typeof (path) === 'undefined' || path == null || path.length < 1) {
        console.warn('parseFileName', path);
        return null;
    }

    try {
        let result = {};
        let filename = path.substr(path.lastIndexOf('\\') + 1);
        result.path = path;
        result.filename = filename;
        // 处理深交所文件
        switch (filename) {
            case '前N名证券持有人名册.xlsx':
                // t2
                result.market_type = 'sz';
                result.file_type = 't2';
                break;
            case '合并普通账户和融资融券信用账户前N名明细数据表.xlsx':
                // t3
                result.market_type = 'sz';
                result.file_type = 't3';
                break;
            case '融资融券和转融通担保证券账户明细数据表.xlsx':
                // t5
                result.market_type = 'sz';
                result.file_type = 't5';
                break;
            default:
                result.market_type = 'sh';
                break;
        }

        if (result.market_type !== 'sz') {
            result.file_type = filename.substr(0, 2);
            result.code = filename.substr(2, 6);
            if (result.file_type === 't5') {
                result.period = filename.substr(8, 8);
            } else {
                result.circulate_type = filename.substr(8, 2);
                result.period = filename.substr(10, 8);
            }

            let dotIndex = filename.lastIndexOf('.');
            result.suffix = filename.substr(dotIndex);
            if (dotIndex > 18) {
                result.other = filename.substr(18, dotIndex - 18);
            }
        }
        return result;
    } catch (e) {
        console.warn('parseFileName', e)
        return {};
    }
}

/**
 * 是否是有效股东名册文件
 * @param fileInfo
 * @return {boolean}
 */
export function isValidFile(fileInfo) {
    if (fileInfo.file_type !== 't1' && fileInfo.file_type !== 't2' && fileInfo.file_type !== 't3' && fileInfo.file_type !== 't4' && fileInfo.file_type !== 't5') {
        return false;
    }
    return true;
}

/**
 * 获取详细数据 + 普通股数量 + 信用股数量  
 * @param periods 期数数组
 * @returns
 */
export function getAllData(periods) {
    let data = {};
    let hasNormalData = true;
    for (let i = 0; i < periods.length; i++) {
        let period = periods[i];
        data[period] = [];
        let holderData = getHolderFilePath(period, true);
        let creditData = getCreditFilePath(period, true);
        if (holderData && holderData.recorders) {
            for (let j = 0; j < holderData.recorders.length; j++) {
                let record = holderData.recorders[j];
                let item = Object.assign({}, record);
                data[period].push(item);
            }
        }
        // 没有普通账户数据
        if (data[period].length == 0) {
            hasNormalData = false;
        } else {
            hasNormalData = true;
        }
        if (creditData && creditData.recorders) {
            for (let j = 0; j < creditData.recorders.length; j++) {
                let record = creditData.recorders[j];
                if (!hasNormalData) {
                    let item = Object.assign({}, record);
                    data[period].push(item);
                } else {
                    for (let n = 0; n < data[period].length; n++) {
                        let p = data[period][n];
                        // 通过证件号码来匹配上对应的股东，然后把信用账号数据加入进去
                        // 如果是t3文件，则不必把信用数据加进去
                        if (!p.file_type) {
                            if (p.id_number == record.id_number) {
                                data[period][n].credit_account = record.credit_account;
                                data[period][n].credit_amount = record.credit_amount;
                            }
                        }
                    }
                }
            }
        }
    }
    return Object.keys(data).length > 0 ? data : null
}

/**
 * 获取某个股东的详细数据
 * @param periods 期数数组
 * @param id_numbers 通过股东的证件账号数组, 来获取相关数据
 * @returns
 */
export function getAllDataByAccount(periods, id_numbers) {
    let data = {};
    let hasNormalData = true;
    for (let i = 0; i < periods.length; i++) {
        let period = periods[i];
        data[period] = [];
        let holderData = getHolderFilePath(period, true);
        let creditData = getCreditFilePath(period, true);
        if (holderData && holderData.recorders) {
            for (let j = 0; j < holderData.recorders.length; j++) {
                let record = holderData.recorders[j];
                let item = {}
                if (id_numbers.indexOf(record.id_number) > -1) {
                    item = Object.assign({}, record);
                    data[period].push(item);
                }
            }
        }
        // 没有普通账户数据
        if (data[period].length == 0) {
            hasNormalData = false
        } else {
            hasNormalData = true;
        }
        if (creditData && creditData.recorders) {
            for (let j = 0; j < creditData.recorders.length; j++) {
                let record = creditData.recorders[j];
                if (!hasNormalData) {
                    if (id_numbers.indexOf(record.id_number) > -1) {
                        let item = Object.assign({}, record);
                        data[period].push(item);
                    }
                } else {
                    for (let n = 0; n < data[period].length; n++) {
                        let p = data[period][n];
                        if (p.id_number == record.id_number) {
                            data[period][n].credit_account = record.credit_account;
                            data[period][n].credit_amount = record.credit_amount;
                        }
                    }
                }
            }
        }
    }
    return Object.keys(data).length > 0 ? data : null
}


