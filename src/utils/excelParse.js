

import * as Const from './const'
import appGlobal from '../global/global'
const XLSX = window.require("xlsx")
const path = window.require("path")

/**
 * 导入股东性质的基础数据
 * @param {*} path  
 */

export function parseCharacterFile(path, callback) {
    try {
        const workbook = XLSX.readFile(path, {
            type: 'binary'
        });
        let characterObj = {
            personal: {
                // 牛散
                niusan: new Map(),
                // 个人
                person: new Map()
            },
            org: {
                // 证金公司
                goldenCompany: new Map(),
                // 社保基金
                socialSecurityFund: new Map(),
                // QFII
                afii: new Map(),
                // 一般机构法人
                generalInstitution: new Map(),
                // 信托产品
                trustProducts: new Map(),
                // 证券投资基金
                securitiesInvestmentFund: new Map(),
                // 所有的基金， 如果证券投资基金找不到，就到基金里面去找
                fund: new Map()
            }
        }
        // 获取Excel中所有表名
        const sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2']
        for(let i = 0; i < sheetNames.length; ++i) {
            const worksheet = workbook.Sheets[sheetNames[i]];
            let sheetDataArr = XLSX.utils.sheet_to_json(worksheet, {
                header: "A"
            })
            switch(sheetNames[i]) {
                case "牛散":
                    for(let j = 0; j < sheetDataArr.length; ++j) {
                        characterObj.personal.niusan.set(sheetDataArr[j].A, `${sheetNames[i]}###1001`)
                    }
                    break;
                case "个人":
                    for(let j = 0; j < sheetDataArr.length; ++j) {
                        characterObj.personal.person.set(sheetDataArr[j].A, `${sheetNames[i]}###1000`)
                    }
                    break;
                case "社保基金":
                    for(let j = 0; j < sheetDataArr.length; ++j) {
                        characterObj.org.socialSecurityFund.set(sheetDataArr[j].A, `${sheetNames[i]}&&&${sheetNames[i]}###2001`)
                    }
                    break;
                case "证金公司":
                    for(let j = 1; j < sheetDataArr.length; ++j) {
                        characterObj.org.goldenCompany.set(sheetDataArr[j].A, `${sheetNames[i]}&&&${sheetNames[i]}###2002`)
                    }
                    break;
                case "QFII":
                    for(let j = 1; j < sheetDataArr.length; ++j) {
                        characterObj.org.afii.set(sheetDataArr[j].A, `${sheetNames[i]}&&&${sheetNames[i]}###2003`)
                    }
                    break;
                case "一般机构法人":
                    for(let j = 1; j < sheetDataArr.length; ++j) {
                        characterObj.org.generalInstitution.set(sheetDataArr[j].B, `${sheetNames[i]}&&&${sheetNames[i]}###2004`)
                    }
                    break;
                case "信托产品":
                    for(let j = 1; j < sheetDataArr.length; ++j) {
                        characterObj.org.trustProducts.set(sheetDataArr[j].A, `${sheetNames[i]}&&&${sheetDataArr[j].B}###2005`)
                    }
                    break;
                case "证券投资基金":
                    for(let j = 1; j < sheetDataArr.length; ++j) {
                        characterObj.org.securitiesInvestmentFund.set(sheetDataArr[j].C, `${sheetNames[i]}&&&${sheetDataArr[j].E}###2006`)
                    }
                    break;
                case "基金":
                    for(let j = 1; j < sheetDataArr.length; ++j) {
                        characterObj.org.fund.set(sheetDataArr[j].C, `${sheetNames[i]}&&&${sheetDataArr[j].D}###2007`)
                    }
                    break;

            }
        }
        callback(null, characterObj)
        console.log("characterPersonalMap", characterObj)
    } catch(err) {
        callback(err, null)
    }
}

/**
 * 找出股东属于哪一个性质
 * @param {*} name 要找出的股东名称
 * @param {*} type 股东类别，1--个人  2--机构， 先根据这一个标准先把个人和机构筛选出来
 * @param {*} manager 是否获取管理人
 */

export function findWhichCharacter(type, name, manager = false) {
    let dataType;
    let lastI;
    if (type === "1") {
        dataType = "personal"
        lastI = 2
    } else {
        dataType = "org"
        lastI = 7
    }
    let dataMap = appGlobal.characterObj[dataType]
    let i = 0
    for (const childKey in dataMap) {
        if (dataMap.hasOwnProperty(childKey)) {
            i++
            if (dataMap[childKey].has(name)) {
                if (!manager) {
                    return dataMap[childKey].get(name).split("###")[1]
                } else {
                    return dataMap[childKey].get(name).split("&&&")[1].split("###")[0]
                }
            }
            if (i === lastI) {
                if (!manager) {
                    return type === "1" ?  '1000' : "2000"
                } else {
                    return null
                }
            }
        }
    }
}

/**
 * 分析t1 t2 t3文件
 * @param fileInfo
 * @param callback(error, progress, result)
 */
export function parseT1235File(fileInfo, callback) {
    // 进度条
    // callback(null, 5, null);
    // 正式环境
    let url = './resources/public/stockCharacter.xlsx'
    if (!appGlobal.readCharacterFlag) {
        // 测试环境
        // let url = path.resolve() + '\\public\\stockCharacter.xlsx'
        parseCharacterFile(url, (err, result) => {
            if (err) {
                callback(err, 100, null)
                return
            }
            appGlobal.characterObj = result
            appGlobal.readCharacterFlag = 1
        })
    }
    // callback(null, 80, null);
    // console.log("appGlobal", appGlobal)
    try {
        // 读取Excel
        const workbook = XLSX.readFile(fileInfo.path, {
            type: 'binary'
        });
        // 获取Excel中所有表名
        const sheetNames = workbook.SheetNames; // 返回 ['sheet1', 'sheet2']
        // 获取第一张表对象
        const worksheet = workbook.Sheets[sheetNames[0]];
        // callback(null, 10, null);
        let result = {};
        switch (fileInfo.file_type) {
            case 't1':
                if (fileInfo.market_type === Const.MARKET_TYPE_SZ) {
                    result = createSZT12Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                } else {
                    result = createSHT1Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                }
                break;
            case 't2':
                if (fileInfo.market_type === Const.MARKET_TYPE_SZ) {
                    result = createSZT12Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                } else {
                    result = createSHT2Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                }
                break;
            case 't3':
                if (fileInfo.market_type === Const.MARKET_TYPE_SZ) {
                    result = createSZT3Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                } else {
                    result = createSHT3Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                }
                break;
            case 't5':
                if (fileInfo.market_type === Const.MARKET_TYPE_SZ) {
                    result = createSZT5Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                } else {
                    result = createSHT5Obj(XLSX.utils.sheet_to_json(worksheet, {
                        header: "A"
                    }));
                }
                break;
            default:
                break;
        }
        result.filename = fileInfo.filename;
        result.period = fileInfo.period;
        result.file_type = fileInfo.file_type;
        // 把解析结果传递出去
        callback(null, 100, result);
    } catch (err) {
        callback(err, 100, null)
    }

}

function createSHT1Obj(dataArray) {
    let result = {
        recorders: [],
        company_name: dataArray[2].A.split("：")[1] || ""
    };
    // 如果A的值是文字，那么表明这一行是有用的，如果不是文字，而且B的值为空，那么表面这一行是没用的数据
    for(let obj of dataArray) {
        if (!isNaN(obj.A) && obj.B) {
            // A列为序号
            let recorder = {};
            recorder.index = obj.A; // 序号
            recorder.holder_name = obj.B; // 持有人名称
            recorder.account_number = obj.C; // 一码通账户号码
            recorder.normal_account = obj.D; // 证券账户号码
            recorder.id_number = obj.E; // 证件号码
            recorder.holder_type = findWhichCharacter(String(obj.J).charAt(0), obj.B); // 持有人类别
            recorder.holder_amount = parseInt(obj.K); // 持有数量
            recorder.holder_ratio = obj.L; // 持有比例（%）
            recorder.pledge_amount = obj.M; // 质押/冻结总数
            recorder.address = obj.N; // 通讯地址
            recorder.phone = obj.O; // 联系电话
            recorder.postal_code = obj.P; // 邮政编码
            recorder.confirm_relation = obj.S; // 关联关系是否确认
            recorder.remark = obj.T; // 备注
            result.recorders.push(recorder);
        } else {
            if (obj.A) {
                if (obj.A.includes("证券总数量：")) {
                    result.total_amount = parseInt(obj.A.split("：")[1]); // 证券总数量
                    result.personal_amount = parseInt(obj.I.split("：")[1]); // 其中个人持有合计
                    result.org_amount = parseInt(obj.R.split("：")[1]); //  机构持有合计
                }
                if (obj.A.includes("总户数：")) {
                    result.total_account = parseInt(obj.A.split("：")[1]); // 总户数
                    result.personal_account = parseInt(obj.I.split("：")[1]); // 其中个人户数合计
                    result.org_account = parseInt(obj.R.split("：")[1]); // 机构户数合计
                }
            }
        }
    }
    result.credit_amount = 0; // 信用持有合计
    result.credit_account = 0; 
    return result;
}

function createSHT2Obj(dataArray) {
    let result = {
        recorders: [],
        company_name: dataArray[1].D || ""
    };
    for (let obj of dataArray) {
        // isNaN判断是否是非数字
        if (!isNaN(obj.A)) {
            if (parseInt(obj.A) == 801) {
                let recorder = {};
                recorder.index = obj.B; // 序号
                recorder.holder_name = obj.F; // 持有人名称
                recorder.account_number = obj.G; // 一码通账户号码
                recorder.normal_account = obj.H; // 证券账户号码
                recorder.id_number = obj.I; // 证件号码
                recorder.holder_type = findWhichCharacter(String(obj.J).charAt(0), obj.F); // 持有人类别
                recorder.holder_amount = parseInt(obj.K); // 持有数量
                recorder.holder_ratio = obj.L; // 持有比例（%）
                recorder.pledge_amount = parseInt(obj.M); // 质押/冻结总数
                recorder.address = obj.N; // 通讯地址
                recorder.phone = obj.O; // 联系电话
                recorder.postal_code = obj.P; // 邮政编码
                recorder.confirm_relation = obj.Q; // 关联关系是否确认
                result.recorders.push(recorder);
            } else if (parseInt(obj.A) == 802) {
                // 802是统计的数据
                result.total_amount = parseInt(obj.R); // 证券总数量
                result.personal_amount = parseInt(obj.S); // 其中个人持有合计
                result.org_amount = parseInt(obj.T); //  机构持有合计
                result.total_account = parseInt(obj.U); // 总户数
                result.personal_account = parseInt(obj.V); // 其中个人户数合计
                result.org_account = parseInt(obj.W); // 机构户数合计
                result.credit_amount = 0; // 信用持有合计
                result.credit_account = 0;
            }
        }
    }
    return result;
}

function createSHT3Obj(dataArray) {
    let result = {
        recorders: [],
        company_name: dataArray[1].D || ""
    };
    result.personal_account = 0;  // 其中个人户数合计
    result.org_account = 0; 
    result.personal_amount = 0;  // 其中个人持有合计
    result.org_amount = 0;
    result.credit_amount = 0; // 信用持有合计
    result.credit_account = 0;
    for (let obj of dataArray) {
        if (!isNaN(obj.A)) {
            if (parseInt(obj.A) == 801) {
                let recorder = {};
                recorder.index = obj.B; // 序号
                recorder.holder_name = obj.F; // 持有人名称
                recorder.account_number = obj.G; // 一码通账户号码
                recorder.id_number = obj.H; // 证件号码
                recorder.holder_type = findWhichCharacter(String(obj.I).charAt(0), obj.F); // 持有人类别
                recorder.holder_amount = parseInt(obj.J); // 总持有数量
                // 如果是自然人
                if (recorder.holder_type.toString()[0] == '1') {
                    result.personal_account++;
                    result.personal_amount += recorder.holder_amount;
                } else {
                    // 否则是机构
                    result.org_account++;
                    result.org_amount += recorder.holder_amount;
                }
                recorder.holder_ratio = obj.K; // 持有比例（%）
                recorder.normal_account = obj.L; // 普通证券账户号码
                recorder.normal_amount = parseInt(obj.M); // 普通证券账户持有数量
                recorder.credit_account = obj.N; // 投资者信用证券账户号码
                recorder.credit_amount = parseInt(obj.O); // 投资者信用证券账户持有数量
                if (recorder.credit_amount) {
                    result.credit_amount += recorder.credit_amount;
                    result.credit_account++;
                }
                recorder.pledge_amount = parseInt(obj.P); // 质押/冻结总数
                recorder.address = obj.Q; // 通讯地址
                recorder.phone = obj.R; // 联系电话
                recorder.postal_code = obj.S; // 邮政编码
                recorder.confirm_relation = obj.T; // 关联关系是否确认
                recorder.remark = obj.X; // 备注
                // 加一个特殊标志，来表示这是一个t3文件，即既有普通数据，又有信用数据
                recorder.file_type = "t3";
                result.recorders.push(recorder);
            } else if (parseInt(obj.A) == 802) {
                result.total_amount = parseInt(obj.U); // 证券总数量
                result.total_account = parseInt(obj.V); // 持有人账户总数
            }
        }
    }
    return result;
}

/**
 * 创建上海t5文件对象
 * @param dataArray
 * @return {{recorders: Array}}
 */
function createSHT5Obj(dataArray) {
    // console.log('createSHT5Obj', dataArray);
    let result = {
        recorders: [],
        company_name: dataArray[1].D || ""
    };
    result.credit_amount = 0; // 信用持有合计
    result.credit_account = 0;
    result.personal_amount = 0; // 个人持有数量
    result.personal_account = 0; // 个人账户数
    result.org_amount = 0; // 机构持有数量
    result.org_account = 0; // 机构账户数
    result.total_amount = 0; // 证券总数量
    result.total_account = 0; // 持有人账户总数
    for (let obj of dataArray) {
        if (!isNaN(obj.A)) {
            if (parseInt(obj.A) == 801) {
                let recorder = {};
                recorder.index = obj.B; // 序号
                recorder.holder_name = obj.L; // 持有人名称
                recorder.id_number = obj.Q; // 证件号码
                recorder.holder_type = obj.P === "机构" ? "2000" : "1000"; // 持有人类别
                recorder.credit_account = obj.M; // 投资者信用证券账户号码
                recorder.credit_amount = parseInt(obj.N); // 投资者信用证券账户持有数量
                recorder.pledge_amount = parseInt(obj.O); // 质押/冻结总数
                recorder.address = obj.R; // 通讯地址
                if (recorder.credit_account) {
                    result.credit_account++;
                    result.credit_amount += recorder.credit_amount;
                }
                result.recorders.push(recorder);
            }
        }
    }
    // console.log('createSHT5Obj result', result);
    return result;
}

/**
 * 生成深圳市场t123文件的对象
 *  recorders: [{
 *  index,                    序号
 *  holder_name,              持有人名称
 *  account_number,           一码通账户号码
 *  normal_account;           // 证券账户号码     / 普通证券账户号码
 *  id_number = obj[k];       // 证件号码
 *  holder_type = obj[k];     // 持有人类别
 *  holder_amount = obj[k];   // 持有数量         / 普通证券账户持有数量
 *  holder_ratio = obj[k];    // 持有比例（%）
 *
 *  credit_account;           // 投资者信用证券账户号码
 *  credit_amount;            // 投资者信用证券账户持有数量
 *
 *  pledge_amount = obj[k];   // 质押/冻结总数
 *  address = obj[k];         // 通讯地址
 *  phone = obj[k];           // 联系电话
 *  postal_code = obj[k];     // 邮政编码
 *  confirm_relation = obj[k]; // 关联关系是否确认
 *  remark = obj[k];           // 备注
 *  }]
 *
 *  total_amount = obj.D;       股票总数量
 *  personal_amount = obj.K;    个人持有量
 *  org_amount = obj.R;         机构持有量
 *
 *  total_account = obj.D;      总账户数
 *  personal_account = obj.K;   个人账户数
 *  org_account = obj.R;        机构账户数
 * @param dataArray
 * @return {{recorders: Array}}
 */
function createSZT12Obj(dataArray) {
    console.log("createSZT12Obj", dataArray)
    let result = {
        recorders: [],
        company_name: dataArray[1].C || ""
    };
    for (let obj of dataArray) {
        if (!isNaN(obj.A) && obj.B) {
            // A列为序号
            let recorder = {};
            recorder.index = obj.A; // 序号
            recorder.holder_name = obj.B; // 持有人名称
            recorder.account_number = obj.D; // 一码通账户号码
            recorder.normal_account = obj.E; // 证券账户号码
            recorder.id_number = obj.F; // 证件号码
            // recorder.holder_type = obj.H; // 持有人类别
            recorder.holder_type = findWhichCharacter(String(obj.H).charAt(0), obj.B); // 持有人类别
            recorder.holder_amount = parseInt(obj.J); // 持有数量
            recorder.holder_ratio = obj.K; // 持有比例（%）
            recorder.pledge_amount = obj.L; // 质押/冻结总数
            recorder.address = obj.O; // 通讯地址
            recorder.phone = obj.Q; // 联系电话
            recorder.postal_code = obj.R; // 邮政编码
            recorder.confirm_relation = obj.S; // 关联关系是否确认
            recorder.remark = obj.T; // 备注
            result.recorders.push(recorder);
        } else {
            switch (obj.A) {
                case '证券总数量：':
                    result.total_amount = parseInt(obj.D.toString().replace(',', ''));
                    result.personal_amount = parseInt(obj.K.toString().replace(',', ''));
                    result.org_amount = parseInt(obj.R.toString().replace(',', ''));
                    break;
                case '总户数：':
                    result.total_account = parseInt(obj.D.toString().replace(',', ''));
                    result.personal_account = parseInt(obj.K.toString().replace(',', ''));
                    result.org_account = parseInt(obj.R.toString().replace(',', ''));
                    break;
                case '证券简称：':
                    let date = new Date(1900, 0, obj.P - 1);
                    result.period = date.format('yyyyMMdd'); // 2018-10-31 转换成20181031
                    break;
                default:
                    break;
            }
        }
    }
    result.credit_amount = 0;
    result.credit_account = 0;

    console.log("createSZT12Obj", result);
    return result;
}

/**
 * 生成深圳t3文件的对象
 * @param dataArray
 * @return {{recorders: Array}}
 */
function createSZT3Obj(dataArray) {
    console.log('createSZT3Obj dataArray', dataArray);
    let result = {
        recorders: [],
        company_name: dataArray[1].J || ""
    };
    result.personal_account = 0;
    result.org_account = 0;
    result.personal_amount = 0;
    result.org_amount = 0;
    result.credit_amount = 0;
    result.credit_account = 0;
    for (let obj of dataArray) {
        if (!isNaN(obj.A) && obj.B && obj.C) {
            let recorder = {};
            recorder.index = obj.A; // 序号
            recorder.holder_name = obj.B; // 持有人名称
            recorder.account_number = obj.C; // 一码通账户号码
            recorder.id_number = obj.D; // 证件号码
            // recorder.holder_type = obj.E; // 持有人类别
            recorder.holder_type = findWhichCharacter(String(obj.E).charAt(0), obj.B); // 持有人类别
            recorder.holder_amount = obj.F; // 持有数量
            recorder.holder_ratio = obj.H; // 持有比例（%）
            recorder.normal_account = obj.I; // 普通证券账户号码
            recorder.normal_amount = obj.K; // 普通证券账户持有数量
            recorder.credit_account = obj.L; // 投资者信用证券账户号码
            recorder.credit_amount = obj.M; // 投资者信用证券账户持有数量
            recorder.pledge_amount = obj.O; // 质押/冻结总数
            // 加一个特殊标志，来表示这是一个t3文件，即既有普通数据，又有信用数据
            recorder.file_type = "t3";
            // 个人
            if (recorder.holder_type.toString()[0] == '1') {
                result.personal_account++;
                result.personal_amount += recorder.holder_amount;
            } else {
                // 机构
                result.org_account++;
                result.org_amount += recorder.holder_amount;
            }
            if (recorder.credit_account && recorder.credit_amount) {
                result.credit_amount += recorder.credit_amount;
                result.credit_account++;
            }

            recorder.address = obj.Q; // 通讯地址
            recorder.phone = obj.S; // 联系电话
            recorder.postal_code = obj.T; // 邮政编码
            recorder.confirm_relation = obj.U; // 关联关系是否确认
            recorder.remark = obj.V; // 备注
            result.recorders.push(recorder);
        } else {
            if (obj.A) {
                if (obj.A.toString().indexOf('证券总数量：') != -1) {
                    let colonIndex = obj.A.indexOf('：');
                    let num_str = obj.A.substr(colonIndex + 1, obj.A.length - colonIndex - 1);
                    result.total_amount = parseInt(num_str.replace(/,/g, ''));
                } else if (obj.A.toString().indexOf('持有人数（已合并）') != -1) {
                    let colonIndex = obj.A.indexOf('：');
                    let num_str = obj.A.substr(colonIndex + 1, obj.A.length - colonIndex - 1);
                    result.total_account = parseInt(num_str.replace(/,/g, ''));
                } else if (obj.A.toString().indexOf('证券代码：') != -1) {
                    let date = new Date(1900, 0, obj.R - 1);
                    result.period = date.format('yyyyMMdd');
                }
            }
        }
    }
    console.log('createSZT3Obj result', result);
    return result;
}

/**
 * 生成深圳t5文件对象
 * @param dataArray
 * @return {{recorders: Array}}
 */
function createSZT5Obj(dataArray) {
    console.log('createSZT5Obj', dataArray);
    let result = {
        recorders: [],
        company_name: dataArray[1].D || ""
    };
    result.total_amount = 0; // 证券总数量
    result.personal_amount = 0; // 个人持有数量
    result.org_amount = 0; // 机构持有数量
    result.total_account = 0; // 持有人账户总数
    result.personal_account = 0; // 个人账户数
    result.org_account = 0; // 机构账户数
    for (let obj of dataArray) {
        if (!isNaN(obj.A) && obj.F && obj.P) {
            let recorder = {};
            recorder.index = obj.A; // 序号
            recorder.holder_name = obj.F; // 持有人名称
            recorder.id_number = obj.P; // 证件号码
            recorder.holder_type = obj.N === "机构" ? "2000" : "1000"; // 持有人类别
            recorder.credit_account = obj.H; // 投资者信用证券账户号码
            recorder.credit_amount = obj.J; // 投资者信用证券账户持有数量
            recorder.pledge_amount = obj.K; // 质押/冻结总数
            if (recorder.credit_account) {
                result.total_account++; // 持有人账户总数
                result.total_amount += parseInt(recorder.credit_amount); // 持有人账户总数
            }
            if (recorder.holder_type == '个人') {
                result.personal_account++;
                result.personal_amount += parseInt(recorder.credit_amount); // 持有人账户总数
            } else {
                result.org_account++;
                result.org_amount += parseInt(recorder.credit_amount); // 持有人账户总数
            }
            recorder.address = obj.Q; // 通讯地址
            result.recorders.push(recorder);
        } else {
            if (obj.A && obj.A.toString().indexOf('证券简称：') != -1) {
                let date = new Date(1900, 0, obj.O - 1);
                result.period = date.format('yyyyMMdd');
            }
        }
    }
    console.log('createSZT5Obj result', result);
    return result;
}


Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, //month
        "d+": this.getDate(), //day
        "h+": this.getHours(), //hour
        "m+": this.getMinutes(), //minute
        "s+": this.getSeconds(), //second
        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
        "S": this.getMilliseconds() //millisecond
    };
    if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return format;
};